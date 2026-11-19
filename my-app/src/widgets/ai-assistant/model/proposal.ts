import type { Todo } from "@/entities/todo/model/types";

/**
 * AI 제안 한 항목.
 * todos 종류: 새로 만들 할 일.
 * move 종류: key = 기존 todo ID, dateKey = 옮길 날짜.
 */
export interface ProposalItem {
  key: string;
  title: string;
  dateKey: string;
  startTime: string | null;
  endTime: string | null;
  /** 겹치는 기존 할 일 제목. null = 충돌 없음. */
  clash: string | null;
  selected: boolean;
}

/** AI 비서가 만든 제안. */
export interface Proposal {
  kind: "todos" | "move" | "retro";
  items: ProposalItem[];
}

/** applyProposal 결과 — 화면에 반영할 변경 목록. */
export interface NewTodo {
  id: string;
  title: string;
  dateKey: string;
  startTime: string | null;
  endTime: string | null;
  status: "not-start";
  tags: string[];
}

export interface TodoPatch {
  id: string;
  dateKey: string;
}

/** 되돌리기에 필요한 정보. */
export interface UndoRecord {
  kind: Proposal["kind"];
  createdIds: string[];
  prev: Array<{ id: string; dateKey: string }>;
}

/** 고른 항목(pickedKeys)만 적용한다. 나머지는 그대로. */
export function applyProposal(
  todos: Todo[],
  proposal: Proposal,
  pickedKeys: string[],
): { patches: TodoPatch[]; creates: NewTodo[]; undo: UndoRecord } {
  const picked = new Set(pickedKeys);

  if (proposal.kind === "todos") {
    const selectedItems = proposal.items.filter((item) => picked.has(item.key));
    const creates: NewTodo[] = selectedItems.map((item) => ({
      id: item.key,
      title: item.title,
      dateKey: item.dateKey,
      startTime: item.startTime,
      endTime: item.endTime,
      status: "not-start" as const,
      tags: [],
    }));
    return {
      patches: [],
      creates,
      undo: {
        kind: "todos",
        createdIds: creates.map((c) => c.id),
        prev: [],
      },
    };
  }

  if (proposal.kind === "move") {
    const patches: TodoPatch[] = [];
    const prev: Array<{ id: string; dateKey: string }> = [];

    for (const item of proposal.items) {
      if (!picked.has(item.key)) continue;
      const existing = todos.find((t) => t.id === item.key);
      if (existing) {
        prev.push({ id: existing.id, dateKey: existing.dateKey });
      }
      patches.push({ id: item.key, dateKey: item.dateKey });
    }

    return {
      patches,
      creates: [],
      undo: { kind: "move", createdIds: [], prev },
    };
  }

  // retro 등 다른 종류는 아직 patches/creates 없음
  return {
    patches: [],
    creates: [],
    undo: { kind: proposal.kind, createdIds: [], prev: [] },
  };
}

/** 적용을 되돌린다. 새 Todo[] 를 반환 (상태는 호출자가 교체). */
export function undoProposal(todos: Todo[], undo: UndoRecord): Todo[] {
  if (undo.kind === "todos") {
    const removedSet = new Set(undo.createdIds);
    return todos.filter((t) => !removedSet.has(t.id));
  }

  if (undo.kind === "move") {
    return todos.map((t) => {
      const record = undo.prev.find((p) => p.id === t.id);
      if (!record) return t;
      return { ...t, dateKey: record.dateKey };
    });
  }

  return todos;
}
