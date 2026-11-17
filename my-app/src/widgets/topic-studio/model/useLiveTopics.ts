/**
 * 실제 모드(데모 아님)의 주제 목록과 정리 문서. 기존 `retrospective-studio/model/useTopics`,
 * `useTopicDigest` 의 동작(정리 생성 202 → SSE + 폴링으로 완료 감시, 열 때 진행 중이면 이어받기)을 그대로 옮기고,
 * effect 안에서 setState 를 바로 부르지 않게 고쳤다(react-hooks 규칙).
 * `enabled` 가 false(데모)면 서버를 부르지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { isApiError, streamTopicDigest } from "@/shared/api";
import { useTranslation } from "@/shared/lib/i18n";
import type { Topic, TopicDigest } from "@/entities/topic/model/types";

interface ListState {
  topics: Topic[];
  loaded: boolean;
  error: boolean;
}

export function useLiveTopicList(enabled: boolean) {
  const { loadTopics, createTopic, updateTopic } = useArchiveApp();
  const [state, setState] = useState<ListState>({ topics: [], loaded: false, error: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadTopics()
      .then((topics) => alive && setState({ topics, loaded: true, error: false }))
      .catch(() => alive && setState((s) => ({ ...s, loaded: true, error: true })));
    return () => {
      alive = false;
    };
  }, [enabled, loadTopics, tick]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);
  const create = useCallback(
    async (name: string, description: string) => {
      const topic = await createTopic(name, description);
      setState((s) => ({ ...s, topics: [...s.topics, topic] }));
      return topic;
    },
    [createTopic],
  );
  const update = useCallback(
    async (id: string, patch: { name?: string; description?: string }) => {
      const u = await updateTopic(id, patch);
      // PATCH 단건 응답은 수 필드가 null 이라 바뀐 필드만 합친다(entities/topic Topic 주석).
      setState((s) => ({
        ...s,
        topics: s.topics.map((t) =>
          t.id === id ? { ...t, name: u.name, description: u.description, updatedAt: u.updatedAt } : t,
        ),
      }));
      return u;
    },
    [updateTopic],
  );

  return { topics: state.topics, loading: enabled && !state.loaded, error: state.error, refetch, create, update };
}

export interface DigestProgress {
  processed: number;
  total: number;
}

interface DigestState {
  topicId: string | null;
  digest: TopicDigest | null;
  loaded: boolean;
  loadError: boolean;
  generating: boolean;
  progress: DigestProgress | null;
  generateError: boolean;
}

const EMPTY: Omit<DigestState, "topicId"> = {
  digest: null,
  loaded: false,
  loadError: false,
  generating: false,
  progress: null,
  generateError: false,
};

const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 72; // 6분

export function useLiveTopicDigest(topicId: string | null, enabled: boolean) {
  const { getTopicDigest, generateTopicDigest, pushNotification } = useArchiveApp();
  const { t } = useTranslation();
  const [st, setSt] = useState<DigestState>({ topicId: null, ...EMPTY });
  const [tick, setTick] = useState(0);
  const gen = useRef(0);
  const stopRef = useRef<() => void>(() => {});

  const patch = useCallback((id: string, p: Partial<DigestState>) => {
    setSt((s) => (s.topicId === id ? { ...s, ...p } : { topicId: id, ...EMPTY, ...p }));
  }, []);

  const stop = useCallback(() => {
    gen.current += 1;
    stopRef.current();
    stopRef.current = () => {};
  }, []);

  /** 생성 완료 감시(SSE + 폴링). 호출 전에 gen 을 새로 올려 둔 세대로 돈다. */
  const watch = useCallback(
    (id: string) => {
      const mine = gen.current;
      const stale = () => gen.current !== mine;
      let timer: number | null = null;
      let stopSse: (() => void) | null = null;
      const clear = () => {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        stopSse?.();
        stopSse = null;
      };
      stopRef.current = clear;
      const finish = (d: TopicDigest | null, failed: boolean) => {
        if (stale()) return;
        clear();
        patch(id, { generating: false, progress: null, ...(d ? { digest: d } : {}), ...(failed ? { generateError: true } : {}) });
      };
      let polls = 0;
      timer = window.setInterval(() => {
        if (stale()) return clear();
        if (++polls > MAX_POLLS) return finish(null, true);
        getTopicDigest(id)
          .then((d) => {
            if (stale() || !d) return;
            if (d.status === "completed") finish(d, false);
            else if (d.status === "failed") finish(d, true);
          })
          .catch(() => {});
      }, POLL_INTERVAL_MS);
      stopSse = streamTopicDigest(id, {
        onProgress: (processed, total) => !stale() && patch(id, { progress: { processed, total } }),
        onCompleted: () => {
          if (stale()) return;
          getTopicDigest(id)
            .then((d) => finish(d, false))
            .catch(() => {});
        },
        onFailed: () => finish(null, true),
        onTimeout: () => {},
        onError: () => {},
      });
    },
    [getTopicDigest, patch],
  );

  useEffect(() => {
    if (!enabled || !topicId) return;
    stop();
    const mine = gen.current;
    getTopicDigest(topicId)
      .then((d) => {
        if (gen.current !== mine) return;
        const running = !!d && (d.status === "pending" || d.status === "in_progress");
        patch(topicId, { digest: d, loaded: true, loadError: false, generating: running });
        if (running) {
          gen.current += 1;
          watch(topicId);
        }
      })
      .catch(() => gen.current === mine && patch(topicId, { loaded: true, loadError: true }));
    return () => stop();
  }, [enabled, topicId, tick, getTopicDigest, patch, stop, watch]);

  const cur = st.topicId === topicId ? st : { topicId, ...EMPTY };

  const generate = useCallback(() => {
    if (!enabled || !topicId || cur.generating) return;
    patch(topicId, { generating: true, generateError: false });
    stop();
    const mine = gen.current;
    generateTopicDigest(topicId)
      .then(() => gen.current === mine && watch(topicId))
      .catch((e) => {
        if (gen.current !== mine) return;
        if (isApiError(e) && e.code === "TOPIC_DIGEST_ALREADY_IN_PROGRESS") {
          pushNotification("info", t("topic.generate.alreadyInProgress"), "", { transient: true });
          watch(topicId);
          return;
        }
        patch(topicId, { generating: false, generateError: true });
      });
  }, [enabled, topicId, cur.generating, patch, stop, generateTopicDigest, watch, pushNotification, t]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  return {
    digest: cur.digest,
    loading: enabled && !!topicId && !cur.loaded,
    loadError: cur.loadError,
    generating: cur.generating,
    progress: cur.progress,
    generateError: cur.generateError,
    generate,
    refetch,
  };
}
