/**
 * 주제 화면이 셸에 요청하는 경로. Task 1 의 `RetroRouteParams`(app/router/navigation.ts)에
 * area, topicId, topicView 가 더해진 모양과 같다. 셸이 합쳐지면 RetroRouteParams 를 그대로 넘기면 된다.
 */
export interface TopicRouteParams {
  area?: "retro" | "topic";
  topicId?: string;
  topicView?: "doc" | "graph";
  /** 회고 열기: { view: "editor", entryId } */
  view?: "editor" | "gallery";
  entryId?: string;
}
