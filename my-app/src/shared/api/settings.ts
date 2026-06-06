/** 유저 설정 도메인 API. */
import type { AppSettings } from "@/app/model/settings";
import type { User } from "@/entities/user/model/types";
import { request } from "./client";
import { fromSettings, toSettings, toUser } from "./mappers";
import type { components } from "./schema";

type SettingsResponse = components["schemas"]["SettingsResponse"];
type UserResponse = components["schemas"]["UserResponse"];

export async function apiGetSettings(): Promise<AppSettings> {
  const res = await request<SettingsResponse>("/settings");
  return toSettings(res);
}

/**
 * 설정 전체 교체 (PUT).
 * @param github GitHub 관련 오버라이드 (push target 등). 생략 시 github 블록 미포함.
 */
export async function apiUpdateSettings(
  settings: AppSettings,
  github?: { pushTargetRepositoryId?: string | null } | null,
): Promise<AppSettings> {
  const body: components["schemas"]["UpdateSettingsRequest"] = {
    ...fromSettings(settings),
    ...(github !== undefined && github !== null ? { github } : {}),
  };
  const res = await request<SettingsResponse>("/settings", {
    method: "PUT",
    body,
  });
  return toSettings(res);
}

/** push target 저장소 변경 전용 헬퍼 — 나머지 settings 는 그대로 유지. */
export async function apiSetPushTarget(
  settings: AppSettings,
  repositoryId: string | null,
): Promise<void> {
  await apiUpdateSettings(settings, { pushTargetRepositoryId: repositoryId });
}

/**
 * 국가 변경.
 * - 단일 tz 국가: timezone 생략 가능 (서버가 자동 결정)
 * - 다중 tz 국가: timezone 필수 (IANA identifier)
 */
export async function apiUpdateCountry(
  country: string,
  timezone: string | null,
  opts: { displayName?: string | null } = {},
): Promise<User> {
  const body: Record<string, string> = { country };
  if (timezone) body.timezone = timezone;

  const res = await request<UserResponse>("/settings/country", {
    method: "PATCH",
    body,
  });
  return toUser(res, opts);
}

/**
 * 국가의 IANA timezone 목록 + 다중 tz 여부 조회.
 * FE 가 국가 선택 시 호출해 timezone 드롭다운을 채운다.
 */
export async function apiGetCountryTimezones(code: string): Promise<{
  country: string;
  timezones: string[];
  multi: boolean;
}> {
  const res = await request<components["schemas"]["CountryTimezonesResponse"]>(
    `/settings/countries/${encodeURIComponent(code)}/timezones`,
  );
  return {
    country: res.country,
    timezones: res.timezones,
    multi: res.multi,
  };
}

/** timezone 단독 변경 (국가 유지). */
export async function apiUpdateTimezone(
  timezone: string,
  opts: { displayName?: string | null } = {},
): Promise<User> {
  const res = await request<UserResponse>("/settings/timezone", {
    method: "PATCH",
    body: { timezone },
  });
  return toUser(res, opts);
}
