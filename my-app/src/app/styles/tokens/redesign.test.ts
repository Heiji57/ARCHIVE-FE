/// <reference types="node" />
// vitest 는 CSS 의 ?raw import 를 빈 문자열로 돌려주므로 파일을 직접 읽는다.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
const redesign = read("./redesign.css");
const colors = read("./colors.css");

const names = (css: string) => [...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]);

// 계획 Task 0 이 정한 토큰(다음 작업자가 쓰는 이름).
const REQUIRED = [
  "--primary", "--primary-h", "--primary-a", "--ink2", "--ink3", "--ink4",
  "--s1", "--s2", "--s3", "--s4", "--line", "--line2", "--done", "--warn", "--danger",
  "--r", "--r2", "--hh", "--mono", "--font",
  "--rc-d", "--rc-w", "--rc-m", "--rc-y", "--rc-t",
  "--th1", "--th2", "--th3", "--th4", "--tpc1", "--tpc2", "--tpc3", "--tpc4",
  "--ag-accent", "--ag-accent-text", "--ag-surface",
];

describe("tokens/redesign.css", () => {
  const defined = names(redesign);

  it("계획의 토큰을 모두 정의한다", () => {
    for (const n of REQUIRED) expect(defined, n).toContain(n);
  });

  it("같은 이름을 두 번 정의하지 않는다", () => {
    expect(defined.length).toBe(new Set(defined).size);
  });

  it("colors.css 의 토큰을 다시 정의하지 않는다(--ink, --canvas 는 같은 값으로 이미 있음)", () => {
    const existing = new Set(names(colors));
    expect(existing.has("--ink") && existing.has("--canvas")).toBe(true);
    for (const n of defined) expect(existing.has(n), n).toBe(false);
  });
});
