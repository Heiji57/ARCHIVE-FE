import { Extension } from "@tiptap/core";
import { createDragSelectPlugin } from "./dragHandlers";

/**
 * 노션 스타일 드래그 범위(블록) 선택 확장.
 * 실제 로직은 ProseMirror 플러그인(createDragSelectPlugin)에 위임하고,
 * 여기서는 등록만 담당한다.
 */
export const DragSelect = Extension.create({
  name: "dragSelect",
  addProseMirrorPlugins() {
    return [createDragSelectPlugin()];
  },
});
