import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import {
  getRightPanelTabDef,
  listRowTabs,
  resolveActiveTab,
  useRightPanel,
  type RightPanelTab,
  type RightPanelTabDef,
} from "../model/rightPanel";
import { useRightPanelContext } from "./useRightPanelCtx";

/**
 * 오른쪽 패널 틀(시안 rpanel.js rx6): 제목, 탭 글자 줄, 내용. 탭 내용은 registerRightPanelTab 으로 등록된다.
 * AI 추천 탭("ai")일 때는 탭 글자 줄 없이 그 탭이 자기 제목부터 그린다.
 */
export function RightPanelHost({ title }: { title?: ReactNode }) {
  const { t } = useTranslation();
  const panel = useRightPanel();
  const ctx = useRightPanelContext();
  const rowRef = useRef<HTMLDivElement>(null);
  if (!panel.open) return null;

  const tabs = listRowTabs(ctx);
  const active = resolveActiveTab(panel.tab, ctx);
  const def = getRightPanelTabDef(active);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.indexOf(active);
    let next: RightPanelTab | undefined;
    if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
    else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") next = tabs[0];
    else if (e.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    panel.setTab(next);
    requestAnimationFrame(() => rowRef.current?.querySelector<HTMLElement>(`#rpt-${next}`)?.focus());
  };

  return (
    <aside className="sh-rp" aria-label={t("shell.panel.label")}>
      <div className="sh-rp-in">
        {active !== "ai" ? (
          <>
            {title ? <div className="sh-rp-top">{title}</div> : null}
            <div
              ref={rowRef}
              className="sh-rp-tabs"
              role="tablist"
              aria-label={t("shell.panel.label")}
              aria-orientation="horizontal"
              onKeyDown={onKey}
            >
              {tabs.map((tab) => {
                const d = getRightPanelTabDef(tab)!;
                return (
                  <button
                    key={tab}
                    id={`rpt-${tab}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === active}
                    aria-controls="rp-pane"
                    tabIndex={tab === active ? 0 : -1}
                    onClick={() => panel.setTab(tab)}
                  >
                    <span>{t(d.labelKey)}</span>
                    {d.count ? <TabCount def={d} /> : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        <div
          className="sh-rp-pane"
          id="rp-pane"
          role={active !== "ai" ? "tabpanel" : undefined}
          aria-labelledby={active !== "ai" ? `rpt-${active}` : undefined}
          tabIndex={0}
        >
          {def ? <TabPane key={active} def={def} /> : null}
        </div>
      </div>
    </aside>
  );
}

function TabCount({ def }: { def: RightPanelTabDef }) {
  const n = def.count?.() ?? null;
  return n === null ? null : <em>{n}</em>;
}

function TabPane({ def }: { def: RightPanelTabDef }) {
  return <>{def.render()}</>;
}
