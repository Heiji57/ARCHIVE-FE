import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import type { TopicView } from "../model/useTopicStudioData";
import { md2, spanText } from "../model/format";
import { recentItems } from "../model/structured";
import { isOrganized, themeColorStyle, topicColorStyle } from "../model/viewHelpers";
import { TopicCard, TopicStatePill } from "./TopicCard";
import { TopicRail } from "./TopicRail";
import { TopicGlyph } from "./parts";

export type TopicListMode = "grid" | "rail";

const VM_KEY = "archive.topic.vm";
const readVm = (): TopicListMode => {
  try {
    return localStorage.getItem(VM_KEY) === "rail" ? "rail" : "grid";
  } catch {
    return "grid";
  }
};

export interface TopicListProps {
  views: TopicView[];
  today: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
  /** 넘기기의 정리하기, 다시 정리 */
  onGenerate: (id: string) => void;
}

/** 필터 아이콘(시안 ic.filter) */
const FilterGlyph = () => (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

/** 주제 목록: 카드(한 줄에 두 장) / 좌우로 넘기기 */
export function TopicList({ views, today, loading, error, onRetry, onOpen, onCreate, onGenerate }: TopicListProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TopicListMode>(readVm);
  const [menu, setMenu] = useState(false);
  const [railId, setRailId] = useState<string | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      menuBtn.current?.focus();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const pick = (m: TopicListMode) => {
    setMode(m);
    setMenu(false);
    menuBtn.current?.focus();
    try {
      localStorage.setItem(VM_KEY, m);
    } catch {
      /* 저장 못 해도 이번에는 바뀐다 */
    }
  };
  const modeName = (m: TopicListMode) => (m === "rail" ? t("topic.v.list.viewRail") : t("topic.v.list.viewGrid"));

  const head = (
    <div className="q-hd">
      <span className="tv-sub">{t("topic.v.list.sub")}</span>
      <span className="sp" />
      <span className="q-wrap" ref={wrap}>
        <button
          ref={menuBtn}
          type="button"
          className="q-bt g"
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => setMenu((x) => !x)}
        >
          <FilterGlyph />
          {t("topic.v.list.view", { name: modeName(mode) })}
        </button>
        {menu ? (
          <div className="q-pop" role="menu">
            {(["grid", "rail"] as const).map((m) => (
              <button key={m} type="button" role="menuitemradio" aria-checked={mode === m} onClick={() => pick(m)}>
                {modeName(m)}
              </button>
            ))}
          </div>
        ) : null}
      </span>
      <button type="button" className="q-bt p" onClick={onCreate}>
        <Plus size={14} strokeWidth={ICON_STROKE} />
        {t("topic.v.list.new")}
      </button>
    </div>
  );

  let body;
  if (error) {
    body = (
      <div className="tv-empty-list">
        {t("topic.v.loadError")}{" "}
        <button type="button" className="q-bt" onClick={onRetry}>
          {t("topic.v.retry")}
        </button>
      </div>
    );
  } else if (loading) {
    body = null;
  } else if (!views.length) {
    body = <div className="tv-empty-list">{t("topic.v.list.empty")}</div>;
  } else if (mode === "rail") {
    body = (
      <TopicRail
        items={views.map((v) => ({
          id: v.topic.id,
          label: v.topic.name,
          className: "k-topic",
          style: topicColorStyle(v.color),
          render: () => <TopicSlide view={v} today={today} onOpen={onOpen} onGenerate={onGenerate} />,
        }))}
        currentId={railId}
        onGo={setRailId}
        trackLabel={t("topic.v.rail.track")}
        prevLabel={t("topic.v.rail.prev")}
        nextLabel={t("topic.v.rail.next")}
        posText={(x, i, n) => `${x.label ?? ""}  ${i + 1} / ${n}`}
      />
    );
  } else {
    body = (
      <section className="mg">
        <h3>
          {t("topic.v.list.all")}
          <small>{t("topic.v.list.count", { n: views.length })}</small>
        </h3>
        <div className="tv-cg">
          {views.map((v) => (
            <TopicCard key={v.topic.id} view={v} onOpen={onOpen} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={`l1 tv${mode === "rail" ? " vm-rail" : ""}`}>
      <div className="pg">
        {head}
        {body}
      </div>
    </div>
  );
}

/** 넘기기 한 장(시안 tvSlide): 이름, 요약, 설명, 최근에 한 일 다섯 줄, 주제 열기 */
function TopicSlide({
  view,
  today,
  onOpen,
  onGenerate,
}: {
  view: TopicView;
  today: string;
  onOpen: (id: string) => void;
  onGenerate: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { topic } = view;
  const org = isOrganized(view);
  const rec = org ? recentItems(view.structured!, view.sources, today, 5) : [];
  return (
    <div className="crl-c tv-sl">
      <span className="tk-rib" aria-hidden="true" />
      <header className="crl-h">
        <span className="crl-k">
          <TopicGlyph />
          {t("topic.v.kind")}
        </span>
        <span className="d">{spanText(view.span)}</span>
        <span className="sp" />
        <TopicStatePill view={view} />
      </header>
      <h3 className="crl-t">{topic.name}</h3>
      <div className="crl-b">
        {org ? <p className="sm">{view.structured!.summary}</p> : null}
        <p className="ds">
          <small>{t("topic.v.collects")}</small>
          {topic.description}
        </p>
        {org ? (
          <>
            <p className="hh">{t("topic.v.rail.recent")}</p>
            <ol className="rc">
              {rec.map((x, i) => (
                <li key={i} style={themeColorStyle(x.themeIndex)}>
                  <time>{md2(x.dateKey)}</time>
                  <span>{x.text}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="un">{t("topic.v.rail.unorganized", { e: view.entries ?? 0, t: view.todos ?? 0 })}</p>
        )}
      </div>
      <footer className="crl-f">
        {view.entries != null ? <span>{t("topic.v.count.entries", { n: view.entries })}</span> : null}
        {view.todos != null ? <span>{t("topic.v.count.todos", { n: view.todos })}</span> : null}
        <span>{view.watermark ? t("topic.v.until", { date: md2(view.watermark) }) : t("topic.v.state.none")}</span>
        <span className="sp" />
        {view.status === "none" ? (
          <button type="button" className="q-bt" onClick={() => onGenerate(topic.id)}>
            {t("topic.v.organize")}
          </button>
        ) : view.status === "completed" && view.newer ? (
          <button type="button" className="q-bt" onClick={() => onGenerate(topic.id)}>
            {t("topic.v.reorganize")}
          </button>
        ) : null}
        <button type="button" className="q-bt" onClick={() => onOpen(topic.id)}>
          {t("topic.v.rail.open")}
        </button>
      </footer>
    </div>
  );
}
