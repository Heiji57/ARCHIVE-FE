import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { NoticeCategory, NotificationItem } from "@/entities/notification/model/types";
import { formatRelativeTime } from "@/shared/lib/date";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Filter = "all" | "sync" | "summary" | "system";
const FILTERS: Array<{ key: Filter; label: TranslationKey }> = [
  { key: "all", label: "shell.notif.filter.all" },
  { key: "sync", label: "shell.notif.filter.sync" },
  { key: "summary", label: "shell.notif.filter.summary" },
  { key: "system", label: "shell.notif.filter.system" },
];
const matches = (f: Filter, c: NoticeCategory) => f === "all" || c === f || (f === "system" && c === "general");

/**
 * 알림 패널. 시안 rest.js 의 오른쪽 줄 알림(nt 2): 오른쪽 패널 자리에 붙어 열린다.
 * 바깥을 누르거나 Esc 로 닫고, 닫으면 벨로 포커스를 돌려준다(AppShell 이 처리).
 */
export function NotificationPanel({ open, onClose }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el || ref.current?.contains(el) || el.closest("[data-ntrig]")) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  if (!open) return null;
  return <PanelBody panelRef={ref} onClose={onClose} />;
}

function PanelBody({ panelRef, onClose }: { panelRef: RefObject<HTMLElement | null>; onClose: () => void }) {
  const { state, markNotificationRead, markAllNotificationsRead, clearNotification, clearReadNotifications } =
    useArchiveApp();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () =>
      // transient(네트워크 오류 등)는 토스트로만 보이고 패널에는 넣지 않는다.
      state.notifications
        .filter((n) => !n.transient)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [state.notifications],
  );
  const unread = sorted.filter((n) => !n.read).length;
  const list = sorted.filter((n) => matches(filter, n.category));

  return (
    <section ref={panelRef} className="nt-p" role="dialog" aria-label={t("shell.notif.title")}>
      <header className="nt-h">
        <div>
          <h2>{t("shell.notif.title")}</h2>
          <small>{unread ? t("shell.notif.unread", { n: unread }) : t("shell.notif.allRead")}</small>
        </div>
        <button type="button" className="nt-tx" disabled={!unread} onClick={markAllNotificationsRead}>
          {t("shell.notif.markAll")}
        </button>
        <button type="button" className="nt-ix" aria-label={t("shell.close")} onClick={onClose}>
          <X size={14} aria-hidden="true" />
        </button>
      </header>
      <div className="nt-tabs" role="tablist" aria-label={t("shell.notif.filterLabel")}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {t(f.label)}
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="nt-l">
          {list.map((n) => (
            <Row key={n.id} n={n} onRead={markNotificationRead} onDelete={clearNotification} />
          ))}
        </ul>
      ) : (
        <div className="nt-e">
          <p>{t("shell.notif.empty")}</p>
          <small>{t("shell.notif.emptySub")}</small>
        </div>
      )}
      <footer className="nt-f">
        <small>{t("shell.notif.retention", { n: state.settings.notificationRetentionDays })}</small>
        <button type="button" className="nt-tx" onClick={clearReadNotifications}>
          {t("shell.notif.clearRead")}
        </button>
      </footer>
    </section>
  );
}

function Row({
  n,
  onRead,
  onDelete,
}: {
  n: NotificationItem;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const when = formatRelativeTime(n.timestamp, locale);
  return (
    <li className={`nt-n k-${n.type}${n.read ? " read" : ""}`}>
      <span className="nt-i">
        <KindIcon category={n.category} />
      </span>
      <button type="button" className="nt-b" onClick={() => !n.read && onRead(n.id)}>
        <b>{n.title}</b>
        <span>{n.message}</span>
        <small>{n.read ? when : t("shell.notif.unreadAt", { time: when })}</small>
      </button>
      {n.actionLabel && n.actionHref ? (
        <a className="nt-a" href={n.actionHref} onClick={() => onRead(n.id)}>
          {n.actionLabel}
        </a>
      ) : null}
      <button
        type="button"
        className="nt-x"
        aria-label={t("shell.notif.delete", { title: n.title })}
        onClick={() => onDelete(n.id)}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </li>
  );
}

/** 시안 rest.js 의 종류 아이콘: 연동은 도는 화살표, 요약은 문서, 그 밖은 정보. */
function KindIcon({ category }: { category: NoticeCategory }) {
  return (
    <svg className="nt-ic" viewBox="0 0 24 24" aria-hidden="true">
      {category === "sync" ? (
        <>
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 4v5h-5" />
        </>
      ) : category === "summary" ? (
        <>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M9 11h6M9 15h4" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </>
      )}
    </svg>
  );
}
