import { type FormEvent, useState } from "react";
import type { AuthRoute } from "@/app/router/authRoute";

interface LandingFooterProps {
  onNavigateAuth: (route: AuthRoute, params?: { email?: string }) => void;
  onDemo: () => void;
}

export function LandingCTA({ onNavigateAuth, onDemo }: LandingFooterProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNavigateAuth("signup", { email: email.trim() });
  };

  return (
    <section className="lp-cta-section" id="pricing">
      <h2 className="lp-cta-title">오늘부터, 당신의 하루를 기록하세요</h2>
      <p className="lp-cta-sub">1인 개발자에게 언제까지나 무료입니다. 첫 회고를 30초 만에.</p>
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
      <button type="button" className="lp-demo-btn" onClick={onDemo}>
        데모 둘러보기
      </button>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <p className="lp-footer-logo">A.R.C.H.I.V.E</p>
          <p className="lp-footer-tagline">
            매일의 작업과 회고를 GitHub와 한 흐름으로 묶어내는,<br />
            개발자를 위한 다크모드 아카이브.
          </p>
          <p className="lp-footer-meta">@rangkim · v3.0</p>
        </div>

        <div className="lp-footer-links">
          <div className="lp-footer-col">
            <p className="lp-footer-col-title">제품</p>
            {["캘린더", "할 일", "회고", "설정"].map((t) => (
              <span key={t} className="lp-footer-link">{t}</span>
            ))}
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-col-title">워크플로우</p>
            {["GitHub 연동", "AI 자동 회고", "마크다운 내보내기", "단축키"].map((t) => (
              <span key={t} className="lp-footer-link">{t}</span>
            ))}
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-col-title">리소스</p>
            {["API 문서", "변경 내역", "릴리스 노트"].map((t) => (
              <span key={t} className="lp-footer-link">{t}</span>
            ))}
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-col-title">스튜디오</p>
            {["소개", "개인정보", "이용약관", "문의"].map((t) => (
              <span key={t} className="lp-footer-link">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <span>© 2026 A.R.C.H.I.V.E Studio. 모든 회고는 사용자의 GitHub 계정에 안전하게 보관됩니다.</span>
        <span>Built on dark · Built for one developer at a time.</span>
      </div>
    </footer>
  );
}
