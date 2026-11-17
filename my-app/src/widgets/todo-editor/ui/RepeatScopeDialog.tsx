import { useEffect, useRef } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import type { EditScope } from "../model/applyScope";

const SCOPES: EditScope[] = ["this", "following", "all"];

/**
 * 반복 할 일의 적용 범위 묻기(시안 `.z-ask`): 이 일정만 / 이 일정 이후 전체 / 모든 반복 일정.
 * 반복이 아닌 할 일의 삭제는 "삭제" 하나만. Esc 는 모달의 cancel 에서 이것만 닫는다.
 */
export function RepeatScopeDialog({
  title,
  note,
  recurring,
  danger,
  deleteLabel,
  onChoose,
  onCancel,
}: {
  title: string;
  note?: string;
  recurring: boolean;
  danger?: boolean;
  deleteLabel: string;
  onChoose: (scope: EditScope) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 질문을 띄운 키(Enter 등)가 끝난 다음 프레임에 첫 단추로.
    const id = requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>("button")?.focus());
    return () => cancelAnimationFrame(id);
  }, []);
  const label: Record<EditScope, string> = {
    this: t("todoEditor.ask.this"),
    following: t("todoEditor.ask.following"),
    all: t("todoEditor.ask.all"),
  };
  return (
    <div className="z-ask" role="alertdialog" aria-modal="true" aria-labelledby="te-ask-h" ref={ref}>
      <div className="z-ab">
        <p id="te-ask-h">{title}</p>
        {note ? <small>{note}</small> : null}
        <div className="z-ao">
          {recurring ? (
            SCOPES.map((s) => (
              <button key={s} type="button" className={`z-b${danger ? " danger" : ""}`} onClick={() => onChoose(s)}>
                {label[s]}
              </button>
            ))
          ) : (
            <button type="button" className="z-b danger" onClick={() => onChoose("this")}>
              {deleteLabel}
            </button>
          )}
        </div>
        <button type="button" className="z-lnk" onClick={onCancel}>
          {t("todoEditor.ask.cancel")}
        </button>
      </div>
    </div>
  );
}
