import type { CSSProperties } from "react";
import type { TopicView } from "./useTopicStudioData";

/** 주제 색 변수(--k 글자, --kw 바탕) */
export const topicColorStyle = (c: number) =>
  ({ "--k": `var(--tpc${c + 1})`, "--kw": `var(--tpw${c + 1})` }) as CSSProperties;

/** 큰 주제 색 변수(--c) */
export const themeColorStyle = (i: number) => ({ "--c": `var(--th${(i % 4) + 1})` }) as CSSProperties;

/** 정리됐고 구조화 결과가 있는지(시안 org) */
export const isOrganized = (v: TopicView) => v.status === "completed" && !!v.structured;
