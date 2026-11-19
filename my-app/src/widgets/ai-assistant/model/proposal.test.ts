import { describe, it, expect } from "vitest";
import type { Todo } from "@/entities/todo/model/types";
import { applyProposal, undoProposal, type Proposal, type ProposalItem } from "./proposal";

// ── 테스트용 헬퍼 ──────────────────────────────────────────────────────────────

function makeTodo(overrides: Partial<Todo> & { id: string }): Todo {
  return {
    title: "테스트 할 일",
    completed: false,
    dateKey: "2026-11-19",
    createdAt: "2026-11-19T00:00:00Z",
    completedAt: null,
    status: "not-start",
    description: "",
    startTime: null,
    endTime: null,
    calendarLinked: false,
    calendarPushStatus: null,
    isVirtual: false,
    seriesId: null,
    originalDateKey: null,
    recurrenceRule: null,
    tags: [],
    dueDate: null,
    ...overrides,
  };
}

function makeProposalItem(overrides: Partial<ProposalItem> & { key: string }): ProposalItem {
  return {
    key: overrides.key,
    title: overrides.title ?? "새 할 일",
    dateKey: overrides.dateKey ?? "2026-11-20",
    startTime: overrides.startTime ?? null,
    endTime: overrides.endTime ?? null,
    clash: overrides.clash ?? null,
    selected: overrides.selected ?? true,
  };
}

// ── applyProposal 테스트 ───────────────────────────────────────────────────────

describe("applyProposal", () => {
  it("선택된 항목만 creates 목록에 포함된다", () => {
    const todos: Todo[] = [makeTodo({ id: "t1" })];
    const proposal: Proposal = {
      kind: "todos",
      items: [
        makeProposalItem({ key: "k1", title: "미팅 잡기", selected: true }),
        makeProposalItem({ key: "k2", title: "문서 작성", selected: false }),
        makeProposalItem({ key: "k3", title: "리뷰 요청", selected: true }),
      ],
    };

    const result = applyProposal(todos, proposal, ["k1", "k3"]);

    expect(result.creates).toHaveLength(2);
    expect(result.creates.map((c) => c.title)).toContain("미팅 잡기");
    expect(result.creates.map((c) => c.title)).toContain("리뷰 요청");
    expect(result.creates.map((c) => c.title)).not.toContain("문서 작성");
  });

  it("선택되지 않은 항목은 기존 todos에 영향을 주지 않는다", () => {
    const todos: Todo[] = [makeTodo({ id: "t1", title: "기존 할 일" })];
    const proposal: Proposal = {
      kind: "todos",
      items: [
        makeProposalItem({ key: "k1", title: "새 항목", selected: false }),
      ],
    };

    const result = applyProposal(todos, proposal, []); // 아무것도 선택 안 함

    expect(result.creates).toHaveLength(0);
    expect(result.patches).toHaveLength(0);
  });

  it("move 종류는 선택된 항목의 dateKey만 패치한다", () => {
    const todos: Todo[] = [
      makeTodo({ id: "t1", title: "오늘 할 일", dateKey: "2026-11-19" }),
      makeTodo({ id: "t2", title: "다른 할 일", dateKey: "2026-11-19" }),
    ];
    const proposal: Proposal = {
      kind: "move",
      items: [
        makeProposalItem({ key: "t1", title: "오늘 할 일", dateKey: "2026-11-20", selected: true }),
        makeProposalItem({ key: "t2", title: "다른 할 일", dateKey: "2026-11-20", selected: false }),
      ],
    };

    const result = applyProposal(todos, proposal, ["t1"]);

    expect(result.patches).toHaveLength(1);
    expect(result.patches[0].id).toBe("t1");
    expect(result.patches[0].dateKey).toBe("2026-11-20");
  });

  it("undo 레코드에는 적용 전 원래 값이 저장된다", () => {
    const todos: Todo[] = [
      makeTodo({ id: "t1", dateKey: "2026-11-19", title: "원래 제목" }),
    ];
    const proposal: Proposal = {
      kind: "move",
      items: [
        makeProposalItem({ key: "t1", title: "원래 제목", dateKey: "2026-11-21", selected: true }),
      ],
    };

    const result = applyProposal(todos, proposal, ["t1"]);

    expect(result.undo.kind).toBe("move");
    expect(result.undo.prev).toHaveLength(1);
    expect(result.undo.prev[0]).toMatchObject({ id: "t1", dateKey: "2026-11-19" });
  });

  it("todos 종류의 undo 레코드에 생성된 ID 목록이 담긴다", () => {
    const todos: Todo[] = [];
    const proposal: Proposal = {
      kind: "todos",
      items: [
        makeProposalItem({ key: "k1", title: "새 항목", selected: true }),
      ],
    };

    const result = applyProposal(todos, proposal, ["k1"]);

    expect(result.undo.kind).toBe("todos");
    expect(result.undo.createdIds).toHaveLength(1);
  });
});

// ── undoProposal 테스트 ────────────────────────────────────────────────────────

describe("undoProposal", () => {
  it("todos 되돌리기: 생성된 항목을 목록에서 제거한다", () => {
    const addedId = "ai-added-1";
    const todos: Todo[] = [
      makeTodo({ id: "t1", title: "기존 항목" }),
      makeTodo({ id: addedId, title: "AI가 추가한 항목" }),
    ];

    const result = undoProposal(todos, {
      kind: "todos",
      createdIds: [addedId],
      prev: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
  });

  it("move 되돌리기: 옮긴 항목의 dateKey를 원래 값으로 복원한다", () => {
    const todos: Todo[] = [
      makeTodo({ id: "t1", dateKey: "2026-11-21" }), // 이미 옮겨진 상태
    ];

    const result = undoProposal(todos, {
      kind: "move",
      createdIds: [],
      prev: [{ id: "t1", dateKey: "2026-11-19" }],
    });

    const restored = result.find((t) => t.id === "t1");
    expect(restored?.dateKey).toBe("2026-11-19");
  });

  it("되돌리기 후 목록의 다른 항목은 그대로다", () => {
    const todos: Todo[] = [
      makeTodo({ id: "t1", title: "건드리지 않은 항목" }),
      makeTodo({ id: "t2", title: "AI가 추가한 항목" }),
    ];

    const result = undoProposal(todos, {
      kind: "todos",
      createdIds: ["t2"],
      prev: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("건드리지 않은 항목");
  });
});

// ── clash 감지 테스트 ─────────────────────────────────────────────────────────

describe("clash detection (ProposalItem.clash)", () => {
  it("제안 항목의 clash 필드가 null이 아닐 때 겹치는 일정으로 표시된다", () => {
    const item = makeProposalItem({
      key: "k1",
      title: "스프린트 회의",
      dateKey: "2026-11-20",
      startTime: "10:00",
      endTime: "11:00",
      clash: "디자인 리뷰",
    });

    expect(item.clash).toBe("디자인 리뷰");
  });

  it("clash가 없는 항목은 null을 반환한다", () => {
    const item = makeProposalItem({
      key: "k2",
      title: "릴리스 노트 정리",
      dateKey: "2026-11-21",
      startTime: null,
      endTime: null,
      clash: null,
    });

    expect(item.clash).toBeNull();
  });

  it("applyProposal이 clash 있는 항목도 선택하면 creates에 포함한다", () => {
    const todos: Todo[] = [];
    const proposal: Proposal = {
      kind: "todos",
      items: [
        makeProposalItem({
          key: "k1",
          title: "겹치는 회의",
          clash: "기존 회의",
          selected: true,
        }),
      ],
    };

    const result = applyProposal(todos, proposal, ["k1"]);

    expect(result.creates).toHaveLength(1);
    expect(result.creates[0].title).toBe("겹치는 회의");
  });
});
