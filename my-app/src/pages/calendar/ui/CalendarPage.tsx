import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";
import {
  CalendarDashboard,
  CalendarSidebar,
  CalendarToolbar,
  fmtLongDay,
  useCalendarController,
} from "@/widgets/calendar-dashboard";
import { CloseDayHost, closeDayActions } from "@/widgets/close-day";
import { usePanelDateSync } from "@/widgets/right-panel-tabs";

export function CalendarPage() {
  const { locale } = useTranslation();
  const ctl = useCalendarController();
  usePanelDateSync(ctl.date);
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
      toolbar={<CalendarToolbar ctl={ctl} />}
      panelTitle={fmtLongDay(locale, ctl.date)}
    >
      <CalendarDashboard ctl={ctl} />
      <CloseDayHost dateKey={ctl.date} />
    </ShellPage>
  );
}
