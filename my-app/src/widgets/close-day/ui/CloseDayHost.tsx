import { useTranslation } from "@/shared/lib/i18n";
import { RetroIcon } from "@/shared/ui/icons";
import { useRegisterPaletteCommand } from "@/widgets/global-search";
import { closeDayActions, useCloseDayState } from "../model/closeDay";
import { CloseDayDialog } from "./CloseDayDialog";

/**
 * 하루 닫기 창 자리. 캘린더와 할 일 화면이 고른 날짜(dateKey)와 함께 그린다.
 * 팔레트 "하루 닫기 · 회고 초안"(order 60)을 이 화면에 있는 동안 등록한다.
 */
export function CloseDayHost({ dateKey }: { dateKey: string }) {
  const s = useCloseDayState();
  useRegisterPaletteCommand({
    id: "close-day",
    labelKey: "todos.close.palette",
    order: 60,
    // 팔레트 창이 닫힌 뒤에 연다(창 둘이 겹쳐 열리지 않게).
    run: () => window.setTimeout(() => closeDayActions.open(), 0),
  });
  if (!s.open) return null;
  const day = s.date ?? dateKey;
  return <CloseDayDialog key={day} day={day} onClose={closeDayActions.close} />;
}

/** 오른쪽 줄 "오늘 마무리" 버튼(시안 planner.js strip data-reflect). 창이 열려 있는 동안 눌린 모양. */
export function CloseDayRailButton() {
  const { t } = useTranslation();
  const s = useCloseDayState();
  return (
    <button
      type="button"
      className="sh-strip-b"
      aria-pressed={s.open}
      aria-label={t("todos.close.rail")}
      title={t("todos.close.railTitle")}
      onClick={() => (s.open ? closeDayActions.close() : closeDayActions.open())}
    >
      <RetroIcon size={16} aria-hidden="true" />
    </button>
  );
}
