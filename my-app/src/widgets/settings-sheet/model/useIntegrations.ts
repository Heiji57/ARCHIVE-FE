import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { CalendarStatus } from "@/entities/calendar/model/types";
import type { AvailableRepository, GitHubStatus, LinkedRepository } from "@/entities/github/model/types";
import { integrationErrorMessageKey, isApiError, oauthErrorMessageKey } from "@/shared/api";
import { endOfMonth, startOfMonth, toDateKey } from "@/shared/lib/date";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useTranslation } from "@/shared/lib/i18n";
import { DEMO_REPOS } from "./demo";
import { createStore } from "./store";
import { useToast } from "./useToast";

/**
 * 연동(GitHub, Google Calendar) 상태와 동작을 한 모양으로.
 * 실제 모드는 기존 settings-studio 의 GithubCard, CalendarCard 동작 그대로(AppProvider).
 * 데모는 서버를 부르지 않고 화면 안 상태로만 바꾼다(시안처럼 GitHub 연결 + 이메일 권한 경고, 캘린더 연결).
 */
export interface Integrations {
  gh: {
    status: GitHubStatus;
    login: string | null;
    repos: LinkedRepository[];
    pushTarget: string | null;
    /** 경고: 이메일 권한 없음(구 scope) 또는 저장소 권한 부족 */
    warn: null | "email" | "denied";
  };
  cal: { status: CalendarStatus; lastSyncedAt: string | null };
  autoPush: boolean;
  autoDel: boolean;
  busy: null | "gh" | "cal" | "gh-connect" | "cal-connect";
  connectGh(): Promise<void>;
  syncGh(): Promise<void>;
  unlinkAll(): void;
  setRepoRead(id: string, on: boolean): void;
  unlinkRepo(id: string): void;
  loadAvailable(): Promise<AvailableRepository[]>;
  linkRepo(githubRepoId: number): Promise<void>;
  setPush(id: string | null): void;
  connectCal(): Promise<void>;
  syncCal(): Promise<void>;
  disconnectCal(): Promise<void>;
  setAutoPush(v: boolean): void;
  setAutoDel(v: boolean): void;
}

interface DemoLink {
  gh: boolean;
  verified: boolean;
  repos: LinkedRepository[];
  push: string | null;
  cal: boolean;
  calSynced: string;
  autoPush: boolean;
  autoDel: boolean;
}

const demoStore = createStore<DemoLink>({
  gh: true,
  verified: false,
  repos: DEMO_REPOS,
  push: null,
  cal: true,
  calSynced: new Date().toISOString(),
  autoPush: false,
  autoDel: false,
});

const DEMO_AVAILABLE: AvailableRepository[] = [
  { githubRepoId: 9101, owner: "developer", name: "dotfiles", fullName: "developer/dotfiles", isPrivate: false, defaultBranch: "main", htmlUrl: "https://github.com/developer/dotfiles" },
];

/** 실제 모드에서 화면 사이(카드, 세부 줄, AI 도구 줄)에 같이 보는 순간 상태. */
const uiStore = createStore<{ busy: Integrations["busy"]; denied: boolean }>({ busy: null, denied: false });

export function useIntegrations(): Integrations {
  const app = useArchiveApp();
  const { t } = useTranslation();
  const toast = useToast();
  const demo = demoStore.use();
  const ui = uiStore.use();
  const setBusy = (busy: Integrations["busy"]) => uiStore.set((s) => ({ ...s, busy }));

  if (isDemoMode()) {
    const set = (p: Partial<DemoLink>) => demoStore.set((s) => ({ ...s, ...p }));
    const fakeSync = (k: "gh" | "cal", msg: string) =>
      new Promise<void>((done) => {
        setBusy(k);
        window.setTimeout(() => {
          setBusy(null);
          if (k === "cal") set({ calSynced: new Date().toISOString() });
          toast(msg, "success");
          done();
        }, 1200);
      });
    return {
      gh: {
        status: demo.gh ? "connected" : "not-connected",
        login: demo.gh ? "developer" : null,
        repos: demo.gh ? demo.repos : [],
        pushTarget: demo.push,
        warn: demo.gh && !demo.verified ? "email" : null,
      },
      cal: { status: demo.cal ? "connected" : "not-connected", lastSyncedAt: demo.calSynced },
      autoPush: demo.autoPush,
      autoDel: demo.autoDel,
      busy: ui.busy,
      async connectGh() {
        if (demo.gh) set({ verified: true });
        else set({ gh: true });
        toast(demo.gh ? t("settingsSheet.link.permGot") : t("settingsSheet.link.connected"), "success");
      },
      syncGh: () => fakeSync("gh", t("settingsSheet.link.ghSynced")),
      unlinkAll: () => set({ repos: [], push: null }),
      setRepoRead: (id, on) => set({ repos: demo.repos.map((r) => (r.id === id ? { ...r, commitReadEnabled: on } : r)) }),
      unlinkRepo: (id) => set({ repos: demo.repos.filter((r) => r.id !== id), push: demo.push === id ? null : demo.push }),
      loadAvailable: async () => DEMO_AVAILABLE.filter((a) => !demo.repos.some((r) => r.githubRepoId === a.githubRepoId)),
      async linkRepo(githubRepoId) {
        const a = DEMO_AVAILABLE.find((x) => x.githubRepoId === githubRepoId);
        if (!a) return;
        set({ repos: [...demo.repos, { ...a, id: `ghrepo_${githubRepoId}`, commitReadEnabled: true, createdAt: new Date().toISOString(), updatedAt: null }] });
      },
      setPush: (id) => set({ push: id }),
      async connectCal() {
        set({ cal: true });
        toast(t("settingsSheet.link.connected"), "success");
      },
      syncCal: () => fakeSync("cal", t("settings.calendar.synced")),
      async disconnectCal() {
        set({ cal: false });
        toast(t("settings.calendar.disconnected"));
      },
      setAutoPush: (v) => set({ autoPush: v }),
      setAutoDel: (v) => set({ autoDel: v }),
    };
  }

  const { state } = app;
  const gh = state.github;
  return {
    gh: {
      status: gh.status,
      login: gh.login,
      repos: gh.linkedRepositories,
      pushTarget: gh.pushTargetRepositoryId,
      warn: gh.status !== "connected" ? null : ui.denied ? "denied" : gh.hasVerifiedEmails ? null : "email",
    },
    cal: { status: state.calendar.status, lastSyncedAt: state.calendar.lastSyncedAt },
    autoPush: state.settings.calendarAutoPushTodo,
    autoDel: state.settings.calendarAutoDeleteTodo,
    busy: ui.busy,
    async connectGh() {
      if (ui.busy) return;
      setBusy("gh-connect");
      const result = await app.linkGitHubAccount();
      setBusy(null);
      const title = t("settings.github.connectAccount");
      if (result.ok) {
        uiStore.set((s) => ({ ...s, denied: false }));
        toast(title, "success", t("settings.github.connected"));
      } else if (result.error && result.error !== "popup-closed" && result.error !== "demo") {
        const already = result.error === "account-already-linked" || result.error === "provider-already-linked";
        const key = oauthErrorMessageKey(result.error);
        toast(
          title,
          "warning",
          already ? t("settings.github.alreadyLinked") : key && key !== "auth.oauth.error.generic" ? t(key) : t("settings.github.connectFailed"),
        );
      }
    },
    async syncGh() {
      if (ui.busy) return;
      setBusy("gh");
      await app.syncAllGitHubRepos();
      setBusy(null);
    },
    unlinkAll: () => app.unlinkAllGitHubRepos(),
    setRepoRead: (id, on) => app.updateLinkedRepo(id, on),
    unlinkRepo: (id) => app.unlinkGitHubRepo(id),
    async loadAvailable() {
      try {
        const list = await app.loadGitHubAvailableRepos();
        uiStore.set((s) => ({ ...s, denied: false }));
        return list;
      } catch (e) {
        if (isApiError(e) && e.code === "GITHUB_PERMISSION_DENIED") uiStore.set((s) => ({ ...s, denied: true }));
        const key = isApiError(e) ? integrationErrorMessageKey(e.code) : null;
        if (key) toast(t("settings.section.github"), "warning", t(key));
        return [];
      }
    },
    linkRepo: (id) => app.linkGitHubRepo(id),
    setPush: (id) => app.setPushTarget(id),
    async connectCal() {
      if (ui.busy) return;
      setBusy("cal-connect");
      const result = await app.connectCalendar();
      setBusy(null);
      if (!result.ok && result.error && result.error !== "popup-closed") {
        const key = integrationErrorMessageKey(result.error);
        toast(t("settings.section.calendar"), "warning", key ? t(key) : t("settings.calendar.connectFailed"));
      }
    },
    async syncCal() {
      if (ui.busy) return;
      setBusy("cal");
      // 설정에서는 이번 달을 동기화한다(최대 62일 제한).
      const now = new Date();
      const result = await app.syncCalendar(toDateKey(startOfMonth(now)), toDateKey(endOfMonth(now)));
      setBusy(null);
      if (result.ok) toast(t("settings.section.calendar"), "success", t("settings.calendar.synced"));
    },
    async disconnectCal() {
      if (ui.busy) return;
      setBusy("cal");
      const result = await app.disconnectCalendar();
      setBusy(null);
      if (result.ok) toast(t("settings.section.calendar"), "info", t("settings.calendar.disconnected"));
    },
    setAutoPush: (v) => app.setCalendarAutoPushTodo(v),
    setAutoDel: (v) => app.setCalendarAutoDeleteTodo(v),
  };
}

/** 줄 보이기 판단용: GitHub, 캘린더가 연결돼 있는지. */
export function linkVisibility(i: Integrations) {
  return {
    github: i.gh.status === "connected",
    calendar: i.cal.status === "connected" || i.cal.status === "needs-reauth",
  };
}
