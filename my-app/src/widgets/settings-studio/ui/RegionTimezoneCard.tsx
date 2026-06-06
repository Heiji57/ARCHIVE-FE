import { useEffect, useMemo, useState } from "react";
import { Clock, Globe } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import {
  countryDefaultTimezone,
  countryDisplayName,
  sortedCountries,
  supportedTimeZones,
} from "@/shared/lib/geo";
import { ConfirmModal, SearchableSelect } from "@/shared/ui";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";

/** 설정 — 국가 + timezone 변경.
 *
 * 흐름:
 *  1. 국가 선택 → GET /settings/countries/{code}/timezones
 *  2. multi=true → timezone 드롭다운 표시 + 선택 필수
 *  3. [적용] → 모달 → 새 tz / 현재 tz 유지 선택
 *  4. PATCH /settings/country { country, timezone? }
 */
export function RegionTimezoneCard() {
  const {
    state,
    loadCountryTimezones,
    updateCountry,
    updateTimezone,
    pushNotification,
  } = useArchiveApp();
  const { t } = useTranslation();
  const user = state.currentUser;

  const countryOptions = useMemo(
    () => sortedCountries().map((c) => ({ value: c.code, label: c.name })),
    [],
  );
  const globalTzOptions = useMemo(
    () => supportedTimeZones().map((tz) => ({ value: tz, label: tz })),
    [],
  );

  // 국가 pending 상태
  const [country, setCountry] = useState<string>(user?.country ?? "");
  // 선택된 timezone (다중 tz 국가용)
  const [selectedTz, setSelectedTz] = useState<string>("");
  // API 응답: 이 국가가 다중 tz 인지 + 가용 tz 목록
  const [tzMulti, setTzMulti] = useState(false);
  const [tzOptions, setTzOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingTz, setLoadingTz] = useState(false);

  const [applying, setApplying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 국가 변경 시 timezone 목록 로드
  const onCountryChange = (code: string) => {
    setCountry(code);
    setSelectedTz("");
    setTzMulti(false);
    setTzOptions([]);
    if (!code) return;

    setLoadingTz(true);
    void loadCountryTimezones(code).then(({ multi, timezones }) => {
      setTzMulti(multi);
      setTzOptions(timezones.map((tz) => ({ value: tz, label: tz })));
      // 단일 tz: 서버가 자동 결정하므로 FE 에서 pre-select 만 해둔다 (표시용)
      if (!multi && timezones.length > 0) setSelectedTz(timezones[0]);
      setLoadingTz(false);
    });
  };

  // 초기 마운트: 현재 국가의 tz 목록 로드 (표시용)
  useEffect(() => {
    if (user?.country) onCountryChange(user.country);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changed = country !== (user?.country ?? "");
  const canApply =
    changed &&
    !!country &&
    !loadingTz &&
    (!tzMulti || !!selectedTz) &&
    !applying;

  // 모달 메시지: timezone 명시 여부
  const displayTz = tzMulti ? selectedTz : countryDefaultTimezone(country);
  const modalMessage = displayTz
    ? t("settings.region.modalMessageWithTz", {
        country: countryDisplayName(country),
        timezone: displayTz,
      })
    : t("settings.region.modalMessage");

  const commitCountry = async (keepCurrentTimezone: boolean) => {
    setModalOpen(false);
    setApplying(true);
    const tzToSend = tzMulti ? selectedTz || null : null;
    const result = await updateCountry(country, tzToSend, keepCurrentTimezone);
    setApplying(false);
    if (result.ok) {
      pushNotification(
        "success",
        t("settings.region.updated"),
        countryDisplayName(country),
        { category: "system", transient: true },
      );
      // 성공 후 새 국가의 tz 목록을 다시 로드한다.
      // ⚠ user?.country 는 아직 이전 렌더의 stale 값 → 반드시 local `country` 변수를 사용.
      onCountryChange(country);
    }
  };

  const onTimezoneChange = async (tz: string) => {
    const result = await updateTimezone(tz);
    if (result.ok) {
      pushNotification("success", t("settings.timezone.updated"), tz, {
        category: "system",
        transient: true,
      });
    }
  };

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<Globe size={20} />}
        iconVariant="primary"
        eyebrow={t("settings.section.region")}
        title={t("settings.region.title")}
      />

      {/* 국가 선택 */}
      <div className="auth-field" style={{ marginBottom: 12 }}>
        <label className="text-field-label" htmlFor="settings-country">
          {t("auth.signup.country")}
        </label>
        <SearchableSelect
          id="settings-country"
          className="select"
          ariaLabel={t("auth.signup.country")}
          options={countryOptions}
          value={country}
          onChange={onCountryChange}
          placeholder={t("auth.signup.countryPlaceholder")}
          searchPlaceholder={t("ui.select.search")}
          emptyText={t("ui.select.empty")}
        />
      </div>

      {/* 다중 tz 국가: timezone 선택 드롭다운 */}
      {tzMulti ? (
        <div className="auth-field" style={{ marginBottom: 12 }}>
          <label className="text-field-label" htmlFor="settings-country-tz">
            {t("settings.region.selectTimezone")}
          </label>
          <SearchableSelect
            id="settings-country-tz"
            className="select"
            ariaLabel={t("settings.region.selectTimezone")}
            options={tzOptions}
            value={selectedTz}
            onChange={setSelectedTz}
            placeholder={loadingTz ? t("settings.region.loadingTz") : t("settings.timezone.label")}
            searchPlaceholder={t("ui.select.search")}
            emptyText={t("ui.select.empty")}
          />
        </div>
      ) : null}

      {/* 단일 tz 국가: 예상 timezone 표시 */}
      {!tzMulti && selectedTz && changed ? (
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            color: "var(--color-body-muted)",
          }}
        >
          {t("settings.region.autoTz", { timezone: selectedTz })}
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn-primary settings-action-btn"
        onClick={() => canApply && setModalOpen(true)}
        disabled={!canApply}
        style={{ marginBottom: tzMulti && !selectedTz && changed ? 6 : 20 }}
      >
        {applying
          ? t("settings.region.applying")
          : loadingTz
            ? t("settings.region.loadingTz")
            : t("settings.region.apply")}
      </button>

      {/* 다중 tz 국가 + timezone 미선택 시 안내 */}
      {tzMulti && !selectedTz && changed ? (
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 11,
            color: "var(--color-body-muted)",
            lineHeight: 1.5,
          }}
        >
          {t("settings.region.selectTimezoneHint")}
        </p>
      ) : null}

      {/* ── 타임존 단독 변경 ─────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid var(--color-divider-soft)",
          paddingTop: 16,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}
        >
          <Clock size={14} style={{ color: "var(--color-primary)" }} />
          <label
            className="text-field-label"
            htmlFor="settings-timezone"
            style={{ margin: 0 }}
          >
            {t("settings.timezone.label")}
          </label>
        </div>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 11,
            color: "var(--color-body-muted)",
            lineHeight: 1.5,
          }}
        >
          {t("settings.timezone.hint")}
        </p>
        <SearchableSelect
          id="settings-timezone"
          className="select"
          ariaLabel={t("settings.timezone.label")}
          options={globalTzOptions}
          value={user?.timezone ?? ""}
          onChange={(v) => void onTimezoneChange(v)}
          placeholder={t("settings.timezone.label")}
          searchPlaceholder={t("ui.select.search")}
          emptyText={t("ui.select.empty")}
        />
      </div>

      <ConfirmModal
        open={modalOpen}
        title={t("settings.region.modalTitle")}
        message={modalMessage}
        confirmLabel={t("settings.region.modalUseNew")}
        cancelLabel={t("settings.region.modalKeep")}
        onConfirm={() => void commitCountry(false)}
        onCancel={() => void commitCountry(true)}
        onDismiss={() => setModalOpen(false)}
      />
    </section>
  );
}
