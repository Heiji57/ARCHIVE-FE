import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/app/model/settings";
import { DICTIONARIES, type TranslationKey } from "./dictionaries";

type Vars = Record<string, string | number>;

export type TranslateFn = (key: TranslationKey, vars?: Vars) => string;

interface I18nContextValue {
  locale: Locale;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTIONARIES[locale] ?? DICTIONARIES.ko;
    return {
      locale,
      t: (key, vars) => interpolate(dict[key] ?? key, vars),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used inside I18nProvider");
  }
  return ctx;
}
