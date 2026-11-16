/** 명령 팔레트(Ctrl+K)의 순수 로직. 시안 rest.js 의 검색(범위 탭, cp 4). */

export type PaletteTab = "all" | "todo" | "retro" | "cmd";
export const PALETTE_TABS: readonly PaletteTab[] = ["all", "todo", "retro", "cmd"];

type Dated = { id: string; dateKey: string };
type Labeled = { id: string; label: string };

export type PaletteGroup<T extends Dated, E extends Dated, C extends Labeled> =
  | { kind: "todo"; items: T[] }
  | { kind: "retro"; items: E[] }
  | { kind: "cmd"; items: C[] };

const DAY = 86_400_000;
const toTime = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));

/**
 * 묶음을 만든다.
 * - 검색어가 없으면: 날짜가 오늘에 가까운 할 일 3개, 최근 회고 2개, 명령 5개.
 * - 검색어가 있으면: 이미 찾은 할 일 6개, 회고 4개(받은 순서), 이름에 검색어가 든 명령 4개.
 * 빈 묶음은 뺀다.
 */
export function buildPaletteGroups<T extends Dated, E extends Dated, C extends Labeled>(input: {
  q: string;
  tab: PaletteTab;
  todos: T[];
  entries: E[];
  commands: C[];
  today: string;
}): Array<PaletteGroup<T, E, C>> {
  const q = input.q.trim().toLowerCase();
  const now = toTime(input.today);
  const todos = q
    ? input.todos.slice(0, 6)
    : input.todos
        .filter((t) => t.dateKey)
        .map((t, i) => ({ t, i, d: Math.abs(toTime(t.dateKey) - now) }))
        .sort((a, b) => a.d - b.d || a.i - b.i)
        .slice(0, 3)
        .map((x) => x.t);
  const entries = q
    ? input.entries.slice(0, 4)
    : [...input.entries].sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0)).slice(0, 2);
  const commands = q
    ? input.commands.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 4)
    : input.commands.slice(0, 5);

  const all: Array<PaletteGroup<T, E, C>> = [
    { kind: "todo", items: todos },
    { kind: "retro", items: entries },
    { kind: "cmd", items: commands },
  ];
  const pick = input.tab === "all" ? all : all.filter((g) => g.kind === input.tab);
  return pick.filter((g) => g.items.length > 0);
}

export function cyclePaletteTab(tab: PaletteTab, dir: 1 | -1): PaletteTab {
  const n = PALETTE_TABS.length;
  return PALETTE_TABS[(PALETTE_TABS.indexOf(tab) + dir + n) % n];
}

/** 오늘 기준 상대 날짜 이름. */
export function relativeDay(dateKey: string, today: string): "today" | "yesterday" | "tomorrow" | null {
  const d = Math.round((toTime(dateKey) - toTime(today)) / DAY);
  return d === 0 ? "today" : d === -1 ? "yesterday" : d === 1 ? "tomorrow" : null;
}
