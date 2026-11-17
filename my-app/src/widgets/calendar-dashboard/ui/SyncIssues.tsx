import { useTranslation } from "@/shared/lib/i18n";

export interface SyncIssue {
  kind: "gcal" | "gh";
  /** 아래 작은 글자(실패한 할 일 제목들 등). */
  detail: string;
  fix(): void;
}

function GoogleCalendarMark() {
  return (
    <svg className="cal-br cal-br-gc" viewBox="0 0 24 24" aria-hidden="true">
      <path className="w" d="M6 6h12v12H6z" />
      <path className="b" d="M3 0h15v6H6v12H0V3a3 3 0 0 1 3-3z" />
      <path className="y" d="M18 0h3a3 3 0 0 1 3 3v15h-6z" />
      <path className="g" d="M6 18h12v6H6z" />
      <path className="d" d="M0 18h6v6H3a3 3 0 0 1-3-3z" />
      <path className="r" d="M18 18h6l-6 6z" />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg className="cal-br cal-br-gh" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

/** 연동 문제(시안 3번: 서비스 아이콘 + 바로 고치기). 고칠 것이 있을 때만 보인다. */
export function SyncIssues({ issues }: { issues: SyncIssue[] }) {
  const { t } = useTranslation();
  if (issues.length === 0) return null;
  return (
    <section aria-label={t("cal.sync.title")} className="cal-probs">
      <h2 className="cal-sh2">{t("cal.sync.title")}</h2>
      {issues.map((x) => (
        <div key={x.kind} className="cal-pb3">
          <span className="cal-pb3-i">
            {x.kind === "gcal" ? <GoogleCalendarMark /> : <GithubMark />}
            <i aria-hidden="true">!</i>
          </span>
          <span className="cal-pb3-t">
            <b>{t(x.kind === "gcal" ? "cal.sync.gcal" : "cal.sync.gh")}</b>
            <small>{x.detail}</small>
          </span>
          <button type="button" onClick={x.fix}>
            {t(x.kind === "gcal" ? "cal.sync.gcalAct" : "cal.sync.ghAct")}
          </button>
        </div>
      ))}
    </section>
  );
}
