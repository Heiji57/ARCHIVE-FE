import { useCallback, useEffect, useState } from "react";
import { LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { Session } from "@/entities/session/model/types";
import { Pill } from "@/shared/ui";
import { useTranslation } from "@/shared/lib/i18n";
import { formatRelativeTime } from "@/shared/lib/date";
import { SettingsCardHeader } from "./SettingsCardHeader";

/** 설정 — 활성 세션(로그인된 기기) 목록 + 폐기. */
export function SessionsCard() {
  const {
    state,
    listSessions,
    revokeSession,
    revokeOtherSessions,
    logout,
    pushNotification,
  } = useArchiveApp();
  const { t } = useTranslation();
  const locale = state.settings.locale;

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // 처리 중 sessionId | "others"

  const load = useCallback(() => {
    void listSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [listSessions]);

  // 최초 마운트 시 1회만 조회한다.
  // listSessions 는 컨텍스트 value 의 인라인 함수라 매 렌더 새 참조가 되어,
  // [load] 에 의존하면 앱 상태 변경(예: 템플릿 타이핑)마다 GET /auth/sessions 가
  // 재실행되어 요청이 폭주한다. 세션 목록은 revoke 시 load() 로 수동 갱신한다.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevoke = async (s: Session) => {
    setBusy(s.sessionId);
    const result = await revokeSession(s.sessionId);
    setBusy(null);
    if (!result.ok) return;
    // 현재 세션을 폐기하면 즉시 로그아웃
    if (s.isCurrent) {
      logout();
      return;
    }
    pushNotification("success", t("settings.sessions.revoked"), s.deviceLabel ?? "", {
      category: "system",
      transient: true,
    });
    setSessions((prev) =>
      prev ? prev.filter((x) => x.sessionId !== s.sessionId) : prev,
    );
  };

  const handleRevokeOthers = async () => {
    setBusy("others");
    const result = await revokeOtherSessions();
    setBusy(null);
    if (!result.ok) return;
    pushNotification(
      "success",
      t("settings.sessions.revokedOthersTitle"),
      t("settings.sessions.revokedOthersBody", {
        count: String(result.revokedCount ?? 0),
      }),
      { category: "system", transient: true },
    );
    load();
  };

  const others = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<ShieldCheck size={20} />}
        iconVariant="ink"
        eyebrow={t("settings.section.security")}
        title={t("settings.sessions.title")}
      />

      <div className="github-repo-list">
        {sessions === null ? (
          <p className="github-empty">{t("settings.sessions.loading")}</p>
        ) : sessions.length === 0 ? (
          <p className="github-empty">{t("settings.sessions.empty")}</p>
        ) : (
          sessions.map((s) => (
            <div key={s.sessionId} className="github-repo-row">
              <div
                className="github-repo-meta"
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <MonitorSmartphone
                  size={18}
                  style={{ flexShrink: 0, color: "var(--color-body-muted)" }}
                />
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      fontSize: 16,
                      color: "var(--color-ink)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {s.deviceLabel ?? t("settings.sessions.unknownDevice")}
                    {s.isCurrent ? (
                      <Pill tone="green">{t("settings.sessions.thisDevice")}</Pill>
                    ) : null}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-body-muted)" }}>
                    {s.ipPrefix ? `${s.ipPrefix}.x · ` : ""}
                    {formatRelativeTime(s.lastUsedAt, locale)}
                  </span>
                </span>
              </div>
              <button
                type="button"
                className="btn btn-utility github-repo-unlink"
                onClick={() => void handleRevoke(s)}
                disabled={busy === s.sessionId}
                title={t("settings.sessions.signOut")}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
              >
                <LogOut size={13} />
                {t("settings.sessions.signOut")}
              </button>
            </div>
          ))
        )}
      </div>

      {others.length > 0 ? (
        <button
          type="button"
          className="btn btn-utility settings-action-btn"
          onClick={() => void handleRevokeOthers()}
          disabled={busy === "others"}
          style={{ marginTop: 12 }}
        >
          <LogOut size={13} /> {t("settings.sessions.revokeOthers")}
        </button>
      ) : null}
    </section>
  );
}
