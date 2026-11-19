import { useTranslation } from "@/shared/lib/i18n";
import { ProgressLine } from "./ProgressLine";
import { ProposalTable } from "./ProposalTable";
import type { AiTurn } from "../model/useAiSession";
import type { ProposalItem } from "../model/proposal";

interface ResultPreviewProps {
  turn: AiTurn;
  onToggle: (key: string, on: boolean) => void;
  onTitleChange: (key: string, title: string) => void;
  onApply: (pickedKeys: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function statusLabel(turn: AiTurn): { cls: string; label: string } {
  if (!turn.done) return { cls: "run", label: "진행 중" };
  if (turn.applied) return { cls: "ok", label: "적용함" };
  if (turn.response?.proposal.kind === "todos" || turn.response?.proposal.kind === "move") {
    return { cls: "wait", label: "확인 기다림" };
  }
  return { cls: "info", label: "안내" };
}

/**
 * 대화 한 턴의 결과 카드.
 * - 진행 중: 세그먼트 바 + 스켈레톤
 * - 완료: 말, 표, 확인/되돌리기 버튼
 */
export function ResultPreview({
  turn,
  onToggle,
  onTitleChange,
  onApply,
  onUndo,
  onRedo,
}: ResultPreviewProps) {
  const { t } = useTranslation();
  const { response, done, applied } = turn;
  if (!response) return null;

  const { cls, label } = statusLabel(turn);
  const proposal = response.proposal;
  const selectedItems = proposal.items.filter((i: ProposalItem) => i.selected);
  const n = selectedItems.length;
  const isMove = proposal.kind === "move";

  return (
    <article className="ag-turn">
      <div className="ap-hd">
        <p className="ap-q">{turn.query}</p>
        <span className={`ap-st ${cls}`}>{label}</span>
      </div>

      {!done && (
        <ProgressLine
          steps={response.steps}
          stepIdx={turn.stepIdx}
          done={false}
        />
      )}

      {done && (
        <p
          className="ap-say"
          dangerouslySetInnerHTML={{ __html: response.say }}
        />
      )}

      {/* 진행 중: 스켈레톤 */}
      {!done && (
        <div className="ap-sk" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      )}

      {/* 완료: 제안 표 */}
      {done && proposal.kind !== "retro" && (
        <div className="ag-res">
          <div className="ag-res-h">
            <b>{isMove ? t("ai.result.move") : t("ai.result.newTodos")}</b>
            <span>{t("ai.result.count").replace("{n}", String(proposal.items.length))}</span>
          </div>
          <ProposalTable
            items={proposal.items}
            applied={applied}
            done={done}
            kind={proposal.kind}
            onToggle={onToggle}
            onTitleChange={onTitleChange}
          />
          <div className="ap-act">
            {applied ? (
              <>
                <span className="ap-msg">
                  {isMove
                    ? t("ai.act.applied.move").replace("{n}", String(n))
                    : t("ai.act.applied.todos").replace("{n}", String(n))}
                </span>
                <button type="button" className="ap-b" onClick={onUndo}>
                  {t("ai.act.undo")}
                </button>
              </>
            ) : (
              <>
                <span className="ap-msg">눌러서 넣고 뺄 수 있어요</span>
                <button type="button" className="ap-b" onClick={onRedo}>
                  {t("ai.act.redo")}
                </button>
                <button
                  type="button"
                  className="ap-b p"
                  disabled={n === 0}
                  onClick={() =>
                    onApply(proposal.items.filter((i: ProposalItem) => i.selected).map((i: ProposalItem) => i.key))
                  }
                >
                  {isMove
                    ? t("ai.act.move").replace("{n}", String(n))
                    : t("ai.act.add").replace("{n}", String(n))}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
