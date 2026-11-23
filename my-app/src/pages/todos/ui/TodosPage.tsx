import { useEffect, useRef } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage, useRightPanel } from "@/widgets/app-shell";
import { CalendarSidebar, fmtLongDay, useCalendarController } from "@/widgets/calendar-dashboard";
import "@/widgets/ai-suggestions";
import { CloseDayHost, closeDayActions } from "@/widgets/close-day";
import { useRegisterPaletteCommand } from "@/widgets/global-search";
import { usePanelDateSync } from "@/widgets/right-panel-tabs";
import { BoardToolbar, TodoBoard } from "@/widgets/todo-board";

/**
 * 할 일 화면(시안 d-todos.html): 캘린더와 같은 사이드바(거르기 공유), 날짜별 열 보드,
 * 오른쪽 패널(기본 탭 시간표). 오늘 회고 "쓰기"와 오른쪽 줄 "오늘 마무리"는 하루 닫기.
 */
export function TodosPage() {
  const { locale } = useTranslation();
  const ctl = useCalendarController("day");
  const panel = useRightPanel();
  usePanelDateSync(ctl.date);

  // 할 일 화면의 패널은 시간표가 기본(시안 rpanel.js curTab). 하루 탭으로 들어오면 한 번 바꾼다.
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    if (panel.open && panel.tab === "day") panel.setTab("timeline");
  }, [panel]);

  // 단축키 t: 오늘(입력칸, 창이 열려 있으면 무시)
  const ctlRef = useRef(ctl);
  useEffect(() => {
    ctlRef.current = ctl;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== "t") return;
      const tg = e.target as HTMLElement | null;
      if (tg?.closest("input, textarea, select, [contenteditable=true], dialog") || document.querySelector("dialog[open]")) return;
      ctlRef.current.goToday();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useRegisterPaletteCommand({ id: "cal.today", labelKey: "cal.palette.today", hint: "T", order: 20, run: () => ctl.goToday() });

  return (
    <ShellPage
      rail
      sidebar={
        <CalendarSidebar
          selectedDate={ctl.date}
          onPickDate={(d) => ctl.pick(d)}
          onWriteRetro={(d) => closeDayActions.open(d)}
        />
      }
      toolbar={<BoardToolbar ctl={ctl} />}
      panelTitle={fmtLongDay(locale, ctl.date)}
    >
      <TodoBoard ctl={ctl} />
      <CloseDayHost dateKey={ctl.date} />
    </ShellPage>
  );
}
