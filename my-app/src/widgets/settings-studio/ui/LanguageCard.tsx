import { useMemo } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { SUPPORTED_LOCALES, type Locale } from "@/app/model/settings";
import { useTranslation } from "@/shared/lib/i18n";
import { SearchableSelect } from "@/shared/ui";
import { SettingRow } from "./SettingRow";

export function LanguageCard() {
  const { state, setLocale } = useArchiveApp();
  const { t } = useTranslation();

  // 현지어 이름 + 영어 이름 — 국가 선택과 같은 방식으로 검색 가능한 목록.
  const options = useMemo(
    () =>
      SUPPORTED_LOCALES.map((opt) => ({
        value: opt.code,
        label: opt.native === opt.label ? opt.native : `${opt.native} (${opt.label})`,
      })),
    [],
  );

  return (
    <SettingRow
      label={t("settings.language.label")}
      description={t("settings.language.rowHint")}
      htmlFor="settings-language"
    >
      <div className="ss-select-wrap">
        <SearchableSelect
          id="settings-language"
          className="select"
          ariaLabel={t("settings.language.label")}
          options={options}
          value={state.settings.locale}
          onChange={(code) => setLocale(code as Locale)}
          searchPlaceholder={t("ui.select.search")}
          emptyText={t("ui.select.empty")}
        />
      </div>
    </SettingRow>
  );
}
