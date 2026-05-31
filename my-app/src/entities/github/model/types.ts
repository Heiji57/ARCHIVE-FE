export interface TrackedRepository {
  id: string;
  name: string;
  enabled: boolean;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  enabled: boolean;
  /** GitHub 연결 버튼을 누른 시각. 끊고 다시 연결하면 새 시각으로 덮어쓴다. */
  connectedAt: string | null;
  lastSyncedAt: string | null;
  connectedAs?: string;
  targetRepository?: string;
  permissions?: string[];
  trackedRepositories?: TrackedRepository[];
  autoRetrospectiveEnabled?: boolean;
}
