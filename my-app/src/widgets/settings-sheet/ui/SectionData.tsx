import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Monitor, Smartphone } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { Session } from "@/entities/session/model/types";
import { formatRelativeTime } from "@/shared/lib/date";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { DEMO_TRASH } from "../model/demo";
import { formatMonthDay } from "../model/format";
import { createStore } from "../model/store";
import { useToast } from "../model/useToast";
import { Btn, RadioList } from "./controls";
import { Block, Card, ListLine, MoreRow } from "./Row";
import type { RowViewProps } from "./rowTypes";

const ico = { size: 16, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

/** 로그인한 기기(기존 SessionsCard: GET /auth/sessions, 하나 로그아웃, 다른 기기 모두 로그아웃). 시안 데이터와 보안 1번 기기 카드. */
export function DevicesBlock() {
  const { state, listSessions, revokeSession, revokeOtherSessions, logout } = useArchiveApp();
  const { t } = useTranslation();
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = () =>
    void listSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  // listSessions 는 매 렌더 새 함수라 처음 한 번만 부른다(기존 SessionsCard 와 같은 이유).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const out = async (s: Session) => {
    setBusy(s.sessionId);
    const r = await revokeSession(s.sessionId);
    setBusy(null);
    if (!r.ok) return;
    if (s.isCurrent) return logout();
    toast(t("settings.sessions.revoked"), "success", s.deviceLabel ?? "");
    setSessions((cur) => (cur ? cur.filter((x) => x.sessionId !== s.sessionId) : cur));
  };
  const allOut = async () => {
    setBusy("others");
    const r = await revokeOtherSessions();
    setBusy(null);
    if (!r.ok) return;
    toast(t("settings.sessions.revokedOthersTitle"), "success", t("settings.sessions.revokedOthersBody", { count: String(r.revokedCount ?? 0) }));
    load();
  };
  const others = sessions?.filter((s) => !s.isCurrent) ?? [];
  return (
    <Block
      id="devices"
      title={t("settingsSheet.row.devices.t")}
      desc={t("settingsSheet.row.devices.d")}
      action={
        others.length ? (
          <Btn disabled={busy === "others"} onClick={() => void allOut()}>
            {t("settingsSheet.dev.allOut")}
          </Btn>
        ) : null
      }
    >
      {sessions === null ? (
        <p className="sx-val">{t("settingsSheet.loading")}</p>
      ) : sessions.length === 0 ? (
        <p className="sx-val">{t("settingsSheet.dev.empty")}</p>
      ) : (
        <div className="sxd1-g">
          {sessions.map((s) => {
            const label = s.deviceLabel ?? t("settings.sessions.unknownDevice");
            const phone = /iphone|android|ipad|mobile/i.test(`${s.deviceLabel ?? ""} ${s.deviceInfo ?? ""}`);
            return (
              <article key={s.sessionId} className={s.isCurrent ? "me" : undefined}>
                <span className="sxd-i">{phone ? <Smartphone {...ico} /> : <Monitor {...ico} />}</span>
                <b>{label}</b>
                <small>
                  {s.ipPrefix ? `${s.ipPrefix}.x, ` : ""}
                  {formatRelativeTime(s.lastUsedAt, state.settings.locale)}
                </small>
                {s.isCurrent ? (
                  <span className="sx-on">{t("settingsSheet.dev.this")}</span>
                ) : (
                  <Btn disabled={busy === s.sessionId} onClick={() => void out(s)}>
                    {t("settingsSheet.dev.out")}
                  </Btn>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Block>
  );
}

type Rng = "all" | "year" | "d30" | "own";
type Fmt = "md" | "json";
interface ExportState {
  pick: { retro: boolean; todo: boolean; ai: boolean };
  rng: Rng;
  from: string;
  to: string;
  fmt: Fmt;
  open: { range: boolean; fmt: boolean };
  phase: null | "making" | "ready";
  last: boolean;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const exportStore = createStore<ExportState>({
  pick: { retro: true, todo: true, ai: false },
  rng: "all",
  from: iso(new Date(Date.now() - 30 * 864e5)),
  to: iso(new Date()),
  fmt: "md",
  open: { range: false, fmt: false },
  phase: null,
  last: false,
});

/** 내보내기(서버에 없음: exports). 데모에서 화면 안 상태로 파일 만들기 흉내만. */
export function ExportBlock() {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const on = useServerFeature("exports");
  const ai = useServerFeature("ai");
  const s = exportStore.use();
  const [now] = useState(() => new Date());
  if (!on) return null;
  const set = (p: Partial<ExportState>) => exportStore.set((c) => ({ ...c, ...p }));
  const EXP = (["retro", "todo", "ai"] as const).filter((k) => ai || k !== "ai");
  const picked = EXP.filter((k) => s.pick[k]);
  const ago30 = formatMonthDay(new Date(now.getTime() - 30 * 864e5), locale);
  const y = now.getFullYear();
  const rngOpts = (["all", "year", "d30", "own"] as const).map((v) => ({
    value: v,
    label: t(`settingsSheet.exp.rng.${v}`),
    desc: t(`settingsSheet.exp.rng.${v}D`, { y, date: ago30 }),
  }));
  const fmtOpts = (["md", "json"] as const).map((v) => ({ value: v, label: t(`settingsSheet.exp.fmt.${v}`), desc: t(`settingsSheet.exp.fmt.${v}D`) }));
  const bad = s.rng === "own" && s.from > s.to;
  const rngTxt =
    s.rng === "own"
      ? t("settingsSheet.noti.range", { from: formatMonthDay(new Date(s.from), locale), to: formatMonthDay(new Date(s.to), locale) })
      : t(`settingsSheet.exp.rng.${s.rng}`);
  const fmt = t(`settingsSheet.exp.fmt.${s.fmt}`);
  const what = picked.map((k) => t(`settingsSheet.exp.${k}`)).join(", ");
  const p = locale === "ko" ? (picked[picked.length - 1] === "todo" ? "을" : "를") : "";
  const file = `archive-${iso(now)}.zip`;
  const make = () => {
    set({ phase: "making" });
    window.setTimeout(() => set({ phase: "ready", last: true }), 1200);
  };
  const disc = (k: "range" | "fmt", label: string, val: string, body: ReactNode) => (
    <div className={`sxe-d${s.open[k] ? " open" : ""}`}>
      <button type="button" className="sxe-dh" aria-expanded={s.open[k]} aria-controls={`sxe-${k}`} onClick={() => set({ open: { ...s.open, [k]: !s.open[k] } })}>
        <span>{label}</span>
        <b>{val}</b>
        <ChevronDown {...ico} />
      </button>
      {s.open[k] ? (
        <div className="sxe-db" id={`sxe-${k}`}>
          {body}
        </div>
      ) : null}
    </div>
  );
  return (
    <Block id="export" title={t("settingsSheet.row.export.t")} desc={t("settingsSheet.row.export.d")}>
      <div className="sxe">
        <div className="sxe-pick" role="group" aria-label={t("settingsSheet.exp.pick")}>
          {EXP.map((k) => (
            <button key={k} type="button" aria-pressed={s.pick[k]} onClick={() => set({ pick: { ...s.pick, [k]: !s.pick[k] }, phase: null })}>
              <b>{t(`settingsSheet.exp.${k}`)}</b>
              <small>{t(`settingsSheet.exp.${k}D`)}</small>
              <span>{s.pick[k] ? t("settingsSheet.exp.in") : t("settingsSheet.exp.out")}</span>
            </button>
          ))}
        </div>
        <div className="sxe-ds">
          {disc(
            "range",
            t("settingsSheet.exp.range"),
            rngTxt,
            <>
              <RadioList value={s.rng} options={rngOpts} label={t("settingsSheet.exp.range")} onChange={(v) => set({ rng: v, phase: null })} />
              {s.rng === "own" ? (
                <div className="sxe-own">
                  <label>
                    <span>{t("settingsSheet.start")}</span>
                    <input type="date" className="sx-in" value={s.from} max={iso(now)} onChange={(e) => set({ from: e.target.value })} />
                  </label>
                  <span className="sxe-til">{t("settingsSheet.from")}</span>
                  <label>
                    <span>{t("settingsSheet.end")}</span>
                    <input type="date" className="sx-in" value={s.to} max={iso(now)} onChange={(e) => set({ to: e.target.value })} />
                  </label>
                  <span className="sxe-til">{t("settingsSheet.to")}</span>
                </div>
              ) : null}
              {bad ? (
                <p className="sxe-err" role="alert">
                  <span className="sxn-w e">{t("settingsSheet.err")}</span>
                  {t("settingsSheet.exp.rng.bad")}
                </p>
              ) : null}
            </>,
          )}
          {disc("fmt", t("settingsSheet.exp.file"), fmt, <RadioList value={s.fmt} options={fmtOpts} label={t("settingsSheet.exp.file")} onChange={(v) => set({ fmt: v, phase: null })} />)}
        </div>
        {s.phase === "making" ? (
          <div className="sxe-f">
            <span className="sxe-s">{t("settingsSheet.exp.making")}</span>
            <span className="sxl5-bar">
              <i />
            </span>
          </div>
        ) : s.phase === "ready" ? (
          <div className="sxe-f">
            <span className="sxe-s">
              <b>{file}</b>
              {what}, {rngTxt}, {fmt}
            </span>
            <span className="sx-tr">
              <Btn onClick={make}>{t("settingsSheet.exp.remake")}</Btn>
              <Btn kind="p" onClick={() => toast(t("settingsSheet.exp.got", { file }))}>
                {t("settingsSheet.exp.get")}
              </Btn>
            </span>
          </div>
        ) : (
          <div className="sxe-f">
            <span className="sxe-s">
              {picked.length
                ? t(s.rng === "own" ? "settingsSheet.exp.sumB" : "settingsSheet.exp.sumA", { what, p, range: rngTxt, fmt })
                : t("settingsSheet.exp.pickOne")}
            </span>
            <Btn kind="p" disabled={!picked.length || bad} onClick={make}>
              {t("settingsSheet.exp.make")}
            </Btn>
          </div>
        )}
        {s.last && s.phase !== "ready" ? <p className="sx-note">{t("settingsSheet.exp.last", { when: t("settingsSheet.exp.today") })}</p> : null}
      </div>
    </Block>
  );
}

const trashStore = createStore(DEMO_TRASH);

/** 휴지통(서버에 없음: trash). 데모 항목을 되살리기만 한다. */
export function TrashRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const on = useServerFeature("trash");
  const items = trashStore.use();
  if (!on) return null;
  return (
    <MoreRow id="trash" defaultOpen={force} title={t("settingsSheet.row.trash.t")} desc={t("settingsSheet.row.trash.d")} summary={t("settingsSheet.trash.n", { n: items.length })}>
      {items.length ? (
        <ul className="sx-list">
          {items.map((x) => (
            <ListLine
              key={x.id}
              title={t(x.name)}
              desc={t("settingsSheet.trash.left", {
                kind: t(`settingsSheet.trash.${x.kind}` as TranslationKey),
                when: t("settingsSheet.trash.ago", { n: x.agoDays }),
                d: x.leftDays,
              })}
            >
              <Btn
                onClick={() => {
                  trashStore.set((l) => l.filter((y) => y.id !== x.id));
                  toast(t("settingsSheet.trash.restored", { name: t(x.name) }), "success");
                }}
              >
                {t("settingsSheet.trash.restore")}
              </Btn>
            </ListLine>
          ))}
        </ul>
      ) : (
        <p className="sx-val">{t("settingsSheet.trash.empty")}</p>
      )}
    </MoreRow>
  );
}

export function SectionData() {
  const trash = useServerFeature("trash");
  return (
    <>
      <DevicesBlock />
      <ExportBlock />
      {trash ? (
        <Card>
          <TrashRow />
        </Card>
      ) : null}
    </>
  );
}
