/*
 * ARCHIVE shell prototypes: shared behaviour.
 *
 * Every prototype in this folder loads this one file, so the five designs share
 * the same data and the same logic (the way the real app keeps CalendarDashboard's
 * logic and only swaps the design). It mirrors the real screen's behaviour:
 *   - month / week / day views, prev / today / next, title per view
 *   - todo chips with status, tags, due-date spans across days
 *   - inline add per day cell (Enter commits, Esc cancels)
 *   - drag a chip or span to another day (moveTodo; the due date moves with it)
 *   - detail panel: title, status, date, due date, time, tags, recurrence,
 *     description, Google Calendar link toggle, delete (confirmed)
 *   - expand mode (Ctrl/Cmd+Shift+F, Esc), search (Ctrl/Cmd+K)
 *   - view and date kept in the URL; ?state=loading|empty|error previews the states
 * Data is sample data, fixed to 2026-11-02 14:20 so every screenshot matches.
 */
(() => {
  "use strict";

  const root = document.querySelector("[data-archive]");
  if (!root) return;

  const TODAY = "2026-11-02";
  const NOW_MIN = 14 * 60 + 20;
  const params = new URLSearchParams(location.search);
  const previewState = params.get("state"); // loading | empty | error | null

  const cfg = {
    view: params.get("view") || root.dataset.defaultView || "month",
    panel: root.dataset.panel || "drawer",
    monthMax: Number(root.dataset.monthMax || 3),
    dayStart: Number(root.dataset.dayStart || 8),
    dayEnd: Number(root.dataset.dayEnd || 23),
    dateFmt: root.dataset.dateFmt || "ko",
  };

  /* ---------- dates ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const dowIdx = (d) => (d.getDay() + 6) % 7;
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const DOW = ["월", "화", "수", "목", "금", "토", "일"];
  const DOW_FULL = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

  /* ---------- sample data ---------- */
  const TAGS = ["업무", "사이드", "학습", "회고", "개인"];
  const STATUS = {
    "not-start": "시작 전",
    "in-progress": "진행 중",
    done: "완료",
  };
  const STATUS_ORDER = ["not-start", "in-progress", "done"];
  let seq = 0;
  const T = (dateKey, title, status, tags, o = {}) => ({
    id: `t${++seq}`,
    dateKey,
    title,
    status,
    tags,
    startTime: o.s || null,
    endTime: o.e || null,
    dueDate: o.due || null,
    recurring: o.rec || null,
    description: o.desc || "",
    calendarLinked: Boolean(o.cal),
  });

  const seed = () => {
    seq = 0;
    const list = [];
    ["2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"].forEach((k) =>
      list.push(T(k, "팀 주간 회의", k <= TODAY ? "done" : "not-start", ["업무"], { s: "10:00", e: "11:00", rec: "매주 월요일", cal: true, desc: "지난주 배포 이슈, 이번 주 우선순위 공유." })),
    );
    ["2026-10-27", "2026-11-03", "2026-11-10", "2026-11-17", "2026-11-24", "2026-12-01"].forEach((k) =>
      list.push(T(k, "알고리즘 스터디", k < TODAY ? "done" : "not-start", ["학습"], { s: "19:00", e: "21:00", rec: "매주 화요일" })),
    );
    ["2026-10-30", "2026-11-06", "2026-11-13", "2026-11-20", "2026-11-27"].forEach((k) =>
      list.push(T(k, "주간 회고 작성", k < TODAY ? "done" : "not-start", ["회고"], { s: "17:00", e: "18:00", rec: "매주 금요일" })),
    );
    list.push(
      T("2026-10-27", "API 명세서 작성", "done", ["업무"], { desc: "todos, entries 엔드포인트 응답 스키마 정리." }),
      T("2026-10-28", "Redis 캐싱 적용", "done", ["사이드"], { due: "2026-10-30" }),
      T("2026-10-29", "DB 스키마 설계", "done", ["업무"]),
      T("2026-10-29", "테스트 커버리지 보강", "not-start", ["업무"]),
      T("2026-10-31", "Next.js 라우팅 설정", "done", ["학습"]),
      T("2026-11-01", "10월 월간 회고 작성", "done", ["회고"]),
      T("2026-11-02", "PR #128 리뷰", "done", ["업무"], { s: "09:00", e: "09:40" }),
      T("2026-11-02", "GitHub OAuth 연동", "in-progress", ["사이드"], { s: "13:00", e: "15:30", due: "2026-11-05", desc: "콜백 URL 정리 후 토큰 갱신 흐름 확인." }),
      T("2026-11-02", "캘린더 드래그 버그 수정", "not-start", ["업무"], { s: "16:00", e: "17:00", desc: "월간 뷰에서 span 칩을 옮기면 마감일이 따라오지 않음." }),
      T("2026-11-02", "TypeScript 6 마이그레이션 노트", "not-start", ["학습"]),
      T("2026-11-02", "저녁 러닝 5km", "not-start", ["개인"], { s: "20:00", e: "20:40" }),
      T("2026-11-03", "회고 에디터 슬래시 메뉴", "not-start", ["업무"], { s: "14:00", e: "16:00" }),
      T("2026-11-04", "배포 파이프라인 점검", "not-start", ["업무"], { due: "2026-11-06" }),
      T("2026-11-04", "Redis TTL 정책 정리", "not-start", ["사이드"]),
      T("2026-11-05", "1:1 미팅", "not-start", ["업무"], { s: "15:00", e: "15:30", cal: true }),
      T("2026-11-05", "블로그 글: 회고 자동화", "not-start", ["개인"]),
      T("2026-11-06", "디자인 시안 리뷰", "not-start", ["업무"], { s: "14:00", e: "15:00" }),
      T("2026-11-07", "사이드 프로젝트 데모 준비", "not-start", ["사이드"], { due: "2026-11-08" }),
      T("2026-11-10", "캘린더 렌더 성능 측정", "not-start", ["업무"], { due: "2026-11-12" }),
      T("2026-11-11", "Rust 입문 3장", "not-start", ["학습"]),
      T("2026-11-13", "릴리스 노트 작성", "not-start", ["업무"]),
      T("2026-11-17", "인프라 비용 리뷰", "not-start", ["업무"]),
      T("2026-11-18", "컨퍼런스 발표 자료", "not-start", ["개인"], { due: "2026-11-21" }),
      T("2026-11-25", "연말 목표 정리", "not-start", ["개인"]),
      T("2026-11-28", "11월 월간 회고", "not-start", ["회고"]),
    );
    return list;
  };

  /* ---------- state ---------- */
  const st = {
    todos: previewState === "empty" ? [] : seed(),
    view: ["month", "week", "day"].includes(cfg.view) ? cfg.view : "month",
    cursor: parse(params.get("date") || TODAY),
    selected: null,
    adding: null,
    pendingDelete: false,
    expanded: false,
    query: "",
    loading: previewState === "loading",
    error: previewState === "error",
  };

  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => [...root.querySelectorAll(sel)];
  const byId = (id) => st.todos.find((t) => t.id === id) || null;
  const isSpan = (t) => Boolean(t.dueDate && t.dueDate > t.dateKey);
  const covers = (t, k) => t.dateKey <= k && (t.dueDate || t.dateKey) >= k;
  const tagIndex = (t) => Math.max(0, TAGS.indexOf(t.tags[0]));
  const byTime = (a, b) => (a.startTime || "99").localeCompare(b.startTime || "99") || a.title.localeCompare(b.title, "ko");
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const md = (k) => {
    const d = parse(k);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  const matches = (t) => !st.query || t.title.toLowerCase().includes(st.query.toLowerCase());

  /* ---------- icons (lucide paths) ---------- */
  const ICON = {
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    expand: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
    collapse: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    "not-start": '<circle cx="12" cy="12" r="9"/>',
    "in-progress": '<circle cx="12" cy="12" r="9"/><polygon points="10 8.5 15.5 12 10 15.5 10 8.5"/>',
    done: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  };
  const icon = (name, size = 16) =>
    `<svg class="a-ico a-ico-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[name] || ""}</svg>`;
  const statusMark = (s) =>
    `<span class="a-status" data-status="${s}">${icon(s, 14)}<span class="visually-hidden">${STATUS[s]}</span></span>`;

  /* ---------- pieces ---------- */
  const chip = (t, opts = {}) => {
    const time = opts.time && t.startTime ? `<span class="a-chip-time">${t.startTime}</span>` : "";
    const tag = t.tags[0] ? `<span class="a-chip-tag">${esc(t.tags[0])}</span>` : "";
    return `<button type="button" class="a-chip${matches(t) ? "" : " is-dim"}" data-select="${t.id}" data-drag="${t.id}" draggable="true" data-status="${t.status}" data-tag-i="${tagIndex(t)}" aria-pressed="${st.selected === t.id}">${statusMark(t.status)}${time}<span class="a-chip-title">${esc(t.title)}</span>${tag}</button>`;
  };

  const addInput = (k) =>
    `<input class="a-add-input" data-add-input="${k}" placeholder="할 일 입력 후 Enter" aria-label="${md(k)} 새 할 일" autocomplete="off">`;

  const layoutSpans = (spans, firstKey) => {
    const rowsEnd = [];
    return spans
      .slice()
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || b.dueDate.localeCompare(a.dueDate))
      .map((t) => {
        const c0 = Math.max(0, diffDays(firstKey, t.dateKey));
        const c1 = Math.min(6, diffDays(firstKey, t.dueDate));
        let r = rowsEnd.findIndex((end) => end < c0);
        if (r === -1) {
          r = rowsEnd.length;
          rowsEnd.push(c1);
        } else rowsEnd[r] = c1;
        return { t, c0, c1, r, cutL: t.dateKey < firstKey, cutR: diffDays(firstKey, t.dueDate) > 6 };
      });
  };

  const renderWeeks = (start, nWeeks, opts) => {
    const inMonth = st.cursor.getMonth();
    let html = `<div class="a-dow" aria-hidden="true">${DOW.map(
      (d, i) => `<span class="a-dow-cell${i > 4 ? " is-weekend" : ""}">${d}</span>`,
    ).join("")}</div>`;
    for (let w = 0; w < nWeeks; w++) {
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i));
      const firstKey = keyOf(days[0]);
      const lastKey = keyOf(days[6]);
      const spans = st.todos.filter((t) => isSpan(t) && t.dateKey <= lastKey && t.dueDate >= firstKey);
      const placed = layoutSpans(spans, firstKey);
      const nRows = placed.reduce((m, p) => Math.max(m, p.r + 1), 0);
      const rows = `auto ${nRows ? `repeat(${nRows}, var(--bar-h)) ` : ""}1fr`;
      html += `<div class="a-week" style="grid-template-rows:${rows}">`;
      days.forEach((d, c) => {
        const k = keyOf(d);
        const cls = [
          k === TODAY ? "is-today" : "",
          k < TODAY ? "is-past" : "",
          opts.month && d.getMonth() !== inMonth ? "is-out" : "",
          c > 4 ? "is-weekend" : "",
        ].filter(Boolean).join(" ");
        html += `<div class="a-cell-bg ${cls}" data-drop="${k}" style="grid-column:${c + 1}"></div>`;
        html += `<div class="a-cell-head ${cls}" data-drop="${k}" style="grid-column:${c + 1}">
          <button type="button" class="a-date" data-goto-day="${k}" aria-label="${md(k)} ${DOW_FULL[c]} 일간 보기">${
            opts.week ? `<span class="a-date-dow">${DOW[c]}</span>` : ""
          }<span class="a-date-num">${d.getDate()}</span></button>
          ${k === TODAY ? '<span class="a-today-mark">오늘</span>' : ""}
          <button type="button" class="a-add" data-add="${k}" aria-label="${md(k)}에 할 일 추가">${icon("plus", 14)}</button>
        </div>`;
      });
      placed.forEach(({ t, c0, c1, r, cutL, cutR }) => {
        html += `<button type="button" class="a-bar${cutL ? " is-cut-l" : ""}${cutR ? " is-cut-r" : ""}${matches(t) ? "" : " is-dim"}" data-select="${t.id}" data-drag="${t.id}" draggable="true" data-status="${t.status}" data-tag-i="${tagIndex(t)}" aria-pressed="${st.selected === t.id}" style="grid-column:${c0 + 1} / ${c1 + 2};grid-row:${r + 2}" title="${esc(t.title)}, ${md(t.dateKey)}부터 ${md(t.dueDate)}까지">${statusMark(t.status)}<span class="a-bar-title">${esc(t.title)}</span><span class="a-bar-due">${md(t.dueDate)} 마감</span></button>`;
      });
      days.forEach((d, c) => {
        const k = keyOf(d);
        const items = st.todos.filter((t) => t.dateKey === k && !isSpan(t)).sort(byTime);
        const visible = opts.max ? items.slice(0, opts.max) : items;
        const more = items.length - visible.length;
        html += `<div class="a-cell-list${k === TODAY ? " is-today" : ""}" data-drop="${k}" style="grid-column:${c + 1};grid-row:${nRows + 2}">
          ${visible.map((t) => chip(t, opts)).join("")}
          ${more > 0 ? `<button type="button" class="a-more" data-goto-day="${k}">${more}개 더 보기</button>` : ""}
          ${st.adding === k ? addInput(k) : ""}
        </div>`;
      });
      html += "</div>";
    }
    return html;
  };

  const renderDay = () => {
    const k = keyOf(st.cursor);
    const spans = st.todos.filter((t) => isSpan(t) && covers(t, k));
    const own = st.todos.filter((t) => t.dateKey === k && !isSpan(t));
    const timed = own.filter((t) => t.startTime).sort(byTime);
    const untimed = own.filter((t) => !t.startTime);
    const start = cfg.dayStart * 60;
    const end = cfg.dayEnd * 60;
    const slots = (end - start) / 30;
    const lanes = [];
    const placed = timed.map((t) => {
      const s = Math.max(start, toMin(t.startTime));
      const e = Math.min(end, Math.max(s + 30, t.endTime ? toMin(t.endTime) : s + 60));
      let lane = lanes.findIndex((le) => le <= s);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(e);
      } else lanes[lane] = e;
      return { t, s, e, lane };
    });
    const nLanes = Math.max(1, lanes.length);
    let hours = "";
    for (let h = cfg.dayStart; h < cfg.dayEnd; h++) {
      hours += `<div class="a-hour${h * 60 <= NOW_MIN && k === TODAY && NOW_MIN < (h + 1) * 60 ? " is-now" : ""}" style="grid-row:${(h - cfg.dayStart) * 2 + 1} / span 2"><time>${pad(h)}:00</time></div>`;
    }
    const blocks = placed
      .map(({ t, s, e, lane }) => {
        const r0 = (s - start) / 30 + 1;
        const r1 = Math.ceil((e - start) / 30) + 1;
        return `<button type="button" class="a-block${matches(t) ? "" : " is-dim"}${e - s <= 60 ? " is-short" : ""}" data-select="${t.id}" data-status="${t.status}" data-tag-i="${tagIndex(t)}" aria-pressed="${st.selected === t.id}" style="grid-column:${lane + 1};grid-row:${r0} / ${r1}">
          <span class="a-block-time">${t.startTime} ~ ${t.endTime || fromMin(e)}</span>
          <span class="a-block-title">${statusMark(t.status)}${esc(t.title)}</span>
          ${t.tags[0] ? `<span class="a-chip-tag">${esc(t.tags[0])}</span>` : ""}
        </button>`;
      })
      .join("");
    let now = "";
    if (k === TODAY && NOW_MIN >= start && NOW_MIN < end) {
      const off = (NOW_MIN - start) / 30;
      now = `<div class="a-now" style="grid-row:${Math.floor(off) + 1};--frac:${(off % 1).toFixed(3)}" aria-hidden="true"><span class="a-now-time">${fromMin(NOW_MIN)}</span></div>`;
    }
    return `<div class="a-dayview">
      ${
        spans.length
          ? `<div class="a-day-spans"><h3 class="a-day-sub">기간 일정</h3><div class="a-day-span-list">${spans
              .map(
                (t) =>
                  `<button type="button" class="a-bar" data-select="${t.id}" data-status="${t.status}" data-tag-i="${tagIndex(t)}" aria-pressed="${st.selected === t.id}">${statusMark(t.status)}<span class="a-bar-title">${esc(t.title)}</span><span class="a-bar-due">${md(t.dueDate)} 마감</span></button>`,
              )
              .join("")}</div></div>`
          : ""
      }
      <div class="a-day-body">
        <div class="a-timeline" style="grid-template-rows:repeat(${slots}, var(--slot-h))">
          ${hours}
          <div class="a-lanes" style="grid-template-columns:repeat(${nLanes}, minmax(0, 1fr));grid-template-rows:repeat(${slots}, var(--slot-h))">${blocks}${now}</div>
        </div>
        <section class="a-untimed" data-drop="${k}" aria-label="시간 미지정">
          <h3 class="a-day-sub">시간 미지정</h3>
          <div class="a-untimed-list">
            ${untimed.map((t) => chip(t)).join("") || '<p class="a-quiet">시간 없이 할 일은 여기에 모입니다.</p>'}
            ${st.adding === k ? addInput(k) : `<button type="button" class="a-add-line" data-add="${k}">${icon("plus", 14)}할 일 추가</button>`}
          </div>
        </section>
      </div>
    </div>`;
  };

  /* Phone width: month and week read as an agenda list instead of a squeezed grid. */
  const narrow = window.matchMedia("(max-width: 40rem)");
  const renderAgenda = (from, to) => {
    let html = '<ol class="a-agenda">';
    for (let d = parse(from); keyOf(d) <= to; d = addDays(d, 1)) {
      const k = keyOf(d);
      const items = st.todos.filter((t) => covers(t, k) && (t.dateKey === k || isSpan(t))).sort(byTime);
      if (!items.length && k !== TODAY) continue;
      html += `<li class="a-agenda-day${k === TODAY ? " is-today" : ""}" data-drop="${k}">
        <div class="a-agenda-date"><span class="a-date-num">${d.getDate()}</span><span class="a-date-dow">${DOW[dowIdx(d)]}</span>${k === TODAY ? '<span class="a-today-mark">오늘</span>' : ""}</div>
        <div class="a-agenda-list">${items.map((t) => chip(t, { time: true })).join("") || '<p class="a-quiet">할 일이 없습니다.</p>'}
        ${st.adding === k ? addInput(k) : `<button type="button" class="a-add-line" data-add="${k}">${icon("plus", 14)}할 일 추가</button>`}</div>
      </li>`;
    }
    return `${html}</ol>`;
  };

  const viewRange = () => {
    if (st.view === "day") return { from: keyOf(st.cursor), to: keyOf(st.cursor) };
    if (st.view === "week") {
      const m = mondayOf(st.cursor);
      return { from: keyOf(m), to: keyOf(addDays(m, 6)) };
    }
    const first = new Date(st.cursor.getFullYear(), st.cursor.getMonth(), 1);
    const last = new Date(st.cursor.getFullYear(), st.cursor.getMonth() + 1, 0);
    return { from: keyOf(first), to: keyOf(last) };
  };

  const renderSkeleton = () => {
    const n = st.view === "month" ? 35 : st.view === "week" ? 7 : 12;
    return `<div class="a-skeleton a-skeleton-${st.view}" aria-hidden="true">${'<span class="a-skel"></span>'.repeat(n)}</div>`;
  };

  /* ---------- render ---------- */
  const renderCalendar = () => {
    const el = q('[data-a="calendar"]');
    if (!el) return;
    root.dataset.view = st.view;
    el.setAttribute("aria-busy", String(st.loading));
    const status = q('[data-a="live"]');
    if (status) status.textContent = st.loading ? "할 일을 불러오는 중…" : "";
    if (st.loading) {
      el.innerHTML = renderSkeleton();
      return;
    }
    const empty =
      !st.error && !st.todos.length
        ? `<div class="a-empty" role="note"><p class="a-empty-title">${st.cursor.getMonth() + 1}월에 등록된 할 일이 없습니다.</p><p class="a-empty-body">날짜 칸의 더하기 버튼이나 아래 버튼으로 첫 할 일을 적어보세요.</p><button type="button" class="a-btn a-btn-primary" data-add="${TODAY}">오늘 할 일 추가</button></div>`
        : "";
    if (narrow.matches && st.view !== "day") {
      const { from, to } = st.view === "week" ? viewRange() : viewRange();
      el.innerHTML = empty + renderAgenda(from, to);
    } else if (st.view === "day") {
      el.innerHTML = empty + renderDay();
    } else if (st.view === "week") {
      el.innerHTML = empty + `<div class="a-weekview">${renderWeeks(mondayOf(st.cursor), 1, { week: true, time: true, max: 0 })}</div>`;
    } else {
      const first = new Date(st.cursor.getFullYear(), st.cursor.getMonth(), 1);
      el.innerHTML = empty + `<div class="a-month">${renderWeeks(mondayOf(first), 6, { month: true, max: cfg.monthMax })}</div>`;
    }
    const input = q(".a-add-input");
    if (input) input.focus({ preventScroll: true });
  };

  const renderTitle = () => {
    const d = st.cursor;
    qa('[data-a="title"]').forEach((el) => {
      if (st.view === "day") {
        el.innerHTML = `<span class="a-title-main">${d.getMonth() + 1}월 ${d.getDate()}일</span> <span class="a-title-sub">${DOW_FULL[dowIdx(d)]}, ${d.getFullYear()}년</span>`;
      } else if (st.view === "week") {
        const m = mondayOf(d);
        const e = addDays(m, 6);
        const sameMonth = m.getMonth() === e.getMonth();
        el.innerHTML = `<span class="a-title-main">${m.getMonth() + 1}월 ${m.getDate()}일 ~ ${sameMonth ? "" : `${e.getMonth() + 1}월 `}${e.getDate()}일</span> <span class="a-title-sub">${m.getFullYear()}년</span>`;
      } else {
        el.innerHTML = `<span class="a-title-main">${d.getMonth() + 1}월</span> <span class="a-title-sub">${d.getFullYear()}년</span>`;
      }
    });
    qa("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === st.view)));
    qa("[data-expand]").forEach((b) => {
      b.setAttribute("aria-label", st.expanded ? "확대 닫기" : "캘린더 확대");
      b.title = `${st.expanded ? "확대 닫기" : "캘린더 확대"} (Ctrl+Shift+F)`;
      b.innerHTML = icon(st.expanded ? "collapse" : "expand", 16);
    });
  };

  const renderCounts = () => {
    const el = q('[data-a="counts"]');
    if (!el) return;
    const { from, to } = viewRange();
    const inRange = st.todos.filter((t) => t.dateKey >= from && t.dateKey <= to);
    el.innerHTML = STATUS_ORDER.slice()
      .reverse()
      .map(
        (s) =>
          `<div class="a-count" data-status="${s}"><dt>${icon(s, 14)}${STATUS[s]}</dt><dd>${st.loading ? "" : inRange.filter((t) => t.status === s).length}</dd></div>`,
      )
      .join("");
  };

  const renderBoard = () => {
    const el = q('[data-a="board"]');
    if (!el) return;
    if (st.loading) {
      el.innerHTML = '<div class="a-skeleton a-skeleton-board" aria-hidden="true"><span class="a-skel"></span><span class="a-skel"></span><span class="a-skel"></span></div>';
      return;
    }
    const items = st.todos.filter((t) => covers(t, TODAY) && (t.dateKey === TODAY || isSpan(t))).sort(byTime);
    el.innerHTML = items.length
      ? `<ol class="a-board">${items
          .map((t) => {
            const live = t.startTime && t.endTime && toMin(t.startTime) <= NOW_MIN && NOW_MIN < toMin(t.endTime);
            return `<li><button type="button" class="a-board-row${live ? " is-live" : ""}" data-select="${t.id}" data-status="${t.status}" data-tag-i="${tagIndex(t)}" aria-pressed="${st.selected === t.id}">
              <time class="a-board-time">${t.startTime || (isSpan(t) ? "기간" : "미정")}</time>
              <span class="a-board-title">${esc(t.title)}</span>
              <span class="a-board-tag">${esc(t.tags[0] || "")}</span>
              <span class="a-board-status" data-status="${t.status}">${live ? "지금" : STATUS[t.status]}</span>
            </button></li>`;
          })
          .join("")}</ol>`
      : '<p class="a-quiet">오늘 할 일이 없습니다.</p>';
  };

  const renderMini = () => {
    const el = q('[data-a="mini"]');
    if (!el) return;
    const first = new Date(st.cursor.getFullYear(), st.cursor.getMonth(), 1);
    const start = mondayOf(first);
    const sel = keyOf(st.cursor);
    let cells = DOW.map((d) => `<span class="a-mini-dow" aria-hidden="true">${d}</span>`).join("");
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      const k = keyOf(d);
      const n = st.loading ? 0 : st.todos.filter((t) => t.dateKey === k).length;
      const cls = [k === TODAY ? "is-today" : "", k === sel ? "is-selected" : "", d.getMonth() !== first.getMonth() ? "is-out" : ""].filter(Boolean).join(" ");
      cells += `<button type="button" class="a-mini-day ${cls}" data-goto-day="${k}" aria-label="${md(k)}, 할 일 ${n}개"><span class="a-mini-num">${d.getDate()}</span>${n ? `<span class="a-mini-n">${n}</span>` : ""}</button>`;
    }
    el.innerHTML = `<p class="a-mini-head">${first.getFullYear()}년 ${first.getMonth() + 1}월</p><div class="a-mini">${cells}</div>`;
  };

  const renderBanner = () => {
    const el = q('[data-a="banner"]');
    if (!el) return;
    el.hidden = !st.error;
    el.innerHTML = st.error
      ? `<div class="a-banner" role="alert"><p><strong>할 일을 불러오지 못했습니다.</strong> 연결을 확인한 뒤 다시 시도하세요. 오류 코드: 503</p><button type="button" class="a-btn" data-retry>다시 시도</button></div>`
      : "";
  };

  const renderPanel = () => {
    const el = q('[data-a="panel"]');
    if (!el) return;
    const t = st.selected ? byId(st.selected) : null;
    root.classList.toggle("is-panel-open", Boolean(t));
    el.setAttribute("aria-hidden", String(cfg.panel === "drawer" && !t));
    if (!t) {
      el.innerHTML =
        cfg.panel === "docked"
          ? '<div class="a-panel-empty"><p class="a-empty-title">할 일을 선택하세요.</p><p class="a-empty-body">내용과 일정을 여기서 편집합니다.</p></div>'
          : "";
      return;
    }
    const tags = t.tags.map((g) => `<span class="a-tag" data-tag-i="${Math.max(0, TAGS.indexOf(g))}">${esc(g)}</span>`).join("");
    el.innerHTML = `
      <div class="a-panel-head">
        <h2 class="a-panel-title">작업 상세</h2>
        <button type="button" class="a-icon-btn" data-close aria-label="닫기">${icon("x", 18)}</button>
      </div>
      <div class="a-panel-body">
        <label class="a-field"><span class="a-label">제목</span><input class="a-input a-input-title" data-f="title" value="${esc(t.title)}" autocomplete="off"></label>
        <div class="a-field" role="group" aria-labelledby="a-status-label">
          <span class="a-label" id="a-status-label">상태</span>
          <div class="a-seg a-seg-status">${STATUS_ORDER.map(
            (s) => `<button type="button" class="a-seg-btn" data-set-status="${s}" data-status="${s}" aria-pressed="${t.status === s}">${icon(s, 14)}${STATUS[s]}</button>`,
          ).join("")}</div>
        </div>
        <div class="a-field-row">
          <label class="a-field"><span class="a-label">날짜</span><input class="a-input" type="date" data-f="dateKey" value="${t.dateKey}"></label>
          <label class="a-field"><span class="a-label">마감일</span><input class="a-input" type="date" data-f="dueDate" value="${t.dueDate || ""}" min="${t.dateKey}"></label>
        </div>
        <div class="a-field-row">
          <label class="a-field"><span class="a-label">시작</span><input class="a-input" type="time" data-f="startTime" value="${t.startTime || ""}"></label>
          <label class="a-field"><span class="a-label">종료</span><input class="a-input" type="time" data-f="endTime" value="${t.endTime || ""}"></label>
        </div>
        <p class="a-hint">시간을 비우면 일간 뷰의 시간 미지정 목록에 놓입니다.</p>
        <div class="a-field"><span class="a-label">태그</span><div class="a-tags">${tags || '<span class="a-quiet">태그 없음</span>'}</div></div>
        ${t.recurring ? `<div class="a-field"><span class="a-label">반복</span><p class="a-recur">${icon("repeat", 14)}${esc(t.recurring)}</p></div>` : ""}
        <label class="a-field"><span class="a-label">상세 설명</span><textarea class="a-input a-textarea" data-f="description" rows="4" placeholder="작업의 맥락이나 참고 링크를 적어두세요.">${esc(t.description)}</textarea></label>
      </div>
      <div class="a-panel-foot">
        <button type="button" class="a-btn" data-toggle-cal aria-pressed="${t.calendarLinked}">${t.calendarLinked ? "Google 캘린더에 연결됨" : "Google 캘린더에 추가"}</button>
        <button type="button" class="a-btn a-btn-danger" data-delete>${st.pendingDelete ? "한 번 더 누르면 삭제" : "작업 삭제"}</button>
      </div>`;
  };

  const renderResults = () => {
    const el = q('[data-a="search-results"]');
    if (!el) return;
    const hits = st.query ? st.todos.filter(matches).sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(0, 6) : [];
    el.hidden = !st.query;
    el.innerHTML = st.query
      ? hits.length
        ? `<p class="a-results-head">할 일</p><ul class="a-results">${hits
            .map((t) => `<li><button type="button" class="a-result" data-jump="${t.id}"><span class="a-result-title">${esc(t.title)}</span><span class="a-result-date">${md(t.dateKey)}</span></button></li>`)
            .join("")}</ul>`
        : '<p class="a-quiet">검색 결과가 없습니다.</p>'
      : "";
  };

  const syncUrl = () => {
    const p = new URLSearchParams(location.search);
    p.set("view", st.view);
    p.set("date", keyOf(st.cursor));
    history.replaceState(null, "", `${location.pathname}?${p}`);
  };

  const render = () => {
    root.classList.toggle("is-expanded", st.expanded);
    renderTitle();
    renderBanner();
    renderCalendar();
    renderCounts();
    renderBoard();
    renderMini();
    syncUrl();
  };

  /* ---------- actions ---------- */
  const select = (id) => {
    st.selected = id;
    st.pendingDelete = false;
    renderPanel();
    qa("[data-select]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.select === id)));
    if (id && cfg.panel === "drawer") {
      const first = q('[data-a="panel"] .a-input-title');
      if (first) first.focus({ preventScroll: true });
    }
  };

  const navigate = (dir) => {
    const d = st.cursor;
    if (st.view === "month") st.cursor = new Date(d.getFullYear(), d.getMonth() + dir, 1);
    else st.cursor = addDays(d, st.view === "week" ? 7 * dir : dir);
    st.adding = null;
    render();
  };

  const moveTodo = (id, k) => {
    const t = byId(id);
    if (!t || t.dateKey === k) return;
    const delta = diffDays(t.dateKey, k);
    t.dateKey = k;
    if (t.dueDate) t.dueDate = keyOf(addDays(parse(t.dueDate), delta));
    render();
    if (st.selected === id) renderPanel();
  };

  const commitAdd = (k, title) => {
    const clean = title.trim();
    st.adding = null;
    if (!clean) return render();
    const t = T(k, clean, "not-start", []);
    t.id = `n${Date.now()}`;
    st.todos.push(t);
    render();
    select(t.id);
  };

  /* ---------- events ---------- */
  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-scrim]");
    if (!t || !root.contains(t)) return;
    const d = t.dataset;
    if (d.view) {
      st.view = d.view;
      st.adding = null;
      render();
    } else if (d.nav) {
      if (d.nav === "today") {
        st.cursor = parse(TODAY);
        render();
      } else navigate(d.nav === "next" ? 1 : -1);
    } else if (d.select) select(d.select);
    else if (d.add) {
      st.adding = d.add;
      if (st.view === "month" && parse(d.add).getMonth() !== st.cursor.getMonth()) st.cursor = parse(d.add);
      renderCalendar();
      renderTitle();
    } else if (d.gotoDay) {
      st.cursor = parse(d.gotoDay);
      st.view = "day";
      st.adding = null;
      render();
    } else if ("close" in d || "scrim" in d) select(null);
    else if (d.setStatus) {
      const todo = byId(st.selected);
      if (todo) todo.status = d.setStatus;
      render();
      renderPanel();
    } else if ("toggleCal" in d) {
      const todo = byId(st.selected);
      if (todo) todo.calendarLinked = !todo.calendarLinked;
      renderPanel();
    } else if ("delete" in d) {
      if (!st.pendingDelete) {
        st.pendingDelete = true;
        renderPanel();
        q("[data-delete]")?.focus();
        return;
      }
      st.todos = st.todos.filter((x) => x.id !== st.selected);
      st.selected = null;
      st.pendingDelete = false;
      render();
      renderPanel();
    } else if ("expand" in d) {
      st.expanded = !st.expanded;
      render();
    } else if ("retry" in d) {
      st.error = false;
      st.loading = true;
      render();
      setTimeout(() => {
        st.loading = false;
        render();
      }, 700);
    } else if (d.pop) {
      const pop = document.getElementById(d.pop);
      if (pop) {
        pop.hidden = !pop.hidden;
        t.setAttribute("aria-expanded", String(!pop.hidden));
      }
    } else if (d.jump) {
      const todo = byId(d.jump);
      st.query = "";
      const s = q('[data-a="search"]');
      if (s) s.value = "";
      if (todo) {
        st.cursor = parse(todo.dateKey);
        st.view = "day";
        render();
        renderResults();
        select(todo.id);
      }
    }
  });

  root.addEventListener("input", (e) => {
    const el = e.target;
    if (el.matches('[data-a="search"]')) {
      st.query = el.value.trim();
      renderResults();
      renderCalendar();
      return;
    }
    const f = el.dataset.f;
    const todo = byId(st.selected);
    if (!f || !todo) return;
    if (f === "title" || f === "description") {
      todo[f] = el.value;
      if (f === "title") renderCalendar(), renderBoard();
    }
  });

  root.addEventListener("change", (e) => {
    const el = e.target;
    const f = el.dataset.f;
    const todo = byId(st.selected);
    if (!f || !todo || f === "title" || f === "description") return;
    if (f === "dateKey" && el.value) moveTodo(todo.id, el.value);
    else {
      todo[f] = el.value || null;
      if (f === "dueDate" && todo.dueDate && todo.dueDate <= todo.dateKey) todo.dueDate = null;
      render();
    }
  });

  root.addEventListener("keydown", (e) => {
    const el = e.target;
    if (el.matches(".a-add-input")) {
      if (e.key === "Enter" && !e.isComposing) commitAdd(el.dataset.addInput, el.value);
      else if (e.key === "Escape") {
        st.adding = null;
        renderCalendar();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      st.expanded = !st.expanded;
      render();
    } else if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      q('[data-a="search"]')?.focus();
    } else if (e.key === "Escape") {
      if (st.query) {
        st.query = "";
        const s = q('[data-a="search"]');
        if (s) s.value = "";
        renderResults();
        renderCalendar();
      } else if (st.selected && cfg.panel === "drawer") select(null);
      else if (st.expanded) {
        st.expanded = false;
        render();
      }
      qa("[data-pop]").forEach((b) => {
        const pop = document.getElementById(b.dataset.pop);
        if (pop && !pop.hidden) {
          pop.hidden = true;
          b.setAttribute("aria-expanded", "false");
        }
      });
    }
  });

  root.addEventListener("focusout", (e) => {
    if (e.target.matches(".a-add-input") && !e.target.value.trim()) {
      setTimeout(() => {
        if (st.adding && !q(".a-add-input:focus")) {
          st.adding = null;
          renderCalendar();
        }
      }, 0);
    }
  });

  /* drag a chip or span to another day */
  root.addEventListener("dragstart", (e) => {
    const t = e.target.closest("[data-drag]");
    if (!t) return;
    e.dataTransfer.setData("text/plain", t.dataset.drag);
    e.dataTransfer.effectAllowed = "move";
    root.classList.add("is-dragging");
  });
  root.addEventListener("dragend", () => {
    root.classList.remove("is-dragging");
    qa("[data-drop-over]").forEach((n) => n.removeAttribute("data-drop-over"));
  });
  root.addEventListener("dragover", (e) => {
    const cell = e.target.closest("[data-drop]");
    if (!cell) return;
    e.preventDefault();
    const k = cell.dataset.drop;
    qa("[data-drop-over]").forEach((n) => n.dataset.drop !== k && n.removeAttribute("data-drop-over"));
    qa(`[data-drop="${k}"]`).forEach((n) => n.setAttribute("data-drop-over", ""));
  });
  root.addEventListener("drop", (e) => {
    const cell = e.target.closest("[data-drop]");
    if (!cell) return;
    e.preventDefault();
    root.classList.remove("is-dragging");
    moveTodo(e.dataTransfer.getData("text/plain"), cell.dataset.drop);
  });

  narrow.addEventListener("change", renderCalendar);

  root.dataset.panel = cfg.panel;
  root.classList.add("is-ready");
  render();
  renderPanel();
  if (params.get("select")) select(params.get("select"));
})();
