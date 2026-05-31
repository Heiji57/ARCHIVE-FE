import { SLASH_COMMANDS } from "./constants";
import type { SlashCommandItem } from "./types";

/**
 * 다국어 검색 — 부분 일치, 대소문자 무시, 공백 무시.
 * 검색어가 비면 전체 반환.
 */
export function filterCommands(query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((cmd) => {
    const haystack = [cmd.id, cmd.titleKo, cmd.titleEn, ...cmd.keywords]
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "");
    return haystack.includes(q);
  });
}
