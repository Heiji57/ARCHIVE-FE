/**
 * GitHub 기능(커밋 칸, 커밋 탭, 동기화 표시)을 보일지. 계정 유형이 아니라 연결 상태로 정한다.
 * GitHubState(entities/github) 를 그대로 넘기면 된다. shared 가 entities 를 import 하지 않도록 모양만 받는다.
 */
export function canUseGithub(github: { status: string }): boolean {
  return github.status === "connected";
}
