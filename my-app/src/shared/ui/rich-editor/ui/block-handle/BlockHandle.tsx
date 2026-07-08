import { GripVertical, Plus } from "lucide-react";
import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { BlockMenu } from "./BlockMenu";
import { useBlockHandle } from "./useBlockHandle";

const HANDLE_SIZE = 22;

/**
 * Notion 스타일 블록 핸들.
 *  ⊕   클릭: 그 블록 다음에 새 빈 단락 추가
 *  ⋮⋮  드래그: 블록 위치 이동 / 클릭: 블록 선택 + 메뉴
 */
export function BlockHandle({ editor }: { editor: Editor }) {
  const {
    hover,
    menuOpen,
    turnIntoOpen,
    setTurnIntoOpen,
    cancelHide,
    scheduleHide,
    openMenu,
    insertAfter,
    deleteBlock,
    duplicateBlock,
    turnInto,
  } = useBlockHandle(editor);

  const didDragRef = useRef(false);

  if (!hover) return null;

  // padding-left 58px 안에 두 핸들(22+2+22=46)이 들어가도록 배치
  const left = hover.rect.left - 50;
  const top = hover.rect.top + 4;

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    didDragRef.current = true;
    const { view } = editor;
    try {
      const nodeSelection = NodeSelection.create(view.state.doc, hover.pos);
      const slice = nodeSelection.content();
      const { dom, text } = view.serializeForClipboard(slice);
      e.dataTransfer.clearData();
      e.dataTransfer.setData("text/html", dom.innerHTML);
      e.dataTransfer.setData("text/plain", text);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setDragImage(hover.blockEl, 0, hover.blockEl.offsetHeight / 2);
      // node를 함께 전달해야 drop 핸들러가 node.replace(tr)로 원본을 정확히 삭제함.
      // node 없이 { slice, move: true }만 넘기면 tr.deleteSelection() 폴백 → 복사 버그.
      // node 프로퍼티는 ProseMirror 내부 Dragging 클래스에만 있고 공개 타입에 없음 → 캐스팅.
      // 드래그 시작 이벤트 핸들러에서 ProseMirror 내부 상태를 직접 세팅하는 정당한 명령형
      // 상호작용이라 immutability 규칙을 예외 처리한다.
      // eslint-disable-next-line react-hooks/immutability
      (view as unknown as { dragging: unknown }).dragging = {
        slice,
        move: true,
        node: nodeSelection,
      };
    } catch {
      didDragRef.current = false;
    }
  };

  const handleDragEnd = () => {
    didDragRef.current = false;
    editor.commands.focus();
  };

  // dragstart가 실제로 발생한 경우 click 이벤트는 무시
  const handleClick = () => {
    if (didDragRef.current) return;
    openMenu();
  };

  return (
    <>
      <button
        type="button"
        className="rich-block-handle rich-block-handle-add"
        style={{ position: "fixed", left, top, width: HANDLE_SIZE, height: HANDLE_SIZE }}
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
        draggable
        onMouseEnter={cancelHide}
        onMouseLeave={() => scheduleHide()}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        title="드래그: 블록 이동  /  클릭: 메뉴"
      >
        <GripVertical size={14} />
      </button>

      {menuOpen ? (
        <BlockMenu
          left={left - 6}
          top={top}
          turnIntoOpen={turnIntoOpen}
          onToggleTurnInto={() => setTurnIntoOpen((v) => !v)}
          onTurnInto={turnInto}
          onDuplicate={duplicateBlock}
          onDelete={deleteBlock}
          cancelHide={cancelHide}
          scheduleHide={scheduleHide}
        />
      ) : null}
    </>
  );
}
