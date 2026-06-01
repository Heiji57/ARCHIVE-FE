interface LandingFeaturesProps {
  onDemoTodos: () => void;
  onDemoRetro: () => void;
  onDemoSettings: () => void;
}

export function LandingFeatures({
  onDemoTodos,
  onDemoRetro,
  onDemoSettings,
}: LandingFeaturesProps) {
  return (
    <>
      {/* ── Workflow ─────────────────────────────────────── */}
      <section id="workflow" className="lp-section">
        <p className="lp-section-eyebrow">ONE WORKFLOW</p>
        <h2 className="lp-section-title">세 개의 화면, 하나의 흐름</h2>
        <p className="lp-section-sub">
          계획하고, 정리하고, 되돌아보는 일을 한 자리에서.
          각 화면은 서로 끊기지 않고 자연스럽게 이어집니다.
        </p>

        <div id="features" className="lp-feature-grid">
          <FeatureCard
            eyebrow="PLANNING CANVAS"
            title="캘린더"
            body="주간·월간 일정과 작업 카드를 한 화면에서. 카드를 누르면 우측에서 디테일이 펼쳐지고, 오늘은 언제나 액션 블루로 강조됩니다."
          />
          <FeatureCard
            eyebrow="EDITORIAL KANBAN"
            title="할 일"
            body="자연어로 적는 순간 칸반에 정렬됩니다. 시작 전 · 진행 중 · 완료, 세 열로 하루의 흐름을 한눈에 정리하세요."
          />
          <FeatureCard
            eyebrow="WRITING LEDGER"
            title="회고"
            body="완료한 작업과 오늘의 커밋이 자동으로 모입니다. 배운 점만 적으면, 나머지는 GitHub 저장소에 안전하게 동기화됩니다."
          />
        </div>
      </section>

      {/* ── Quick Capture ─────────────────────────────────── */}
      <section className="lp-section lp-section-alt" id="kanban">
        <div className="lp-split">
          <div className="lp-split-text">
            <p className="lp-section-eyebrow">QUICK CAPTURE</p>
            <h2 className="lp-section-title">적는 순간, 보드에 정렬됩니다</h2>
            <p className="lp-section-sub">
              떠오른 일을 한 줄로 적으면 됩니다. 날짜를 비워두면 오늘로, 적으면
              그 날짜의 캘린더로 — 입력하는 즉시 알맞은 자리를 찾아갑니다.
            </p>
            <button type="button" className="lp-link-btn" onClick={onDemoTodos}>
              칸반 체험하기 →
            </button>
          </div>
          <div className="lp-kanban-mockup" aria-hidden="true">
            <KanbanMockup />
          </div>
        </div>
      </section>

      {/* ── GitHub Sync ──────────────────────────────────── */}
      <section className="lp-section" id="sync">
        <div className="lp-split lp-split-reverse">
          <div className="lp-split-text">
            <p className="lp-section-eyebrow">GITHUB SYNC</p>
            <h2 className="lp-section-title">회고는 커밋과 함께 보관됩니다</h2>
            <p className="lp-section-sub">
              추적할 저장소만 골라두면, 그날의 커밋이 회고에 자동으로 묶입니다.
              기록은 흩어지지 않고 당신의 GitHub 계정에 그대로 남습니다.
            </p>
            <button type="button" className="lp-link-btn" onClick={onDemoRetro}>
              연동 살펴보기 →
            </button>
          </div>
          <div className="lp-commits-mockup" aria-hidden="true">
            <CommitsMockup />
          </div>
        </div>
      </section>

      {/* ── AI Auto-Retrospective ────────────────────────── */}
      <section className="lp-section lp-section-alt" id="ai">
        <div className="lp-split">
          <div className="lp-split-text">
            <p className="lp-section-eyebrow">AI AUTO-RETROSPECTIVE</p>
            <h2 className="lp-section-title">
              주간 요약은,<br />묻지 않아도 도착합니다
            </h2>
            <p className="lp-section-sub">
              매주 일요일 자정 · 매월 말일 · 매년 마지막 날. 그동안의 흐름을
              AI가 스스로 정리해 마크다운 요약으로 만들고, 토스트로 살며시 알려드립니다.
            </p>
            <button type="button" className="lp-link-btn" onClick={onDemoSettings}>
              템플릿 편집기 보기 →
            </button>
          </div>
          <div className="lp-summary-mockup" aria-hidden="true">
            <SummaryMockup />
          </div>
        </div>
      </section>

      {/* ── Quote ────────────────────────────────────────── */}
      <section className="lp-quote-section">
        <blockquote className="lp-quote">
          &ldquo;도구와 트렌드는 바뀌어도, 남겨둔 기록은 사라지지 않는다.
          하루의 끝에서 모든 것이 한 자리에 모인다.&rdquo;
          <cite>— A.R.C.H.I.V.E의 설계 원칙</cite>
        </blockquote>
      </section>
    </>
  );
}

function FeatureCard({
  eyebrow, title, body,
}: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="lp-feature-card">
      <p className="lp-feature-eyebrow">{eyebrow}</p>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-body">{body}</p>
    </div>
  );
}

function KanbanMockup() {
  return (
    <div className="lp-mockup-panel">
      <div className="lp-kb-cols">
        {[
          { label: "시작 전", items: ["OAuth 콜백 점검", "다크 토큰 검수"] },
          { label: "진행 중", items: ["Sub-header 작업", "프롬프트 다듬기"] },
          { label: "완료", items: ["캐시 전략 정리", "와이어프레임"] },
        ].map((col) => (
          <div key={col.label} className="lp-kb-col">
            <p className="lp-kb-col-label">{col.label}</p>
            {col.items.map((item) => (
              <div key={item} className="lp-kb-card">{item}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitsMockup() {
  const commits = [
    { repo: "archive-app", msg: "feat(calendar): sticky sub-header", sha: "8f23c41" },
    { repo: "archive-app", msg: "fix(toast): auto-dismiss timing", sha: "1a44b09" },
    { repo: "design-tokens", msg: "chore: bump dark palette", sha: "c0a8d1e" },
  ];
  return (
    <div className="lp-mockup-panel">
      <p className="lp-mockup-label">retrospectives · 오늘의 커밋</p>
      {commits.map((c) => (
        <div key={c.sha} className="lp-commit-row">
          <span className="lp-commit-repo">{c.repo}</span>
          <span className="lp-commit-msg">{c.msg}</span>
          <span className="lp-commit-sha">{c.sha}</span>
        </div>
      ))}
      <p className="lp-commit-sync">@rangkim/archive-journal 에 동기화됨</p>
    </div>
  );
}

function SummaryMockup() {
  return (
    <div className="lp-mockup-panel lp-summary-card">
      <p className="lp-mockup-label">주간 기록 요약 · 자동 생성됨</p>
      <p className="lp-summary-heading"># 이번 주의 흐름</p>
      <p className="lp-summary-body">
        관찰한 흐름 — 캘린더와 회고를 잇는 작업에 시간이 집중되었습니다.
      </p>
      <p className="lp-summary-stats">완료 11건 · 커밋 34개 · 회고 5회</p>
      <p className="lp-summary-next">→ backdrop-filter 모바일 성능 점검</p>
    </div>
  );
}
