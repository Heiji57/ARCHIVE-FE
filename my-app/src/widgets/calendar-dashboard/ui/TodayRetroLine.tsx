import { Bookmark } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";

/** 미니 달력 아래 한 줄(시안 오늘 회고 5번): 썼는지와 쓰기/보기. */
export function TodayRetroLine({ written, onWrite, onView }: { written: boolean; onWrite(): void; onView(): void }) {
  const { t } = useTranslation();
  return (
    <p className={`cal-rd5${written ? " on" : ""}`}>
      <Bookmark size={14} aria-hidden="true" />
      <span>{t(written ? "cal.retro.done" : "cal.retro.notYet")}</span>
      <button type="button" onClick={written ? onView : onWrite}>
        {t(written ? "cal.retro.view" : "cal.retro.write")}
      </button>
    </p>
  );
}
