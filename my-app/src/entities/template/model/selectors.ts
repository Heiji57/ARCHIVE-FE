import type { RetrospectiveType } from "@/entities/entry/model/types";
import { defaultTemplateId } from "./defaults";
import type { RetroTemplate } from "./types";

/**
 * 해당 타입의 활성 템플릿을 해석한다.
 *  1) activeTemplateIds[type] 가 가리키는 템플릿
 *  2) 없으면 해당 타입의 기본 템플릿
 *  3) 그래도 없으면 해당 타입의 첫 템플릿 → null
 */
export function resolveActiveTemplate(
  templates: RetroTemplate[],
  activeTemplateIds: Record<RetrospectiveType, string>,
  type: RetrospectiveType,
): RetroTemplate | null {
  const activeId = activeTemplateIds[type];
  const byActive = templates.find((t) => t.id === activeId);
  if (byActive) return byActive;

  const fallbackId = defaultTemplateId(type);
  const byDefault = templates.find((t) => t.id === fallbackId);
  if (byDefault) return byDefault;

  return templates.find((t) => t.retroType === type) ?? null;
}
