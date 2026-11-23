import { describe, expect, it } from "vitest";
import {
  getPathFromRoute,
  getRetroParamsFromPath,
  getRetroPathFromParams,
  getRouteFromPath,
  getSettingsSectionFromHash,
} from "./navigation";

describe("getRouteFromPath", () => {
  it("/ai 는 ai", () => {
    expect(getRouteFromPath("/ai")).toBe("ai");
  });
  it("/dashboard 는 캘린더로 보낸다(경로 호환)", () => {
    expect(getRouteFromPath("/dashboard")).toBe("calendar");
  });
  it("/settings 는 settings(캘린더 위에 설정 시트, 경로 호환)", () => {
    expect(getRouteFromPath("/settings")).toBe("settings");
  });
  it("기존 경로", () => {
    expect(getRouteFromPath("/")).toBe("calendar");
    expect(getRouteFromPath("/todos")).toBe("todos");
    expect(getRouteFromPath("/retrospectives/topics/tp1")).toBe("retrospectives");
  });
  it("/aix 처럼 접두만 같은 경로는 ai 가 아니다", () => {
    expect(getRouteFromPath("/aix")).toBe("calendar");
  });
});

describe("getPathFromRoute", () => {
  it("ai 경로", () => {
    expect(getPathFromRoute("ai")).toBe("/ai");
  });
  it("dashboard 는 / 로", () => {
    expect(getPathFromRoute("dashboard")).toBe("/");
  });
});

describe("회고 경로", () => {
  it("주제 연결 그래프", () => {
    expect(getRetroParamsFromPath("/retrospectives/topics/tp1/graph")).toEqual({
      area: "topic",
      topicId: "tp1",
      topicView: "graph",
    });
  });
  it("주제 본문", () => {
    expect(getRetroParamsFromPath("/retrospectives/topics/tp1")).toEqual({
      area: "topic",
      topicId: "tp1",
      topicView: "doc",
    });
  });
  it("주제 목록", () => {
    expect(getRetroParamsFromPath("/retrospectives/topics")).toEqual({ area: "topic" });
  });
  it("주제 경로 만들기", () => {
    expect(getRetroPathFromParams({ area: "topic", topicId: "tp1" })).toBe("/retrospectives/topics/tp1");
    expect(getRetroPathFromParams({ area: "topic", topicId: "tp1", topicView: "doc" })).toBe(
      "/retrospectives/topics/tp1",
    );
    expect(getRetroPathFromParams({ area: "topic", topicId: "tp1", topicView: "graph" })).toBe(
      "/retrospectives/topics/tp1/graph",
    );
    expect(getRetroPathFromParams({ area: "topic" })).toBe("/retrospectives/topics");
  });
  it("편집기와 폴더(기존)", () => {
    expect(getRetroParamsFromPath("/retrospectives/editor/e1")).toEqual({ view: "editor", entryId: "e1" });
    expect(getRetroParamsFromPath("/retrospectives/folder/f1")).toEqual({ view: "gallery", entryId: "f1" });
    expect(getRetroPathFromParams({ view: "editor", entryId: "e1" })).toBe("/retrospectives/editor/e1");
    expect(getRetroParamsFromPath("/retrospectives")).toEqual({});
    expect(getRetroPathFromParams({})).toBe("/retrospectives");
  });
  it("경로를 만들고 다시 읽으면 같다", () => {
    const p = { area: "topic", topicId: "a-b", topicView: "graph" } as const;
    expect(getRetroParamsFromPath(getRetroPathFromParams(p))).toEqual(p);
  });
});

describe("getSettingsSectionFromHash", () => {
  it("알려진 섹션", () => {
    expect(getSettingsSectionFromHash("#link")).toBe("link");
    expect(getSettingsSectionFromHash("#notify")).toBe("notify");
  });
  it("없거나 모르는 값은 account", () => {
    expect(getSettingsSectionFromHash("")).toBe("account");
    expect(getSettingsSectionFromHash("#zzz")).toBe("account");
  });
});
