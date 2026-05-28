import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
// 타입 등록만을 위한 import (실제 사용은 안 함 — 진단 단계)
import "@tiptap/extension-table";
import { markdownToHtml, htmlToMarkdown } from "./markdown";

export interface RichEditorProps {
  value: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
}

/**
 * 진단용 최소 에디터 — StarterKit + Placeholder 만.
 * 베이스가 동작하면 커스텀 확장들을 하나씩 다시 추가.
 */
export default function RichEditor({
  value,
  placeholder,
  onChange,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "내용을 입력하세요...",
      }),
    ],
    content: markdownToHtml(value),
    autofocus: false,
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdown(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd !== value) {
      editor.commands.setContent(markdownToHtml(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  );
}
