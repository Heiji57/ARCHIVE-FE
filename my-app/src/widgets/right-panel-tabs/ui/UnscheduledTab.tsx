import { useMemo } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useNowMinutes, useTodayKey } from "@/app/providers/useToday";
import { useTranslation } from "@/shared/lib/i18n";
import { useTodoDrag } from "@/widgets/calendar-dashboard";
import { useTodoEditor } from "@/widgets/todo-editor";
import { freeSlot, untimedOn } from "../model/dayProgress";
import { spokenTime } from "../model/format";
import { usePanelDate } from "../model/panelDate";
import { PanelRow } from "./PanelRow";

const hm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** 그날 시간 미정 할 일 수(탭 숫자). */
// eslint-disable-next-line react-refresh/only-export-components
export function useUnscheduledCount(): number {
  const { state } = useArchiveApp();
  const date = usePanelDate();
  return useMemo(() => untimedOn(state.todos, date).length, [state.todos, date]);
}

/** 시간 미정 탭(시안 rpanel.js 시간 미정 처음 모양): 할 일마다 빈 시간 하나를 바로 넣는 버튼, 캘린더로 끌어 놓기. */
export function UnscheduledTab() {
  const { t, locale } = useTranslation();
  const { state, setTodoTime } = useArchiveApp();
  const date = usePanelDate();
  const today = useTodayKey();
  const now = useNowMinutes();
  const editor = useTodoEditor();
  const drag = useTodoDrag();
  const list = useMemo(() => untimedOn(state.todos, date), [state.todos, date]);
  const slot = useMemo(
    () => freeSlot(state.todos.filter((x) => x.dateKey === date), date === today ? now : null),
    [state.todos, date, today, now],
  );

  if (!list.length) return <p className="rp-e">{t("todos.rp.utEmpty")}</p>;
  return (
    <>
      <div className="rp-list">
        {list.map((x) => (
          <PanelRow key={x.id} todo={x} onOpen={editor.openTodo} onPointerDown={drag.startMove}>
            {slot !== null ? (
              <button type="button" className="rp-a" onClick={() => setTodoTime(x.id, hm(slot), hm(slot + 60))}>
                {t("todos.rp.place", { time: spokenTime(locale, slot) })}
              </button>
            ) : null}
          </PanelRow>
        ))}
      </div>
      <p className="rp-tip">{t("todos.rp.utTip")}</p>
    </>
  );
}
