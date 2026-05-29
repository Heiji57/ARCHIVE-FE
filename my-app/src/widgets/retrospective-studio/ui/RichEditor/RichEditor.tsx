import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  SlashCommandExtension,
  detectSlashQuery,
} from "./extensions/SlashCommand";
import { Callout } from "./extensions/Callout";
import {
  ToggleBody,
  ToggleNode,
  ToggleSummary,
} from "./extensions/Toggle";
import { SlashMenu, type SlashMenuRef } from "./components/SlashMenu";
import { TableControls } from "./components/TableControls";
import { CalloutTypePicker } from "./components/CalloutTypePicker";
import { BlockHandle } from "./components/BlockHandle";
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
  const menuRef = useRef<SlashMenuRef | null>(null);
  // popup 상태를 키 핸들러에서 참조하기 위한 ref
  const popupOpenRef = useRef(false);
  popupOpenRef.current = popup.open;

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
    ],
    content: markdownToHtml(value),
    autofocus: false,
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdown(ed.getHTML()));
    },
  });

  // 슬래시 쿼리 감지 — transaction/selectionUpdate에서 popup 갱신
  useEffect(() => {
    if (!editor) return;

    const updatePopup = () => {
      const result = detectSlashQuery(editor);
      if (!result.active) {
        setPopup((prev) => (prev.open ? EMPTY_POPUP : prev));
        return;
      }
      const coords = editor.view.coordsAtPos(result.from);
      setPopup((prev) => {
        // 같은 슬래시 시작 위치면 rect 유지 + query/to만 갱신
        // → SlashMenuPortal의 위치 재계산 useEffect가 안 돌아 깜빡임 제거
        if (
          prev.open &&
          prev.from === result.from &&
          prev.rect &&
          prev.rect.left === coords.left &&
          prev.rect.top === coords.top
        ) {
          if (prev.query === result.query && prev.to === result.to) {
            return prev;
          }
          return { ...prev, query: result.query, to: result.to };
        }
        return {
          open: true,
          rect: new DOMRect(
            coords.left,
            coords.top,
            0,
            coords.bottom - coords.top,
          ),
          query: result.query,
          from: result.from,
          to: result.to,
        };
      });
    };

    editor.on("transaction", updatePopup);
    editor.on("selectionUpdate", updatePopup);
    return () => {
      editor.off("transaction", updatePopup);
      editor.off("selectionUpdate", updatePopup);
    };
  }, [editor]);

  // popup이 열려있을 때만 키보드 가로채기 (document 레벨)
  useEffect(() => {
    if (!popup.open) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // 에디터 영역 안에서만 가로채기
      if (!target?.closest(".rich-editor")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setPopup(EMPTY_POPUP);
        return;
      }
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter"
      ) {
        if (menuRef.current?.onKeyDown({ event })) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      // spacebar — 메뉴 열려있으면 첫 항목(또는 선택된 항목) 실행 후 닫기
      if (event.key === " " || event.code === "Space") {
        const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
        if (menuRef.current?.onKeyDown({ event: enterEvent })) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [popup.open]);

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
      <BlockHandle editor={editor} />
      <TableControls editor={editor} />
      <CalloutTypePicker editor={editor} />
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

  // rect 의존성 — 좌표값만 안정화하여 동일 위치면 effect skip
  const rectLeft = rect.left;
  const rectTop = rect.top;
  const rectBottom = rect.bottom;

  useEffect(() => {
    if (!popupRef.current) return;
    const popupRect = popupRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = rectBottom + 8;
    let left = rectLeft;
    if (top + popupRect.height > vh) {
      top = Math.max(8, rectTop - popupRect.height - 8);
    }
    if (left + popupRect.width > vw) {
      left = Math.max(8, vw - popupRect.width - 8);
    }
    setPos((prev) =>
      prev.top === top && prev.left === left ? prev : { top, left },
    );
  }, [rectLeft, rectTop, rectBottom]);

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
