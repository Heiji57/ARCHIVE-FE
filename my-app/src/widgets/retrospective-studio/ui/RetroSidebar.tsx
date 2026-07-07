import { ChevronLeft, ChevronRight, Plus, Search, Sparkles } from "lucide-react"
import type { JournalEntry } from "@/entities/entry/model/types"
import type { SummaryKind } from "@/entities/summary/model/types"
import { useTodayKey } from "@/app/providers/useToday"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { useTranslation } from "@/shared/lib/i18n"
import { MONTHS, RETRO_FILTERS } from "../model/constants"
import type { UseRetroFilterResult } from "../model/useRetroFilter"
import { RetroListItem } from "./RetroListItem"

export interface RetroSidebarProps {
  filterState: UseRetroFilterResult
  active: JournalEntry | null
  onSelect: (id: string) => void
  onSummarize: (kind: SummaryKind) => void
  onNewDaily: () => void
  /** GitHub 동기화 상태 배지(연결됨/연결 안 됨) 표시 여부 — 개발자 계정만 true. */
  showSyncBadge: boolean
  /** 렌더할 목록(일간=서버 페이지, 그 외=클라이언트). 상위에서 결정해 주입. */
  listEntries: JournalEntry[]
  /** 현재 페이지(1-based). */
  currentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  /** 서버 목록 로딩 중. */
  loading?: boolean
  /** 서버 목록 로드 실패. */
  loadError?: boolean
  /** 연/월/주·검색 필터 비활성 여부(서버 파라미터 미지원 → 백엔드 추가 대기). */
  filtersDisabled: boolean
}

export function RetroSidebar({
  filterState,
  active,
  onSelect,
  onSummarize,
  onNewDaily,
  showSyncBadge,
  listEntries,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  loading = false,
  loadError = false,
  filtersDisabled,
}: RetroSidebarProps) {
  const todayDateKey = useTodayKey()
  const { t } = useTranslation()
  const {
    retroFilter,
    setRetroFilter,
    search,
    setSearch,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    weekFilter,
    setWeekFilter,
    years,
    weeks,
  } = filterState

  return (
    <aside
      style={{
        background: "var(--color-tile-1)",
        border: "1px solid var(--color-divider-soft)",
        borderRadius: "var(--r-xl)",
        padding: "22px 18px 18px",
        height: "fit-content",
        position: "static",
        top: 200,
      }}>
      <p
        className="t-eyebrow"
        style={{ margin: "0 0 6px", color: "var(--color-body-muted)" }}>
        {t("retro.history")}
      </p>
      <h3
        style={{
          margin: "0 0 6px",
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}>
        {t("retro.archive")}
      </h3>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          color: "var(--color-body-muted)",
          lineHeight: 1.5,
        }}>
        {t("retro.archiveDescription")}
      </p>

      {/* 오늘의 일일 회고 작성 버튼 */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={onNewDaily}
        style={{ width: "100%", marginBottom: 14, justifyContent: "center" }}>
        <Plus size={14} />
        {t("retro.newDaily")}
      </button>

      {/* Type tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
          background: "var(--color-tile-3)",
          borderRadius: "var(--r-pill)",
          padding: 3,
          marginBottom: 14,
        }}>
        {RETRO_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setRetroFilter(f.id)}
            style={{
              padding: "7px 4px",
              borderRadius: "var(--r-pill)",
              fontSize: 12,
              fontWeight: 500,
              background:
                retroFilter === f.id ? "var(--color-tile-4)" : "transparent",
              color:
                retroFilter === f.id
                  ? "var(--color-ink)"
                  : "var(--color-body-muted)",
            }}>
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Year/month/week select row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          marginBottom: 12,
          opacity: filtersDisabled ? 0.5 : 1,
        }}>
        <select
          className="select"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          disabled={filtersDisabled}
          title={t("retro.filter.year")}>
          <option value="all">{t("retro.filter.allYears")}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          disabled={filtersDisabled}
          title={t("retro.filter.month")}>
          <option value="all">{t("retro.filter.allMonths")}</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={weekFilter}
          onChange={(e) => setWeekFilter(e.target.value)}
          disabled={filtersDisabled}
          title={t("retro.filter.week")}>
          <option value="all">{t("retro.filter.allWeeks")}</option>
          {weeks.map((w) => (
            <option key={w} value={w}>
              W{w}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "var(--color-tile-3)",
          borderRadius: "var(--r-pill)",
          border: "1px solid var(--color-divider-soft)",
          marginBottom: filtersDisabled ? 6 : 14,
          opacity: filtersDisabled ? 0.5 : 1,
        }}>
        <Search size={14} style={{ color: "var(--color-body-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={filtersDisabled}
          placeholder={t("retro.search")}
          style={{ flex: 1, fontSize: 13, minWidth: 0 }}
        />
      </div>

      {/* 필터 비활성 안내 — /paginated 가 검색·기간 파라미터를 아직 지원하지 않음 */}
      {filtersDisabled ? (
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 11,
            color: "var(--color-body-muted)",
            lineHeight: 1.4,
          }}>
          {t("retro.filter.pendingHint")}
        </p>
      ) : null}

      {/* Entry list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: 420,
          overflow: "auto",
        }}>
        {loadError ? (
          <EmptyState message={t("retro.list.loadError")} />
        ) : loading && listEntries.length === 0 ? (
          <EmptyState message={t("retro.list.loading")} />
        ) : listEntries.length === 0 ? (
          <EmptyState message={t("retro.empty")} />
        ) : (
          listEntries.map((e) => (
            <RetroListItem
              key={e.id}
              entry={e}
              isActive={e.id === active?.id}
              isToday={e.dateKey === todayDateKey}
              onSelect={onSelect}
              showSyncBadge={showSyncBadge}
            />
          ))
        )}
      </div>

      {/* Pager (currentPage 는 1-based) */}
      {totalPages > 1 ? (
        <div className="pager">
          <button
            type="button"
            className="pager-btn"
            disabled={currentPage <= 1 || loading}
            onClick={onPrevPage}>
            <ChevronLeft size={12} /> {t("retro.pager.prev")}
          </button>
          <span>
            {t("retro.pager.page", {
              current: currentPage,
              total: totalPages,
            })}
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={currentPage >= totalPages || loading}
            onClick={onNextPage}>
            {t("retro.pager.next")} <ChevronRight size={12} />
          </button>
        </div>
      ) : null}

      {/* Summary actions */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
        <button
          type="button"
          className="btn btn-utility"
          onClick={() => onSummarize("weekly")}
          style={{ fontSize: 12, padding: "8px 12px" }}>
          <Sparkles size={12} /> {t("retro.summarize.weekly")}
        </button>
        <button
          type="button"
          className="btn btn-utility"
          onClick={() => onSummarize("monthly")}
          style={{ fontSize: 12, padding: "8px 12px" }}>
          <Sparkles size={12} /> {t("retro.summarize.monthly")}
        </button>
        <button
          type="button"
          className="btn btn-utility"
          onClick={() => onSummarize("yearly")}
          style={{ fontSize: 12, padding: "8px 12px" }}>
          <Sparkles size={12} /> {t("retro.summarize.yearly")}
        </button>
      </div>
    </aside>
  )
}
