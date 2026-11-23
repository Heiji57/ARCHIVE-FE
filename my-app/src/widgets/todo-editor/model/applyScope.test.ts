import { describe, expect, it } from "vitest";
import type { RecurrenceRule } from "@/entities/todo/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { applyScope, seriesOf, toEditorCalls, type RecurringSeries } from "./applyScope";

const weekly: RecurrenceRule = { unit: "week", interval: 1, until: null, weekdays: [1] };
const series: RecurringSeries = { id: "s1", startDateKey: "2026-11-03", rule: weekly };

describe("applyScope", () => {
  it('"this" 는 그 날 한 건만 바꾼다', () => {
    expect(applyScope(series, "2026-11-10", { title: "새 제목" }, "this")).toEqual([
      { kind: "occurrence", seriesId: "s1", dateKey: "2026-11-10", patch: { title: "새 제목" } },
    ]);
  });

  it('"following" 은 그 날 전날까지로 시리즈를 끊고, 그 날부터 새 시리즈를 만든다', () => {
    expect(applyScope(series, "2026-11-17", { startTime: "09:00", endTime: "10:00" }, "following")).toEqual([
      { kind: "endSeries", seriesId: "s1", until: "2026-11-16" },
      {
        kind: "newSeries",
        fromSeriesId: "s1",
        startDateKey: "2026-11-17",
        rule: weekly,
        patch: { startTime: "09:00", endTime: "10:00" },
      },
    ]);
  });

  it('"following" 의 새 시리즈는 기존 종료일을 이어받고, 바꾼 규칙이 있으면 그 규칙을 쓴다', () => {
    const ending: RecurringSeries = { ...series, rule: { ...weekly, until: "2026-12-31" } };
    const [, next] = applyScope(ending, "2026-11-17", { tags: ["a"] }, "following");
    expect(next).toMatchObject({ kind: "newSeries", rule: { until: "2026-12-31" } });

    const daily: RecurrenceRule = { unit: "day", interval: 1, until: null };
    const [, changed] = applyScope(series, "2026-11-17", { rule: daily }, "following");
    expect(changed).toEqual({
      kind: "newSeries",
      fromSeriesId: "s1",
      startDateKey: "2026-11-17",
      rule: daily,
      patch: {},
    });
  });

  it('"all" 은 시리즈 규칙과 내용 자체를 고친다', () => {
    const daily: RecurrenceRule = { unit: "day", interval: 2, until: null };
    expect(applyScope(series, "2026-11-17", { description: "메모", rule: daily }, "all")).toEqual([
      { kind: "series", seriesId: "s1", startDateKey: "2026-11-03", rule: daily, patch: { description: "메모" } },
    ]);
    expect(applyScope(series, "2026-11-17", { title: "x" }, "all")).toEqual([
      { kind: "series", seriesId: "s1", startDateKey: "2026-11-03", rule: weekly, patch: { title: "x" } },
    ]);
  });

  it('시리즈 첫날에서 "following" 은 "all" 과 같은 결과', () => {
    const patch = { title: "첫날부터" };
    expect(applyScope(series, "2026-11-03", patch, "following")).toEqual(
      applyScope(series, "2026-11-03", patch, "all"),
    );
  });

  it('"following" 이 첫날보다 앞이면(잘못된 회차) "all" 로 본다', () => {
    expect(applyScope(series, "2026-11-01", { title: "x" }, "following")).toEqual(
      applyScope(series, "2026-11-01", { title: "x" }, "all"),
    );
  });

  it('"this" 는 반복 규칙을 바꿀 수 없어 규칙만 있는 변경은 아무것도 하지 않는다', () => {
    expect(applyScope(series, "2026-11-10", { rule: { unit: "day", interval: 1, until: null } }, "this")).toEqual([]);
    expect(
      applyScope(series, "2026-11-10", { title: "t", rule: { unit: "day", interval: 1, until: null } }, "this"),
    ).toEqual([{ kind: "occurrence", seriesId: "s1", dateKey: "2026-11-10", patch: { title: "t" } }]);
  });

  it("월 경계를 넘는 전날을 계산한다", () => {
    const [end] = applyScope(series, "2026-12-01", { title: "x" }, "following");
    expect(end).toEqual({ kind: "endSeries", seriesId: "s1", until: "2026-11-30" });
  });
});

describe("toEditorCalls", () => {
  const ctx = { instanceId: "s1::2026-11-17", demo: false, seriesRule: weekly };

  it('"this" 는 회차에 바로(서버 기본 범위 this) 보낸다', () => {
    const changes = applyScope(series, "2026-11-17", { title: "t", startTime: "09:00", endTime: null }, "this");
    expect(toEditorCalls(changes, ctx)).toEqual([
      { action: "updateTodo", id: "s1::2026-11-17", patch: { title: "t" } },
      { action: "setTodoTime", id: "s1::2026-11-17", startTime: "09:00", endTime: null },
    ]);
  });

  it('"following" 은 회차에 recurrence_scope following 으로 보낸다(서버가 시리즈를 나눔)', () => {
    const changes = applyScope(series, "2026-11-17", { tags: ["a"], startTime: null, endTime: null }, "following");
    expect(toEditorCalls(changes, ctx)).toEqual([
      { action: "updateTodoFollowing", id: "s1::2026-11-17", patch: { tags: ["a"] } },
      { action: "updateTodoTimeRecurrence", id: "s1::2026-11-17", startTime: null, endTime: null },
    ]);
  });

  it('"all" 은 시리즈 첫 회차(base)에서 following 으로 보낸다', () => {
    const daily: RecurrenceRule = { unit: "day", interval: 1, until: null };
    const changes = applyScope(series, "2026-11-17", { title: "t", rule: daily }, "all");
    expect(toEditorCalls(changes, ctx)).toEqual([
      { action: "updateTodoFollowing", id: "s1", patch: { title: "t" } },
      { action: "updateTodoRecurrence", id: "s1", rule: daily },
    ]);
  });

  it("데모는 반복을 펼치지 않으므로 어느 범위든 보이는 한 건을 로컬에서 고친다", () => {
    const demo = { instanceId: "todo_1", demo: true, seriesRule: weekly };
    const daily: RecurrenceRule = { unit: "day", interval: 1, until: null };
    for (const scope of ["this", "following", "all"] as const) {
      const changes = applyScope({ ...series, id: "todo_1" }, "2026-11-17", { title: "t", rule: daily }, scope);
      const calls = toEditorCalls(changes, demo);
      expect(calls[0]).toEqual({ action: "updateTodo", id: "todo_1", patch: { title: "t" } });
      expect(calls.every((c) => c.id === "todo_1")).toBe(true);
    }
  });
});

describe("seriesOf", () => {
  const plain = {
    id: "t1",
    dateKey: "2026-11-10",
    isVirtual: false,
    seriesId: null,
    originalDateKey: null,
    recurrenceRule: null,
  } as Todo;

  it("반복이 아니면 null", () => {
    expect(seriesOf(plain, [plain])).toBeNull();
  });

  it("가상 회차는 목록의 base 날짜를 첫 회차로", () => {
    const base = { ...plain, id: "b1", dateKey: "2026-11-03", recurrenceRule: weekly };
    const inst = { ...plain, id: "b1::2026-11-10", isVirtual: true, seriesId: "b1", seriesRule: weekly };
    expect(seriesOf(inst, [base, inst])).toEqual({
      series: { id: "b1", startDateKey: "2026-11-03", rule: weekly },
      instanceDateKey: "2026-11-10",
    });
  });

  it("base 가 목록에 없으면 첫 회차를 몰라서 \"이후 전체\" 가 \"전체\" 로 바뀌지 않는다", () => {
    const inst = { ...plain, id: "b1::2026-11-10", isVirtual: true, seriesId: "b1", seriesRule: weekly };
    const s = seriesOf(inst, [inst])!;
    expect(applyScope(s.series, s.instanceDateKey, { title: "x" }, "following")[0].kind).toBe("endSeries");
  });

  it("base 자신(규칙이 있는 단독 행)은 자기 날짜가 첫 회차", () => {
    const base = { ...plain, recurrenceRule: weekly };
    expect(seriesOf(base, [base])?.series).toEqual({ id: "t1", startDateKey: "2026-11-10", rule: weekly });
  });
});
