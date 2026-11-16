import type { Locale } from "@/app/model/settings";
import * as registered from "./index";
import type { I18nModule, I18nModuleKey } from "./types";

type Registered = typeof registered;

// index.ts 에서 I18nModule 이 아닌 것을 export 하면 여기서 컴파일 에러가 난다.
const modules: Readonly<Record<keyof Registered, I18nModule>> = registered;

/** 등록된 모든 모듈(index.ts). */
export const I18N_MODULES: readonly I18nModule[] = Object.values(modules);

/** 등록된 모든 모듈 키의 union. keys.ts 의 TranslationKey 에 합쳐진다. */
export type ModuleTranslationKey = I18nModuleKey<Registered[keyof Registered]>;

/**
 * 기존 로케일 사전에 모듈 문구를 더한 새 사전을 만든다(입력은 바꾸지 않는다).
 * ko 는 모듈의 ko, 그 밖의 로케일(en 포함)은 모듈의 en 값을 쓴다.
 */
export function mergeI18nModules(
  base: Readonly<Record<Locale, Readonly<Record<string, string>>>>,
  mods: readonly I18nModule[],
): Record<Locale, Record<string, string>> {
  const out = {} as Record<Locale, Record<string, string>>;
  for (const locale of Object.keys(base) as Locale[]) {
    const dict: Record<string, string> = { ...base[locale] };
    for (const m of mods) Object.assign(dict, locale === "ko" ? m.ko : m.en);
    out[locale] = dict;
  }
  return out;
}
