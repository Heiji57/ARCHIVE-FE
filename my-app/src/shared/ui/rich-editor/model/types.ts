import type { Editor, Range } from "@tiptap/core";

/**
 * 리치 에디터 공용 타입 정의.
 * - 슬래시 커맨드 / 콜아웃 / 슬래시 팝업 상태를 한곳에서 관리.
 */

/** 콜아웃 타입 (GitHub Alert 호환) */
export type CalloutType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

/**
 * 슬래시 커맨드 정의.
 * - keywords: 다국어 검색용 별칭 (한국어/영어/일부 일본어/중국어)
 * - icon: lucide 아이콘 이름 (UI에서 동적 import)
 * - execute: 에디터 명령
 */
export interface SlashCommandItem {
  id: string;
  /** 한국어 표시명 */
  titleKo: string;
  /** 영어 표시명 */
  titleEn: string;
  /** 한 줄 설명 (한국어) */
  descKo: string;
  descEn: string;
  /** 검색용 키워드 (다국어, 소문자 권장) */
  keywords: string[];
  /** 카테고리 — 메뉴 그룹핑용 */
  category: "heading" | "list" | "block" | "media";
  /** lucide 아이콘 이름 */
  icon: string;
  /** 명령 실행 */
  execute: (editor: Editor, range: Range) => void;
}

/** 슬래시 메뉴 컴포넌트의 imperative 핸들 */
export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/** 슬래시 메뉴 팝업 상태 */
export interface PopupState {
  open: boolean;
  rect: DOMRect | null;
  query: string;
  from: number;
  to: number;
}

export const EMPTY_POPUP: PopupState = {
  open: false,
  rect: null,
  query: "",
  from: 0,
  to: 0,
};
