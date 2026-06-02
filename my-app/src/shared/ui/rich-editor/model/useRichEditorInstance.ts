import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import {
  Callout,
  DragSelect,
  SlashCommandExtension,
  ToggleBody,
  ToggleNode,
  ToggleSummary,
} from "./extensions";
import { htmlToMarkdown, markdownToHtml } from "./markdown";

interface Options {
  value: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
}

/**
 * TipTap 에디터 인스턴스 생성 + 외부 value 동기화.
 * (확장 등록·콘텐츠 변환 등 에디터 설정 로직을 컴포넌트에서 분리)
 */
export function useRichEditorInstance({ value, placeholder, onChange }: Options) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "내용을 입력하거나 / 를 눌러 블록 선택...",
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "rich-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      ToggleNode,
      ToggleSummary,
      ToggleBody,
      SlashCommandExtension,
      DragSelect,
    ],
    content: markdownToHtml(value),
    autofocus: false,
    // React 19 + lazy 마운트 시 ProseMirror 뷰가 렌더 도중 생성되어
    // 레이아웃 확정 전에 측정/페인트되는 레이스를 피한다(뷰를 effect에서 생성).
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdown(ed.getHTML()));
    },
  });

  // 외부 value 변경 시 동기화
  useEffect(() => {
    if (!editor) return;
    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd !== value) {
      editor.commands.setContent(markdownToHtml(value));
    }
  }, [value, editor]);

  // 마운트 직후 한 프레임 뒤 뷰를 강제로 재렌더 → lazy 로드로 인해
  // "리사이즈/재선택 전까지 안 보이는" 페인트 레이스를 방지.
  useEffect(() => {
    if (!editor) return;
    const raf = requestAnimationFrame(() => {
      if (!editor.isDestroyed) {
        editor.view.dispatch(editor.state.tr); // no-op 트랜잭션 → 뷰 재측정/재페인트
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [editor]);

  return editor;
}
