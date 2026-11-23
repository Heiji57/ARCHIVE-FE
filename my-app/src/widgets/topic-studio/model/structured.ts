/**
 * 구조화 정리 결과(06-topic §1)를 화면 모양으로 바꾸는 순수 함수.
 * 시안 d-retro2.html 의 tvItems, tcD5(주 이름, 하루 카드), tvSlide(최근에 한 일), tvCnt, thSpan 을 옮겼다.
 */
import type {
  Topic,
  TopicSourceInfo,
  TopicSourceMap,
  TopicSourceRef,
  TopicStructured,
  TopicTheme,
} from "@/entities/topic/model/types";

// ─── dateKey 계산 (UTC 로 해서 시간대와 무관) ───────────────────────────────────

const DAY_MS = 86_400_000;
const utc = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
export const addDaysKey = (k: string, n: number) => new Date(utc(k) + n * DAY_MS).toISOString().slice(0, 10);
export const dayOfWeek = (k: string) => new Date(utc(k)).getUTCDay();
/** k 가 들어 있는 주의 첫날. weekStartsOn 0 = 일요일(시안 기본), 1 = 월요일 */
export const weekStartOf = (k: string, weekStartsOn: 0 | 1 = 0) =>
  addDaysKey(k, -((dayOfWeek(k) - weekStartsOn + 7) % 7));

// ─── 항목 ───────────────────────────────────────────────────────────────────────

export interface TimelineItem {
  dateKey: string;
  text: string;
  themeKey: string;
  themeName: string;
  /** 큰 주제 순서(색 --th{i%4+1}) */
  themeIndex: number;
  source: TopicSourceRef;
  /** null 이면 지운 근거 */
  info: TopicSourceInfo | null;
}

/** 모든 큰 주제의 항목을 날짜 순(같은 날은 큰 주제 순, 그다음 원래 순서)으로. 시안 tvItems. */
export function flattenItems(s: TopicStructured, sources: TopicSourceMap): TimelineItem[] {
  const out: Array<TimelineItem & { k: number }> = [];
  s.themes.forEach((th, i) =>
    th.items.forEach((it, k) =>
      out.push({
        dateKey: it.dateKey,
        text: it.text,
        themeKey: th.key,
        themeName: th.name,
        themeIndex: i,
        source: it.source,
        info: sources[it.source.id] ?? null,
        k,
      }),
    ),
  );
  out.sort((a, b) =>
    a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : a.themeIndex - b.themeIndex || a.k - b.k,
  );
  return out.map((x) => {
    const { k, ...rest } = x;
    void k;
    return rest;
  });
}

// ─── 흐름(주 이름이 붙은 하루 카드) ──────────────────────────────────────────────

export interface TimelineDay {
  dateKey: string;
  items: TimelineItem[];
  /** 그날 항목이 가리키는 회고 id(중복 없이, 나온 순서) */
  entryIds: string[];
  future: boolean;
  today: boolean;
}

export interface TimelineWeek {
  /** "upcoming"(오늘 뒤 전부), "thisWeek", "lastWeek", 그 밖은 주 첫날 dateKey */
  weekLabel: "upcoming" | "thisWeek" | "lastWeek" | string;
  /** 주 첫날. "upcoming" 이면 null */
  weekStart: string | null;
  days: TimelineDay[];
}

export interface TimelineOptions {
  /** 고른 큰 주제만 (null/undefined 면 전체) */
  themeKey?: string | null;
  weekStartsOn?: 0 | 1;
}

/**
 * 하루가 카드 한 장인 흐름. 최근 날이 위, 오늘 뒤의 날은 맨 위 "앞으로 할 일" 한 묶음.
 * 큰 주제를 고르면 그 주제 항목만 남기고, 항목이 없는 날과 주는 뺀다.
 */
export function toTimeline(
  s: TopicStructured,
  sources: TopicSourceMap,
  today: string,
  opts: TimelineOptions = {},
): TimelineWeek[] {
  const wso = opts.weekStartsOn ?? 0;
  const items = flattenItems(s, sources).filter((x) => !opts.themeKey || x.themeKey === opts.themeKey);
  const dayKeys = [...new Set(items.map((x) => x.dateKey))].sort().reverse();
  const thisWeek = weekStartOf(today, wso);
  const lastWeek = addDaysKey(thisWeek, -7);
  const weeks: TimelineWeek[] = [];
  for (const d of dayKeys) {
    const xs = items.filter((x) => x.dateKey === d);
    const day: TimelineDay = {
      dateKey: d,
      items: xs,
      entryIds: [...new Set(xs.filter((x) => x.source.kind === "entry").map((x) => x.source.id))],
      future: d > today,
      today: d === today,
    };
    const ws = weekStartOf(d, wso);
    const label = d > today ? "upcoming" : ws === thisWeek ? "thisWeek" : ws === lastWeek ? "lastWeek" : ws;
    const last = weeks[weeks.length - 1];
    if (last && last.weekLabel === label) last.days.push(day);
    else weeks.push({ weekLabel: label, weekStart: label === "upcoming" ? null : ws, days: [day] });
  }
  return weeks;
}

/** 좌우로 넘기기의 "최근에 한 일": 오늘까지 항목을 최근 순으로 n 개. 시안 tvSlide. */
export function recentItems(
  s: TopicStructured,
  sources: TopicSourceMap,
  today: string,
  n = 5,
): TimelineItem[] {
  return flattenItems(s, sources)
    .filter((x) => x.dateKey <= today)
    .reverse()
    .slice(0, n);
}

// ─── 수와 기간 ──────────────────────────────────────────────────────────────────

/** 큰 주제의 근거 회고 수(중복 없이)와 할 일 항목 수. 시안 tvCnt. */
export function themeCounts(th: TopicTheme): { entries: number; todos: number } {
  const es = new Set(th.items.filter((x) => x.source.kind === "entry").map((x) => x.source.id));
  return { entries: es.size, todos: th.items.filter((x) => x.source.kind === "todo").length };
}

/** 큰 주제 항목의 처음과 마지막 날짜. 시안 thSpan. */
export function themeSpan(th: TopicTheme): [string, string] | null {
  const ds = th.items.map((x) => x.dateKey).sort();
  return ds.length ? [ds[0], ds[ds.length - 1]] : null;
}

/** 정리 결과의 항목 수 */
export function itemCount(s: TopicStructured): number {
  return s.themes.reduce((a, th) => a + th.items.length, 0);
}

/** 근거 회고 날짜(주간, 월간은 정보의 날짜)로 본 기간. 서버 period_* 가 없을 때 쓴다. */
export function entrySpan(s: TopicStructured, sources: TopicSourceMap): [string, string] | null {
  const ds = flattenItems(s, sources)
    .filter((x) => x.source.kind === "entry")
    .map((x) => x.dateKey)
    .sort();
  return ds.length ? [ds[0], ds[ds.length - 1]] : null;
}

// ─── 주제 색 ────────────────────────────────────────────────────────────────────

/**
 * 주제 색 번호(0..3 → --tpc1..4). 목록 위치가 아니라 createdAt 순서로 4색을 돌려 쓴다(06-topic §5).
 * `prev`(이전에 정한 색)를 넘기면 남아 있는 주제는 그 색을 그대로 쓰고, 새 주제만
 * createdAt 순서로 가장 적게 쓰인 색(같으면 돌려 쓰는 다음 색)을 받는다. 그래서 주제를 지워도 다른 주제 색이 그대로다.
 */
export function assignTopicColors(
  topics: Pick<Topic, "id" | "createdAt">[],
  prev: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const sorted = [...topics].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1,
  );
  const out: Record<string, number> = {};
  const used = [0, 0, 0, 0];
  for (const t of sorted) {
    const p = prev[t.id];
    if (p != null && p >= 0 && p < 4) {
      out[t.id] = p;
      used[p] += 1;
    }
  }
  let next = 0;
  for (const t of sorted) {
    if (out[t.id] != null) {
      next = (out[t.id] + 1) % 4;
      continue;
    }
    const min = Math.min(...used);
    let c = next;
    while (used[c] !== min) c = (c + 1) % 4;
    out[t.id] = c;
    used[c] += 1;
    next = (c + 1) % 4;
  }
  return out;
}

export function topicColorIndex(
  topics: Pick<Topic, "id" | "createdAt">[],
  id: string,
  prev?: Readonly<Record<string, number>>,
): number {
  return assignTopicColors(topics, prev)[id] ?? 0;
}
