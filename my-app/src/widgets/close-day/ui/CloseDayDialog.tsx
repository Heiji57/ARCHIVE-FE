import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { Todo } from "@/entities/todo/model/types";
import { USE_API } from "@/shared/api/config";
import { fromDateKey } from "@/shared/lib/date";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { SparkIcon } from "@/shared/ui/icons";
import { fmtLongDay, fmtMonthDayShort, formatKey, formatRange } from "@/widgets/calendar-dashboard";
import { repoName, useDayCommits } from "@/widgets/right-panel-tabs";
import {
  carryCandidates,
  carryDays,
  carryNotes,
  carryPlan,
  type CarryAnswer,
  type CarryNote,
} from "../model/carryPlan";
import { retroDraft } from "../model/retroDraft";

type Opt = { key: string; label: string; answer: CarryAnswer | "other"; note?: CarryNote };
interface Step {
  i: number;
  id: string;
  prev: CarryAnswer | undefined;
}

const minOf = (v?: string | null) => {
  const m = v ? /^(\d{1,2}):(\d{2})$/.exec(v) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/**
 * 하루 닫기(시안 carry3.js 22번 "묻고 답하기 두 단계"): 남은 일마다 내일 이어서 할지 묻고, 다른 날이면
 * 언제인지 한 번 더 묻는다. 숫자 키 1~4로 고르고 ⌫(또는 Z)로 되돌린다. 다 답하지 않아도 언제든
 * 마무리(답하지 않은 일은 내일로). 마무리하면 할 일을 옮기고 회고 초안을 보여 주며, "회고로 저장"은
 * 그날 일일 회고(createDailyEntry)에 초안을 넣는다.
 */
export function CloseDayDialog({ day, onClose }: { day: string; onClose(): void }) {
  const { t, locale } = useTranslation();
  const app = useArchiveApp();
  const { state, isDemo } = app;
  const commits = useDayCommits(day) ?? [];
  const ref = useRef<HTMLDialogElement>(null);

  // 묻는 동안 목록이 바뀌어도 처음 연 때의 남은 일로 묻는다.
  const [open] = useState<Todo[]>(() => carryCandidates(state.todos, day));
  const [answers, setAnswers] = useState<Record<string, CarryAnswer>>({});
  const [cur, setCur] = useState(0);
  const [q2, setQ2] = useState(false);
  const [hist, setHist] = useState<Step[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);

  const { tomorrow, later } = carryDays(day);
  const doneCount = state.todos.filter((x) => x.dateKey === day && x.status === "done").length;
  const dShort = (d: string) =>
    t("todos.close.dayShort", { dow: formatKey(locale, d, { weekday: "short" }), d: fromDateKey(d).getDate() });
  const nextMon = later[later.length - 1];
  const dayLabel = (d: string) => (d === nextMon && fromDateKey(d).getDay() === 1 ? t("todos.close.nextMon") : dShort(d));

  const where = (a: CarryAnswer | undefined) =>
    !a || (a.kind === "move" && a.dateKey === tomorrow)
      ? t("todos.close.where.tomorrow")
      : a.kind === "done"
        ? t("todos.close.where.done")
        : a.kind === "keep"
          ? t("todos.close.where.keep")
          : dayLabel(a.dateKey);
  const whereTo = (a: CarryAnswer) =>
    a.kind === "done"
      ? t("todos.close.whereTo.done")
      : a.kind === "keep"
        ? t("todos.close.whereTo.keep")
        : a.dateKey === tomorrow
          ? t("todos.close.whereTo.tomorrow")
          : t("todos.close.whereTo.day", { day: dayLabel(a.dateKey) });

  const noteText = (n: CarryNote) => {
    const k: Record<CarryNote["kind"], TranslationKey> = {
      duePassed: "todos.close.note.duePassed",
      dueSameDay: "todos.close.note.dueSameDay",
      dueToday: "todos.close.note.dueToday",
      dueTomorrow: "todos.close.note.dueTomorrow",
      gcal: "todos.close.note.gcal",
    };
    return t(k[n.kind], n.kind === "duePassed" ? { date: fmtMonthDayShort(locale, n.due) } : undefined);
  };
  const info = (x: Todo) => {
    const s = minOf(x.startTime);
    const e = minOf(x.endTime);
    return [
      t(x.status === "in-progress" ? "todos.close.info.doing" : "todos.close.info.todo"),
      s !== null ? formatRange(s, e !== null && e > s ? e : s + 60) : t("todos.close.info.noTime"),
      x.dueDate ? t("todos.close.info.due", { date: fmtMonthDayShort(locale, x.dueDate) }) : "",
      x.calendarLinked ? t("todos.close.info.gcal") : "",
    ]
      .filter(Boolean)
      .join(", ");
  };

  const target = (a: CarryAnswer) => (a.kind === "move" ? a.dateKey : a.kind === "keep" ? null : "done");
  const opt = (x: Todo, key: string, label: string, answer: CarryAnswer | "other"): Opt => ({
    key,
    label,
    answer,
    note: answer === "other" ? undefined : carryNotes(x, target(answer), day)[0],
  });

  const item = open[cur] as Todo | undefined;
  const opts: Opt[] = !item
    ? []
    : q2
      ? later.map((d) => opt(item, d, dayLabel(d), { kind: "move", dateKey: d }))
      : [
          opt(item, "tom", t("todos.close.yesTomorrow"), { kind: "move", dateKey: tomorrow }),
          opt(item, "other", t("todos.close.otherDay"), "other"),
          opt(item, "keep", t("todos.close.keep"), { kind: "keep" }),
          opt(item, "done", t("todos.close.done"), { kind: "done" }),
        ];
  const same = (a: CarryAnswer | undefined, b: CarryAnswer | "other") =>
    !!a && b !== "other" && a.kind === b.kind && (a.kind !== "move" || (b.kind === "move" && a.dateKey === b.dateKey));

  const nextOpen = (from: number, ans: Record<string, CarryAnswer>) => {
    for (let k = 0; k < open.length; k++) {
      const j = (from + k) % open.length;
      if (!ans[open[j].id]) return j;
    }
    return open.length;
  };

  const decide = (x: Todo, a: CarryAnswer) => {
    const next = { ...answers, [x.id]: a };
    setHist((h) => [...h, { i: cur, id: x.id, prev: answers[x.id] }]);
    setAnswers(next);
    setQ2(false);
    setLast(t("todos.close.decided", { title: x.title, where: whereTo(a) }));
    setCur(nextOpen(open.indexOf(x) + 1, next));
  };
  const undo = () => {
    const h = hist[hist.length - 1];
    if (!h) return;
    setHist(hist.slice(0, -1));
    setAnswers((m) => {
      const n = { ...m };
      if (h.prev) n[h.id] = h.prev;
      else delete n[h.id];
      return n;
    });
    setCur(h.i);
    setQ2(false);
    setLast(hist.length > 1 ? t("todos.close.undone") : null);
  };
  const pick = (o: Opt) => {
    if (!item) return;
    if (o.answer === "other") setQ2(true);
    else decide(item, o.answer);
  };

  // 열기, 닫으면 연 곳으로 포커스
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const back = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    return () => {
      if (back?.isConnected) back.focus();
    };
  }, []);
  // 단계가 바뀌면 첫 고르기(없으면 마무리 버튼)로
  useEffect(() => {
    const d = ref.current;
    d?.querySelector<HTMLElement>("[data-opt], [data-main]")?.focus();
  }, [cur, q2, draft]);

  const finish = () => {
    const plan = carryPlan(state.todos, day, answers);
    // 1차: 할 일 PATCH 를 차례로 보낸다. 서버에 묶음 변경(be-request, `todoBatch`)이 생기면 여기서 한 번에.
    for (const p of plan) {
      if ("status" in p.patch) app.updateTodo(p.id, { status: "done" });
      else if (p.patch.dateKey) app.moveTodo(p.id, p.patch.dateKey);
    }
    const closed = new Set(plan.filter((p) => "status" in p.patch).map((p) => p.id));
    setDraft(
      retroDraft({
        title: fmtLongDay(locale, day),
        done: state.todos.filter((x) => x.dateKey === day && (x.status === "done" || closed.has(x.id))).map((x) => x.title),
        commits: commits.map((c) => ({ message: c.message, repo: repoName(c) })),
        carried: plan.length - closed.size,
        closed: closed.size,
        labels: {
          done: t("todos.close.draft.done"),
          commits: t("todos.close.draft.commits"),
          none: t("todos.close.draft.none"),
          carried: (n) => t("todos.close.draft.carried", { n }),
          closed: (n) => t("todos.close.draft.closed", { n }),
          learned: t("todos.close.draft.learned"),
        },
      }),
    );
  };

  const save = () => {
    if (draft === null) return;
    const existing = state.entries.find((e) => e.dateKey === day && e.retroType === "daily" && !e.isSummary);
    if (existing) {
      app.updateEntry(existing.id, { content: existing.content ? `${existing.content}\n\n${draft}` : draft });
    } else {
      // 기존 회고 생성 액션. 실제 모드는 서버 id 로 바뀐 뒤 본문을 적는다(로컬 id 로 PUT 하지 않게).
      const apiActive = USE_API && !isDemo;
      const { entry } = app.createDailyEntry(day, apiActive ? (s) => app.updateEntry(s.id, { content: draft }) : undefined);
      if (!apiActive) app.updateEntry(entry.id, { content: draft });
    }
    app.pushNotification("success", t("todos.close.saved"), t("todos.close.savedDetail"));
    onClose();
  };

  const onKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (draft !== null || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === "Backspace" || e.key.toLowerCase() === "z") && hist.length) {
      e.preventDefault();
      undo();
      return;
    }
    if (/^[1-4]$/.test(e.key) && opts[Number(e.key) - 1]) {
      e.preventDefault();
      pick(opts[Number(e.key) - 1]);
    }
  };

  const undecided = open.filter((x) => !answers[x.id]).length;
  const decided = open.filter((x) => answers[x.id]);

  return (
    <dialog
      ref={ref}
      className="cd-dlg"
      aria-labelledby="cd-h"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKey}
    >
      {draft === null ? (
        <div className="cd">
          <h2 id="cd-h">{t("todos.close.title", { date: fmtLongDay(locale, day) })}</h2>
          <p className="cd-lead">
            {t("todos.close.lead", { done: doneCount, commits: commits.length, n: open.length })}
          </p>
          {!open.length ? (
            <p className="cd-none">{t("todos.close.none")}</p>
          ) : (
            <div className="cd-q22">
              {decided.length ? (
                <div className="cd-trail" role="group" aria-label={t("todos.close.trailAria")}>
                  {decided.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => {
                        setCur(open.indexOf(x));
                        setQ2(false);
                      }}
                    >
                      <span>{x.title}</span>
                      <b>{where(answers[x.id])}</b>
                      <em>{t("todos.close.change")}</em>
                    </button>
                  ))}
                </div>
              ) : null}
              {item ? (
                <div className="cd-ask">
                  {q2 ? (
                    <p className="cd-askq">{t("todos.close.askWhen")}</p>
                  ) : (
                    <>
                      <p className="cd-askq">{t("todos.close.ask", { title: item.title })}</p>
                      <p className="cd-info">{info(item)}</p>
                    </>
                  )}
                  <div className="cd-opts">
                    {opts.map((o, k) => {
                      const on = same(answers[item.id], o.answer);
                      return (
                        <button
                          key={o.key}
                          type="button"
                          data-opt=""
                          className={on ? "on" : undefined}
                          aria-pressed={on}
                          onClick={() => pick(o)}
                        >
                          <span>
                            <kbd>{k + 1}</kbd>
                            {o.label}
                          </span>
                          {o.note ? <small className={o.note.tone}>{noteText(o.note)}</small> : null}
                        </button>
                      );
                    })}
                  </div>
                  {q2 ? (
                    <button type="button" className="cd-lnk" onClick={() => setQ2(false)}>
                      {t("todos.close.back")}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="cd-ok">{t("todos.close.allDone")}</p>
              )}
              {hist.length ? (
                <p className="cd-undo">
                  <span>{last}</span>
                  <button type="button" onClick={undo}>
                    <kbd>⌫</kbd>
                    {t("todos.close.undo")}
                  </button>
                </p>
              ) : null}
            </div>
          )}
          <div className="cd-foot">
            <button type="button" className="sh-btn" onClick={onClose}>
              {t("todos.close.cancel")}
            </button>
            <button type="button" className="sh-btn sh-btn-p" data-main="" onClick={finish}>
              <SparkIcon size={14} />
              {undecided && open.length ? t("todos.close.makeRest", { n: undecided }) : t("todos.close.make")}
            </button>
          </div>
        </div>
      ) : (
        <div className="cd">
          <h2 id="cd-h">{t("todos.close.draftTitle")}</h2>
          <pre className="cd-pre">{draft}</pre>
          <div className="cd-foot">
            <button type="button" className="sh-btn" onClick={onClose}>
              {t("todos.close.closeBtn")}
            </button>
            <button type="button" className="sh-btn sh-btn-p" data-main="" onClick={save}>
              {t("todos.close.save")}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
