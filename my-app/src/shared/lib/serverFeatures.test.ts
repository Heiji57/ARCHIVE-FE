import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SERVER_FEATURES,
  isServerFeatureOn,
  useServerFeature,
  type ServerFeature,
} from "./serverFeatures";

const ALL = Object.keys(SERVER_FEATURES) as ServerFeature[];

describe("isServerFeatureOn", () => {
  it("데모 모드에서는 서버에 없는 기능도 켠다", () => {
    expect(isServerFeatureOn("ai", { demo: true })).toBe(true);
  });

  it("실제 모드에서는 서버에 없는 기능을 끈다", () => {
    expect(isServerFeatureOn("ai", { demo: false })).toBe(false);
  });

  it("데모 모드에서는 모든 기능이 켜진다", () => {
    for (const f of ALL) expect(isServerFeatureOn(f, { demo: true })).toBe(true);
  });

  it("실제 모드에서는 SERVER_FEATURES 값을 그대로 따른다", () => {
    for (const f of ALL) expect(isServerFeatureOn(f, { demo: false })).toBe(SERVER_FEATURES[f]);
  });

  it("계획의 14개 기능 이름을 모두 가진다", () => {
    expect([...ALL].sort()).toEqual(
      [
        "ai", "userCalendars", "tagAdmin", "trash", "exports", "accountDelete", "avatar",
        "settingsExt", "notificationPrefs", "topicStructured", "overdueQuery", "todoBatch",
        "commitRange", "searchScope",
      ].sort(),
    );
  });
});

describe("useServerFeature", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("URL 에 ?demo=true 가 있으면 켠다", () => {
    vi.stubGlobal("window", { location: { search: "?demo=true" } });
    expect(useServerFeature("trash")).toBe(true);
  });

  it("URL 에 demo 가 없으면 SERVER_FEATURES 값을 쓴다", () => {
    vi.stubGlobal("window", { location: { search: "" } });
    expect(useServerFeature("trash")).toBe(SERVER_FEATURES.trash);
  });
});
