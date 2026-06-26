/** 앱 전역 debounce 기준값 (ms). 마지막 입력 후 이 시간이 지나면 API 전송. */
export const COALESCE_MS = 1500;

/**
 * 변경이 잦은 서버 쓰기(PATCH/PUT)를 키 단위로 모아 보내는 디바운스 코얼레싱 큐.
 *
 * 동작:
 *  - enqueue(key, patch): 같은 key 의 patch 를 머지(기본 shallow)하고 타이머를 리셋.
 *  - idle(delayMs) 경과 시 머지된 patch 를 send 로 1회 전송.
 *  - in-flight 중복 제거: 같은 key 전송이 진행 중이면, 그 사이 쌓인 patch 를
 *    완료 후 한 번 더 전송(최종 상태 보장).
 *  - flush/flushAll: 페이지 이탈·탭 숨김 시 즉시 전송해 유실 창을 최소화.
 *
 * UI 는 호출부에서 즉시 낙관적 업데이트하므로 이 큐는 "서버 전송"만 담당한다.
 */
export interface CoalescingQueue<P extends object> {
  enqueue(key: string, patch: P): void;
  /** 특정 key 의 대기 중 patch 를 즉시 전송. */
  flush(key: string): void;
  /** 모든 key 의 대기 중 patch 를 즉시 전송. */
  flushAll(): void;
  /** 특정 key 의 대기 중 patch 를 전송하지 않고 폐기. */
  cancel(key: string): void;
}

interface Entry<P> {
  patch: P;
  timer: number | null;
  inflight: boolean;
  /** in-flight 동안 새 patch 가 쌓였는지. */
  dirty: boolean;
}

export function createCoalescingQueue<P extends object>(opts: {
  delayMs: number;
  send: (key: string, merged: P) => Promise<unknown>;
  /** patch 병합 (기본: shallow Object.assign). */
  merge?: (prev: P, next: P) => P;
  onError?: (key: string, err: unknown) => void;
}): CoalescingQueue<P> {
  const { delayMs, send, onError } = opts;
  // 기본 병합: undefined 값은 "미변경"으로 보고 이전 값을 덮어쓰지 않는다.
  const defaultMerge = (prev: P, next: P): P => {
    const out = { ...(prev as object) } as Record<string, unknown>;
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined) out[k] = v;
    }
    return out as P;
  };
  const merge = opts.merge ?? defaultMerge;
  const entries = new Map<string, Entry<P>>();

  const clearTimer = (e: Entry<P>) => {
    if (e.timer !== null) {
      window.clearTimeout(e.timer);
      e.timer = null;
    }
  };

  const dispatchSend = (key: string) => {
    const e = entries.get(key);
    if (!e) return;
    clearTimer(e);
    if (e.inflight) {
      // 이미 전송 중 — 완료 콜백이 dirty 를 보고 재전송한다.
      e.dirty = true;
      return;
    }
    const payload = e.patch;
    e.inflight = true;
    e.dirty = false;
    e.patch = {} as P; // 다음 사이클을 위해 누적 초기화
    void send(key, payload)
      .catch((err) => onError?.(key, err))
      .finally(() => {
        const cur = entries.get(key);
        if (!cur) return;
        cur.inflight = false;
        if (cur.dirty) {
          // 전송 중 쌓인 변경을 한 번 더 보낸다.
          dispatchSend(key);
        } else if (cur.timer === null) {
          entries.delete(key);
        }
      });
  };

  return {
    enqueue(key, patch) {
      let e = entries.get(key);
      if (!e) {
        e = { patch: {} as P, timer: null, inflight: false, dirty: false };
        entries.set(key, e);
      }
      e.patch = merge(e.patch, patch);
      if (e.inflight) {
        e.dirty = true;
        return;
      }
      clearTimer(e);
      e.timer = window.setTimeout(() => dispatchSend(key), delayMs);
    },
    flush(key) {
      const e = entries.get(key);
      if (e && (e.timer !== null || e.dirty)) dispatchSend(key);
    },
    flushAll() {
      for (const key of [...entries.keys()]) {
        const e = entries.get(key);
        if (e && (e.timer !== null || e.dirty)) dispatchSend(key);
      }
    },
    cancel(key) {
      const e = entries.get(key);
      if (!e) return;
      clearTimer(e);
      if (!e.inflight) entries.delete(key);
      else {
        e.patch = {} as P;
        e.dirty = false;
      }
    },
  };
}
