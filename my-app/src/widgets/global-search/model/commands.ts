import { useEffect, useRef, useSyncExternalStore } from "react";
import type { TranslationKey } from "@/shared/lib/i18n";

/** 명령 팔레트의 "명령" 한 줄. */
export interface PaletteCommand {
  id: string;
  labelKey: TranslationKey;
  /** 오른쪽에 보이는 단축키 글자(예: "N", "Ctrl ,"). */
  hint?: string;
  /** 작을수록 위. 시안 순서: 새 할 일 10, 오늘로 이동 20, 주간 30, 월간 40, 오늘 회고 50, 하루 닫기 60, 설정 70. */
  order: number;
  run: () => void;
}

const commands = new Map<string, PaletteCommand>();
const listeners = new Set<() => void>();
let snapshot: PaletteCommand[] = [];

function emit() {
  snapshot = [...commands.values()].sort((a, b) => a.order - b.order);
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * 컴포넌트가 마운트돼 있는 동안 명령을 팔레트에 올린다(언마운트하면 내린다).
 * 화면마다 그 화면에서만 되는 명령(예: 캘린더의 "주간 보기")을 이렇게 등록한다.
 * run 은 최신 값을 쓰므로 매 렌더 새 함수를 넘겨도 된다.
 */
export function useRegisterPaletteCommand(cmd: PaletteCommand | null): void {
  const latest = useRef(cmd);
  useEffect(() => {
    latest.current = cmd;
  });
  const id = cmd?.id;
  const labelKey = cmd?.labelKey;
  const hint = cmd?.hint;
  const order = cmd?.order;
  useEffect(() => {
    if (!id || !labelKey || order === undefined) return;
    const entry: PaletteCommand = { id, labelKey, hint, order, run: () => latest.current?.run() };
    commands.set(id, entry);
    emit();
    return () => {
      if (commands.get(id) === entry) {
        commands.delete(id);
        emit();
      }
    };
  }, [id, labelKey, hint, order]);
}

/** 지금 등록된 명령(order 순). */
export function usePaletteCommands(): PaletteCommand[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}
