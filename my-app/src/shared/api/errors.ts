/**
 * 백엔드 공통 에러 응답({ status:"error", code, details })을 표현하는 에러 객체.
 * 분기는 HTTP status 가 아니라 도메인 `code` 문자열로 한다. (api.yaml x-error-codes)
 */
import type { TranslationKey } from "@/shared/lib/i18n";

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

/**
 * OAuth 팝업/연결 흐름의 error 값 → i18n 키.
 * error 는 콜백 postMessage 의 백엔드 코드(AUTH_OAUTH_* 등, auth v2 에서 세분화) 또는
 * FE 내부 값(popup-blocked 등)이다. 사용자가 팝업을 닫은 경우(popup-closed)는 null.
 * 알 수 없는 값(INTERNAL_ERROR, missing_params, provider 원문 에러 등)은 generic 으로 처리.
 */
export function oauthErrorMessageKey(error: string): TranslationKey | null {
  switch (error) {
    case "popup-closed":
      return null;
    case "popup-blocked":
      return "auth.oauth.error.popupBlocked";
    case "AUTH_OAUTH_CODE_INVALID":
      return "auth.oauth.error.codeInvalid";
    case "AUTH_OAUTH_STATE_INVALID":
      return "auth.oauth.error.stateInvalid";
    case "AUTH_OAUTH_EMAIL_NOT_VERIFIED":
      return "auth.oauth.error.emailNotVerified";
    case "AUTH_OAUTH_PROVIDER_UNAVAILABLE":
      return "auth.oauth.error.providerUnavailable";
    case "AUTH_OAUTH_PROVIDER_RESPONSE_INVALID":
      return "auth.oauth.error.providerResponseInvalid";
    case "AUTH_OAUTH_ACCOUNT_ALREADY_LINKED":
    case "account-already-linked":
      return "auth.oauth.error.accountAlreadyLinked";
    case "AUTH_OAUTH_PROVIDER_ALREADY_LINKED":
    case "provider-already-linked":
      return "auth.oauth.error.providerAlreadyLinked";
    case "CACHE_UNAVAILABLE":
      return "auth.oauth.error.unavailable";
    default:
      return "auth.oauth.error.generic";
  }
}
