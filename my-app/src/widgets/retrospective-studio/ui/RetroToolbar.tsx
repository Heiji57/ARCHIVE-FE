import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Folder as FolderIcon, ListFilter, Plus, Search, X } from "lucide-react";
import type { SummaryKind } from "@/entities/summary/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { ICON_STROKE, SparkIcon } from "@/shared/ui/icons";
import { LOCALE_TAG } from "@/shared/lib/date";
import { monthName } from "../model/format";
import { monthWeekCount } from "../model/retroList";
import { useRetroStudio } from "../model/retroStudio";
import type { RetroKindFilter } from "../model/useRetroList";
import { PopMenu } from "./PopMenu";

const i14 = { size: 14, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

const KINDS: Array<[RetroKindFilter, TranslationKey]> = [
  ["all", "retro.kind.all"],
  ["daily", "retro.kind.dailyRetro"],
  ["weekly", "retro.kind.weeklyRetro"],
  ["monthly", "retro.kind.monthlyRetro"],
  ["yearly", "retro.kind.yearlyRetro"],
];

const SUMS: Array<[SummaryKind, TranslationKey, TranslationKey]> = [
  ["weekly", "retro.sum.weekly", "retro.sum.weeklyHint"],
  ["monthly", "retro.sum.monthly", "retro.sum.monthlyHint"],
  ["yearly", "retro.sum.yearly", "retro.sum.yearlyHint"],
];

/** 목록 위 도구 줄(시안 .q-hd): 기간, 폴더 칩, 보기, 종류, 찾기, 요약 만들기, 새 회고. */
export function RetroToolbar() {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const { state } = useArchiveApp();
  const searchRef = useRef<HTMLInputElement>(null);
  const thisYear = s.today.slice(0, 4);
  const thisMonth = +s.today.slice(5, 7);

  const years = useMemo(() => {
    const set = new Set([thisYear, ...state.entries.map((e) => e.dateKey.slice(0, 4))]);
    return [...set].filter((y) => y <= thisYear).sort().reverse();
  }, [state.entries, thisYear]);
  const months = s.year === "all" ? [] : Array.from({ length: s.year === thisYear ? thisMonth : 12 }, (_, i) => i + 1);
  const weeks = s.month === "all" ? 0 : monthWeekCount(+s.year, +s.month);

  // "/" 로 찾기 열기(입력 중이 아닐 때)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']") || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      s.setSearchOpen(true);
      requestAnimationFrame(() => searchRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s]);

  const step = (d: number) => {
    if (s.year === "all") return s.setPeriod({ year: thisYear });
    if (s.month === "all") {
      const y = Math.min(+thisYear, +s.year + d);
      return s.setPeriod({ year: String(y) });
    }
    if (s.week === "all") {
      let m = +s.month + d;
      let y = +s.year;
      if (m < 1) [m, y] = [12, y - 1];
      if (m > 12) [m, y] = [1, y + 1];
      if (y > +thisYear || (y === +thisYear && m > thisMonth)) return;
      return s.setPeriod({ year: String(y), month: String(m) });
    }
    const w = Math.min(weeks, Math.max(1, +s.week + d));
    s.setPeriod({ week: String(w) });
  };

  const vmName = s.vm === "rail" ? t("retro.vm.rail") : t("retro.vm.grid");
  const kindName = t(KINDS.find((k) => k[0] === s.type)?.[1] ?? "retro.kind.all");

  return (
    <div className="rv-hd">
      <div className="rv-per" role="group" aria-label={t("retro.per.label")}>
        <button type="button" className="st" aria-label={t("retro.per.prev")} onClick={() => step(-1)}>
          <ChevronLeft size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
        <select aria-label={t("retro.per.year")} value={s.year} onChange={(e) => s.setPeriod({ year: e.target.value })}>
          <option value="all">{t("retro.per.allYears")}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {new Intl.DateTimeFormat(LOCALE_TAG[locale], { year: "numeric" }).format(new Date(+y, 0, 1, 12))}
            </option>
          ))}
        </select>
        <i />
        <select aria-label={t("retro.per.month")} value={s.month} disabled={s.year === "all"} onChange={(e) => s.setPeriod({ month: e.target.value })}>
          <option value="all">{t("retro.per.allMonths")}</option>
          {months.map((m) => (
            <option key={m} value={String(m)}>
              {monthName(locale, m)}
            </option>
          ))}
        </select>
        <i />
        <select aria-label={t("retro.per.week")} value={s.week} disabled={s.month === "all"} onChange={(e) => s.setPeriod({ week: e.target.value })}>
          <option value="all">{t("retro.per.allWeeks")}</option>
          {Array.from({ length: weeks }, (_, i) => (
            <option key={i} value={String(i + 1)}>
              {t("retro.per.weekN", { n: i + 1 })}
            </option>
          ))}
        </select>
        <button type="button" className="st" aria-label={t("retro.per.next")} onClick={() => step(1)}>
          <ChevronRight size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </div>
      {s.folder !== "all" ? (
        <span className="rv-chip">
          <FolderIcon size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
          {s.folderName(s.folder)}
          <button type="button" aria-label={t("retro.chip.clearFolder")} onClick={() => s.setFolder("all")}>
            <X size={10} strokeWidth={2} aria-hidden="true" />
          </button>
        </span>
      ) : null}
      <span className="sp" />
      <PopMenu trigger={<><ListFilter {...i14} />{t("retro.vm.label", { name: vmName })}</>} side="r">
        {(close) =>
          (["grid", "rail"] as const).map((v) => (
            <button key={v} type="button" role="menuitemradio" aria-checked={s.vm === v} onClick={() => { s.setVm(v); close(); }}>
              {t(v === "grid" ? "retro.vm.grid" : "retro.vm.rail")}
            </button>
          ))
        }
      </PopMenu>
      <PopMenu trigger={<><ListFilter {...i14} />{kindName}</>} side="l">
        {(close) =>
          KINDS.map(([k, key]) => (
            <button key={k} type="button" role="menuitemradio" aria-checked={s.type === k} onClick={() => { s.setType(k); close(); }}>
              {t(key)}
            </button>
          ))
        }
      </PopMenu>
      {s.searchOpen ? (
        <label className="rv-srch">
          <Search {...i14} />
          <input
            ref={searchRef}
            autoFocus
            value={s.q}
            placeholder={t("retro.find.placeholder")}
            aria-label={t("retro.find.label")}
            onChange={(e) => s.setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                s.setQ("");
                s.setSearchOpen(false);
              }
            }}
          />
          <button type="button" className="rv-ib xs" aria-label={t("retro.find.close")} onClick={() => { s.setQ(""); s.setSearchOpen(false); }}>
            <X size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </label>
      ) : (
        <button type="button" className="rv-ib" aria-label={t("retro.find.label")} title={t("retro.find.open")} onClick={() => s.setSearchOpen(true)}>
          <Search size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      )}
      <PopMenu trigger={<><SparkIcon size={14} />{t("retro.sum.menu")}</>} side="r">
        {(close) =>
          SUMS.map(([k, label, hint]) => (
            <button key={k} type="button" role="menuitem" onClick={() => { close(); s.setSummaryKind(k); }}>
              <SparkIcon size={13} />
              {t(label)}
              <small>{t(hint)}</small>
            </button>
          ))
        }
      </PopMenu>
      <button type="button" className="rv-bt p" title={t("retro.new.buttonTitle")} onClick={() => s.openNew()}>
        <Plus {...i14} />
        {t("retro.new.button")}
      </button>
    </div>
  );
}
