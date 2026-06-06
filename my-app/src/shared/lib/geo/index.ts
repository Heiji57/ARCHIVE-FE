/**
 * 국가/지역(타임존) 선택용 정적 데이터.
 *  - 국가 이름은 런타임 의존성 없이 Intl.DisplayNames 로 표시(코드만 보관).
 *  - 다중 tz 국가만 region(ISO 3166-2) 선택이 필요하다.
 *  - region 코드는 백엔드(api.yaml: ^[A-Z]{2}-[A-Z0-9]{1,3}$)가 검증한다.
 */

/** 회원가입 시 region 이 필수인 다중 타임존 국가 (api.yaml 기준). */
export const MULTI_TZ_COUNTRIES = [
  "US",
  "CA",
  "RU",
  "AU",
  "BR",
  "MX",
  "ID",
  "AR",
  "CL",
  "KZ",
  "MN",
] as const;

export type MultiTzCountry = (typeof MULTI_TZ_COUNTRIES)[number];

const MULTI_TZ_SET = new Set<string>(MULTI_TZ_COUNTRIES);

export function isMultiTzCountry(country: string): boolean {
  return MULTI_TZ_SET.has(country);
}

export interface RegionOption {
  /** ISO 3166-2 코드 (예: US-CA) */
  code: string;
  /** 표시 이름 (영문 기준) */
  name: string;
}

/** ISO 3166-1 alpha-2 전체 국가 코드. 이름은 Intl.DisplayNames 로 표시. */
export const COUNTRY_CODES: string[] = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS",
  "BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN",
  "CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE",
  "EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF",
  "GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM",
  "HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM",
  "JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC",
  "LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK",
  "ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA",
  "NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG",
  "PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS",
  "ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO",
  "TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI",
  "VN","VU","WF","WS","YE","YT","ZA","ZM","ZW",
];

const r = (code: string, name: string): RegionOption => ({ code, name });

/**
 * 다중 tz 국가의 ISO 3166-2 1차 행정구역.
 * (타임존 결정에 충분한 1차 단위. 코드 정확성은 백엔드가 최종 검증)
 */
export const REGIONS_BY_COUNTRY: Record<MultiTzCountry, RegionOption[]> = {
  US: [
    r("US-AL","Alabama"),r("US-AK","Alaska"),r("US-AZ","Arizona"),r("US-AR","Arkansas"),
    r("US-CA","California"),r("US-CO","Colorado"),r("US-CT","Connecticut"),r("US-DE","Delaware"),
    r("US-DC","District of Columbia"),r("US-FL","Florida"),r("US-GA","Georgia"),r("US-HI","Hawaii"),
    r("US-ID","Idaho"),r("US-IL","Illinois"),r("US-IN","Indiana"),r("US-IA","Iowa"),
    r("US-KS","Kansas"),r("US-KY","Kentucky"),r("US-LA","Louisiana"),r("US-ME","Maine"),
    r("US-MD","Maryland"),r("US-MA","Massachusetts"),r("US-MI","Michigan"),r("US-MN","Minnesota"),
    r("US-MS","Mississippi"),r("US-MO","Missouri"),r("US-MT","Montana"),r("US-NE","Nebraska"),
    r("US-NV","Nevada"),r("US-NH","New Hampshire"),r("US-NJ","New Jersey"),r("US-NM","New Mexico"),
    r("US-NY","New York"),r("US-NC","North Carolina"),r("US-ND","North Dakota"),r("US-OH","Ohio"),
    r("US-OK","Oklahoma"),r("US-OR","Oregon"),r("US-PA","Pennsylvania"),r("US-RI","Rhode Island"),
    r("US-SC","South Carolina"),r("US-SD","South Dakota"),r("US-TN","Tennessee"),r("US-TX","Texas"),
    r("US-UT","Utah"),r("US-VT","Vermont"),r("US-VA","Virginia"),r("US-WA","Washington"),
    r("US-WV","West Virginia"),r("US-WI","Wisconsin"),r("US-WY","Wyoming"),
  ],
  CA: [
    r("CA-AB","Alberta"),r("CA-BC","British Columbia"),r("CA-MB","Manitoba"),r("CA-NB","New Brunswick"),
    r("CA-NL","Newfoundland and Labrador"),r("CA-NS","Nova Scotia"),r("CA-NT","Northwest Territories"),
    r("CA-NU","Nunavut"),r("CA-ON","Ontario"),r("CA-PE","Prince Edward Island"),r("CA-QC","Quebec"),
    r("CA-SK","Saskatchewan"),r("CA-YT","Yukon"),
  ],
  AU: [
    r("AU-NSW","New South Wales"),r("AU-QLD","Queensland"),r("AU-SA","South Australia"),
    r("AU-TAS","Tasmania"),r("AU-VIC","Victoria"),r("AU-WA","Western Australia"),
    r("AU-ACT","Australian Capital Territory"),r("AU-NT","Northern Territory"),
  ],
  BR: [
    r("BR-AC","Acre"),r("BR-AL","Alagoas"),r("BR-AP","Amapá"),r("BR-AM","Amazonas"),
    r("BR-BA","Bahia"),r("BR-CE","Ceará"),r("BR-DF","Distrito Federal"),r("BR-ES","Espírito Santo"),
    r("BR-GO","Goiás"),r("BR-MA","Maranhão"),r("BR-MT","Mato Grosso"),r("BR-MS","Mato Grosso do Sul"),
    r("BR-MG","Minas Gerais"),r("BR-PA","Pará"),r("BR-PB","Paraíba"),r("BR-PR","Paraná"),
    r("BR-PE","Pernambuco"),r("BR-PI","Piauí"),r("BR-RJ","Rio de Janeiro"),r("BR-RN","Rio Grande do Norte"),
    r("BR-RS","Rio Grande do Sul"),r("BR-RO","Rondônia"),r("BR-RR","Roraima"),r("BR-SC","Santa Catarina"),
    r("BR-SP","São Paulo"),r("BR-SE","Sergipe"),r("BR-TO","Tocantins"),
  ],
  MX: [
    r("MX-AGU","Aguascalientes"),r("MX-BCN","Baja California"),r("MX-BCS","Baja California Sur"),
    r("MX-CAM","Campeche"),r("MX-CHP","Chiapas"),r("MX-CHH","Chihuahua"),r("MX-CMX","Ciudad de México"),
    r("MX-COA","Coahuila"),r("MX-COL","Colima"),r("MX-DUR","Durango"),r("MX-GUA","Guanajuato"),
    r("MX-GRO","Guerrero"),r("MX-HID","Hidalgo"),r("MX-JAL","Jalisco"),r("MX-MEX","México"),
    r("MX-MIC","Michoacán"),r("MX-MOR","Morelos"),r("MX-NAY","Nayarit"),r("MX-NLE","Nuevo León"),
    r("MX-OAX","Oaxaca"),r("MX-PUE","Puebla"),r("MX-QUE","Querétaro"),r("MX-ROO","Quintana Roo"),
    r("MX-SLP","San Luis Potosí"),r("MX-SIN","Sinaloa"),r("MX-SON","Sonora"),r("MX-TAB","Tabasco"),
    r("MX-TAM","Tamaulipas"),r("MX-TLA","Tlaxcala"),r("MX-VER","Veracruz"),r("MX-YUC","Yucatán"),
    r("MX-ZAC","Zacatecas"),
  ],
  AR: [
    r("AR-C","Ciudad Autónoma de Buenos Aires"),r("AR-B","Buenos Aires"),r("AR-K","Catamarca"),
    r("AR-H","Chaco"),r("AR-U","Chubut"),r("AR-X","Córdoba"),r("AR-W","Corrientes"),
    r("AR-E","Entre Ríos"),r("AR-P","Formosa"),r("AR-Y","Jujuy"),r("AR-L","La Pampa"),
    r("AR-F","La Rioja"),r("AR-M","Mendoza"),r("AR-N","Misiones"),r("AR-Q","Neuquén"),
    r("AR-R","Río Negro"),r("AR-A","Salta"),r("AR-J","San Juan"),r("AR-D","San Luis"),
    r("AR-Z","Santa Cruz"),r("AR-S","Santa Fe"),r("AR-G","Santiago del Estero"),
    r("AR-V","Tierra del Fuego"),r("AR-T","Tucumán"),
  ],
  CL: [
    r("CL-AI","Aysén"),r("CL-AN","Antofagasta"),r("CL-AP","Arica y Parinacota"),r("CL-AR","La Araucanía"),
    r("CL-AT","Atacama"),r("CL-BI","Biobío"),r("CL-CO","Coquimbo"),r("CL-LI","O'Higgins"),
    r("CL-LL","Los Lagos"),r("CL-LR","Los Ríos"),r("CL-MA","Magallanes"),r("CL-ML","Maule"),
    r("CL-NB","Ñuble"),r("CL-RM","Región Metropolitana"),r("CL-TA","Tarapacá"),r("CL-VS","Valparaíso"),
  ],
  KZ: [
    r("KZ-10","Abai"),r("KZ-75","Almaty (city)"),r("KZ-19","Almaty"),r("KZ-11","Akmola"),
    r("KZ-15","Aktobe"),r("KZ-71","Astana"),r("KZ-23","Atyrau"),r("KZ-27","West Kazakhstan"),
    r("KZ-47","Mangystau"),r("KZ-55","Pavlodar"),r("KZ-35","Karaganda"),r("KZ-39","Kostanay"),
    r("KZ-43","Kyzylorda"),r("KZ-63","East Kazakhstan"),r("KZ-79","Shymkent"),r("KZ-59","North Kazakhstan"),
    r("KZ-61","Turkistan"),r("KZ-62","Ulytau"),r("KZ-31","Jambyl"),r("KZ-33","Jetisu"),
  ],
  MN: [
    r("MN-1","Ulaanbaatar"),r("MN-073","Arkhangai"),r("MN-071","Bayan-Ölgii"),r("MN-069","Bayankhongor"),
    r("MN-067","Bulgan"),r("MN-037","Darkhan-Uul"),r("MN-061","Dornod"),r("MN-063","Dornogovi"),
    r("MN-059","Dundgovi"),r("MN-057","Govi-Altai"),r("MN-065","Govisümber"),r("MN-043","Khovd"),
    r("MN-041","Khövsgöl"),r("MN-053","Khentii"),r("MN-035","Orkhon"),r("MN-055","Övörkhangai"),
    r("MN-049","Selenge"),r("MN-051","Sükhbaatar"),r("MN-047","Töv"),r("MN-046","Uvs"),
    r("MN-045","Zavkhan"),
  ],
  ID: [
    r("ID-AC","Aceh"),r("ID-BA","Bali"),r("ID-BB","Bangka Belitung"),r("ID-BT","Banten"),
    r("ID-BE","Bengkulu"),r("ID-JT","Central Java"),r("ID-KT","Central Kalimantan"),r("ID-ST","Central Sulawesi"),
    r("ID-JI","East Java"),r("ID-KI","East Kalimantan"),r("ID-NT","East Nusa Tenggara"),r("ID-GO","Gorontalo"),
    r("ID-JK","Jakarta"),r("ID-JA","Jambi"),r("ID-LA","Lampung"),r("ID-MA","Maluku"),
    r("ID-MU","North Maluku"),r("ID-SA","North Sulawesi"),r("ID-SU","North Sumatra"),r("ID-PA","Papua"),
    r("ID-RI","Riau"),r("ID-KR","Riau Islands"),r("ID-SG","Southeast Sulawesi"),r("ID-SN","South Sulawesi"),
    r("ID-SS","South Sumatra"),r("ID-KS","South Kalimantan"),r("ID-JB","West Java"),r("ID-KB","West Kalimantan"),
    r("ID-NB","West Nusa Tenggara"),r("ID-PB","West Papua"),r("ID-SB","West Sumatra"),r("ID-SR","West Sulawesi"),
    r("ID-YO","Yogyakarta"),
  ],
  RU: [
    r("RU-MOW","Moscow"),r("RU-SPE","Saint Petersburg"),r("RU-AD","Adygea"),r("RU-AL","Altai Republic"),
    r("RU-ALT","Altai Krai"),r("RU-AMU","Amur"),r("RU-ARK","Arkhangelsk"),r("RU-AST","Astrakhan"),
    r("RU-BA","Bashkortostan"),r("RU-BEL","Belgorod"),r("RU-BRY","Bryansk"),r("RU-BU","Buryatia"),
    r("RU-CE","Chechnya"),r("RU-CHE","Chelyabinsk"),r("RU-CU","Chuvashia"),r("RU-CT","Zabaykalsky Krai"),
    r("RU-DA","Dagestan"),r("RU-IN","Ingushetia"),r("RU-IRK","Irkutsk"),r("RU-IVA","Ivanovo"),
    r("RU-KB","Kabardino-Balkaria"),r("RU-KGD","Kaliningrad"),r("RU-KL","Kalmykia"),r("RU-KLU","Kaluga"),
    r("RU-KAM","Kamchatka"),r("RU-KC","Karachay-Cherkessia"),r("RU-KR","Karelia"),r("RU-KEM","Kemerovo"),
    r("RU-KHA","Khabarovsk"),r("RU-KK","Khakassia"),r("RU-KHM","Khanty-Mansi"),r("RU-KIR","Kirov"),
    r("RU-KO","Komi"),r("RU-KOS","Kostroma"),r("RU-KDA","Krasnodar"),r("RU-KYA","Krasnoyarsk"),
    r("RU-KGN","Kurgan"),r("RU-KRS","Kursk"),r("RU-LEN","Leningrad"),r("RU-LIP","Lipetsk"),
    r("RU-MAG","Magadan"),r("RU-ME","Mari El"),r("RU-MO","Mordovia"),r("RU-MOS","Moscow Oblast"),
    r("RU-MUR","Murmansk"),r("RU-NEN","Nenets"),r("RU-NIZ","Nizhny Novgorod"),r("RU-NGR","Novgorod"),
    r("RU-NVS","Novosibirsk"),r("RU-OMS","Omsk"),r("RU-ORE","Orenburg"),r("RU-ORL","Oryol"),
    r("RU-PNZ","Penza"),r("RU-PER","Perm"),r("RU-PRI","Primorsky Krai"),r("RU-PSK","Pskov"),
    r("RU-ROS","Rostov"),r("RU-RYA","Ryazan"),r("RU-SAK","Sakhalin"),r("RU-SA","Sakha (Yakutia)"),
    r("RU-SAM","Samara"),r("RU-SAR","Saratov"),r("RU-SE","North Ossetia"),r("RU-SMO","Smolensk"),
    r("RU-STA","Stavropol"),r("RU-SVE","Sverdlovsk"),r("RU-TAM","Tambov"),r("RU-TA","Tatarstan"),
    r("RU-TOM","Tomsk"),r("RU-TUL","Tula"),r("RU-TVE","Tver"),r("RU-TYU","Tyumen"),
    r("RU-TY","Tuva"),r("RU-UD","Udmurtia"),r("RU-ULY","Ulyanovsk"),r("RU-VLA","Vladimir"),
    r("RU-VGG","Volgograd"),r("RU-VLG","Vologda"),r("RU-VOR","Voronezh"),r("RU-YAN","Yamalo-Nenets"),
    r("RU-YAR","Yaroslavl"),r("RU-YEV","Jewish Autonomous Oblast"),
  ],
};

/**
 * 국가 코드 → 그 나라의 대표(공용) 언어 BCP-47 locale.
 * 현지어 국가명 표기에 사용. 목록에 없는 국가는 영어만 표시한다.
 */
export const COUNTRY_PRIMARY_LOCALE: Record<string, string> = {
  KR: "ko", JP: "ja", CN: "zh", TW: "zh-TW", HK: "zh-HK",
  DE: "de", AT: "de", CH: "de", FR: "fr", ES: "es", MX: "es",
  AR: "es", CL: "es", CO: "es", PE: "es", VE: "es", EC: "es",
  BO: "es", PY: "es", UY: "es", CR: "es", PA: "es", GT: "es",
  HN: "es", NI: "es", SV: "es", DO: "es", CU: "es",
  IT: "it", PT: "pt", BR: "pt", RU: "ru", BY: "ru", KZ: "ru",
  KG: "ru", UA: "uk", PL: "pl", NL: "nl", BE: "nl", SE: "sv",
  NO: "no", DK: "da", FI: "fi", IS: "is", CZ: "cs", SK: "sk",
  HU: "hu", RO: "ro", BG: "bg", GR: "el", TR: "tr", IL: "he",
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar",
  QA: "ar", BH: "ar", OM: "ar", LB: "ar", MA: "ar", DZ: "ar",
  TN: "ar", LY: "ar", SY: "ar", YE: "ar",
  IR: "fa", AF: "fa", PK: "ur", IN: "hi", BD: "bn", LK: "si",
  NP: "ne", MM: "my", TH: "th", LA: "lo", KH: "km", VN: "vi",
  ID: "id", MY: "ms", PH: "fil", MN: "mn",
  ET: "am", KE: "sw", TZ: "sw", NG: "en", ZA: "en", GH: "en",
  HR: "hr", RS: "sr", SI: "sl", LT: "lt", LV: "lv", EE: "et",
  GE: "ka", AM: "hy", AZ: "az", UZ: "uz", AL: "sq", MK: "mk",
};

/** 국가 코드 → 표시 이름 (locale 기반, 기본 en). 실패 시 코드 그대로. */
export function countryName(code: string, locale = "en"): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * 한글(Hangul) 문자가 포함되어 있는지 확인.
 * Chrome ICU 가 특정 locale 언어 서브태그는 정상 resolve 하면서도
 * 해당 locale 에 국가명 데이터가 없으면 앱 UI 기본 언어(한국어)로 반환하는
 * 경우가 있다. 이 검사로 한국어 폴백을 최종 차단한다.
 */
function containsHangul(str: string): boolean {
  return /[가-힯ᄀ-ᇿ㄰-㆏ꥠ-꥿ힰ-퟿]/.test(
    str,
  );
}

/**
 * 현지어 국가명 — 두 가지 가드를 통과할 때만 반환한다.
 *
 * 가드 1 (locale 폴백): Intl.DisplayNames 가 요청 locale 데이터가 없으면 앱
 *   기본 locale(한국어)로 조용히 폴백한다. resolvedOptions().locale 언어
 *   서브태그가 다르면 폴백으로 판단해 null 반환.
 *
 * 가드 2 (한글 문자 포함): Chrome ICU 는 locale 자체는 정상 resolve 하면서도
 *   그 locale 에 특정 국가 번역이 없으면 UI 기본어(한국어)를 섞어 반환하는
 *   경우가 있다. 반환값에 한글이 포함되면 잘못된 폴백으로 간주해 null 반환.
 */
function nativeCountryName(code: string, locale: string): string | null {
  try {
    const dn = new Intl.DisplayNames([locale], {
      type: "region",
      fallback: "none",
    });
    const resolved = dn.resolvedOptions().locale;
    if (resolved.split("-")[0] !== locale.split("-")[0]) return null; // 가드 1
    const name = dn.of(code);
    if (!name || name === code) return null;
    // 가드 2: 요청 locale 이 한국어(ko)가 *아닌데* 한글이 반환되면 잘못된 ICU 폴백.
    // (locale="ko" 일 때 한글 결과는 정상 — "대한민국" 등이 여기서 차단되면 안 됨)
    if (locale.split("-")[0] !== "ko" && containsHangul(name)) return null;
    return name;
  } catch {
    return null;
  }
}

/**
 * 국가 표시 문자열 — 영어 기본 + 괄호로 현지어 이름.
 * 예: "South Korea (대한민국)", "Japan (日本)".
 * 현지어 매핑이 없거나(또는 런타임에 해당 언어 데이터가 없어 폴백되거나)
 * 영어와 같으면 영어만 표시한다.
 */
export function countryDisplayName(code: string): string {
  const en = countryName(code, "en");
  const nativeLocale = COUNTRY_PRIMARY_LOCALE[code];
  if (!nativeLocale) return en;
  const native = nativeCountryName(code, nativeLocale);
  if (!native || native === en) return en;
  return `${en} (${native})`;
}

/**
 * 단일 타임존 국가의 기본 IANA 타임존.
 * 다중 타임존 국가(MULTI_TZ_COUNTRIES)는 포함하지 않는다 — 지역(region)에 따라 다르기 때문.
 * 서버가 최종 권한이며, 이 맵은 모달에서 "Asia/Seoul로 변경됩니다" 형태의
 * 사전 안내(display-only)에만 사용한다.
 */
export const COUNTRY_PRIMARY_TZ: Record<string, string> = {
  // ── 동아시아 ─────────────────────────────────────────────────────────────
  KR:"Asia/Seoul", JP:"Asia/Tokyo", CN:"Asia/Shanghai", HK:"Asia/Hong_Kong",
  TW:"Asia/Taipei", MO:"Asia/Macau",
  // ── 동남아시아 ───────────────────────────────────────────────────────────
  SG:"Asia/Singapore", PH:"Asia/Manila", MY:"Asia/Kuala_Lumpur",
  TH:"Asia/Bangkok", VN:"Asia/Ho_Chi_Minh", KH:"Asia/Phnom_Penh",
  LA:"Asia/Vientiane", MM:"Asia/Yangon", BN:"Asia/Brunei", TL:"Asia/Dili",
  // ── 남아시아 ────────────────────────────────────────────────────────────
  IN:"Asia/Kolkata", BD:"Asia/Dhaka", LK:"Asia/Colombo",
  NP:"Asia/Kathmandu", BT:"Asia/Thimphu", MV:"Indian/Maldives",
  PK:"Asia/Karachi",
  // ── 중앙아시아 ───────────────────────────────────────────────────────────
  UZ:"Asia/Tashkent", TM:"Asia/Ashgabat", TJ:"Asia/Dushanbe",
  KG:"Asia/Bishkek", AF:"Asia/Kabul",
  // ── 서아시아·중동 ────────────────────────────────────────────────────────
  AE:"Asia/Dubai", SA:"Asia/Riyadh", QA:"Asia/Qatar", BH:"Asia/Bahrain",
  KW:"Asia/Kuwait", OM:"Asia/Muscat", YE:"Asia/Aden",
  IQ:"Asia/Baghdad", IR:"Asia/Tehran", SY:"Asia/Damascus",
  JO:"Asia/Amman", LB:"Asia/Beirut", IL:"Asia/Jerusalem",
  TR:"Europe/Istanbul",
  // ── 코카서스 ─────────────────────────────────────────────────────────────
  GE:"Asia/Tbilisi", AM:"Asia/Yerevan", AZ:"Asia/Baku",
  // ── 유럽 — 서부 ──────────────────────────────────────────────────────────
  GB:"Europe/London", IE:"Europe/Dublin", PT:"Europe/Lisbon",
  IS:"Atlantic/Reykjavik",
  FR:"Europe/Paris", BE:"Europe/Brussels", NL:"Europe/Amsterdam",
  LU:"Europe/Luxembourg", MC:"Europe/Monaco",
  DE:"Europe/Berlin", AT:"Europe/Vienna", CH:"Europe/Zurich",
  LI:"Europe/Vaduz",
  // ── 유럽 — 남부 ──────────────────────────────────────────────────────────
  IT:"Europe/Rome", SM:"Europe/San_Marino", VA:"Europe/Vatican",
  ES:"Europe/Madrid", AD:"Europe/Andorra",
  GR:"Europe/Athens", CY:"Asia/Nicosia", MT:"Europe/Malta",
  // ── 유럽 — 북부 ──────────────────────────────────────────────────────────
  DK:"Europe/Copenhagen", SE:"Europe/Stockholm", NO:"Europe/Oslo",
  FI:"Europe/Helsinki",
  EE:"Europe/Tallinn", LV:"Europe/Riga", LT:"Europe/Vilnius",
  // ── 유럽 — 동부·중부 ──────────────────────────────────────────────────────
  PL:"Europe/Warsaw", CZ:"Europe/Prague", SK:"Europe/Bratislava",
  HU:"Europe/Budapest", SI:"Europe/Ljubljana", HR:"Europe/Zagreb",
  BA:"Europe/Sarajevo", RS:"Europe/Belgrade", ME:"Europe/Podgorica",
  AL:"Europe/Tirane", MK:"Europe/Skopje",
  BG:"Europe/Sofia", RO:"Europe/Bucharest",
  MD:"Europe/Chisinau", UA:"Europe/Kiev", BY:"Europe/Minsk",
  // ── 아프리카 — 북부 ──────────────────────────────────────────────────────
  MA:"Africa/Casablanca", DZ:"Africa/Algiers", TN:"Africa/Tunis",
  LY:"Africa/Tripoli", EG:"Africa/Cairo",
  // ── 아프리카 — 동부 ──────────────────────────────────────────────────────
  SD:"Africa/Khartoum", ET:"Africa/Addis_Ababa", ER:"Africa/Asmara",
  DJ:"Africa/Djibouti", SO:"Africa/Mogadishu",
  KE:"Africa/Nairobi", UG:"Africa/Kampala", RW:"Africa/Kigali",
  BI:"Africa/Bujumbura", TZ:"Africa/Dar_es_Salaam",
  // ── 아프리카 — 남부·중부 ─────────────────────────────────────────────────
  ZA:"Africa/Johannesburg", ZM:"Africa/Lusaka", ZW:"Africa/Harare",
  MW:"Africa/Blantyre", MZ:"Africa/Maputo", BW:"Africa/Gaborone",
  NA:"Africa/Windhoek", SZ:"Africa/Mbabane", LS:"Africa/Maseru",
  MG:"Indian/Antananarivo", MU:"Indian/Mauritius", RE:"Indian/Reunion",
  // ── 아프리카 — 서부 ──────────────────────────────────────────────────────
  NG:"Africa/Lagos", GH:"Africa/Accra", SN:"Africa/Dakar",
  CI:"Africa/Abidjan", CM:"Africa/Douala", GA:"Africa/Libreville",
  // ── 아메리카 — 카리브·중미 ────────────────────────────────────────────────
  JM:"America/Jamaica", CU:"America/Havana", HT:"America/Port-au-Prince",
  DO:"America/Santo_Domingo", TT:"America/Port_of_Spain",
  BB:"America/Barbados", JE:"Europe/Jersey",
  CR:"America/Costa_Rica", PA:"America/Panama", GT:"America/Guatemala",
  BZ:"America/Belize", HN:"America/Tegucigalpa", SV:"America/El_Salvador",
  NI:"America/Managua",
  // ── 아메리카 — 남미 단일 tz ──────────────────────────────────────────────
  CO:"America/Bogota", PE:"America/Lima", EC:"America/Guayaquil",
  VE:"America/Caracas", BO:"America/La_Paz", UY:"America/Montevideo",
  PY:"America/Asuncion", SR:"America/Paramaribo", GY:"America/Guyana",
  // ── 오세아니아 ───────────────────────────────────────────────────────────
  NZ:"Pacific/Auckland", FJ:"Pacific/Fiji",
  PG:"Pacific/Port_Moresby", SB:"Pacific/Guadalcanal",
  VU:"Pacific/Efate", TO:"Pacific/Tongatapu", WS:"Pacific/Apia",
};

/**
 * 국가 코드의 기본 IANA 타임존 반환.
 * - 다중 타임존 국가(region 필요)는 null 반환 (지역에 따라 다름).
 * - 매핑 없는 국가도 null 반환.
 * - 표시 전용 — 서버가 최종 권한.
 */
export function countryDefaultTimezone(code: string): string | null {
  return COUNTRY_PRIMARY_TZ[code] ?? null;
}

/** 자주 쓰는 IANA 타임존 fallback (Intl.supportedValuesOf 미지원 환경용). */
const FALLBACK_TIMEZONES = [
  "UTC",
  "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore",
  "Asia/Kolkata", "Asia/Dubai", "Asia/Bangkok", "Asia/Jakarta", "Asia/Manila",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
  "Europe/Moscow", "Europe/Istanbul",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "America/Mexico_City", "America/Toronto",
  "Australia/Sydney", "Australia/Perth", "Pacific/Auckland",
  "Africa/Cairo", "Africa/Johannesburg",
];

/** 선택 가능한 IANA 타임존 목록 (가능하면 런타임 전체 목록, 아니면 fallback). */
export function supportedTimeZones(): string[] {
  try {
    const fn = (
      Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
    ).supportedValuesOf;
    if (typeof fn === "function") {
      const list = fn("timeZone");
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch {
    /* fall through */
  }
  return FALLBACK_TIMEZONES;
}

/**
 * 표시용 정렬된 국가 목록 [{code, name}].
 * name 은 "English (현지어)" 형식이며, 영어 이름 기준으로 정렬한다.
 */
export function sortedCountries(): Array<{ code: string; name: string }> {
  const list = COUNTRY_CODES.map((code) => ({
    code,
    name: countryDisplayName(code),
    sortKey: countryName(code, "en"),
  }));
  list.sort((a, b) => a.sortKey.localeCompare(b.sortKey, "en"));
  return list.map(({ code, name }) => ({ code, name }));
}
