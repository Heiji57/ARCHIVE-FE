import { useMemo, type ReactNode } from "react";
import type { Locale } from "@/app/model/settings";
import { I18nContext, type I18nContextValue } from "./context";
import { translate } from "./translate";

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
