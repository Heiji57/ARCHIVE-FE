import { useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import { DEMO_TAG_ORDER } from "@/entities/todo/model/demo";
import { canUseGithub } from "@/shared/lib/permissions";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { useTranslation } from "@/shared/lib/i18n";
import { useSettingsSheet, useShell } from "@/widgets/app-shell";
import { calendarFilterActions, useCalendarFilter } from "../model/calendarFilter";
import { isMultiDay } from "../model/eventInfo";
import { weekStartPreference } from "../model/weekDays";
import { CalendarList } from "./CalendarList";
import { MiniMonth } from "./MiniMonth";
import { SyncIssues, type SyncIssue } from "./SyncIssues";
import { TagFilter } from "./TagFilter";
import { TodayRetroLine } from "./TodayRetroLine";

export interface CalendarSidebarProps {
  /** 고른 날짜(미니 달력 강조). */
  selectedDate: string;
  /** 미니 달력에서 날짜를 골랐을 때. */
  onPickDate(dateKey: string): void;
  /**
   * 오늘 회고 "쓰기". 기본은 회고 화면으로 간다. 하루 닫기(Task 8)가 생기면 그 창을 열도록 넘긴다.
   */
  onWriteRetro?(dateKey: string): void;
}

/**
 * 캘린더 사이드바 내용(ShellPage sidebar 슬롯): 미니 달력과 오늘 회고 한 줄, 사용자 캘린더(서버 기능),
 * 태그 거르기, 연동 문제. 할 일 화면도 같은 사이드바를 쓴다(거르기 상태는 useCalendarFilter 로 공유).
 */
export function CalendarSidebar({ selectedDate, onPickDate, onWriteRetro }: CalendarSidebarProps) {
  const { state, toggleTodoCalendarLink } = useArchiveApp();
  const { navigateRetro } = useShell();
  const settings = useSettingsSheet();
  const { t } = useTranslation();
  const todayKey = useTodayKey();
  const filter = useCalendarFilter();
  const tagAdmin = useServerFeature("tagAdmin");
  const [resent, setResent] = useState<ReadonlySet<string>>(new Set());
  const todos = state.todos;

  const todoDays = useMemo(() => {
    const s = new Set<string>();
    for (const td of todos) {
      s.add(td.dateKey);
      if (isMultiDay(td)) s.add(td.dueDate!);
    }
    return s;
  }, [todos]);
  const retroEntries = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of state.entries) if (e.retroType === "daily" && !e.isSummary) m.set(e.dateKey, e.id);
    return m;
  }, [state.entries]);

  const { tags, counts, total } = useMemo(() => {
    const counts = new Map<string, number>();
    const all = new Set<string>();
    let total = 0;
    for (const td of todos) {
      for (const tag of td.tags) all.add(tag);
      if (td.status === "done") continue;
      total++;
      for (const tag of td.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    // 태그 순서·색은 서버에 아직 없다(tagAdmin). 데모는 시안 순서, 실제 모드는 가나다순.
    const order = tagAdmin ? DEMO_TAG_ORDER : [];
    const tags = [...all].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== ib) return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
      return a.localeCompare(b);
    });
    return { tags, counts, total };
  }, [todos, tagAdmin]);

  const issues: SyncIssue[] = [];
  const failed = todos.filter((td) => td.calendarPushStatus === "failed" && !resent.has(td.id));
  if (failed.length) {
    issues.push({
      kind: "gcal",
      detail: failed
        .slice(0, 2)
        .map((td) => td.title)
        .join(", "),
      fix: () => {
        // 다시 보내기 = POST /todos/{id}/calendar-link (멱등). 데모는 화면에서만 지운다.
        setResent((p) => new Set([...p, ...failed.map((td) => td.id)]));
        for (const td of failed) if (!td.calendarLinked) toggleTodoCalendarLink(td.id);
      },
    });
  }
  if (canUseGithub(state.github) && !state.github.hasVerifiedEmails) {
    issues.push({ kind: "gh", detail: t("cal.sync.ghDetail"), fix: () => settings.open("link") });
  }

  const todayRetro = retroEntries.get(todayKey);

  return (
    <>
      <MiniMonth
        selected={selectedDate}
        todayKey={todayKey}
        weekStart={weekStartPreference()}
        hasTodo={(d) => todoDays.has(d)}
        hasRetro={(d) => retroEntries.has(d)}
        onPick={onPickDate}
      >
        <TodayRetroLine
          written={!!todayRetro}
          onWrite={() => (onWriteRetro ? onWriteRetro(todayKey) : navigateRetro({}))}
          onView={() => todayRetro && navigateRetro({ view: "editor", entryId: todayRetro })}
        />
      </MiniMonth>
      <CalendarList todos={todos} />
      <TagFilter tags={tags} counts={counts} total={total} current={filter.tag} onPick={calendarFilterActions.setTag} />
      <SyncIssues issues={issues} />
    </>
  );
}
