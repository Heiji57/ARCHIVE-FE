import { useRef, type ReactElement } from "react";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { useTranslation } from "@/shared/lib/i18n";
import { SECTION_LABEL } from "../model/sections";
import { arrowNav } from "./popover";

/** 왼쪽 섹션 목록(시안 sx-nav). 찾는 중에는 고른 표시를 지운다. 위아래 화살표로 이동. */
export function SectionNav({
  sections,
  current,
  icons,
  onPick,
}: {
  sections: SettingsSection[];
  current: SettingsSection | null;
  icons: Record<SettingsSection, ReactElement>;
  onPick: (s: SettingsSection) => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  return (
    <nav ref={ref} className="ss-list" aria-label={t("shell.settings.list")} onKeyDown={(e) => arrowNav(e)}>
      {sections.map((s) => (
        <button key={s} type="button" aria-current={s === current ? "page" : undefined} onClick={() => onPick(s)}>
          {icons[s]}
          {t(SECTION_LABEL[s])}
        </button>
      ))}
    </nav>
  );
}
