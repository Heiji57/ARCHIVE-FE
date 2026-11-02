import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { useTranslation } from "@/shared/lib/i18n";

/**
 * 토글 컨테이너의 React NodeView.
 *  - 좌측 화살표 버튼(클릭=open 토글) + 편집 가능한 자식 영역.
 */
export function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const { t } = useTranslation();
  const open = node.attrs.open as boolean;
  return (
    <NodeViewWrapper
      as="div"
      className="rich-toggle"
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        className="rich-toggle-arrow"
        contentEditable={false}
        suppressContentEditableWarning
        onMouseDown={(e) => {
          // ProseMirror가 selection 이동 안 시키게
          e.preventDefault();
          e.stopPropagation();
          updateAttributes({ open: !open });
        }}
        aria-label={open ? t("editor.toggle.close") : t("editor.toggle.open")}
      >
        ▶
      </button>
      <NodeViewContent as="div" className="rich-toggle-children" />
    </NodeViewWrapper>
  );
}
