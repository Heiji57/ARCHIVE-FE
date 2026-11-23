import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/app/model/settings";
import { DICTIONARIES } from "../dictionaries";
import { translate } from "../translate";
import { ko as baseKo } from "../locales/ko";
import { defineI18nModule } from "./types";
import { I18N_MODULES, mergeI18nModules } from "./registry";

// 테스트 전용 모듈: registry 에 등록하지 않으므로 실제 TranslationKey 에 섞이지 않는다.
const KO_VALUE = "테스트 샘플";
const EN_VALUE = "Test sample";
const testI18n = defineI18nModule({
  ko: { "test.sample": KO_VALUE, "test.withVar": "{n}개" },
  en: { "test.sample": EN_VALUE, "test.withVar": "{n} items" },
});

const LOCALES: Locale[] = SUPPORTED_LOCALES.map((l) => l.code);
const BASE = {} as Record<Locale, Record<string, string>>;
for (const l of LOCALES) BASE[l] = { "base.a": l === "ko" ? "가" : `a-${l}` };

describe("mergeI18nModules", () => {
  const merged = mergeI18nModules(BASE, [testI18n]);

  it("ko 는 모듈의 ko 값을 쓴다", () => {
    expect(merged.ko["test.sample"]).toBe(KO_VALUE);
  });

  it("en 은 모듈의 en 값을 쓴다", () => {
    expect(merged.en["test.sample"]).toBe(EN_VALUE);
  });

  it("ko/en 이외 로케일(ja 등)은 모듈 키에 en 값을 쓴다", () => {
    expect(merged.ja["test.sample"]).toBe(EN_VALUE);
    for (const l of LOCALES.filter((x) => x !== "ko")) {
      expect(merged[l]["test.sample"]).toBe(EN_VALUE);
    }
  });

  it("기존 로케일 값은 그대로 둔다", () => {
    expect(merged.ja["base.a"]).toBe("a-ja");
    expect(merged.ko["base.a"]).toBe("가");
  });

  it("입력 사전을 바꾸지 않는다", () => {
    expect(BASE.ja["test.sample"]).toBeUndefined();
  });
});

describe("defineI18nModule 타입 검사", () => {
  it("ko 와 en 의 키 집합이 다르면 컴파일 에러 (tsc -b 가 확인)", () => {
    defineI18nModule({
      ko: { "t.a": "가", "t.b": "나" },
      // @ts-expect-error en 에 t.b 가 없다
      en: { "t.a": "A" },
    });
    defineI18nModule({
      ko: { "t.a": "가" },
      // @ts-expect-error en 에 ko 에 없는 t.c 가 있다
      en: { "t.a": "A", "t.c": "C" },
    });
    expect(true).toBe(true);
  });
});

describe("등록된 모듈 (I18N_MODULES)", () => {
  const baseKeys = new Set(Object.keys(baseKo));

  it("모든 로케일 사전에 모든 모듈 키가 비어 있지 않은 값으로 있다", () => {
    for (const m of I18N_MODULES) {
      for (const key of Object.keys(m.ko)) {
        for (const l of LOCALES) {
          expect(DICTIONARIES[l][key as keyof (typeof DICTIONARIES)["ko"]], `${l}:${key}`).toBeTruthy();
        }
      }
    }
  });

  it("ko 이외 로케일은 모듈 키에 en 값을 쓴다 (translate)", () => {
    for (const m of I18N_MODULES) {
      for (const [key, en] of Object.entries(m.en)) {
        expect(translate("ja", key as Parameters<typeof translate>[1])).toBe(en);
      }
    }
  });

  it("모듈 키가 keys.ts 키나 다른 모듈 키와 겹치지 않는다", () => {
    const seen = new Set<string>();
    for (const m of I18N_MODULES) {
      for (const key of Object.keys(m.ko)) {
        expect(baseKeys.has(key), `keys.ts 와 겹침: ${key}`).toBe(false);
        expect(seen.has(key), `모듈끼리 겹침: ${key}`).toBe(false);
        seen.add(key);
      }
    }
  });

  it("모듈 값은 빈 문자열이 아니다", () => {
    for (const m of I18N_MODULES) {
      for (const v of [...Object.values(m.ko), ...Object.values(m.en)]) expect(v.trim()).not.toBe("");
    }
  });
});
