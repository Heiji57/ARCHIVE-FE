import { type FormEvent, useState } from "react";
import type { AuthRoute } from "@/app/router/authRoute";

interface LandingHeroProps {
  onNavigateAuth: (route: AuthRoute, params?: { email?: string }) => void;
  onDemo: () => void;
}

export function LandingHero({ onNavigateAuth, onDemo }: LandingHeroProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNavigateAuth("signup", { email: email.trim() });
  };

  return (
    <section className="lp-hero">
      {/* background glow */}
      <div className="lp-hero-glow" aria-hidden="true" />

      <div className="lp-hero-content">
        <span className="lp-badge">
          <span className="lp-badge-dot" />
          v3.0 · AI 자동 회고가 도착했습니다
        </span>

        <h1 className="lp-hero-title">
          흩어진 하루가<br />
          저절로 정리되는 곳
        </h1>

        <p className="lp-hero-sub">
          일정과 할 일, 그리고 하루의 회고. 따로 놀던 기록들이 하나의 흐름으로
          이어지고, 매일의 커밋과 함께 GitHub 저장소에 자동으로 보관됩니다.
        </p>

        <form className="lp-email-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="lp-email-input"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary lp-email-btn">
            무료로 시작 →
          </button>
        </form>

        <button
          type="button"
          className="lp-demo-btn"
          onClick={onDemo}
        >
          데모 둘러보기
        </button>

        <p className="lp-social-proof">
          신용카드 불필요 · 1인 개발자에게 무료 · 30초면 첫 기록
        </p>
      </div>

      {/* Calendar mockup */}
      <div className="lp-hero-mockup" aria-hidden="true">
        <div className="lp-mockup-bar">
          <span className="lp-mockup-url">archive.app / calendar</span>
          <span className="lp-mockup-sync">Synced · 8m</span>
        </div>
        <div className="lp-mockup-eyebrow">PLANNING CANVAS</div>
        <div className="lp-mockup-cal-header">
          <span className="lp-mockup-month">2023년 10월</span>
          <div className="lp-mockup-views">
            <span className="lp-mockup-view-active">1 Week</span>
            <span className="lp-mockup-view">1 Month</span>
          </div>
        </div>
        <div className="lp-mockup-cal-grid">
          {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((d) => (
            <div key={d} className="lp-cal-day-label">{d}</div>
          ))}
          {CAL_CELLS.map((cell, i) => (
            <div key={i} className={`lp-cal-cell${cell.today ? " lp-cal-today" : ""}`}>
              <span className="lp-cal-num">{cell.num}</span>
              {cell.tasks?.map((task, j) => (
                <span key={j} className="lp-cal-task">{task}</span>
              ))}
              {cell.more ? <span className="lp-cal-more">+{cell.more}개 더 보기</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CAL_CELLS: Array<{
  num: number;
  today?: boolean;
  tasks?: string[];
  more?: number;
}> = [
  { num: 22 }, { num: 23 }, { num: 24 },
  { num: 25, today: true, tasks: ["Sub-header 작업", "프롬프트 다듬기"], more: 1 },
  { num: 26, tasks: ["토큰 검수"] },
  { num: 27, tasks: ["주간 회고"] },
  { num: 28, tasks: ["리포 정리"] },
  { num: 29 }, { num: 30 }, { num: 31 },
];
