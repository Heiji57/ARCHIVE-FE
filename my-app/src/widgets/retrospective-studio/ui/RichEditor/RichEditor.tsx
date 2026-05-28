import { useEffect, useRef } from "react";
import { EditorContent, ReactRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { SlashCommandExtension } from "./extensions/SlashCommand";
import { SlashMenu, type SlashMenuRef } from "./components/SlashMenu";
import { TableControls } from "./components/TableControls";
import { markdownToHtml, htmlToMarkdown } from "./markdown";

export interface RichEditorProps {
  value: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
}

interface PopupHandle {
  el: HTMLDivElement;
  update: (rect: DOMRect | null) => void;
  destroy: () => void;
}

function createPopup(): PopupHandle {
  const el = document.createElement("div");
  el.className = "slash-menu-popup";
  el.style.position = "fixed";
  el.style.zIndex = "9999";
  el.style.visibility = "hidden";
  document.body.appendChild(el);

  return {
    el,
    update(rect) {
      if (!rect) {
        el.style.visibility = "hidden";
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      el.style.visibility = "visible";
      const popupRect = el.getBoundingClientRect();
      const margin = 8;
      let top = rect.bottom + margin;
      let left = rect.left;
      if (top + popupRect.height > vh) {
        top = Math.max(margin, rect.top - popupRect.height - margin);
      }
      if (left + popupRect.width > vw) {
        left = Math.max(margin, vw - popupRect.width - margin);
      }
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    },
    destroy() {
      el.remove();
    },
  };
}

export default function RichEditor({
  value,
  placeholder,
  onChange,
}: RichEditorProps) {
  const popupRef = useRef<PopupHandle | null>(null);
  const componentRef = useRef<ReactRenderer<SlashMenuRef> | null>(null);

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
      SlashCommandExtension.configure({
        render: () => ({
          onStart: (props) => {
            popupRef.current = createPopup();
            componentRef.current = new ReactRenderer(SlashMenu, {
              props,
              editor: props.editor,
            });
            popupRef.current.el.appendChild(componentRef.current.element);
            const rect = props.clientRect?.() ?? null;
            popupRef.current.update(rect);
          },
          onUpdate: (props) => {
            componentRef.current?.updateProps(props);
            const rect = props.clientRect?.() ?? null;
            popupRef.current?.update(rect);
          },
          onKeyDown: ({ event }) => {
            if (event.key === "Escape") {
              popupRef.current?.update(null);
              return true;
            }
            return componentRef.current?.ref?.onKeyDown({ event }) ?? false;
          },
          onExit: () => {
            popupRef.current?.destroy();
            popupRef.current = null;
            componentRef.current?.destroy();
            componentRef.current = null;
          },
        }),
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
      <TableControls editor={editor} />
    </div>
  );
}
