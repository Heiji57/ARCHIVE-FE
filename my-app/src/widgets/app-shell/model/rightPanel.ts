import { createContext, useContext, type ReactNode } from "react";
import type { AppRoute } from "@/app/model/types";
import type { TranslationKey } from "@/shared/lib/i18n";

/**
 * 오른쪽 패널(캘린더, 할 일 화면의 오른쪽 칸) 탭.
 * 탭 내용은 다른 Task 가 registerRightPanelTab 으로 등록한다(Task 8: day ~ commits, Task 10: ai).
 */
export type RightPanelTab = "day" | "timeline" | "unscheduled" | "due" | "commits" | "ai";

/** 탭 글자 줄 순서(시안 순서). "ai" 는 글자 줄에 없고 오른쪽 줄의 AI 추천 버튼으로 연다. */
export const RIGHT_PANEL_TABS: readonly RightPanelTab[] = [
  "day",
  "timeline",
  "unscheduled",
  "due",
  "commits",
  "ai",
];

export interface RightPanelContext {
  route: AppRoute;
  githubOn: boolean;
}

export interface RightPanelTabDef {
  labelKey: TranslationKey;
  /**
   * 탭 글자 옆 숫자. null 이면 숫자 없음.
   * 탭마다 작은 컴포넌트 안에서 늘 같은 순서로 불리므로 안에서 훅을 써도 된다.
   */
  count?: () => number | null;
  /** 숫자를 경고 색으로(예: 지난 마감이 있을 때). count 와 같은 컴포넌트 안에서 불린다. */
  countWarn?: () => boolean;
  /** 패널 내용. 컴포넌트 안에서 불리므로 `() => <DayTab />` 처럼 컴포넌트를 돌려주는 것을 권한다. */
  render: () => ReactNode;
  /** 이 탭을 보일지. 없으면 늘 보인다. 훅을 쓰지 않는 순수 함수여야 한다. */
  visible?: (ctx: RightPanelContext) => boolean;
}

const empty = () => null;

/** Task 8 이 등록하기 전까지 보이는 틀(탭 이름과 빈 내용). */
const DEFAULT_DEFS: Partial<Record<RightPanelTab, RightPanelTabDef>> = {
  day: { labelKey: "shell.panel.tab.day", render: empty },
  timeline: { labelKey: "shell.panel.tab.timeline", render: empty, visible: (c) => c.route === "todos" },
  unscheduled: { labelKey: "shell.panel.tab.unscheduled", render: empty },
  due: { labelKey: "shell.panel.tab.due", render: empty },
  commits: { labelKey: "shell.panel.tab.commits", render: empty, visible: (c) => c.githubOn },
};

const registered = new Map<RightPanelTab, RightPanelTabDef>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

/**
 * 탭을 등록(같은 탭을 다시 등록하면 덮어씀). 돌려준 함수를 부르면 해제되고 기본 틀로 돌아간다.
 * 모듈을 불러올 때 한 번 부르면 된다(예: 위젯 index.ts).
 */
export function registerRightPanelTab(tab: RightPanelTab, def: RightPanelTabDef): () => void {
  registered.set(tab, def);
  emit();
  return () => {
    if (registered.get(tab) !== def) return;
    registered.delete(tab);
    emit();
  };
}

export function getRightPanelTabDef(tab: RightPanelTab): RightPanelTabDef | undefined {
  return registered.get(tab) ?? DEFAULT_DEFS[tab];
}

export function subscribeRightPanelTabs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** useSyncExternalStore 용 스냅샷. */
export function getRightPanelTabsVersion(): number {
  return version;
}

function isVisible(tab: RightPanelTab, ctx: RightPanelContext): boolean {
  const def = getRightPanelTabDef(tab);
  if (!def) return false;
  return def.visible ? def.visible(ctx) : true;
}

/** 탭 글자 줄에 보일 탭(순서대로, "ai" 제외). */
export function listRowTabs(ctx: RightPanelContext): RightPanelTab[] {
  return RIGHT_PANEL_TABS.filter((t) => t !== "ai" && isVisible(t, ctx));
}

/** "ai" 탭이 등록돼 있고 보이는지(오른쪽 줄의 AI 추천 버튼 표시 여부). */
export function isAiTabAvailable(ctx: RightPanelContext): boolean {
  return isVisible("ai", ctx);
}

/** 고른 탭이 지금 보이지 않으면 글자 줄의 첫 탭으로. */
export function resolveActiveTab(tab: RightPanelTab, ctx: RightPanelContext): RightPanelTab {
  if (isVisible(tab, ctx)) return tab;
  return listRowTabs(ctx)[0] ?? "day";
}

/**
 * 오른쪽 줄(아이콘 줄)의 추가 버튼. 패널 버튼과 AI 추천 버튼 다음, 알림 벨 앞에 order 순으로 놓인다.
 * 예: Task 8 의 "오늘 마무리"(하루 닫기) 버튼. render 는 버튼 하나를 그리는 컴포넌트를 돌려준다
 * (클래스 "sh-strip-b", 눌린 상태는 aria-pressed).
 */
export interface RightRailItemDef {
  order: number;
  render: () => ReactNode;
  visible?: (ctx: RightPanelContext) => boolean;
}

const railItems = new Map<string, RightRailItemDef>();

export function registerRightRailItem(id: string, def: RightRailItemDef): () => void {
  railItems.set(id, def);
  emit();
  return () => {
    if (railItems.get(id) !== def) return;
    railItems.delete(id);
    emit();
  };
}

export function listRightRailItems(ctx: RightPanelContext): Array<{ id: string; def: RightRailItemDef }> {
  return [...railItems.entries()]
    .filter(([, d]) => (d.visible ? d.visible(ctx) : true))
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, def]) => ({ id, def }));
}

export interface RightPanelApi {
  open: boolean;
  tab: RightPanelTab;
  setTab(t: RightPanelTab): void;
  /** 닫혀 있으면 연다. t 를 주면 그 탭으로 열고, 이미 그 탭으로 열려 있으면 닫는다. */
  toggle(t?: RightPanelTab): void;
  close(): void;
}

export const RightPanelCtx = createContext<RightPanelApi | null>(null);

/** 오른쪽 패널 열기/닫기와 탭. AppShell 안에서만 쓴다. */
export function useRightPanel(): RightPanelApi {
  const v = useContext(RightPanelCtx);
  if (!v) throw new Error("useRightPanel must be used inside AppShell");
  return v;
}
