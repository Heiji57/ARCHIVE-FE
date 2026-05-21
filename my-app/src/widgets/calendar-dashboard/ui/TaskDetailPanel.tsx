import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { formatFullDate, fromDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import type { TodoPatch } from "../model/constants";

export interface TaskDetailPanelProps {
  todo: Todo;
  onClose: () => void;
  onUpdate: (patch: TodoPatch) => void;
  onGoToRetro: () => void;
}

const STATUS_ORDER: TaskStatus[] = ["not-start", "in-progress", "done"];

export function TaskDetailPanel({
  todo,
  onClose,
  onUpdate,
  onGoToRetro,
}: TaskDetailPanelProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const { t } = useTranslation();
  const d = fromDateKey(todo.dateKey);

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
            <button type="button" className="btn-icon" aria-label="More">
              <MoreHorizontal size={16} />
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
            fontSize: 14,
            color: "var(--color-body-muted)",
          }}
        >
          {formatFullDate(d)}
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
                fontSize: 14,
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
                      fontSize: 14,
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
          <input
            type="date"
            value={todo.dateKey}
            onChange={(e) => onUpdate({ dateKey: e.target.value })}
            style={{
              width: "100%",
              fontSize: 14,
              padding: "11px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--color-tile-3)",
              border: "1px solid var(--color-divider-soft)",
              colorScheme: "dark",
              color: "var(--color-ink)",
            }}
          />
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
            style={{ minHeight: 160, fontSize: 14 }}
            placeholder={t("calendar.taskDetail.descPlaceholder")}
          />
        </div>

        {/* AI auto-retro card */}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--r-md)",
            background:
              "linear-gradient(180deg, rgba(10, 132, 255, 0.14), rgba(10, 132, 255, 0.04))",
            border: "1px solid rgba(10, 132, 255, 0.28)",
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
                  fontSize: 13,
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
                style={{ padding: "8px 16px", fontSize: 13 }}
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
