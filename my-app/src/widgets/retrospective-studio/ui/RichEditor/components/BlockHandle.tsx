import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Copy,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Lightbulb,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Trash2,
  Type,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

/**
 * Notion 스타일 블록 핸들.
 *
 *  ⊕   클릭: 그 블록 다음에 새 빈 단락 추가
 *  ⋮⋮  클릭: 그 블록을 NodeSelection으로 선택 + 메뉴 표시
 *
 * NodeSelection 상태에서:
 *  - Del/Backspace → 자동 삭제 (ProseMirror 기본)
 *  - Ctrl+C / Ctrl+V → 자동 복사/붙여넣기
 *
 * 메뉴: 전환(타입 변경) / 복제 / 삭제
 */

interface TurnIntoOption {
  id: string;
  label: string;
  icon: typeof Type;
  apply: (editor: Editor, pos: number) => void;
}

const TURN_INTO_OPTIONS: TurnIntoOption[] = [
  {
    id: "p",
    label: "본문",
    icon: Type,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).setNode("paragraph").run(),
  },
  {
    id: "h1",
    label: "제목 1",
    icon: Heading1,
    apply: (e, pos) =>
      e
        .chain()
        .focus()
        .setNodeSelection(pos)
        .setNode("heading", { level: 1 })
        .run(),
  },
  {
    id: "h2",
    label: "제목 2",
    icon: Heading2,
    apply: (e, pos) =>
      e
        .chain()
        .focus()
        .setNodeSelection(pos)
        .setNode("heading", { level: 2 })
        .run(),
  },
  {
    id: "h3",
    label: "제목 3",
    icon: Heading3,
    apply: (e, pos) =>
      e
        .chain()
        .focus()
        .setNodeSelection(pos)
        .setNode("heading", { level: 3 })
        .run(),
  },
  {
    id: "bullet",
    label: "글머리 기호",
    icon: List,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).toggleBulletList().run(),
  },
  {
    id: "ol",
    label: "번호 매기기",
    icon: ListOrdered,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).toggleOrderedList().run(),
  },
  {
    id: "quote",
    label: "인용",
    icon: Quote,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).toggleBlockquote().run(),
  },
  {
    id: "callout",
    label: "콜아웃",
    icon: Lightbulb,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).setCallout({ type: "NOTE" }).run(),
  },
];

export function BlockHandle({ editor }: { editor: Editor }) {
  const [hover, setHover] = useState<{
    pos: number;
    rect: DOMRect;
    blockEl: HTMLElement;
    isTable: boolean;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [turnIntoOpen, setTurnIntoOpen] = useState(false);
  const hoverRef = useRef(hover);
  hoverRef.current = hover;
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

  // debounced hide — 핸들/메뉴/블록 사이의 짧은 갭을 견디게
  const hideTimerRef = useRef<number | null>(null);
  const cancelHide = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const scheduleHide = (ms = 200) => {
    cancelHide();
    if (menuOpenRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      setHover(null);
      hideTimerRef.current = null;
    }, ms);
  };

  useEffect(() => {
    const editorDom = editor.view.dom;
    if (!editorDom) return;

    const findTopLevelBlock = (el: HTMLElement): HTMLElement | null => {
      let cur: HTMLElement | null = el;
      while (cur && cur.parentElement !== editorDom) {
        cur = cur.parentElement;
      }
      return cur;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (menuOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".rich-block-handle, .rich-block-menu")) {
        cancelHide();
        return;
      }
      // 표 사이드 핸들 영역은 무시 (TableControls가 처리)
      if (target.closest(".rich-table-handle")) return;
      if (!editorDom.contains(target)) {
        scheduleHide();
        return;
      }
      const block = findTopLevelBlock(target);
      if (!block) {
        scheduleHide();
        return;
      }
      cancelHide();
      const rect = block.getBoundingClientRect();
      const pos = editor.view.posAtDOM(block, 0);
      if (pos < 0) {
        setHover(null);
        return;
      }
      const isTable = block.tagName === "TABLE";
      const prev = hoverRef.current;
      if (
        prev &&
        prev.blockEl === block &&
        prev.rect.top === rect.top &&
        prev.rect.left === rect.left
      ) {
        return;
      }
      setHover({ pos, rect, blockEl: block, isTable });
    };

    const onScrollOrResize = () => {
      const h = hoverRef.current;
      if (!h) return;
      setHover({ ...h, rect: h.blockEl.getBoundingClientRect() });
    };

    const onContainerLeave = (e: MouseEvent) => {
      if (menuOpenRef.current) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.(".rich-block-handle, .rich-block-menu")) {
        cancelHide();
        return;
      }
      scheduleHide();
    };

    editorDom.addEventListener("mousemove", onMouseMove);
    editorDom.addEventListener("mouseleave", onContainerLeave);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      editorDom.removeEventListener("mousemove", onMouseMove);
      editorDom.removeEventListener("mouseleave", onContainerLeave);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [editor]);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(".rich-block-menu, .rich-block-handle")) return;
      setMenuOpen(false);
      setTurnIntoOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  if (!hover) return null;

  const openMenu = () => {
    // 블록을 NodeSelection으로 선택 → Del/Ctrl+C/Ctrl+V 자동 동작
    try {
      editor.chain().focus().setNodeSelection(hover.pos).run();
    } catch {
      /* noop */
    }
    setMenuOpen((v) => !v);
    setTurnIntoOpen(false);
  };

  const insertAfter = () => {
    try {
      const blockNode = editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const endPos = hover.pos + blockNode.nodeSize;
      editor
        .chain()
        .focus()
        .insertContentAt(endPos, { type: "paragraph" })
        .setTextSelection(endPos + 1)
        .run();
    } catch {
      editor.chain().focus().createParagraphNear().run();
    }
    setMenuOpen(false);
  };

  const deleteBlock = () => {
    try {
      const blockNode = editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const endPos = hover.pos + blockNode.nodeSize;
      editor.chain().focus().deleteRange({ from: hover.pos, to: endPos }).run();
    } catch {
      /* noop */
    }
    setMenuOpen(false);
    setHover(null);
  };

  const duplicateBlock = () => {
    try {
      const blockNode = editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const endPos = hover.pos + blockNode.nodeSize;
      const json = blockNode.toJSON();
      editor.chain().focus().insertContentAt(endPos, json).run();
    } catch {
      /* noop */
    }
    setMenuOpen(false);
  };

  const turnInto = (option: TurnIntoOption) => {
    try {
      option.apply(editor, hover.pos);
    } catch {
      /* noop */
    }
    setMenuOpen(false);
    setTurnIntoOpen(false);
  };

  const HANDLE_SIZE = 22;
  // padding-left 58px 안에 두 핸들(22+2+22=46)이 들어가도록 배치
  // → 블록 영역 내부에 위치하므로 마우스가 핸들로 가는 길에 hover 안 풀림
  const left = hover.rect.left - 50;
  const top = hover.rect.top + 4;

  return (
    <>
      <button
        type="button"
        className="rich-block-handle rich-block-handle-add"
        style={{
          position: "fixed",
          left,
          top,
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={() => scheduleHide()}
        onClick={insertAfter}
        title="아래에 블록 추가"
      >
        <Plus size={14} />
      </button>

      <button
        type="button"
        className="rich-block-handle rich-block-handle-menu"
        style={{
          position: "fixed",
          left: left + HANDLE_SIZE + 2,
          top,
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={() => scheduleHide()}
        onClick={openMenu}
        title="블록 선택 + 메뉴"
      >
        <GripVertical size={14} />
      </button>

      {menuOpen ? (
        <div
          className="rich-block-menu"
          style={{
            position: "fixed",
            left: left + HANDLE_SIZE * 2 + 6,
            top,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={cancelHide}
          onMouseLeave={() => scheduleHide()}
        >
          {/* 전환 (sub-menu) */}
          <button
            type="button"
            className="rich-block-menu-item rich-block-menu-item-with-arrow"
            onClick={() => setTurnIntoOpen((v) => !v)}
          >
            <Type size={13} />
            <span>전환</span>
            <ChevronRight size={12} className="rich-block-menu-arrow" />
          </button>
          {turnIntoOpen ? (
            <div className="rich-block-menu rich-block-menu-sub">
              {TURN_INTO_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="rich-block-menu-item"
                    onClick={() => turnInto(opt)}
                  >
                    <Icon size={13} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            className="rich-block-menu-item"
            onClick={duplicateBlock}
          >
            <Copy size={13} />
            <span>복제 <kbd className="rich-block-kbd">Ctrl+D</kbd></span>
          </button>
          <button
            type="button"
            className="rich-block-menu-item rich-block-menu-item-danger"
            onClick={deleteBlock}
          >
            <Trash2 size={13} />
            <span>삭제 <kbd className="rich-block-kbd">Del</kbd></span>
          </button>
          <div className="rich-block-menu-divider" />
          <div className="rich-block-menu-hint">
            <Minus size={10} /> 색 지정은 곧 추가 예정
          </div>
        </div>
      ) : null}
    </>
  );
}
