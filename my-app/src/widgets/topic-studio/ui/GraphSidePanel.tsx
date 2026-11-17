import type { CSSProperties, KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { TopicStructured } from "@/entities/topic/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { md2, todoStatusText } from "../model/format";
import { neighbors, themeGroups, type GraphNode, type TopicGraph } from "../model/graphModel";
import { themeColorStyle } from "../model/viewHelpers";
import { CheckDot } from "./parts";

export interface GraphSidePanelProps {
  graph: TopicGraph;
  structured: TopicStructured;
  selected: GraphNode | null;
  kindLabel: (k: GraphNode["k"]) => string;
  entryText: (id: string) => string | null;
  onHighlight: (ids: string[] | null) => void;
  onPick: (id: string) => void;
  onClear: () => void;
  onOpenEntry: (id: string) => void;
  onOpenDoc: () => void;
}

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * 연결 옆 칸. 고른 점이 없으면 큰 주제별 자료(시안 gDefault GP=3): 마우스를 올리거나 포커스하면 그 무리가 밝아지고,
 * 누르거나 Enter 면 그 점을 고른다. 고른 점이 있으면 그 점의 내용(시안 gPanel).
 */
export function GraphSidePanel(p: GraphSidePanelProps) {
  const { t } = useTranslation();
  const { graph, structured, selected: n } = p;
  const hl = (ids: string[]) => ({
    "data-ghl": ids.join(" "),
    tabIndex: 0,
    onMouseEnter: () => p.onHighlight(ids),
    onMouseLeave: () => p.onHighlight(null),
    onFocus: () => p.onHighlight(ids),
    onBlur: () => p.onHighlight(null),
    onClick: () => p.onPick(ids[0]),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        p.onPick(ids[0]);
      }
    },
    role: "button" as const,
  });

  if (!n) {
    const groups = themeGroups(graph, structured);
    return (
      <aside className="tvg-p gp3" aria-label={t("topic.v.graph.panel")}>
        <h4>{t("topic.v.graph.groups", { n: groups.length })}</h4>
        {groups.map((g) => (
          <section key={g.key} style={themeColorStyle(g.index)}>
            <h5 {...hl(g.ids)}>
              <span className="sw" />
              {g.name}
              <small>{t("topic.v.graph.groupCount", { e: g.entries, t: g.todos })}</small>
            </h5>
            <p>
              {g.members.map((m) => (
                <span key={m.id} {...hl([m.id])}>
                  {short(m.lb, 16)}
                </span>
              ))}
              {g.more ? <em>{t("topic.v.graph.more", { n: g.more })}</em> : null}
            </p>
          </section>
        ))}
      </aside>
    );
  }

  const head = (
    <>
      <div className="ph">
        <span className="k" style={n.color ? ({ "--c": n.color } as CSSProperties) : undefined}>
          <i className={`k-${n.k}${n.st === "not-start" ? " open" : ""}`} />
          {p.kindLabel(n.k)}
        </span>
        <button type="button" className="q-ib" aria-label={t("topic.v.graph.clear")} onClick={p.onClear}>
          <X size={15} strokeWidth={ICON_STROKE} />
        </button>
      </div>
      <h4>{n.lb}</h4>
    </>
  );

  let body = null;
  if (n.k === "tp") {
    body = (
      <>
        <p>{structured.summary}</p>
        <button type="button" className="q-bt" onClick={p.onOpenDoc}>
          {t("topic.v.view.doc")}
        </button>
      </>
    );
  } else if (n.k === "th") {
    const th = structured.themes.find((x) => x.key === n.th);
    body = th ? (
      <>
        <p>{th.summary}</p>
        <ol className="tv-its" style={themeColorStyle(n.c ?? 0)}>
          {[...th.items]
            .sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0))
            .map((it, i) => (
              <li key={i}>
                <time>{md2(it.dateKey)}</time>
                <span>{it.text}</span>
              </li>
            ))}
        </ol>
      </>
    ) : null;
  } else if (n.k === "e" && n.ref) {
    const text = p.entryText(n.ref);
    const byId = new Map(graph.nodes.map((x) => [x.id, x]));
    const ths = [...neighbors(graph, n.id)].map((id) => byId.get(id)!).filter((m) => m && m.k === "th");
    body = (
      <>
        {n.d ? <p className="k2">{md2(n.d)}</p> : null}
        {text ? <p>{text.length > 150 ? `${text.slice(0, 150)}…` : text}</p> : null}
        {ths.length ? (
          <ul className="ths">
            {ths.map((m) => (
              <li key={m.id} style={themeColorStyle(m.c ?? 0)}>
                <i />
                <span>{m.lb}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <button type="button" className="q-bt" onClick={() => p.onOpenEntry(n.ref!)}>
          {t("topic.v.more.open")}
        </button>
      </>
    );
  } else if (n.k === "t" && n.st) {
    body = (
      <>
        {n.d ? <p className="k2">{md2(n.d)}</p> : null}
        <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CheckDot status={n.st} />
          {todoStatusText(t, n.st)}
        </p>
      </>
    );
  } else if (n.k === "c") {
    body = (
      <>
        <p className="k2">{t("topic.v.graph.commitOf", { date: n.d ? md2(n.d) : "" })}</p>
        {n.from ? (
          <button type="button" className="q-bt" onClick={() => p.onOpenEntry(n.from!)}>
            {t("topic.v.more.open")}
          </button>
        ) : null}
      </>
    );
  }

  return (
    <aside className="tvg-p" aria-label={t("topic.v.graph.picked")}>
      {head}
      {body}
    </aside>
  );
}
