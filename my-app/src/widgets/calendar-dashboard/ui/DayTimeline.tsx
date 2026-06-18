import { useEffect, useMemo, useRef, useState } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { useTranslation } from "@/shared/lib/i18n";
import {
  HOUR_PX,
  MIN_BLOCK_MIN,
  MINUTES_IN_DAY,
  PX_PER_MIN,
  assignLanes,
  buildTimeline,
  formatTime,
  snap,
  type TimelineBlock,
} from "../model/timeline";

export interface DayTimelineProps {
  dayKey: string;
  todayKey: string;
  todos: Todo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReschedule: (id: string, startTime: string, endTime: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DRAG_THRESHOLD_PX = 4;

type DragMode = "pending" | "free" | "resize-top" | "resize-bottom";

interface DragState {
  id: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  pointerStartY: number;
  pointerStartX: number;
  deltaMin: number;
  moved: boolean;
  mode: DragMode;
  /** 드래그 시작 시점의 레인 인덱스. */
  dragBlockLane: number;
  trackWidth: number;
  /** 커서 X 절대 위치로 결정되는 목표 레인. */
  targetLane: number;
}

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

interface Span {
  startMin: number;
  endMin: number;
}

/** 렌더 높이가 최소 MIN_BLOCK_MIN 이므로 레인 계산도 시각적 점유 구간 기준으로 한다. */
function visualSpan(b: Span): Span {
  return {
    startMin: b.startMin,
    endMin: Math.max(b.endMin, b.startMin + MIN_BLOCK_MIN),
  };
}

function overlapsSpan(a: Span, b: Span) {
  return a.startMin < b.endMin && a.endMin > b.startMin;
}

/**
 * free 드래그 레이아웃: 드래그 블록을 새 시간(ns~ne)으로 옮기고 targetLane 선호를
 * 적용해 전체 레인을 재배치한다. 드래그 프리뷰와 커밋이 이 함수 하나를 공유하므로
 * 놓았을 때 위치가 프리뷰와 달라질 수 없다.
 */
function layoutFreeDrag(
  blocks: TimelineBlock[],
  lanePrefs: Record<string, number>,
  dragId: string,
  ns: number,
  ne: number,
  targetLane: number,
): { layout: { lane: number; lanes: number }[]; prefs: Record<string, number> } {
  const dragSpan = visualSpan({ startMin: ns, endMin: ne });
  const spans = blocks.map((b) => (b.todo.id === dragId ? dragSpan : visualSpan(b)));
  // 드래그 블록이 노리는 레인을 선호하던 겹침 블록은 양보 (최근 드래그가 우선)
  const prefs: Record<string, number> = { [dragId]: targetLane };
  blocks.forEach((b, i) => {
    if (b.todo.id === dragId) return;
    const p = lanePrefs[b.todo.id];
    if (p === undefined) return;
    if (p === targetLane && overlapsSpan(spans[i], dragSpan)) return;
    prefs[b.todo.id] = p;
  });
  const layout = assignLanes(
    spans,
    blocks.map((b) => prefs[b.todo.id]),
  );
  return { layout, prefs };
}

export function DayTimeline({
  dayKey,
  todayKey,
  todos,
  selectedId,
  onSelect,
  onReschedule,
}: DayTimelineProps) {
  const { t } = useTranslation();
  const isToday = dayKey === todayKey;

  const { blocks: rawBlocks, untimed } = useMemo(
    () => buildTimeline(todos, dayKey, todayKey),
    [todos, dayKey, todayKey],
  );

  /** 사용자가 드래그로 지정한 블록별 선호 레인. 빈 레인일 때만 적용돼 충돌이 없다. */
  const [lanePrefs, setLanePrefs] = useState<Record<string, number>>({});

  const blocks = useMemo(() => {
    const res = assignLanes(
      rawBlocks.map(visualSpan),
      rawBlocks.map((b) => lanePrefs[b.todo.id]),
    );
    return rawBlocks.map((b, i) => ({ ...b, ...res[i] }));
  }, [rawBlocks, lanePrefs]);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [nowMin, setNowMin] = useState(() => currentMinutes());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNowMin(currentMinutes()), 60_000);
    return () => clearInterval(id);
  }, [isToday]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const focusMin = isToday ? currentMinutes() : 8 * 60;
    el.scrollTop = Math.max(0, focusMin * PX_PER_MIN - 140);
  }, [dayKey, isToday]);

  useEffect(() => {
    setLanePrefs({});
  }, [dayKey]);

  const handlePointerDown = (e: React.PointerEvent, block: TimelineBlock) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      id: block.todo.id,
      startMin: block.startMin,
      endMin: block.endMin,
      durationMin: block.endMin - block.startMin,
      pointerStartY: e.clientY,
      pointerStartX: e.clientX,
      deltaMin: 0,
      moved: false,
      mode: "pending",
      dragBlockLane: block.lane,
      trackWidth: trackRef.current?.clientWidth ?? 300,
      targetLane: block.lane,
    });
  };

  const handleResizeDown = (
    e: React.PointerEvent,
    block: TimelineBlock,
    mode: "resize-top" | "resize-bottom",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      id: block.todo.id,
      startMin: block.startMin,
      endMin: block.endMin,
      durationMin: block.endMin - block.startMin,
      pointerStartY: e.clientY,
      pointerStartX: e.clientX,
      deltaMin: 0,
      moved: false,
      mode,
      dragBlockLane: block.lane,
      trackWidth: 0,
      targetLane: block.lane,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setDrag((prev) => {
      if (!prev) return prev;

      const rawDeltaY = e.clientY - prev.pointerStartY;
      const rawDeltaX = e.clientX - prev.pointerStartX;
      const movedNow =
        Math.max(Math.abs(rawDeltaX), Math.abs(rawDeltaY)) > DRAG_THRESHOLD_PX;
      const moved = prev.moved || movedNow;

      let { mode, deltaMin, targetLane } = prev;

      // pending → free 전환 (임계값 초과 시)
      if (mode === "pending" && moved) mode = "free";

      if (mode === "free") {
        // Y: 시간 오프셋 (15분 스냅)
        const snappedMin = snap(rawDeltaY / PX_PER_MIN);
        const newDeltaMin = Math.max(
          -prev.startMin,
          Math.min(MINUTES_IN_DAY - prev.durationMin - prev.startMin, snappedMin),
        );

        // X: 새 위치에서의 클러스터 레인 수를 시뮬레이션 → 커서 X 를 레인 인덱스로
        const ns = prev.startMin + newDeltaMin;
        const dragSpan = visualSpan({ startMin: ns, endMin: ns + prev.durationMin });
        const spans = blocks.map((b) =>
          b.todo.id === prev.id ? dragSpan : visualSpan(b),
        );
        const sim = assignLanes(spans);
        const dragIdx = blocks.findIndex((b) => b.todo.id === prev.id);
        const numLanes = Math.max(1, sim[dragIdx]?.lanes ?? 1);
        const trackLeft = trackRef.current?.getBoundingClientRect().left ?? 0;
        const laneWidthPx = prev.trackWidth / numLanes;
        const newTargetLane = Math.max(
          0,
          Math.min(numLanes - 1, Math.floor((e.clientX - trackLeft) / laneWidthPx)),
        );

        if (newDeltaMin === deltaMin && newTargetLane === targetLane && moved === prev.moved)
          return prev;
        return { ...prev, deltaMin: newDeltaMin, targetLane: newTargetLane, moved, mode };
      }

      if (mode === "resize-bottom") {
        const raw = snap(rawDeltaY / PX_PER_MIN);
        const newDelta = Math.max(
          MIN_BLOCK_MIN - prev.durationMin,
          Math.min(MINUTES_IN_DAY - prev.endMin, raw),
        );
        if (newDelta === deltaMin && moved === prev.moved) return prev;
        return { ...prev, deltaMin: newDelta, moved };
      }

      if (mode === "resize-top") {
        const raw = snap(rawDeltaY / PX_PER_MIN);
        const newDelta = Math.max(
          -prev.startMin,
          Math.min(prev.durationMin - MIN_BLOCK_MIN, raw),
        );
        if (newDelta === deltaMin && moved === prev.moved) return prev;
        return { ...prev, deltaMin: newDelta, moved };
      }

      // pending — 아직 임계값 미달
      if (moved !== prev.moved) return { ...prev, moved };
      return prev;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!drag) return;

    const d = drag;
    setDrag(null);

    if (d.mode === "free") {
      const timeChanged = d.deltaMin !== 0;
      const laneChanged = d.targetLane !== d.dragBlockLane;
      if (timeChanged || laneChanged) {
        const ns = d.startMin + d.deltaMin;
        const ne = ns + d.durationMin;
        // 프리뷰와 동일한 함수로 선호 레인 확정 → 놓은 위치가 프리뷰 그대로 유지
        const { prefs } = layoutFreeDrag(blocks, lanePrefs, d.id, ns, ne, d.targetLane);
        setLanePrefs(prefs);
        if (timeChanged) onReschedule(d.id, formatTime(ns), formatTime(ne));
      } else if (!d.moved) {
        onSelect(d.id);
      }
    } else if (d.mode === "resize-bottom" && d.deltaMin !== 0) {
      const newEnd = Math.max(
        d.startMin + MIN_BLOCK_MIN,
        Math.min(MINUTES_IN_DAY, d.endMin + d.deltaMin),
      );
      // 시간 범위 변경 → 클러스터 구조가 바뀌므로 이전 선호 레인 초기화
      setLanePrefs({});
      onReschedule(d.id, formatTime(d.startMin), formatTime(newEnd));
    } else if (d.mode === "resize-top" && d.deltaMin !== 0) {
      const newStart = Math.max(
        0,
        Math.min(d.endMin - MIN_BLOCK_MIN, d.startMin + d.deltaMin),
      );
      setLanePrefs({});
      onReschedule(d.id, formatTime(newStart), formatTime(d.endMin));
    } else if (!d.moved && d.mode === "pending") {
      onSelect(d.id);
    }
  };

  /**
   * 드래그 중 실시간 레이아웃.
   * - free: layoutFreeDrag (커밋과 동일한 함수)로 시간 이동 + 레인 재배치.
   * - resize-*: 해당 엣지 시간 조정 후 선호 레인을 유지한 채 재배치.
   * drag 참조가 바뀔 때만 실행 (deltaMin 15분 스냅, targetLane 변화 시).
   */
  const previewBlocks = useMemo(() => {
    if (!drag) return blocks;

    if (drag.mode === "free") {
      const ns = drag.startMin + drag.deltaMin;
      const ne = ns + drag.durationMin;
      const { layout } = layoutFreeDrag(
        blocks,
        lanePrefs,
        drag.id,
        ns,
        ne,
        drag.targetLane,
      );
      return blocks.map((b, i) =>
        b.todo.id === drag.id
          ? { ...b, startMin: ns, endMin: ne, derived: false, ...layout[i] }
          : { ...b, ...layout[i] },
      );
    }

    if (drag.mode === "resize-bottom" || drag.mode === "resize-top") {
      const placed = blocks.map((b) => {
        if (b.todo.id !== drag.id) return b;
        if (drag.mode === "resize-bottom") {
          const ne = Math.max(
            drag.startMin + MIN_BLOCK_MIN,
            Math.min(MINUTES_IN_DAY, drag.endMin + drag.deltaMin),
          );
          return { ...b, endMin: ne, derived: false };
        }
        const ns = Math.max(
          0,
          Math.min(drag.endMin - MIN_BLOCK_MIN, drag.startMin + drag.deltaMin),
        );
        return { ...b, startMin: ns, derived: false };
      });
      const lanes = assignLanes(
        placed.map(visualSpan),
        placed.map((p) => lanePrefs[p.todo.id]),
      );
      return placed.map((p, i) => ({ ...p, ...lanes[i] }));
    }

    return blocks; // pending
  }, [blocks, drag, lanePrefs]);

  return (
    <div className="day-timeline">
      {untimed.length > 0 ? (
        <div className="day-allday">
          <span className="day-allday-label">{t("calendar.timeline.untimed")}</span>
          <div className="day-allday-items">
            {untimed.map((todo) => (
              <button
                key={todo.id}
                type="button"
                className="day-allday-chip"
                data-status={todo.status}
                aria-pressed={selectedId === todo.id}
                onClick={() => onSelect(todo.id)}
              >
                <StatusIcon status={todo.status} size={12} />
                <span className="day-allday-chip-title">{todo.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="day-timeline-scroll" ref={scrollRef}>
        <div
          className="day-timeline-grid"
          style={{
            height: 24 * HOUR_PX,
            userSelect: drag ? "none" : undefined,
          }}
        >
          {HOURS.map((h) => (
            <div
              key={h}
              className="day-hour-row"
              style={{ top: h * HOUR_PX, height: HOUR_PX }}
            >
              <span className="day-hour-label">{formatTime(h * 60)}</span>
              <span className="day-hour-line" />
            </div>
          ))}

          {isToday ? (
            <div className="day-now-line" style={{ top: nowMin * PX_PER_MIN }}>
              <span className="day-now-pill">{formatTime(nowMin)}</span>
            </div>
          ) : null}

          <div className="day-timeline-track" ref={trackRef}>
            {previewBlocks.map((b) => {
              const dragging = drag?.id === b.todo.id;
              const durationMin = b.endMin - b.startMin;
              const top = b.startMin * PX_PER_MIN;
              const height = Math.max(durationMin, MIN_BLOCK_MIN) * PX_PER_MIN;
              const laneWidth = 100 / b.lanes;
              const compact = height < 44;

              return (
                <div
                  key={b.todo.id}
                  className="day-block"
                  data-status={b.todo.status}
                  data-active={selectedId === b.todo.id ? "" : undefined}
                  data-dragging={dragging ? "" : undefined}
                  style={{
                    top,
                    height,
                    left: `calc(${b.lane * laneWidth}% + 2px)`,
                    width: `calc(${laneWidth}% - 6px)`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, b)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <div
                    className="day-block-resize day-block-resize-t"
                    onPointerDown={(e) => handleResizeDown(e, b, "resize-top")}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />

                  <div className="day-block-head">
                    <StatusIcon status={b.todo.status} size={12} />
                    <span className="day-block-title">{b.todo.title}</span>
                  </div>
                  {!compact ? (
                    <span className="day-block-time">
                      {formatTime(b.startMin)} –{" "}
                      {formatTime(b.startMin + durationMin)}
                      {b.derived ? (
                        <span className="day-block-auto">
                          {" "}
                          · {t("calendar.timeline.auto")}
                        </span>
                      ) : null}
                    </span>
                  ) : null}

                  <div
                    className="day-block-resize day-block-resize-b"
                    onPointerDown={(e) => handleResizeDown(e, b, "resize-bottom")}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
