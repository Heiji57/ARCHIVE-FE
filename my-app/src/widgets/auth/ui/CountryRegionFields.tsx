import { useMemo } from "react";
import {
  isMultiTzCountry,
  REGIONS_BY_COUNTRY,
  sortedCountries,
  type MultiTzCountry,
} from "@/shared/lib/geo";
import { SearchableSelect } from "@/shared/ui";
import { useTranslation } from "@/shared/lib/i18n";

interface Props {
  country: string;
  region: string | null;
  onCountryChange: (country: string) => void;
  onRegionChange: (region: string | null) => void;
  countryError?: string;
  regionError?: string;
}

/** 회원가입·온보딩 공용 국가/지역 선택 (다중 tz 국가만 region 노출). */
export function CountryRegionFields({
  country,
  region,
  onCountryChange,
  onRegionChange,
  countryError,
  regionError,
}: Props) {
  const { t } = useTranslation();
  const countries = useMemo(() => sortedCountries(), []);
  const needsRegion = isMultiTzCountry(country);
  const regions = needsRegion
    ? REGIONS_BY_COUNTRY[country as MultiTzCountry]
    : [];

  return (
    <>
      <div className="auth-field">
        <label className="text-field-label" htmlFor="signup-country">
          {t("auth.signup.country")}
        </label>
        <SearchableSelect
          id="signup-country"
          className="auth-select"
          ariaLabel={t("auth.signup.country")}
          options={countries.map((c) => ({ value: c.code, label: c.name }))}
          value={country}
          onChange={(v) => {
            onCountryChange(v);
            onRegionChange(null); // 국가 바뀌면 지역 초기화
          }}
          placeholder={t("auth.signup.countryPlaceholder")}
          searchPlaceholder={t("ui.select.search")}
          emptyText={t("ui.select.empty")}
        />
        {countryError ? (
          <p className="text-field-error" role="alert">
            {countryError}
          </p>
        ) : null}
      </div>

      {needsRegion ? (
        <div className="auth-field">
          <label className="text-field-label" htmlFor="signup-region">
            {t("auth.signup.region")}
          </label>
          <SearchableSelect
            id="signup-region"
            className="auth-select"
            ariaLabel={t("auth.signup.region")}
            options={regions.map((r) => ({ value: r.code, label: r.name }))}
            value={region ?? ""}
            onChange={(v) => onRegionChange(v || null)}
            placeholder={t("auth.signup.regionPlaceholder")}
            searchPlaceholder={t("ui.select.search")}
            emptyText={t("ui.select.empty")}
          />
          {regionError ? (
            <p className="text-field-error" role="alert">
              {regionError}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
