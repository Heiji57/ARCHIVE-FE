import { createContext } from "react";
import type { Locale } from "@/app/model/settings";
import type { TranslationKey } from "./keys";
import type { Vars } from "./translate";

export type TranslateFn = (key: TranslationKey, vars?: Vars) => string;

export interface I18nContextValue {
  locale: Locale;
  t: TranslateFn;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
