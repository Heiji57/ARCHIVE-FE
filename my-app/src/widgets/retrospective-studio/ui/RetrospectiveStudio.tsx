import { useMemo, useState } from "react";
import { DEMO_ANCHOR_DATE_KEY } from "@/app/config/demo";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { SummaryKind } from "@/entities/summary/model/types";
import { EmptyState } from "@/shared/ui/empty-state/EmptyState";
import { todayKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { useRetroFilter } from "../model/useRetroFilter";
import { RetroEditor } from "./RetroEditor";
import { RetroSidebar } from "./RetroSidebar";

export function RetrospectiveStudio() {
  const { state, updateEntry, createDailyEntry, pushNotification, startSummary, isDemo } =
    useArchiveApp();
  const { t } = useTranslation();

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

  // 서버 모델: 연결 상태 + 연결된 저장소 목록(첫 저장소를 표시용 대상으로 사용)
  const isGithubConnected = state.github.status === "connected";
  const firstRepo = state.github.linkedRepositories[0];
  const githubConnectedAs =
    firstRepo?.owner ?? state.currentUser?.displayName ?? "github";
  const githubTargetRepo = firstRepo?.name ?? "archive-journal";

  const handleSave = () => {
    if (!active) return;
    if (requireLoginInDemo()) return; // GitHub 동기화는 외부 의존성
    if (!isGithubConnected) return;
    updateEntry(active.id, { synced: true });
    pushNotification(
      "success",
      t("retro.editor.synced"),
      `${active.title} · @${githubConnectedAs}/${githubTargetRepo}`,
      { category: "sync" },
    );
  };

  const handleSummarize = (kind: SummaryKind) => {
    const target = active?.dateKey ?? DEMO_ANCHOR_DATE_KEY;
    startSummary(kind, target);
  };

  const handleNewDaily = () => {
    const dateKey = todayKey();
    const { entry, existed } = createDailyEntry(dateKey);
    if (existed) {
      pushNotification("info", t("retro.newDaily.duplicate"), dateKey);
    } else {
      pushNotification("success", t("retro.newDaily.created"), dateKey);
    }
    // 일간 탭으로 전환하고 해당 항목 선택
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
            githubTargetRepo={githubTargetRepo}
            isGithubConnected={isGithubConnected}
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
