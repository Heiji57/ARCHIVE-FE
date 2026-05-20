import type { JournalEntry } from "@/entities/entry/model/types";
import type { GitHubConfig } from "@/entities/github/model/types";
import type { NotificationItem } from "@/entities/notification/model/types";
import type { Todo } from "@/entities/todo/model/types";

export type AppAction =
  | {
      type: "todo/add";
      payload: {
        title: string;
        dateKey: string;
        status?: Todo["status"];
        description?: string;
      };
    }
  | {
      type: "todo/update";
      payload: {
        id: string;
        patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>;
      };
    }
  | {
      type: "entry/update";
      payload: {
        id: string;
        patch: Partial<
          Pick<JournalEntry, "title" | "content" | "synced" | "retroType">
        >;
      };
    }
  | { type: "github/save"; payload: { config: GitHubConfig | null } }
  | { type: "notification/push"; payload: { notification: NotificationItem } }
  | { type: "notification/dismiss"; payload: { id: string } };
