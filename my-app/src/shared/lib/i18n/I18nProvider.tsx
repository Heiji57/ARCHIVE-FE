import { useEffect, useMemo, type ReactNode } from "react";
import type { Locale } from "@/app/model/settings";
import { I18nContext, type I18nContextValue, type TranslateFn } from "./context";
import { translate } from "./translate";

type ValidatableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** 이 Provider 가 직접 넣은 customValidity 표시 — 앱이 넣은 값은 건드리지 않는다. */
const MARK = "i18nValidity";

function isValidatable(el: EventTarget | null): el is ValidatableElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

function validationMessage(el: ValidatableElement, t: TranslateFn): string | null {
  const v = el.validity;
  if (v.valueMissing) return t("validation.required");
  if (v.typeMismatch && el.type === "email") return t("validation.email");
  if (v.typeMismatch) return t("validation.invalid");
  if (v.tooShort && "minLength" in el)
    return t("validation.tooShort", { min: el.minLength });
  if (v.tooLong && "maxLength" in el)
    return t("validation.tooLong", { max: el.maxLength });
  if (v.patternMismatch || v.badInput || v.rangeUnderflow || v.rangeOverflow || v.stepMismatch)
    return t("validation.invalid");
  return null;
}

/**
 * 브라우저 기본 폼 검증 말풍선(required, type="email" 등)은 앱 locale 이 아니라
 * 브라우저 UI 언어로 표시된다. invalid 이벤트를 가로채 앱 locale 메시지로 바꾼다.
 */
function useLocalizedValidation(t: TranslateFn) {
  useEffect(() => {
    const onInvalid = (e: Event) => {
      const el = e.target;
      if (!isValidatable(el)) return;
      if (el.validity.customError && el.dataset[MARK] !== "1") return;
      el.setCustomValidity("");
      const msg = validationMessage(el, t);
      if (msg) {
        el.setCustomValidity(msg);
        el.dataset[MARK] = "1";
      }
    };
    const onEdit = (e: Event) => {
      const el = e.target;
      if (!isValidatable(el) || el.dataset[MARK] !== "1") return;
      el.setCustomValidity("");
      delete el.dataset[MARK];
    };
    // invalid 는 버블링되지 않으므로 캡처 단계에서 받는다.
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, [t]);
}

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  );

  // 스크린리더 발음·브라우저 번역 제안·하이픈 처리가 화면 언어와 맞도록.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useLocalizedValidation(value.t);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
