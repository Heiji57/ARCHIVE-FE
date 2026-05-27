import { useCallback, useEffect, useRef, useState } from "react";

const RESEND_COOLDOWN_SECONDS = 60;

export interface UseEmailVerificationResult {
  cooldownLeft: number;
  startCooldown: () => void;
  resetCooldown: () => void;
}

/** 60초 재전송 쿨다운 타이머. */
export function useEmailVerification(): UseEmailVerificationResult {
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const tickRef = useRef<number | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    setCooldownLeft(RESEND_COOLDOWN_SECONDS);
    stopTick();
    tickRef.current = window.setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          stopTick();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTick]);

  const resetCooldown = useCallback(() => {
    stopTick();
    setCooldownLeft(0);
  }, [stopTick]);

  useEffect(() => stopTick, [stopTick]);

  return { cooldownLeft, startCooldown, resetCooldown };
}
