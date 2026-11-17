import { describe, expect, it } from "vitest";
import { applySlash, findSlash, headingsOf, highlightLine, isBlankTemplate, slashQueryAt, SLASH_ITEMS } from "./templateMarkdown";

describe("headingsOf", () => {
  it("#, ##, ### 로 시작하는 줄의 제목만 모은다", () => {
    expect(headingsOf("## 오늘 한 일\n> 메모\n\n### 배운 점\n본문\n#없음")).toEqual(["오늘 한 일", "배운 점"]);
  });
  it("제목 글자가 없는 줄은 세지 않는다", () => {
    expect(headingsOf("## \n\n## \n")).toEqual([]);
  });
});

describe("isBlankTemplate", () => {
  it("# 와 공백만 있으면 빈 본문", () => {
    expect(isBlankTemplate("## \n\n## \n")).toBe(true);
    expect(isBlankTemplate("## Keep")).toBe(false);
  });
});

describe("highlightLine", () => {
  it("제목 줄은 h 표시와 # 기호를 나눈다", () => {
    expect(highlightLine("## 배운 점")).toEqual({ kind: "h", level: 2, mark: "##", text: " 배운 점" });
  });
  it("목록과 할 일 줄은 앞 기호를 나눈다", () => {
    expect(highlightLine("- [ ] 할 일")).toEqual({ kind: "m", mark: "- [ ]", text: " 할 일" });
    expect(highlightLine("1. 첫째")).toEqual({ kind: "m", mark: "1. ", text: "첫째" });
  });
  it("인용, 구분선, 표, 코드 줄은 흐리게", () => {
    expect(highlightLine("> 인용").kind).toBe("q");
    expect(highlightLine("---").kind).toBe("q");
  });
  it("나머지는 보통 글자", () => {
    expect(highlightLine("그냥 글")).toEqual({ kind: "t", text: "그냥 글" });
  });
});

describe("slash 명령", () => {
  it("줄 맨 앞이나 공백 뒤의 / 를 찾는다", () => {
    expect(slashQueryAt("## 제목\n/할", 8)).toEqual({ query: "할", start: 6, lineStart: true });
    expect(slashQueryAt("글 /h", 4)).toEqual({ query: "h", start: 2, lineStart: false });
    expect(slashQueryAt("a/b", 3)).toBeNull();
  });

  it("findSlash 는 id, 이름, 키워드로 거른다", () => {
    const names = (q: string) => findSlash(q, (k) => k).map((x) => x.id);
    expect(names("")).toHaveLength(SLASH_ITEMS.length);
    expect(names("task")).toEqual(["task"]);
    expect(names("h2")).toEqual(["h2"]);
  });

  it("applySlash 는 /검색어 자리를 블록 표시로 바꾸고 커서를 그 뒤에 둔다", () => {
    const v = "## 제목\n/할";
    const r = applySlash(v, { query: "할", start: 6, lineStart: true }, 8, "task");
    expect(r.value).toBe("## 제목\n- [ ] ");
    expect(r.caret).toBe(r.value.length);
  });

  it("줄 중간이면 새 줄에 넣는다", () => {
    const r = applySlash("글 /", { query: "", start: 2, lineStart: false }, 3, "h2");
    expect(r.value).toBe("글 \n## ");
  });
});
