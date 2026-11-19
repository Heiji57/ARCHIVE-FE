import { useCallback, useReducer } from "react";
import { getDemoResponse } from "./demoScript";
import type { DemoResponse } from "./demoScript";
import { applyProposal, undoProposal } from "./proposal";
import type { Proposal, UndoRecord } from "./proposal";

/** 진행 단계 인덱스 (-1 = 아직 시작 안 함). */
type StepIdx = number;

export interface AiTurn {
  id: string;
  query: string;
  /** 단계별 경과 ms. */
  stepMs: number[];
  /** 현재까지 완료된 단계 (0-based). done=true 면 steps.length. */
  stepIdx: StepIdx;
  done: boolean;
  response: DemoResponse | null;
  applied: boolean;
  undo: UndoRecord | null;
}

export interface AiSessionState {
  turns: AiTurn[];
  busy: boolean;
  /** 적용/되돌리기 결과로 화면에 반영할 Todo ID 목록 (새로 추가) */
  createdIds: string[];
  /** 되돌리기로 삭제된 ID 목록 */
  removedIds: string[];
  /** 되돌리기로 복원된 dateKey 맵 */
  restoredDates: Record<string, string>;
}

type Action =
  | { type: "SEND"; turn: AiTurn }
  | { type: "STEP"; turnId: string; now: number }
  | { type: "DONE"; turnId: string; now: number }
  | { type: "APPLY"; turnId: string; pickedKeys: string[] }
  | { type: "UNDO"; turnId: string };

function reducer(state: AiSessionState, action: Action): AiSessionState {
  switch (action.type) {
    case "SEND":
      return {
        ...state,
        busy: true,
        turns: [...state.turns, action.turn],
        createdIds: [],
        removedIds: [],
        restoredDates: {},
      };

    case "STEP": {
      const turns = state.turns.map((t) => {
        if (t.id !== action.turnId || t.done) return t;
        const nextIdx = t.stepIdx + 1;
        const steps = t.response?.steps ?? [];
        return {
          ...t,
          stepIdx: nextIdx,
          stepMs: [...t.stepMs, action.now - Date.now()],
          done: nextIdx >= steps.length,
        };
      });
      const busy = turns.some((t) => !t.done);
      return { ...state, turns, busy };
    }

    case "DONE": {
      const turns = state.turns.map((t) => {
        if (t.id !== action.turnId) return t;
        return { ...t, done: true, busy: false };
      });
      return { ...state, turns, busy: false };
    }

    case "APPLY": {
      const turn = state.turns.find((t) => t.id === action.turnId);
      if (!turn?.response || turn.applied) return state;
      const proposal: Proposal = turn.response.proposal;
      const { creates, patches, undo } = applyProposal([], proposal, action.pickedKeys);
      const turns = state.turns.map((t) =>
        t.id === action.turnId ? { ...t, applied: true, undo } : t,
      );
      return {
        ...state,
        turns,
        createdIds: creates.map((c) => c.id),
        restoredDates: Object.fromEntries(patches.map((p) => [p.id, p.dateKey])),
      };
    }

    case "UNDO": {
      const turn = state.turns.find((t) => t.id === action.turnId);
      if (!turn?.applied || !turn.undo) return state;
      // undoProposal 는 호출자가 처리 — 여기서는 state만 되돌림
      const removedIds = turn.undo.kind === "todos" ? turn.undo.createdIds : [];
      const turns = state.turns.map((t) =>
        t.id === action.turnId ? { ...t, applied: false, undo: null } : t,
      );
      return { ...state, turns, removedIds, createdIds: [] };
    }

    default:
      return state;
  }
}

const STEP_MS = 700;

function newId() {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useAiSession() {
  const [state, dispatch] = useReducer(reducer, {
    turns: [],
    busy: false,
    createdIds: [],
    removedIds: [],
    restoredDates: {},
  });

  const send = useCallback((query: string) => {
    if (state.busy || !query.trim()) return;
    const response = getDemoResponse();
    const turnId = newId();
    const turn: AiTurn = {
      id: turnId,
      query,
      stepMs: [],
      stepIdx: -1,
      done: false,
      response,
      applied: false,
      undo: null,
    };
    dispatch({ type: "SEND", turn });

    // 단계별 타이머
    let step = 0;
    const tick = () => {
      const t0 = Date.now();
      if (step < response.steps.length) {
        dispatch({ type: "STEP", turnId, now: t0 });
        step++;
        setTimeout(tick, STEP_MS);
      } else {
        dispatch({ type: "DONE", turnId, now: t0 });
      }
    };
    setTimeout(tick, 200);
  }, [state.busy]);

  const apply = useCallback((turnId: string, pickedKeys: string[]) => {
    dispatch({ type: "APPLY", turnId, pickedKeys });
  }, []);

  const getUndoRecord = useCallback((turnId: string) => {
    return state.turns.find((t) => t.id === turnId)?.undo ?? null;
  }, [state.turns]);

  return {
    state,
    send,
    apply,
    undo: (turnId: string) => {
      const record = getUndoRecord(turnId);
      dispatch({ type: "UNDO", turnId });
      return record;
    },
    undoProposal,
  };
}
