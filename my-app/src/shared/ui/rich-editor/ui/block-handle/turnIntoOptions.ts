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
import type { TranslationKey } from "@/shared/lib/i18n";

/** 블록 "전환" 메뉴의 한 옵션 */
export interface TurnIntoOption {
  id: string;
  labelKey: TranslationKey;
  icon: typeof Type;
  apply: (editor: Editor, pos: number) => void;
}

export const TURN_INTO_OPTIONS: TurnIntoOption[] = [
  {
    id: "p",
    labelKey: "editor.cmd.paragraph.title",
    icon: Type,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).setNode("paragraph").run(),
  },
  {
    id: "h1",
    labelKey: "editor.cmd.h1.title",
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
    labelKey: "editor.cmd.h2.title",
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
    labelKey: "editor.cmd.h3.title",
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
    labelKey: "editor.cmd.bullet.title",
    icon: List,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).toggleBulletList().run(),
  },
  {
    id: "ol",
    labelKey: "editor.cmd.numbered.title",
    icon: ListOrdered,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).toggleOrderedList().run(),
  },
  {
    id: "quote",
    labelKey: "editor.cmd.quote.title",
    icon: Quote,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).toggleBlockquote().run(),
  },
  {
    id: "callout",
    labelKey: "editor.cmd.callout.title",
    icon: Lightbulb,
    apply: (e, pos) =>
      e.chain().focus().setNodeSelection(pos).setCallout({ type: "NOTE" }).run(),
  },
];
