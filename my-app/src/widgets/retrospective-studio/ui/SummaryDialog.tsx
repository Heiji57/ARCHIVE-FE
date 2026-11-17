import { useEffect, useMemo, useRef, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { SummaryKind, SummaryReadiness } from "@/entities/summary/model/types";
import { fromDateKey, LOCALE_TAG } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { KIND_KEY, monthName } from "../model/format";
import { buildPeriodOptions } from "../model/periods";
import { retroPeriod, summaryWeekNo } from "../model/retroList";
import { useRetroStudio } from "../model/retroStudio";

const COUNT: Record<SummaryKind, number> = { weekly: 4, monthly: 3, yearly: 2 };
const KINDS: SummaryKind[] = ["weekly", "monthly", "yearly"];

type Step = { kind: "pick" } | { kind: "over" } | { kind: "thin"; readiness: SummaryReadiness; force: boolean };

/**
 * 요약 만들기 창(시안 q-dlg): 종류 고르기, 기간 목록(진행 중, 요약 있음), Enter 로 만들기.
 * 이미 있으면 덮어쓰기 확인, 데이터가 적으면(월간, 연간) 그대로 만들지 확인 — 같은 창 안에서 바뀐다.
 */
export function SummaryDialog({ initialKind }: { initialKind: SummaryKind }) {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const { state, isDemo, pushNotification, checkRetroExists, checkSummaryReadiness, startSummary } = useArchiveApp();
  const ref = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState(initialKind);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [busy, setBusy] = useState(false);
  const goRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  useEffect(() => {
    goRef.current?.focus();
  }, [step.kind]);

  const opts = useMemo(() => buildPeriodOptions(kind, fromDateKey(s.today)).slice(0, COUNT[kind]), [kind, s.today]);
  const has = (start: string) => state.entries.some((e) => e.isSummary && e.retroType === kind && retroPeriod(e.retroType, e.dateKey).start === start);
  const tag = LOCALE_TAG[locale];
  const label = (start: string, end: string) => {
    if (kind === "weekly") {
      const w = summaryWeekNo(end);
      const md = (k: string) => `${+k.slice(5, 7)}/${+k.slice(8, 10)}`;
      return t("retro.sd.weekOpt", { m: w.month, n: w.week, monthName: monthName(locale, w.month), range: `${md(start)} ~ ${md(end)}` });
    }
    const d = fromDateKey(start);
    return kind === "monthly"
      ? new Intl.DateTimeFormat(tag, { year: "numeric", month: "long" }).format(d)
      : new Intl.DateTimeFormat(tag, { year: "numeric" }).format(d);
  };

  const opt = opts[idx];
  const run = async (force: boolean, skipReadiness = false) => {
    if (!opt) return;
    if (isDemo) {
      pushNotification("info", t("demo.locked.title"), t("demo.locked.message"), { actionLabel: t("demo.locked.action"), actionHref: "/login" });
      s.setSummaryKind(null);
      return;
    }
    setBusy(true);
    try {
      if (!force && (await checkRetroExists(kind, opt.periodStart, opt.periodEnd))) {
        setStep({ kind: "over" });
        return;
      }
      if (!skipReadiness) {
        const r = await checkSummaryReadiness(kind, opt.periodStart);
        if (r && r.recommendation === "insufficient") {
          setStep({ kind: "thin", readiness: r, force });
          return;
        }
      }
      startSummary(kind, opt.periodEnd, opt.periodStart, force);
      s.setSummaryKind(null);
    } finally {
      setBusy(false);
    }
  };

  const close = () => s.setSummaryKind(null);

  return (
    <dialog
      ref={ref}
      className="rv-dlg"
      aria-label={t("retro.sd.title")}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="rv-sd">
        {step.kind === "pick" ? (
          <>
            <h3>{t("retro.sd.title")}</h3>
            <p>{t("retro.sd.desc")}</p>
            <div className="sg" role="group" aria-label={t("retro.sd.kinds")}>
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k);
                    setIdx(0);
                  }}
                >
                  {t(KIND_KEY[k])}
                </button>
              ))}
            </div>
            <div
              className="ops"
              role="listbox"
              aria-label={t("retro.sd.periods")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void run(false);
                  return;
                }
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                e.preventDefault();
                const n = (idx + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
                setIdx(n);
                (e.currentTarget.children[n] as HTMLElement | undefined)?.focus();
              }}
            >
              {opts.map((o, i) => {
                const now = o.periodStart <= s.today && o.periodEnd >= s.today;
                return (
                  <button key={o.periodStart} type="button" role="option" aria-selected={idx === i} tabIndex={idx === i ? 0 : -1} onClick={() => setIdx(i)} onDoubleClick={() => void run(false)}>
                    {label(o.periodStart, o.periodEnd)}
                    {now ? <small className="now">{t("retro.sd.now")}</small> : has(o.periodStart) ? <small className="has">{t("retro.sd.has")}</small> : <small />}
                  </button>
                );
              })}
            </div>
            <Foot hint={t("retro.sd.enterHint")} go={t("retro.sd.go")} cancel={t("retro.nd.cancel")} goRef={goRef} busy={busy} onCancel={close} onGo={() => void run(false)} />
          </>
        ) : step.kind === "over" ? (
          <>
            <h3>{t("retro.overwrite.title")}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{t("retro.overwrite.message")}</p>
            <Foot hint={t("retro.sd.overHint")} go={t("retro.overwrite.confirm")} cancel={t("retro.overwrite.cancel")} goRef={goRef} busy={busy} onCancel={close} onGo={() => void run(true)} />
          </>
        ) : (
          <>
            <h3>{t("retro.readiness.title")}</h3>
            <p style={{ whiteSpace: "pre-line" }}>
              {t(kind === "yearly" ? "retro.readiness.annualMessage" : "retro.readiness.monthlyMessage", {
                covered: step.readiness.coveredUnits,
                expected: step.readiness.expectedUnits,
                year: new Date(step.readiness.periodStart).getFullYear(),
              })}
            </p>
            <Foot
              hint={t("retro.sd.forceHint")}
              go={t("retro.readiness.generate")}
              cancel={t("retro.readiness.writeMore")}
              goRef={goRef}
              busy={busy}
              onCancel={() => {
                close();
                s.openNew();
              }}
              onGo={() => void run(step.force, true)}
            />
          </>
        )}
      </div>
    </dialog>
  );
}

function Foot({ hint, go, cancel, onGo, onCancel, goRef, busy }: { hint: string; go: string; cancel: string; onGo: () => void; onCancel: () => void; goRef: React.RefObject<HTMLButtonElement | null>; busy: boolean }) {
  return (
    <div className="nd-ft">
      <span className="nd-hint">{hint}</span>
      <span className="sp" />
      <button type="button" className="rv-bt" onClick={onCancel}>
        {cancel}
      </button>
      <button type="button" className="rv-bt p" ref={goRef} disabled={busy} onClick={onGo}>
        {go}
      </button>
    </div>
  );
}
