import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";
import { CalendarDashboard } from "@/widgets/calendar-dashboard";

export function CalendarPage() {
  const { t } = useTranslation();
  return (
    <ShellPage rail toolbar={<h1 className="sh-title">{t("shell.tab.calendar")}</h1>}>
      <CalendarDashboard />
    </ShellPage>
  );
}
