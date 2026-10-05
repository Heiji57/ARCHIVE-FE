import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { RecurrenceRule } from "@/entities/todo/model/types";
import {
  buildRecurrencePresets,
  formatRecurrenceRule,
  sameRecurrenceRule,
} from "@/entities/todo/lib/recurrence";
import { useTranslation } from "@/shared/lib/i18n";
import { RecurrenceCustomDialog } from "./RecurrenceCustomDialog";

export interface RecurrencePopoverProps {
  /** 기준일(시작일) — 프리셋 문구("매주 수요일", "매월 첫 번째 수요일" …)가 여기서 계산된다. */
  dateKey: string;
  /** 현재 규칙. null = 반복 안함(또는 알 수 없음). */
  value: RecurrenceRule | null;
  /**
   * 확정 콜백 — 프리셋 항목 클릭, 또는 맞춤 모달의 "완료" 때만 호출된다.
   * 바깥 클릭·Esc·맞춤 모달 취소는 onClose 만 호출하고 아무 것도 바꾸지 않는다.
   */
  onSelect: (rule: RecurrenceRule | null) => void;
  onClose: () => void;
  /**
   * "반복 안함" 항목 표시 여부 (기본 true).
   * 이미 반복 중인 시리즈의 규칙 변경(scope: following) 컨텍스트에서는 false 로 숨긴다 —
   * 서버가 following 스코프에서 recurrenceRule:null 을 "반복 중지"로 처리하지 않고
   * 기존 규칙을 그대로 유지하므로, 항목이 암시하는 동작과 실제 동작이 달라 오해를 줄 수 있다.
   */
  showOffOption?: boolean;
  /** 메뉴 폭을 트리거 버튼에 맞출지(상세 패널) 고정 폭(칩)일지. */
  fullWidth?: boolean;
}

interface MenuItem {
  key: string;
  label: string;
  selected: boolean;
  onPick: () => void;
}

/**
 * Google Calendar 식 반복 프리셋 드롭다운 — 반복 안함 / 매일 / 매주 X요일 / 매월 n번째 X요일 /
 * 매년 M월 D일 / 주중 매일 / 맞춤…. 현재 규칙이 프리셋에 없으면(맞춤 규칙) 맨 위에 그 규칙을
 * 선택된 상태로 보여준다. DatePickerPopover 와 같은 절대 위치·오버레이 패턴.
 */
export function RecurrencePopover({
  dateKey,
  value,
  onSelect,
  onClose,
  showOffOption = true,
  fullWidth = false,
}: RecurrencePopoverProps) {
  const { t, locale } = useTranslation();
  const [customOpen, setCustomOpen] = useState(false);

  // Esc 로 메뉴 닫기 — 포커스는 보통 트리거 버튼에 있으므로 document 에서 받는다.
  // 맞춤 모달이 열린 동안은 모달이 자체적으로 Esc 를 처리한다.
  useEffect(() => {
    if (customOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [customOpen, onClose]);

  const pick = (rule: RecurrenceRule | null) => {
    onSelect(rule);
    onClose();
  };

  if (customOpen) {
    return (
      <RecurrenceCustomDialog
        dateKey={dateKey}
        initial={value}
        onConfirm={pick}
        onCancel={onClose}
      />
    );
  }

  const presets = buildRecurrencePresets(dateKey);
  const matchesPreset = value !== null && presets.some((p) => sameRecurrenceRule(p.rule, value, dateKey));

  const items: MenuItem[] = [];
  if (showOffOption) {
    items.push({ key: "off", label: t("todo.recurrence.off"), selected: value === null, onPick: () => pick(null) });
  }
  if (value !== null && !matchesPreset) {
    items.push({
      key: "current",
      label: formatRecurrenceRule(value, dateKey, t, locale),
      selected: true,
      onPick: onClose,
    });
  }
  for (const preset of presets) {
    items.push({
      key: preset.id,
      label: formatRecurrenceRule(preset.rule, dateKey, t, locale),
      selected: value !== null && sameRecurrenceRule(preset.rule, value, dateKey),
      onPick: () => pick(preset.rule),
    });
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
      <div
        role="listbox"
        aria-label={t("todo.recurrence.title")}
        style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          ...(fullWidth ? { right: 0 } : { width: 260 }),
          zIndex: 31,
          background: "var(--color-tile-2)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--r-lg)",
          padding: 6,
          boxShadow: "var(--shadow-toast)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={item.selected}
            className="recurrence-menu-item"
            onClick={item.onPick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              minHeight: 40,
              padding: "8px 12px",
              border: 0,
              borderRadius: "var(--r-sm)",
              color: "var(--color-ink)",
              fontSize: 16,
              textAlign: "left",
            }}
          >
            <span>{item.label}</span>
            {item.selected ? <Check size={16} color="var(--color-primary-hover)" aria-hidden /> : null}
          </button>
        ))}
        <div style={{ height: 1, margin: "4px 6px", background: "var(--color-hairline)" }} />
        <button
          type="button"
          role="option"
          aria-selected={false}
          className="recurrence-menu-item"
          onClick={() => setCustomOpen(true)}
          style={{
            minHeight: 40,
            padding: "8px 12px",
            border: 0,
            borderRadius: "var(--r-sm)",
            color: "var(--color-ink)",
            fontSize: 16,
            textAlign: "left",
          }}
        >
          {t("todo.recurrence.preset.custom")}
        </button>
      </div>
    </>
  );
}
