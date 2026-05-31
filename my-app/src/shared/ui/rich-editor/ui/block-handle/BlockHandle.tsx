import { GripVertical, Plus } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { BlockMenu } from "./BlockMenu";
import { useBlockHandle } from "./useBlockHandle";

const HANDLE_SIZE = 22;

/**
 * Notion 스타일 블록 핸들.
 *  ⊕   클릭: 그 블록 다음에 새 빈 단락 추가
 *  ⋮⋮  클릭: 그 블록을 NodeSelection으로 선택 + 메뉴 표시
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

  if (!hover) return null;

  // padding-left 58px 안에 두 핸들(22+2+22=46)이 들어가도록 배치
  // → 블록 영역 내부에 위치하므로 마우스가 핸들로 가는 길에 hover 안 풀림
  const left = hover.rect.left - 50;
  const top = hover.rect.top + 4;

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
        onMouseEnter={cancelHide}
        onMouseLeave={() => scheduleHide()}
        onClick={openMenu}
        title="블록 선택 + 메뉴"
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
