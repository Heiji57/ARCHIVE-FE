import {
  Heading1,
  Heading2,
  Heading3,
  Lightbulb,
  List,
  ListOrdered,
  Quote,
  Type,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

/** 블록 "전환" 메뉴의 한 옵션 */
export interface TurnIntoOption {
  id: string;
  label: string;
  icon: typeof Type;
  apply: (editor: Editor, pos: number) => void;
}

export const TURN_INTO_OPTIONS: TurnIntoOption[] = [
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
