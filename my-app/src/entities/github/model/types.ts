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
  lastSyncedAt: string | null;
  connectedAs?: string;
  targetRepository?: string;
  permissions?: string[];
  trackedRepositories?: TrackedRepository[];
  autoRetrospectiveEnabled?: boolean;
}
