import { describe, expect, it } from "vitest";
import { dayProgress, freeSlot, untimedOn } from "./dayProgress";
import { todo } from "./testTodo";

// 시안 d-calendar.html 11월 3일(지금 오후 2시 20분)
const DAY = [
  todo({ id: "t1", status: "done", startTime: "09:00", endTime: "10:30" }),
  todo({ id: "t2", status: "done", startTime: "11:00", endTime: "12:00" }),
  todo({ id: "t3", status: "in-progress", startTime: "13:00", endTime: "15:30" }),
  todo({ id: "t4", startTime: "16:00", endTime: "17:00" }),
  todo({ id: "t5", startTime: "18:00", endTime: "19:00" }),
  todo({ id: "t6" }),
  todo({ id: "t7" }),
  // 기간 할 일은 하루 진행에 넣지 않는다
  todo({ id: "span", dateKey: "2026-11-01", dueDate: "2026-11-05", startTime: "14:00", endTime: "15:00" }),
];
const NOW = 14 * 60 + 20;

describe("dayProgress", () => {
  it("지금 진행 중인 일, 다음 일과 남은 분, 나머지", () => {
    const p = dayProgress(DAY, NOW);
    expect(p.current?.id).toBe("t3");
    expect(p.next?.id).toBe("t4");
    expect(p.nextInMin).toBe(100);
    expect(p.rest.map((t) => t.id)).toEqual(["t5", "t6", "t7"]);
  });

  it("시간 미정 할 일은 rest 로, 끝낸 일은 빼고 센다", () => {
    const p = dayProgress(DAY, 20 * 60);
    expect(p.current).toBeNull();
    expect(p.next).toBeNull();
    expect(p.nextInMin).toBeNull();
    expect(p.rest.map((t) => t.id)).toEqual(["t3", "t4", "t5", "t6", "t7"]);
    expect(p.done).toBe(2);
    expect(p.total).toBe(7);
  });

  it("오늘이 아니면(now null) 지금은 없고 다음은 첫 시간 있는 일, 남은 분은 없음", () => {
    const p = dayProgress(DAY, null);
    expect(p.current).toBeNull();
    expect(p.next?.id).toBe("t3");
    expect(p.nextInMin).toBeNull();
  });

  it("끝낸 일은 지금 하는 일이 아니다", () => {
    const p = dayProgress([todo({ id: "a", status: "done", startTime: "14:00", endTime: "15:00" })], NOW);
    expect(p.current).toBeNull();
  });
});

describe("untimedOn, freeSlot", () => {
  it("그날의 끝내지 않은 시간 미정 할 일", () => {
    expect(untimedOn(DAY, "2026-11-03").map((t) => t.id)).toEqual(["t6", "t7"]);
  });

  it("지금 뒤 30분 단위로 1시간 빈 곳(시안: 오후 5시)", () => {
    expect(freeSlot(DAY, NOW)).toBe(17 * 60);
  });

  it("오늘이 아니면 오전 9시부터, 저녁 7시까지 자리가 없으면 null", () => {
    expect(freeSlot([], null)).toBe(9 * 60);
    expect(freeSlot([todo({ id: "x", startTime: "09:00", endTime: "19:00" })], null)).toBeNull();
  });
});
