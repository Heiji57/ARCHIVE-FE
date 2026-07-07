import { useEffect, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { CALLOUT_META } from "../constants";
import type { CalloutType } from "../types";

/** 콜아웃 React NodeView — 내부 아이콘 버튼 클릭으로 타입 변경 피커를 열고 닫는다. */
export function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const type = (node.attrs.type as CalloutType) ?? "NOTE";
  const meta = CALLOUT_META[type];

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      )
        return;
      setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  return (
    <NodeViewWrapper as="div" className="rich-callout" data-callout-type={type}>
      <button
        ref={btnRef}
        type="button"
        className="rich-callout-icon-btn"
        contentEditable={false}
        suppressContentEditableWarning
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPickerOpen((v) => !v);
        }}
        title="클릭해서 아이콘 변경"
      >
        {meta.emoji}
      </button>
      {pickerOpen && (
        <div
          ref={pickerRef}
          className="rich-callout-picker"
          contentEditable={false}
          suppressContentEditableWarning
        >
          {(Object.keys(CALLOUT_META) as CalloutType[]).map((t) => {
            const m = CALLOUT_META[t];
            return (
              <button
                key={t}
                type="button"
                className="rich-callout-picker-item"
                data-active={t === type ? "true" : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateAttributes({ type: t });
                  setPickerOpen(false);
                }}
              >
                <span>{m.emoji}</span>
                <span>{m.titleKo}</span>
              </button>
            );
          })}
        </div>
      )}
      <NodeViewContent as="div" className="rich-callout-content" />
    </NodeViewWrapper>
  );
}
