export const CODE_LENGTH = 6;

/** 백엔드 인증 코드는 영숫자 6자(예: PW1YOT). 영숫자만 남기고 대문자로 맞춘다. */
export function normalizeCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * 코드 칸 i 에 typed 를 넣은 결과. 값은 앞에서부터 이어진 한 문자열이라
 * 빈 칸을 건너뛴 자리(i > value.length)는 이어 쓸 첫 빈 칸으로 당긴다.
 * 반환: 새 값과 다음에 포커스할 칸.
 */
export function putCode(value: string, i: number, typed: string): { next: string; focus: number } {
  const start = Math.min(i, value.length);
  const next = (value.slice(0, start) + typed + value.slice(start + typed.length)).slice(0, CODE_LENGTH);
  return { next, focus: Math.min(CODE_LENGTH - 1, start + typed.length) };
}
