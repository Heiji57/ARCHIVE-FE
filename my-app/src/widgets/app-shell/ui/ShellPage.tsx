import type { ReactNode } from "react";
import { useShell } from "../model/shellSlots";
import { RightPanelHost } from "./RightPanelHost";
import { RightRail } from "./RightRail";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export interface ShellPageProps {
  /** 사이드바 가운데 내용(로고와 접기 버튼, 아래 사용자 메뉴 사이). */
  sidebar?: ReactNode;
  /** 상단 왼쪽 도구 막대(오늘 버튼, 제목, 보기 고르기 등). 오른쪽 탭과 검색 버튼은 셸이 그린다. */
  toolbar?: ReactNode;
  /** 오른쪽 줄(패널 버튼, 알림 벨)과 오른쪽 패널을 보일지. 캘린더와 할 일만 true. */
  rail?: boolean;
  /** 오른쪽 패널 맨 위 제목(예: "11월 3일 화요일"). AI 추천 탭에서는 탭이 자기 제목을 그린다. */
  panelTitle?: ReactNode;
  children?: ReactNode;
}

/**
 * 페이지 바깥 틀. 페이지는 이것으로 감싸고 슬롯을 채운다.
 * 배치: [사이드바 | 상단 막대 / 본문 | 오른쪽 패널 | 오른쪽 줄]
 */
export function ShellPage({ sidebar, toolbar, rail = false, panelTitle, children }: ShellPageProps) {
  const { collapsed } = useShell();
  return (
    <div className="sh-app" data-collapsed={collapsed ? "true" : undefined} data-rail={rail ? "true" : undefined}>
      <Sidebar>{sidebar}</Sidebar>
      <TopBar>{toolbar}</TopBar>
      <main className="sh-main" id="main">
        {children}
      </main>
      {rail ? (
        <>
          <RightPanelHost title={panelTitle} />
          <RightRail />
        </>
      ) : null}
    </div>
  );
}
