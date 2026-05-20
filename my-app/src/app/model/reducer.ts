import type { AppAction } from "@/app/model/actions";
import type { AppState } from "@/app/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { createId } from "@/shared/lib/id";

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "todo/add":
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: createId("todo"),
            title: action.payload.title,
            completed: action.payload.status === "done",
            dateKey: action.payload.dateKey,
            createdAt: new Date().toISOString(),
            status: action.payload.status ?? "not-start",
            description: action.payload.description ?? "",
          },
        ],
      };

    case "todo/update":
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload.id
            ? applyTodoPatch(todo, action.payload.patch)
            : todo,
        ),
      };

    case "entry/update":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id
            ? {
                ...entry,
                ...action.payload.patch,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      };

    case "github/save":
      return {
        ...state,
        githubConfig: action.payload.config,
      };

    case "notification/push":
      return {
        ...state,
        notifications: [...state.notifications, action.payload.notification],
      };

    case "notification/dismiss":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload.id,
        ),
      };

    default:
      return state;
  }
}

function applyTodoPatch(
  todo: Todo,
  patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>,
): Todo {
  const nextStatus = patch.status ?? todo.status;

  return {
    ...todo,
    ...patch,
    status: nextStatus,
    completed: nextStatus === "done",
  };
}
