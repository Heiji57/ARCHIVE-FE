import { useEffect, useSyncExternalStore } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { GitHubCommit } from "@/entities/github/model/types";
import { canUseGithub } from "@/shared/lib/permissions";

/**
 * 그날 커밋(GET /github/commits?date, 데모는 데모 커밋). 커밋 탭, 탭 숫자, 하루 닫기가 같이 쓰므로
 * 날짜별로 잠깐 기억한다(2분 지나면 다시 부름). GitHub 이 연결돼 있지 않으면 부르지 않는다.
 */
const STALE_MS = 120_000;
const cache = new Map<string, { at: number; list: GitHubCommit[] }>();
const inflight = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

const emit = () => {
  version++;
  for (const l of listeners) l();
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** 커밋 목록(시각 순). 불러오는 중이면 null. */
export function useDayCommits(dateKey: string): GitHubCommit[] | null {
  const { state, loadCommits } = useArchiveApp();
  const on = canUseGithub(state.github);
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );

  useEffect(() => {
    if (!on) return;
    const hit = cache.get(dateKey);
    if ((hit && Date.now() - hit.at < STALE_MS) || inflight.has(dateKey)) return;
    inflight.add(dateKey);
    void loadCommits(dateKey)
      .then((list) => {
        cache.set(dateKey, {
          at: Date.now(),
          list: [...list].sort((a, b) => a.committedAt.localeCompare(b.committedAt)),
        });
      })
      .finally(() => {
        inflight.delete(dateKey);
        emit();
      });
    // loadCommits 는 렌더마다 새로 만들어지므로 날짜와 연결 여부만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, on]);

  if (!on) return [];
  return cache.get(dateKey)?.list ?? null;
}

/** 커밋 시각 "HH:mm"(브라우저 시간). */
export function commitTime(c: GitHubCommit): string {
  const d = new Date(c.committedAt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 저장소 짧은 이름(owner/name → name). */
export const repoName = (c: GitHubCommit) => c.fullName.split("/").pop() ?? c.fullName;
