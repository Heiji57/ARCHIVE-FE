import { describe, expect, it } from "vitest";
import { searchSettings } from "./search";
import { SETTINGS_ROWS, visibleRows, visibleSections } from "./sections";

const DEMO = { demo: true, github: true, calendar: true };
const REAL = { demo: false, github: true, calendar: true };

describe("searchSettings", () => {
  it('"주 시작"은 할 일과 캘린더(work) 섹션의 주 시작 요일 줄을 찾는다', () => {
    expect(searchSettings("주 시작", "ko", DEMO)).toContainEqual({ section: "work", rowId: "weekStart" });
  });

  it("빈 검색이나 공백만 있으면 빈 배열", () => {
    expect(searchSettings("", "ko", DEMO)).toEqual([]);
    expect(searchSettings("   ", "ko", DEMO)).toEqual([]);
  });

  it("실제 모드에서 서버에 없어 가린 줄은 결과에 없다", () => {
    expect(searchSettings("주 시작", "ko", REAL)).not.toContainEqual({ section: "work", rowId: "weekStart" });
    const ids = searchSettings("빗금이", "ko", REAL).map((r) => r.rowId);
    expect(ids).not.toContain("pet");
  });

  it("키워드(kw)로도 찾고, 대소문자를 가리지 않는다", () => {
    expect(searchSettings("TIMEZONE", "ko", DEMO)).toContainEqual({ section: "general", rowId: "region" });
    expect(searchSettings("github", "en", DEMO).some((r) => r.section === "link")).toBe(true);
  });

  it("영어 문구로도 찾는다", () => {
    expect(searchSettings("week start", "en", DEMO)).toContainEqual({ section: "work", rowId: "weekStart" });
  });

  it("GitHub 이 연결되지 않으면 저장소 줄은 결과에 없다", () => {
    const off = searchSettings("저장소", "ko", { ...DEMO, github: false }).map((r) => r.rowId);
    expect(off).not.toContain("repos");
    const on = searchSettings("저장소", "ko", DEMO).map((r) => r.rowId);
    expect(on).toContain("repos");
  });

  it("결과는 섹션 순서, 섹션 안에서는 줄 순서를 따른다", () => {
    const res = searchSettings("시간", "ko", DEMO);
    const order = res.map((r) => SETTINGS_ROWS.findIndex((x) => x.id === r.rowId));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("visibleRows / visibleSections", () => {
  it("데모에서는 8개 섹션이 모두 보인다", () => {
    expect(visibleSections(DEMO)).toHaveLength(8);
  });

  it("실제 모드에서는 AI 비서 섹션이 통째로 빠진다", () => {
    expect(visibleSections(REAL)).not.toContain("ai");
    expect(visibleRows("ai", REAL)).toEqual([]);
  });

  it("실제 모드의 계정 섹션에는 계정 삭제 줄이 없다", () => {
    const ids = visibleRows("account", REAL).map((r) => r.id);
    expect(ids).toEqual(["name", "email", "logout"]);
  });

  it("줄 id 는 겹치지 않는다", () => {
    const ids = SETTINGS_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
