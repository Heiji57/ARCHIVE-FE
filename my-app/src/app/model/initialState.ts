import { isDemoMode } from "@/app/config/demo";
import { seedState } from "@/app/config/seedState";
import { loadAppState } from "@/app/lib/storage";
import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { AppState, PersistedAppState } from "@/app/model/types";
import { INITIAL_CALENDAR_STATE } from "@/entities/calendar/model/types";
import { INITIAL_GITHUB_STATE } from "@/entities/github/model/types";
import {
  DEFAULT_ACTIVE_TEMPLATE_IDS,
  DEFAULT_TEMPLATES,
  localizeDefaultTemplates,
} from "@/entities/template";
import { initialGuestLocale } from "@/shared/lib/i18n";

export function getInitialAppState(): AppState {
  // 데모 모드: 목 시드/localStorage 없이 빈 상태로 시작(일회성 체험).
  // 기본 설정·기본 템플릿만 유지한다.
  if (isDemoMode()) {
    const locale = initialGuestLocale();
    return {
      todos: [],
      entries: [],
      folders: [],
      notifications: [],
      settings: { ...DEFAULT_SETTINGS, locale },
      pendingSummary: null,
      currentUser: null,
      rememberMe: false,
      templates: localizeDefaultTemplates(DEFAULT_TEMPLATES, locale),
      activeTemplateIds: DEFAULT_ACTIVE_TEMPLATE_IDS,
      github: INITIAL_GITHUB_STATE,
      calendar: INITIAL_CALENDAR_STATE,
      lastTodoIdReplacement: null,
    };
  }

  const fallback: PersistedAppState = {
    ...seedState,
    notifications: seedState.notifications ?? [],
    settings: seedState.settings ?? { ...DEFAULT_SETTINGS },
    pendingSummary: seedState.pendingSummary ?? null,
    templates: seedState.templates ?? DEFAULT_TEMPLATES,
    activeTemplateIds:
      seedState.activeTemplateIds ?? DEFAULT_ACTIVE_TEMPLATE_IDS,
  };
  // GitHub·Calendar 상태는 영속화하지 않음(서버/세션 기반) → 항상 초기값으로 시작.
  const loaded = loadAppState(fallback);
  // 비로그인 방문자: 직접 고른 언어가 없으면 접속 지역 언어로 시작한다.
  // (로그인 사용자는 저장된 locale 을 쓰고, 서버 settings 하이드레이션이 최종 권한)
  const settings = loaded.currentUser
    ? loaded.settings
    : { ...loaded.settings, locale: initialGuestLocale() };
  return {
    ...loaded,
    settings,
    templates: localizeDefaultTemplates(loaded.templates, settings.locale),
    github: INITIAL_GITHUB_STATE,
    calendar: INITIAL_CALENDAR_STATE,
    lastTodoIdReplacement: null,
  };
}
