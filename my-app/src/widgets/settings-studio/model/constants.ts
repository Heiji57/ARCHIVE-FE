import type { GitHubConfig } from "@/entities/github/model/types";

/** Demo GitHub config seeded when the user clicks Connect in Settings. */
export const DEMO_GITHUB: GitHubConfig = {
  token: "",
  owner: "developer",
  repo: "my-daily-retrospectives",
  enabled: true,
  lastSyncedAt: new Date().toISOString(),
  connectedAs: "developer",
  targetRepository: "developer/my-daily-retrospectives",
  permissions: ["Read Commits", "Write to Repositories"],
  trackedRepositories: [
    { id: "repo-1", name: "archive-backend", enabled: true },
    { id: "repo-2", name: "archive-frontend", enabled: true },
  ],
  autoRetrospectiveEnabled: true,
};
