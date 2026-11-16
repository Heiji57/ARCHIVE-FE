import { describe, expect, it } from "vitest";
import { canUseGithub } from "./permissions";

describe("canUseGithub", () => {
  it("연결돼 있으면 쓸 수 있다", () => {
    expect(canUseGithub({ status: "connected" })).toBe(true);
  });
  it("연결 전이나 모를 때는 못 쓴다", () => {
    expect(canUseGithub({ status: "unknown" })).toBe(false);
    expect(canUseGithub({ status: "not-connected" })).toBe(false);
  });
});
