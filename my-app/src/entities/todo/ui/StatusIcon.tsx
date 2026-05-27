import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import type { TaskStatus } from "@/entities/todo/model/types";

interface StatusIconProps {
  status: TaskStatus;
  size?: number;
}

/**
 * Todo 상태별 아이콘. done은 녹색 체크, in-progress는 파란 재생, not-start는 회색 원.
 */
export function StatusIcon({ status, size = 16 }: StatusIconProps) {
  if (status === "done") {
    return (
      <CheckCircle2
        size={size}
        style={{ color: "var(--color-status-done)" }}
      />
    );
  }

  if (status === "in-progress") {
    return (
      <PlayCircle size={size} style={{ color: "var(--color-primary)" }} />
    );
  }

  return <Circle size={size} style={{ color: "var(--color-ink-muted-48)" }} />;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  done: "Done · 완료",
  "in-progress": "In Progress · 진행 중",
  "not-start": "To Do · 시작 전",
};
