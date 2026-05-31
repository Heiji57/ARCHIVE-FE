import { useRef } from "react";
import { EditorContent } from "@tiptap/react";
import { useRichEditorInstance } from "../model/useRichEditorInstance";
import { useSlashPopup } from "../model/useSlashPopup";
import { BlockHandle } from "./block-handle/BlockHandle";
import { CalloutTypePicker } from "./CalloutTypePicker";
import { DragSelectOverlay, useDragSelect } from "./drag-select";
import { SlashMenuPortal } from "./SlashMenuPortal";
import { TableControls } from "./table-controls/TableControls";

export interface RichEditorProps {
  value: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
}

/**
 * 노션 스타일 WYSIWYG 마크다운 에디터.
 *  - 에디터 인스턴스/슬래시 로직은 model 훅에 위임하고, 여기서는 조합만 담당.
 */
export default function RichEditor({
  value,
  placeholder,
  onChange,
}: RichEditorProps) {
  const editor = useRichEditorInstance({ value, placeholder, onChange });
  const { popup, menuRef, items, handleSelect } = useSlashPopup(editor);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const marquee = useDragSelect(editor, containerRef);

  if (!editor) return null;

  return (
    <div className="rich-editor" ref={containerRef}>
      <EditorContent editor={editor} className="rich-editor-content" />
      <BlockHandle editor={editor} />
      <TableControls editor={editor} />
      <CalloutTypePicker editor={editor} />
      <DragSelectOverlay rect={marquee} />
      {popup.open && popup.rect ? (
        <SlashMenuPortal
          rect={popup.rect}
          items={items}
          onSelect={handleSelect}
          menuRef={menuRef}
        />
      ) : null}
    </div>
  );
}
