import { describe, expect, it } from "vitest";
import { normalizeCode, putCode } from "./code";

describe("normalizeCode", () => {
  it("영숫자만 남기고 대문자로", () => {
    expect(normalizeCode("pw-1 yo t")).toBe("PW1YOT");
  });
});

describe("putCode", () => {
  it("한 칸에 한 글자", () => {
    expect(putCode("AB", 2, "C")).toEqual({ next: "ABC", focus: 3 });
  });
  it("가운데 칸을 고쳐 쓴다", () => {
    expect(putCode("ABCD", 1, "X")).toEqual({ next: "AXCD", focus: 2 });
  });
  it("붙여넣기는 칸을 차례로 채우고 6자에서 자른다", () => {
    expect(putCode("", 0, "PW1YOTZZ")).toEqual({ next: "PW1YOT", focus: 5 });
  });
  it("빈 칸을 건너뛴 자리는 첫 빈 칸으로 당긴다", () => {
    expect(putCode("A", 4, "B")).toEqual({ next: "AB", focus: 2 });
  });
});
