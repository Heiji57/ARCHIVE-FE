import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppRoute } from "@/app/model/types";
import { getSettingsSectionFromHash, type RetroRouteParams } from "@/app/router/navigation";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { GlobalSearch, useRegisterPaletteCommand } from "@/widgets/global-search";
import { NotificationPanel } from "@/widgets/notifications";
import { RightPanelCtx, type RightPanelApi, type RightPanelTab } from "../model/rightPanel";
import { SettingsSheetCtx, type SettingsSheetApi } from "../model/settingsSheet";
import { ShellCtx, type ShellState } from "../model/shellSlots";
import { PetSlot } from "./PetSlot";
import { SettingsSheetHost } from "./SettingsSheetHost";
import { KeysDialog } from "./UserMenu";

interface AppShellProps {
  route: AppRoute;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
  onRetroNavigate: (params: RetroRouteParams) => void;
}

const LS_SIDE = "archive.shell.collapsed";
const LS_RP = "archive.shell.rp";
const NARROW = "(max-width: 1000px)";

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* 저장 못 해도 화면은 그대로 */
  }
}

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * 앱 셸. 셸 상태(사이드바 접기, 오른쪽 패널, 설정 시트, 팔레트, 알림, 단축키 창)를 내려 주고
 * 전역 단축키(Ctrl+K, Ctrl+, , ?, [)를 받는다. 화면 배치는 각 페이지가 그리는 ShellPage 가 한다.
 */
export function AppShell({ route, children, onNavigate, onRetroNavigate }: AppShellProps) {
  const narrow = useNarrow();
  const shellRoute: AppRoute = route === "dashboard" || route === "settings" ? "calendar" : route;

  // ---------- 사이드바 ----------
  const [collapsed, setCollapsed] = useState(() => readLS(LS_SIDE) === "1");
  const toggleSidebar = useCallback(() => {
    setCollapsed((v) => {
      writeLS(LS_SIDE, v ? "0" : "1");
      return !v;
    });
  }, []);

  // ---------- 오른쪽 패널 ----------
  // 넓은 화면은 기본으로 열려 있고(기억함), 좁은 화면(1000px 이하)은 겹쳐 열리므로 기본으로 닫는다.
  const [rp, setRp] = useState<{ open: boolean; tab: RightPanelTab }>(() => {
    const saved = readLS(LS_RP);
    const [o, tab] = saved ? saved.split(":") : ["1", "day"];
    return { open: o !== "0", tab: (tab as RightPanelTab) || "day" };
  });
  const [narrowOpen, setNarrowOpen] = useState(false);
  const panelOpen = narrow ? narrowOpen : rp.open;
  const setPanel = useCallback(
    (open: boolean, tab?: RightPanelTab) => {
      if (narrow) setNarrowOpen(open);
      setRp((cur) => {
        const next = { open: narrow ? cur.open : open, tab: tab ?? cur.tab };
        writeLS(LS_RP, `${next.open ? 1 : 0}:${next.tab}`);
        return next;
      });
    },
    [narrow],
  );
  const rightPanel = useMemo<RightPanelApi>(
    () => ({
      open: panelOpen,
      tab: rp.tab,
      setTab: (t) => setPanel(true, t),
      toggle: (t) => {
        if (!t) setPanel(!panelOpen);
        else if (panelOpen && rp.tab === t) setPanel(false);
        else setPanel(true, t);
      },
      close: () => setPanel(false),
    }),
    [panelOpen, rp.tab, setPanel],
  );

  // ---------- 설정 시트 ----------
  const [section, setSection] = useState<SettingsSection | null>(null);
  const sheetBack = useRef<HTMLElement | null>(null);
  const closeSheet = useCallback(() => {
    setSection(null);
    if (route === "settings") onNavigate("calendar");
    sheetBack.current?.focus?.();
  }, [route, onNavigate]);
  const settingsSheet = useMemo<SettingsSheetApi>(
    () => ({
      open: (s) => {
        setSection((cur) => {
          if (!cur) sheetBack.current = document.activeElement as HTMLElement | null;
          return s ?? "account";
        });
      },
      close: closeSheet,
      section,
    }),
    [section, closeSheet],
  );
  // /settings#<section> 으로 들어오면 캘린더 위에 시트를 연다(경로 호환).
  useEffect(() => {
    if (route !== "settings") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 주소가 바뀔 때 한 번 맞춘다
    setSection(getSettingsSectionFromHash(window.location.hash));
  }, [route]);

  // ---------- 팔레트, 알림, 단축키 ----------
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const closeNotifications = useCallback(() => {
    setNotifOpen(false);
    document.querySelector<HTMLElement>("[data-ntrig]")?.focus();
  }, []);

  const shell = useMemo<ShellState>(
    () => ({
      route: shellRoute,
      navigate: onNavigate,
      navigateRetro: onRetroNavigate,
      collapsed,
      toggleSidebar,
      openPalette: () => setPaletteOpen(true),
      openNotifications: () => setNotifOpen(true),
      closeNotifications,
      notificationsOpen: notifOpen,
      openKeys: () => setKeysOpen(true),
    }),
    [shellRoute, onNavigate, onRetroNavigate, collapsed, toggleSidebar, closeNotifications, notifOpen],
  );

  useRegisterPaletteCommand({
    id: "settings",
    labelKey: "shell.cp.cmd.settings",
    hint: "Ctrl ,",
    order: 70,
    run: () => settingsSheet.open(),
  });

  // 화면을 옮기면 알림 패널은 닫는다(회고, AI 에는 알림이 없다).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 화면 전환에 맞춰 닫기
    setNotifOpen(false);
  }, [shellRoute]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        settingsSheet.open();
        return;
      }
      if (mod || e.altKey || isTyping(e.target) || document.querySelector("dialog[open]")) return;
      if (e.key === "?") {
        setKeysOpen(true);
      } else if (e.key === "[") {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsSheet, toggleSidebar]);

  return (
    <ShellCtx.Provider value={shell}>
      <RightPanelCtx.Provider value={rightPanel}>
        <SettingsSheetCtx.Provider value={settingsSheet}>
          {children}
          <NotificationPanel open={notifOpen} onClose={closeNotifications} />
          <GlobalSearch open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={onNavigate} />
          <SettingsSheetHost />
          <KeysDialog open={keysOpen} onClose={() => setKeysOpen(false)} />
          <PetSlot />
        </SettingsSheetCtx.Provider>
      </RightPanelCtx.Provider>
    </ShellCtx.Provider>
  );
}
