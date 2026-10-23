import { useState } from "react";
import { Link2Off, RefreshCw, TriangleAlert } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { endOfMonth, startOfMonth, toDateKey } from "@/shared/lib/date";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import { integrationErrorMessageKey } from "@/shared/api";
import { ConnectButton } from "./ConnectButton";
import { ReconnectPanel } from "./ReconnectPanel";
import { ServiceMark } from "./ServiceMark";
import { SettingsCardHeader } from "./SettingsCardHeader";
import { FlowTag, ToggleRow } from "./ToggleRow";

export function CalendarCard() {
  const { state, connectCalendar, disconnectCalendar, syncCalendar, pushNotification, setCalendarAutoPushTodo, setCalendarAutoDeleteTodo } =
    useArchiveApp();
  const { t, locale } = useTranslation();
  const { status, lastSyncedAt } = state.calendar;
  const calendarAutoPushTodo = state.settings.calendarAutoPushTodo;
  const calendarAutoDeleteTodo = state.settings.calendarAutoDeleteTodo;

  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [autoDeleteConfirmOpen, setAutoDeleteConfirmOpen] = useState(false);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    const result = await connectCalendar();
    setConnecting(false);
    if (!result.ok && result.error && result.error !== "popup-closed") {
      // connect/init(v2) 의 세분화 코드는 전용 안내, 그 외(콜백 v1 코드 등)는 기존 문구
      const errorKey = integrationErrorMessageKey(result.error);
      pushNotification(
        "warning",
        t("settings.section.calendar"),
        errorKey ? t(errorKey) : t("settings.calendar.connectFailed"),
        { category: "sync", transient: true },
      );
    }
  };

  const handleSync = async () => {
    if (busy) return;
    setBusy(true);
    // 설정 화면에서는 현재 월을 기본 범위로 동기화한다(최대 62일 제한 준수).
    const now = new Date();
    const result = await syncCalendar(
      toDateKey(startOfMonth(now)),
      toDateKey(endOfMonth(now)),
    );
    setBusy(false);
    if (result.ok) {
      pushNotification(
        "success",
        t("settings.section.calendar"),
        t("settings.calendar.synced"),
        { category: "sync", transient: true },
      );
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    setBusy(true);
    const result = await disconnectCalendar();
    setBusy(false);
    if (result.ok) {
      pushNotification(
        "info",
        t("settings.section.calendar"),
        t("settings.calendar.disconnected"),
        { category: "sync", transient: true },
      );
    }
  };

  const formatShort = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  const lastSyncedLabel = lastSyncedAt
    ? formatShort(lastSyncedAt)
    : t("settings.calendar.lastSyncedNever");

  const trailing =
    status === "connected" ? (
      <Pill tone="green">
        <span className="pill-dot" aria-hidden="true" />
        {t("settings.calendar.connected")}
      </Pill>
    ) : status === "needs-reauth" ? (
      <Pill tone="warn">
        <span className="pill-dot" aria-hidden="true" />
        {t("settings.calendar.needsReauth")}
      </Pill>
    ) : status === "unknown" ? (
      <Pill tone="ghost">{t("settings.calendar.checking")}</Pill>
    ) : (
      <Pill tone="outline">{t("settings.calendar.notConnected")}</Pill>
    );

  const isLinked = status === "connected" || status === "needs-reauth";

  // 연결 전에는 같은 옵션을 꺼진 상태로 미리 보여준다(연결하면 쓸 수 있는 것).
  const options = (
    <>
      <p className="toggle-group-label">{t("settings.calendar.syncGroup")}</p>
      <ToggleRow
        id="calendar-auto-push"
        label={t("settings.calendar.autoPushTodo")}
        description={isLinked ? t("settings.calendar.autoPushTodoDesc") : undefined}
        checked={isLinked && calendarAutoPushTodo}
        onChange={setCalendarAutoPushTodo}
        disabled={!isLinked}
      >
        <FlowTag from="ARCHIVE" to="Google" label={t("settings.calendar.flowToGoogle")} />
      </ToggleRow>
      <ToggleRow
        id="calendar-auto-delete"
        label={t("settings.calendar.autoDeleteTodo")}
        description={isLinked ? t("settings.calendar.autoDeleteTodoDesc") : undefined}
        checked={isLinked && calendarAutoDeleteTodo}
        onChange={(next) => {
          if (next) {
            setAutoDeleteConfirmOpen(true);
          } else {
            setAutoDeleteConfirmOpen(false);
            setCalendarAutoDeleteTodo(false);
          }
        }}
        disabled={!isLinked}
      >
        <FlowTag from="Google" to="ARCHIVE" label={t("settings.calendar.flowFromGoogle")} />
        {isLinked && calendarAutoDeleteTodo ? (
          <p className="toggle-row-warn">
            <TriangleAlert size={12} aria-hidden="true" />
            {t("settings.calendar.autoDeleteTodoOn")}
          </p>
        ) : null}
        {isLinked && autoDeleteConfirmOpen && !calendarAutoDeleteTodo ? (
          <div className="toggle-row-confirm" role="group" aria-labelledby="calendar-auto-delete-confirm">
            <span id="calendar-auto-delete-confirm">
              {t("settings.calendar.autoDeleteTodoConfirmMsg")}
            </span>
            <span className="toggle-row-confirm-actions">
              <button
                type="button"
                className="btn btn-utility btn-quiet"
                onClick={() => setAutoDeleteConfirmOpen(false)}
              >
                {t("settings.calendar.autoDeleteTodoConfirmCancel")}
              </button>
              <button
                type="button"
                className="btn btn-utility"
                onClick={() => {
                  setCalendarAutoDeleteTodo(true);
                  setAutoDeleteConfirmOpen(false);
                }}
              >
                {t("settings.calendar.autoDeleteTodoConfirmOk")}
              </button>
            </span>
          </div>
        ) : null}
      </ToggleRow>
    </>
  );

  return (
    <section className="settings-card">
      <SettingsCardHeader
        mark={<ServiceMark service="calendar" />}
        eyebrow={t("settings.section.integrations")}
        title="Google Calendar"
        trailing={trailing}
      />

      {status === "unknown" ? (
        <p className="github-empty">{t("settings.calendar.checking")}</p>
      ) : isLinked ? (
        <>
          {/* 연결 상태는 헤더 Pill 로 표시. 내부 Google 계정 식별자는 노출하지 않는다. */}
          {status === "needs-reauth" ? (
            <ReconnectPanel
              title={t("settings.calendar.reauthBanner")}
              message={
                lastSyncedAt
                  ? t("settings.calendar.reauthBannerMsg", { date: formatShort(lastSyncedAt) })
                  : t("settings.calendar.reauthBannerMsgNever")
              }
              actionLabel={
                connecting ? t("settings.calendar.connecting") : t("settings.calendar.reconnect")
              }
              onAction={() => void handleConnect()}
              disabled={connecting}
            />
          ) : (
            <p className="integration-meta">
              {t("settings.calendar.lastSynced")} · {lastSyncedLabel}
            </p>
          )}

          {options}

          <div className="integration-foot">
            {/* 재인증이 필요하면 동기화는 실패하므로 숨긴다. */}
            {status === "connected" ? (
              <button
                type="button"
                className="btn btn-utility settings-action-btn"
                onClick={() => void handleSync()}
                disabled={busy}
              >
                <RefreshCw
                  size={13}
                  style={
                    busy
                      ? { animation: "summary-spin 900ms linear infinite" }
                      : undefined
                  }
                />{" "}
                {busy ? t("settings.calendar.syncing") : t("settings.calendar.sync")}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn btn-utility btn-quiet settings-action-btn"
              onClick={() => void handleDisconnect()}
              disabled={busy}
            >
              <Link2Off size={13} /> {t("settings.calendar.disconnect")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="integration-lead">{t("settings.calendar.connectHint")}</p>
          {options}
          <div className="integration-foot">
            <ConnectButton
              service="calendar"
              label={
                connecting ? t("settings.calendar.connecting") : t("settings.calendar.connect")
              }
              note={t("settings.calendar.connectNote")}
              onClick={() => void handleConnect()}
              disabled={connecting}
            />
          </div>
        </>
      )}
    </section>
  );
}
