import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// 타입 등록 유지 (다른 파일에서 사용)
import "@tiptap/extension-table";

export interface RichEditorProps {
  value: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
}

/**
 * 진단 단계 #2: TipTap 베이스만. StarterKit만 사용, marked/placeholder 없음.
 * 이것도 안 되면 React 19 + TipTap v3 호환성 자체에 문제.
 */
export default function RichEditor({
  value,
  onChange,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    autofocus: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  );
}
