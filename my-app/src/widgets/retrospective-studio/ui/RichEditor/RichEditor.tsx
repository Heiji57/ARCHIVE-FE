import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
// 타입 등록 유지
import "@tiptap/extension-table";
import {
  SlashCommandExtension,
  detectSlashQuery,
} from "./extensions/SlashCommand";
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
  from: number;
  to: number;
}

const EMPTY_POPUP: PopupState = {
  open: false,
  rect: null,
  query: "",
  from: 0,
  to: 0,
};

export default function RichEditor({
  value,
  placeholder,
  onChange,
}: RichEditorProps) {
  const [popup, setPopup] = useState<PopupState>(EMPTY_POPUP);
  const popupOpenRef = useRef(false);
  const menuRef = useRef<SlashMenuRef | null>(null);
  popupOpenRef.current = popup.open;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "내용을 입력하거나 / 를 눌러 블록 선택...",
      }),
      SlashCommandExtension.configure({
        onEscape: () => {
          if (popupOpenRef.current) {
            setPopup(EMPTY_POPUP);
            return true;
          }
          return false;
        },
        onArrowDown: () =>
          popupOpenRef.current &&
          !!menuRef.current?.onKeyDown({
            event: new KeyboardEvent("keydown", { key: "ArrowDown" }),
          }),
        onArrowUp: () =>
          popupOpenRef.current &&
          !!menuRef.current?.onKeyDown({
            event: new KeyboardEvent("keydown", { key: "ArrowUp" }),
          }),
        onEnter: () =>
          popupOpenRef.current &&
          !!menuRef.current?.onKeyDown({
            event: new KeyboardEvent("keydown", { key: "Enter" }),
          }),
      }),
    ],
    content: markdownToHtml(value),
    autofocus: false,
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdown(ed.getHTML()));
    },
  });

  // editor 변경 사항 + 선택 변경 시 슬래시 쿼리 감지
  useEffect(() => {
    if (!editor) return;

    const updatePopup = () => {
      const result = detectSlashQuery(editor);
      if (!result.active) {
        setPopup(EMPTY_POPUP);
        return;
      }
      // popup이 이미 열려있으면 query만 갱신, 아니면 위치 다시 계산
      const coords = editor.view.coordsAtPos(result.from);
      const rect = new DOMRect(
        coords.left,
        coords.top,
        0,
        coords.bottom - coords.top,
      );
      setPopup({
        open: true,
        rect,
        query: result.query,
        from: result.from,
        to: result.to,
      });
    };

    editor.on("transaction", updatePopup);
    editor.on("selectionUpdate", updatePopup);
    return () => {
      editor.off("transaction", updatePopup);
      editor.off("selectionUpdate", updatePopup);
    };
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

  const handleSelect = (item: SlashCommandItem) => {
    if (!editor) return;
    item.execute(editor, { from: popup.from, to: popup.to });
    setPopup(EMPTY_POPUP);
    editor.commands.focus();
  };

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
