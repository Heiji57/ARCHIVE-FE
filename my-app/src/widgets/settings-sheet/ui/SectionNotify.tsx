import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { formatHm } from "../model/format";
import { useLocalPrefs, type LocalPrefs } from "../model/localPrefs";
import { useToast } from "../model/useToast";
import { Btn, Seg, TimeInput, Toggle } from "./controls";
import { Card, ListLine, MoreRow, Row, Sub } from "./Row";
import type { RowViewProps } from "./rowTypes";

const KINDS: ReadonlyArray<{ k: keyof LocalPrefs["noti"]; t: TranslationKey; d: TranslationKey }> = [
  { k: "due", t: "settingsSheet.noti.due", d: "settingsSheet.noti.dueD" },
  { k: "sum", t: "settingsSheet.noti.sum", d: "settingsSheet.noti.sumD" },
  { k: "sched", t: "settingsSheet.noti.sched", d: "settingsSheet.noti.schedD" },
  { k: "link", t: "settingsSheet.noti.link", d: "settingsSheet.noti.linkD" },
];

/** 알림 종류별 받기(서버에 없음: notificationPrefs). */
export function KindsRow() {
  const { t } = useTranslation();
  const on = useServerFeature("notificationPrefs");
  const ai = useServerFeature("ai");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  return (
    <Row id="kinds" wide title={t("settingsSheet.row.kinds.t")} desc={t("settingsSheet.row.kinds.d")}>
      <ul className="sx-list">
        {KINDS.filter((x) => ai || x.k !== "sched").map((x) => (
          <ListLine key={x.k} title={t(x.t)} desc={t(x.d)}>
            <Toggle on={p.noti[x.k]} label={t(x.t)} onChange={(v) => set({ noti: { ...p.noti, [x.k]: v } })} />
          </ListLine>
        ))}
      </ul>
    </Row>
  );
}

/** 알림 보관 기간(기존 NotificationsCard, PUT /settings notificationRetentionDays). */
export function KeepRow() {
  const { state, setNotificationRetention } = useArchiveApp();
  const { t } = useTranslation();
  const cur = state.settings.notificationRetentionDays;
  const base = [7, 30, 90];
  const days = base.includes(cur) ? base : [...base, cur].sort((a, b) => a - b);
  const opts = days.map((n) => [String(n), t("settingsSheet.noti.days", { n })] as const);
  return (
    <Row id="keep" title={t("settingsSheet.row.keep.t")} desc={t("settingsSheet.row.keep.d")}>
      <Seg value={String(cur)} options={opts} label={t("settingsSheet.row.keep.t")} onChange={(v) => setNotificationRetention(Number(v))} />
    </Row>
  );
}

export function BrowserRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const on = useServerFeature("settingsExt");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  return (
    <MoreRow
      id="browser"
      defaultOpen={force}
      title={t("settingsSheet.row.browser.t")}
      desc={t("settingsSheet.row.browser.d")}
      summary={t(p.browser === "on" ? "settingsSheet.noti.allowed" : "settingsSheet.noti.ask")}
    >
      {p.browser === "on" ? (
        <span className="sx-val">{t("settingsSheet.noti.allowedD")}</span>
      ) : (
        <Btn
          kind="p"
          onClick={() => {
            set({ browser: "on" });
            toast(t("settingsSheet.noti.allowToast"), "success");
          }}
        >
          {t("settingsSheet.noti.allow")}
        </Btn>
      )}
    </MoreRow>
  );
}

export function DndRow({ force }: RowViewProps) {
  const { t, locale } = useTranslation();
  const on = useServerFeature("notificationPrefs");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const f24 = p.timeFmt === "24";
  return (
    <MoreRow
      id="dnd"
      defaultOpen={force}
      title={t("settingsSheet.row.dnd.t")}
      desc={t("settingsSheet.row.dnd.d")}
      summary={p.dnd ? t("settingsSheet.noti.range", { from: formatHm(p.dndFrom, locale, f24), to: formatHm(p.dndTo, locale, f24) }) : t("settingsSheet.off")}
    >
      <span className="sx-tr">
        <Toggle on={p.dnd} label={t("settingsSheet.row.dnd.t")} onChange={(v) => set({ dnd: v })} />
        {p.dnd ? (
          <>
            <TimeInput value={p.dndFrom} label={t("settingsSheet.start")} onChange={(v) => set({ dndFrom: v })} />
            <span>{t("settingsSheet.from")}</span>
            <TimeInput value={p.dndTo} label={t("settingsSheet.end")} onChange={(v) => set({ dndTo: v })} />
            <span>{t("settingsSheet.to")}</span>
          </>
        ) : null}
      </span>
    </MoreRow>
  );
}

export function MailRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const on = useServerFeature("notificationPrefs");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  return (
    <MoreRow id="mail" defaultOpen={force} title={t("settingsSheet.row.mail.t")} desc={t("settingsSheet.row.mail.d")} summary={t(p.mail ? "settingsSheet.on" : "settingsSheet.off")}>
      <Toggle on={p.mail} label={t("settingsSheet.row.mail.t")} onChange={(v) => set({ mail: v })} />
    </MoreRow>
  );
}

export function SectionNotify() {
  const { t } = useTranslation();
  const ext = useServerFeature("settingsExt");
  const prefs = useServerFeature("notificationPrefs");
  return (
    <>
      <Card>
        <KindsRow />
        <KeepRow />
      </Card>
      {ext || prefs ? (
        <>
          <Sub>{t("settingsSheet.more")}</Sub>
          <Card>
            <BrowserRow />
            <DndRow />
            <MailRow />
          </Card>
        </>
      ) : null}
    </>
  );
}
