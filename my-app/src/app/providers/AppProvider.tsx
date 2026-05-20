import { useReducer, type ReactNode } from "react";
import { getInitialAppState } from "@/app/model/initialState";
import { appReducer } from "@/app/model/reducer";
import type { ArchiveAppContextValue } from "@/app/model/types";
import { AppContext } from "@/app/providers/context";
import { usePersistAppState } from "@/app/providers/usePersistAppState";
import type {
  NoticeType,
  NotificationItem,
} from "@/entities/notification/model/types";
import { todayKey } from "@/shared/lib/date";
import { createId } from "@/shared/lib/id";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    getInitialAppState,
  );

  usePersistAppState(state);

  const dismissNotification = (id: string) => {
    dispatch({ type: "notification/dismiss", payload: { id } });
  };

  const pushNotification = (
    type: NoticeType,
    title: string,
    message: string,
  ) => {
    const notification: NotificationItem = {
      id: createId("notice"),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: "notification/push", payload: { notification } });
    window.setTimeout(() => dismissNotification(notification.id), 4600);
  };

  const value: ArchiveAppContextValue = {
    state,
    addTodo: (title, dateKey = todayKey(), options) => {
      dispatch({
        type: "todo/add",
        payload: {
          title,
          dateKey,
          status: options?.status,
          description: options?.description,
        },
      });
    },
    updateTodo: (id, patch) => {
      dispatch({ type: "todo/update", payload: { id, patch } });
    },
    updateEntry: (id, patch) => {
      dispatch({ type: "entry/update", payload: { id, patch } });
    },
    saveGitHubConfig: (config) => {
      dispatch({ type: "github/save", payload: { config } });
    },
    pushNotification,
    dismissNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
