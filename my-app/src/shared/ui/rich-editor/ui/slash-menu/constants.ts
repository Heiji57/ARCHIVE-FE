import {
  ChevronRight,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Lightbulb,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  type LucideIcon,
} from "lucide-react";

/** SlashCommandItem.icon 문자열 → lucide 아이콘 컴포넌트 매핑 */
export const ICONS: Record<string, LucideIcon> = {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  List,
  ListChecks,
  ListOrdered,
  ChevronRight,
  Quote,
  Lightbulb,
  Table: TableIcon,
  Minus,
  Code2,
};

export { Minus as FallbackIcon };
