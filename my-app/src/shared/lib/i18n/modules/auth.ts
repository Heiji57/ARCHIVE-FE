import { defineI18nModule } from "./types";

/**
 * 로그인, 가입, 비밀번호 재설정 화면(Task 7, 시안 d-auth.html)의 새 문구.
 * 기존 auth.* 키(keys.ts)로 쓸 수 있는 문구는 그 키를 그대로 쓴다.
 */
export const authI18n = defineI18nModule({
  ko: {
    "auth.field.emailPlaceholder": "you@example.com",
    "auth.steps.label": "3단계 중 {n}단계",
    "auth.verify.title": "메일로 온 코드를 입력해 주세요",
    "auth.verify.lead": "{email}으로 6자리 코드를 보냈어요.",
    "auth.verify.box": "{n}번째 글자",
    "auth.forgot.lead": "가입한 이메일로 재설정 링크를 보내 드려요.",
    "auth.forgot.sendLink": "재설정 링크 받기",
    "auth.forgot.sentTitle": "메일을 확인해 주세요",
    "auth.reset.doneTitle": "비밀번호를 바꿨어요",
    "auth.reset.doneLead": "새 비밀번호로 다시 로그인해 주세요.",
  },
  en: {
    "auth.field.emailPlaceholder": "you@example.com",
    "auth.steps.label": "Step {n} of 3",
    "auth.verify.title": "Enter the code from your email",
    "auth.verify.lead": "We sent a 6-character code to {email}.",
    "auth.verify.box": "Character {n}",
    "auth.forgot.lead": "We'll email you a link to reset your password.",
    "auth.forgot.sendLink": "Send reset link",
    "auth.forgot.sentTitle": "Check your email",
    "auth.reset.doneTitle": "Password changed",
    "auth.reset.doneLead": "Sign in again with your new password.",
  },
});
