import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";
import {
  CalendarDashboard,
  CalendarSidebar,
  CalendarToolbar,
  fmtLongDay,
  useCalendarController,
} from "@/widgets/calendar-dashboard";

export function CalendarPage() {
  const { locale } = useTranslation();
  const ctl = useCalendarController();
  return (
    <ShellPage
      rail
      sidebar={<CalendarSidebar selectedDate={ctl.date} onPickDate={(d) => ctl.pick(d)} />}
      toolbar={<CalendarToolbar ctl={ctl} />}
      panelTitle={fmtLongDay(locale, ctl.date)}
    >
      <CalendarDashboard ctl={ctl} />
    </ShellPage>
  );
}
