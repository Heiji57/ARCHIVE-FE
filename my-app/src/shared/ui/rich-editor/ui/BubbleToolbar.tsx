import { useRef, useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import {
  Bold,
  Code,
  Italic,
  Link2,
  Link2Off,
  RemoveFormatting,
  Strikethrough,
} from "lucide-react";

interface Props {
  editor: Editor;
}

export function BubbleToolbar({ editor }: Props) {
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const showLinkRef = useRef(false);

  const openLinkInput = () => {
    showLinkRef.current = true;
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setShowLink(true);
  };

  const applyLink = () => {
    showLinkRef.current = false;
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLink(false);
    setLinkUrl("");
  };

  const cancelLink = () => {
    showLinkRef.current = false;
    setShowLink(false);
    setLinkUrl("");
    editor.commands.focus();
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ state }: { state: EditorState }) => {
        if (showLinkRef.current) return true;
        return !state.selection.empty;
      }}
      className="bubble-toolbar"
    >
      {showLink ? (
        <form
          className="bubble-link-form"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <input
            type="text"
            className="bubble-link-input"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL 입력..."
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelLink();
            }}
            autoFocus
          />
          <button type="submit" className="bubble-btn bubble-link-confirm">
            확인
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            className={`bubble-btn${editor.isActive("bold") ? " is-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            title="굵게 (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            className={`bubble-btn${editor.isActive("italic") ? " is-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            title="기울임 (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            className={`bubble-btn${editor.isActive("strike") ? " is-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleStrike().run();
            }}
            title="취소선"
          >
            <Strikethrough size={14} />
          </button>
          <button
            type="button"
            className={`bubble-btn${editor.isActive("code") ? " is-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleCode().run();
            }}
            title="인라인 코드"
          >
            <Code size={14} />
          </button>
          <span className="bubble-sep" />
          <button
            type="button"
            className={`bubble-btn${editor.isActive("link") ? " is-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                openLinkInput();
              }
            }}
            title={editor.isActive("link") ? "링크 제거" : "링크 추가"}
          >
            {editor.isActive("link") ? (
              <Link2Off size={14} />
            ) : (
              <Link2 size={14} />
            )}
          </button>
          <span className="bubble-sep" />
          <button
            type="button"
            className="bubble-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().unsetAllMarks().run();
            }}
            title="서식 초기화"
          >
            <RemoveFormatting size={14} />
          </button>
        </>
      )}
    </BubbleMenu>
  );
}
