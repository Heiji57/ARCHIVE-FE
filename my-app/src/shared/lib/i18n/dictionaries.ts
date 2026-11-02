/**
 * i18n 집계 모듈 — 키 union 은 keys.ts, 로케일별 사전은 locales/별 파일에 있다.
 * (기존 import 경로를 유지하기 위해 재내보낸다.)
 */
import type { Locale } from "@/app/model/settings";
import type { Dict } from "./keys";
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

export type { TranslationKey, Dict } from "./keys";

export const DICTIONARIES: Record<Locale, Dict> = { ko, en, zh, ja, es, fr, de, pt, it, ru, tr, vi, "zh-TW": zhTW, th, id, hi };
