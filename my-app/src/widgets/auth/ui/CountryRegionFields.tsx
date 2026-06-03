import { useMemo } from "react";
import {
  isMultiTzCountry,
  REGIONS_BY_COUNTRY,
  sortedCountries,
  type MultiTzCountry,
} from "@/shared/lib/geo";
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
  const { t, locale } = useTranslation();
  const countries = useMemo(() => sortedCountries(locale), [locale]);
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
        <select
          id="signup-country"
          className="auth-select"
          value={country}
          onChange={(e) => {
            onCountryChange(e.target.value);
            onRegionChange(null); // 국가 바뀌면 지역 초기화
          }}
          required
        >
          <option value="" disabled>
            {t("auth.signup.countryPlaceholder")}
          </option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
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
          <select
            id="signup-region"
            className="auth-select"
            value={region ?? ""}
            onChange={(e) => onRegionChange(e.target.value || null)}
            required
          >
            <option value="" disabled>
              {t("auth.signup.regionPlaceholder")}
            </option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
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
