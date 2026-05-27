import type { AppRoute } from "@/app/model/types";
import { CalendarDashboard } from "@/widgets/calendar-dashboard";

export function CalendarPage({
  onNavigate,
}: {
  onNavigate: (route: AppRoute) => void;
}) {
  return <CalendarDashboard onNavigate={onNavigate} />;
}
