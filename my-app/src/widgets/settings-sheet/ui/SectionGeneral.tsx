import { useEffect, useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { SUPPORTED_LOCALES, type Locale } from "@/app/model/settings";
import { isDemoMode } from "@/shared/lib/demoMode";
import { countryName, sortedCountries, supportedTimeZones } from "@/shared/lib/geo";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { tzLabel } from "../model/format";
import { useLocalPrefs, type LocalPrefs } from "../model/localPrefs";
import { useToast } from "../model/useToast";
import { Btn, Seg, Select } from "./controls";
import { Card, MoreRow, Row, Sub } from "./Row";
import type { RowViewProps } from "./rowTypes";

export function LangRow() {
  const { state, setLocale } = useArchiveApp();
  const { t } = useTranslation();
  const options = useMemo(() => SUPPORTED_LOCALES.map((l) => ({ value: l.code, label: l.native, desc: l.native === l.label ? undefined : l.label })), []);
  return (
    <Row id="lang" title={t("settingsSheet.row.lang.t")} desc={t("settingsSheet.row.lang.d")}>
      <Select value={state.settings.locale} options={options} label={t("settingsSheet.row.lang.t")} onChange={(v) => setLocale(v as Locale)} />
    </Row>
  );
}

/**
 * 국가와 시간대(기존 RegionTimezoneCard 흐름): 국가를 고르면 그 나라 시간대를 불러오고,
 * "적용"을 누르면 AI 요약 시간을 새 국가 기준으로 바꿀지 묻는다(PATCH /settings/country).
 * 시간대만 바꾸면 바로 적용(PATCH /settings/timezone).
 */
export function RegionRow() {
  const { state, loadCountryTimezones, updateCountry, updateTimezone } = useArchiveApp();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const user = state.currentUser;
  const demoGuest = isDemoMode() && !user;
  const baseCountry = user?.country || (demoGuest ? "KR" : "");
  const baseTz = user?.timezone || (demoGuest ? "Asia/Seoul" : "");

  const [pend, setPend] = useState<string | null>(null);
  const [pendTz, setPendTz] = useState("");
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tzs, setTzs] = useState<{ code: string; multi: boolean; list: string[] } | null>(null);
  const shown = pend ?? baseCountry;

  useEffect(() => {
    if (!shown) return;
    let alive = true;
    void loadCountryTimezones(shown).then(({ multi, timezones }) => {
      if (!alive) return;
      setTzs({ code: shown, multi, list: timezones });
      if (pend) setPendTz(multi ? "" : (timezones[0] ?? ""));
    });
    return () => {
      alive = false;
    };
    // loadCountryTimezones 는 매 렌더 새 함수(AppProvider). 국가가 바뀔 때만 다시 부른다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const countryOptions = useMemo(
    () =>
      sortedCountries()
        .map((c) => ({ value: c.code, label: countryName(c.code, locale), kw: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label, locale)),
    [locale],
  );
  const own = useMemo(() => (tzs && tzs.code === shown ? tzs.list : []), [tzs, shown]);
  const allTz = useMemo(() => supportedTimeZones(), []);
  const tzOptions = useMemo(() => {
    const first = own.length ? own : baseTz ? [baseTz] : [];
    const rest = allTz.filter((z) => !first.includes(z));
    return [...first, ...rest].map((z) => ({ value: z, label: tzLabel(z, locale) }));
  }, [own, allTz, baseTz, locale]);

  const pendMulti = !!pend && tzs?.code === pend && tzs.multi;
  const canApply = !!pend && tzs?.code === pend && (!pendMulti || !!pendTz) && !busy;

  const commit = async (keep: boolean) => {
    if (!pend) return;
    setAsk(false);
    setBusy(true);
    const r = await updateCountry(pend, pendMulti ? pendTz || null : null, keep);
    setBusy(false);
    if (r.ok) {
      toast(t("settings.region.updated"), "success", countryName(pend, locale));
      setPend(null);
    }
  };

  return (
    <Row id="region" wide title={t("settingsSheet.row.region.t")} desc={t("settingsSheet.row.region.d")}>
      <div className="sx-geo">
        <Select
          value={shown}
          options={countryOptions}
          label={t("settingsSheet.gen.country")}
          placeholder={t("settingsSheet.gen.countryPh")}
          searchable
          alignLeft
          onChange={(c) => {
            setAsk(false);
            setPend(c === baseCountry ? null : c);
          }}
        />
        {pend ? (
          pendMulti ? (
            <Select
              value={pendTz}
              options={own.map((z) => ({ value: z, label: tzLabel(z, locale) }))}
              label={t("settingsSheet.gen.tz")}
              placeholder={t("settings.region.selectTimezone")}
              alignLeft
              onChange={setPendTz}
            />
          ) : pendTz ? (
            <span className="sx-val">{tzLabel(pendTz, locale)}</span>
          ) : null
        ) : (
          <Select
            value={baseTz}
            options={tzOptions}
            label={t("settingsSheet.gen.tz")}
            placeholder={t("settings.timezone.label")}
            searchable
            alignLeft
            onChange={(z) => {
              void updateTimezone(z).then((r) => {
                if (r.ok) toast(t("settings.timezone.updated"), "success", z);
              });
            }}
          />
        )}
        {pend && !ask ? (
          <Btn kind="p" disabled={!canApply} onClick={() => setAsk(true)}>
            {busy ? t("settings.region.applying") : t("settingsSheet.gen.apply")}
          </Btn>
        ) : null}
      </div>
      {ask ? (
        <div className="sx-ask" role="group" aria-label={t("settingsSheet.gen.askT")}>
          <p>
            <b>{t("settingsSheet.gen.askT")}</b>
            {t("settingsSheet.gen.askD", { tz: baseTz ? tzLabel(baseTz, locale) : "-" })}
          </p>
          <div>
            <Btn onClick={() => void commit(true)}>{t("settingsSheet.gen.askKeep")}</Btn>
            <Btn kind="p" onClick={() => void commit(false)}>
              {t("settingsSheet.gen.askNew")}
            </Btn>
          </div>
        </div>
      ) : null}
    </Row>
  );
}

const TABS: ReadonlyArray<LocalPrefs["startTab"]> = ["ai", "calendar", "todos", "retro"];
const tabKey = (x: LocalPrefs["startTab"]) => `settingsSheet.gen.tab.${x}` as TranslationKey;

export function StartTabRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const on = useServerFeature("settingsExt");
  const ai = useServerFeature("ai");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const opts = TABS.filter((x) => ai || x !== "ai").map((x) => [x, t(tabKey(x))] as const);
  return (
    <MoreRow
      id="startTab"
      defaultOpen={force}
      title={t("settingsSheet.row.startTab.t")}
      desc={t("settingsSheet.row.startTab.d")}
      summary={t(tabKey(p.startTab))}
    >
      <Seg value={p.startTab} options={opts} label={t("settingsSheet.row.startTab.t")} onChange={(v) => set({ startTab: v })} />
    </MoreRow>
  );
}

export function TimeFmtRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const on = useServerFeature("settingsExt");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const opts = [
    ["12", t("settingsSheet.gen.fmt12")],
    ["24", t("settingsSheet.gen.fmt24")],
  ] as const;
  return (
    <MoreRow
      id="timeFmt"
      defaultOpen={force}
      title={t("settingsSheet.row.timeFmt.t")}
      summary={p.timeFmt === "12" ? t("settingsSheet.gen.fmt12") : t("settingsSheet.gen.fmt24")}
    >
      <Seg value={p.timeFmt} options={opts} label={t("settingsSheet.row.timeFmt.t")} onChange={(v) => set({ timeFmt: v })} />
    </MoreRow>
  );
}

export function SectionGeneral() {
  const { t } = useTranslation();
  const ext = useServerFeature("settingsExt");
  return (
    <>
      <Card>
        <LangRow />
        <RegionRow />
      </Card>
      {ext ? (
        <>
          <Sub>{t("settingsSheet.more")}</Sub>
          <Card>
            <StartTabRow />
            <TimeFmtRow />
          </Card>
        </>
      ) : null}
    </>
  );
}
