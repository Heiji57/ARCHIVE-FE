import type { RecurrenceRule, Todo } from "@/entities/todo/model/types";
import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

/**
 * 반복 할 일을 고칠 때의 적용 범위(26번 모달의 "이 일정만 / 이 일정 이후 전체 / 모든 반복 일정").
 * 순수 계산만 한다: 무엇이 바뀌는지(applyScope) → 어떤 앱 액션을 부를지(toEditorCalls).
 */
export type EditScope = "this" | "following" | "all";

export interface RecurringSeries {
  /** 시리즈 base 할 일 id. */
  id: string;
  /** 첫 회차 날짜(base 의 dateKey). */
  startDateKey: string;
  /** 시리즈 규칙. 예외 회차라 규칙을 모르면 null. */
  rule: RecurrenceRule | null;
}

/** 범위를 묻는 변경. 반복 규칙(rule)은 회차 하나에 걸 수 없어 "this" 에서는 버린다. */
export interface TodoPatch {
  title?: string;
  description?: string;
  tags?: string[];
  startTime?: string | null;
  endTime?: string | null;
  rule?: RecurrenceRule;
}

export type ScopedChange =
  /** 그 회차 하나만(예외 회차). */
  | { kind: "occurrence"; seriesId: string; dateKey: string; patch: TodoPatch }
  /** 시리즈 자체(첫 회차부터 전부). */
  | { kind: "series"; seriesId: string; startDateKey: string; rule: RecurrenceRule | null; patch: TodoPatch }
  /** 시리즈를 until 까지로 끊는다. */
  | { kind: "endSeries"; seriesId: string; until: string }
  /** 끊은 자리부터 새 시리즈. */
  | { kind: "newSeries"; fromSeriesId: string; startDateKey: string; rule: RecurrenceRule | null; patch: TodoPatch };

function withoutRule(patch: TodoPatch): TodoPatch {
  const rest = { ...patch };
  delete rest.rule;
  return rest;
}

function dayBefore(dateKey: string): string {
  return toDateKey(addDays(fromDateKey(dateKey), -1));
}

export function applyScope(
  series: RecurringSeries,
  instanceDateKey: string,
  patch: TodoPatch,
  scope: EditScope,
): ScopedChange[] {
  const fields = withoutRule(patch);
  if (scope === "this") {
    if (Object.keys(fields).length === 0) return [];
    return [{ kind: "occurrence", seriesId: series.id, dateKey: instanceDateKey, patch: fields }];
  }
  // 첫 회차(또는 그 앞)에서 "이후 전체"는 시리즈 전체와 같다.
  if (scope === "all" || instanceDateKey <= series.startDateKey) {
    return [
      {
        kind: "series",
        seriesId: series.id,
        startDateKey: series.startDateKey,
        rule: patch.rule ?? series.rule,
        patch: fields,
      },
    ];
  }
  return [
    { kind: "endSeries", seriesId: series.id, until: dayBefore(instanceDateKey) },
    {
      kind: "newSeries",
      fromSeriesId: series.id,
      startDateKey: instanceDateKey,
      rule: patch.rule ?? series.rule,
      patch: fields,
    },
  ];
}

type FieldPatch = Partial<Pick<Todo, "title" | "description" | "tags">>;

export type EditorCall =
  | { action: "updateTodo"; id: string; patch: FieldPatch }
  | { action: "setTodoTime"; id: string; startTime: string | null; endTime: string | null }
  | { action: "updateTodoFollowing"; id: string; patch: FieldPatch }
  | { action: "updateTodoTimeRecurrence"; id: string; startTime: string | null; endTime: string | null }
  | { action: "updateTodoRecurrence"; id: string; rule: RecurrenceRule };

function splitPatch(patch: TodoPatch): { fields: FieldPatch | null; time: { startTime: string | null; endTime: string | null } | null } {
  const fields: FieldPatch = {};
  if (patch.title !== undefined) fields.title = patch.title;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.tags !== undefined) fields.tags = patch.tags;
  const hasTime = patch.startTime !== undefined || patch.endTime !== undefined;
  return {
    fields: Object.keys(fields).length ? fields : null,
    time: hasTime ? { startTime: patch.startTime ?? null, endTime: patch.endTime ?? null } : null,
  };
}

/**
 * 범위 변경을 useArchiveApp() 액션 호출로 바꾼다.
 * - 서버(api.yaml PATCH /todos/{id})의 recurrence_scope 는 this | following 뿐이다.
 *   "this" 는 회차에 기본 범위로, "이후 전체" 는 회차에 following 으로(서버가 시리즈를 끊고 새로 만듦),
 *   "전체" 는 시리즈 첫 회차(base)에 following 으로 보낸다.
 * - 데모는 반복을 펼치지 않아 보이는 할 일 하나가 시리즈 전체이므로 어느 범위든 그 한 건을 로컬에서 고친다.
 */
export function toEditorCalls(
  changes: ScopedChange[],
  ctx: { instanceId: string; demo: boolean; seriesRule: RecurrenceRule | null },
): EditorCall[] {
  const calls: EditorCall[] = [];
  const same = (r: RecurrenceRule | null) => JSON.stringify(r) === JSON.stringify(ctx.seriesRule);
  for (const change of changes) {
    if (change.kind === "endSeries") continue; // 서버가 following 요청 하나로 끊고 새로 만든다.
    const { fields, time } = splitPatch(change.patch);
    const rule = change.kind !== "occurrence" && change.rule && !same(change.rule) ? change.rule : null;
    const local = ctx.demo || change.kind === "occurrence";
    const id = local || change.kind === "newSeries" ? ctx.instanceId : change.seriesId;
    if (fields) calls.push({ action: local ? "updateTodo" : "updateTodoFollowing", id, patch: fields });
    if (time) calls.push({ action: local ? "setTodoTime" : "updateTodoTimeRecurrence", id, ...time });
    if (rule) calls.push({ action: "updateTodoRecurrence", id, rule });
  }
  return calls;
}

/** 시리즈 첫 회차를 모를 때 쓰는 날짜. 어떤 회차보다 앞이라 "이후 전체" 가 "전체" 로 바뀌지 않는다. */
const UNKNOWN_START = "0000-00-00";

/**
 * 할 일이 속한 반복 시리즈와 그 회차 날짜. 반복이 아니면 null.
 * base 는 목록에 있으면 그 날짜가 첫 회차, 없으면 첫 회차를 모른다(UNKNOWN_START).
 */
export function seriesOf(
  todo: Todo,
  todos: Todo[],
): { series: RecurringSeries; instanceDateKey: string } | null {
  const recurring = todo.isVirtual || todo.seriesId !== null || todo.recurrenceRule !== null;
  if (!recurring) return null;
  const baseId = todo.seriesId ?? (todo.isVirtual ? todo.id.split("::")[0] : todo.id);
  const base = baseId === todo.id ? todo : todos.find((x) => x.id === baseId && x.recurrenceRule);
  const rule = todo.seriesRule ?? todo.recurrenceRule ?? base?.recurrenceRule ?? null;
  const startDateKey = base && base.recurrenceRule ? base.dateKey : UNKNOWN_START;
  return { series: { id: baseId, startDateKey, rule }, instanceDateKey: todo.originalDateKey ?? todo.dateKey };
}
