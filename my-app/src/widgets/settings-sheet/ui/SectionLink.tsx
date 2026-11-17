import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookMarked, Link2Off, MoreHorizontal, Plus, RefreshCw, X } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import type { AvailableRepository } from "@/entities/github/model/types";
import { linkVisibility, useIntegrations, type Integrations } from "../model/useIntegrations";
import { GcalMark, GithubMark } from "./brand";
import { Btn, IconBtn, MenuItem, MoreMenu, Select, Toggle } from "./controls";
import { Card, MoreRow, Sub } from "./Row";
import type { RowViewProps } from "./rowTypes";

type Svc = "gh" | "gcal";
const ico = { size: 15, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

interface SvcView {
  key: Svc;
  name: string;
  icon: ReactNode;
  state: "off" | "ok" | "warn" | "checking";
  warnTitle: string;
  act: string;
  syncing: boolean;
}

function useSvcViews(i: Integrations): SvcView[] {
  const { t } = useTranslation();
  const gh = i.gh;
  const cal = i.cal;
  return [
    {
      key: "gh",
      name: "GitHub",
      icon: <GithubMark />,
      state: gh.status === "unknown" ? "checking" : gh.status !== "connected" ? "off" : gh.warn ? "warn" : "ok",
      warnTitle: gh.warn === "denied" ? t("settingsSheet.link.gh.denied") : t("settingsSheet.link.gh.warn"),
      act: t("settingsSheet.link.gh.act"),
      syncing: i.busy === "gh",
    },
    {
      key: "gcal",
      name: "Google Calendar",
      icon: <GcalMark />,
      state: cal.status === "unknown" ? "checking" : cal.status === "connected" ? "ok" : cal.status === "needs-reauth" ? "warn" : "off",
      warnTitle: t("settingsSheet.link.cal.warn"),
      act: t("settingsSheet.link.cal.act"),
      syncing: i.busy === "cal",
    },
  ];
}

/** "자세히" 가운데 창(시안 경고 자세히 4번): 무엇이 안 되나, 고치는 단계 셋, 나중에 / 할 일. */
function WhyModal({ s, onClose, onAct }: { s: SvcView; onClose: () => void; onAct: () => void }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const p = s.key === "gh" ? "gh" : "cal";
  useEffect(() => {
    box.current?.querySelector<HTMLElement>(".sx-b.p")?.focus();
  }, []);
  return (
    <div
      className="sxwh-scrim c"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        if (e.key === "Tab") {
          // 창 안에서만 돈다
          const f = [...(box.current?.querySelectorAll<HTMLElement>("button") ?? [])];
          if (!f.length) return;
          const i = f.indexOf(document.activeElement as HTMLElement);
          if (e.shiftKey && i <= 0) {
            e.preventDefault();
            f[f.length - 1].focus();
          } else if (!e.shiftKey && i === f.length - 1) {
            e.preventDefault();
            f[0].focus();
          }
        }
      }}
    >
      <div ref={box} className="sxwh-md" role="dialog" aria-modal="true" aria-labelledby="sxwh-t">
        <header>
          <span className="sxl-i">{s.icon}</span>
          <b id="sxwh-t">{s.warnTitle}</b>
        </header>
        <p className="sxwh-lead">{t(`settingsSheet.link.${p}.what`)}</p>
        <ol className="sxwh-steps">
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <span>{n}</span>
              {t(`settingsSheet.link.${p}.s${n}`)}
            </li>
          ))}
        </ol>
        <footer>
          <Btn onClick={onClose}>{t("settingsSheet.link.later")}</Btn>
          <Btn kind="p" onClick={onAct}>
            {s.act}
          </Btn>
        </footer>
      </div>
    </div>
  );
}

/** 연동 카드(시안 연동 1번: 나란히 카드). 상태 한 줄, 할 일 버튼 하나, ⋯ 메뉴(지금 동기화, 연결 해제). */
export function ServiceCards({ only }: { only?: Svc }) {
  const { t } = useTranslation();
  const i = useIntegrations();
  const views = useSvcViews(i).filter((v) => !only || v.key === only);
  const [why, setWhy] = useState<Svc | null>(null);
  const whyBtn = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeWhy = () => {
    const k = why;
    setWhy(null);
    if (k) requestAnimationFrame(() => whyBtn.current[k]?.focus());
  };
  const connect = (k: Svc) => void (k === "gh" ? i.connectGh() : i.connectCal());
  const sync = (k: Svc) => void (k === "gh" ? i.syncGh() : i.syncCal());

  const status = (s: SvcView) => {
    if (s.state === "checking") return <span className="sxl-sl off">{t("settingsSheet.link.checking")}</span>;
    if (s.state === "off") return <span className="sxl-sl off">{t("settingsSheet.link.off")}</span>;
    if (s.state === "ok") return <span className="sxl-sl ok">{s.syncing ? t("settingsSheet.link.syncing") : t("settingsSheet.link.ok")}</span>;
    return (
      <span className="sxl-sl warn">
        <span className="sxn-w">{t("settingsSheet.warn")}</span>
        <span className="sxl-st1">{s.warnTitle}</span>
        <button
          type="button"
          className="sxl-why"
          aria-haspopup="dialog"
          aria-expanded={why === s.key}
          ref={(el) => {
            whyBtn.current[s.key] = el;
          }}
          onClick={() => setWhy(s.key)}
        >
          {t("settingsSheet.link.why")}
        </button>
      </span>
    );
  };
  const primary = (s: SvcView) => {
    if (s.state === "checking") return null;
    if (s.state === "off")
      return (
        <Btn kind="p" disabled={i.busy === "gh-connect" || i.busy === "cal-connect"} onClick={() => connect(s.key)}>
          {t("settingsSheet.link.connect", { name: s.name })}
        </Btn>
      );
    if (s.state === "warn")
      return (
        <Btn kind="w" onClick={() => connect(s.key)}>
          {s.act}
        </Btn>
      );
    return s.syncing ? (
      <Btn kind="q" disabled>
        <RefreshCw {...ico} className="sx-spin" />
        {t("settingsSheet.link.syncing")}
      </Btn>
    ) : (
      <Btn kind="q" onClick={() => sync(s.key)}>
        <RefreshCw {...ico} />
        {t("settingsSheet.link.syncNow")}
      </Btn>
    );
  };
  const menu = (s: SvcView) => {
    if (s.state === "off" || s.state === "checking") return null;
    // needs-reauth 캘린더는 동기화가 실패하므로 메뉴에서 뺀다(기존 CalendarCard 와 같게).
    const canSync = !(s.key === "gcal" && s.state === "warn");
    return (
      <span className="sxl-more">
        <MoreMenu label={t("settingsSheet.link.menu", { name: s.name })} trigger={<MoreHorizontal size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />} menuClassName="sxl-mm">
          {canSync ? <MenuItem icon={<RefreshCw {...ico} />} title={t("settingsSheet.link.syncNow")} disabled={s.syncing} onClick={() => sync(s.key)} /> : null}
          {s.key === "gh" ? (
            // 서버에 GitHub 계정 연결 해제가 없다. 기존 동작(저장소 연결 모두 해제)을 둔다.
            <MenuItem title={t("settingsSheet.link.unlinkAll")} desc={t("settingsSheet.link.unlinkAllD")} danger disabled={!i.gh.repos.length} onClick={i.unlinkAll} />
          ) : (
            <MenuItem title={t("settingsSheet.link.disconnect")} desc={t("settingsSheet.link.disconnectD")} danger onClick={() => void i.disconnectCal()} />
          )}
        </MoreMenu>
      </span>
    );
  };

  const shown = views.find((v) => v.key === why && v.state === "warn");
  return (
    <>
      <div className={`sxl1${only ? " one" : ""}`}>
        {views.map((s) => (
          <article key={s.key} className={`sxl1-c ${s.state === "checking" ? "off" : s.state}`} aria-label={s.name}>
            <div className="sxl1-h">
              <span className="sxl-i">{s.icon}</span>
              <span className="sxl-nm">
                <b>{s.name}</b>
                {status(s)}
              </span>
              {menu(s)}
            </div>
            <div className="sxl1-f">{primary(s)}</div>
          </article>
        ))}
      </div>
      {shown ? (
        <WhyModal
          s={shown}
          onClose={closeWhy}
          onAct={() => {
            closeWhy();
            connect(shown.key);
          }}
        />
      ) : null}
    </>
  );
}

/** 커밋 읽을 저장소(기존 GithubCard 저장소 목록): 읽기 켜고 끄기, 저장소 연결 해제, 저장소 추가. */
export function ReposRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const i = useIntegrations();
  const [avail, setAvail] = useState<AvailableRepository[] | null>(null);
  const [loading, setLoading] = useState(false);
  if (!linkVisibility(i).github) return null;
  const repos = i.gh.repos;
  const linkedIds = new Set(repos.map((r) => r.githubRepoId));
  const toggleAvail = async () => {
    if (avail) return setAvail(null);
    setLoading(true);
    setAvail(await i.loadAvailable());
    setLoading(false);
  };
  return (
    <MoreRow
      id="repos"
      defaultOpen={force}
      title={t("settingsSheet.row.repos.t")}
      desc={t("settingsSheet.row.repos.d")}
      summary={t("settingsSheet.repo.n", { n: repos.filter((r) => r.commitReadEnabled).length })}
    >
      {repos.length ? (
        <ul className="sxrp-l">
          {repos.map((r) => (
            <li className="sxrp" key={r.id}>
              <span className="sxrp-i" aria-hidden="true">
                <BookMarked size={16} strokeWidth={ICON_STROKE} />
              </span>
              <span className="sxrp-n">
                <b>
                  <span className="sx-mu">{r.owner}/</span>
                  {r.name}
                </b>
                <small>
                  {r.isPrivate ? t("settingsSheet.repo.private") : t("settingsSheet.repo.public")}, {r.defaultBranch}
                </small>
              </span>
              <span className="sx-tr">
                <small className="sxrp-s">{r.commitReadEnabled ? t("settingsSheet.repo.read") : t("settingsSheet.repo.unread")}</small>
                <Toggle on={r.commitReadEnabled} label={t("settingsSheet.repo.readLabel", { name: r.name })} onChange={(v) => i.setRepoRead(r.id, v)} />
                <IconBtn label={t("settingsSheet.repo.unlink", { name: r.fullName })} onClick={() => i.unlinkRepo(r.id)}>
                  <Link2Off size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </IconBtn>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sx-val">{t("settingsSheet.repo.none")}</p>
      )}
      <Btn kind="q" aria-expanded={!!avail} disabled={loading} onClick={() => void toggleAvail()}>
        <Plus {...ico} />
        {t("settingsSheet.repo.add")}
      </Btn>
      {avail ? (
        <div className="sxrp-av">
          <p className="sxw-lab">{t("settingsSheet.repo.avail")}</p>
          {avail.filter((a) => !linkedIds.has(a.githubRepoId)).length ? (
            <ul className="sxrp-l">
              {avail
                .filter((a) => !linkedIds.has(a.githubRepoId))
                .map((a) => (
                  <li className="sxrp" key={a.githubRepoId}>
                    <span className="sxrp-i" aria-hidden="true">
                      <BookMarked size={16} strokeWidth={ICON_STROKE} />
                    </span>
                    <span className="sxrp-n">
                      <b>{a.fullName}</b>
                      <small>{a.isPrivate ? t("settingsSheet.repo.private") : t("settingsSheet.repo.public")}</small>
                    </span>
                    <Btn
                      onClick={() =>
                        void i.linkRepo(a.githubRepoId).then(() => setAvail((cur) => (cur ? cur.filter((x) => x.githubRepoId !== a.githubRepoId) : cur)))
                      }
                    >
                      {t("settingsSheet.repo.link")}
                    </Btn>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="sx-val">{t("settingsSheet.repo.noAvail")}</p>
          )}
        </div>
      ) : null}
    </MoreRow>
  );
}

export function PushRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const i = useIntegrations();
  if (!linkVisibility(i).github) return null;
  const opts = [
    { value: "", label: t("settingsSheet.push.none"), desc: t("settingsSheet.push.noneD"), icon: <X {...ico} /> },
    ...i.gh.repos.map((r) => ({
      value: r.id,
      label: r.fullName,
      desc: r.isPrivate ? t("settingsSheet.repo.private") : t("settingsSheet.repo.public"),
      icon: <BookMarked {...ico} />,
    })),
  ];
  const cur = i.gh.repos.find((r) => r.id === i.gh.pushTarget);
  return (
    <MoreRow id="push" defaultOpen={force} title={t("settingsSheet.row.push.t")} desc={t("settingsSheet.row.push.d")} summary={cur ? cur.fullName : t("settingsSheet.push.none")}>
      <Select value={i.gh.pushTarget ?? ""} options={opts} label={t("settingsSheet.row.push.t")} alignLeft onChange={(v) => i.setPush(v || null)} />
    </MoreRow>
  );
}

export function GPushRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const i = useIntegrations();
  if (!linkVisibility(i).calendar) return null;
  return (
    <MoreRow id="gPush" defaultOpen={force} title={t("settingsSheet.row.gPush.t")} desc={t("settingsSheet.row.gPush.d")} summary={t(i.autoPush ? "settingsSheet.on" : "settingsSheet.off")}>
      <Toggle on={i.autoPush} label={t("settingsSheet.row.gPush.t")} onChange={i.setAutoPush} />
    </MoreRow>
  );
}

/** 캘린더에서 지우면 할 일도: 켤 때는 한 번 묻는다(기존 CalendarCard 확인 그대로). */
export function GDelRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const i = useIntegrations();
  const [ask, setAsk] = useState(false);
  if (!linkVisibility(i).calendar) return null;
  return (
    <MoreRow id="gDel" defaultOpen={force} title={t("settingsSheet.row.gDel.t")} desc={t("settingsSheet.row.gDel.d")} summary={t(i.autoDel ? "settingsSheet.on" : "settingsSheet.off")}>
      {ask ? (
        <div className="sx-ask" role="group" aria-label={t("settingsSheet.gdel.askT")}>
          <p>
            <b>{t("settingsSheet.gdel.askT")}</b>
            {t("settingsSheet.gdel.askD")}
          </p>
          <div>
            <Btn onClick={() => setAsk(false)}>{t("settingsSheet.cancel")}</Btn>
            <Btn
              kind="p"
              onClick={() => {
                i.setAutoDel(true);
                setAsk(false);
              }}
            >
              {t("settingsSheet.gdel.on")}
            </Btn>
          </div>
        </div>
      ) : (
        <Toggle on={i.autoDel} label={t("settingsSheet.row.gDel.t")} onChange={(v) => (v ? setAsk(true) : i.setAutoDel(false))} />
      )}
    </MoreRow>
  );
}

export function SectionLink() {
  const { t } = useTranslation();
  const i = useIntegrations();
  const v = linkVisibility(i);
  return (
    <>
      <ServiceCards />
      {v.github || v.calendar ? (
        <>
          <Sub>{t("settingsSheet.more")}</Sub>
          <Card>
            <ReposRow />
            <PushRow />
            <GPushRow />
            <GDelRow />
          </Card>
        </>
      ) : null}
    </>
  );
}
