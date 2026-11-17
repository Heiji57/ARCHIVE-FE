import type { RetrospectiveType } from "@/entities/entry/model/types";

/**
 * 회고 카드(폴더로 옮기기)와 사이드바 폴더(다른 폴더 안으로 넣기)의 끌어 놓기 kind.
 * 폴더 줄 하나가 두 종류를 모두 받아야 해서 같은 kind 로 묶고 itemType 으로 나눈다.
 */
export const RETRO_DRAG_KIND = "retro-item";

export type RetroDragPayload =
  | { itemType: "entry"; id: string; retroType: RetrospectiveType }
  | { itemType: "folder"; id: string; name: string };
