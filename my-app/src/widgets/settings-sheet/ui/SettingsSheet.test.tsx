import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppContext } from "@/app/providers/context";
import { getInitialAppState } from "@/app/model/initialState";
import type { ArchiveAppContextValue } from "@/app/model/types";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { I18nContext } from "@/shared/lib/i18n/context";
import { translate } from "@/shared/lib/i18n";
import { SettingsSheet } from "./SettingsSheet";

/**
 * 실제 모드(데모 아님) 모양: node 에는 window 가 없어 isDemoMode() 가 false → useServerFeature 가 전부 false.
 * 서버에 없는 줄(주 시작, 일하는 시간, 계정 삭제, AI 비서, 내보내기, 휴지통 ...)이 그려지지 않아야 한다.
 */
function render(section: SettingsSection): string {
  const state = getInitialAppState();
  // 빈 함수로 채운 가짜 앱 값(그리기만 확인한다)
  const app = new Proxy({ state, isDemo: false } as unknown as ArchiveAppContextValue, {
    get: (target, key) => (key in target ? target[key as keyof ArchiveAppContextValue] : () => Promise.resolve([])),
  });
  return renderToStaticMarkup(
    <I18nContext.Provider value={{ locale: "ko", t: (k, v) => translate("ko", k, v) }}>
      <AppContext.Provider value={app}>
        <SettingsSheet section={section} onSection={() => {}} onClose={() => {}} />
      </AppContext.Provider>
    </I18nContext.Provider>,
  );
}

describe("SettingsSheet 실제 모드", () => {
  it("섹션 목록에 AI 비서가 없다", () => {
    const html = render("account");
    expect(html).toContain("데이터와 보안");
    expect(html).not.toContain("AI 비서");
  });

  it("계정: 이름(사진 없음), 로그인 계정, 로그아웃만. 계정 삭제와 사진 바꾸기는 없다", () => {
    const html = render("account");
    expect(html).toContain("로그인 계정");
    expect(html).not.toContain("계정 삭제");
    expect(html).not.toContain("사진 바꾸기");
    expect(html).not.toContain("이름과 프로필 사진");
  });

  it("일반: 언어, 국가와 시간대만. 처음 열 화면, 시간 표시는 없다", () => {
    const html = render("general");
    expect(html).toContain("국가와 시간대");
    expect(html).not.toContain("처음 열 화면");
    expect(html).not.toContain("세부 설정");
  });

  it("할 일과 캘린더: 지난 일 표시만. 일하는 시간, 주 시작, 기본 길이, 캘린더와 태그는 없다", () => {
    const html = render("work");
    expect(html).toContain("지난 일 표시");
    for (const s of ["일하는 시간", "주 시작 요일", "기본 길이", "캘린더와 태그"]) expect(html).not.toContain(s);
  });

  it("회고: 하루 마무리 알림, 새 회고 기본 폴더는 없다", () => {
    const html = render("retro");
    expect(html).toContain("회고 템플릿");
    expect(html).toContain("맞춤법 밑줄");
    expect(html).not.toContain("하루 마무리 알림");
    expect(html).not.toContain("새 회고 기본 폴더");
  });

  it("AI 섹션 주소로 와도 첫 섹션(계정)을 보인다", () => {
    const html = render("ai");
    expect(html).not.toContain("빗금이");
    expect(html).toContain("로그인 계정");
  });

  it("알림: 보관 기간만. 알림 종류, 방해 금지, 이메일 요약, 브라우저 알림은 없다", () => {
    const html = render("notify");
    expect(html).toContain("알림 보관 기간");
    for (const s of ["알림 종류", "방해 금지", "이메일 요약", "브라우저 알림"]) expect(html).not.toContain(s);
  });

  it("데이터와 보안: 로그인한 기기만. 내보내기, 휴지통은 없다", () => {
    const html = render("data");
    expect(html).toContain("로그인한 기기");
    expect(html).not.toContain("내보내기");
    expect(html).not.toContain("휴지통");
  });
});
