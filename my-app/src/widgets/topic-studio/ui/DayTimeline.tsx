import { Fragment } from "react";
import type { DemoTopicEntry } from "@/entities/topic/model/demo";
import type { GitHubCommit } from "@/entities/github/model/types";
import type { TopicSourceMap } from "@/entities/topic/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { entryTitle, md2, plainText, todoKind, todoStatusText, weekOfMonth, weekdayName } from "../model/format";
import { addDaysKey, type TimelineDay, type TimelineItem, type TimelineWeek } from "../model/structured";
import { themeColorStyle } from "../model/viewHelpers";
import { CheckDot, Chevron, CommitGlyph, KindIcon, MiniMarkdown } from "./parts";

export interface DayTimelineProps {
  weeks: TimelineWeek[];
  today: string;
  sources: TopicSourceMap;
  /** 회고 원문(없으면 인용과 원문을 빼고 열기만) */
  entries: Record<string, DemoTopicEntry>;
  commits: GitHubCommit[];
  onOpenEntry: (id: string) => void;
}

/**
 * 흐름(시안 tcD5, LG=1, SK=3): 왼쪽 세로 선 위에 주 이름, 하루가 카드 한 장.
 * 카드 안 한 일은 [종류 아이콘 | 한 일과 근거 이름 | 큰 주제] 열. 회고가 있는 날은 인용 한 줄과 "자세히 보기".
 */
export function DayTimeline({ weeks, today, sources, entries, commits, onOpenEntry }: DayTimelineProps) {
  const { t } = useTranslation();
  // 가장 최근의 회고가 있는 지난날 하나만 처음부터 펼친다
  const firstOpen = weeks.flatMap((w) => w.days).find((d) => !d.future && d.entryIds.length)?.dateKey;
  const weekLabel = (w: TimelineWeek) =>
    w.weekLabel === "upcoming"
      ? t("topic.v.week.upcoming")
      : w.weekLabel === "thisWeek"
        ? t("topic.v.week.thisWeek")
        : w.weekLabel === "lastWeek"
          ? t("topic.v.week.lastWeek")
          : t("topic.v.week.nth", { m: +w.weekLabel.slice(5, 7), w: weekOfMonth(w.weekLabel) });
  return (
    <ol className="tD tD5 lg">
      {weeks.map((w) => (
        <Fragment key={w.weekLabel}>
          <li className="tD5-wk">
            <b>{weekLabel(w)}</b>
            {w.weekStart ? (
              <small>
                {md2(w.weekStart)} – {md2(addDaysKey(w.weekStart, 6))}
              </small>
            ) : null}
          </li>
          {w.days.map((d) => (
            <Day
              key={d.dateKey}
              day={d}
              today={today}
              sources={sources}
              entries={entries}
              commits={commits}
              defaultOpen={d.dateKey === firstOpen}
              onOpenEntry={onOpenEntry}
            />
          ))}
        </Fragment>
      ))}
    </ol>
  );
}

function Day({
  day,
  today,
  sources,
  entries,
  commits,
  defaultOpen,
  onOpenEntry,
}: {
  day: TimelineDay;
  today: string;
  sources: TopicSourceMap;
  entries: Record<string, DemoTopicEntry>;
  commits: GitHubCommit[];
  defaultOpen: boolean;
  onOpenEntry: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const d = day.dateKey;
  const has = day.entryIds.length > 0;
  const es = day.entryIds.map((id) => entries[id]).filter(Boolean);
  const kd = day.future ? t("topic.v.day.planned") : has ? t("topic.v.count.entries", { n: day.entryIds.length }) : t("topic.v.day.todo");
  return (
    <li className={`tD-day${day.future ? " fut" : ""}${has ? " has" : ""}`}>
      <i className="node" aria-hidden="true" />
      <div className="cd">
        <div className="q-num">
          <b>{+d.slice(8, 10)}</b>
          <small>
            {t("topic.v.day.sub", { m: +d.slice(5, 7), dow: weekdayName(d, locale) })}
            {d === today ? t("topic.v.day.today") : ""}
          </small>
          <span className="sp" />
          <span className="kd">{kd}</span>
        </div>
        <div className="tD-b">
          {day.items.map((x, i) => (
            <DayItem key={i} item={x} onOpenEntry={onOpenEntry} />
          ))}
          {es.map((e) => (
            <button key={e.id} type="button" className="qt" onClick={() => onOpenEntry(e.id)}>
              <span>{plainText(e.body)}</span>
            </button>
          ))}
        </div>
        {has ? (
          <More dateKey={d} entryIds={day.entryIds} sources={sources} entries={entries} commits={commits} defaultOpen={defaultOpen} onOpenEntry={onOpenEntry} />
        ) : null}
      </div>
    </li>
  );
}

function DayItem({ item, onOpenEntry }: { item: TimelineItem; onOpenEntry: (id: string) => void }) {
  const { t } = useTranslation();
  const info = item.info;
  const kind = !info ? "open" : info.kind === "entry" ? "r" : todoKind(info.status);
  const cls = !info ? "k-gone gone" : info.kind === "entry" ? "k-r" : `k-${kind}`;
  const why = !info ? t("topic.v.deleted") : info.kind === "entry" ? t("topic.v.why.entry") : t("topic.v.why.todo", { status: todoStatusText(t, info.status) });
  return (
    <div className={`tD-it lgi ${cls}`} data-th={item.themeKey} style={themeColorStyle(item.themeIndex)}>
      <span className="gut" title={why}>
        <KindIcon kind={kind} />
      </span>
      <div className="b">
        <p>{item.text}</p>
        <span className="ks">
          {!info ? (
            <span className="kn">{t("topic.v.deleted")}</span>
          ) : info.kind === "entry" ? (
            <button type="button" className="kn" onClick={() => onOpenEntry(item.source.id)}>
              {entryTitle(t, info)}
            </button>
          ) : (
            <>
              <span className="kn">{info.title}</span>
              <em>{todoStatusText(t, info.status)}</em>
            </>
          )}
        </span>
      </div>
      <span className="thc">{item.themeName}</span>
    </div>
  );
}

/** 자세히 보기(시안 tvMore): 그날 회고 전문, 커밋, 할 일 */
function More({
  dateKey,
  entryIds,
  sources,
  entries,
  commits,
  defaultOpen,
  onOpenEntry,
}: {
  dateKey: string;
  entryIds: string[];
  sources: TopicSourceMap;
  entries: Record<string, DemoTopicEntry>;
  commits: GitHubCommit[];
  defaultOpen: boolean;
  onOpenEntry: (id: string) => void;
}) {
  const { t } = useTranslation();
  const todos = Object.values(sources).filter((s) => s.kind === "todo" && s.dateKey === dateKey);
  const commitsOf = (id: string) => {
    const e = entries[id];
    if (!e) return [];
    const set = new Set(e.commitShas);
    return commits.filter((c) => set.has(c.sha));
  };
  const cm = entryIds.reduce((a, id) => a + commitsOf(id).length, 0);
  const sum = [
    t("topic.v.count.entries", { n: entryIds.length }),
    cm ? t("topic.v.count.commits", { n: cm }) : "",
    todos.length ? t("topic.v.count.todos", { n: todos.length }) : "",
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <details className="mr" open={defaultOpen}>
      <summary>
        <span>{t("topic.v.more.title")}</span>
        <small>{sum}</small>
        <Chevron />
      </summary>
      <div className="mr-in">
        {entryIds.map((id) => {
          const info = sources[id];
          if (!info || info.kind !== "entry") return null;
          const e = entries[id];
          const cs = commitsOf(id);
          return (
            <section key={id} className="mr-r">
              <header>
                <span className={`k k-${info.retroType}`}>{t("topic.v.more.kind", { kind: t(`topic.v.retro.${info.retroType}`) })}</span>
                <b>{entryTitle(t, info)}</b>
                <span className="sp" />
                <button type="button" className="q-bt" onClick={() => onOpenEntry(id)}>
                  {t("topic.v.more.open")}
                </button>
              </header>
              {e ? <MiniMarkdown className="mr-b" source={e.body} /> : null}
              {cs.length ? (
                <>
                  <p className="mr-h">{t("topic.v.more.commits")}</p>
                  <ul className="mr-c">
                    {cs.map((c) => (
                      <li key={c.sha}>
                        <CommitGlyph />
                        <code>{c.message.split("\n")[0]}</code>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          );
        })}
        {todos.length ? (
          <section className="mr-t">
            <p className="mr-h">{t("topic.v.more.todos")}</p>
            <ul>
              {todos.map((x, i) =>
                x.kind === "todo" ? (
                  <li key={i}>
                    <CheckDot status={x.status} />
                    <span>{x.title}</span>
                    <small>{todoStatusText(t, x.status)}</small>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  );
}
