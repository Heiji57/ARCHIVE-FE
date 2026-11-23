import { retroSeedEntries, retroSeedFolders } from "@/app/config/seed/retroSeed";
import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { PersistedAppState } from "@/app/model/types";
import { DEFAULT_ACTIVE_TEMPLATE_IDS, DEFAULT_TEMPLATES } from "@/entities/template";
import { readSpellCheckPref } from "@/shared/lib/spellCheckPrefs";
import { readTodoBoardRange } from "@/shared/lib/todoRangePrefs";
import { todoSeed } from "./seed/todoSeed";

export const seedState: PersistedAppState = {
  // 시작 데이터는 seed/(시안 데이터): 할 일 todoSeed.ts, 회고 retroSeed.ts. 데모 모드 시작 상태도 같은 데이터를 쓴다.
  todos: todoSeed,
  entries: retroSeedEntries(),
  folders: retroSeedFolders(),
  notifications: [],
  settings: {
    ...DEFAULT_SETTINGS,
    todoBoardRange: readTodoBoardRange(DEFAULT_SETTINGS.todoBoardRange),
    spellCheck: readSpellCheckPref(DEFAULT_SETTINGS.spellCheck),
  },
  pendingSummary: null,
  currentUser: null,
  rememberMe: false,
  templates: DEFAULT_TEMPLATES,
  activeTemplateIds: DEFAULT_ACTIVE_TEMPLATE_IDS,
};
