import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Search } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type { AppRoute } from "@/app/model/types";
import type { JournalEntry } from "@/entities/entry/model/types";
import { entryDisplayTitle } from "@/entities/entry/lib/summaryTitle";
import type { Todo } from "@/entities/todo/model/types";
import type { GlobalSearchResult } from "@/shared/api";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { ICON_STROKE } from "@/shared/ui/icons";
import { usePaletteCommands, type PaletteCommand } from "../model/commands";
import {
  PALETTE_TABS,
  buildPaletteGroups,
  cyclePaletteTab,
  relativeDay,
  type PaletteTab,
} from "../model/palette";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TAB_KEY: Record<PaletteTab, TranslationKey> = {
  all: "shell.cp.tab.all",
  todo: "shell.cp.tab.todo",
  retro: "shell.cp.tab.retro",
  cmd: "shell.cp.tab.cmd",
};
const GROUP_KEY: Record<"todo" | "retro" | "cmd", TranslationKey> = {
  todo: "shell.cp.tab.todo",
  retro: "shell.cp.tab.retro",
  cmd: "shell.cp.tab.cmd",
};

// 서버 결과와 로컬 결과를 id 기준으로 중복 제거하며 병합한다(서버 우선).
function mergeById<T extends { id: string }>(primary: T[], secondary: T[], limit: number): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...primary, ...secondary]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}

type CmdRow = PaletteCommand & { label: string };
type Row =
  | { kind: "todo"; item: Todo }
  | { kind: "retro"; item: JournalEntry }
  | { kind: "cmd"; item: CmdRow };

/**
 * 검색과 명령 팔레트(Ctrl+K). 시안 rest.js 의 범위 탭 검색(cp 4).
 * 할 일과 회고는 GET /search(서버) + 지금 불러온 데이터(로컬)를 합쳐 찾는다. 데모에서는 로컬만.
 */
export function GlobalSearch({ open, onClose, onNavigate }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="cp-dlg"
      aria-label={t("shell.cp.label")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open ? <PaletteBody onClose={onClose} onNavigate={onNavigate} /> : null}
    </dialog>
  );
}

function PaletteBody({ onClose, onNavigate }: { onClose: () => void; onNavigate: (route: AppRoute) => void }) {
  const { state, requestFocus, globalSearch } = useArchiveApp();
  const { t, locale } = useTranslation();
  const today = useTodayKey();
  const commands = usePaletteCommands();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<PaletteTab>("all");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // 입력마다 GET /search 를 부르지 않도록 디바운스하고, 검색어별로 캐시한다.
  const debouncedQ = useDebouncedValue(q, 250);
  const cacheRef = useRef<Map<string, GlobalSearchResult>>(new Map());
  const [, setCacheVersion] = useState(0);
  const [serverMode, setServerMode] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    const needle = debouncedQ.trim();
    if (!needle || cacheRef.current.has(needle)) return;
    const reqId = ++reqRef.current;
    void globalSearch(needle, 6)
      .then((res) => {
        if (reqId !== reqRef.current) return;
        if (res === null) {
          setServerMode(false); // 데모/mock → 로컬 결과만
          return;
        }
        setServerMode(true);
        cacheRef.current.set(needle, res);
        if (cacheRef.current.size > 20) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest !== undefined) cacheRef.current.delete(oldest);
        }
        setCacheVersion((v) => v + 1);
      })
      .catch(() => {
        /* 네트워크 오류 — 로컬 결과로 보여 준다 */
      });
  }, [debouncedQ, globalSearch]);

  const needle = q.trim().toLowerCase();
  const dailies = useMemo(() => state.entries.filter((e) => e.retroType === "daily"), [state.entries]);
  const local = useMemo(() => {
    if (!needle) return { todos: state.todos, entries: dailies };
    return {
      todos: state.todos.filter((x) => x.title.toLowerCase().includes(needle)).slice(0, 6),
      entries: dailies
        .filter((e) => e.title.toLowerCase().includes(needle) || e.content.toLowerCase().includes(needle))
        .slice(0, 6),
    };
  }, [needle, state.todos, dailies]);
  const server = serverMode && needle && q.trim() === debouncedQ.trim() ? cacheRef.current.get(q.trim()) : undefined;
  const found = server
    ? { todos: mergeById(server.todos, local.todos, 6), entries: mergeById(server.entries, local.entries, 6) }
    : local;

  const cmdRows: CmdRow[] = commands.map((c) => ({ ...c, label: t(c.labelKey) }));
  const groups = buildPaletteGroups({ q, tab, todos: found.todos, entries: found.entries, commands: cmdRows, today });
  const rows: Row[] = groups.flatMap((g): Row[] =>
    g.kind === "todo"
      ? g.items.map((item) => ({ kind: "todo", item }))
      : g.kind === "retro"
        ? g.items.map((item) => ({ kind: "retro", item }))
        : g.items.map((item) => ({ kind: "cmd", item })),
  );
  const active = rows.length ? Math.min(index, rows.length - 1) : -1;

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, q, tab]);

  const dayText = (dateKey: string) => {
    const r = relativeDay(dateKey, today);
    if (r) return t(`shell.cp.${r}`);
    const [, m, d] = dateKey.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(2000, m - 1, d));
  };
  const timeText = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, h, m));
  };

  const run = (row: Row | undefined) => {
    if (!row) return;
    onClose();
    if (row.kind === "todo") {
      requestFocus({ kind: "todo", todoId: row.item.id, dateKey: row.item.dateKey });
      onNavigate("calendar");
    } else if (row.kind === "retro") {
      requestFocus({ kind: "entry", entryId: row.item.id });
      onNavigate("retrospectives");
    } else {
      row.item.run();
    }
  };

  let n = -1;
  const rowEl = (row: Row): ReactNode => {
    n++;
    const i = n;
    const { icon, label, meta } =
      row.kind === "todo"
        ? {
            icon: <TodoGlyph />,
            label: row.item.title,
            meta: `${dayText(row.item.dateKey)}, ${row.item.startTime ? timeText(row.item.startTime) : t("shell.cp.noTime")}`,
          }
        : row.kind === "retro"
          ? { icon: <DocGlyph />, label: entryDisplayTitle(row.item, locale), meta: dayText(row.item.dateKey) }
          : {
              icon: <ChevronRight size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />,
              label: row.item.label,
              meta: row.item.hint ?? "",
            };
    return (
      <li
        key={`${row.kind}-${row.item.id}`}
        role="option"
        id={`cp-o${i}`}
        aria-selected={i === active}
        onMouseMove={() => i !== active && setIndex(i)}
        onClick={() => run(row)}
      >
        {icon}
        <span className="cp-l">{label}</span>
        <small>{meta}</small>
      </li>
    );
  };

  return (
    <div
      className="cp-w"
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "ArrowDown" && rows.length) {
          e.preventDefault();
          setIndex((active + 1) % rows.length);
        } else if (e.key === "ArrowUp" && rows.length) {
          e.preventDefault();
          setIndex((active - 1 + rows.length) % rows.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          run(rows[active]);
        } else if (e.key === "Tab") {
          e.preventDefault();
          setTab(cyclePaletteTab(tab, e.shiftKey ? -1 : 1));
          setIndex(0);
        }
      }}
    >
      <div className="cp-s">
        <Search size={16} strokeWidth={2} aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="cp-list"
          aria-activedescendant={active >= 0 ? `cp-o${active}` : undefined}
          aria-label={t("shell.cp.input")}
          autoComplete="off"
          placeholder={t("shell.cp.placeholder")}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIndex(0);
          }}
        />
        <kbd>Esc</kbd>
      </div>
      <div className="cp-tabs" role="tablist" aria-label={t("shell.cp.scope")}>
        {PALETTE_TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            tabIndex={-1}
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setIndex(0);
            }}
          >
            {t(TAB_KEY[k])}
          </button>
        ))}
      </div>
      <ul id="cp-list" ref={listRef} role="listbox" aria-label={t("shell.cp.results")}>
        {groups.length ? (
          groups.map((g) => [
            <li key={`h-${g.kind}`} className="cp-h" role="presentation">
              {t(GROUP_KEY[g.kind])}
            </li>,
            ...rows.filter((r) => r.kind === g.kind).map(rowEl),
          ])
        ) : (
          <li className="cp-e" role="presentation">
            {t("shell.cp.noResult", { q: q.trim() })}
          </li>
        )}
      </ul>
      <footer className="cp-f">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          {t("shell.cp.foot.move")}
        </span>
        <span>
          <kbd>Enter</kbd>
          {t("shell.cp.foot.open")}
        </span>
        <span>
          <kbd>Tab</kbd>
          {t("shell.cp.foot.scope")}
        </span>
      </footer>
    </div>
  );
}

/** 시안 rest.js 의 할 일 아이콘(둥근 네모 안 체크). */
function TodoGlyph() {
  return (
    <svg className="cp-i" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

/** 시안 rest.js 의 회고 아이콘(접힌 문서). */
function DocGlyph() {
  return (
    <svg className="cp-i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}
