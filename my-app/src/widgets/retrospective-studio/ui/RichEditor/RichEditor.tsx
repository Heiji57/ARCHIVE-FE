import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
// 타입 등록 유지
import "@tiptap/extension-table";
import { SlashCommandExtension, slashKey } from "./extensions/SlashCommand";
import { SlashMenu, type SlashMenuRef } from "./components/SlashMenu";
import { filterCommands, type SlashCommandItem } from "./commands";
import { markdownToHtml, htmlToMarkdown } from "./markdown";

export interface RichEditorProps {
  value: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
}

interface PopupState {
  open: boolean;
  rect: DOMRect | null;
  query: string;
}

export default function RichEditor({
  value,
  placeholder,
  onChange,
}: RichEditorProps) {
  const [popup, setPopup] = useState<PopupState>({
    open: false,
    rect: null,
    query: "",
  });
  const editorRef = useRef<Editor | null>(null);
  const slashFromRef = useRef<number>(0);
  const menuRef = useRef<SlashMenuRef | null>(null);

  const closeSlashState = (ed: Editor) => {
    ed.view.dispatch(
      ed.view.state.tr.setMeta(slashKey, { active: false, from: 0, query: "" }),
    );
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "내용을 입력하거나 / 를 눌러 블록 선택...",
      }),
      SlashCommandExtension.configure({
        onOpen: ({ range, clientRect }) => {
          slashFromRef.current = range.from;
          setPopup({ open: true, rect: clientRect, query: "" });
        },
        onQuery: (query) => {
          setPopup((p) => ({ ...p, query }));
        },
        onClose: () => {
          setPopup({ open: false, rect: null, query: "" });
        },
        isActive: () => popup.open,
        onKeyDown: (event) => {
          if (!menuRef.current) return false;
          if (event.key === "Escape") {
            const ed = editorRef.current;
            if (ed) closeSlashState(ed);
            return true;
          }
          return menuRef.current.onKeyDown({ event });
        },
      }),
    ],
    content: markdownToHtml(value),
    autofocus: false,
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdown(ed.getHTML()));
    },
  });

  // editor 참조 저장
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // 외부 value 변경 시 동기화
  useEffect(() => {
    if (!editor) return;
    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd !== value) {
      editor.commands.setContent(markdownToHtml(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // 슬래시 명령 실행 — 슬래시부터 query 끝까지 삭제 후 명령 실행
  const handleSelect = (item: SlashCommandItem) => {
    const ed = editorRef.current;
    if (!ed) return;
    const from = slashFromRef.current;
    const to = ed.state.selection.from;
    item.execute(ed, { from, to });
    closeSlashState(ed);
  };

  // popup 위치 계산
  const items = filterCommands(popup.query);

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <EditorContent editor={editor} className="rich-editor-content" />
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

// ─── Popup portal ───────────────────────────────────────────────────────────

function SlashMenuPortal({
  rect,
  items,
  onSelect,
  menuRef,
}: {
  rect: DOMRect;
  items: SlashCommandItem[];
  onSelect: (item: SlashCommandItem) => void;
  menuRef: React.MutableRefObject<SlashMenuRef | null>;
}) {
  // 화면 밖이면 자동으로 위/왼쪽으로
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: rect.bottom + 8, left: rect.left });

  useEffect(() => {
    if (!popupRef.current) return;
    const popupRect = popupRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = rect.bottom + 8;
    let left = rect.left;
    if (top + popupRect.height > vh) {
      top = Math.max(8, rect.top - popupRect.height - 8);
    }
    if (left + popupRect.width > vw) {
      left = Math.max(8, vw - popupRect.width - 8);
    }
    setPos({ top, left });
  }, [rect]);

  return (
    <div
      ref={popupRef}
      className="slash-menu-popup"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
      }}
    >
      <SlashMenu ref={menuRef} items={items} command={onSelect} />
    </div>
  );
}
