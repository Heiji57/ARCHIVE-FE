import type { PointerEvent, ReactNode } from "react";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { STATUS_KEY } from "@/widgets/calendar-dashboard";

/** 상태 점(시안 shared.css .sd): 진행 전 빈 원, 진행 중 반쯤 찬 원, 완료 체크. */
export function StatusDot({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  return <span className="rp-sd" data-st={status} role="img" aria-label={t(STATUS_KEY[status])} />;
}

export interface PanelRowProps {
  todo: Todo;
  /** 오른쪽 작은 글자(시각, D-1 등). */
  right?: ReactNode;
  /** aria-label 에 쓸 when 문자열(right 가 ReactNode 라 별도). */
  whenText?: string;
  tone?: "" | "soon" | "late";
  /** 오른쪽 끝 버튼. */
  children?: ReactNode;
  onOpen(id: string): void;
  /** 캘린더로 끌어 놓기(움직이지 않고 떼면 연다). */
  onPointerDown(e: PointerEvent<HTMLElement>, todo: Todo): void;
}

/** 패널 할 일 한 줄(시안 rpanel.js row): 상태 점과 제목, 오른쪽 글자, 버튼. */
export function PanelRow({ todo, right, whenText, tone = "", children, onOpen, onPointerDown }: PanelRowProps) {
  const { t } = useTranslation();
  return (
    <div className={`rp-r${tone ? ` ${tone}` : ""}`}>
      <span
        className="rp-t"
        role="button"
        tabIndex={0}
        aria-label={t("todos.rp.rowAria", { title: todo.title, when: whenText ?? "" })}
        onPointerDown={(e) => onPointerDown(e, todo)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(todo.id);
          }
        }}
      >
        <StatusDot status={todo.status} />
        <span>{todo.title}</span>
      </span>
      {right ? <small>{right}</small> : null}
      {children}
    </div>
  );
}
