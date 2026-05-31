import type { GitHubConfig } from "@/entities/github/model/types";

/** Demo GitHub config seeded when the user clicks Connect in Settings.
 *  connectedAt / lastSyncedAt 은 포함하지 않는다 — 클릭 시점을 정확히 기록해야 하므로
 *  GithubCard.handleConnect 에서 new Date().toISOString() 으로 주입한다. */
export const DEMO_GITHUB: Omit<GitHubConfig, "connectedAt" | "lastSyncedAt"> = {
  token: "",
  owner: "developer",
  repo: "my-daily-retrospectives",
  enabled: true,
  connectedAs: "developer",
  targetRepository: "developer/my-daily-retrospectives",
  permissions: ["Read Commits", "Write to Repositories"],
  trackedRepositories: [
    { id: "repo-1", name: "archive-backend", enabled: true },
    { id: "repo-2", name: "archive-frontend", enabled: true },
  ],
  autoRetrospectiveEnabled: true,
};
