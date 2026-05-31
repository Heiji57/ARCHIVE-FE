import type { Locale } from "@/app/model/settings";
import { DICTIONARIES, type TranslationKey } from "./dictionaries";

export type Vars = Record<string, string | number>;

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

/**
 * I18nProvider 바깥(예: AppProvider, 알림 발송 로직)에서도 쓸 수 있는
 * 독립 번역 함수. locale 을 직접 넘긴다.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Vars,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES.ko;
  return interpolate(dict[key] ?? key, vars);
}
