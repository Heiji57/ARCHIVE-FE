import type { RetrospectiveType } from "@/entities/entry/model/types";

export interface RetroTemplate {
  id: string;
  name: string;
  retroType: RetrospectiveType;
  /** Markdown content — rendered by RichEditor */
  content: string;
  /** true = one of the 4 built-in defaults (editable/resettable, not deletable) */
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
