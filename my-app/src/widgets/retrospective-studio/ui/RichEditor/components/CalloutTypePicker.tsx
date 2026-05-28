import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { CALLOUT_META, type CalloutType } from "../commands";

/**
 * 콜아웃 노드 안에 커서가 있을 때, 좌측에 작은 emoji 버튼 표시 → 클릭 시 타입 변경 메뉴.
 */
export function CalloutTypePicker({ editor }: { editor: Editor }) {
  const [calloutEl, setCalloutEl] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentType, setCurrentType] = useState<CalloutType>("NOTE");

  useEffect(() => {
    const update = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      let calloutNode: { attrs: { type: CalloutType } } | null = null;
      let calloutDomPos = -1;
      for (let d = $from.depth; d > 0; d -= 1) {
        const node = $from.node(d);
        if (node.type.name === "callout") {
          calloutNode = node as unknown as { attrs: { type: CalloutType } };
          calloutDomPos = $from.before(d);
          break;
        }
      }
      if (!calloutNode || calloutDomPos < 0) {
        setCalloutEl(null);
        setRect(null);
        setPickerOpen(false);
        return;
      }
      const dom = editor.view.nodeDOM(calloutDomPos) as HTMLElement | null;
      if (dom) {
        setCalloutEl(dom);
        setRect(dom.getBoundingClientRect());
        setCurrentType(calloutNode.attrs.type ?? "NOTE");
      }
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  useEffect(() => {
    if (!calloutEl) return;
    const onScroll = () => setRect(calloutEl.getBoundingClientRect());
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [calloutEl]);

  if (!calloutEl || !rect) return null;

  const meta = CALLOUT_META[currentType];

  return (
    <>
      <button
        type="button"
        className="rich-callout-picker-btn"
        style={{ position: "fixed", left: rect.left - 28, top: rect.top + 8 }}
        onClick={() => setPickerOpen((v) => !v)}
        title={`${meta.titleKo} (클릭해서 변경)`}
      >
        {meta.emoji}
      </button>

      {pickerOpen ? (
        <div
          className="rich-callout-picker"
          style={{ position: "fixed", left: rect.left - 28, top: rect.top + 36 }}
        >
          {(Object.keys(CALLOUT_META) as CalloutType[]).map((type) => {
            const m = CALLOUT_META[type];
            const isActive = type === currentType;
            return (
              <button
                key={type}
                type="button"
                className="rich-callout-picker-item"
                data-active={isActive ? "true" : undefined}
                onClick={() => {
                  editor.chain().focus().setCalloutType(type).run();
                  setPickerOpen(false);
                }}
              >
                <span>{m.emoji}</span>
                <span>{m.titleKo}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
