import { useEffect, useRef } from "react";
import type { ArchiveAppContextValue } from "@/app/model/types";
import type { Todo } from "@/entities/todo/model/types";
import type { SettingsSection } from "@/shared/config/settingsSections";
import type { EditorCalendar } from "./calendars";

/** 할 일 모달과 새 할 일 창이 같이 쓰는 것(TodoEditorProvider 가 만든다). */
export interface EditorEnv {
  calendars: EditorCalendar[];
  calendarIdOf(todo: Todo): string;
  setCalendar(todoId: string, calendarId: string): void;
  /** 설정 시트 열기(Google 캘린더 연결). 없으면 그 메뉴 항목을 숨긴다. */
  openSettings?: (section: SettingsSection) => void;
  /** 새 할 일이 목록에 들어온 뒤(서버 id 발급 후) 이어서 할 일. 그때의 최신 앱 액션을 받는다. */
  afterCreate(id: string, run: (app: ArchiveAppContextValue) => void): void;
}

/**
 * 닫힌 <dialog> 를 모달로 열고 focusSel 에 포커스, 닫힐 때 연 자리로 포커스를 돌려준다.
 * StrictMode 에서 effect 가 두 번 돌아도 이미 열려 있으면 다시 열지 않는다.
 */
export function useModalDialog(focusSel: string) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const back = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    d.querySelector<HTMLElement>(focusSel)?.focus();
    return () => {
      if (back?.isConnected) back.focus();
    };
    // 처음 열 때 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
