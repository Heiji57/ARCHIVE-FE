import { useEffect, useRef, useState, type ReactElement, type RefObject } from "react";
import { Bell, CalendarDays, FileText, Link2, Search, Shield, SlidersHorizontal, User, X } from "lucide-react";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/shared/config/settingsSections";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { ICON_STROKE, SparkIcon } from "@/shared/ui/icons";
import { SettingsStudio } from "@/widgets/settings-studio";
import { useSettingsSheet } from "../model/settingsSheet";

const LABEL: Record<SettingsSection, TranslationKey> = {
  account: "shell.settings.section.account",
  general: "shell.settings.section.general",
  work: "shell.settings.section.work",
  retro: "shell.settings.section.retro",
  ai: "shell.settings.section.ai",
  link: "shell.settings.section.link",
  notify: "shell.settings.section.notify",
  data: "shell.settings.section.data",
};

const ICON: Record<SettingsSection, (p: { size: number }) => ReactElement> = {
  account: (p) => <User {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
  general: (p) => <SlidersHorizontal {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
  work: (p) => <CalendarDays {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
  retro: (p) => <FileText {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
  ai: (p) => <SparkIcon {...p} aria-hidden="true" />,
  link: (p) => <Link2 {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
  notify: (p) => <Bell {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
  data: (p) => <Shield {...p} strokeWidth={ICON_STROKE} aria-hidden="true" />,
};

/**
 * 설정 시트 틀(시안 settings.css sx-dlg): 왼쪽에 "설정", 찾기, 섹션 목록, 오른쪽에 섹션 제목과 닫기, 내용.
 * 내용은 Task 6 이 섹션별로 바꾼다. 지금은 기존 SettingsStudio 를 그대로 넣는다.
 */
export function SettingsSheetHost() {
  const { section } = useSettingsSheet();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (section && !d.open) d.showModal();
    if (!section && d.open) d.close();
  }, [section]);
  return (
    <SheetDialog dialogRef={ref} section={section} />
  );
}

function SheetDialog({ dialogRef, section }: { dialogRef: RefObject<HTMLDialogElement | null>; section: SettingsSection | null }) {
  const { t } = useTranslation();
  const sheet = useSettingsSheet();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = SETTINGS_SECTIONS.filter((s) => !needle || t(LABEL[s]).toLowerCase().includes(needle));
  const navRef = useRef<HTMLElement>(null);

  return (
    <dialog
      ref={dialogRef}
      className="ss-dlg"
      aria-label={t("shell.settings.title")}
      onCancel={(e) => {
        e.preventDefault();
        sheet.close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) sheet.close();
      }}
    >
      {section ? (
        <div className="ss-in">
          <aside className="ss-nav">
            <p className="ss-t">{t("shell.settings.title")}</p>
            <label className="ss-q">
              <Search size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && shown[0]) {
                    e.preventDefault();
                    sheet.open(shown[0]);
                  }
                }}
                placeholder={t("shell.settings.find")}
                aria-label={t("shell.settings.findLabel")}
                autoComplete="off"
              />
            </label>
            <nav
              ref={navRef}
              className="ss-list"
              aria-label={t("shell.settings.list")}
              onKeyDown={(e) => {
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                const bs = [...(navRef.current?.querySelectorAll<HTMLElement>("button") ?? [])];
                const i = bs.indexOf(document.activeElement as HTMLElement);
                if (i < 0) return;
                e.preventDefault();
                bs[(i + (e.key === "ArrowDown" ? 1 : -1) + bs.length) % bs.length].focus();
              }}
            >
              {shown.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-current={s === section ? "page" : undefined}
                  onClick={() => sheet.open(s)}
                >
                  {ICON[s]({ size: 15 })}
                  {t(LABEL[s])}
                </button>
              ))}
              {shown.length === 0 ? <p className="ss-none">{t("shell.settings.noMatch")}</p> : null}
            </nav>
          </aside>
          <div className="ss-body">
            <header className="ss-h">
              <h1>{t(LABEL[section])}</h1>
              <button type="button" className="ss-x" aria-label={t("shell.settings.close")} onClick={sheet.close}>
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <div className="ss-sc">
              <SettingsStudio />
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
