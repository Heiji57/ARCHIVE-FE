import type { DemoStep } from "../model/demoScript";

interface ProgressLineProps {
  steps: DemoStep[];
  /** 현재까지 완료된 단계 (0-based). done=true 면 steps.length. */
  stepIdx: number;
  done: boolean;
}

/**
 * 진행 세그먼트 바 + 현재 단계 문구 (aiv ap2 스타일).
 */
export function ProgressLine({ steps, stepIdx, done }: ProgressLineProps) {
  const currentStep = !done && stepIdx >= 0 && stepIdx < steps.length
    ? steps[stepIdx]
    : null;

  return (
    <div className="ap2-run" aria-live="polite">
      <div className="ap-seg" style={{ "--n": steps.length } as React.CSSProperties}>
        {steps.map((_, j) => (
          <i
            key={j}
            className={done || j < stepIdx ? "ok" : j === stepIdx ? "on" : ""}
          />
        ))}
      </div>
      <span>
        {done
          ? "다 됐어요"
          : stepIdx < 0
          ? "생각하는 중"
          : currentStep?.label ?? ""}
      </span>
    </div>
  );
}
