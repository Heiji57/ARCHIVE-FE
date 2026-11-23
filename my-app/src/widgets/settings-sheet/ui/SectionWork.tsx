import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useTranslation } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { DEMO_CALENDARS, DEMO_TAGS } from "../model/demo";
import { formatDuration, formatHm, weekdayName } from "../model/format";
import { useLocalPrefs, type LocalPrefs } from "../model/localPrefs";
import { useToast } from "../model/useToast";
import { hourOf, niceHours, stepTime, weekOrder, workSummary } from "../model/workHours";
import { Btn, IconBtn, RadioList, Seg } from "./controls";
import { RangeRuler } from "./RangeRuler";
import { Block, Card, ListLine, Row, Sub } from "./Row";

const ico = { size: 16, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

/** 일하는 시간(시안 4번: 요일마다 하루 막대 + 시작, 끝 단계 버튼). */
export function WorkHoursBlock() {
  const { t, locale } = useTranslation();
  const on = useServerFeature("settingsExt");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const from = hourOf(p.wFrom);
  const to = hourOf(p.wTo);
  const sum = workSummary(p.days, p.wFrom, p.wTo);
  const fmt24 = p.timeFmt === "24";
  const toggleDay = (d: number) => set({ days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] });
  const step = (k: "wFrom" | "wTo", dh: number) => {
    const v = stepTime(p[k], dh);
    if ((k === "wFrom" && hourOf(v) < to) || (k === "wTo" && hourOf(v) > from)) set({ [k]: v } as Partial<LocalPrefs>);
  };
  const stepper = (k: "wFrom" | "wTo", label: string) => (
    <span className="sxv-st">
      <small>{label}</small>
      <b>{formatHm(p[k], locale, fmt24)}</b>
      <span>
        <IconBtn label={t("settingsSheet.work.earlier", { what: label })} onClick={() => step(k, -0.5)}>
          <Minus {...ico} />
        </IconBtn>
        <IconBtn label={t("settingsSheet.work.later", { what: label })} onClick={() => step(k, 0.5)}>
          <Plus {...ico} />
        </IconBtn>
      </span>
    </span>
  );
  return (
    <Block id="workHours" title={t("settingsSheet.row.workHours.t")} desc={t("settingsSheet.row.workHours.d")}>
      <div className="sxv-gantt">
        <div className="sxv-gs" aria-hidden="true">
          <span />
          {[0, 6, 12, 18, 24].map((h) => (
            <em key={h} style={{ ["--x" as string]: h / 24 }}>
              {t("settingsSheet.work.hour", { h })}
            </em>
          ))}
        </div>
        {weekOrder(p.weekStart).map((d) => {
          const working = p.days.includes(d);
          const long = weekdayName(d, locale, "long");
          return (
            <div className="sxv-gr" key={d}>
              <button
                type="button"
                aria-pressed={working}
                aria-label={t(working ? "settingsSheet.work.dayOn" : "settingsSheet.work.dayOff", { day: long })}
                onClick={() => toggleDay(d)}
              >
                {weekdayName(d, locale, "narrow")}
              </button>
              <span className="sxv-gt">{working ? <i style={{ ["--a" as string]: from / 24, ["--b" as string]: to / 24 }} /> : null}</span>
            </div>
          );
        })}
      </div>
      <div className="sxv-steps">
        {stepper("wFrom", t("settingsSheet.start"))}
        {stepper("wTo", t("settingsSheet.end"))}
        <p className="sxw-sum">
          <b>
            {sum.days ? t("settingsSheet.work.sumPerDay", { n: sum.days, h: niceHours(sum.perDay) }) : t("settingsSheet.work.sumDays", { n: 0 })}
          </b>
          <span>{t("settingsSheet.work.sumWeek", { h: niceHours(sum.total) })}</span>
        </p>
      </div>
    </Block>
  );
}

/** 새 할 일과 끝낸 일(시안 4번: 기본 길이 단계 버튼, 끝낸 일 라디오). */
export function TodoDefaultsBlock() {
  const { t } = useTranslation();
  const on = useServerFeature("settingsExt");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const done = (["keep", "dim", "hide"] as const).map((v) => ({
    value: v,
    label: t(`settingsSheet.work.done.${v}`),
    desc: t(`settingsSheet.work.done.${v}D`),
  }));
  return (
    <Block id="todoDefaults" title={t("settingsSheet.row.todoDefaults.t")}>
      <div className="sxv-two">
        <div>
          <p className="sxw-lab">{t("settingsSheet.work.dur")}</p>
          <span className="sxv-st big">
            <b>{formatDuration(p.dur, t)}</b>
            <span>
              <IconBtn label={t("settingsSheet.work.durLess")} disabled={p.dur <= 15} onClick={() => set({ dur: Math.max(15, p.dur - 15) })}>
                <Minus {...ico} />
              </IconBtn>
              <IconBtn label={t("settingsSheet.work.durMore")} disabled={p.dur >= 240} onClick={() => set({ dur: Math.min(240, p.dur + 15) })}>
                <Plus {...ico} />
              </IconBtn>
            </span>
          </span>
          <p className="sx-note">{t("settingsSheet.work.durNote")}</p>
        </div>
        <div>
          <p className="sxw-lab">{t("settingsSheet.work.done")}</p>
          <RadioList value={p.done} options={done} label={t("settingsSheet.work.done")} onChange={(v) => set({ done: v })} />
        </div>
      </div>
    </Block>
  );
}

export function WeekStartRow() {
  const { t } = useTranslation();
  const on = useServerFeature("settingsExt");
  const [p, set] = useLocalPrefs();
  if (!on) return null;
  const opts = [
    ["mon", t("settingsSheet.work.mon")],
    ["sun", t("settingsSheet.work.sun")],
  ] as const;
  return (
    <Row id="weekStart" title={t("settingsSheet.row.weekStart.t")} desc={t("settingsSheet.row.weekStart.d")}>
      <Seg value={p.weekStart} options={opts} label={t("settingsSheet.row.weekStart.t")} onChange={(v) => set({ weekStart: v })} />
    </Row>
  );
}

export function TodoRangeRow() {
  const { t } = useTranslation();
  return (
    <Row id="todoRange" wide title={t("settingsSheet.row.todoRange.t")} desc={t("settingsSheet.row.todoRange.d")}>
      <RangeRuler />
    </Row>
  );
}

/** 사이드바 캘린더 목록(서버에 사용자 캘린더가 없다: userCalendars). 데모 데이터로만 보인다. */
export function CalendarsList() {
  const { t } = useTranslation();
  const toast = useToast();
  const on = useServerFeature("userCalendars");
  if (!on) return null;
  return (
    <div>
      <ul className="sx-list">
        {DEMO_CALENDARS.map((c) => (
          <ListLine
            key={c.id}
            icon={<span className="sx-sw" style={{ background: c.color }} />}
            title={
              <>
                {t(c.name)}
                {c.def ? <span className="sxw-tag">{t("settingsSheet.work.calDefault")}</span> : null}
              </>
            }
            desc={t("settingsSheet.work.count", { n: c.count })}
          >
            <Btn kind="q" onClick={() => toast(t("settingsSheet.soon"))}>
              {t("settingsSheet.edit")}
            </Btn>
          </ListLine>
        ))}
      </ul>
      <Btn kind="q" onClick={() => toast(t("settingsSheet.soon"))}>
        <Plus {...ico} />
        {t("settingsSheet.work.newCal")}
      </Btn>
    </div>
  );
}

/** 태그 목록(서버에 태그 관리가 없다: tagAdmin). 할 일에 붙은 태그를 세어 보여 준다. */
export function TagsList() {
  const { t } = useTranslation();
  const toast = useToast();
  const on = useServerFeature("tagAdmin");
  const { state } = useArchiveApp();
  const tags = useMemo(() => {
    const m = new Map<string, number>();
    state.todos.forEach((x) => x.tags?.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [state.todos]);
  if (!on) return null;
  const list = tags.length || !isDemoMode() ? tags : DEMO_TAGS.map((x) => ({ name: t(x.name), count: x.count }));
  return (
    <div>
      <ul className="sx-list">
        {list.map((g) => (
          <ListLine key={g.name} icon={<span className="sxw-hash">#</span>} title={g.name} desc={t("settingsSheet.work.count", { n: g.count })}>
            <Btn kind="q" onClick={() => toast(t("settingsSheet.soon"))}>
              {t("settingsSheet.edit")}
            </Btn>
          </ListLine>
        ))}
      </ul>
      <Btn kind="q" onClick={() => toast(t("settingsSheet.soon"))}>
        <Plus {...ico} />
        {t("settingsSheet.work.newTag")}
      </Btn>
    </div>
  );
}

export function CalTagsBlock() {
  const { t } = useTranslation();
  const cal = useServerFeature("userCalendars");
  const tag = useServerFeature("tagAdmin");
  if (!cal && !tag) return null;
  return (
    <>
      <Sub>{t("settingsSheet.work.calTags")}</Sub>
      <div className="sxw-two sx-card sxw-ct">
        <CalendarsList />
        <TagsList />
      </div>
    </>
  );
}

export function SectionWork() {
  const ext = useServerFeature("settingsExt");
  return (
    <>
      <WorkHoursBlock />
      <TodoDefaultsBlock />
      <Card>
        {ext ? <WeekStartRow /> : null}
        <TodoRangeRow />
      </Card>
      <CalTagsBlock />
    </>
  );
}
