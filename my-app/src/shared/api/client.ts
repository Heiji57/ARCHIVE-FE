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
    refreshInFlight = rawRequest<{ accessToken: string }>(
      "/auth/token/refresh",
      { method: "POST", auth: false, retryOn401: false },
    )
      .then((data) => {
        setAccessToken(data?.accessToken ?? null);
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

// ─── SSE (fetch + ReadableStream) ─────────────────────────────────────────────
// EventSource 는 Authorization 헤더를 못 싣기 때문에 fetch 로 직접 스트림을 읽는다.
// 반환 함수를 호출하면 구독을 중단한다. 스트림이 끝나면 onClose 가 호출된다(재연결은 호출자 몫).
export function streamSSE(
  path: string,
  onData: (data: unknown) => void,
  onClose?: () => void,
): () => void {
  const controller = new AbortController();

  const open = async (retried: boolean): Promise<void> => {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    if (res.status === 401 && !retried) {
      const ok = await refreshAccessToken();
      if (ok) return open(true);
    }
    if (!res.ok || !res.body) throw new ApiError("SSE_ERROR", res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const line = chunk.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        try {
          onData(JSON.parse(line.slice(5).trim()));
        } catch {
          /* malformed event 무시 */
        }
      }
    }
  };

  void open(false)
    .catch(() => {})
    .finally(() => {
      if (!controller.signal.aborted) onClose?.();
    });

  return () => controller.abort();
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
