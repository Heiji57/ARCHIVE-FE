import { useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type { SummaryKind } from "@/entities/summary/model/types";
import { EmptyState } from "@/shared/ui/empty-state/EmptyState";
import { useTranslation } from "@/shared/lib/i18n";
import { useRetroFilter } from "../model/useRetroFilter";
import { RetroEditor } from "./RetroEditor";
import { RetroSidebar } from "./RetroSidebar";

export function RetrospectiveStudio() {
  const { state, updateEntry, createDailyEntry, pushNotification, startSummary, isDemo } =
    useArchiveApp();
  const { t } = useTranslation();
  const todayDateKey = useTodayKey();

  /** 데모 모드: GitHub 동기화 등 외부 의존성 차단 + "로그인" 액션 토스트. 차단 시 true. */
  const requireLoginInDemo = (): boolean => {
    if (!isDemo) return false;
    pushNotification("info", t("demo.locked.title"), t("demo.locked.message"), {
      actionLabel: t("demo.locked.action"),
      actionHref: "/login",
    });
    return true;
  };

  const filterState = useRetroFilter(state.entries);
  const { filteredEntries } = filterState;

  const [selectedId, setSelectedId] = useState<string | null>(
    () => filteredEntries[0]?.id ?? null,
  );

  const active =
    state.entries.find((e) => e.id === selectedId) ??
    filteredEntries[0] ??
    null;

  const completedTodos = useMemo(
    () =>
      active
        ? state.todos.filter(
            (todoItem) =>
              todoItem.dateKey === active.dateKey &&
              todoItem.status === "done",
          )
        : [],
    [state.todos, active],
  );

  // 서버 모델: 연결 상태 + login + push target
  const isGithubConnected = state.github.status === "connected";
  const { login, pushTargetRepositoryId, linkedRepositories } = state.github;
  const pushTargetRepo = linkedRepositories.find(
    (r) => r.id === pushTargetRepositoryId,
  );
  const githubConnectedAs =
    login ?? pushTargetRepo?.owner ?? state.currentUser?.displayName ?? "github";

  const handleSave = () => {
    if (!active) return;
    if (requireLoginInDemo()) return;
    if (!isGithubConnected) return;
    // RetroEditor 내에서 pushRetrospective 가 호출되고 성공 시 여기로 옴 → synced 마킹
    updateEntry(active.id, { synced: true });
  };

  const handleSummarize = (kind: SummaryKind) => {
    const target = active?.dateKey ?? todayDateKey;
    startSummary(kind, target);
  };

  const handleNewDaily = () => {
    const dateKey = todayDateKey;
    const { entry, existed } = createDailyEntry(dateKey);
    if (existed) {
      pushNotification("info", t("retro.newDaily.duplicate"), dateKey);
    } else {
      pushNotification("success", t("retro.newDaily.created"), dateKey);
    }
    filterState.setRetroFilter("daily");
    setSelectedId(entry.id);
  };

  return (
    <div className="page retro-page">
      <RetroSidebar
        filterState={filterState}
        active={active}
        onSelect={setSelectedId}
        onSummarize={handleSummarize}
        onNewDaily={handleNewDaily}
      />

      <main>
        {active ? (
          <RetroEditor
            key={active.id}
            entry={active}
            completedTodos={completedTodos}
            githubConnectedAs={githubConnectedAs}
            isGithubConnected={isGithubConnected}
            pushTargetRepositoryId={pushTargetRepositoryId}
            onUpdate={(patch) => updateEntry(active.id, patch)}
            onSave={handleSave}
          />
        ) : (
          <EmptyState message={t("retro.empty")} minHeight={360} fontSize={14} />
        )}
      </main>
    </div>
  );
}
