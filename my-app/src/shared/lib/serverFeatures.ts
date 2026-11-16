import { isDemoMode } from "./demoMode";

/**
 * 서버(api.yaml)에 아직 없는 기능 이름. 백엔드 요청 문서(docs/be-request-*.md)의 항목과 대응한다.
 * 실제 모드에서 false 인 기능의 UI 는 렌더하지 않는다(버튼이 404 를 부르지 않게).
 */
export type ServerFeature =
  | "ai"
  | "userCalendars"
  | "tagAdmin"
  | "trash"
  | "exports"
  | "accountDelete"
  | "avatar"
  | "settingsExt"
  | "notificationPrefs"
  | "topicStructured"
  | "overdueQuery"
  | "todoBatch"
  | "commitRange"
  | "searchScope";

/**
 * 실제 모드에서 각 기능이 서버에 있는지. api.yaml 에 엔드포인트가 들어오고
 * shared/api 연동이 끝난 기능만 true 로 바꾼다.
 */
export const SERVER_FEATURES: Readonly<Record<ServerFeature, boolean>> = {
  ai: false,
  userCalendars: false,
  tagAdmin: false,
  trash: false,
  exports: false,
  accountDelete: false,
  avatar: false,
  settingsExt: false,
  notificationPrefs: false,
  topicStructured: false,
  overdueQuery: false,
  todoBatch: false,
  commitRange: false,
  searchScope: false,
};

/** 데모 모드면 항상 true(데모 데이터로 보여 준다), 아니면 SERVER_FEATURES 값. */
export function isServerFeatureOn(feature: ServerFeature, opts: { demo: boolean }): boolean {
  if (opts.demo) return true;
  return SERVER_FEATURES[feature];
}

/** 컴포넌트에서 쓰는 형태. `?demo=true` 여부는 isDemoMode() 로 읽는다. */
export function useServerFeature(feature: ServerFeature): boolean {
  return isServerFeatureOn(feature, { demo: isDemoMode() });
}
