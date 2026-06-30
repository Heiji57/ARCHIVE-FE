import { memo } from "react";
import { CalendarClock, ExternalLink } from "lucide-react";
import type { CalendarEvent } from "@/entities/calendar/model/types";
import { utcISOToLocalTime } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";

interface CalendarEventChipProps {
  event: CalendarEvent;
  /** 시간 라벨 표시 여부 (월간 그리드는 공간이 좁아 생략). */
  showTime?: boolean;
}

/**
 * Google Calendar 이벤트 칩 (읽기 전용).
 * 체크/완료/수정/드래그 불가 — todo 칩과 구분되는 스타일.
 * htmlLink 가 있으면 클릭 시 새 탭에서 원본 일정을 연다.
 */
export const CalendarEventChip = memo(function CalendarEventChipImpl({
  event,
  showTime = true,
}: CalendarEventChipProps) {
  const { t } = useTranslation();

  const tz = event.timezone ?? undefined;
  // 시작·끝 시간을 모두 표시한다(끝이 있으면 "시작 – 끝", 없으면 시작만).
  const timeLabel = event.allDay
    ? t("calendar.event.allDay")
    : event.startAt
      ? event.endAt
        ? `${utcISOToLocalTime(event.startAt, tz)} – ${utcISOToLocalTime(
            event.endAt,
            tz,
          )}`
        : utcISOToLocalTime(event.startAt, tz)
      : "";

  const body = (
    <>
      {showTime && timeLabel ? (
        <span className="cal-event-chip-time">{timeLabel}</span>
      ) : null}
      <span className="cal-event-chip-title">{event.title}</span>
      {event.htmlLink ? (
        <ExternalLink size={10} className="cal-event-chip-ext" />
      ) : (
        <CalendarClock size={10} className="cal-event-chip-ext" />
      )}
    </>
  );

  const title = `${event.title}${
    event.location ? ` · ${event.location}` : ""
  } (${t("calendar.event.readonly")})`;

  if (event.htmlLink) {
    return (
      <a
        href={event.htmlLink}
        target="_blank"
        rel="noreferrer noopener"
        className="cal-event-chip"
        title={title}
        onClick={(e) => e.stopPropagation()}
      >
        {body}
      </a>
    );
  }

  return (
    <div className="cal-event-chip cal-event-chip--static" title={title}>
      {body}
    </div>
  );
});
