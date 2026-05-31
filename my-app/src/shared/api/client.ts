/**
 * 공통 fetch 래퍼.
 *  - baseURL 부착, Authorization Bearer 자동 첨부, credentials:"include"(쿠키 전송)
 *  - 공통 응답 래퍼({status,code,data}) 언래핑 → data 반환
 *  - status==="error" → ApiError(code) throw
 *  - 401 AUTH_TOKEN_EXPIRED → refresh 1회(single-flight) 후 원요청 재시도
 */
import { API_BASE_URL } from "./config";
import { ApiError, type ApiErrorDetail } from "./errors";
import { getAccessToken, setAccessToken } from "./tokenStore";

interface Envelope<T> {
  status: "success" | "accepted" | "error";
  code: string;
  data: T;
  details?: ApiErrorDetail[];
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Authorization 헤더 부착 여부 (기본 true) */
  auth?: boolean;
  /** 401 시 refresh 후 재시도 여부 (기본 true) */
  retryOn401?: boolean;
  /** 추가 쿼리스트링 */
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function rawRequest<T>(path: string, opts: RequestOptions): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: Envelope<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Envelope<T>;
    } catch {
      json = null;
    }
  }

  if (!json) {
    if (res.ok) return undefined as T;
    throw new ApiError("HTTP_ERROR", res.status);
  }
  if (json.status === "error") {
    throw new ApiError(json.code, res.status, json.details ?? []);
  }
  return json.data;
}

// ─── refresh single-flight ──────────────────────────────────────────────────
let refreshInFlight: Promise<boolean> | null = null;

/** refresh 쿠키로 새 access token 발급. 동시 호출은 1회로 합쳐진다. */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rawRequest<{ access_token: string }>(
      "/auth/token/refresh",
      { method: "POST", auth: false, retryOn401: false },
    )
      .then((data) => {
        setAccessToken(data?.access_token ?? null);
        return true;
      })
      .catch(() => {
        setAccessToken(null);
        return false;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const retryOn401 = opts.retryOn401 ?? true;
  try {
    return await rawRequest<T>(path, opts);
  } catch (e) {
    if (
      retryOn401 &&
      e instanceof ApiError &&
      e.httpStatus === 401 &&
      e.code === "AUTH_TOKEN_EXPIRED"
    ) {
      const ok = await refreshAccessToken();
      if (ok) return rawRequest<T>(path, { ...opts, retryOn401: false });
    }
    throw e;
  }
}
