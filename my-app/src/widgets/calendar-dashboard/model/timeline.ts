import type { Todo } from "@/entities/todo/model/types";

/** 일간 타임라인의 시각/레이아웃 상수. */
export const HOUR_PX = 56; // 1시간당 세로 픽셀
export const PX_PER_MIN = HOUR_PX / 60;
export const MINUTES_IN_DAY = 24 * 60;
/** 드래그 시간 재배치 스냅 단위(분). */
export const SNAP_MIN = 15;
/** 블록 최소 표시 길이(분) — 짧은 블록도 클릭 가능하게. */
export const MIN_BLOCK_MIN = 30;
/** 시간 정보 없는 할 일의 기본 블록 길이(분). */
export const DEFAULT_BLOCK_MIN = 60;

/** "HH:mm" → 자정 기준 분. 형식이 아니면 null. */
export function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** 자정 기준 분 → "HH:mm" (24시간제, 0~1440 클램프). */
export function formatTime(totalMin: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(totalMin)));
  // 24:00 은 23:59 로 표기
  const safe = clamped === MINUTES_IN_DAY ? MINUTES_IN_DAY - 1 : clamped;
  const h = Math.floor(safe / 60);
  const min = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** 분을 SNAP_MIN 단위로 반올림. */
export function snap(min: number): number {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}

/** ISO 타임스탬프의 로컬 시:분을 자정 기준 분으로. 파싱 실패 시 null. */
function minutesFromCreatedAt(createdAt: string): number | null {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

export interface TimelineBlock {
  todo: Todo;
  /** 자정 기준 시작/종료 분. */
  startMin: number;
  endMin: number;
  /** createdAt 으로부터 자동 유도된 블록인지(명시 시간이 아님). */
  derived: boolean;
  /** 겹침 레인 배치: 0-based 열 인덱스 / 해당 클러스터의 총 열 수. */
  lane: number;
  lanes: number;
}

export interface TimelineModel {
  /** 시간축에 배치되는 블록들(시작 시각 오름차순). */
  blocks: TimelineBlock[];
  /** 시간 정보가 없어 배치 불가한 할 일(오늘이 아닌 날짜). 상단 "종일" 영역에 표시. */
  untimed: Todo[];
}

/** todo 하나의 (startMin, endMin, derived) 를 계산. 배치 불가면 null. */
function resolveTimes(
  todo: Todo,
  isToday: boolean,
): { startMin: number; endMin: number; derived: boolean } | null {
  const start = parseTime(todo.startTime);
  if (start !== null) {
    const parsedEnd = parseTime(todo.endTime);
    const end =
      parsedEnd !== null && parsedEnd > start
        ? parsedEnd
        : start + DEFAULT_BLOCK_MIN;
    return { startMin: start, endMin: Math.min(end, MINUTES_IN_DAY), derived: false };
  }
  // 명시 시간 없음 → 오늘 한정 createdAt 기준 1시간 블록
  if (isToday) {
    const created = minutesFromCreatedAt(todo.createdAt);
    if (created !== null) {
      return {
        startMin: created,
        endMin: Math.min(created + DEFAULT_BLOCK_MIN, MINUTES_IN_DAY),
        derived: true,
      };
    }
  }
  return null;
}

/**
 * 겹치는 블록들을 레인(열)으로 나눠 나란히 배치한다.
 * 연결된(연쇄적으로 겹치는) 클러스터 단위로 총 열 수를 정해 폭을 균등 분할.
 * 드래그 프리뷰에서도 재사용할 수 있도록 export.
 *
 * prefs: 블록별 선호 레인(사용자가 드래그로 지정한 열). 선호 레인이 비어 있을 때만
 * 사용하고 점유 중이면 가장 작은 빈 레인으로 폴백하므로, 어떤 prefs 조합에서도
 * 두 블록이 같은 레인에서 시간이 겹치는 일은 구조적으로 발생하지 않는다.
 */
export function assignLanes(
  items: { startMin: number; endMin: number }[],
  prefs?: (number | undefined)[],
): { lane: number; lanes: number }[] {
  const result: { lane: number; lanes: number }[] = items.map(() => ({
    lane: 0,
    lanes: 1,
  }));
  // 시작 시각 순으로 인덱스 정렬 (동시각이면 종료 시각 순 — 결정적 배치)
  const order = items
    .map((_, i) => i)
    .sort(
      (a, b) =>
        items[a].startMin - items[b].startMin ||
        items[a].endMin - items[b].endMin,
    );

  let cluster: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneItems: number[][] = []; // 레인별 배치된 item 인덱스
    const fits = (lane: number[], idx: number) =>
      lane.every(
        (j) =>
          !(
            items[j].startMin < items[idx].endMin &&
            items[idx].startMin < items[j].endMin
          ),
      );
    const placeAt = (idx: number, l: number) => {
      while (laneItems.length <= l) laneItems.push([]);
      laneItems[l].push(idx);
      result[idx].lane = l;
    };

    // 1차: 선호 레인 블록 우선 배치 — 늦게 시작하는 블록도 사용자가 지정한
    // 레인을 차지할 수 있도록 자연 배치보다 먼저 자리를 잡는다.
    const deferred: number[] = [];
    for (const idx of cluster) {
      const pref = prefs?.[idx];
      if (
        pref !== undefined &&
        pref >= 0 &&
        (pref >= laneItems.length || fits(laneItems[pref], idx))
      ) {
        placeAt(idx, pref);
      } else {
        deferred.push(idx);
      }
    }
    // 2차: 나머지(선호 없음/선호 자리 점유됨)는 들어갈 수 있는 가장 작은 레인
    for (const idx of deferred) {
      let placed = -1;
      for (let l = 0; l < laneItems.length; l++) {
        if (fits(laneItems[l], idx)) {
          placed = l;
          break;
        }
      }
      placeAt(idx, placed === -1 ? laneItems.length : placed);
    }
    // 선호 레인 확장이 만든 빈 레인을 압축 (사용 레인의 좌우 순서는 유지)
    let next = 0;
    const remap = laneItems.map((li) => (li.length > 0 ? next++ : -1));
    for (const idx of cluster) {
      result[idx].lane = remap[result[idx].lane];
      result[idx].lanes = next;
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const idx of order) {
    if (cluster.length > 0 && items[idx].startMin >= clusterEnd) {
      // 현재 클러스터와 겹치지 않음 → 마감하고 새 클러스터 시작
      flush();
    }
    cluster.push(idx);
    clusterEnd = Math.max(clusterEnd, items[idx].endMin);
  }
  flush();

  return result;
}

/**
 * 특정 날짜(dayKey)의 할 일들을 일간 타임라인 모델로 변환한다.
 * @param todayKey "오늘"의 dateKey — dayKey 가 오늘일 때만 시간 미지정 할 일을 createdAt 으로 유도.
 */
export function buildTimeline(
  todos: Todo[],
  dayKey: string,
  todayKey: string,
): TimelineModel {
  const isToday = dayKey === todayKey;
  const dayTodos = todos.filter((t) => t.dateKey === dayKey);

  const placed: { todo: Todo; startMin: number; endMin: number; derived: boolean }[] =
    [];
  const untimed: Todo[] = [];

  for (const todo of dayTodos) {
    const r = resolveTimes(todo, isToday);
    if (r) placed.push({ todo, ...r });
    else untimed.push(todo);
  }

  const lanes = assignLanes(
    placed.map((p) => ({ startMin: p.startMin, endMin: p.endMin })),
  );

  const blocks: TimelineBlock[] = placed
    .map((p, i) => ({
      todo: p.todo,
      startMin: p.startMin,
      endMin: p.endMin,
      derived: p.derived,
      lane: lanes[i].lane,
      lanes: lanes[i].lanes,
    }))
    .sort((a, b) => a.startMin - b.startMin);

  return { blocks, untimed };
}
