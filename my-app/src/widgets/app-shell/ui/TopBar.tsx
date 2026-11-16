import type { ReactNode } from "react";
import { Search } from "lucide-react";
import type { AppRoute } from "@/app/model/types";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { useShell } from "../model/shellSlots";

const TABS: Array<{ route: AppRoute; labelKey: TranslationKey }> = [
  { route: "ai", labelKey: "shell.tab.ai" },
  { route: "calendar", labelKey: "shell.tab.calendar" },
  { route: "todos", labelKey: "shell.tab.todos" },
  { route: "retrospectives", labelKey: "shell.tab.retro" },
];

/** 상단 막대: 왼쪽은 페이지 도구 막대(슬롯), 오른쪽은 주 메뉴 탭과 검색 버튼. */
export function TopBar({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const { route, navigate, openPalette } = useShell();
  const aiOn = useServerFeature("ai");
  return (
    <header className="sh-top">
      <div className="sh-toolbar">{children}</div>
      <nav className="sh-tabs" aria-label={t("shell.nav.label")}>
        {TABS.filter((x) => x.route !== "ai" || aiOn).map((x) => (
          <a
            key={x.route}
            href={`${x.route === "calendar" ? "/" : `/${x.route}`}${isDemoMode() ? "?demo=true" : ""}`}
            aria-current={route === x.route ? "page" : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navigate(x.route);
            }}
          >
            {t(x.labelKey)}
          </a>
        ))}
      </nav>
      <button type="button" className="sh-btn sh-search" onClick={openPalette} aria-label={t("shell.search.open")}>
        <Search size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
        <span className="sh-kbd" aria-hidden="true">
          Ctrl K
        </span>
      </button>
    </header>
  );
}
