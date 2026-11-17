import type { Locale } from "@/app/model/settings";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { isDemoMode } from "@/shared/lib/demoMode";
import { translate } from "@/shared/lib/i18n";
import { SECTION_LABEL, SETTINGS_ROWS, isRowVisible, type RowVisibility } from "./sections";

export interface SettingsSearchHit {
  section: SettingsSection;
  rowId: string;
}

/**
 * 설정 찾기(시안 match): 줄 이름, 설명, 찾기 낱말, 섹션 이름을 이어 붙여 소문자로 포함 여부를 본다.
 * 실제 모드에서 가린 줄과 연결이 필요한 줄은 결과에서 뺀다. 빈 검색은 빈 배열.
 */
export function searchSettings(
  q: string,
  locale: Locale,
  vis: RowVisibility = { demo: isDemoMode(), github: true, calendar: true },
): SettingsSearchHit[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const tr = (k: Parameters<typeof translate>[1]) => translate(locale, k);
  return SETTINGS_ROWS.filter((r) => isRowVisible(r, vis))
    .filter((r) =>
      [tr(r.title), r.desc ? tr(r.desc) : "", tr(r.kw), tr(SECTION_LABEL[r.section])]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
    .map((r) => ({ section: r.section, rowId: r.id }));
}
