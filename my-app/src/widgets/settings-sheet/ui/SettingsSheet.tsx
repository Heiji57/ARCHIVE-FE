import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Bell, CalendarDays, FileText, Link2, Shield, SlidersHorizontal, User, X } from "lucide-react";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE, SparkIcon } from "@/shared/ui/icons";
import { searchSettings } from "../model/search";
import { SECTION_LABEL, visibleSections } from "../model/sections";
import { linkVisibility, useIntegrations } from "../model/useIntegrations";
import { Select } from "./controls";
import { SectionAccount } from "./SectionAccount";
import { SectionAi } from "./SectionAi";
import { SectionData } from "./SectionData";
import { SectionGeneral } from "./SectionGeneral";
import { SectionLink } from "./SectionLink";
import { SectionNav } from "./SectionNav";
import { SectionNotify } from "./SectionNotify";
import { SectionRetro } from "./SectionRetro";
import { SectionWork } from "./SectionWork";
import { SearchInput, SearchResults } from "./SettingsSearch";

const ip = { size: 15, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;
const ICONS: Record<SettingsSection, ReactElement> = {
  account: <User {...ip} />,
  general: <SlidersHorizontal {...ip} />,
  work: <CalendarDays {...ip} />,
  retro: <FileText {...ip} />,
  ai: <SparkIcon size={15} aria-hidden="true" />,
  link: <Link2 {...ip} />,
  notify: <Bell {...ip} />,
  data: <Shield {...ip} />,
};

export interface SettingsSheetProps {
  section: SettingsSection;
  /** 섹션 고르기(셸 useSettingsSheet().open) */
  onSection: (s: SettingsSection) => void;
  onClose: () => void;
  /** AI 탭으로(예약한 일의 "AI 탭에서 새로 예약") */
  onGoAi?: () => void;
}

/**
 * 설정 시트 내용(시안 d-settings.html 3번 "창으로 열기"): 왼쪽 "설정", 찾기, 섹션 목록,
 * 오른쪽 섹션 제목(찾는 중이면 "검색 결과")과 닫기, 섹션 내용. 창 틀(dialog)은 셸의 SettingsSheetHost.
 */
export function SettingsSheet({ section, onSection, onClose, onGoAi }: SettingsSheetProps) {
  const { t, locale } = useTranslation();
  const [q, setQ] = useState("");
  const qRef = useRef<HTMLInputElement>(null);
  const scRef = useRef<HTMLDivElement>(null);
  const link = useIntegrations();
  const lv = linkVisibility(link);
  const vis = useMemo(() => ({ demo: isDemoMode(), github: lv.github, calendar: lv.calendar }), [lv.github, lv.calendar]);
  const sections = visibleSections(vis);
  const cur = sections.includes(section) ? section : sections[0];
  const hits = useMemo(() => searchSettings(q, locale, vis), [q, locale, vis]);
  const searching = !!q.trim();

  // 섹션을 바꾸면 맨 위로, /settings 로 들어왔으면 주소 해시도 맞춘다.
  useEffect(() => {
    scRef.current?.scrollTo(0, 0);
    if (window.location.pathname === "/settings" && window.location.hash !== `#${cur}`) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${cur}`);
    }
  }, [cur]);

  const go = (s: SettingsSection) => {
    setQ("");
    onSection(s);
  };
  const ctx = { go, onGoAi };

  return (
    <div
      className="ss-in sx"
      onKeyDown={(e) => {
        // "/" 로 찾기(입력 중이 아닐 때)
        const el = e.target as HTMLElement;
        if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.isContentEditable) {
          e.preventDefault();
          qRef.current?.focus();
        }
      }}
    >
      <aside className="ss-nav">
        <p className="ss-t">{t("shell.settings.title")}</p>
        <SearchInput value={q} onChange={setQ} inputRef={qRef} />
        <SectionNav sections={sections} current={searching ? null : cur} icons={ICONS} onPick={go} />
      </aside>
      <div className="ss-body">
        <header className="ss-h">
          <h1>{searching ? t("settingsSheet.results") : t(SECTION_LABEL[cur])}</h1>
          <button type="button" className="ss-x" aria-label={t("shell.settings.close")} onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        {/* 좁은 화면(왼쪽 목록이 없을 때) 섹션 고르기 */}
        <div className="sx-msec">
          <Select
            value={cur}
            alignLeft
            label={t("settingsSheet.pickSection")}
            options={sections.map((s) => ({ value: s, label: t(SECTION_LABEL[s]), icon: ICONS[s] }))}
            onChange={go}
          />
        </div>
        <div className="ss-sc" ref={scRef}>
          {searching ? (
            <SearchResults q={q.trim()} hits={hits} icons={ICONS} ctx={ctx} />
          ) : (
            <div className="sx-sec" key={cur}>
              {cur === "account" ? <SectionAccount /> : null}
              {cur === "general" ? <SectionGeneral /> : null}
              {cur === "work" ? <SectionWork /> : null}
              {cur === "retro" ? <SectionRetro /> : null}
              {cur === "ai" ? <SectionAi onGoAi={onGoAi} /> : null}
              {cur === "link" ? <SectionLink /> : null}
              {cur === "notify" ? <SectionNotify /> : null}
              {cur === "data" ? <SectionData /> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
