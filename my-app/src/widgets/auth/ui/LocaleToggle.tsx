import { SUPPORTED_LOCALES } from "@/app/model/settings";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { regionLocaleChoices, useTranslation } from "@/shared/lib/i18n";

interface LocaleToggleProps {
  className: string;
  buttonClassName: string;
}

/**
 * 비로그인 화면(랜딩·인증)용 언어 토글 — 영어와 접속 지역 언어 중 하나를 고른다.
 * 전역 settings.locale 을 그대로 읽고 쓴다 (로그인 후에도 유지).
 * 지역 언어가 영어뿐이면 고를 것이 없으므로 렌더하지 않는다.
 */
export function LocaleToggle({ className, buttonClassName }: LocaleToggleProps) {
  const { state, setLocale } = useArchiveApp();
  const { t } = useTranslation();
  const current = state.settings.locale;
  const choices = regionLocaleChoices(current);
  if (choices.length < 2) return null;

  return (
    <div className={className} role="group" aria-label={t("settings.language.label")}>
      {choices.map((code) => (
        <button
          key={code}
          type="button"
          className={buttonClassName}
          lang={code}
          data-active={current === code ? "1" : "0"}
          aria-pressed={current === code}
          onClick={() => setLocale(code)}
        >
          {SUPPORTED_LOCALES.find((l) => l.code === code)?.native ?? code}
        </button>
      ))}
    </div>
  );
}
