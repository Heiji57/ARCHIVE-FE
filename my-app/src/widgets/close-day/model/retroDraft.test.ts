import { describe, expect, it } from "vitest";
import { retroDraft } from "./retroDraft";

const L = {
  done: "완료한 일",
  commits: "남긴 커밋",
  none: "없음",
  carried: (n: number) => `넘긴 일 ${n}개`,
  closed: (n: number) => `, 끝냄으로 바꾼 일 ${n}개`,
  learned: "배운 점: ",
};

describe("retroDraft", () => {
  it("시안 carry3.js 회고 초안 모양(마크다운)", () => {
    const md = retroDraft({
      title: "11월 3일 화요일",
      done: ["PR #14 코드 리뷰", "스프린트 회의"],
      commits: [{ message: "test: DnD 경계 케이스", repo: "archive-fe" }],
      carried: 4,
      closed: 1,
      labels: L,
    });
    expect(md).toBe(
      [
        "## 11월 3일 화요일",
        "",
        "완료한 일",
        "- PR #14 코드 리뷰",
        "- 스프린트 회의",
        "",
        "남긴 커밋",
        "- test: DnD 경계 케이스 (archive-fe)",
        "",
        "넘긴 일 4개, 끝냄으로 바꾼 일 1개",
        "",
        "배운 점: ",
      ].join("\n"),
    );
  });

  it("빈 목록은 '- 없음', 끝냄 0개는 뺀다", () => {
    const md = retroDraft({ title: "T", done: [], commits: [], carried: 0, closed: 0, labels: L });
    expect(md).toContain("완료한 일\n- 없음\n\n남긴 커밋\n- 없음\n\n넘긴 일 0개\n");
  });
});
