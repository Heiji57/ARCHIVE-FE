import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { useAiSession } from "../model/useAiSession";
import type { DemoResponse } from "../model/demoScript";
import { HatchCorners } from "./HatchCorners";
import { PromptBar } from "./PromptBar";
import { ResultPreview } from "./ResultPreview";
import "./ai-assistant.css";

const SUGGESTIONS = [
  { key: "todo", labelKey: "ai.home.sug.todo" as const, fill: "내일 오전 10시에 스프린트 회의, 오후 2시에 디자인 리뷰 1시간 추가해줘" },
  { key: "retro", labelKey: "ai.home.sug.retro" as const, ask: "오늘 회고 써줘" },
  { key: "move", labelKey: "ai.home.sug.move" as const, ask: "오늘 못 끝낸 일 내일로 옮겨줘" },
  { key: "meeting", labelKey: "ai.home.sug.meeting" as const, ask: "내일 오전 10시에 스프린트 회의, 11시에 디자인 리뷰 추가해줘" },
] as const;

/**
 * AI 탭 메인 화면.
 * - 빈 상태: 가운데 인사 + 입력창 + 제안 칩
 * - 대화 중: 스레드 + 하단 고정 입력창
 * - 모서리 빗금 배경
 */
export function AiHome() {
  const { t } = useTranslation();
  const { state, send, apply, undo } = useAiSession();
  const [input, setInput] = useState("");
  const [localItems, setLocalItems] = useState<Record<string, { selected: boolean; title: string }>>({});
  const threadRef = useRef<HTMLDivElement>(null);

  const hasMessages = state.turns.length > 0;

  // 새 턴이 추가되면 스레드 맨 아래로 스크롤
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.turns.length, state.turns[state.turns.length - 1]?.stepIdx]);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || state.busy) return;
    send(q);
    setInput("");
  }, [input, state.busy, send]);

  const handleSuggest = useCallback((text: string) => {
    send(text);
    setInput("");
  }, [send]);

  const handleToggle = useCallback((turnId: string, key: string, on: boolean) => {
    setLocalItems((prev) => ({ ...prev, [`${turnId}-${key}`]: { ...prev[`${turnId}-${key}`], selected: on } }));
  }, []);

  const handleTitleChange = useCallback((turnId: string, key: string, title: string) => {
    setLocalItems((prev) => ({ ...prev, [`${turnId}-${key}`]: { ...prev[`${turnId}-${key}`], title } }));
  }, []);

  const getItemsForTurn = useCallback((turnId: string, items: DemoResponse["proposal"]["items"]) => {
    return items.map((item) => {
      const local = localItems[`${turnId}-${item.key}`];
      return {
        ...item,
        selected: local?.selected ?? item.selected,
        title: local?.title ?? item.title,
      };
    });
  }, [localItems]);

  return (
    <div className="ag-page" style={{ position: "relative" }}>
      <HatchCorners />

      {!hasMessages ? (
        /* 빈 화면 */
        <div className="ag-home" style={{ position: "relative", zIndex: 1 }}>
          <div className="ag-home-in">
            <h1 className="ag-hi">{t("ai.home.greeting")}</h1>
            <PromptBar
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={state.busy}
            />
            <div className="ag-sug">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug.key}
                  type="button"
                  onClick={() => handleSuggest("ask" in sug ? sug.ask : sug.fill)}
                >
                  {t(sug.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 대화 스레드 */
        <>
          <div ref={threadRef} className="ag-th" style={{ position: "relative", zIndex: 1 }}>
            <div className="ag-th-in">
              {state.turns.map((turn) => {
                if (!turn.response) return null;
                const items = getItemsForTurn(turn.id, turn.response.proposal.items);
                const turnWithLocalItems = {
                  ...turn,
                  response: { ...turn.response, proposal: { ...turn.response.proposal, items } },
                };
                return (
                  <ResultPreview
                    key={turn.id}
                    turn={turnWithLocalItems}
                    onToggle={(key, on) => handleToggle(turn.id, key, on)}
                    onTitleChange={(key, title) => handleTitleChange(turn.id, key, title)}
                    onApply={(pickedKeys) => apply(turn.id, pickedKeys)}
                    onUndo={() => undo(turn.id)}
                    onRedo={() => {
                      send(turn.query);
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="ag-dock" style={{ position: "relative", zIndex: 1 }}>
            <PromptBar
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={state.busy}
              placeholder={t("ai.thread.placeholder")}
            />
          </div>
        </>
      )}
    </div>
  );
}
