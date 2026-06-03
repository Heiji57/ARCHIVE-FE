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

/** 국가 코드 → 표시 이름 (locale 기반). 실패 시 코드 그대로. */
export function countryName(code: string, locale: string): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

/** 표시용 정렬된 국가 목록 [{code, name}] (locale 이름순). */
export function sortedCountries(
  locale: string,
): Array<{ code: string; name: string }> {
  const list = COUNTRY_CODES.map((code) => ({
    code,
    name: countryName(code, locale),
  }));
  list.sort((a, b) => a.name.localeCompare(b.name, locale));
  return list;
}
