import { useEffect } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { RetrospectiveType } from "@/entities/entry/model/types";
import {
  apiCreateSummaryTemplate,
  apiDeleteSummaryTemplate,
  apiListSummaryTemplates,
  apiSetActiveSummaryTemplate,
  apiUpdateSummaryTemplate,
  isApiError,
  type SummaryTemplate,
} from "@/shared/api";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { DEMO_SUMMARY_TEMPLATES } from "./demo";
import { createStore } from "./store";
import { useToast } from "./useToast";

/**
 * 회고 템플릿(기간별). 일간은 기존 /templates(AppProvider), 주간, 월간, 연간은 AI 요약 템플릿 /summaries/templates.
 * 기존 settings-studio TemplatesCard 의 동작(만들기, 고치기, 지우기, 사용할 템플릿 고르기, 기본 템플릿 되돌리기)을 그대로 쓴다.
 * 데모는 요약 템플릿을 서버 대신 화면 안 상태로 둔다.
 */
export type Period = "day" | "week" | "month" | "year";
export const PERIODS: readonly Period[] = ["day", "week", "month", "year"];
export const perKey = (p: Period) => `settingsSheet.per.${p}` as TranslationKey;
type SumType = SummaryTemplate["summaryType"];
const SUM_TYPE: Record<Exclude<Period, "day">, SumType> = { week: "weekly", month: "monthly", year: "annual" };
const PERIOD_OF: Record<SumType, Period> = { weekly: "week", monthly: "month", annual: "year" };

export interface Tpl {
  id: string;
  per: Period;
  name: string;
  content: string;
  /** 일간 기본 제공 템플릿(이름 고정, 지울 수 없음, 되돌리기 가능) */
  builtin: boolean;
  active: boolean;
}

const DEFAULT_NAME_KEY: Partial<Record<RetrospectiveType, TranslationKey>> = { daily: "settings.templates.defaultName.daily" };

interface SumState {
  loaded: boolean;
  list: SummaryTemplate[];
}
const sumStore = createStore<SumState>({ loaded: false, list: [] });
let loading = false;

function demoSeed(locale: string): SummaryTemplate[] {
  const now = new Date().toISOString();
  return (Object.keys(DEMO_SUMMARY_TEMPLATES) as SumType[]).flatMap((type) =>
    DEMO_SUMMARY_TEMPLATES[type].map((x) => {
      const [name, content] = locale === "ko" ? x.ko : x.en;
      return { id: x.id, summaryType: type, name, content, isActive: x.active, createdAt: now, updatedAt: null };
    }),
  );
}

export function useRetroTemplates() {
  const { state, addTemplate, updateTemplate, deleteTemplate, resetTemplate, setActiveTemplate } = useArchiveApp();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const sum = sumStore.use();
  const demo = isDemoMode();

  useEffect(() => {
    if (sumStore.get().loaded || loading) return;
    if (demo) {
      sumStore.set({ loaded: true, list: demoSeed(locale) });
      return;
    }
    loading = true;
    void Promise.all((["weekly", "monthly", "annual"] as SumType[]).map((type) => apiListSummaryTemplates(type)))
      .then((lists) => sumStore.set({ loaded: true, list: lists.flat() }))
      .catch((err: unknown) => {
        sumStore.set({ loaded: true, list: [] });
        const code = isApiError(err) ? err.code : "UNKNOWN";
        toast(t("settings.templates.error.load"), "warning", t("common.errorCode", { code }));
      })
      .finally(() => {
        loading = false;
      });
  }, [demo, locale, t, toast]);

  const daily: Tpl[] = state.templates
    .filter((x) => x.retroType === "daily")
    .map((x) => ({
      id: x.id,
      per: "day",
      name: x.isDefault && DEFAULT_NAME_KEY.daily ? t(DEFAULT_NAME_KEY.daily) : x.name,
      content: x.content,
      builtin: x.isDefault,
      active: state.activeTemplateIds.daily === x.id,
    }));
  const others: Tpl[] = sum.list.map((x) => ({
    id: x.id,
    per: PERIOD_OF[x.summaryType],
    name: x.name,
    content: x.content,
    builtin: false,
    active: x.isActive,
  }));
  const list = [...daily, ...others];

  const fail = (titleKey: TranslationKey, err: unknown) => {
    const code = isApiError(err) ? err.code : "UNKNOWN";
    if (code === "RETRO_SUMMARY_TEMPLATE_LIMIT_REACHED") toast(t("settings.templates.error.limit"), "warning", t("settings.templates.error.limitMessage"));
    else if (code === "RETRO_SUMMARY_TEMPLATE_NAME_DUPLICATED") toast(t("settings.templates.error.duplicate"), "warning", t("settings.templates.error.duplicateMessage"));
    else toast(t(titleKey), "warning", t("common.errorCode", { code }));
  };
  const reload = () => {
    if (demo) return;
    void Promise.all((["weekly", "monthly", "annual"] as SumType[]).map((type) => apiListSummaryTemplates(type)))
      .then((lists) => sumStore.set({ loaded: true, list: lists.flat() }))
      .catch(() => {});
  };
  const patchSum = (fn: (l: SummaryTemplate[]) => SummaryTemplate[]) => sumStore.set((s) => ({ ...s, list: fn(s.list) }));

  async function setDefault(tpl: Tpl): Promise<void> {
    if (tpl.per === "day") {
      setActiveTemplate("daily", tpl.id);
      return;
    }
    const type = SUM_TYPE[tpl.per];
    patchSum((l) => l.map((x) => (x.summaryType === type ? { ...x, isActive: x.id === tpl.id } : x)));
    if (demo) return;
    try {
      await apiSetActiveSummaryTemplate(type, tpl.id);
    } catch (err) {
      fail("settings.templates.error.setActive", err);
      reload();
    }
  }

  async function create(per: Period, name: string, content: string, makeDefault: boolean): Promise<Tpl | null> {
    if (per === "day") {
      const x = addTemplate("daily", name, content);
      if (makeDefault) setActiveTemplate("daily", x.id);
      return { id: x.id, per, name, content, builtin: false, active: makeDefault };
    }
    const type = SUM_TYPE[per];
    try {
      const x: SummaryTemplate = demo
        ? { id: `t${Date.now()}`, summaryType: type, name, content, isActive: false, createdAt: new Date().toISOString(), updatedAt: null }
        : await apiCreateSummaryTemplate(type, name, content);
      patchSum((l) => [...l, x]);
      const tpl: Tpl = { id: x.id, per, name: x.name, content: x.content, builtin: false, active: false };
      if (makeDefault) await setDefault(tpl);
      return tpl;
    } catch (err) {
      fail("settings.templates.error.create", err);
      return null;
    }
  }

  async function update(tpl: Tpl, patch: { name: string; content: string }, makeDefault: boolean): Promise<boolean> {
    if (tpl.per === "day") {
      updateTemplate(tpl.id, tpl.builtin ? { content: patch.content } : patch);
      if (makeDefault && !tpl.active) setActiveTemplate("daily", tpl.id);
      return true;
    }
    patchSum((l) => l.map((x) => (x.id === tpl.id ? { ...x, ...patch } : x)));
    try {
      if (!demo) await apiUpdateSummaryTemplate(tpl.id, patch);
      if (makeDefault && !tpl.active) await setDefault(tpl);
      return true;
    } catch (err) {
      fail("settings.templates.error.save", err);
      reload();
      return false;
    }
  }

  async function remove(tpl: Tpl): Promise<void> {
    if (tpl.per === "day") {
      deleteTemplate(tpl.id);
      return;
    }
    patchSum((l) => l.filter((x) => x.id !== tpl.id));
    if (demo) return;
    try {
      await apiDeleteSummaryTemplate(tpl.id);
    } catch (err) {
      fail("settings.templates.error.delete", err);
      reload();
    }
  }

  return {
    list,
    loaded: sum.loaded,
    create,
    update,
    remove,
    setDefault,
    /** 일간 기본 템플릿을 처음 내용으로 */
    reset: () => resetTemplate("daily"),
  };
}
