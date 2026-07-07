import { useEffect, useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type { JournalEntry } from "@/entities/entry/model/types";
import type {
  SummaryKind,
  SummaryReadiness,
} from "@/entities/summary/model/types";
import { fromDateKey } from "@/shared/lib/date";
import { can } from "@/shared/lib/permissions";
import { ConfirmModal } from "@/shared/ui/confirm-modal/ConfirmModal";
import { EmptyState } from "@/shared/ui/empty-state/EmptyState";
import { useTranslation } from "@/shared/lib/i18n";
import { useDailyEntriesPage } from "../model/useDailyEntriesPage";
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
    focusTarget,
    clearFocus,
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

  // 일간 회고 목록은 서버 페이지네이션(GET /entries/paginated)으로 조회한다.
  // 주/월/연 요약은 소스(/summaries)가 달라 편집 불가·개수도 적으므로 기존
  // 클라이언트 목록(useRetroFilter)을 그대로 유지한다.
  const isDailyTab = filterState.retroFilter === "daily";
  const dailyPage = useDailyEntriesPage(isDailyTab);
  // 데모/mock 은 서버가 없어 serverMode=false → 클라이언트 목록으로 폴백.
  const useServerList = isDailyTab && dailyPage.serverMode;

  // 서버 페이지 항목(id 순서)을 state.entries 에서 실제 엔트리로 해석한다
  // (편집이 state.entries 를 갱신하면 목록도 즉시 반영된다).
  const dailyPageEntries = useMemo(
    () =>
      dailyPage.ids
        .map((id) => state.entries.find((e) => e.id === id))
        .filter((e): e is JournalEntry => Boolean(e)),
    [dailyPage.ids, state.entries],
  );

  // 사이드바 목록 + 페이저 소스 (일간=서버, 그 외/폴백=클라이언트).
  const listEntries = useServerList ? dailyPageEntries : filterState.pageEntries;
  const currentPage = useServerList ? dailyPage.page : filterState.page + 1;
  const totalPages = useServerList ? dailyPage.totalPages : filterState.totalPages;
  const goPrevPage = () => {
    if (useServerList) dailyPage.setPage(dailyPage.page - 1);
    else filterState.setPage((p) => Math.max(0, p - 1));
  };
  const goNextPage = () => {
    if (useServerList) dailyPage.setPage(dailyPage.page + 1);
    else filterState.setPage((p) => Math.min(filterState.totalPages - 1, p + 1));
  };

  const [selectedId, setSelectedId] = useState<string | null>(
    () => filteredEntries[0]?.id ?? null,
  );

  const active =
    state.entries.find((e) => e.id === selectedId) ??
    listEntries[0] ??
    filteredEntries[0] ??
    null;

  // 전역 검색에서 특정 회고로 이동 요청 → 해당 회고 종류로 필터를 맞추고 선택.
  const { setRetroFilter } = filterState;
  useEffect(() => {
    if (focusTarget?.kind !== "entry") return;
    const target = state.entries.find((e) => e.id === focusTarget.entryId);
    if (target) {
      setRetroFilter(target.retroType);
      setSelectedId(target.id);
    }
    clearFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget, state.entries]);

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
      // POST 응답의 서버 ID 로 교체되면 selectedId 를 갱신하고, 최신 회고가 목록
      // 1페이지 최상단에 나타나도록 서버 목록을 다시 조회한다.
      (serverEntry) => {
        setSelectedId(serverEntry.id);
        dailyPage.setPage(1);
        dailyPage.refetch();
      },
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
        showSyncBadge={can(state.settings.accountType, "github")}
        listEntries={listEntries}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={goPrevPage}
        onNextPage={goNextPage}
        loading={useServerList && dailyPage.loading}
        loadError={useServerList && dailyPage.error}
        // 연/월/주·검색 필터는 /paginated 가 파라미터를 지원하지 않아 일간(서버) 탭에서
        // 비활성화한다. 백엔드가 필터 파라미터를 추가하면 활성화 예정.
        filtersDisabled={useServerList}
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
