import { useTranslation } from "@/shared/lib/i18n";
import type { ProposalItem } from "../model/proposal";

interface ProposalTableProps {
  items: ProposalItem[];
  applied: boolean;
  done: boolean;
  kind: "todos" | "move" | "retro";
  onToggle: (key: string, on: boolean) => void;
  onTitleChange: (key: string, title: string) => void;
}

function formatDate(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === 2) return "모레";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTime(startTime: string | null, endTime: string | null): string {
  if (!startTime) return "종일";
  if (!endTime) return startTime;
  return `${startTime} ~ ${endTime}`;
}

export function ProposalTable({
  items,
  applied,
  done,
  kind,
  onToggle,
  onTitleChange,
}: ProposalTableProps) {
  const { t } = useTranslation();
  const isMove = kind === "move";

  return (
    <table className="ap-tb">
      <thead>
        <tr>
          <th scope="col">{isMove ? t("ai.result.move") : t("ai.result.col.todo")}</th>
          <th scope="col">{t("ai.result.col.date")}</th>
          <th scope="col">{t("ai.result.col.time")}</th>
          <th scope="col">
            <span className="sr">{t("ai.result.col.include")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.key} className={item.selected ? "" : "off"}>
            <td>
              <input
                className="ap-ti"
                value={item.title}
                readOnly={applied || isMove || !done}
                aria-label={t("ai.result.col.todo")}
                onChange={(e) => onTitleChange(item.key, e.target.value)}
              />
              {item.clash && !applied && done && (
                <small className="ap-clash">
                  {t("ai.result.clash").replace("{title}", item.clash)}
                </small>
              )}
            </td>
            <td>{formatDate(item.dateKey)}</td>
            <td>{formatTime(item.startTime, item.endTime)}</td>
            <td>
              <button
                type="button"
                className="ap-tg"
                aria-pressed={item.selected}
                disabled={applied || !done}
                aria-label={
                  item.selected
                    ? t("ai.result.toggle.exclude").replace("{title}", item.title)
                    : t("ai.result.toggle.include").replace("{title}", item.title)
                }
                onClick={() => onToggle(item.key, !item.selected)}
              >
                {item.selected ? t("ai.result.in") : t("ai.result.out")}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
