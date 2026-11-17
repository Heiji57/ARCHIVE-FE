/**
 * 주제 화면 데이터. 데모 모드는 entities/topic 의 데모 묶음(로컬 상태, 서버 호출 없음),
 * 실제 모드는 서버 주제 목록과 열린 주제의 정리 문서(markdown).
 * 구조화 정리 결과(useServerFeature("topicStructured"))가 없는 실제 모드는 structured 가 늘 null 이다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { useTranslation } from "@/shared/lib/i18n";
import { buildDemoTopics, type DemoTopicBundle, type DemoTopicEntry } from "@/entities/topic/model/demo";
import type { GitHubCommit } from "@/entities/github/model/types";
import type { Topic, TopicSourceMap, TopicStructured } from "@/entities/topic/model/types";
import { assignTopicColors, entrySpan } from "./structured";
import { useLiveTopicDigest, useLiveTopicList, type DigestProgress } from "./useLiveTopics";

export type TopicStatus = "none" | "pending" | "completed" | "failed";

/** 목록 카드와 본문이 쓰는 주제 한 개 */
export interface TopicView {
  topic: Topic;
  /** 주제 색 0..3 (--tpc1..4) */
  color: number;
  status: TopicStatus;
  /** 정리 기준 날짜 */
  watermark: string | null;
  /** 구조화 정리 결과(정리됐고 서버가 줄 때만) */
  structured: TopicStructured | null;
  sources: TopicSourceMap;
  /** 근거 회고 기간 */
  span: [string, string] | null;
  /** 정리 뒤에 쓴 회고 수 */
  newer: number;
  entries: number | null;
  todos: number | null;
}

export interface TopicStudioData {
  demo: boolean;
  structuredOn: boolean;
  today: string;
  loading: boolean;
  error: boolean;
  refetch: () => void;
  views: TopicView[];
  /** 열린 주제의 실제 모드 정리 문서 */
  open: {
    markdown: string | null;
    loading: boolean;
    generating: boolean;
    progress: DigestProgress | null;
    generateError: boolean;
  };
  /** 자세히 보기의 회고 원문(데모만) */
  entries: Record<string, DemoTopicEntry>;
  commits: GitHubCommit[];
  generate: (id: string) => void;
  rename: (id: string, name: string) => void;
  describe: (id: string, description: string) => void;
  create: (name: string, description: string) => Promise<Topic | null>;
}

const COLOR_KEY = "archive.topicColors";
const readColors = (): Record<string, number> => {
  try {
    const v = JSON.parse(localStorage.getItem(COLOR_KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

/** createdAt 순 색. 지운 주제가 있어도 남은 주제 색이 그대로이게 정한 색을 기억한다. */
function useTopicColors(topics: Topic[], persist: boolean) {
  // 저장한 색(지난번 결과)을 읽어 남은 주제는 그 색을 쓰고, 새 결과를 다시 저장한다.
  const colors = useMemo(() => assignTopicColors(topics, persist ? readColors() : {}), [topics, persist]);
  useEffect(() => {
    if (!persist || !topics.length) return;
    try {
      localStorage.setItem(COLOR_KEY, JSON.stringify(colors));
    } catch {
      /* 저장 못 해도 색은 createdAt 순으로 정해진다 */
    }
  }, [colors, persist, topics.length]);
  return colors;
}

const DEMO_GENERATE_MS = 1800;

export function useTopicStudioData(openId: string | null): TopicStudioData {
  const demo = isDemoMode();
  const structuredOn = useServerFeature("topicStructured");
  const today = useTodayKey();
  const { pushNotification } = useArchiveApp();
  const { t } = useTranslation();

  // ─── 데모 ───
  const [bundle, setBundle] = useState<DemoTopicBundle>(() => buildDemoTopics(today));
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((x) => window.clearTimeout(x)), []);

  // ─── 실제 ───
  const live = useLiveTopicList(!demo);
  const digest = useLiveTopicDigest(openId, !demo);

  const topics = demo ? bundle.topics : live.topics;
  const colors = useTopicColors(topics, !demo);

  const views = useMemo<TopicView[]>(() => {
    if (demo) {
      return bundle.topics.map((topic) => {
        const d = bundle.digests[topic.id];
        const status: TopicStatus = d.status === "none" ? "none" : d.status === "completed" ? "completed" : d.status === "failed" ? "failed" : "pending";
        const done = status === "completed";
        return {
          topic,
          color: colors[topic.id] ?? 0,
          status,
          watermark: d.watermarkDateKey,
          structured: done && structuredOn ? d.structured : null,
          sources: d.sources,
          span: d.periodStartDateKey && d.periodEndDateKey ? [d.periodStartDateKey, d.periodEndDateKey] : entrySpan(d.structured, d.sources),
          newer: done ? d.unreflectedEntryCount : 0,
          entries: topic.entryCount,
          todos: topic.todoCount,
        };
      });
    }
    return live.topics.map((topic) => {
      const isOpen = topic.id === openId;
      const dg = isOpen ? digest.digest : null;
      const status: TopicStatus = isOpen && digest.generating
        ? "pending"
        : dg
          ? dg.status === "completed" ? "completed" : dg.status === "failed" ? (dg.content ? "completed" : "failed") : "pending"
          : topic.digestWatermarkDateKey ? "completed" : "none";
      return {
        topic,
        color: colors[topic.id] ?? 0,
        status,
        watermark: dg?.watermarkDateKey ?? topic.digestWatermarkDateKey,
        structured: null,
        sources: {},
        span: null,
        newer: 0,
        entries: topic.entryCount,
        todos: topic.todoCount,
      };
    });
  }, [demo, bundle, colors, structuredOn, live.topics, openId, digest.digest, digest.generating]);

  const generate = useCallback(
    (id: string) => {
      if (!demo) {
        if (id === openId) digest.generate();
        return;
      }
      setBundle((b) => ({ ...b, digests: { ...b.digests, [id]: { ...b.digests[id], status: "pending" } } }));
      timers.current.push(
        window.setTimeout(() => {
          setBundle((b) => ({
            ...b,
            topics: b.topics.map((x) => (x.id === id ? { ...x, digestWatermarkDateKey: today } : x)),
            digests: {
              ...b.digests,
              [id]: { ...b.digests[id], status: "completed", watermarkDateKey: today, unreflectedEntryCount: 0 },
            },
          }));
          const name = bundle.topics.find((x) => x.id === id)?.name ?? "";
          pushNotification("success", t("topic.v.organized", { name }), "", { transient: true });
        }, DEMO_GENERATE_MS),
      );
    },
    [demo, openId, digest, today, bundle.topics, pushNotification, t],
  );

  const patchTopic = useCallback(
    (id: string, p: { name?: string; description?: string }) => {
      if (demo) {
        setBundle((b) => ({ ...b, topics: b.topics.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
        return;
      }
      live.update(id, p).catch(() => {
        pushNotification("warning", t("topic.crud.nameDuplicated"), "", { transient: true });
        live.refetch();
      });
    },
    [demo, live, pushNotification, t],
  );

  const create = useCallback(
    async (name: string, description: string): Promise<Topic | null> => {
      if (demo) {
        const topic: Topic = {
          id: `tp${Date.now()}`,
          name,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          entryCount: 0,
          todoCount: 0,
          digestWatermarkDateKey: null,
        };
        setBundle((b) => ({
          ...b,
          topics: [topic, ...b.topics],
          digests: {
            ...b.digests,
            [topic.id]: {
              status: "none",
              watermarkDateKey: null,
              structured: { version: 1, summary: "", themes: [] },
              sources: {},
              unreflectedEntryCount: 0,
              extraEntryIds: [],
              periodStartDateKey: null,
              periodEndDateKey: null,
            },
          },
        }));
        return topic;
      }
      try {
        return await live.create(name, description);
      } catch {
        pushNotification("warning", t("topic.crud.nameDuplicated"), "", { transient: true });
        return null;
      }
    },
    [demo, live, pushNotification, t],
  );

  return {
    demo,
    structuredOn,
    today,
    loading: !demo && live.loading,
    error: !demo && live.error,
    refetch: live.refetch,
    views,
    open: {
      markdown: demo ? null : (digest.digest?.content ?? null),
      loading: !demo && digest.loading,
      generating: !demo && digest.generating,
      progress: digest.progress,
      generateError: !demo && digest.generateError,
    },
    entries: demo ? bundle.entries : {},
    commits: demo ? bundle.commits : [],
    generate,
    rename: (id, name) => patchTopic(id, { name }),
    describe: (id, description) => patchTopic(id, { description }),
    create,
  };
}
