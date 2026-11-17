import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nContext } from "@/shared/lib/i18n/context";
import { translate } from "@/shared/lib/i18n/translate";
import { buildDemoTopics } from "@/entities/topic/model/demo";
import type { TopicView } from "../model/useTopicStudioData";
import { TopicDoc, type TopicDocProps } from "./TopicDoc";
import { TopicCard } from "./TopicCard";

const demo = buildDemoTopics("2026-11-03");
const d = demo.digests.tp1;
const base: TopicView = {
  topic: demo.topics[0],
  color: 0,
  status: "completed",
  watermark: d.watermarkDateKey,
  structured: d.structured,
  sources: d.sources,
  span: ["2026-10-20", "2026-11-02"],
  newer: 0,
  entries: 6,
  todos: 9,
};
const noop = () => {};
const render = (view: TopicView, extra: Partial<TopicDocProps> = {}) =>
  renderToStaticMarkup(
    <I18nContext.Provider value={{ locale: "ko", t: (k, v) => translate("ko", k, v) }}>
      <TopicDoc
        view={view}
        graph={false}
        data={{
          today: "2026-11-03",
          entries: demo.entries,
          commits: demo.commits,
          structuredOn: true,
          open: { markdown: null, loading: false, generating: false, progress: null, generateError: false },
        }}
        onBack={noop}
        onSetView={noop}
        onGenerate={noop}
        onRename={noop}
        onDescribe={noop}
        onOpenEntry={noop}
        {...extra}
      />
    </I18nContext.Provider>,
  );

describe("TopicDoc", () => {
  it("구조화 결과가 있으면 문서/연결 아이콘, 주 이름, 하루 카드", () => {
    const html = render(base);
    expect(html).toContain('class="sw1"');
    expect(html).toContain("앞으로 할 일");
    expect(html).toContain("이번 주");
    expect(html).toContain("지난주");
    expect((html.match(/class="tD-day/g) ?? []).length).toBe(10);
  });
  it("실제 모드(구조화 결과 없음)는 새 머리만, 연결 전환 아이콘은 숨김", () => {
    const html = render({ ...base, structured: null, sources: {} });
    expect(html).not.toContain('class="sw1"');
    expect(html).toContain('class="th1"');
    expect(html).toContain("다시 정리");
  });
  it("정리 전은 점선 안내와 정리하기, 정리 중은 안내만", () => {
    const none = render({ ...base, status: "none", structured: null, watermark: null });
    expect(none).toContain("tv-empty");
    expect(none).toContain("정리하기");
    const pend = render({ ...base, status: "pending", structured: null });
    expect(pend).toContain("q-spin");
    expect(pend).not.toContain("정리하기");
  });
});

describe("TopicCard", () => {
  it("주제 색 변수와 책갈피, 정리 전은 점선(un)", () => {
    const html = renderToStaticMarkup(
      <I18nContext.Provider value={{ locale: "ko", t: (k, v) => translate("ko", k, v) }}>
        <TopicCard view={{ ...base, color: 2, status: "none", structured: null }} onOpen={noop} />
      </I18nContext.Provider>,
    );
    expect(html).toContain("--k:var(--tpc3)");
    expect(html).toContain("tk-rib");
    expect(html).toContain("q-cd k-topic un");
    expect(html).toContain("정리 전");
  });
});
