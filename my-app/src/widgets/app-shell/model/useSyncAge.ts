import { useEffect, useState } from "react";
import type { TranslationKey } from "@/shared/lib/i18n";
import { useTranslation } from "@/shared/lib/i18n";

/** 단위별 임계값 (밀리초) */
const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

type Unit = "m" | "h" | "d" | "M" | "Y";

interface AgeInfo {
  value: number;
  unit: Unit;
  chipSuffix: string;    // e.g. "3h", "2d", "1M"
  tooltipKey: TranslationKey;
}

function calcAge(elapsedMs: number): AgeInfo {
  if (elapsedMs < HOUR_MS) {
    const n = Math.max(1, Math.round(elapsedMs / MIN_MS));
    return { value: n, unit: "m", chipSuffix: `${n}m`, tooltipKey: "sync.ago.m" };
  }
  if (elapsedMs < DAY_MS) {
    const n = Math.max(1, Math.round(elapsedMs / HOUR_MS));
    return { value: n, unit: "h", chipSuffix: `${n}h`, tooltipKey: "sync.ago.h" };
  }
  if (elapsedMs < MONTH_MS) {
    const n = Math.max(1, Math.round(elapsedMs / DAY_MS));
    return { value: n, unit: "d", chipSuffix: `${n}d`, tooltipKey: "sync.ago.d" };
  }
  if (elapsedMs < YEAR_MS) {
    const n = Math.max(1, Math.round(elapsedMs / MONTH_MS));
    return { value: n, unit: "M", chipSuffix: `${n}M`, tooltipKey: "sync.ago.M" };
  }
  const n = Math.max(1, Math.round(elapsedMs / YEAR_MS));
  return { value: n, unit: "Y", chipSuffix: `${n}Y`, tooltipKey: "sync.ago.Y" };
}

/** 단위에 맞춰 자동 갱신하는 인터벌(ms) */
function refreshInterval(unit: Unit): number {
  switch (unit) {
    case "m": return MIN_MS;
    case "h": return HOUR_MS;
    default:  return DAY_MS;
  }
}

/**
 * GitHub 최초 연결 시각(connectedAt)을 기준으로 경과 시간을 계산한다.
 * - 연결 해제 후 재연결하면 connectedAt 이 갱신되어 타이머가 리셋된다.
 * - 자동 갱신: 분 단위일 때 1분마다, 시간 단위일 때 1시간마다, 그 이상 1일마다.
 */
export function useSyncAge(connectedAt: string | null): {
  chip: string;
  title: string;
} | null {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!connectedAt) return;
    const elapsed = now - new Date(connectedAt).getTime();
    const age = calcAge(Math.max(0, elapsed));
    const interval = refreshInterval(age.unit);

    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [connectedAt, now]);

  if (!connectedAt) return null;

  const elapsed = Math.max(0, now - new Date(connectedAt).getTime());
  const age = calcAge(elapsed);

  return {
    chip: t("sync.synced", { n: age.chipSuffix }),
    title: t(age.tooltipKey, { n: age.value }),
  };
}
