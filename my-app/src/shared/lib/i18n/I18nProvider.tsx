import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/app/model/settings";
import type { TranslationKey } from "./dictionaries";
import { translate, type Vars } from "./translate";

export type TranslateFn = (key: TranslationKey, vars?: Vars) => string;

interface I18nContextValue {
  locale: Locale;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used inside I18nProvider");
  }
  return ctx;
}
