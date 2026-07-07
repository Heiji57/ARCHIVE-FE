import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import {
  TODO_RANGE_STOPS,
  nearestStopIndex,
} from "../model/todoRangeStops";
import { SettingRow } from "./SettingRow";

/**
 * 할 일 보드 "전체" 보기 기간을 드래그 슬라이더로 조절한다.
 * 1주 ~ 1년 사이의 사람이 읽기 좋은 구간으로 스냅하며, 현재 값을 라벨로 표시한다.
 */
export function TodoRangeCard() {
  const { state, setTodoBoardRange } = useArchiveApp();
  const { t } = useTranslation();

  const index = nearestStopIndex(state.settings.todoBoardRangeDays);
  const current = TODO_RANGE_STOPS[index];
  const currentLabel = t(current.unitKey, { n: current.n });
  const minStop = TODO_RANGE_STOPS[0];
  const maxStop = TODO_RANGE_STOPS[TODO_RANGE_STOPS.length - 1];

  return (
    <SettingRow
      label={t("settings.todoRange.label")}
      description={t("settings.todoRange.hint")}
      htmlFor="settings-todo-range"
      stacked
    >
      <div className="todo-range-box">
        <div className="todo-range-slider-row">
          <input
            id="settings-todo-range"
            type="range"
            className="todo-range-slider"
            min={0}
            max={TODO_RANGE_STOPS.length - 1}
            step={1}
            value={index}
            onChange={(e) =>
              setTodoBoardRange(TODO_RANGE_STOPS[Number(e.target.value)].days)
            }
            aria-valuetext={currentLabel}
          />
          <span className="todo-range-value">{currentLabel}</span>
        </div>
        <div className="todo-range-scale">
          <span>{t(minStop.unitKey, { n: minStop.n })}</span>
          <span>{t(maxStop.unitKey, { n: maxStop.n })}</span>
        </div>
      </div>
    </SettingRow>
  );
}
