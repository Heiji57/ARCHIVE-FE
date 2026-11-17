import type { TopicStructured } from "@/entities/topic/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { spanText } from "../model/format";
import { itemCount, themeCounts, themeSpan } from "../model/structured";
import { themeColorStyle } from "../model/viewHelpers";

/** 큰 주제 거르기 2번(시안 tvTabs TF=2): 테두리 없는 색 점 글자. 고르면 그 큰 주제 설명이 아래에 나온다. */
export function ThemeFilter({
  structured,
  value,
  onChange,
}: {
  structured: TopicStructured;
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const { t } = useTranslation();
  const idx = structured.themes.findIndex((h) => h.key === value);
  const th = idx >= 0 ? structured.themes[idx] : null;
  const c = th ? themeCounts(th) : null;
  return (
    <>
      <div className="tf2" role="group" aria-label={t("topic.v.filter.group")}>
        <button type="button" aria-pressed={!value} onClick={() => onChange(null)}>
          {t("topic.v.filter.all")}
          <small>{itemCount(structured)}</small>
        </button>
        {structured.themes.map((h, i) => (
          <button
            key={h.key}
            type="button"
            style={themeColorStyle(i)}
            aria-pressed={value === h.key}
            onClick={() => onChange(h.key)}
          >
            <i />
            {h.name}
            <small>{h.items.length}</small>
          </button>
        ))}
      </div>
      {th && c ? (
        <div className="ti" style={themeColorStyle(idx)}>
          <b>{th.name}</b>
          <p>{th.summary}</p>
          <span>
            <span>{spanText(themeSpan(th))}</span>
            <span>{t("topic.v.count.entries", { n: c.entries })}</span>
            <span>{t("topic.v.count.todos", { n: c.todos })}</span>
          </span>
        </div>
      ) : null}
    </>
  );
}
