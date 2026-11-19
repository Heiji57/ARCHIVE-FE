import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { DEMO_COMMIT_TODO_LINKS } from "@/entities/github/model/demo";
import { useTranslation } from "@/shared/lib/i18n";
import { commitTime, repoName, useDayCommits } from "../model/useDayCommits";
import { usePanelDate } from "../model/panelDate";

/** 커밋 탭 숫자. 불러오는 중이면 숫자 없음. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCommitCount(): number | null {
  const list = useDayCommits(usePanelDate());
  return list ? list.length : null;
}

/**
 * 커밋 탭(시안 rpanel.js 커밋 4번 세로 시간 줄): 시각, 메시지, 저장소와 이어진 할 일.
 * 커밋과 할 일의 연결은 서버가 아직 주지 않아 데모에서만 할 일 이름이 붙는다.
 */
export function CommitsTab() {
  const { t } = useTranslation();
  const { state, isDemo } = useArchiveApp();
  const list = useDayCommits(usePanelDate());

  if (list === null) return <p className="rp-e">{t("todos.rp.cmLoading")}</p>;
  if (!list.length) return <p className="rp-e">{t("todos.rp.cmEmpty")}</p>;
  return (
    <ol className="rp-ctl">
      {list.map((c) => {
        const todoId = isDemo ? DEMO_COMMIT_TODO_LINKS[c.sha] : undefined;
        const todo = todoId ? state.todos.find((x) => x.id === todoId) : undefined;
        return (
          <li key={c.sha}>
            <time dateTime={c.committedAt}>{commitTime(c)}</time>
            <i aria-hidden="true" />
            <div>
              <p>{c.message}</p>
              <small>
                {repoName(c)}
                {todo ? `, ${todo.title}` : ""}
              </small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
