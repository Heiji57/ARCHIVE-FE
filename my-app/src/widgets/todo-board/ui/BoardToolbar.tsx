import { useTranslation } from "@/shared/lib/i18n";
import { fmtYearMonth, type CalendarController } from "@/widgets/calendar-dashboard";
import { useBoardViewport } from "../model/boardViewport";

/** 할 일 화면 상단 왼쪽(시안 d-todos.html): 오늘, 보이는 달 제목. */
export function BoardToolbar({ ctl }: { ctl: CalendarController }) {
  const { t, locale } = useTranslation();
  const vp = useBoardViewport();
  return (
    <>
      <button type="button" className="sh-btn" onClick={ctl.goToday} title={t("cal.todayTitle")} data-dir={vp.todayDir}>
        {t("cal.today")}
      </button>
      <h1 className="sh-title cal-ttl">{fmtYearMonth(locale, vp.anchor ?? ctl.date)}</h1>
    </>
  );
}
