/** 유저 설정 도메인 API. */
import type { AppSettings } from "@/app/model/settings";
import { request } from "./client";
import { fromSettings, toSettings } from "./mappers";
import type { components } from "./schema";

type SettingsResponse = components["schemas"]["SettingsResponse"];

export async function apiGetSettings(): Promise<AppSettings> {
  const res = await request<SettingsResponse>("/settings");
  return toSettings(res);
}

/** 설정 전체 교체 (PUT). */
export async function apiUpdateSettings(
  settings: AppSettings,
): Promise<AppSettings> {
  const res = await request<SettingsResponse>("/settings", {
    method: "PUT",
    body: fromSettings(settings),
  });
  return toSettings(res);
}
