/**
 * 회고 push(동기화) 상태의 로컬 영속화.
 *
 * 백엔드 `EntryResponse` 에는 GitHub push 여부를 나타내는 필드가 없다(api.yaml §EntryResponse).
 * 따라서 "이 회고를 마지막으로 push 한 본문"의 서명(해시)을 브라우저 localStorage 에 보관해,
 * 새로고침/재접속 후에도 동기화 상태를 복원한다.
 *
 * - push 성공 시  → markEntrySynced(id, 본문)
 * - 엔트리 로드 시 → isEntrySynced(id, 본문) 으로 synced 값 결정
 * - 본문이 push 이후 수정되면 해시가 달라져 자동으로 "미동기화(pending)" 가 된다.
 *
 * (정식 해법은 백엔드가 EntryResponse 에 synced/last_pushed_at 을 제공하는 것 — CLAUDE.md §8 간극)
 */
const KEY = "archive.retro.synced.v1";

type Store = Record<string, number>; // entryId -> content hash

/** 줄바꿈/후행 공백 차이를 흡수해 서버 정규화로 인한 오탐을 줄인다. */
function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trimEnd();
}

/** djb2 문자열 해시. */
function hashContent(s: string): number {
  const n = normalize(s);
  let h = 5381;
  for (let i = 0; i < n.length; i++) {
    h = ((h << 5) + h + n.charCodeAt(i)) | 0;
  }
  return h;
}

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // 용량 초과 등은 무시 — 동기화 표시는 부가 기능
  }
}

/** push 성공 직후, 해당 엔트리의 현재 본문을 "동기화됨"으로 기록. */
export function markEntrySynced(id: string, content: string): void {
  const store = read();
  store[id] = hashContent(content);
  write(store);
}

/** 동기화 기록 제거(미동기화로 되돌림). */
export function clearEntrySynced(id: string): void {
  const store = read();
  if (id in store) {
    delete store[id];
    write(store);
  }
}

/** 저장된 서명이 현재 본문과 일치하면 true(=push 이후 미수정). */
export function isEntrySynced(id: string, content: string): boolean {
  const store = read();
  return id in store && store[id] === hashContent(content);
}
