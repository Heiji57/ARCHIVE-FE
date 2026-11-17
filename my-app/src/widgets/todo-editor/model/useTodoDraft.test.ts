import { describe, expect, it } from "vitest";
import { applyDraftPatch, draftFromDefaults } from "./useTodoDraft";

describe("draftFromDefaults", () => {
  it("날짜를 안 주면 오늘, 시간은 시작이 있을 때만", () => {
    expect(draftFromDefaults({}, "2026-11-03", "me")).toMatchObject({
      dateKey: "2026-11-03",
      startTime: null,
      endTime: null,
      status: "not-start",
      calendarId: "me",
    });
    expect(draftFromDefaults({ dateKey: "2026-11-05", startTime: "14:00", endTime: "15:00" }, "2026-11-03", "me")).toMatchObject({
      dateKey: "2026-11-05",
      startTime: "14:00",
      endTime: "15:00",
    });
    expect(draftFromDefaults({ endTime: "15:00" }, "2026-11-03", "me").endTime).toBeNull();
  });
});

describe("applyDraftPatch", () => {
  const d = draftFromDefaults({}, "2026-11-03", "me");

  it("날짜를 마감일 뒤로 옮기면 마감일을 지운다", () => {
    const withDue = applyDraftPatch(d, { dueDate: "2026-11-06" });
    expect(applyDraftPatch(withDue, { dateKey: "2026-11-05" }).dueDate).toBe("2026-11-06");
    expect(applyDraftPatch(withDue, { dateKey: "2026-11-07" }).dueDate).toBeNull();
  });
});
