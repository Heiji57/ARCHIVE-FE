import { useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type {
  SummaryKind,
  SummaryReadiness,
} from "@/entities/summary/model/types";
import { ConfirmModal } from "@/shared/ui/confirm-modal/ConfirmModal";
import { EmptyState } from "@/shared/ui/empty-state/EmptyState";
import { useTranslation } from "@/shared/lib/i18n";
import { useRetroFilter } from "../model/useRetroFilter";
import { RetroEditor } from "./RetroEditor";
import { RetroSidebar } from "./RetroSidebar";

export function RetrospectiveStudio() {
  const {
    state,
    updateEntry,
    createDailyEntry,
    pushNotification,
    startSummary,
    checkSummaryReadiness,
    isDemo,
  } = useArchiveApp();
  const { t } = useTranslation();
  const todayDateKey = useTodayKey();

  // 데이터 부족 시 확인 다이얼로그 상태
  const [readinessDialog, setReadinessDialog] = useState<{
    kind: SummaryKind;
    target: string;
    readiness: SummaryReadiness;
  } | null>(null);

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

  const handleSummarize = async (kind: SummaryKind) => {
    const target = active?.dateKey ?? todayDateKey;
    // weekly 는 점검 생략. monthly/annual 은 데이터 밀도 점검 후 분기.
    const readiness = await checkSummaryReadiness(kind);
    if (readiness && readiness.recommendation === "insufficient") {
      setReadinessDialog({ kind, target, readiness });
      return;
    }
    startSummary(kind, target);
  };

  const confirmReadinessGenerate = () => {
    if (!readinessDialog) return;
    startSummary(readinessDialog.kind, readinessDialog.target);
    setReadinessDialog(null);
  };

  const handleNewDaily = () => {
    const dateKey = todayDateKey;
    const { entry, existed } = createDailyEntry(
      dateKey,
      // POST 응답의 서버 ID 로 교체되면 selectedId 를 즉시 갱신한다.
      // (로컬 ID 가 stale 되어 에디터가 빈 화면을 보이지 않게 함)
      (serverEntry) => setSelectedId(serverEntry.id),
    );
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
        onSummarize={(kind) => void handleSummarize(kind)}
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

      {readinessDialog ? (
        <ConfirmModal
          open
          title={t("retro.readiness.title")}
          message={
            <span style={{ whiteSpace: "pre-line" }}>
              {t(
                readinessDialog.kind === "yearly"
                  ? "retro.readiness.annualMessage"
                  : "retro.readiness.monthlyMessage",
                {
                  covered: readinessDialog.readiness.coveredUnits,
                  expected: readinessDialog.readiness.expectedUnits,
                  year: new Date(
                    readinessDialog.readiness.periodStart,
                  ).getFullYear(),
                },
              )}
            </span>
          }
          confirmLabel={t("retro.readiness.generate")}
          cancelLabel={t("retro.readiness.writeMore")}
          onConfirm={confirmReadinessGenerate}
          onCancel={() => setReadinessDialog(null)}
        />
      ) : null}
    </div>
  );
}
