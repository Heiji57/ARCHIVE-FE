/* ARCHIVE 시안 공통 로직: 샘플 데이터 + 일/주/월 렌더 + 상세 패널 + 하루 닫기 + 팔레트 + 퀵 캡처. 앱 코드와 무관한 시안용 */
(function () {
  const A = (window.ARC = {});
  A.TODAY = '2026-11-03'; A.NOW = 14 + 20 / 60; A.H0 = 0; A.H1 = 24; A.HH = 48;
  A.ST = { todo: '진행 전', doing: '진행 중', done: '완료' };
  A.TAG = { work: '업무', side: '사이드', study: '학습' };
  A.DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const pad = (n) => String(n).padStart(2, '0');
  A.pad = pad;
  A.d2s = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  A.s2d = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  A.add = (s, n) => { const d = A.s2d(s); d.setDate(d.getDate() + n); return A.d2s(d); };
  A.weekStart = (s) => A.add(s, -A.s2d(s).getDay());
  A.hm = (h) => { const m = Math.round(h * 60); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }; /* 입력값(type=time)용 24시간 */
  /* 화면 표시용 12시간: 9:00 AM / 짧게 9 AM / 범위 9:00 ~ 10:30 AM (오전·오후가 같으면 한 번만) */
  const ap = (h) => { const m = Math.round(h * 60) % 1440, H = Math.floor(m / 60), mm = m % 60; return { h12: H % 12 || 12, mm, p: H < 12 ? 'AM' : 'PM' }; };
  A.hmd = (h) => { const x = ap(h); return `${x.h12}:${pad(x.mm)} ${x.p}`; };
  A.hmc = (h) => { const x = ap(h); return `${x.h12}${x.mm ? ':' + pad(x.mm) : ''} ${x.p}`; };
  A.range = (a, b) => { const x = ap(a), y = ap(b); return x.p === y.p ? `${x.h12}:${pad(x.mm)} ~ ${y.h12}:${pad(y.mm)} ${y.p}` : `${A.hmd(a)} ~ ${A.hmd(b)}`; };
  A.esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  A.label = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${A.DOW[d.getDay()]}요일`; };

  const I = (p) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  A.ico = {
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    dash: I('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    todo: I('<path d="m4 12 5 5L20 6"/>'),
    retro: I('<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h5"/>'),
    set: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    bell: I('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0"/>'),
    gh: I('<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.5-.5-2 3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.5 1.4a12 12 0 0 0-6.2 0C6.9 2.7 5.8 3 5.8 3a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 4.3 10c0 5 3 6.200 6 6.500-.6.5-.6 1.200-.5 2V21"/>'),
    l: I('<path d="m15 18-6-6 6-6"/>'), r: I('<path d="m9 18 6-6-6-6"/>'),
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    mark: I('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    link: I('<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    inbox: I('<path d="M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z"/>'),
    sparkle: I('<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'),
  };

  /* ---------- 샘플 데이터 (2026-11-03 14:20 기준) ---------- */
  A.todos = [
    { id: 't1', title: 'PR #14 코드 리뷰', status: 'done', date: '2026-11-03', start: 9, end: 10.5, tag: 'work', note: '' },
    { id: 't2', title: '스프린트 회의', status: 'done', date: '2026-11-03', start: 11, end: 12, tag: 'work', note: '' },
    { id: 't3', title: '캘린더 드래그 버그 수정', status: 'doing', date: '2026-11-03', start: 13, end: 15.5, tag: 'work', note: '주 경계에서 dueDate가 안 밀리는 케이스 확인' },
    { id: 't4', title: 'i18n 문구 점검', status: 'todo', date: '2026-11-03', start: 16, end: 17, tag: 'side', note: '' },
    { id: 't5', title: '일일 회고 작성', status: 'todo', date: '2026-11-03', start: 18, end: 19, tag: 'study', note: '' },
    { id: 't6', title: '문서 정리', status: 'todo', date: null, start: null, end: null, tag: 'work', note: '' },
    { id: 't7', title: '설정 화면 QA', status: 'todo', date: null, start: null, end: null, tag: 'work', note: '' },
    { id: 't8', title: 'BE 요청 문서 초안', status: 'todo', date: null, start: null, end: null, tag: 'side', note: '' },
    { id: 't9', title: '주간 계획 세우기', status: 'done', date: '2026-11-02', start: 10, end: 11, tag: 'work', note: '' },
    { id: 't10', title: '로그인 이슈 재현', status: 'done', date: '2026-11-02', start: 14, end: 16, tag: 'work', note: '' },
    { id: 't11', title: '디자인 리뷰', status: 'todo', date: '2026-11-04', start: 15, end: 16, tag: 'work', note: '' },
    { id: 't12', title: '릴리스 점검', status: 'todo', date: '2026-11-05', start: 10, end: 12, tag: 'work', note: '' },
    { id: 't13', title: '리팩터링 스프린트', status: 'doing', date: '2026-11-04', until: '2026-11-07', start: null, end: null, tag: 'side', note: '' },
    { id: 't14', title: '영어 스터디', status: 'todo', date: '2026-11-06', start: 19, end: 20, tag: 'study', note: '' },
  ];
  A.commits = [
    { id: 'c1', date: '2026-11-03', start: 9.08, end: 9.83, msg: 'review: PR #14 의견 반영', repo: 'archive-fe', todoId: 't1' },
    { id: 'c2', date: '2026-11-03', start: 10.17, end: 10.5, msg: 'chore: 의존성 업데이트', repo: 'archive-fe', todoId: null },
    { id: 'c3', date: '2026-11-03', start: 13.17, end: 13.67, msg: 'fix(calendar): 드래그 시 dueDate 이동', repo: 'archive-fe', todoId: 't3' },
    { id: 'c4', date: '2026-11-03', start: 14, end: 14.25, msg: 'test: DnD 경계 케이스', repo: 'archive-fe', todoId: 't3' },
    { id: 'c5', date: '2026-11-02', start: 14.5, end: 15.5, msg: 'fix(auth): 토큰 재발급 루프', repo: 'archive-fe', todoId: 't10' },
    { id: 'c6', date: '2026-11-02', start: 17, end: 17.5, msg: 'docs: 설정 가이드', repo: 'archive-docs', todoId: null },
  ];
  A.retro = new Set(['2026-11-02', '2026-11-01', '2026-10-30', '2026-10-28', '2026-10-27']);
  A.s = { date: A.TODAY, view: 'day', sel: null, ghost: true };
  let uid = 100;

  A.byId = (id) => A.todos.find((t) => t.id === id);
  A.onDay = (s) => A.todos.filter((t) => t.date && t.date <= s && s <= (t.until || t.date));
  A.queue = () => A.todos.filter((t) => !t.date && t.status !== 'done');
  A.stats = (s) => {
    const l = A.onDay(s);
    return {
      n: l.length, done: l.filter((t) => t.status === 'done').length,
      plan: l.reduce((a, t) => a + (t.start != null ? t.end - t.start : 0), 0),
      commits: A.commits.filter((c) => c.date === s).length,
    };
  };
  A.sd = (st) => `<span class="sd sd-${st}" role="img" aria-label="${A.ST[st]}"></span>`;

  /* ---------- 렌더 ---------- */
  const lane = (s, inner) => `<div class="lane" data-lane="${s}" style="--n:${A.H1 - A.H0}">${inner}</div>`;
  const nowLine = () => `<div class="now" style="top:${(A.NOW - A.H0) * A.HH}px"><i>${A.hmc(A.NOW)}</i></div>`;
  const gutter = () => {
    let h = '';
    for (let x = A.H0; x < A.H1; x++) h += `<span style="top:${(x - A.H0) * A.HH}px">${pad(x)}:00</span>`;
    return `<div class="tl-gut" style="--n:${A.H1 - A.H0}">${h}</div>`;
  };
  A.lane = lane; A.gutter = gutter; A.nowLine = nowLine;
  A.chip = (t) => `<button class="chip" data-id="${t.id}" aria-current="${A.s.sel === t.id}" draggable="true">${A.sd(t.status)}${A.esc(t.title)}</button>`;
  A.block = (t) => {
    const top = (t.start - A.H0) * A.HH, h = Math.max((t.end - t.start) * A.HH - 2, 22);
    const small = h < 46;
    const lk = A.commits.filter((c) => c.todoId === t.id).length;
    return `<div class="blk ${small ? 'sm' : ''}" role="button" tabindex="0" data-id="${t.id}" data-st="${t.status}" draggable="true" aria-current="${A.s.sel === t.id}" style="top:${top}px;height:${h}px">
      <span class="sdbtn" data-toggle="${t.id}" title="완료 토글 (X)">${A.sd(t.status)}</span>
      <span class="bt">${A.esc(t.title)}${small ? `<span class="bm">${A.range(t.start, t.end)}</span>` : `<span class="bm">${A.range(t.start, t.end)}</span>`}</span>
      ${lk ? `<span class="lk" title="연결된 커밋 ${lk}개">↔${lk}</span>` : ''}</div>`;
  };
  A.ghostBlock = (c, wide) => {
    const top = (c.start - A.H0) * A.HH, h = Math.max((c.end - c.start) * A.HH - 2, 18);
    const t = c.todoId && A.byId(c.todoId);
    return `<div class="gh ${t ? 'linked' : ''}" style="top:${top}px;height:${h}px" title="${A.esc(c.repo)} · ${A.esc(c.msg)}${t ? ' ↔ ' + A.esc(t.title) : ''}"><b>${A.hm(c.start)}</b>${A.esc(c.msg)}</div>`;
  };

  A.dayHTML = (s) => {
    const g = A.s.ghost;
    const l = A.onDay(s), timed = l.filter((t) => t.start != null), all = l.filter((t) => t.start == null);
    const cm = A.commits.filter((c) => c.date === s);
    return `<div class="dv ${g ? 'has-ghost' : ''}">
      <div class="dv-head"><span></span><span>계획</span>${g ? '<span>실제 활동 (GitHub)</span>' : ''}</div>
      ${all.length ? `<div class="allday">${all.map(A.chip).join('')}</div>` : ''}
      <div class="tl">${gutter()}
        ${lane(s, timed.map(A.block).join('') + (s === A.TODAY ? nowLine() : ''))}
        ${g ? `<div class="lane ghost" style="--n:${A.H1 - A.H0}">${cm.map((c) => A.ghostBlock(c)).join('')}${s === A.TODAY ? nowLine().replace(/<i>.*<\/i>/, '') : ''}</div>` : ''}
      </div></div>`;
  };

  A.weekHTML = (s, wide) => {
    const ws = A.weekStart(s), days = [...Array(7)].map((_, i) => A.add(ws, i));
    const head = days.map((d) => {
      const st = A.stats(d), dd = A.s2d(d);
      return `<button class="wk-h ${d === A.TODAY ? 'today' : ''}" data-goto="${d}"><b>${dd.getDate()}</b>${A.DOW[dd.getDay()]}<small>계획 ${st.plan.toFixed(1)}h${A.s.ghost ? ` · 커밋 ${st.commits}` : ''}</small></button>`;
    }).join('');
    const ad = days.map((d) => `<div>${A.onDay(d).filter((t) => t.start == null).map(A.chip).join('')}</div>`).join('');
    const body = days.map((d) => lane(d,
      A.onDay(d).filter((t) => t.start != null).map(A.block).join('') +
      (A.s.ghost ? A.commits.filter((c) => c.date === d).map((c) => A.ghostBlock(c, wide)).join('') : '') +
      (d === A.TODAY ? nowLine() : ''))).join('');
    return `<div class="wk ${wide && A.s.ghost ? 'wide' : ''}" style="${A.s.ghost ? '' : '--gw:0px'}">
      <div class="wk-head"><span class="gut"></span>${head}</div>
      <div class="wk-ad"><span></span>${ad}</div>
      <div class="tl">${gutter()}${body}</div></div>`;
  };

  A.cells = (s) => {
    const d = A.s2d(s), first = new Date(d.getFullYear(), d.getMonth(), 1);
    const start = A.add(A.d2s(first), -first.getDay());
    return [...Array(42)].map((_, i) => { const x = A.add(start, i); return { d: x, other: A.s2d(x).getMonth() !== d.getMonth() }; });
  };
  A.monthHTML = (s) => {
    const cells = A.cells(s).map(({ d, other }) => {
      const l = A.onDay(d), dd = A.s2d(d).getDate();
      const dots = l.slice(0, 3).map((t) => A.sd(t.status)).join('');
      return `<button class="mc ${other ? 'other' : ''} ${d === A.TODAY ? 'today' : ''}" data-open="${d}" aria-current="${d === s}" aria-label="${A.label(d)}, 할 일 ${l.length}개${A.retro.has(d) ? ', 회고 있음' : ''}">
        <span class="n">${dd}</span>${A.retro.has(d) ? `<span class="bm" title="회고 작성됨">${A.ico.mark}</span>` : ''}
        <span class="dots">${dots}</span>${l.length ? `<span class="cnt">${l.length}개${l.length > 3 ? ' (+' + (l.length - 3) + ')' : ''}</span>` : ''}</button>`;
    }).join('');
    return `<div class="mv">${A.DOW.map((w) => `<div class="dow">${w}</div>`).join('')}${cells}</div>`;
  };
  A.miniHTML = (s) => {
    const d = A.s2d(s);
    const cells = A.cells(s).map(({ d: x, other }) => {
      const has = A.onDay(x).length, r = A.retro.has(x);
      return `<button class="${other ? 'other' : ''} ${x === A.TODAY ? 'today' : ''}" data-goto="${x}" aria-current="${x === s}" aria-label="${A.label(x)}">${A.s2d(x).getDate()}${r ? '<i class="r"></i>' : has ? '<i></i>' : ''}</button>`;
    }).join('');
    return `<div class="mini"><div class="mini-h"><b>${d.getFullYear()}년 ${d.getMonth() + 1}월</b><span><button class="ibtn" data-mini="-1" aria-label="이전 달">${A.ico.l}</button><button class="ibtn" data-mini="1" aria-label="다음 달">${A.ico.r}</button></span></div>
      <div class="mini-g">${A.DOW.map((w) => `<span class="dw">${w}</span>`).join('')}${cells}</div></div>`;
  };
  A.title = () => {
    const s = A.s.date, d = A.s2d(s), v = A.s.view;
    if (v === 'month') return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    if (v === 'week') { const a = A.s2d(A.weekStart(s)), b = A.s2d(A.add(A.weekStart(s), 6)); return `${a.getMonth() + 1}월 ${a.getDate()}일 – ${b.getMonth() + 1 !== a.getMonth() + 1 ? b.getMonth() + 1 + '월 ' : ''}${b.getDate()}일`; }
    return A.label(s);
  };
  A.viewHTML = (wide) => (A.s.view === 'month' ? A.monthHTML(A.s.date) : A.s.view === 'week' ? A.weekHTML(A.s.date, wide) : A.dayHTML(A.s.date));

  A.closeBarHTML = (s = A.s.date) => {
    const st = A.stats(s), pct = st.n ? Math.round((st.done / st.n) * 100) : 0;
    return `<div class="closebar"><span>완료 <b class="num">${st.done}</b> / 계획 <b class="num">${st.n}</b></span><span class="prog" role="img" aria-label="진행률 ${pct}%"><i style="width:${pct}%"></i></span>
      <span style="flex:1"></span><button class="btn btn-p" data-act="close-day">${A.ico.sparkle}하루 닫기 · 회고 초안</button></div>`;
  };

  A.panelHTML = (t) => {
    if (!t) return '';
    const cm = A.commits.filter((c) => c.todoId === t.id);
    return `<div class="pn"><div class="pn-h"><span>할 일 상세</span><button class="ibtn" data-act="close-panel" aria-label="상세 닫기">${A.ico.x}</button></div>
      <input class="pn-title" data-f="title" value="${A.esc(t.title)}" aria-label="제목">
      <div class="seg" role="group" aria-label="상태">${['todo', 'doing', 'done'].map((x) => `<button data-f="status" data-v="${x}" aria-pressed="${t.status === x}">${A.sd(x)}${A.ST[x]}</button>`).join('')}</div>
      <dl class="pn-grid"><dt>날짜</dt><dd><input type="date" data-f="date" value="${t.date || ''}" aria-label="날짜"></dd>
      <dt>시간</dt><dd><input type="time" step="1800" data-f="start" value="${t.start != null ? A.hm(t.start) : ''}" aria-label="시작"> – <input type="time" step="1800" data-f="end" value="${t.end != null ? A.hm(t.end) : ''}" aria-label="종료"></dd>
      <dt>태그</dt><dd><span class="tag">${A.TAG[t.tag] || '없음'}</span></dd></dl>
      <h3>연결된 활동</h3>${cm.length ? `<ul>${cm.map((c) => `<li><b>${A.hm(c.start)}</b>${A.esc(c.msg)} <span class="mono" style="color:var(--ink4)">${A.esc(c.repo)}</span></li>`).join('')}</ul>` : '<p class="empty">연결된 커밋이 없어요. 커밋 메시지에 할 일 번호를 넣으면 이어져요.</p>'}
      <h3>회고 메모</h3><textarea data-f="note" placeholder="오늘 이 일에서 배운 점" aria-label="회고 메모">${A.esc(t.note)}</textarea>
      <button class="del" data-act="del" data-id-del="${t.id}">삭제</button></div>`;
  };

  /* ---------- 동작 ---------- */
  const $ = (q, r = document) => r.querySelector(q);
  /* GitHub을 연결한 사용자에게만 커밋 기능을 보여 줌. ?gh=0, ?gh=1 로 시안 확인 */
  A.ghOn = () => { const q = new URLSearchParams(location.search).get('gh'); if (q != null) return q !== '0'; try { return localStorage.getItem('archive.gh') !== '0'; } catch (e) { return true; } };
  A.toast = (m) => { const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); e.textContent = m; document.body.append(e); setTimeout(() => e.remove(), 2200); };
  A.rerender = () => A.render && A.render();
  A.step = (dir) => {
    const v = A.s.view;
    if (v === 'month') { const d = A.s2d(A.s.date); d.setMonth(d.getMonth() + dir, 1); A.s.date = A.d2s(d); }
    else A.s.date = A.add(A.s.date, dir * (v === 'week' ? 7 : 1));
  };
  A.capture = (text) => {
    let date = null, start = null, tag = 'work', t = text;
    if (/모레/.test(t)) date = A.add(A.TODAY, 2); else if (/내일/.test(t)) date = A.add(A.TODAY, 1); else if (/오늘/.test(t)) date = A.TODAY;
    const m = t.match(/(오전|오후)?\s*(\d{1,2})시/);
    if (m) { start = +m[2]; if (m[1] === '오후' || (!m[1] && start < 8)) start += start < 12 ? 12 : 0; if (!date) date = A.s.date; }
    const tg = t.match(/#(\w+)/); if (tg && A.TAG[tg[1]]) tag = tg[1];
    t = t.replace(/모레|내일|오늘|(오전|오후)?\s*\d{1,2}시|#\w+/g, '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    const todo = { id: 't' + ++uid, title: t, status: 'todo', date, start, end: start != null ? start + 1 : null, tag, note: '' };
    A.todos.push(todo);
    if (date) A.s.date = date;
    A.s.sel = todo.id;
    A.toast(date ? `${A.label(date)}${start != null ? ' ' + A.hmd(start) : ' 종일'}에 추가했어요` : '배치 대기에 추가했어요');
    A.rerender();
  };

  A.dlg = () => { let d = $('#dlg'); if (!d) { d = document.createElement('dialog'); d.id = 'dlg'; document.body.append(d); d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); } return d; };

  A.closeDay = () => {
    const s = A.s.date, d = A.dlg();
    const open = A.onDay(s).filter((t) => t.status !== 'done' && !t.until);
    const done = A.onDay(s).filter((t) => t.status === 'done'), cm = A.commits.filter((c) => c.date === s);
    d.innerHTML = `<form class="dg" method="dialog"><h2>${A.label(s)} 닫기</h2>
      <p>완료 ${done.length}개 · 커밋 ${cm.length}개. 끝내지 못한 일은 항목별로 내일로 넘길지 정해요.</p>
      ${open.length ? open.map((t) => `<div class="row"><label>${A.sd(t.status)}<span style="flex:1">${A.esc(t.title)}</span><span class="mono" style="color:var(--ink3)">내일로 이월</span><input type="checkbox" data-carry="${t.id}" checked></label></div>`).join('') : '<p>남은 일이 없어요.</p>'}
      <div class="foot"><button class="btn" value="x">취소</button><button class="btn btn-p" id="mk" value="x" type="button">${A.ico.sparkle}이월하고 회고 초안 만들기</button></div></form>`;
    d.showModal();
    $('#mk', d).onclick = () => {
      let carried = 0;
      d.querySelectorAll('[data-carry]').forEach((c) => { if (c.checked) { const t = A.byId(c.dataset.carry); t.date = A.add(s, 1); carried++; } });
      const lines = done.map((t) => `- ${t.title}`).join('\n');
      const cl = cm.map((c) => `- ${c.msg} (${c.repo})`).join('\n');
      d.innerHTML = `<form class="dg" method="dialog"><h2>회고 초안 <span class="chip">${A.ico.sparkle}AI 요약 흐름 재사용</span></h2>
        <pre>## ${A.label(s)}\n\n완료한 일\n${lines || '- 없음'}\n\n남긴 커밋\n${cl || '- 없음'}\n\n이월 ${carried}개\n\n배운 점: </pre>
        <div class="foot"><button class="btn" value="x">닫기</button><button class="btn btn-p" id="sv" value="x" type="button">회고로 저장</button></div></form>`;
      $('#sv', d).onclick = () => { A.retro.add(s); d.close(); A.toast('회고로 저장했어요. 달력에 책갈피가 생겼어요'); A.rerender(); };
      A.rerender();
    };
  };

  A.palette = () => {
    const d = A.dlg();
    const cmds = [
      { t: '오늘로 이동', k: 'T', f: () => (A.s.date = A.TODAY) }, { t: '일간 보기', k: '', f: () => (A.s.view = 'day') },
      { t: '주간 보기', k: '', f: () => (A.s.view = 'week') }, { t: '월간 보기', k: '', f: () => (A.s.view = 'month') },
      { t: '하루 닫기 · 회고 초안', k: '', f: () => setTimeout(A.closeDay, 0) },
      { t: '실제 활동 트랙 켜기/끄기', k: 'G', f: () => (A.s.ghost = !A.s.ghost) },
    ];
    d.innerHTML = `<div class="pal"><input role="combobox" aria-expanded="true" aria-controls="pl" placeholder="명령어나 할 일 검색" aria-label="명령 팔레트"><ul id="pl" role="listbox"></ul></div>`;
    const inp = $('input', d), ul = $('#pl', d); let items = [], idx = 0;
    const draw = () => {
      const q = inp.value.trim().toLowerCase();
      const c = cmds.filter((x) => x.t.toLowerCase().includes(q)).map((x) => ({ ...x, g: '명령' }));
      const t = q ? A.todos.filter((x) => x.title.toLowerCase().includes(q)).slice(0, 6).map((x) => ({ t: x.title, k: x.date ? x.date.slice(5) : '대기', g: '할 일', f: () => { A.s.sel = x.id; if (x.date) A.s.date = x.date; } })) : [];
      items = [...c, ...t]; idx = Math.min(idx, Math.max(items.length - 1, 0));
      let last = ''; ul.innerHTML = items.map((x, i) => { const g = x.g !== last ? `<li class="grp" role="presentation">${x.g}</li>` : ''; last = x.g; return `${g}<li role="option" data-i="${i}" aria-selected="${i === idx}">${A.esc(x.t)}<small>${x.k}</small></li>`; }).join('') || '<li class="grp">결과가 없어요</li>';
    };
    const run = (i) => { const x = items[i]; if (!x) return; d.close(); x.f(); A.rerender(); };
    inp.oninput = () => { idx = 0; draw(); };
    inp.onkeydown = (e) => { if (e.key === 'ArrowDown') { idx = Math.min(idx + 1, items.length - 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { idx = Math.max(idx - 1, 0); draw(); e.preventDefault(); } else if (e.key === 'Enter') run(idx); };
    ul.onclick = (e) => { const li = e.target.closest('[data-i]'); if (li) run(+li.dataset.i); };
    draw(); d.showModal(); inp.focus();
  };

  A.init = (render) => {
    A.render = render;
    document.querySelectorAll('[data-ico]').forEach((e) => { e.outerHTML = A.ico[e.dataset.ico]; });
    const q = new URLSearchParams(location.search);
    if (q.get('view')) A.s.view = q.get('view');
    if (q.get('select')) A.s.sel = q.get('select');
    if (q.get('ghost') === '0') A.s.ghost = false;
    document.addEventListener('click', (e) => {
      const g = (a) => e.target.closest(`[${a}]`);
      let el;
      if ((el = g('data-toggle'))) { const t = A.byId(el.dataset.toggle); t.status = t.status === 'done' ? 'todo' : 'done'; return A.rerender(); }
      if ((el = g('data-act'))) {
        const a = el.dataset.act;
        if (a === 'close-panel') A.s.sel = null;
        else if (a === 'close-day') return A.closeDay();
        else if (a === 'palette') return A.palette();
        else if (a === 'ghost') A.s.ghost = !A.s.ghost;
        else if (a === 'del') {
          if (el.dataset.arm) { A.todos = A.todos.filter((t) => t.id !== el.dataset.idDel); A.s.sel = null; A.toast('삭제했어요'); }
          else { el.dataset.arm = '1'; el.textContent = '정말 삭제할까요?'; setTimeout(() => { if (el.isConnected) { delete el.dataset.arm; el.textContent = '삭제'; } }, 3000); return; }
        }
        return A.rerender();
      }
      if ((el = g('data-view'))) { A.s.view = el.dataset.view; return A.rerender(); }
      if ((el = g('data-nav'))) { const v = el.dataset.nav; if (v === 'today') A.s.date = A.TODAY; else A.step(+v); return A.rerender(); }
      if ((el = g('data-mini'))) { const d = A.s2d(A.s.date); d.setMonth(d.getMonth() + +el.dataset.mini, 1); A.s.date = A.d2s(d); return A.rerender(); }
      if ((el = g('data-open'))) { A.s.date = el.dataset.open; A.s.view = 'day'; return A.rerender(); }
      if ((el = g('data-goto'))) { A.s.date = el.dataset.goto; if (el.closest('.wk-head')) A.s.view = 'day'; return A.rerender(); }
      if ((el = g('data-id'))) { A.s.sel = el.dataset.id; return A.rerender(); }
      if ((el = g('data-f')) && el.dataset.f === 'status') { A.byId(A.s.sel).status = el.dataset.v; return A.rerender(); }
    });
    document.addEventListener('change', (e) => {
      const f = e.target.dataset && e.target.dataset.f; if (!f || f === 'status') return;
      const t = A.byId(A.s.sel); if (!t) return; const v = e.target.value;
      if (f === 'title') t.title = v.trim() || t.title;
      else if (f === 'note') t.note = v;
      else if (f === 'date') t.date = v || null;
      else { const [h, m] = v.split(':').map(Number); const x = v ? h + m / 60 : null; t[f] = x; if (t.start != null && (t.end == null || t.end <= t.start)) t.end = t.start + 1; }
      A.rerender();
    });
    /* 드래그: 블록/칩/큐 항목을 시간선·월 칸에 놓기 */
    let drag = null;
    document.addEventListener('dragstart', (e) => { const el = e.target.closest('[data-id]'); if (!el) return; drag = el.dataset.id; e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'move'; });
    document.addEventListener('dragover', (e) => { const l = e.target.closest('[data-lane],[data-open],[data-drop]'); if (l && drag) { e.preventDefault(); l.classList.add('drop'); } });
    document.addEventListener('dragleave', (e) => { const l = e.target.closest('.drop'); if (l) l.classList.remove('drop'); });
    document.addEventListener('drop', (e) => {
      const l = e.target.closest('[data-lane],[data-open],[data-drop]'); if (!l || !drag) return; e.preventDefault(); l.classList.remove('drop');
      const t = A.byId(drag); drag = null; if (!t) return;
      if (l.dataset.lane) {
        const y = e.clientY - l.getBoundingClientRect().top, h = Math.min(Math.max(Math.floor((A.H0 + y / A.HH) * 2) / 2, A.H0), A.H1 - 1);
        const dur = t.start != null ? t.end - t.start : 1;
        if (t.until) { const span = A.s2d(t.until) - A.s2d(t.date); t.date = l.dataset.lane; t.until = A.d2s(new Date(A.s2d(t.date).getTime() + span)); }
        else t.date = l.dataset.lane;
        t.start = h; t.end = Math.min(h + dur, A.H1);
        A.toast(`${A.label(t.date)} ${A.hmd(h)}로 옮겼어요`);
      } else {
        if (t.until) { const span = A.s2d(t.until) - A.s2d(t.date); t.date = l.dataset.open || l.dataset.drop; t.until = A.d2s(new Date(A.s2d(t.date).getTime() + span)); } else t.date = l.dataset.open || l.dataset.drop;
        A.toast(`${A.label(t.date)}로 옮겼어요`);
      }
      A.rerender();
    });
    document.addEventListener('dragend', () => { drag = null; document.querySelectorAll('.drop').forEach((x) => x.classList.remove('drop')); });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return A.palette(); }
      if (e.target.closest('input,textarea,dialog') || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Enter' && e.target.matches('.blk')) { A.s.sel = e.target.dataset.id; return A.rerender(); }
      const k = e.key.toLowerCase();
      const map = { t: () => (A.s.date = A.TODAY), g: () => (A.s.ghost = !A.s.ghost),
        j: () => A.step(1), k: () => A.step(-1), escape: () => (A.s.sel = null),
        x: () => { const t = A.byId(A.s.sel); if (t) t.status = t.status === 'done' ? 'todo' : 'done'; } };
      if (k === 'c') { const c = $('[data-capture]'); if (c) { e.preventDefault(); c.focus(); } return; }
      if (map[k] && !(A.listKeys && (k === 'j' || k === 'k'))) { map[k](); A.rerender(); }
    });
    document.addEventListener('submit', (e) => {
      const f = e.target.closest('[data-capform]'); if (!f) return; e.preventDefault();
      const i = $('input', f); const v = i.value.trim(); i.value = ''; if (v) A.capture(v);
    });
    render();
  };
})();
