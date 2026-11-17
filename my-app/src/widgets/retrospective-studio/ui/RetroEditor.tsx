import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, Folder as FolderIcon, Maximize, Minimize, MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { JournalEntry } from "@/entities/entry/model/types";
import type { GitHubCommit } from "@/entities/github/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { integrationErrorMessageKey } from "@/shared/api";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { canUseGithub } from "@/shared/lib/permissions";
import { ConfirmModal } from "@/shared/ui/confirm-modal/ConfirmModal";
import { ICON_STROKE, SparkIcon } from "@/shared/ui/icons";
import { EditorErrorBoundary } from "@/shared/ui/rich-editor";
import { defaultTitle, KIND_RETRO_KEY, periodText } from "../model/format";
import { nextDayKey, prevActions } from "../model/retroList";
import { useRetroStudio } from "../model/retroStudio";
import { useEntryState } from "../model/entryState";
import { PopMenu } from "./PopMenu";

// TipTap 편집기는 번들이 커서 회고 편집기를 열 때만 불러온다.
const RichEditor = lazy(() => import("@/shared/ui/rich-editor/ui/RichEditor"));

const QS: TranslationKey[] = ["retro.ed.q1", "retro.ed.q2", "retro.ed.q3", "retro.ed.q4"];
const i15 = { size: 15, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

/** 할 일 하나를 그날 완료로 볼지(기간 할 일은 끝낸 날 기준). 기존 회고 편집기 규칙 그대로. */
function doneOn(todo: Todo, dateKey: string): boolean {
  if (todo.status !== "done") return false;
  if (todo.dueDate && todo.dueDate > todo.dateKey) return (todo.completedAt ? todo.completedAt.slice(0, 10) : todo.dueDate) === dateKey;
  return todo.dateKey === dateKey;
}

/** 회고 쓰기 화면(시안 d-retro2 editor()): 위 막대, 머리, AI 요약 띠, 지난번 약속, 본문, 그날 한 일, 커밋. */
export function RetroEditor({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const app = useArchiveApp();
  const { state, updateEntry, revertSummaryEdit, isDemo, loadCommits, pushRetrospective, pushNotification, moveTodo, addTodo } = app;
  const { pending, failed } = useEntryState(entry);
  const [focus, setFocus] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(0);
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevDone, setPrevDone] = useState<Set<string>>(() => new Set());
  const [qi, setQi] = useState(0);
  const [revertOpen, setRevertOpen] = useState(false);
  const [moved, setMoved] = useState<Todo[]>([]);
  const isDaily = entry.retroType === "daily";

  const dirty = () => {
    setSaving(true);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 600);
  };
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  // Ctrl+Shift+F 집중 쓰기, Esc 로 끝내기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocus((v) => !v);
      } else if (focus && e.key === "Escape" && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        setFocus(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const prev = useMemo(() => prevActions(state.entries, entry), [state.entries, entry]);
  const dayTodos = useMemo(() => {
    if (!isDaily) return { done: [], open: [] };
    const done = state.todos.filter((x) => !x.isVirtual && doneOn(x, entry.dateKey));
    const open = state.todos.filter((x) => !x.isVirtual && x.dateKey === entry.dateKey && x.status !== "done");
    return { done, open: [...open, ...moved.filter((m) => !open.some((o) => o.id === m.id))] };
  }, [isDaily, state.todos, entry.dateKey, moved]);

  // ─── GitHub(기존 동작 유지: 그날 커밋, 저장소에 push) ───────────────────
  const githubOn = canUseGithub(state.github);
  const connected = state.github.status === "connected";
  const canPush = connected && !!state.github.pushTargetRepositoryId;
  const [commits, setCommits] = useState<GitHubCommit[] | null>(null);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const loadDayCommits = () => {
    setLoadingCommits(true);
    void loadCommits(entry.dateKey)
      .then(setCommits)
      .finally(() => setLoadingCommits(false));
  };
  const commitsLoaded = useRef(false);
  useEffect(() => {
    if (!isDaily || !connected || commitsLoaded.current) return;
    commitsLoaded.current = true;
    // 커밋 받기 시작 표시(표준 패턴)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingCommits(true);
    void loadCommits(entry.dateKey)
      .then(setCommits)
      .finally(() => setLoadingCommits(false));
  }, [isDaily, connected, entry.dateKey, loadCommits]);

  const [pushing, setPushing] = useState(false);
  const push = async () => {
    if (isDemo || !canPush) return;
    setPushing(true);
    const r = await pushRetrospective(entry.retroType, entry.dateKey, entry.content);
    setPushing(false);
    if (r.ok) {
      updateEntry(entry.id, { synced: true });
      pushNotification("success", t("retro.editor.pushSuccess"), r.path, { category: "sync" });
    } else {
      const key = r.error ? integrationErrorMessageKey(r.error) : null;
      pushNotification("warning", t("retro.editor.pushFailed"), key ? t(key) : r.error ?? "", { category: "sync" });
    }
  };

  // ─── 본문 목록 줄 옆 "→ 할 일로" (시안 F1) ─────────────────────────────
  const edRef = useRef<HTMLDivElement>(null);
  const [f1, setF1] = useState<{ text: string; left: number; top: number } | null>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest(".rv-f1")) return;
    const li = el.closest<HTMLElement>(".rv-body li");
    const box = edRef.current;
    if (!li || !box || !li.textContent?.trim()) {
      if (f1) setF1(null);
      return;
    }
    const br = box.getBoundingClientRect();
    const r = li.getBoundingClientRect();
    const text = li.textContent.trim();
    if (f1?.text === text) return;
    setF1({ text, left: Math.min(r.right - br.left + 8, br.width - 96), top: r.top - br.top + 2 });
  };
  const sendToTodo = () => {
    if (!f1) return;
    const title = f1.text.slice(0, 200);
    addTodo(title, nextDayKey(s.today));
    s.toast(t("retro.ed.toTodoToast", { t: title.slice(0, 20) }));
    setF1(null);
  };

  const kindLabel = t(KIND_RETRO_KEY[entry.retroType]);
  const dflt = defaultTitle(t, locale, entry.retroType, entry.dateKey);
  const titleValue = entry.isSummary || /^\d{4}-\d{2}-\d{2}\s/.test(entry.title) ? "" : entry.title;

  return (
    <div className={`rv-ed${focus ? " zen" : ""}`} ref={edRef} onMouseMove={onMove} onMouseLeave={() => setF1(null)}>
      <div className="rv-eb">
        {!focus ? (
          <button type="button" className="rv-bt g" onClick={s.closeEntry}>
            <ChevronLeft size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
            {t("retro.ed.back")}
          </button>
        ) : null}
        <span className="sp" />
        {githubOn && connected ? (
          <span className={`rv-sync${entry.synced ? " on" : ""}`}>{t(entry.synced ? "retro.ed.synced" : "retro.ed.unsynced")}</span>
        ) : null}
        <span className="sv" aria-live="polite">
          {t(saving ? "retro.ed.saving" : "retro.ed.saved")}
        </span>
        <button
          type="button"
          className="rv-ib"
          aria-pressed={focus}
          aria-label={t("retro.ed.focus")}
          title={t(focus ? "retro.ed.focusEnd" : "retro.ed.focusTitle")}
          onClick={() => setFocus((v) => !v)}
        >
          {focus ? <Minimize {...i15} /> : <Maximize {...i15} />}
        </button>
        <PopMenu trigger={<MoreHorizontal {...i15} />} triggerClass="rv-ib" triggerLabel={t("retro.ed.more")} side="r">
          {(close) => (
            <EditorMenu
              entry={entry}
              close={close}
              canPush={canPush && !isDemo}
              pushing={pushing}
              onPush={() => {
                close();
                void push();
              }}
            />
          )}
        </PopMenu>
      </div>
      <div className="rv-es">
        <article className="rv-doc">
          <div className="rv-meta">
            <span className={`q-ty${entry.isSummary ? " ai" : ""}`}>
              {entry.isSummary ? <SparkIcon size={11} /> : null}
              {kindLabel}
            </span>
            <span>{periodText(locale, entry)}</span>
          </div>
          <input
            className="rv-ttl"
            aria-label={t("retro.ed.titleLabel")}
            value={entry.isSummary ? dflt : titleValue}
            placeholder={dflt}
            readOnly={entry.isSummary}
            title={entry.isSummary ? t("retro.ed.hintSummary") : undefined}
            onChange={(e) => {
              updateEntry(entry.id, { title: e.target.value });
              dirty();
            }}
          />
          <p className="rv-hint">{entry.isSummary ? t("retro.ed.hintSummary") : t("retro.ed.hintDefault", { title: dflt })}</p>

          {entry.isSummary ? (
            pending ? (
              <div className="rv-ban wait">
                <i className="rv-spin" aria-hidden="true" />
                <span>{t("retro.ed.wait")}</span>
              </div>
            ) : failed ? (
              <div className="rv-ban fail">
                <b>{t("retro.ed.failTag")}</b>
                <span>{t("retro.ed.failMsg")}</span>
                <button type="button" className="rv-bt g" onClick={() => s.setSummaryKind(entry.retroType === "daily" ? "weekly" : entry.retroType)}>
                  {t("retro.ed.retry")}
                </button>
              </div>
            ) : (
              <div className="rv-ban">
                <b>
                  <SparkIcon size={13} />
                  {t("retro.ed.ai")}
                </b>
                <span>{t("retro.ed.aiNote")}</span>
                <button type="button" className="rv-bt g" onClick={() => setRevertOpen(true)}>
                  {t("retro.summary.revert")}
                </button>
              </div>
            )
          ) : null}

          {prev.length ? (
            <div className="rv-prev" data-open={prevOpen ? "true" : undefined}>
              <button type="button" aria-expanded={prevOpen} onClick={() => setPrevOpen((v) => !v)}>
                {t("retro.ed.prev")}
                <b>
                  {prev.filter((x) => prevDone.has(x.key)).length} / {prev.length}
                </b>
                <ChevronDown size={14} strokeWidth={ICON_STROKE} aria-hidden="true" className="cv" />
              </button>
              {prevOpen ? (
                <ul>
                  {prev.map((x) => {
                    const on = prevDone.has(x.key);
                    return (
                      <li key={x.key} className={on ? "on" : undefined}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setPrevDone((p) => {
                              const n = new Set(p);
                              if (on) n.delete(x.key);
                              else n.add(x.key);
                              return n;
                            })
                          }
                        >
                          <Ck st={on ? "done" : "todo"} />
                          <span>{x.text}</span>
                        </button>
                        <small>{`${+x.fromDateKey.slice(5, 7)}/${+x.fromDateKey.slice(8, 10)}`}</small>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}

          {isDaily && !entry.content.trim() ? (
            <div className="rv-ask">
              <b>{t(QS[qi])}</b>
              <button type="button" onClick={() => setQi((i) => (i + 1) % QS.length)}>
                {t("retro.ed.otherQ")}
              </button>
            </div>
          ) : null}

          <div className="rv-body">
            {pending ? null : (
              <EditorErrorBoundary fallback={(error) => <div className="rv-ban fail">{error.message}</div>}>
                <Suspense fallback={<p className="rv-load">{t("retro.editor.loadingEditor")}</p>}>
                  <RichEditor
                    key={entry.id}
                    value={entry.content}
                    placeholder={t("retro.ed.placeholder")}
                    onChange={(md) => {
                      // 처음 불러올 때 편집기가 같은 글을 다시 내보내는 것은 고친 것이 아니다
                      if (md === entry.content) return;
                      updateEntry(entry.id, { content: md });
                      dirty();
                    }}
                    spellCheck={state.settings.spellCheck}
                  />
                </Suspense>
              </EditorErrorBoundary>
            )}
          </div>

          {isDaily ? (
            <section className="rv-done" aria-label={t("retro.ed.done")}>
              <h3>
                {t("retro.ed.done")} <em>{dayTodos.done.length}</em>
                {dayTodos.open.length ? <em>{t("retro.ed.openN", { n: dayTodos.open.length })}</em> : null}
              </h3>
              {dayTodos.done.length === 0 ? <p className="rv-none-l">{t("retro.ed.noneDone")}</p> : null}
              {dayTodos.done.map((x) => (
                <div key={x.id} className="rv-mr">
                  <Ck st="done" />
                  <span>{x.title}</span>
                  <em>{fmtTime(locale, x.startTime)}</em>
                </div>
              ))}
              {dayTodos.open.map((x) => {
                const mv = moved.some((m) => m.id === x.id);
                return (
                  <div key={x.id} className={`rv-mr${mv ? " moved" : ""}`}>
                    <Ck st={x.status === "in-progress" ? "doing" : "todo"} />
                    <span>{x.title}</span>
                    {mv ? (
                      <em>{t("retro.ed.carried")}</em>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="f3"
                          onClick={() => {
                            setMoved((m) => [...m, x]);
                            moveTodo(x.id, nextDayKey(s.today));
                            s.toast(t("retro.ed.carriedToast"));
                          }}
                        >
                          {t("retro.ed.carry")}
                        </button>
                        <em>{fmtTime(locale, x.startTime)}</em>
                      </>
                    )}
                  </div>
                );
              })}
            </section>
          ) : null}

          {isDaily && githubOn && connected ? (
            <section className="rv-done" aria-label={t("retro.ed.commits")}>
              <h3>
                {t("retro.ed.commits")} <em>{commits?.length ?? 0}</em>
                <button type="button" className="rv-ib xs" aria-label={t("retro.ed.commitsRefresh")} onClick={loadDayCommits} disabled={loadingCommits}>
                  <RefreshCw size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
              </h3>
              {loadingCommits && !commits ? <p className="rv-none-l">{t("retro.load.loading")}</p> : null}
              {commits && commits.length === 0 ? <p className="rv-none-l">{t("retro.ed.commitsNone")}</p> : null}
              {commits?.map((c) => (
                <a key={c.sha} className="rv-mr" href={c.htmlUrl} target="_blank" rel="noopener noreferrer">
                  <code>{c.sha.slice(0, 7)}</code>
                  <span>{c.message.split("\n")[0]}</span>
                  <em>{c.fullName}</em>
                </a>
              ))}
            </section>
          ) : null}
        </article>
      </div>
      {f1 ? (
        <button type="button" className="rv-f1" style={{ left: f1.left, top: f1.top }} onClick={sendToTodo}>
          {t("retro.ed.toTodo")}
        </button>
      ) : null}
      {revertOpen ? (
        <ConfirmModal
          open
          title={t("retro.summary.revertConfirmTitle")}
          message={t("retro.summary.revertConfirmMessage")}
          confirmLabel={t("retro.summary.revertConfirm")}
          cancelLabel={t("retro.summary.revertCancel")}
          onConfirm={() => {
            setRevertOpen(false);
            revertSummaryEdit(entry.id);
          }}
          onCancel={() => setRevertOpen(false)}
        />
      ) : null}
    </div>
  );
}

function fmtTime(locale: string, hhmm?: string | null): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, h, m));
}

function Ck({ st }: { st: "done" | "doing" | "todo" }) {
  if (st === "done")
    return (
      <span className="rv-ck">
        <Check size={9} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  return <span className={`rv-ck ${st === "doing" ? "d" : "o"}`} />;
}

/** ⋯ 메뉴: 폴더 옮기기(찾기 + 새 폴더), GitHub 저장. */
function EditorMenu({ entry, close, canPush, pushing, onPush }: { entry: JournalEntry; close: () => void; canPush: boolean; pushing: boolean; onPush: () => void }) {
  const { t } = useTranslation();
  const s = useRetroStudio();
  const [q, setQ] = useState("");
  const opts: Array<{ id: string | null; name: string }> = [...s.folders.map((f) => ({ id: f.id as string | null, name: f.name })), { id: null, name: t("retro.cd.unfiled") }];
  const hits = opts.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));
  const canCreate = q.trim() !== "" && !opts.some((o) => o.name === q.trim());
  const pick = (id: string | null) => {
    close();
    if (id !== entry.folderId) s.moveEntry(entry, id);
  };
  const create = async () => {
    const name = q.trim();
    close();
    const id = await s.createFolder(name);
    if (id) s.moveEntry(entry, id);
  };
  return (
    <>
      <p className="rv-pop-h">{t("retro.ed.moveFolder")}</p>
      <label className="rv-fs">
        <Search size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
        <input
          value={q}
          placeholder={t("retro.ed.folderFind")}
          aria-label={t("retro.ed.folderFind")}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            if (hits[0]) pick(hits[0].id);
            else if (canCreate) void create();
          }}
        />
      </label>
      {hits.map((o) => (
        <button key={o.id ?? "none"} type="button" role="menuitemradio" aria-checked={(entry.folderId ?? null) === o.id} onClick={() => pick(o.id)}>
          <FolderIcon size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
          {o.name}
        </button>
      ))}
      {canCreate ? (
        <>
          <hr />
          <button type="button" role="menuitem" onClick={() => void create()}>
            <Plus size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
            {t("retro.ed.folderCreate", { name: q.trim() })}
          </button>
        </>
      ) : null}
      {canPush ? (
        <>
          <hr />
          <button type="button" role="menuitem" disabled={pushing} onClick={onPush}>
            {pushing ? t("retro.editor.pushing") : t("retro.ed.push")}
          </button>
        </>
      ) : null}
    </>
  );
}
