import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Folder as FolderIcon, Plus, Search } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { defaultTitle, shortDate } from "../model/format";
import { useRetroStudio } from "../model/retroStudio";

const i13 = { size: 13, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

/** 새 회고 창(시안 nd1: 제목 먼저 + 날짜, 폴더 알약). 일간 회고는 하루 한 편(서버 계약)이라 있는 날을 고르면 그 회고를 연다. */
export function NewRetroDialog({ date: initialDate }: { date: string }) {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const { state } = useArchiveApp();
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(initialDate);
  const [title, setTitle] = useState("");
  // 폴더 기본값: 거르는 폴더, 없으면 가장 최근 일간 회고의 폴더
  const [folderId, setFolderId] = useState<string | null>(() => {
    if (s.folder !== "all") return s.folder;
    const last = state.entries.filter((e) => e.retroType === "daily").sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
    return last?.folderId ?? null;
  });
  const [pop, setPop] = useState<"date" | "folder" | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    titleRef.current?.focus();
  }, []);

  const ph = defaultTitle(t, locale, "daily", date);
  const existing = state.entries.find((e) => e.retroType === "daily" && e.dateKey === date);
  const rel = date === s.today ? t("retro.nd.today") : date === toDateKey(addDays(fromDateKey(s.today), -1)) ? t("retro.nd.yesterday") : date === toDateKey(addDays(fromDateKey(s.today), -2)) ? t("retro.nd.dayBefore") : "";
  const dateText = rel ? t("retro.nd.relDate", { rel, date: shortDate(locale, date) }) : shortDate(locale, date);

  const create = () => {
    if (existing) {
      s.closeNew();
      s.openEntry(existing.id);
      return;
    }
    s.createRetro({ date, title, folderId });
  };

  return (
    <dialog
      ref={ref}
      className="rv-dlg"
      aria-label={t("retro.nd.label")}
      onCancel={(e) => {
        e.preventDefault();
        if (pop) setPop(null);
        else s.closeNew();
      }}
      onClick={(e) => {
        if (e.target === ref.current) s.closeNew();
        else if (pop && !(e.target as Element).closest(".rv-ndpop, [data-ndp]")) setPop(null);
      }}
    >
      <div className="rv-nd">
        <div className="nd-t4">
          <input
            ref={titleRef}
            value={title}
            placeholder={ph}
            aria-label={t("retro.nd.titleLabel")}
            autoComplete="off"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey && !title) {
                e.preventDefault();
                setTitle(ph);
              } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                create();
              }
            }}
          />
          {title ? null : (
            <span className="nd-tab" aria-hidden="true">
              <kbd className="rv-kbd">Tab</kbd> {t("retro.nd.tabHint")}
            </span>
          )}
        </div>
        <p className="nd-sub">{existing ? t("retro.nd.exists", { date: shortDate(locale, date) }) : t("retro.nd.sub")}</p>
        <div className="nd-props">
          <span className="rv-wrap">
            <button type="button" className="nd-pill" data-ndp aria-haspopup="dialog" aria-expanded={pop === "date"} onClick={() => setPop(pop === "date" ? null : "date")}>
              <Calendar {...i13} />
              {dateText}
            </button>
            {pop === "date" ? (
              <DatePop
                value={date}
                today={s.today}
                onPick={(d) => {
                  setDate(d);
                  setPop(null);
                  titleRef.current?.focus();
                }}
              />
            ) : null}
          </span>
          <span className="rv-wrap">
            <button type="button" className="nd-pill" data-ndp aria-haspopup="menu" aria-expanded={pop === "folder"} onClick={() => setPop(pop === "folder" ? null : "folder")}>
              <FolderIcon {...i13} />
              {s.folderName(folderId)}
            </button>
            {pop === "folder" ? (
              <FolderPop
                value={folderId}
                onPick={(id) => {
                  setFolderId(id);
                  setPop(null);
                  titleRef.current?.focus();
                }}
              />
            ) : null}
          </span>
        </div>
        <div className="nd-ft">
          <span className="nd-hint">{t("retro.nd.enterHint")}</span>
          <span className="sp" />
          <button type="button" className="rv-bt" onClick={s.closeNew}>
            {t("retro.nd.cancel")}
          </button>
          <button type="button" className="rv-bt p" onClick={create}>
            {t("retro.nd.create")}
          </button>
        </div>
      </div>
    </dialog>
  );
}

const DOW = [0, 1, 2, 3, 4, 5, 6].map((i) => new Date(2024, 0, 1 + i, 12)); // 2024-01-01 월요일

/** 날짜 고르기(시안 svcGrid, 월요일 시작 6주 칸 + 아래 고른 날과 "오늘로"). 오늘 뒤는 못 고른다. */
function DatePop({ value, today, onPick }: { value: string; today: string; onPick: (d: string) => void }) {
  const { t, locale } = useTranslation();
  const [ym, setYm] = useState(value.slice(0, 7));
  const first = fromDateKey(`${ym}-01`);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => toDateKey(addDays(start, i)));
  const shift = (d: number) => {
    const x = new Date(first.getFullYear(), first.getMonth() + d, 1, 12);
    setYm(toDateKey(x).slice(0, 7));
  };
  const nextDisabled = ym >= today.slice(0, 7);
  const gridRef = useRef<HTMLDivElement>(null);
  return (
    <div className="rv-pop l rv-ndpop svc" role="dialog" aria-label={t("retro.nd.pickDate")}>
      <div className="svc-mh">
        <button type="button" className="rv-ib" aria-label={t("retro.nd.prevMonth")} onClick={() => shift(-1)}>
          <ChevronLeft size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
        <b>{new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(first)}</b>
        <button type="button" className="rv-ib" aria-label={t("retro.nd.nextMonth")} disabled={nextDisabled} onClick={() => shift(1)}>
          <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </div>
      <div
        className="svc-g"
        ref={gridRef}
        onKeyDown={(e) => {
          const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
          if (!d) return;
          e.preventDefault();
          const btns = [...(gridRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
          const i = btns.indexOf(document.activeElement as HTMLButtonElement);
          const n = btns[i + d];
          if (n && !n.disabled) n.focus();
        }}
      >
        {DOW.map((d) => (
          <span key={d.getDay()}>{new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(d)}</span>
        ))}
        {cells.map((k) => (
          <button
            key={k}
            type="button"
            className={`${k.startsWith(ym) ? "" : "out"}${k === today ? " today" : ""}`}
            aria-pressed={k === value}
            aria-label={new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", weekday: "long" }).format(fromDateKey(k))}
            disabled={k > today}
            onClick={() => onPick(k)}
          >
            {+k.slice(8, 10)}
          </button>
        ))}
      </div>
      <div className="svc-ft">
        <span>{shortDate(locale, value)}</span>
        <button type="button" className="rv-bt g" onClick={() => onPick(today)}>
          {t("retro.nd.toToday")}
        </button>
      </div>
    </div>
  );
}

/** 폴더 고르기(시안 mf2: 찾기 + 없는 이름이면 새로 만들기). */
function FolderPop({ value, onPick }: { value: string | null; onPick: (id: string | null) => void }) {
  const { t } = useTranslation();
  const s = useRetroStudio();
  const [q, setQ] = useState("");
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => inp.current?.focus(), []);
  const opts: Array<{ id: string | null; name: string }> = [...s.folders.map((f) => ({ id: f.id as string | null, name: f.name })), { id: null, name: t("retro.cd.unfiled") }];
  const hits = opts.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));
  const canCreate = q.trim() !== "" && !opts.some((o) => o.name === q.trim());
  const create = async () => {
    const id = await s.createFolder(q.trim());
    if (id) onPick(id);
  };
  return (
    <div className="rv-pop l rv-ndpop" role="menu">
      <label className="rv-fs">
        <Search {...i13} />
        <input
          ref={inp}
          value={q}
          placeholder={t("retro.ed.folderFind")}
          aria-label={t("retro.ed.folderFind")}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            e.stopPropagation();
            if (hits[0]) onPick(hits[0].id);
            else if (canCreate) void create();
          }}
        />
      </label>
      {hits.map((o) => (
        <button key={o.id ?? "none"} type="button" role="menuitemradio" aria-checked={value === o.id} onClick={() => onPick(o.id)}>
          <FolderIcon {...i13} />
          {o.name}
        </button>
      ))}
      {canCreate ? (
        <>
          <hr />
          <button type="button" role="menuitem" onClick={() => void create()}>
            <Plus {...i13} />
            {t("retro.ed.folderCreate", { name: q.trim() })}
          </button>
        </>
      ) : null}
    </div>
  );
}
