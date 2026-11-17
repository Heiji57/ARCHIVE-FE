import { useRef, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { DEMO_SCHED } from "../model/demo";
import { formatHm, formatMonthDay } from "../model/format";
import { useLocalPrefs } from "../model/localPrefs";
import { headingsOf } from "../model/templateMarkdown";
import { PERIODS, perKey, useRetroTemplates, type Period, type Tpl } from "../model/useRetroTemplates";
import { useToast } from "../model/useToast";
import { Btn, Select, TimeInput, Toggle } from "./controls";
import { Block, Card, Row } from "./Row";
import { TemplateEditor, type TemplateDraft } from "./TemplateEditor";

function CardDoc({ md }: { md: string }) {
  const { t } = useTranslation();
  const hs = headingsOf(md);
  return (
    <span className="sxr-doc" aria-hidden="true">
      {hs.slice(0, 4).map((h, i) => (
        <span key={i}>
          <b>{h}</b>
          <i />
          <i />
        </span>
      ))}
      {hs.length > 4 ? <em>{t("settingsSheet.tpl.moreItems", { n: hs.length - 4 })}</em> : null}
    </span>
  );
}

interface TemplatesProps {
  per: Period;
  setPer: (p: Period) => void;
  onEdit: (d: TemplateDraft) => void;
}

/** 회고 템플릿: 기간 탭(개수), 기간 안내, 카드(기본, 기본으로, 고치기, 복제), 새 템플릿 카드. */
export function TemplatesBlock({ per, setPer, onEdit }: TemplatesProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const tpls = useRetroTemplates();
  const tabs = useRef<HTMLDivElement>(null);
  const list = tpls.list.filter((x) => x.per === per);
  const perName = t(perKey(per));
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = PERIODS.indexOf(per);
    const next = PERIODS[(i + (e.key === "ArrowRight" ? 1 : -1) + PERIODS.length) % PERIODS.length];
    setPer(next);
    requestAnimationFrame(() => tabs.current?.querySelector<HTMLElement>(`[data-per="${next}"]`)?.focus());
  };
  return (
    <Block id="templates" title={t("settingsSheet.row.templates.t")} desc={t("settingsSheet.row.templates.d")}>
      <div className="sxt-tabs" role="tablist" aria-label={t("settingsSheet.tpl.periods")} ref={tabs} onKeyDown={onTabKey}>
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            data-per={p}
            aria-selected={p === per}
            tabIndex={p === per ? 0 : -1}
            onClick={() => setPer(p)}
          >
            {t(perKey(p))}
            <span>{tpls.list.filter((x) => x.per === p).length}</span>
          </button>
        ))}
      </div>
      <p className="sxt-ai">{per === "day" ? t("settingsSheet.per.noteDay") : t("settingsSheet.per.noteAi", { per: perName })}</p>
      <div className="sxr-tpl sxt-cards" role="tabpanel" aria-label={t("settingsSheet.ed.back", { per: perName })}>
        {per !== "day" && !tpls.loaded ? <p className="sx-val">{t("settingsSheet.loading")}</p> : null}
        {list.map((x) => (
          <article key={x.id} className={`sxt-card${x.active ? " def" : ""}`} aria-label={x.name}>
            <header>
              <b>{x.name}</b>
              {x.active ? <span className="sx-on">{t("settingsSheet.tpl.default")}</span> : null}
            </header>
            <CardDoc md={x.content} />
            <footer>
              {x.active ? null : (
                <Btn
                  kind="q"
                  onClick={() => {
                    void tpls.setDefault(x);
                    toast(t("settingsSheet.tpl.defDone", { per: perName, name: x.name }), "success");
                  }}
                >
                  {t("settingsSheet.tpl.makeDefault")}
                </Btn>
              )}
              <span className="sp" />
              <Btn kind="q" onClick={() => onEdit({ tpl: x, per })}>
                {t("settingsSheet.edit")}
              </Btn>
              <Btn
                kind="q"
                onClick={() => {
                  const name = t("settingsSheet.tpl.dupName", { name: x.name });
                  void tpls.create(x.per, name, x.content, false).then((r) => r && toast(t("settingsSheet.tpl.dupDone", { name }), "success"));
                }}
              >
                {t("settingsSheet.tpl.dup")}
              </Btn>
            </footer>
          </article>
        ))}
        <button type="button" className="sxr-new" onClick={() => onEdit({ tpl: null, per })}>
          <Plus size={18} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span>{t("settingsSheet.tpl.new", { per: perName })}</span>
        </button>
      </div>
    </Block>
  );
}

/** 다음 요약 시각(주는 서버 기준 월요일, 데모는 주 시작 설정). */
function nextSummaries(locale: string, weekStart: "mon" | "sun") {
  const d = new Date();
  const ws = weekStart === "sun" ? 0 : 1;
  const w = new Date(d);
  w.setDate(d.getDate() + ((7 + ws - d.getDay()) % 7 || 7));
  const m = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const y = new Date(d.getFullYear() + 1, 0, 1);
  return [formatMonthDay(w, locale, true), formatMonthDay(m, locale), y.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })];
}

const SUMS: ReadonlyArray<{ key: "weekly" | "monthly" | "yearly"; label: TranslationKey; per: Period }> = [
  { key: "weekly", label: "settingsSheet.sum.week", per: "week" },
  { key: "monthly", label: "settingsSheet.sum.month", per: "month" },
  { key: "yearly", label: "settingsSheet.sum.year", per: "year" },
];

/** 자동 회고 요약(기존 AutoSummaryCard): 주간, 월간, 연간 스위치와 다음 요약, 그 기간 기본 틀. */
export function AutoSummaryBlock({ onPer }: { onPer?: (p: Period) => void }) {
  const { state, setAutoSummary } = useArchiveApp();
  const { t, locale } = useTranslation();
  const [p] = useLocalPrefs();
  const tpls = useRetroTemplates();
  const next = nextSummaries(locale, isDemoMode() ? p.weekStart : "mon");
  const a = state.settings.autoSummary;
  return (
    <Block id="autoSummary" title={t("settingsSheet.row.autoSummary.t")} desc={t("settingsSheet.row.autoSummary.d")}>
      <div className="sxr-sum">
        {SUMS.map((s, i) => {
          const on = a[s.key];
          const def = tpls.list.find((x) => x.per === s.per && x.active);
          return (
            <div key={s.key} className={on ? "on" : undefined}>
              <span className="sxr-sh">
                <b>{t(s.label)}</b>
                <Toggle on={on} label={t(s.label)} onChange={(v) => setAutoSummary({ [s.key]: v })} />
              </span>
              <small>{on ? t("settingsSheet.sum.next", { when: t("settingsSheet.sum.morning", { date: next[i] }) }) : t("settingsSheet.sum.none")}</small>
              {def && onPer ? (
                <button type="button" className="sx-lnk sxr-tp" onClick={() => onPer(s.per)}>
                  {t("settingsSheet.sum.tpl", { name: def.name })}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </Block>
  );
}

/** 하루 마무리 알림(서버에 없음: settingsExt). */
export function DayEndBlock() {
  const { t, locale } = useTranslation();
  const on = useServerFeature("settingsExt");
  const ai = useServerFeature("ai");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  return (
    <Block id="dayEnd" title={t("settingsSheet.row.dayEnd.t")} desc={t("settingsSheet.row.dayEnd.d")}>
      <div className="sxr-end">
        <Toggle on={p.dayEnd} label={t("settingsSheet.row.dayEnd.t")} onChange={(v) => set({ dayEnd: v })} />
        {p.dayEnd ? (
          <span className="sx-tr">
            <span>{t("settingsSheet.dayEnd.every")}</span>
            <TimeInput value={p.dayEndAt} label={t("settingsSheet.dayEnd.at")} onChange={(v) => set({ dayEndAt: v })} />
            <span className="sx-mu">{formatHm(p.dayEndAt, locale, p.timeFmt === "24")}</span>
          </span>
        ) : (
          <span className="sx-val">{t("settingsSheet.dayEnd.offText")}</span>
        )}
      </div>
      {p.dayEnd && ai && p.sched[0] ? (
        <p className="sx-note">
          {t("settingsSheet.dayEnd.note", { what: `${t(DEMO_SCHED[0].when)}, ${t(DEMO_SCHED[0].what)}` })}
        </p>
      ) : null}
    </Block>
  );
}

export function FolderRow() {
  const { state } = useArchiveApp();
  const { t } = useTranslation();
  const on = useServerFeature("settingsExt");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const opts = [{ value: "", label: t("settingsSheet.folder.none") }, ...state.folders.map((f) => ({ value: f.id, label: f.name }))];
  return (
    <Row id="folder" title={t("settingsSheet.row.folder.t")} desc={t("settingsSheet.row.folder.d")}>
      <Select value={p.folder} options={opts} label={t("settingsSheet.row.folder.t")} onChange={(v) => set({ folder: v })} />
    </Row>
  );
}

/** 맞춤법 밑줄(기존 WritingCard, 이 브라우저에만 저장). */
export function SpellRow() {
  const { state, setSpellCheck } = useArchiveApp();
  const { t } = useTranslation();
  return (
    <Row id="spell" title={t("settingsSheet.row.spell.t")} desc={t("settingsSheet.row.spell.d")}>
      <Toggle on={state.settings.spellCheck} label={t("settingsSheet.row.spell.t")} onChange={setSpellCheck} />
    </Row>
  );
}

/** 찾기 결과의 회고 템플릿 줄: 회고 섹션으로 가는 버튼. */
export function TemplatesJumpRow({ onGo }: { onGo: () => void }) {
  const { t } = useTranslation();
  return (
    <Row id="templates" title={t("settingsSheet.row.templates.t")} desc={t("settingsSheet.row.templates.d")}>
      <Btn onClick={onGo}>{t("settingsSheet.tpl.view")}</Btn>
    </Row>
  );
}

export function SectionRetro() {
  const [per, setPer] = useState<Period>("day");
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const tpls = useRetroTemplates();
  if (draft) {
    return (
      <TemplateEditor
        key={draft.tpl?.id ?? `new-${draft.per}`}
        draft={draft}
        all={tpls.list}
        onClose={() => setDraft(null)}
        onSave={async (d) => {
          if (draft.tpl) return tpls.update(draft.tpl, { name: d.name, content: d.content }, d.makeDefault);
          const r = await tpls.create(d.per, d.name, d.content, d.makeDefault);
          if (r) setPer(d.per);
          return !!r;
        }}
        onDelete={(x: Tpl) => void tpls.remove(x)}
        onReset={() => tpls.reset()}
      />
    );
  }
  return (
    <>
      <TemplatesBlock per={per} setPer={setPer} onEdit={setDraft} />
      <AutoSummaryBlock onPer={setPer} />
      <DayEndBlock />
      <Card>
        <FolderRow />
        <SpellRow />
      </Card>
    </>
  );
}
