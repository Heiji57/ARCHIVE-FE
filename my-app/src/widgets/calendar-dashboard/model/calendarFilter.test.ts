import { describe, expect, it } from "vitest";
import type { Todo } from "@/entities/todo/model/types";
import { passesFilter, soloHidden } from "./calendarFilter";

const ids = ["me", "team", "study"];

describe("soloHidden", () => {
  it("다른 캘린더를 모두 숨긴다", () => {
    expect([...soloHidden(new Set(), "team", ids)].sort()).toEqual(["me", "study"]);
  });
  it("이미 그것만 보이면 전부 보이기", () => {
    expect([...soloHidden(new Set(["me", "study"]), "team", ids)]).toEqual([]);
  });
});

describe("passesFilter", () => {
  const t = { tags: ["업무", "리뷰"] } as unknown as Todo;
  it("태그", () => {
    expect(passesFilter(t, { tag: null, hidden: new Set() }, null)).toBe(true);
    expect(passesFilter(t, { tag: "리뷰", hidden: new Set() }, null)).toBe(true);
    expect(passesFilter(t, { tag: "학습", hidden: new Set() }, null)).toBe(false);
  });
  it("숨긴 캘린더(기능이 꺼져 calendarId 가 null 이면 무시)", () => {
    expect(passesFilter(t, { tag: null, hidden: new Set(["team"]) }, "team")).toBe(false);
    expect(passesFilter(t, { tag: null, hidden: new Set(["team"]) }, null)).toBe(true);
  });
});
