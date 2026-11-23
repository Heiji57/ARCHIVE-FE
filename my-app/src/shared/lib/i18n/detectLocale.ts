/**
 * 접속 지역 기반 locale 감지 + 사용자가 직접 고른 locale 의 로컬 영속화.
 *
 *  - 지역 판정은 1) 브라우저 타임존 → 국가, 2) navigator.languages 의 지역 서브태그
 *    (예: en-KR), 3) navigator.languages 의 언어 순으로 한다.
 *  - 지원 locale(DICTIONARIES)로 매핑되지 않으면 영어로 둔다.
 *  - 비로그인 사용자의 언어 선택은 서버에 저장할 곳이 없으므로 localStorage 에만 둔다.
 */
import type { Locale } from "@/app/model/settings";
import { COUNTRY_PRIMARY_LOCALE, COUNTRY_PRIMARY_TZ } from "@/shared/lib/geo";
import { DICTIONARIES } from "./dictionaries";

const KEY = "archive.locale";

const SUPPORTED = Object.keys(DICTIONARIES) as Locale[];

/** BCP-47 태그(예: "ko-KR") → 지원 locale. 지원하지 않으면 null. */
export function toSupportedLocale(tag: string | undefined | null): Locale | null {
  if (!tag) return null;
  const lower = tag.toLowerCase();
  // 번체 중국어 지역(대만·홍콩·마카오) 또는 Hant 스크립트
  if (/^zh-(tw|hk|mo|hant)\b/.test(lower)) return "zh-TW";
  const lang = lower.split("-")[0] as Locale;
  return SUPPORTED.includes(lang) ? lang : null;
}

/** 다중 타임존 국가의 IANA 존 → 국가. (US/CA/AU 는 영어라 감지 결과가 같아 생략) */
const MULTI_TZ_ZONES: Record<string, string[]> = {
  ID: ["Asia/Jakarta", "Asia/Pontianak", "Asia/Makassar", "Asia/Jayapura"],
  BR: [
    "America/Sao_Paulo", "America/Bahia", "America/Fortaleza", "America/Recife",
    "America/Belem", "America/Maceio", "America/Araguaina", "America/Santarem",
    "America/Manaus", "America/Cuiaba", "America/Campo_Grande", "America/Porto_Velho",
    "America/Boa_Vista", "America/Rio_Branco", "America/Eirunepe", "America/Noronha",
  ],
  RU: [
    "Europe/Moscow", "Europe/Kaliningrad", "Europe/Samara", "Europe/Volgograd",
    "Europe/Saratov", "Europe/Ulyanovsk", "Europe/Astrakhan", "Europe/Kirov",
    "Asia/Yekaterinburg", "Asia/Omsk", "Asia/Novosibirsk", "Asia/Barnaul", "Asia/Tomsk",
    "Asia/Novokuznetsk", "Asia/Krasnoyarsk", "Asia/Irkutsk", "Asia/Chita", "Asia/Yakutsk",
    "Asia/Khandyga", "Asia/Vladivostok", "Asia/Ust-Nera", "Asia/Magadan",
    "Asia/Sakhalin", "Asia/Srednekolymsk", "Asia/Kamchatka", "Asia/Anadyr",
  ],
  MX: [
    "America/Mexico_City", "America/Cancun", "America/Merida", "America/Monterrey",
    "America/Matamoros", "America/Chihuahua", "America/Ciudad_Juarez", "America/Ojinaga",
    "America/Hermosillo", "America/Mazatlan", "America/Bahia_Banderas", "America/Tijuana",
  ],
  AR: [
    "America/Argentina/Buenos_Aires", "America/Argentina/Cordoba", "America/Argentina/Salta",
    "America/Argentina/Jujuy", "America/Argentina/Tucuman", "America/Argentina/Catamarca",
    "America/Argentina/La_Rioja", "America/Argentina/San_Juan", "America/Argentina/Mendoza",
    "America/Argentina/San_Luis", "America/Argentina/Rio_Gallegos", "America/Argentina/Ushuaia",
    "America/Buenos_Aires",
  ],
  CL: ["America/Santiago", "America/Punta_Arenas", "Pacific/Easter"],
  KZ: ["Asia/Almaty", "Asia/Qostanay", "Asia/Qyzylorda", "Asia/Aqtobe", "Asia/Aqtau", "Asia/Atyrau", "Asia/Oral"],
  MN: ["Asia/Ulaanbaatar", "Asia/Hovd", "Asia/Choibalsan"],
};

let tzToCountry: Map<string, string> | null = null;

function countryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    if (!tzToCountry) {
      tzToCountry = new Map(
        Object.entries(COUNTRY_PRIMARY_TZ).map(([country, zone]) => [zone, country]),
      );
      // 다중 타임존 국가(COUNTRY_PRIMARY_TZ 에 없음) 중 영어권이 아닌 곳의 주요 존
      for (const [country, zones] of Object.entries(MULTI_TZ_ZONES)) {
        for (const zone of zones) tzToCountry.set(zone, country);
      }
      // COUNTRY_PRIMARY_TZ 에 없는 별칭(구 IANA 이름 등)
      // Chrome(ICU)는 일부 존을 구 이름으로 돌려준다 (예: Asia/Kolkata → Asia/Calcutta).
      tzToCountry.set("Asia/Calcutta", "IN");
      tzToCountry.set("Asia/Saigon", "VN");
      tzToCountry.set("Asia/Katmandu", "NP");
      tzToCountry.set("Asia/Rangoon", "MM");
      tzToCountry.set("Europe/Kyiv", "UA");
      tzToCountry.set("Asia/Chongqing", "CN");
      tzToCountry.set("Asia/Harbin", "CN");
      tzToCountry.set("Asia/Urumqi", "CN");
      tzToCountry.set("PRC", "CN");
      tzToCountry.set("ROK", "KR");
      tzToCountry.set("Japan", "JP");
    }
    return tzToCountry.get(tz) ?? null;
  } catch {
    return null;
  }
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages?.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

/** 접속 지역의 언어. 지원하지 않는 지역이면 "en". */
export function detectRegionLocale(): Locale {
  const fromTz = toSupportedLocale(COUNTRY_PRIMARY_LOCALE[countryFromTimezone() ?? ""]);
  if (fromTz) return fromTz;

  const langs = browserLanguages();
  for (const tag of langs) {
    const region = tag.split("-")[1]?.toUpperCase();
    const fromRegion = region ? toSupportedLocale(COUNTRY_PRIMARY_LOCALE[region]) : null;
    if (fromRegion) return fromRegion;
  }
  for (const tag of langs) {
    const fromLang = toSupportedLocale(tag);
    if (fromLang) return fromLang;
  }
  return "en";
}

/**
 * 언어 토글에 노출할 선택지 — 영어 + 접속 지역 언어.
 * 현재 locale 이 둘 다 아니면(설정 화면에서 다른 언어를 고른 경우) 함께 노출해
 * 활성 상태가 사라지지 않게 한다.
 */
export function regionLocaleChoices(current: Locale): Locale[] {
  const choices: Locale[] = ["en"];
  const region = detectRegionLocale();
  if (region !== "en") choices.push(region);
  if (!choices.includes(current)) choices.push(current);
  return choices;
}

export function readLocaleChoice(): Locale | null {
  try {
    return toSupportedLocale(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function writeLocaleChoice(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* localStorage 접근 불가(프라이빗 모드 등) 시 무시 */
  }
}

/** 비로그인 상태의 초기 locale — 직접 고른 값이 있으면 그것, 없으면 접속 지역 언어. */
export function initialGuestLocale(): Locale {
  return readLocaleChoice() ?? detectRegionLocale();
}
