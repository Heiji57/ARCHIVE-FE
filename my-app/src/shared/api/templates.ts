/** 회고 템플릿 도메인 API. */
import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { RetroTemplate } from "@/entities/template/model/types";
import { request } from "./client";
import { toTemplate } from "./mappers";
import type { components } from "./schema";

type RetroTemplateResponse = components["schemas"]["RetroTemplateResponse"];

export async function apiListTemplates(retroType?: RetrospectiveType): Promise<RetroTemplate[]> {
  const list = await request<RetroTemplateResponse[]>("/templates", {
    query: retroType ? { retro_type: retroType } : undefined,
  });
  return list.map(toTemplate);
}

export async function apiCreateTemplate(input: {
  retroType: RetrospectiveType;
  name: string;
  content: string;
}): Promise<RetroTemplate> {
  const res = await request<RetroTemplateResponse>("/templates", {
    method: "POST",
    query: { retro_type: input.retroType },
    body: { name: input.name, content: input.content },
  });
  return toTemplate(res);
}

export async function apiUpdateTemplate(
  id: string,
  patch: { name?: string | null; content?: string | null },
): Promise<RetroTemplate> {
  const res = await request<RetroTemplateResponse>(`/templates/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return toTemplate(res);
}

export async function apiDeleteTemplate(id: string): Promise<void> {
  await request(`/templates/${id}`, { method: "DELETE" });
}

export async function apiResetTemplate(id: string): Promise<RetroTemplate> {
  const res = await request<RetroTemplateResponse>(`/templates/${id}/reset`, {
    method: "POST",
  });
  return toTemplate(res);
}

export async function apiSetActiveTemplate(
  retroType: RetrospectiveType,
  templateId: string,
): Promise<RetroTemplate> {
  const res = await request<RetroTemplateResponse>("/templates/active", {
    method: "PUT",
    body: { retro_type: retroType, template_id: templateId },
  });
  return toTemplate(res);
}
