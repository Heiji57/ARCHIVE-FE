import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronsUpDown, Keyboard, LogIn, LogOut, User, X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE, SettingsIcon } from "@/shared/ui/icons";
import { useSettingsSheet } from "../model/settingsSheet";
import { useShell } from "../model/shellSlots";

/**
 * 사이드바 아래 사용자 메뉴(시안 usermenu.js). 누르면 위로 메뉴가 열린다.
 * 항목: 이름과 로그인 계정(설정의 계정), 설정(Ctrl ,), 단축키(?), 로그아웃(확인 한 번).
 * compact 는 접힌 레일의 아바타 버튼.
 */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { state, logout } = useArchiveApp();
  const { t } = useTranslation();
  const sheet = useSettingsSheet();
  const { openKeys } = useShell();
  const [open, setOpen] = useState(false);
  const [bye, setBye] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const user = state.currentUser;
  const name = user?.displayName || t("shell.um.guest");
  const sub = user?.email ?? t("shell.um.guestSub");
  // 데모(로그인 전)는 글자 대신 사람 아이콘
  const initial = user ? (user.displayName?.[0] ?? user.email[0] ?? "?").toUpperCase() : (
    <User size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
  );

  const close = (focusBack = true) => {
    setOpen(false);
    setBye(false);
    if (focusBack) btn.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    setPos({ left: Math.max(8, r.left), bottom: window.innerHeight - r.top + 6 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [open, bye, pos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (menu.current?.contains(el) || btn.current?.contains(el)) return;
      setOpen(false);
      setBye(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (bye) setBye(false);
        else close();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [...(menu.current?.querySelectorAll<HTMLElement>("button") ?? [])];
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    };
    const onResize = () => close(false);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, bye]);

  const go = (fn: () => void) => {
    close(false);
    fn();
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={compact ? "sh-av-btn" : "um-btn"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("shell.um.open", { name })}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <span className="sh-av" aria-hidden="true">
          {initial}
        </span>
        {compact ? null : (
          <>
            <span className="um-who">
              <b>{name}</b>
            </span>
            <ChevronsUpDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </>
        )}
      </button>
      {open && pos ? (
        <div className="um-layer" style={{ ["--um-x" as string]: `${pos.left}px`, ["--um-y" as string]: `${pos.bottom}px` }}>
          {bye ? (
            <div ref={menu} className="um-menu um-bye" role="alertdialog" aria-label={t("shell.um.bye.label")}>
              <p>
                <b>{t("shell.um.bye.title")}</b>
                <span>{t("shell.um.bye.body")}</span>
              </p>
              <div className="um-ft">
                <button type="button" className="um-b" onClick={() => setBye(false)}>
                  {t("shell.um.bye.cancel")}
                </button>
                <button type="button" className="um-b p" onClick={() => go(logout)}>
                  {t("shell.um.bye.confirm")}
                </button>
              </div>
            </div>
          ) : (
            <div ref={menu} className="um-menu" role="menu" aria-label={t("shell.um.label")}>
              <button type="button" role="menuitem" className="um-me" onClick={() => go(() => sheet.open("account"))}>
                <span className="sh-av um-av" aria-hidden="true">
                  {initial}
                </span>
                <span>
                  <b>{name}</b>
                  <small>{sub}</small>
                </span>
              </button>
              <hr />
              <button type="button" role="menuitem" onClick={() => go(() => sheet.open())}>
                <SettingsIcon size={15} aria-hidden="true" />
                <span>{t("shell.um.settings")}</span>
                <kbd>Ctrl ,</kbd>
              </button>
              <button type="button" role="menuitem" onClick={() => go(openKeys)}>
                <Keyboard size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span>{t("shell.um.keys")}</span>
                <kbd>?</kbd>
              </button>
              <hr />
              {user ? (
                <button type="button" role="menuitem" onClick={() => setBye(true)}>
                  <LogOut size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span>{t("shell.um.logout")}</span>
                </button>
              ) : (
                <a role="menuitem" className="um-a" href="/login">
                  <LogIn size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span>{t("shell.um.login")}</span>
                </a>
              )}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

const KEYS: Array<{ keys: string[]; label: "shell.keys.palette" | "shell.keys.settings" | "shell.keys.keys" | "shell.keys.sidebar" | "shell.keys.close" }> = [
  { keys: ["Ctrl", "K"], label: "shell.keys.palette" },
  { keys: ["Ctrl", ","], label: "shell.keys.settings" },
  { keys: ["?"], label: "shell.keys.keys" },
  { keys: ["["], label: "shell.keys.sidebar" },
  { keys: ["Esc"], label: "shell.keys.close" },
];

/** 단축키 창(사용자 메뉴의 "단축키", ? 키). */
export function KeysDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="um-keys"
      aria-labelledby="um-keys-h"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="um-kh">
        <b id="um-keys-h">{t("shell.keys.title")}</b>
        <button type="button" className="um-ib" aria-label={t("shell.close")} onClick={onClose} autoFocus>
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <dl>
        {KEYS.map((k) => (
          <div key={k.label}>
            <dt>{t(k.label)}</dt>
            <dd>
              {k.keys.map((x) => (
                <kbd key={x}>{x}</kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
