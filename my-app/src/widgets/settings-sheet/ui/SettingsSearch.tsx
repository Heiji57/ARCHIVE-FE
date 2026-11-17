import type { ReactElement, RefObject } from "react";
import { Search, X } from "lucide-react";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { SECTION_LABEL, rowById } from "../model/sections";
import type { SettingsSearchHit } from "../model/search";
import { IN_CARD, renderRow, type RowCtx } from "./rows";

export function SearchInput({ value, onChange, inputRef }: { value: string; onChange: (v: string) => void; inputRef?: RefObject<HTMLInputElement | null> }) {
  const { t } = useTranslation();
  return (
    <label className="ss-q">
      <Search size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            e.stopPropagation();
            onChange("");
          }
          if (e.key === "Enter") {
            e.preventDefault();
            document.querySelector<HTMLElement>(".sx-results :is(button, input, textarea, [tabindex='0'])")?.focus();
          }
        }}
        placeholder={t("shell.settings.find")}
        aria-label={t("shell.settings.findLabel")}
        autoComplete="off"
      />
      {value ? (
        <button type="button" className="ss-qx" aria-label={t("settingsSheet.clear")} onClick={() => onChange("")}>
          <X size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

/** 찾기 결과(시안 results): 섹션별 머리(아이콘, 이름), 블록, 카드, "세부 설정" 카드. 줄은 섹션 화면과 같은 컴포넌트. */
export function SearchResults({ q, hits, icons, ctx }: { q: string; hits: SettingsSearchHit[]; icons: Record<SettingsSection, ReactElement>; ctx: RowCtx }) {
  const { t } = useTranslation();
  if (!hits.length) {
    return (
      <div className="sx-empty">
        <b>{t("settingsSheet.empty", { q })}</b>
        <p>{t("settingsSheet.emptyHint")}</p>
      </div>
    );
  }
  const sections = [...new Set(hits.map((h) => h.section))];
  return (
    <div className="sx-results">
      {sections.map((s) => {
        const rows = hits.filter((h) => h.section === s).map((h) => rowById(h.rowId)!);
        const blocks = rows.filter((r) => !IN_CARD.has(r.id));
        const show = rows.filter((r) => IN_CARD.has(r.id) && r.kind !== "more");
        const more = rows.filter((r) => IN_CARD.has(r.id) && r.kind === "more");
        return (
          <section className="sx-sec" key={s} aria-labelledby={`sx-sh-${s}`}>
            <header className="sx-sh">
              <h2 id={`sx-sh-${s}`}>
                {icons[s]}
                {t(SECTION_LABEL[s])}
              </h2>
            </header>
            {blocks.map((r) => (
              <div key={r.id}>{renderRow(r.id, ctx)}</div>
            ))}
            {show.length ? <div className="sx-card">{show.map((r) => <RowSlot key={r.id} id={r.id} ctx={ctx} />)}</div> : null}
            {more.length ? (
              <>
                {show.length ? <h3 className="sx-sub">{t("settingsSheet.more")}</h3> : null}
                <div className="sx-card">{more.map((r) => <RowSlot key={r.id} id={r.id} ctx={ctx} />)}</div>
              </>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function RowSlot({ id, ctx }: { id: string; ctx: RowCtx }) {
  return <>{renderRow(id, ctx)}</>;
}
