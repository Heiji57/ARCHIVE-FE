import { useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { isDemoMode } from "@/shared/lib/demoMode";
import { useTranslation } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { DEMO_PROFILE } from "../model/demo";
import { createStore } from "../model/store";
import { useToast } from "../model/useToast";
import { Btn } from "./controls";
import { Card, MoreRow, Row, Sub } from "./Row";
import type { RowViewProps } from "./rowTypes";

/** 데모 이름(화면 안 상태). 실제 모드는 currentUser.displayName 과 PATCH /auth/me. */
const demoName = createStore(DEMO_PROFILE.name);

function useProfileName(): [string, (v: string) => void] {
  const { state, updateProfile } = useArchiveApp();
  const demo = demoName.use();
  if (isDemoMode() && !state.currentUser) return [demo, (v) => demoName.set(v)];
  return [state.currentUser?.displayName ?? "", (v) => updateProfile({ displayName: v })];
}

export function NameRow() {
  const { t } = useTranslation();
  const toast = useToast();
  const avatar = useServerFeature("avatar");
  const [name, setName] = useProfileName();
  const [draft, setDraft] = useState(name);
  const commit = () => {
    const v = draft.trim();
    if (v && v !== name) setName(v);
    else setDraft(name);
  };
  return (
    <Row
      id="name"
      wide
      title={avatar ? t("settingsSheet.row.name.t") : t("settingsSheet.acct.nameOnly")}
      desc={t("settingsSheet.row.name.d")}
    >
      <div className="sx-prof">
        <span className="sx-av" aria-hidden="true">
          {(draft.trim()[0] ?? "?").toUpperCase()}
        </span>
        <input
          className="sx-in"
          value={draft}
          maxLength={30}
          aria-label={t("settingsSheet.acct.nameOnly")}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
        />
        {avatar ? <Btn onClick={() => toast(t("settingsSheet.soon"))}>{t("settingsSheet.acct.photo")}</Btn> : null}
      </div>
    </Row>
  );
}

export function EmailRow() {
  const { state } = useArchiveApp();
  const { t } = useTranslation();
  const user = state.currentUser;
  const demo = isDemoMode() && !user;
  const via = demo
    ? t("settingsSheet.acct.via.google")
    : user?.oauthProvider === "google"
      ? t("settingsSheet.acct.via.google")
      : user?.oauthProvider === "github"
        ? t("settingsSheet.acct.via.github")
        : t("settingsSheet.acct.via.email");
  return (
    <Row id="email" title={t("settingsSheet.row.email.t")} desc={via}>
      <span className="sx-val">{demo ? DEMO_PROFILE.email : (user?.email ?? "")}</span>
    </Row>
  );
}

export function LogoutRow() {
  const { state, logout } = useArchiveApp();
  const { t } = useTranslation();
  // 데모(로그인 전)는 서버 로그아웃을 부르지 않고 로그인 화면으로(사용자 메뉴와 같게).
  if (isDemoMode() && !state.currentUser) {
    return (
      <Row id="logout" title={t("settingsSheet.row.logout.t")} desc={t("settingsSheet.acct.via.demo")}>
        <Btn onClick={() => window.location.assign("/login")}>{t("settingsSheet.acct.login")}</Btn>
      </Row>
    );
  }
  return (
    <Row id="logout" title={t("settingsSheet.row.logout.t")} desc={t("settingsSheet.row.logout.d")}>
      <Btn onClick={logout}>{t("settingsSheet.row.logout.t")}</Btn>
    </Row>
  );
}

export function DeleteRow({ force }: RowViewProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const on = useServerFeature("accountDelete");
  const [name] = useProfileName();
  const [typed, setTyped] = useState("");
  if (!on) return null;
  return (
    <MoreRow id="delete" danger defaultOpen={force} title={t("settingsSheet.row.delete.t")} desc={t("settingsSheet.row.delete.d")}>
      <div className="sx-danger">
        <label>
          <span>
            {t("settingsSheet.acct.delA")} <b>{name}</b> {t("settingsSheet.acct.delB")}
          </span>
          <input className="sx-in" value={typed} autoComplete="off" onChange={(e) => setTyped(e.target.value)} />
        </label>
        <Btn
          kind="danger"
          disabled={!name || typed !== name}
          onClick={() => {
            // 서버에 계정 삭제가 없다(accountDelete). 데모에서만 보이고 지우지 않는다.
            toast(t("settingsSheet.acct.delDemo"));
            setTyped("");
          }}
        >
          {t("settingsSheet.acct.delBtn")}
        </Btn>
      </div>
    </MoreRow>
  );
}

export function SectionAccount() {
  const { t } = useTranslation();
  const del = useServerFeature("accountDelete");
  return (
    <>
      <Card>
        <NameRow />
        <EmailRow />
        <LogoutRow />
      </Card>
      {del ? (
        <>
          <Sub>{t("settingsSheet.more")}</Sub>
          <Card>
            <DeleteRow />
          </Card>
        </>
      ) : null}
    </>
  );
}
