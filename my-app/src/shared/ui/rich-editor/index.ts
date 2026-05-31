/**
 * rich-editor — 노션 스타일 WYSIWYG 마크다운 에디터 (도메인 무관 공용 컴포넌트).
 *
 * 주의: 무거운 RichEditor 컴포넌트(TipTap 번들)는 코드 스플리팅을 위해
 * `lazy(() => import("@/shared/ui/rich-editor/ui/RichEditor"))` 로 직접 지연 로드한다.
 * 이 barrel은 즉시 로드해야 하는 가벼운 API(에러 바운더리·타입·변환 유틸)만 노출한다.
 */
export { EditorErrorBoundary } from "./ui/EditorErrorBoundary";
export type { RichEditorProps } from "./ui/RichEditor";
export { markdownToHtml, htmlToMarkdown } from "./model/markdown";
export type { CalloutType, SlashCommandItem } from "./model/types";
