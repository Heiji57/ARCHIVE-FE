import { useState, type ReactNode } from "react";
import { CalendarDays, CheckSquare, FileText } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { DEMO_SCHED } from "../model/demo";
import { useLocalPrefs, type LocalPrefs } from "../model/localPrefs";
import { usePetEnabled } from "../model/petEnabled";
import { useIntegrations } from "../model/useIntegrations";
import { useToast } from "../model/useToast";
import { GithubMark } from "./brand";
import { Btn, ChoiceCards, Toggle } from "./controls";
import { Card, ListLine, MoreRow, Row, Sub } from "./Row";
import type { RowViewProps } from "./rowTypes";

/**
 * AI 비서(서버에 AI 가 없다: ai). 실제 모드에서는 섹션째 숨기고, 데모에서는 화면 안 상태로만 바뀐다.
 * 빗금이 끄기만 이 브라우저에 저장한다(usePetEnabled, Task 9 가 읽음).
 */

const ico = { size: 16, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

export function PetRow() {
  const { t } = useTranslation();
  const [on, set] = usePetEnabled();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  return (
    <Row id="pet" title={t("settingsSheet.row.pet.t")} desc={t("settingsSheet.row.pet.d")}>
      <Toggle on={on} label={t("settingsSheet.ai.petLabel")} onChange={set} />
    </Row>
  );
}

export function ToolsRow() {
  const { t } = useTranslation();
  const [p, set] = useLocalPrefs();
  const link = useIntegrations();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  const tool = (k: keyof LocalPrefs["tools"], icon: ReactNode, name: string, desc: string) => (
    <ListLine key={k} icon={icon} title={name} desc={desc}>
      <Toggle on={p.tools[k]} label={name} onChange={(v) => set({ tools: { ...p.tools, [k]: v } })} />
    </ListLine>
  );
  return (
    <Row id="tools" wide title={t("settingsSheet.row.tools.t")} desc={t("settingsSheet.row.tools.d")}>
      <ul className="sx-list">
        {tool("cal", <CalendarDays {...ico} />, t("settingsSheet.ai.tool.cal"), t("settingsSheet.ai.tool.calD"))}
        {tool("todo", <CheckSquare {...ico} />, t("settingsSheet.ai.tool.todo"), t("settingsSheet.ai.tool.todoD"))}
        {tool("retro", <FileText {...ico} />, t("settingsSheet.ai.tool.retro"), t("settingsSheet.ai.tool.retroD"))}
        {link.gh.status === "connected" ? tool("gh", <GithubMark size={16} />, t("settingsSheet.ai.tool.gh"), t("settingsSheet.ai.tool.ghD")) : null}
      </ul>
    </Row>
  );
}

export function ConfirmRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const [p, set] = useLocalPrefs();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  return (
    <MoreRow
      id="confirm"
      defaultOpen={force}
      title={t("settingsSheet.row.confirm.t")}
      desc={t("settingsSheet.row.confirm.d")}
      summary={t(p.confirm === "always" ? "settingsSheet.ai.confirm.always" : "settingsSheet.ai.confirm.small")}
    >
      <ChoiceCards
        value={p.confirm}
        label={t("settingsSheet.row.confirm.t")}
        onChange={(v) => set({ confirm: v })}
        options={[
          { value: "always", label: t("settingsSheet.ai.confirm.always"), desc: t("settingsSheet.ai.confirm.alwaysD") },
          { value: "small", label: t("settingsSheet.ai.confirm.small"), desc: t("settingsSheet.ai.confirm.smallD") },
        ]}
      />
      <p className="sx-note">{t("settingsSheet.ai.confirm.note")}</p>
    </MoreRow>
  );
}

export function StyleRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const [p, set] = useLocalPrefs();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  return (
    <MoreRow
      id="style"
      defaultOpen={force}
      title={t("settingsSheet.row.style.t")}
      desc={t("settingsSheet.row.style.d")}
      summary={t("settingsSheet.ai.styleSum", {
        deep: t(p.deep === "on" ? "settingsSheet.on" : "settingsSheet.off"),
        len: t(p.len === "quick" ? "settingsSheet.ai.len.quick" : "settingsSheet.ai.len.deep"),
      })}
    >
      <div className="sxa-pair">
        <p className="sxa-q">{t("settingsSheet.ai.q.deep")}</p>
        <ChoiceCards
          value={p.deep}
          label={t("settingsSheet.ai.q.deep")}
          onChange={(v) => set({ deep: v })}
          options={[
            { value: "on", label: t("settingsSheet.ai.deep.on"), desc: t("settingsSheet.ai.deep.onD") },
            { value: "off", label: t("settingsSheet.ai.deep.off"), desc: t("settingsSheet.ai.deep.offD") },
          ]}
        />
        <p className="sxa-q">{t("settingsSheet.ai.q.len")}</p>
        <ChoiceCards
          value={p.len}
          label={t("settingsSheet.ai.q.len")}
          onChange={(v) => set({ len: v })}
          options={[
            { value: "quick", label: t("settingsSheet.ai.len.quick"), desc: t("settingsSheet.ai.len.quickD") },
            { value: "deep", label: t("settingsSheet.ai.len.deep"), desc: t("settingsSheet.ai.len.deepD") },
          ]}
        />
      </div>
    </MoreRow>
  );
}

export function MemoRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const [p, set] = useLocalPrefs();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  const memo = p.memo ?? t("settingsSheet.ai.memoDefault");
  return (
    <MoreRow
      id="memo"
      defaultOpen={force}
      title={t("settingsSheet.row.memo.t")}
      desc={t("settingsSheet.row.memo.d")}
      summary={t("settingsSheet.ai.lines", { n: memo.split("\n").filter(Boolean).length })}
    >
      <textarea className="sx-ta" rows={4} value={memo} aria-label={t("settingsSheet.row.memo.t")} onChange={(e) => set({ memo: e.target.value })} />
    </MoreRow>
  );
}

export function SchedRow({ force, onGoAi }: RowViewProps & { onGoAi?: () => void }) {
  const { t } = useTranslation();
  const [p, set] = useLocalPrefs();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  return (
    <MoreRow
      id="sched"
      defaultOpen={force}
      title={t("settingsSheet.row.sched.t")}
      desc={t("settingsSheet.row.sched.d")}
      summary={t("settingsSheet.ai.schedOn", { n: p.sched.filter(Boolean).length })}
    >
      <ul className="sx-list">
        {DEMO_SCHED.map((s, i) => (
          <ListLine key={s.what} title={t(s.what)} desc={t(s.when)}>
            <Toggle on={!!p.sched[i]} label={t(s.what)} onChange={(v) => set({ sched: p.sched.map((x, j) => (j === i ? v : x)) })} />
          </ListLine>
        ))}
      </ul>
      {onGoAi ? <Btn onClick={onGoAi}>{t("settingsSheet.ai.schedNew")}</Btn> : null}
    </MoreRow>
  );
}

export function HistoryRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [p, set] = useLocalPrefs();
  const [wipe, setWipe] = useState(false);
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  const opts = (["30", "90", "ever"] as const).map((v) => ({ value: v, label: t(`settingsSheet.ai.keep.${v}`), desc: t(`settingsSheet.ai.keep.${v}D`) }));
  return (
    <MoreRow
      id="history"
      defaultOpen={force}
      title={t("settingsSheet.row.history.t")}
      desc={t("settingsSheet.row.history.d")}
      summary={t(`settingsSheet.ai.keep.${p.aiKeep}`)}
    >
      <ChoiceCards value={p.aiKeep} options={opts} label={t("settingsSheet.row.history.t")} onChange={(v) => set({ aiKeep: v })} />
      <span className="sx-tr">
        {wipe ? (
          <>
            <Btn onClick={() => setWipe(false)}>{t("settingsSheet.cancel")}</Btn>
            <Btn
              kind="danger"
              onClick={() => {
                setWipe(false);
                toast(t("settingsSheet.ai.wiped"), "success");
              }}
            >
              {t("settingsSheet.ai.wipeGo")}
            </Btn>
          </>
        ) : (
          <Btn onClick={() => setWipe(true)}>{t("settingsSheet.ai.wipe")}</Btn>
        )}
      </span>
    </MoreRow>
  );
}

export function SectionAi({ onGoAi }: { onGoAi?: () => void }) {
  const { t } = useTranslation();
  const aiOn = useServerFeature("ai");
  if (!aiOn) return null;
  return (
    <>
      <p className="sx-note">{t("settingsSheet.ai.note")}</p>
      <Card>
        <PetRow />
        <ToolsRow />
      </Card>
      <Sub>{t("settingsSheet.more")}</Sub>
      <Card>
        <ConfirmRow />
        <StyleRow />
        <MemoRow />
        <SchedRow onGoAi={onGoAi} />
        <HistoryRow />
      </Card>
    </>
  );
}
