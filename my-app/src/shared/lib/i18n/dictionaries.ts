/**
 * i18n 집계 모듈 — 키 union 은 keys.ts, 로케일별 사전은 locales/별 파일에 있다.
 * (기존 import 경로를 유지하기 위해 재내보낸다.)
 */
import type { Locale } from "@/app/model/settings";
import type { Dict, FullDict } from "./keys";
import { I18N_MODULES, mergeI18nModules } from "./modules/registry";
import { ko } from "./locales/ko";
import { en } from "./locales/en";
import { zh } from "./locales/zh";
import { ja } from "./locales/ja";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { pt } from "./locales/pt";
import { it } from "./locales/it";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { vi } from "./locales/vi";
import { zhTW } from "./locales/zhTW";
import { th } from "./locales/th";
import { id } from "./locales/id";
import { hi } from "./locales/hi";

export type { TranslationKey, BaseTranslationKey, Dict, FullDict } from "./keys";

const BASE_DICTIONARIES: Record<Locale, Dict> = { ko, en, zh, ja, es, fr, de, pt, it, ru, tr, vi, "zh-TW": zhTW, th, id, hi };

/** 기존 로케일 사전 + i18n 모듈(modules/). ko/en 이외 로케일의 모듈 키는 en 값. */
export const DICTIONARIES = mergeI18nModules(BASE_DICTIONARIES, I18N_MODULES) as Record<Locale, FullDict>;
