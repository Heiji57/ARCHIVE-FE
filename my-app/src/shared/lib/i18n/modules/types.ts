/**
 * 기능별 i18n 모듈. 한 기능의 문구를 한 파일에 ko/en 으로 모은다.
 * 나머지 14개 로케일은 registry.ts 의 mergeI18nModules 가 en 값으로 채운다.
 * 사용법은 같은 폴더의 README.md.
 */
export type I18nMessages<K extends string> = Readonly<Record<K, string>>;

export interface I18nModule<K extends string = string> {
  readonly ko: I18nMessages<K>;
  readonly en: I18nMessages<K>;
}

/** 모듈이 가진 키의 union. */
export type I18nModuleKey<M> = M extends I18nModule<infer K> ? K : never;

/**
 * 키 집합은 `ko` 에서 정해지고, `en` 은 정확히 같은 키를 가져야 한다
 * (빠진 키, 더 있는 키 모두 컴파일 에러).
 */
export function defineI18nModule<K extends string>(messages: {
  ko: Record<K, string>;
  en: NoInfer<Record<K, string>>;
}): I18nModule<K> {
  return messages;
}
