/**
 * 백엔드 공통 에러 응답({ status:"error", code, details })을 표현하는 에러 객체.
 * 분기는 HTTP status 가 아니라 도메인 `code` 문자열로 한다. (api.yaml x-error-codes)
 */
export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly details: ApiErrorDetail[];

  constructor(code: string, httpStatus: number, details: ApiErrorDetail[] = []) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
