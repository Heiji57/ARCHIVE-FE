import { useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type {
  SummaryKind,
  SummaryReadiness,
} from "@/entities/summary/model/types";
import { fromDateKey } from "@/shared/lib/date";
import { ConfirmModal } from "@/shared/ui/confirm-modal/ConfirmModal";
import { EmptyState } from "@/shared/ui/empty-state/EmptyState";
import { useTranslation } from "@/shared/lib/i18n";
import { useRetroFilter } from "../model/useRetroFilter";
import { PeriodPickerModal } from "./PeriodPickerModal";
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
    checkRetroExists,
    isDemo,
  } = useArchiveApp();
  const { t } = useTranslation();
  const todayDateKey = useTodayKey();
  const todayDate = useMemo(() => fromDateKey(todayDateKey), [todayDateKey]);

  // 기간 선택 모달 상태 (열린 요약 종류; null = 닫힘)
  const [pickerKind, setPickerKind] = useState<SummaryKind | null>(null);

  // 데이터 부족 시 확인 다이얼로그 상태
  const [readinessDialog, setReadinessDialog] = useState<{
    kind: SummaryKind;
    target: string;
    periodStart: string;
    readiness: SummaryReadiness;
    /** 덮어쓰기 확인을 거쳐 강제 재생성하는 경우 true. */
    force: boolean;
  } | null>(null);

  // 이미 요약된 회고록 덮어쓰기 확인 다이얼로그 상태
  const [overwriteDialog, setOverwriteDialog] = useState<{
    kind: SummaryKind;
    periodStart: string;
    anchorDateKey: string;
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

  // 서버 모델: 연결 상태 + login + push target + verified emails
  const isGithubConnected = state.github.status === "connected";
  const { login, pushTargetRepositoryId, linkedRepositories, hasVerifiedEmails } =
    state.github;
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

  // [요약] 버튼 클릭 → 기간 선택 모달을 연다.
  const handleSummarize = (kind: SummaryKind) => {
    if (requireLoginInDemo()) return;
    setPickerKind(kind);
  };

  // 기간 확정 → 이미 요약된 회고록이 있으면 덮어쓰기 확인, 없으면 바로 진행.
  const handlePeriodPicked = async (
    periodStart: string,
    periodEnd: string,
    anchorDateKey: string,
  ) => {
    const kind = pickerKind;
    setPickerKind(null);
    if (!kind) return;
    const exists = await checkRetroExists(kind, periodStart, periodEnd);
    if (exists) {
      setOverwriteDialog({ kind, periodStart, anchorDateKey });
      return;
    }
    await proceedSummary(kind, periodStart, anchorDateKey);
  };

  // 데이터 밀도 점검(monthly/yearly) 후 요약 생성. 부족하면 확인 다이얼로그.
  // force=true 면 이미 완료된 기간도 강제 재생성(덮어쓰기 확인을 거친 경우).
  const proceedSummary = async (
    kind: SummaryKind,
    periodStart: string,
    anchorDateKey: string,
    force = false,
  ) => {
    const readiness = await checkSummaryReadiness(kind, periodStart);
    if (readiness && readiness.recommendation === "insufficient") {
      setReadinessDialog({
        kind,
        target: anchorDateKey,
        periodStart,
        readiness,
        force,
      });
      return;
    }
    startSummary(kind, anchorDateKey, periodStart, force);
  };

  // 덮어쓰기 확인 → 강제 재생성(force=true).
  const confirmOverwrite = () => {
    if (!overwriteDialog) return;
    const { kind, periodStart, anchorDateKey } = overwriteDialog;
    setOverwriteDialog(null);
    void proceedSummary(kind, periodStart, anchorDateKey, true);
  };

  const confirmReadinessGenerate = () => {
    if (!readinessDialog) return;
    startSummary(
      readinessDialog.kind,
      readinessDialog.target,
      readinessDialog.periodStart,
      readinessDialog.force,
    );
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
            hasVerifiedEmails={hasVerifiedEmails}
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

      {pickerKind ? (
        <PeriodPickerModal
          key={pickerKind}
          kind={pickerKind}
          today={todayDate}
          onPick={(periodStart, periodEnd, anchorDateKey) =>
            void handlePeriodPicked(periodStart, periodEnd, anchorDateKey)
          }
          onCancel={() => setPickerKind(null)}
        />
      ) : null}

      {overwriteDialog ? (
        <ConfirmModal
          open
          title={t("retro.overwrite.title")}
          message={
            <span style={{ whiteSpace: "pre-line" }}>
              {t("retro.overwrite.message")}
            </span>
          }
          confirmLabel={t("retro.overwrite.confirm")}
          cancelLabel={t("retro.overwrite.cancel")}
          onConfirm={confirmOverwrite}
          onCancel={() => setOverwriteDialog(null)}
        />
      ) : null}
    </div>
  );
}
