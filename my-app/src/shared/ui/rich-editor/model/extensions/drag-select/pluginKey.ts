import { PluginKey } from "@tiptap/pm/state";

/**
 * 드래그 범위(블록) 선택 플러그인 키.
 * 별도 plugin state는 두지 않고 — 데코레이션/하이라이트는 현재 선택(selection)에서
 * 파생하고, 드래그 진행 상태만 플러그인 클로저에서 관리한다.
 */
export const dragSelectPluginKey = new PluginKey("dragSelect");

/** 블록 선택 시 블록 DOM에 부여되는 클래스 */
export const BLOCK_SELECTED_CLASS = "rich-block-selected";

/** 블록 선택 중 에디터 루트에 부여되는 클래스 (네이티브 ::selection 숨김용) */
export const BLOCK_SELECTING_CLASS = "rich-block-selecting";
