import { type CSSProperties, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarMinus,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Loader,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { formatFullDate, fromDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { DatePickerPopover } from "./DatePickerPopover";

export type TodoPatch = Partial<
  Pick<Todo, "title" | "status" | "description" | "dateKey">
>;

export interface TaskDetailPanelProps {
  todo: Todo;
  onClose: () => void;
  onUpdate: (patch: TodoPatch) => void;
  /** 시작/종료 시각 설정 (일간 타임라인 블록용). null = 비움. */
  onSetTime: (startTime: string | null, endTime: string | null) => void;
  onGoToRetro: () => void;
  /** 작업 삭제 (휴지통 버튼 / Delete 키). */
  onDelete: () => void;
  /**
   * Google Calendar 연동 토글 콜백.
   * undefined 이면 섹션을 숨긴다(캘린더 미연결 등).
   */
  onToggleCalendarLink?: () => void;
  /** needsReauth=true 이면 토글을 비활성화하고 재연결 안내를 보인다. */
  calendarNeedsReauth?: boolean;
}

const STATUS_ORDER: TaskStatus[] = ["not-start", "in-progress", "done"];

const timeInputStyle: CSSProperties = {
  flex: 1,
  fontSize: 16,
  padding: "11px 14px",
  borderRadius: "var(--r-md)",
  background: "var(--color-tile-3)",
  border: "1px solid var(--color-divider-soft)",
  colorScheme: "dark",
  color: "var(--color-ink)",
};

export function TaskDetailPanel({
  todo,
  onClose,
  onUpdate,
  onSetTime,
  onGoToRetro,
  onDelete,
  onToggleCalendarLink,
  calendarNeedsReauth = false,
}: TaskDetailPanelProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const { t, locale } = useTranslation();
  const d = fromDateKey(todo.dateKey);

  // Delete 키로 작업 삭제 — 단, 입력란(제목/설명/날짜 등)에 포커스가 있을 땐
  // 텍스트 편집을 방해하지 않도록 무시한다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete") return;
      const el = document.activeElement;
      const tag = el?.tagName;
      const editable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (el as HTMLElement | null)?.isContentEditable;
      if (editable) return;
      e.preventDefault();
      onDelete();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDelete]);

  const STATUS_LABEL: Record<TaskStatus, string> = {
    "not-start": t("todo.col.notStart.ko"),
    "in-progress": t("todo.col.inProgress.ko"),
    done: t("todo.col.done.ko"),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--color-divider-soft)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            className="t-eyebrow"
            style={{ color: "var(--color-body-muted)", margin: 0 }}
          >
            {t("calendar.taskDetail.title")}
          </p>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              className="btn-icon detail-delete-btn"
              aria-label={t("calendar.taskDetail.delete")}
              title={t("calendar.taskDetail.delete")}
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 16,
            color: "var(--color-body-muted)",
          }}
        >
          {formatFullDate(d, locale)}
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Status */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.status")}
          </p>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setStatusOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--r-md)",
                background: "var(--color-tile-3)",
                border: "1px solid var(--color-divider-soft)",
                color: "var(--color-ink)",
                fontSize: 16,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <StatusIcon status={todo.status} size={16} />
                {STATUS_LABEL[todo.status]}
              </span>
              <ChevronDown size={14} />
            </button>

            {statusOpen ? (
              <div
                style={{
                  marginTop: 6,
                  borderRadius: "var(--r-md)",
                  background: "var(--color-tile-3)",
                  border: "1px solid var(--color-divider-soft)",
                  overflow: "hidden",
                }}
              >
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onUpdate({ status: s });
                      setStatusOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      padding: "10px 14px",
                      fontSize: 16,
                      color: "var(--color-ink)",
                      background:
                        todo.status === s
                          ? "var(--color-tile-2)"
                          : "transparent",
                    }}
                  >
                    <StatusIcon status={s} size={14} />
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.titleField")}
          </p>
          <input
            value={todo.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            style={{
              width: "100%",
              fontSize: 20,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--color-tile-3)",
              border: "1px solid var(--color-divider-soft)",
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
            }}
          />
        </div>

        {/* Date */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.date")}
          </p>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setDateOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: "var(--r-md)",
                background: "var(--color-tile-3)",
                border: "1px solid var(--color-divider-soft)",
                color: "var(--color-ink)",
                fontSize: 16,
              }}
            >
              <span
                style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <CalendarDays size={15} />
                {todo.dateKey}
              </span>
              <ChevronDown size={14} />
            </button>

            {dateOpen ? (
              <DatePickerPopover
                value={todo.dateKey}
                anchorRight={false}
                onChange={(v) => {
                  onUpdate({ dateKey: v });
                  setDateOpen(false);
                }}
                onClose={() => setDateOpen(false)}
              />
            ) : null}
          </div>
        </div>

        {/* Time (optional) */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "0 0 8px",
            }}
          >
            <p
              className="t-eyebrow"
              style={{ margin: 0, color: "var(--color-body-muted)" }}
            >
              {t("calendar.taskDetail.time")}
            </p>
            {todo.startTime || todo.endTime ? (
              <button
                type="button"
                onClick={() => onSetTime(null, null)}
                style={{
                  fontSize: 12,
                  color: "var(--color-primary-on-dark)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {t("calendar.taskDetail.clearTime")}
              </button>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="time"
              aria-label={t("calendar.taskDetail.startTime")}
              value={todo.startTime ?? ""}
              onChange={(e) =>
                onSetTime(e.target.value || null, todo.endTime ?? null)
              }
              style={timeInputStyle}
            />
            <span style={{ color: "var(--color-body-muted)", fontSize: 16 }}>–</span>
            <input
              type="time"
              aria-label={t("calendar.taskDetail.endTime")}
              value={todo.endTime ?? ""}
              onChange={(e) =>
                onSetTime(todo.startTime ?? null, e.target.value || null)
              }
              style={timeInputStyle}
            />
          </div>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--color-body-muted)",
            }}
          >
            {t("calendar.taskDetail.timeHint")}
          </p>
        </div>

        {/* Description */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.description")}
          </p>
          <textarea
            value={todo.description ?? ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="editor-area"
            style={{ minHeight: 160, fontSize: 16 }}
            placeholder={t("calendar.taskDetail.descPlaceholder")}
          />
        </div>

        {/* Google Calendar 연동 섹션 */}
        {onToggleCalendarLink !== undefined && (
          <div>
            <p
              className="t-eyebrow"
              style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
            >
              Google Calendar
            </p>
            {calendarNeedsReauth ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--color-warn-subtle, rgba(234,179,8,.1))",
                  border: "1px solid var(--color-warn, #ca8a04)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 12,
                  color: "var(--color-body-muted)",
                }}
              >
                {t("calendar.taskDetail.calendarReauth")}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={onToggleCalendarLink}
                  className="btn btn-utility"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 16 }}
                >
                  {todo.calendarLinked ? (
                    <CalendarMinus size={14} />
                  ) : (
                    <CalendarPlus size={14} />
                  )}
                  {todo.calendarLinked
                    ? t("calendar.taskDetail.calendarLinkRemove")
                    : t("calendar.taskDetail.calendarLinkAdd")}
                </button>
                {todo.calendarPushStatus === "pending" || todo.calendarPushStatus === "syncing" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-body-muted)" }}>
                    <Loader size={11} style={{ animation: "summary-spin 900ms linear infinite" }} />
                    {t(`calendar.taskDetail.calendarStatus.${todo.calendarPushStatus}`)}
                  </span>
                ) : todo.calendarPushStatus === "synced" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-status-done, #22c55e)" }}>
                    <CheckCircle2 size={11} />
                    {t("calendar.taskDetail.calendarStatus.synced")}
                  </span>
                ) : todo.calendarPushStatus === "failed" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-warn, #ca8a04)" }}>
                    <AlertTriangle size={11} />
                    {t("calendar.taskDetail.calendarStatus.failed")}
                  </span>
                ) : todo.calendarPushStatus === "pending_delete" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-body-muted)" }}>
                    <CalendarDays size={11} />
                    {t("calendar.taskDetail.calendarStatus.pending_delete")}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* AI auto-retro card */}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--r-md)",
            background:
              "linear-gradient(180deg, rgba(94, 106, 210, 0.14), rgba(94, 106, 210, 0.04))",
            border: "1px solid rgba(94, 106, 210, 0.28)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div className="avatar avatar-sm avatar-primary">
              <Sparkles size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.1px",
                }}
              >
                {t("calendar.taskDetail.aiRetro")}
              </p>
              <p
                style={{
                  margin: "4px 0 12px",
                  fontSize: 12,
                  color: "var(--color-body-muted)",
                  lineHeight: 1.5,
                }}
              >
                {t("calendar.taskDetail.aiRetroDesc")}
              </p>
              <button
                type="button"
                onClick={onGoToRetro}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: 16 }}
              >
                {t("calendar.taskDetail.goToRetro")} <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
