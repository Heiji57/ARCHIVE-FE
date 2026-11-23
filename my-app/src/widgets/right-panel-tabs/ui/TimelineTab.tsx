import { DaySchedule } from "@/widgets/calendar-dashboard";
import { usePanelDate } from "../model/panelDate";

/** 시간표 탭(할 일 화면만): 그날 종일 줄과 시간 칸. 보드 카드를 끌어 와 시간 칸에 놓으면 시간이 잡힌다. */
export function TimelineTab() {
  const date = usePanelDate();
  return (
    <div className="rp-tl">
      <DaySchedule key={date} dateKey={date} />
    </div>
  );
}
