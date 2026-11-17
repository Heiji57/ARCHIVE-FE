import type { ReactNode } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { AppLogo } from "@/shared/ui";
import { ICON_STROKE } from "@/shared/ui/icons";
import { useShell } from "../model/shellSlots";
import { UserMenu } from "./UserMenu";

/**
 * 왼쪽 사이드바. 위에 로고와 접기 버튼, 가운데 페이지 내용(슬롯), 아래 사용자 메뉴.
 * 접으면(시안 사이드바 4번) 52px 아이콘 레일: 로고(펼치기), 펼치기 버튼, 사용자 메뉴.
 */
export function Sidebar({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const { collapsed, toggleSidebar } = useShell();
  return (
    <aside className="sh-side" aria-label={t("shell.side.label")}>
      <nav className="sh-rl" aria-label={t("shell.side.rail")}>
        <button
          type="button"
          className="sh-rl-ws"
          onClick={toggleSidebar}
          aria-label={t("shell.side.expand")}
          title={t("shell.side.expandTitle")}
          aria-expanded={!collapsed}
        >
          <AppLogo size={20} />
        </button>
        <span className="sh-grow" />
        <button
          type="button"
          className="sh-ibtn"
          onClick={toggleSidebar}
          aria-label={t("shell.side.expand")}
          title={t("shell.side.expandTitle")}
        >
          <ChevronsRight size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
        <UserMenu compact />
      </nav>
      <div className="sh-ws">
        <AppLogo size={20} className="sh-ws-m" />
        <span className="sh-ws-w">{t("nav.brand")}</span>
        <button
          type="button"
          className="sh-ibtn sh-ws-c"
          onClick={toggleSidebar}
          aria-label={t("shell.side.collapse")}
          title={t("shell.side.collapseTitle")}
          aria-expanded={!collapsed}
        >
          <ChevronsLeft size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </div>
      <div className="sh-side-in">{children}</div>
      <div className="sh-foot">
        <UserMenu />
      </div>
    </aside>
  );
}
