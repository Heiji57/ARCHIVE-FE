/* 시안 D 공통 셸 동작: 사이드바(미니 월·채널·연동·배치 대기), 카드, 상세 모달, 패널 토글. shared.js 다음에 로드 */
(function () {
  const A = window.ARC, $ = (q) => document.querySelector(q);
  const P = (window.PL = { chan: 'all', side: true, rp: true });
  P.dur = (t) => (t.start != null ? t.end - t.start : t.est || 0.5);
  P.hmm = (h) => `${Math.floor(h)}:${A.pad(Math.round((h % 1) * 60))}`;
  P.tags = (t) => { if (!Array.isArray(t.tags)) t.tags = t.tag ? [t.tag] : []; return t.tags; };
  P.pass = (t) => P.chan === 'all' || P.tags(t).includes(P.chan);
  P.dayTot = (d) => {
    const all = A.onDay(d), done = all.filter((t) => t.status === 'done').reduce((a, t) => a + P.dur(t), 0), tot = all.reduce((a, t) => a + P.dur(t), 0);
    return { done, tot, pct: tot ? Math.round((done / tot) * 100) : 0 };
  };

  /* 카드 시안: 0 = 기존, 1–5 = 새 시안. ?card=N 으로 고르고 브라우저에 기억 */
  P.cardV = (() => {
    const q = new URLSearchParams(location.search).get('card');
    try { if (q != null) localStorage.setItem('archive.cardV2', q); return +(q ?? localStorage.getItem('archive.cardV2') ?? 6); } catch (e) { return q != null ? +q : 6; }
  })();
  P.dur2 = (h) => { const m = Math.round(h * 60), hh = Math.floor(m / 60), mm = m % 60; return hh ? `${hh}h${mm ? ' ' + mm + 'm' : ''}` : `${mm}m`; };
  const meta = (t) => {
    const lk = A.commits.filter((c) => c.todoId === t.id).length;
    return { lk: A.s.ghost ? lk : 0, tag: A.TAG[t.tag] || '기타', tm: t.start != null ? A.range(t.start, t.end) : t.until ? `~${+t.until.slice(5, 7)}/${+t.until.slice(8)}` : '' };
  };
  const attrs = (t, cls) => `class="${cls}" role="button" tabindex="0" data-id="${t.id}" data-st="${t.status}" draggable="true" aria-current="${A.s.sel === t.id}"`;
  const cb = (t) => `<span class="cb" data-toggle="${t.id}" role="checkbox" aria-checked="${t.status === 'done'}" aria-label="완료"></span>`;
  const R = {
    0: (t) => {
      const { lk } = meta(t);
      return `<div ${attrs(t, 'card')}>
      <div class="r1"><span class="t">${A.esc(t.title)}</span><span class="est" title="예상 시간">${P.hmm(P.dur(t))}</span></div>
      ${t.start != null ? `<span class="tm ${t.status === 'doing' ? 'doing' : ''}">${A.range(t.start, t.end)}</span>` : t.until ? `<span class="tm">~${t.until.slice(5).replace('-', '/')}까지</span>` : ''}
      <div class="r2"><span class="sdbtn" data-toggle="${t.id}" title="완료 (X)">${A.sd(t.status)}</span>${lk ? `<span class="lk" title="연결된 커밋">↔ 커밋 ${lk}</span>` : ''}<span class="hash"># ${A.TAG[t.tag] || '기타'}</span></div></div>`;
    },
    /* 1. 줄 목록: 상자 없이 헤어라인으로만 나눈 행 */
    1: (t) => { const m = meta(t); return `<div ${attrs(t, 'cv1')}>${cb(t)}<div class="m"><span class="t">${A.esc(t.title)}</span><span class="s">${m.tag}${m.lk ? ` · 커밋 ${m.lk}` : ''}</span></div><span class="r">${t.start != null ? A.hmc(t.start) : P.dur2(P.dur(t))}</span></div>`; },
    /* 2. 시간표: 왼쪽 시각 열 + 세로선 */
    2: (t) => { const m = meta(t); return `<div ${attrs(t, 'cv2')}><div class="tc"><b>${t.start != null ? A.hmc(t.start) : '—'}</b><span>${P.dur2(P.dur(t))}</span></div><div class="bd"><span class="t">${A.esc(t.title)}</span><span class="s">${m.tag}${t.until ? ` · ${m.tm}까지` : ''}${m.lk ? ` · 커밋 ${m.lk}` : ''}</span></div>${cb(t)}</div>`; },
    /* 3. 색인 카드: 제목 위, 아랫단 한 줄 메타 */
    3: (t) => { const m = meta(t); return `<div ${attrs(t, 'cv3')}><div class="t">${A.esc(t.title)}</div><div class="ft">${m.tm ? `<span>${m.tm}</span>` : `<span>${P.dur2(P.dur(t))}</span>`}<span>${m.tag}</span>${m.lk ? `<span>커밋 ${m.lk}</span>` : ''}${cb(t)}</div></div>`; },
    /* 4. 상태 레일: 왼쪽 2px 색, 두 줄 고정 높이 */
    4: (t) => { const m = meta(t); return `<div ${attrs(t, 'cv4')}><span class="t">${A.esc(t.title)}</span><span class="e">${P.dur2(P.dur(t))}</span><span class="s">${[m.tm, m.tag, m.lk ? '커밋 ' + m.lk : ''].filter(Boolean).join('  ·  ')}</span>${cb(t)}</div>`; },
    /* 5. 노트: 배경 없는 체크리스트, 상태별 묶음 */
    5: (t) => { const m = meta(t); return `<div ${attrs(t, 'cv5')}>${cb(t)}<div><span class="t">${A.esc(t.title)}</span><span class="s">${[m.tm, m.tag, m.lk ? '커밋 ' + m.lk : ''].filter(Boolean).join(', ')}</span></div></div>`; },
  };
  P.card = (t, v = P.cardV) => (R[v] || R[0])(t);
  P.list = (items, v = P.cardV) => {
    if (!items.length) return '<div class="empty-col">여기로 끌어다 놓기</div>';
    const one = (t) => P.card(t, v);
    if (v === 2) {
      const a = items.filter((t) => t.start != null), b = items.filter((t) => t.start == null);
      return `<div class="vl v2">${a.map(one).join('')}${b.length ? `<p class="gh2">시간 미정</p>${b.map(one).join('')}` : ''}</div>`;
    }
    if (v === 5) {
      return `<div class="vl v5">${[['doing', '하는 중'], ['todo', '할 일'], ['done', '끝냄']].map(([k, n]) => { const g = items.filter((t) => t.status === k); return g.length ? `<p class="gh5">${n} <span>${g.length}</span></p>${g.map(one).join('')}` : ''; }).join('')}</div>`;
    }
    return `<div class="vl v${v}">${items.map(one).join('')}</div>`;
  };

  P.frame = () => {
    const app = $('#app'); app.classList.toggle('no-side', !P.side); app.classList.toggle('no-rp', !P.rp);
    const r = $('[data-rp]'); r && r.setAttribute('aria-pressed', P.rp);
    const g = $('#gbtn'); g && g.setAttribute('aria-pressed', A.s.ghost);
  };

  P.sidebar = () => {
    $('#mini').innerHTML = A.miniHTML(A.s.date);
    const cnt = (k) => A.todos.filter((t) => t.status !== 'done' && (k === 'all' || P.tags(t).includes(k))).length;
    $('#chans').innerHTML = [['all', '전체'], ...Object.entries(A.TAG)].map(([k, n]) => `<button class="ch" data-chan="${k}" aria-pressed="${P.chan === k}"><span class="h">#</span>${n}<span class="n">${cnt(k)}</span></button>`).join('');
    const rd = $('#rday');
    if (rd) { const st = A.stats(A.TODAY), w = A.retro.has(A.TODAY);
      rd.innerHTML = `<h2>오늘 회고</h2>${w ? `<a class="rd on" href="d-retro.html?date=${A.TODAY}">${A.ico.mark}<span>오늘 회고 보기</span><em>썼어요</em></a>` : `<button type="button" class="rd" data-reflect="${A.TODAY}">${A.ico.mark}<span>오늘 회고 쓰기</span><em>완료 ${st.done}/${st.n}</em></button>`}`; }
    const pe = $('#probs');
    if (pe) { const iss = P.issues(); pe.hidden = !iss.length;
      pe.innerHTML = iss.length ? `<h2>연동 문제</h2>${iss.map((x) => `<button type="button" class="pb" data-pb="${x.k}">${P.warnIc}<span><b>${x.t}</b><small>${x.d}</small></span></button>`).join('')}` : ''; }
    const q = A.queue().filter(P.pass), el = $('#queue');
    if (el) el.innerHTML = q.map((t) => `<button class="qi" draggable="true" data-id="${t.id}" style="--tc:${(P.TAGC || {})[t.tag] || 'var(--ink3)'}"><span class="qd"></span>${A.esc(t.title)}</button>`).join('') || '<p class="mono" style="color:var(--ink4);font-size:12px;margin:0">비어 있어요</p>';
  };

  /* 연동 문제: 고쳐야 할 때만 보임. ?issues=0 이면 문제 없는 상태 */
  P.warnIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/></svg>';
  P.issues = () => { if (new URLSearchParams(location.search).get('issues') === '0') return [];
    const f = A.todos.filter((t) => t.push === 'failed');
    return [f.length && { k: 'gcal', t: `Google로 보내지 못한 할 일 ${f.length}개`, d: f.map((t) => t.title).slice(0, 2).join(', ') }, { k: 'gh', t: 'GitHub 이메일 권한이 필요해요', d: '커밋 작성자 일부가 안 보여요' }].filter(Boolean); };
  { const t = A.byId('t11'); if (t) t.push = 'failed'; }

  P.detail = () => {
    const t = A.byId(A.s.sel), dlg = $('#detail');
    if (t) { dlg.innerHTML = P.detailHTML(t); if (!dlg.open) dlg.showModal(); } else if (dlg.open) dlg.close();
  };

  /* 공통 핸들러보다 먼저 등록되도록 shared.js 의 init 전에 실행됨 */
  document.addEventListener('click', (e) => {
    const g = (a) => e.target.closest(`[${a}]`); let el;
    if ((el = g('data-chan'))) { P.chan = el.dataset.chan; A.rerender(); }
    else if (g('data-side')) { P.side = !P.side; A.rerender(); }
    else if (g('data-rp')) { P.rp = !P.rp; A.rerender(); }
    else if (g('data-pb')) { if (window.UM && UM.openSettings) UM.openSettings('link'); else location.href = 'd-settings.html#link'; }
    else if ((el = g('data-reflect'))) { if (el.dataset.reflect) A.s.date = el.dataset.reflect; A.closeDay(); }
  });
  document.addEventListener('DOMContentLoaded', () => {
    const dlg = $('#detail');
    dlg.addEventListener('close', () => { if (A.s.sel) { A.s.sel = null; A.rerender(); } });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });

  /* 사이드바 + 상단 바 + 아이콘 줄 마크업 (두 페이지 공용) */
  try { const x = JSON.parse(sessionStorage.getItem('archive.aiTodos') || '[]'); x.forEach((t) => { if (!A.byId(t.id)) A.todos.push(t); }); } catch (e) {}
  P.shell = (page) => `
  <aside class="side" aria-label="사이드바">${P.sideExtra()}
    <div class="ws"><i></i>A.R.C.H.I.V.E${P.sideIn()}</div>
    <section id="mini" aria-label="미니 달력"></section>
    <section aria-label="캘린더"><h2 class="hx">캘린더<button class="ibtn" data-cm-new aria-label="새 캘린더" title="새 캘린더">${A.ico.plus}</button></h2><div id="cals"></div></section>
    <section aria-label="태그"><h2>태그</h2><div id="chans"></div></section>
    <section aria-label="오늘 회고" id="rday"></section>
    ${page === 'todos' ? '<section aria-label="배치 대기"><h2>배치 대기 · 끌어서 날짜에 놓기</h2><div id="queue"></div></section>' : ''}
    <section aria-label="연동 문제" id="probs" hidden></section>
    <div class="foot"><span class="av">D</span><span style="flex:1">developer</span><a class="ibtn" href="#" aria-label="설정">${A.ico.set}</a></div>
  </aside>
  <header class="top">
    ${P.sideBtn()}${P.todayBtn()}
    <h1 id="ttl"></h1>
    <span id="topx"></span>
    <nav class="tabs" aria-label="주 메뉴"><a href="d-ai.html" ${page === 'ai' ? 'aria-current="page"' : ''}>AI</a><a href="d-calendar.html" ${page === 'calendar' ? 'aria-current="page"' : ''}>캘린더</a><a href="d-todos.html" ${page === 'todos' ? 'aria-current="page"' : ''}>할 일</a><a href="d-retro2.html" ${page === 'retro' ? 'aria-current="page"' : ''}>회고</a></nav>
    <button class="btn" data-act="palette">${A.ico.search}<span class="kbd">Ctrl K</span></button>
  </header>`;
  P.sideExtra = P.sideIn = () => '';
  P.sideBtn = () => `<button class="ibtn" data-side aria-label="사이드바 접기">${A.ico.l}</button>`;
  P.todayBtn = () => '<button class="btn" data-nav="today">오늘</button>';
  P.strip = (rpLabel, rpIcon) => `
  <nav class="strip" aria-label="패널">
    <button data-rp aria-pressed="true" aria-label="${rpLabel} 패널" title="${rpLabel} 패널">${A.ico[rpIcon]}</button>
    <button data-reflect aria-label="오늘 마무리" title="오늘 마무리 · 회고">${A.ico.retro}</button>
  </nav>`;
})();

/* ---------- Notion식 캘린더 + 카드 6 (시작 ~ 끝, 태그, 상태 색, 체크박스 없음) ---------- */
(function () {
  const A = window.ARC, P = window.PL;
  /* 상태 색 = 앱 토큰 --color-status-todo / progress / done */
  P.STC = { todo: 'var(--ink3)', doing: 'var(--primary)', done: 'var(--done)' };
  P.TAGC = P.STC; /* 예전 이름을 쓰는 곳(배치 대기 점)도 상태 색으로 */
  const md = (s) => `${+s.slice(5, 7)}/${+s.slice(8)}`;
  const DAY = 864e5, dd = (a, b) => Math.round((A.s2d(b) - A.s2d(a)) / DAY);
  P.multi = (t) => !!(t.until && t.until !== t.date);
  P.when = (t, withDate) => {
    if (!t.date) return '일정 없음';
    if (P.multi(t)) return `${md(t.date)} ~ ${md(t.until)}`;
    if (t.start != null) return `${withDate ? md(t.date) + ' ' : ''}${A.range(t.start, t.end)}`;
    return `${md(t.date)} 종일`;
  };
  P.len = (t) => (!t.date ? '' : P.multi(t) ? dd(t.date, t.until) + 1 + '일' : t.start != null ? P.dur2(t.end - t.start) : '');
  /* 마감 표시: D-N / 오늘 마감 / N일 지남 / 완료 */
  P.due = (t) => {
    if (t.status === 'done') return { txt: '완료', cls: 'ok' };
    const n = dd(A.TODAY, t.until);
    return n > 0 ? { txt: `D-${n}`, cls: n <= 2 ? 'soon' : '' } : n === 0 ? { txt: '오늘 마감', cls: 'soon' } : { txt: `${-n}일 지남`, cls: 'late' };
  };
  P.tagHTML = (t) => { const l = P.tags(t); return l.length ? `<span class="tgs">${l.map((k) => `<span class="tg">${A.esc(A.TAG[k] || k)}</span>`).join('')}</span>` : ''; };
  const col = (t) => P.STC[t.status] || 'var(--ink3)';
  const at = (t, cls, style = '') => `class="${cls}" role="button" tabindex="0" data-id="${t.id}" data-st="${t.status}" draggable="true" aria-current="${A.s.sel === t.id}" aria-label="${A.esc(t.title)}, ${P.when(t, true)}, ${A.ST[t.status]}" style="--tc:${col(t)};${style}"`;

  /* 여러 날 할 일: 날짜 칸 막대 + 마감까지 남은 날 */
  const segs = (t) => {
    const n = dd(t.date, t.until) + 1, el = Math.min(Math.max(dd(t.date, A.TODAY) + 1, 0), n);
    if (n > 14) return `<span class="sgb"><i style="width:${(el / n) * 100}%"></i></span>`;
    return `<span class="sg">${[...Array(n)].map((_, i) => `<i class="${i < el ? 'on' : ''} ${i === el - 1 && el < n + 1 && dd(t.date, A.TODAY) === i ? 'tdy' : ''}"></i>`).join('')}</span>`;
  };
  const c6 = (t, withDate) => {
    if (P.multi(t)) {
      const d = P.due(t);
      return `<div ${at(t, 'cv6 sp')}><span class="t">${A.esc(t.title)}</span><span class="w"><span>${P.when(t)}</span><em>${P.len(t)}</em><b class="dl ${d.cls}">${d.txt}</b></span>${segs(t)}${P.tagHTML(t)}</div>`;
    }
    return `<div ${at(t, 'cv6')}><span class="t">${A.esc(t.title)}</span><span class="w"><span>${P.when(t, withDate)}</span>${P.len(t) ? `<em>${P.len(t)}</em>` : ''}</span>${P.tagHTML(t)}</div>`;
  };
  const old = P.card;
  P.card = (t, v = P.cardV) => (v === 6 ? c6(t, false) : old(t, v));

  /* 시간 그리드 (커밋 표시 없음) */
  P.gutter = () => {
    let h = '';
    for (let x = A.H0 + 1; x < A.H1; x++) h += `<span style="top:${(x - A.H0) * A.HH}px">${A.hmc(x)}</span>`;
    return `<div class="ng-gut" style="--n:${A.H1 - A.H0}">${h}</div>`;
  };
  P.ev = (t) => {
    const top = (t.start - A.H0) * A.HH + 1, h = Math.max((t.end - t.start) * A.HH - 3, 20), sz = h < 40 ? 'xs' : h < 76 ? 'sm' : '';
    return `<div ${at(t, 'ev ' + sz, `top:${top}px;height:${h}px`)}><span class="t">${A.esc(t.title)}</span><span class="w">${A.range(t.start, t.end)}${sz === 'sm' ? `<span class="wt">${P.tags(t).map((k) => A.TAG[k] || k).join(' #')}</span>` : ''}</span>${t.note ? `<span class="nt">${A.esc(t.note)}</span>` : ''}${sz ? '' : P.tagHTML(t)}</div>`;
  };
  P.dayCol = (d, faintNow) => {
    const l = A.onDay(d).filter((t) => t.start != null && !P.multi(t) && P.pass(t));
    const y = (A.NOW - A.H0) * A.HH;
    const now = d === A.TODAY ? `<div class="nl" style="top:${y}px"></div>` : faintNow ? `<div class="nl faint" style="top:${y}px"></div>` : '';
    const we = [0, 6].includes(A.s2d(d).getDay());
    return `<div class="ng-col ${we ? 'we' : ''} ${d < A.TODAY ? 'past' : ''}" data-lane="${d}" style="--n:${A.H1 - A.H0}">${l.map(P.ev).join('')}${now}</div>`;
  };
  /* 종일 칩 / 여러 날 막대 (range: 보이는 날짜 배열 안에서 grid-column 계산) */
  P.adb = (t) => `<div ${at(t, 'adb')}><span>${A.esc(t.title)}</span><em>종일</em></div>`;
  P.spanBar = (t, days) => {
    const first = days[0], last = days[days.length - 1], end = t.until;
    const a = t.date < first ? 0 : days.indexOf(t.date), b = end > last ? days.length - 1 : days.indexOf(end);
    const d = P.due(t), cutL = t.date < first, showEnd = end <= last;
    return `<div ${at(t, `spb ${cutL ? 'cut-l' : ''} ${showEnd ? '' : 'cut-r'}`, `grid-column:${a + 1}/${b + 2}`)}>
      <span class="t">${cutL ? '‹ ' : ''}${A.esc(t.title)}</span><span class="r">${md(t.date)} ~ ${md(end)}</span>
      ${showEnd ? `<span class="fl ${d.cls}" title="마감 ${md(end)}">마감 · ${d.txt}</span>` : '<span class="fl ghost">›</span>'}</div>`;
  };
  P.dayView = (d) => {
    const ad = A.onDay(d).filter((t) => (t.start == null || P.multi(t)) && P.pass(t));
    return `${ad.length ? `<div class="ad1">${ad.map((t) => (P.multi(t) ? P.spanBar(t, [d]) : P.adb(t))).join('')}</div>` : ''}<div class="ng one">${P.gutter()}${P.dayCol(d)}</div>`;
  };

  /* 상세: 시작/끝/태그/상태 (opts.commits=false 면 커밋 섹션 숨김) */
  P.detailOpts = { commits: true };
  P.detailHTML = (t) => {
    if (!t) return '';
    const cm = A.commits.filter((c) => c.todoId === t.id);
    const d = P.multi(t) ? P.due(t) : null;
    return `<div class="pn nd"><div class="pn-h"><span>할 일</span><button class="ibtn" data-act="close-panel" aria-label="닫기">${A.ico.x}</button></div>
      <input class="pn-title" data-f="title" value="${A.esc(t.title)}" aria-label="제목">
      <p class="nd-when" style="--tc:${col(t)}">${A.ST[t.status]} · ${P.when(t, true)}${P.len(t) ? ` · ${P.len(t)}` : ''}${d ? ` · <b class="dl ${d.cls}">${d.txt}</b>` : ''}</p>
      <dl class="pn-grid">
        <dt>상태</dt><dd><div class="seg st" role="group" aria-label="상태">${['todo', 'doing', 'done'].map((x) => `<button data-f="status" data-v="${x}" aria-pressed="${t.status === x}" style="--tc:${P.STC[x]}">${A.ST[x]}</button>`).join('')}</div></dd>
        <dt>시작</dt><dd><input type="date" data-f="date" value="${t.date || ''}" aria-label="시작 날짜"><input type="time" step="1800" data-f="start" value="${t.start != null && !P.multi(t) ? A.hm(t.start) : ''}" aria-label="시작 시각"></dd>
        <dt>마감</dt><dd><input type="date" data-f="until" value="${t.until || t.date || ''}" aria-label="마감 날짜"><input type="time" step="1800" data-f="end" value="${t.end != null && !P.multi(t) ? A.hm(t.end) : ''}" aria-label="끝 시각"></dd>
        <dt>태그</dt><dd>${P.tagEd(P.tags(t), 'sel')}</dd>
      </dl>
      <p class="nd-hint">마감을 시작과 다른 날로 잡으면 기간 할 일이 되어 날짜 칸 막대와 남은 날(D-N)로 표시돼요.</p>
      ${P.detailOpts.commits ? `<h3>연결된 커밋</h3>${cm.length ? `<ul>${cm.map((c) => `<li><b>${A.hm(c.start)}</b>${A.esc(c.msg)}</li>`).join('')}</ul>` : '<p class="empty">아직 없어요</p>'}` : ''}
      <h3>메모</h3><textarea data-f="note" aria-label="메모">${A.esc(t.note)}</textarea>
      <button class="del" data-act="del" data-id-del="${t.id}">삭제</button></div>`;
  };
  document.addEventListener('change', (e) => {
    const f = e.target.dataset && e.target.dataset.f; if (f !== 'until' && f !== 'date') return;
    const t = A.byId(A.s.sel); if (!t) return; e.stopImmediatePropagation();
    const v = e.target.value; if (!v) return;
    if (f === 'date') { const span = t.until ? A.s2d(t.until) - A.s2d(t.date) : 0; t.date = v; if (t.until) t.until = A.d2s(new Date(A.s2d(v).getTime() + span)); }
    else { if (v <= t.date) delete t.until; else { t.until = v; t.start = null; t.end = null; } }
    A.rerender();
  });
})();

/* ---------- 태그 여러 개 + 태그 입력기 + 새 할 일 모달 ---------- */
(function () {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const name = (k) => A.TAG[k] || k;
  /* 샘플: 태그 두 개짜리 할 일 */
  Object.assign(A.TAG, { 리뷰: '리뷰', 버그: '버그' });
  [['t1', ['work', '리뷰']], ['t3', ['work', '버그']], ['t13', ['side', '버그']], ['t11', ['work', '리뷰']]].forEach(([id, l]) => { const t = A.byId(id); if (t) t.tags = l; });

  /* 태그 입력기: 붙은 태그 칩(×) + 입력칸, 포커스 중에는 기존 태그 추천 / 새로 만들기 */
  const sugg = (tags, q) => {
    const ks = Object.keys(A.TAG).filter((k) => !tags.includes(k) && name(k).toLowerCase().includes(q.toLowerCase()));
    const exists = Object.keys(A.TAG).some((k) => name(k) === q);
    return `<p class="sg-h">${q ? '검색 결과' : '최근 사용'}</p>` + ks.map((k) => `<button type="button" data-tadd="${A.esc(k)}">${A.esc(name(k))}</button>`).join('') +
      (q && !exists ? `<button type="button" class="mk" data-tadd="${A.esc(q)}">새 태그 <b>${A.esc(q)}</b></button>` : '') ||
      '<span class="none">일치하는 태그 없음</span>';
  };
  P.tagEd = (tags, scope) => `<div class="te" data-te="${scope}">${tags.map((k) => `<span class="tc">${A.esc(name(k))}<button type="button" data-tdel="${A.esc(k)}" aria-label="${A.esc(name(k))} 태그 빼기">${A.ico.x}</button></span>`).join('')}<input class="te-in" placeholder="${tags.length ? '태그 추가' : '태그 입력 후 Enter'}" aria-label="태그 추가" autocomplete="off"><div class="te-sg" aria-label="태그 추천">${sugg(tags, '')}</div></div>`;

  let draft = null;
  const target = (te) => (te.dataset.te === 'new' ? draft : A.byId(A.s.sel));
  const redraw = (te) => {
    if (te.dataset.te === 'new') { te.outerHTML = P.tagEd(draft.tags, 'new'); preview(); } else A.rerender();
    const i = $(`.te[data-te="${te.dataset.te}"] .te-in`); i && i.focus();
  };
  const addTag = (te, v) => {
    v = v.trim().replace(/^#+/, '').replace(/\s+/g, '-'); const t = target(te); if (!v || !t) return;
    const k = Object.keys(A.TAG).find((x) => x === v || A.TAG[x] === v) || ((A.TAG[v] = v), v);
    const l = P.tags(t); if (!l.includes(k)) { if (l.length >= 10) return A.toast('태그는 최대 10개까지'); l.push(k); }
    redraw(te);
  };
  document.addEventListener('click', (e) => {
    const te = e.target.closest('.te'); if (!te) return;
    let b;
    if ((b = e.target.closest('[data-tadd]'))) addTag(te, b.dataset.tadd);
    else if ((b = e.target.closest('[data-tdel]'))) { const t = target(te); if (t) { t.tags = P.tags(t).filter((k) => k !== b.dataset.tdel); redraw(te); } }
    else $('.te-in', te).focus();
  });
  document.addEventListener('keydown', (e) => {
    if (!e.target.matches('.te-in')) return;
    const te = e.target.closest('.te');
    if ((e.key === 'Enter' || e.key === ',') && !e.isComposing) { e.preventDefault(); if (e.target.value.trim()) addTag(te, e.target.value); }
    else if (e.key === 'Backspace' && !e.target.value) { const t = target(te), l = t && P.tags(t); if (l && l.length) { l.pop(); redraw(te); } }
  });
  document.addEventListener('input', (e) => {
    if (!e.target.matches('.te-in')) return;
    const te = e.target.closest('.te'), t = target(te);
    $('.te-sg', te).innerHTML = sugg(t ? P.tags(t) : [], e.target.value.trim().replace(/^#+/, ''));
  });

  /* 새 할 일 모달 */
  document.body.insertAdjacentHTML('beforeend', '<dialog id="newtodo" aria-label="새 할 일"></dialog>');
  const dlg = $('#newtodo');
  const tm = (v) => { if (!v) return null; const [h, m] = v.split(':').map(Number); return h + m / 60; };
  const read = () => {
    const f = (n) => $(`[data-n="${n}"]`, dlg).value;
    draft.title = f('title').trim(); draft.note = f('note'); draft.date = f('date') || null;
    const u = f('until'); draft.until = draft.date && u && u > draft.date ? u : null;
    if (draft.until) { draft.start = null; draft.end = null; }
    else { draft.start = tm(f('start')); draft.end = tm(f('end')); if (draft.start != null && (draft.end == null || draft.end <= draft.start)) draft.end = Math.min(draft.start + 1, 24); if (draft.start == null) draft.end = null; }
    const multi = !!draft.until; dlg.querySelectorAll('[data-n=start],[data-n=end]').forEach((i) => (i.disabled = multi));
  };
  const preview = () => {
    const pv = $('.nm-pv', dlg); if (!pv) return;
    const t = { ...draft, id: '__new', title: draft.title || '제목 없음' };
    pv.innerHTML = P.card(t, 6).replace('draggable="true"', 'draggable="false"').replace('tabindex="0"', 'tabindex="-1"');
    $('.nm-hint', dlg).textContent = !draft.date ? '날짜가 없으면 배치 대기에 들어가요.' : draft.until ? '시작과 마감이 다른 날이라 기간 할 일로 들어가요.' : draft.start == null ? '시간을 비우면 그날의 종일 할 일이 돼요.' : '캘린더의 그 시간에 블록으로 놓여요.';
  };
  P.openNew = (seed = {}) => {
    draft = { title: '', status: 'todo', date: A.s.date || A.TODAY, until: null, start: null, end: null, tags: P.chan !== 'all' ? [P.chan] : [], note: '', cal: P.defCal(), ...seed };
    P.draftRef = draft;
    const t = draft;
    dlg.innerHTML = `<form class="pn nd nm" data-newform>
      <div class="pn-h"><span>새 할 일</span><button type="button" class="ibtn" data-ncancel aria-label="닫기">${A.ico.x}</button></div>
      <input class="pn-title" data-n="title" value="${A.esc(t.title)}" placeholder="무엇을 할까요?" aria-label="제목" autocomplete="off">
      <dl class="pn-grid">
        <dt>상태</dt><dd><div class="seg st" role="group" aria-label="상태">${['todo', 'doing', 'done'].map((x) => `<button type="button" data-nst="${x}" aria-pressed="${t.status === x}" style="--tc:${P.STC[x]}">${A.ST[x]}</button>`).join('')}</div></dd>
        <dt>시작</dt><dd><input type="date" data-n="date" value="${t.date || ''}" aria-label="시작 날짜"><input type="time" step="1800" data-n="start" value="${t.start != null ? A.hm(t.start) : ''}" aria-label="시작 시각"></dd>
        <dt>마감</dt><dd><input type="date" data-n="until" value="${t.until || t.date || ''}" aria-label="마감 날짜"><input type="time" step="1800" data-n="end" value="${t.end != null ? A.hm(t.end) : ''}" aria-label="끝 시각"></dd>
        <dt>캘린더</dt><dd>${P.calPick(t.cal, 'new')}</dd>
        <dt>태그</dt><dd>${P.tagEd(t.tags, 'new')}</dd>
        <dt class="nm-top">메모</dt><dd><textarea data-n="note" rows="3" placeholder="필요하면 적어 두세요" aria-label="메모">${A.esc(t.note)}</textarea></dd>
      </dl>
      <div class="nm-pvw"><span class="nm-l">미리보기</span><div class="nm-pv vl v6"></div><p class="nm-hint"></p></div>
      <div class="nm-f"><span class="kbd">Ctrl Enter</span><span style="flex:1"></span><button type="button" class="btn" data-ncancel>취소</button><button type="submit" class="btn btn-p">추가</button></div>
    </form>`;
    read(); preview(); dlg.showModal();
    const i = $('[data-n=title]', dlg); i.focus(); i.setSelectionRange(i.value.length, i.value.length);
  };
  dlg.addEventListener('input', (e) => { if (e.target.dataset.n && draft) { read(); preview(); } });
  dlg.addEventListener('change', (e) => { if (e.target.dataset.n && draft) { read(); preview(); } });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-ncancel]')) return dlg.close();
    const b = e.target.closest('[data-nst]'); if (!b) return;
    draft.status = b.dataset.nst; dlg.querySelectorAll('[data-nst]').forEach((x) => x.setAttribute('aria-pressed', x === b)); preview();
  });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('form', dlg).requestSubmit(); } });
  dlg.addEventListener('submit', (e) => {
    e.preventDefault(); read();
    const ti = $('[data-n=title]', dlg);
    if (!draft.title) { ti.classList.remove('shake'); void ti.offsetWidth; ti.classList.add('shake'); ti.focus(); return; }
    const t = { ...draft, id: 'n' + Date.now() }; if (!t.until) delete t.until;
    A.todos.push(t); dlg.close();
    A.toast(t.date ? `${A.label(t.date)}에 추가했어요` : '배치 대기에 추가했어요'); A.rerender();
  });
  P.newPreview = preview;
  dlg.addEventListener('close', () => { draft = null; P.draftRef = null; });
})();

/* ---------- 캘린더 여러 개: 사이드바 목록(표시/이것만/관리), 할 일마다 캘린더, 관리 모달 ---------- */
(function () {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  A.ico.solo = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
  P.CALC = ['#5e6ad2', '#4cb7a5', '#d6a24a', '#d16ba5', '#4ea7fc', '#e0794c', '#9b8afb', '#8a8f98'];
  A.cals = [
    { id: 'me', name: '개인', color: '#9b8afb', def: true },
    { id: 'team', name: 'ARCHIVE 팀', color: '#4cb7a5' },
    { id: 'study', name: '스터디', color: '#d6a24a' },
  ];
  const byTag = { work: 'team', study: 'study', side: 'me' };
  A.todos.forEach((t) => { if (!t.cal) t.cal = byTag[P.tags(t)[0]] || 'me'; });
  P.hidden = new Set();
  const calOf = (id) => A.cals.find((c) => c.id === id);
  P.defCal = () => (A.cals.find((c) => c.def) || A.cals[0]).id;
  P.cal = (t) => (calOf(t.cal) ? t.cal : (t.cal = P.defCal()));
  P.calC = (t) => calOf(P.cal(t)).color;

  /* 보이는 캘린더만 */
  const pass0 = P.pass;
  P.pass = (t) => pass0(t) && !P.hidden.has(P.cal(t));

  /* 카드·블록·막대에 캘린더 색(책갈피) */
  const mark = (fn) => (t, ...a) => fn(t, ...a).replace('style="', `data-cal="${P.cal(t)}" style="--cc:${P.calC(t)};`);
  const card0 = P.card; P.card = (t, v = P.cardV) => (v === 6 ? mark(card0)(t, v) : card0(t, v));
  P.ev = mark(P.ev); P.adb = mark(P.adb); P.spanBar = mark(P.spanBar);

  /* 캘린더 고르기 (상세 / 새 할 일) */
  P.calPick = (cur, scope) => `<div class="cpk" role="radiogroup" aria-label="캘린더">${A.cals.map((c) => `<button type="button" role="radio" data-calset="${c.id}" data-scope="${scope}" aria-checked="${c.id === cur}" style="--cc:${c.color}">${A.esc(c.name)}</button>`).join('')}</div>`;
  const dh0 = P.detailHTML;
  P.detailHTML = (t) => (t ? dh0(t).replace('<dt>태그</dt>', `<dt>캘린더</dt><dd>${P.calPick(P.cal(t), 'sel')}</dd><dt>태그</dt>`) : '');

  /* 사이드바 */
  const sb0 = P.sidebar;
  P.sidebar = () => {
    sb0();
    const el = $('#cals'); if (!el) return;
    const n = (id) => A.todos.filter((t) => P.cal(t) === id && t.status !== 'done').length;
    el.innerHTML = A.cals.map((c) => `<div class="cl ${P.hidden.has(c.id) ? 'off' : ''}" style="--cc:${c.color}">
      <button class="cl-t" data-caltog="${c.id}" aria-pressed="${!P.hidden.has(c.id)}" title="${P.hidden.has(c.id) ? '보이기' : '숨기기'}"><i></i><span>${A.esc(c.name)}</span>${c.def ? '<em>기본</em>' : ''}</button>
      <span class="n">${n(c.id)}</span>
      <button class="cl-a" data-calonly="${c.id}" title="이 캘린더만 보기" aria-label="${A.esc(c.name)}만 보기">${A.ico.solo}</button>
      <button class="cl-a" data-cm="${c.id}" title="캘린더 설정" aria-label="${A.esc(c.name)} 설정">${A.ico.set}</button></div>`).join('') +
      `<button class="cl-m" data-cm="${A.cals[0].id}">캘린더 관리</button>`;
  };

  /* 관리 모달 */
  document.body.insertAdjacentHTML('beforeend', '<dialog id="calmgr" aria-label="캘린더 관리"></dialog>');
  const dlg = $('#calmgr'); let cur = null;
  const stats = (id) => { const l = A.todos.filter((t) => P.cal(t) === id); return { all: l.length, todo: l.filter((t) => t.status === 'todo').length, doing: l.filter((t) => t.status === 'doing').length, done: l.filter((t) => t.status === 'done').length }; };
  const listHTML = () => A.cals.map((c) => `<button class="cm-i" data-cmsel="${c.id}" aria-current="${c.id === cur}" style="--cc:${c.color}"><i></i><span>${A.esc(c.name) || '이름 없음'}</span>${c.def ? '<em>기본</em>' : ''}<b>${stats(c.id).all}</b></button>`).join('') + '<button class="cm-add" data-cm-new>+ 새 캘린더</button>';
  const draw = () => {
    const c = calOf(cur), s = stats(cur), def = calOf(P.defCal()), vis = !P.hidden.has(cur);
    dlg.innerHTML = `<div class="cm">
      <aside class="cm-l"><div class="cm-h">캘린더</div><div class="cm-list">${listHTML()}</div></aside>
      <section class="cm-r" style="--cc:${c.color}">
        <div class="pn-h"><span>캘린더 설정</span><button class="ibtn" data-cm-close aria-label="닫기">${A.ico.x}</button></div>
        <div class="cm-name"><i></i><input data-cm-f="name" value="${A.esc(c.name)}" placeholder="캘린더 이름" aria-label="캘린더 이름" autocomplete="off"></div>
        <div class="cm-row"><span>색</span><div class="sw" role="radiogroup" aria-label="색">${P.CALC.map((x) => `<button role="radio" data-cm-color="${x}" aria-checked="${x === c.color}" style="--sw:${x}" aria-label="${x}"></button>`).join('')}</div></div>
        <div class="cm-row"><span>표시</span><button class="tgl" data-cm-vis aria-pressed="${vis}"><i></i>${vis ? '캘린더와 할 일에 보여요' : '숨겨져 있어요'}</button></div>
        <div class="cm-row"><span>기본</span>${c.def ? '<p class="cm-note">새 할 일은 이 캘린더에 들어가요.</p>' : `<button class="btn" data-cm-def>새 할 일 기본 캘린더로</button>`}</div>
        <div class="cm-row"><span>할 일</span><p class="cm-st"><b>${s.all}</b>개 · 대기 ${s.todo} · 진행 ${s.doing} · 완료 ${s.done}</p></div>
        <div class="cm-del">${c.def ? '<p>기본 캘린더는 삭제할 수 없어요. 다른 캘린더를 기본으로 바꾼 뒤 삭제하세요.</p>' : `<p>${s.all ? `삭제하면 할 일 ${s.all}개는 <b style="--cc:${def.color}">${A.esc(def.name)}</b>로 옮겨져요.` : '이 캘린더에는 할 일이 없어요.'}</p><button class="del" data-cm-del>캘린더 삭제</button>`}</div>
      </section></div>`;
  };
  const open = (id) => { cur = id; draw(); if (!dlg.open) dlg.showModal(); };
  const newCal = () => {
    const used = new Set(A.cals.map((c) => c.color)), c = { id: 'c' + Date.now(), name: '', color: P.CALC.find((x) => !used.has(x)) || P.CALC[0] };
    A.cals.push(c); A.rerender(); open(c.id); const i = $('[data-cm-f=name]', dlg); i.focus();
  };
  const refreshList = () => { const l = $('.cm-list', dlg); if (l) l.innerHTML = listHTML(); };
  dlg.addEventListener('input', (e) => { if (e.target.dataset.cmF === 'name') { calOf(cur).name = e.target.value; refreshList(); A.rerender(); } });
  dlg.addEventListener('click', (e) => {
    const g = (a) => e.target.closest(`[${a}]`); let b; const c = calOf(cur);
    if (e.target === dlg || g('data-cm-close')) return dlg.close();
    if ((b = g('data-cmsel'))) open(b.dataset.cmsel);
    else if (g('data-cm-new')) newCal();
    else if ((b = g('data-cm-color'))) { c.color = b.dataset.cmColor; draw(); A.rerender(); }
    else if (g('data-cm-vis')) { P.hidden.has(cur) ? P.hidden.delete(cur) : P.hidden.add(cur); draw(); A.rerender(); }
    else if (g('data-cm-def')) { A.cals.forEach((x) => (x.def = x.id === cur)); draw(); A.rerender(); }
    else if (g('data-cm-del')) {
      const to = P.defCal(); A.todos.forEach((t) => { if (t.cal === cur) t.cal = to; });
      A.cals = A.cals.filter((x) => x.id !== cur); P.hidden.delete(cur); A.toast(`${c.name || '캘린더'}를 삭제했어요`); open(to); A.rerender();
    }
  });
  dlg.addEventListener('close', () => { const c = calOf(cur); if (c && !c.name.trim()) { c.name = '새 캘린더'; A.rerender(); } });

  /* 사이드바·상세 클릭 */
  document.addEventListener('click', (e) => {
    const g = (a) => e.target.closest(`[${a}]`); let b;
    if (e.target.closest('#calmgr')) return;
    if ((b = g('data-caltog'))) { const id = b.dataset.caltog; P.hidden.has(id) ? P.hidden.delete(id) : P.hidden.add(id); A.rerender(); }
    else if ((b = g('data-calonly'))) { const id = b.dataset.calonly, solo = A.cals.every((c) => (c.id === id) !== P.hidden.has(c.id)); P.hidden = new Set(solo ? [] : A.cals.filter((c) => c.id !== id).map((c) => c.id)); A.rerender(); }
    else if ((b = g('data-cm'))) open(b.dataset.cm);
    else if (g('data-cm-new')) newCal();
    else if ((b = g('data-calset'))) {
      if (b.dataset.scope === 'new' && P.draftRef) { P.draftRef.cal = b.dataset.calset; b.parentElement.querySelectorAll('[data-calset]').forEach((x) => x.setAttribute('aria-checked', x === b)); P.newPreview(); }
      else { const t = A.byId(A.s.sel); if (t) { t.cal = b.dataset.calset; A.rerender(); } }
    }
  });
})();

/* ---------- 할 일 상세: 서비스(my-app TaskDetailPanel) 구조를 따름 ----------
   머리: "작업 상세"(+반복 표시) · 삭제 · 닫기 / 큰 제목 / 전체 날짜 / 탭(내용 · 일정)
   내용: 상태(펼침 목록) · 태그(최대 10개) · 상세 설명
   일정: 날짜 · 마감일(지우기) · 반복 · 시간대(시간 지우기) · 캘린더 · Google Calendar */
(function () {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const I = (p) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ic = {
    todo: I('<circle cx="12" cy="12" r="9"/>'),
    doing: I('<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>'),
    done: I('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    trash: I('<path d="M4 7h16M18 7v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6"/>'),
    chev: I('<path d="m6 9 6 6 6-6"/>'),
    cal: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    rep: I('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
    plus: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>'),
    minus: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M9.5 15.5h5"/>'),
    ok: I('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    spin: I('<path d="M12 3a9 9 0 1 0 9 9"/>'),
  };
  P.stIcon = (s) => `<span class="sti" data-s="${s}">${ic[s]}</span>`;
  const DOWF = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const full = (s) => { const d = A.s2d(s); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DOWF[d.getDay()]}`; };
  const short = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${A.DOW[d.getDay()]}요일`; };
  const reps = (t) => { const d = A.s2d(t.date || A.TODAY); return ['매일', '평일마다 (월–금)', `매주 ${A.DOW[d.getDay()]}요일`, `매월 ${d.getDate()}일`, `매년 ${d.getMonth() + 1}월 ${d.getDate()}일`]; };
  P.dtab = 'content';
  let lastSel = null;

  P.detailHTML = (t) => {
    if (!t) return '';
    if (lastSel !== t.id) { lastSel = t.id; P.dtab = 'content'; }
    const tab = P.dtab, multi = P.multi(t), tags = P.tags(t);
    const content = `
      <div class="fd"><p class="eb">상태</p>
        <button class="fb" data-tdx="dd" aria-expanded="false"><span class="fv">${P.stIcon(t.status)}${A.ST[t.status]}</span>${ic.chev}</button>
        <div class="fpop" hidden>${['todo', 'doing', 'done'].map((x) => `<button data-f="status" data-v="${x}" aria-current="${t.status === x}">${P.stIcon(x)}${A.ST[x]}</button>`).join('')}</div></div>
      <div class="fd"><p class="eb">태그</p>${P.tagEd(tags, 'sel')}${tags.length >= 10 ? '<p class="fh">최대 10개까지</p>' : ''}</div>
      <div class="fd"><p class="eb">상세 설명</p><textarea class="fta" data-f="note" placeholder="작업의 맥락이나 참고 링크를 적어두세요." aria-label="상세 설명">${A.esc(t.note || '')}</textarea></div>`;
    const sync = { syncing: `<span class="gs">${ic.spin}동기화 중</span>`, synced: `<span class="gs ok">${ic.ok}동기화 완료</span>` }[t.gsync] || '';
    const schedule = `
      <div class="fd"><p class="eb">날짜</p>
        <div class="fb" role="button" tabindex="0" data-tdx="pick"><span class="fv">${ic.cal}${t.date ? short(t.date) : '<span class="mu">없음</span>'}</span>${ic.chev}<input type="date" class="hid" data-f="date" value="${t.date || ''}" tabindex="-1" aria-label="날짜"></div></div>
      <div class="fd"><p class="eb">마감일</p><div class="frow">
        <div class="fb" role="button" tabindex="0" data-tdx="pick"><span class="fv">${ic.cal}${multi ? `${short(t.until)}<b class="dl ${P.due(t).cls}">${P.due(t).txt}</b>` : '<span class="mu">없음</span>'}</span>${ic.chev}<input type="date" class="hid" data-f="until" min="${t.date || ''}" value="${t.until || t.date || ''}" tabindex="-1" aria-label="마감일"></div>
        ${multi ? `<button class="ibtn" data-tdx="clear-due" aria-label="마감일 제거" title="마감일 제거">${A.ico.x}</button>` : ''}</div>
        ${multi ? `<p class="fh">${P.len(t)} 동안 이어지는 기간 할 일이에요. 캘린더에 막대와 마감 깃발로 보여요.</p>` : ''}</div>
      <div class="fd"><p class="eb">반복</p>
        <button class="fb" data-tdx="dd" aria-expanded="false" aria-haspopup="listbox"><span class="fv">${ic.rep}${t.rep ? A.esc(t.rep) : '반복으로 전환'}</span>${ic.chev}</button>
        <div class="fpop" hidden role="listbox">${reps(t).map((r) => `<button data-tdrep="${r}" aria-current="${t.rep === r}">${r}</button>`).join('')}<button data-tdrep="__custom">맞춤 설정…</button></div>
        <p class="fh">${t.rep ? '이 일정부터 이후 전체에 적용돼요 — 이전 일정은 기존 규칙을 유지합니다.' : '이 할 일의 현재 날짜를 첫 회차로 삼아 반복 시리즈로 만듭니다.'}</p></div>
      <div class="fd"><div class="eb-row"><p class="eb">시간대</p>${!multi && (t.start != null || t.end != null) ? '<button class="lnk" data-tdx="clear-time">시간 지우기</button>' : ''}</div>
        <div class="frow"><input type="time" step="1800" class="fti" data-f="start" value="${t.start != null && !multi ? A.hm(t.start) : ''}" aria-label="시작" ${multi ? 'disabled' : ''}><span class="mu">–</span><input type="time" step="1800" class="fti" data-f="end" value="${t.end != null && !multi ? A.hm(t.end) : ''}" aria-label="종료" ${multi ? 'disabled' : ''}></div>
        <p class="fh">${multi ? '기간 할 일은 시간대 없이 날짜 단위로 표시돼요.' : '선택 사항 — 비우면 그날의 종일 할 일로 표시돼요.'}</p></div>
      <div class="fd"><p class="eb">캘린더</p>${P.calPick(P.cal(t), 'sel')}</div>
      <div class="fd"><p class="eb">Google Calendar</p><div class="frow">
        <button class="btn fbtn" data-tdx="gcal">${t.gcal ? ic.minus + '캘린더에서 빼기' : ic.plus + 'Google 캘린더에 추가'}</button>${sync}</div></div>`;
    return `<div class="td">
      <div class="td-h">
        <div class="td-top"><p class="eb">작업 상세${t.rep ? `<span title="반복">${ic.rep}</span>` : ''}</p>
          <div class="td-act"><button class="ibtn td-del" data-tdx="del" aria-label="작업 삭제" title="작업 삭제 (Delete)">${ic.trash}</button><button class="ibtn" data-act="close-panel" aria-label="닫기">${A.ico.x}</button></div></div>
        <input class="td-title" data-f="title" value="${A.esc(t.title)}" aria-label="제목">
        <p class="td-date">${t.date ? full(t.date) + (multi ? ` ~ ${short(t.until)}` : '') : '날짜 없음 · 배치 대기'}</p>
        <div class="td-tabs" role="tablist">${[['content', '내용'], ['schedule', '일정']].map(([k, l]) => `<button role="tab" data-tdtab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
      </div>
      <div class="td-b" role="tabpanel">${tab === 'content' ? content : schedule}</div></div>`;
  };

  const del = (t) => { A.todos = A.todos.filter((x) => x.id !== t.id); A.s.sel = null; A.toast('삭제했어요'); A.rerender(); };
  document.addEventListener('click', (e) => {
    const root = e.target.closest('.td'); if (!root) return;
    const t = A.byId(A.s.sel); if (!t) return;
    let b;
    if ((b = e.target.closest('[data-tdtab]'))) { P.dtab = b.dataset.tdtab; return A.rerender(); }
    if ((b = e.target.closest('[data-tdrep]'))) {
      const v = b.dataset.tdrep; t.rep = v === '__custom' ? `매주 ${A.DOW[A.s2d(t.date || A.TODAY).getDay()]}요일 · 2주마다` : v;
      A.toast(v === '__custom' ? '맞춤 반복 창은 시안에서 생략했어요' : '반복을 설정했어요'); return A.rerender();
    }
    if (!(b = e.target.closest('[data-tdx]'))) return;
    const x = b.dataset.tdx;
    if (x === 'dd') { const pop = b.nextElementSibling, open = pop.hidden; root.querySelectorAll('.fpop').forEach((p) => (p.hidden = true)); root.querySelectorAll('[data-tdx=dd]').forEach((y) => y.setAttribute('aria-expanded', 'false')); pop.hidden = !open; b.setAttribute('aria-expanded', open); }
    else if (x === 'pick') { const i = $('input', b); try { i.showPicker(); } catch (_) { i.focus(); } }
    else if (x === 'del') del(t);
    else if (x === 'clear-due') { delete t.until; A.rerender(); }
    else if (x === 'clear-time') { t.start = null; t.end = null; A.rerender(); }
    else if (x === 'gcal') {
      t.gcal = !t.gcal; t.gsync = t.gcal ? 'syncing' : null; A.rerender();
      if (t.gcal) setTimeout(() => { if (t.gcal) { t.gsync = 'synced'; A.rerender(); } }, 900);
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.td [data-tdx=pick]')) { e.preventDefault(); e.target.click(); }
    if (e.key !== 'Delete' || !e.target.closest || !e.target.closest('.td') || e.target.closest('input,textarea')) return;
    const t = A.byId(A.s.sel); if (t) { e.preventDefault(); del(t); }
  });
})();

/* ---------- 마감일 지정(기간) 할 일 표시 시안: ?dl=0..5 (0 = 현재: 날짜 칸 막대 + 마감 깃발) ---------- */
(function () {
  const A = window.ARC, P = window.PL;
  P.dlV = (() => {
    const q = new URLSearchParams(location.search).get('dl');
    try { if (q != null) localStorage.setItem('archive.dlV2', q); return +(q ?? localStorage.getItem('archive.dlV2') ?? 4); } catch (e) { return q != null ? +q : 4; }
  })();
  document.body.classList.add('dlv' + P.dlV);
  const DAY = 864e5, dd = (a, b) => Math.round((A.s2d(b) - A.s2d(a)) / DAY);
  const md = (s) => `${+s.slice(5, 7)}/${+s.slice(8)}`;
  const dow = (s) => A.DOW[A.s2d(s).getDay()];
  const UC = { soon: 'var(--warn)', late: 'var(--danger)', ok: 'var(--done)', '': 'var(--tc)' };
  const info = (t) => {
    const n = dd(t.date, t.until) + 1, k = dd(t.date, A.TODAY), d = P.due(t), left = dd(A.TODAY, t.until);
    const pos = Math.min(Math.max((k + 0.5) / n, 0), 1) * 100;
    return { n, k, d, left, pos, started: k >= 0, el: Math.min(Math.max(k + 1, 0), n) };
  };
  const at = (t, cls, style = '') => `class="${cls}" role="button" tabindex="0" data-id="${t.id}" data-st="${t.status}" data-cal="${P.cal(t)}" draggable="true" aria-current="${A.s.sel === t.id}" aria-label="${A.esc(t.title)}, ${P.when(t)}, ${A.ST[t.status]}" style="--tc:${P.STC[t.status] || 'var(--ink3)'};--cc:${P.calC(t)};--uc:${UC[P.due(t).cls]};${style}"`;
  const T = (t) => `<span class="t">${A.esc(t.title)}</span>`;
  /* 열기: 상태 색 하나로만. 마감까지 7일 이상 16% → 당일 46%, 지나면 46% + 빗금, 완료는 고르게 12% */
  const heat = (t, i) => (t.status === 'done' ? { hp: 12, late: 'fin' } : i.left < 0 ? { hp: 46, late: 'late' } : { hp: Math.round(46 - (Math.min(i.left, 7) / 7) * 30), late: '' });

  const CARD = {
    /* 1 카운트다운: 오른쪽에 남은 날 큰 숫자 */
    1: (t, i) => {
      const [num, unit] = t.status === 'done' ? ['✓', '완료'] : i.left < 0 ? [`+${-i.left}`, '일 지남'] : i.left === 0 ? ['0', '오늘 마감'] : [i.left, '일 남음'];
      return `<div ${at(t, 'dlc dl1')}><div class="m">${T(t)}<span class="w">${md(t.date)} ~ ${md(t.until)}<em>${i.n}일</em></span>${P.tagHTML(t)}</div><div class="cd"><b>${num}</b><span>${unit}</span></div></div>`;
    },
    /* 2 레일: 시작 점 ─ 오늘 ─ 마감 점 */
    2: (t, i) => `<div ${at(t, 'dlc dl2')}><div class="hd">${T(t)}<b class="dl ${i.d.cls}">${i.d.txt}</b></div>
      <div class="rl" style="--p:${t.status === 'done' ? 100 : i.pos}%"><i class="ln"></i><i class="fl"></i><i class="s"></i><i class="e"></i>${t.status !== 'done' && i.k >= 0 && i.left >= 0 ? '<i class="tdy"></i>' : ''}</div>
      <div class="rl-l"><span>${md(t.date)} 시작</span><span>${md(t.until)} 마감</span></div>${P.tagHTML(t)}</div>`,
    /* 3 티켓: 오른쪽 절취선 뒤 마감 스텁 */
    3: (t, i) => `<div ${at(t, 'dlc dl3')}><div class="m">${T(t)}<span class="w">${md(t.date)}부터<em>${i.n}일</em></span>${P.tagHTML(t)}</div>
      <div class="stub"><span>마감</span><b>${md(t.until)}</b><em>${dow(t.until)}요일</em><i class="dl ${i.d.cls}">${i.d.txt}</i></div></div>`,
    /* 4 열기: 마감 쪽으로 갈수록 진해지는 바탕 + 오늘 선 */
    4: (t, i) => {
      const hl = t.status === 'done' ? '완료' : i.left < 0 ? `${-i.left}일 지남` : i.left === 0 ? '오늘 마감' : `마감까지 ${i.left}일`;
      return `<div ${at(t, `dlc dl4 ${heat(t, i).late}`, `--p:${i.pos}%;--hp:${heat(t, i).hp}%`)}>${t.status !== 'done' && i.k >= 0 && i.left >= 0 ? '<i class="tdy"></i>' : ''}${T(t)}<span class="w">${md(t.date)} ~ ${md(t.until)}<em>${i.n}일</em><span class="hl">${hl}</span></span>${P.tagHTML(t)}</div>`;
    },
    /* 5 마일스톤: 맨 위에 ◆ 마감일, 아래는 시작부터 며칠째 */
    5: (t, i) => `<div ${at(t, 'dlc dl5')}><span class="ms"><i class="dia"></i>${md(t.until)} ${dow(t.until)} 마감<b class="dl ${i.d.cls}">${i.d.txt}</b></span>${T(t)}
      <span class="w">${md(t.date)}부터<em>${i.k < 0 ? `${-i.k}일 뒤 시작` : t.status === 'done' ? `${i.n}일` : `${i.n}일 중 ${i.el}일째`}</em></span>${P.tagHTML(t)}</div>`,
  };
  const BAR = {
    1: (t, i, end) => `${T(t)}<span class="r">~${md(t.until)}</span>${end ? `<b class="cdb">${i.d.txt}</b>` : '<b class="gh">›</b>'}`,
    2: (t, i, end) => `${T(t)}<i class="ln"></i>${end ? `<i class="end"></i><b class="dl ${i.d.cls}">${i.d.txt}</b>` : '<b class="gh">›</b>'}`,
    3: (t, i, end) => `${T(t)}${end ? `<span class="stub"><em>마감</em>${md(t.until)} ${dow(t.until)}<b class="dl ${i.d.cls}">${i.d.txt}</b></span>` : '<b class="gh">›</b>'}`,
    4: (t, i, end) => `${T(t)}${end ? `<span class="r">~${md(t.until)} · <b>${i.d.txt}</b></span>` : '<b class="gh">›</b>'}`,
    5: (t, i, end) => `${T(t)}<span class="r">${md(t.date)}~</span>${end ? `<span class="mt"><b class="dl ${i.d.cls}">${i.d.txt}</b><i class="dia"></i></span>` : '<b class="gh">›</b>'}`,
  };
  P.dlCard = (t, v = P.dlV) => CARD[v](t, info(t));
  /* 하루 목록 순서: 마감일 지정(기간) 할 일이 항상 위, 그중 마감이 늦은 것부터. 나머지는 시작 시각 순 */
  P.sortDay = (l) => [...l].sort((a, b) => {
    const ma = P.multi(a), mb = P.multi(b);
    if (ma !== mb) return ma ? -1 : 1;
    if (ma) return b.until.localeCompare(a.until) || a.date.localeCompare(b.date);
    return (a.start ?? 99) - (b.start ?? 99);
  });
  P.dlBar = (t, days, v = P.dlV) => {
    const first = days[0], last = days[days.length - 1];
    const a = t.date < first ? 0 : days.indexOf(t.date), b = t.until > last ? days.length - 1 : days.indexOf(t.until);
    const cutL = t.date < first, end = t.until <= last;
    const h = v === 4 ? heat(t, info(t)) : { late: '', hp: 0 };
    return `<div ${at(t, `db db${v} ${h.late} ${cutL ? 'cut-l' : ''} ${end ? '' : 'cut-r'}`, `grid-column:${a + 1}/${b + 2};--hp:${h.hp}%`)}>${BAR[v](t, info(t), end)}</div>`;
  };
  const pc = P.card, ps = P.spanBar;
  P.card = (t, v = P.cardV) => (v === 6 && P.multi(t) && CARD[P.dlV] ? P.dlCard(t) : pc(t, v));
  P.spanBar = (t, days) => (BAR[P.dlV] ? P.dlBar(t, days) : ps(t, days));
})();

/* ---------- 월간 캘린더 할 일 카드 시안: ?mc=0..5 (0 = 현재) ---------- */
(function () {
  const A = window.ARC, P = window.PL;
  P.mcV = (() => {
    const q = new URLSearchParams(location.search).get('mc'), top = window.top === window;
    try { if (q != null && top) localStorage.setItem('archive.mcV2', q); return +(q ?? localStorage.getItem('archive.mcV2') ?? 1); } catch (e) { return q != null ? +q : 1; }
  })();
  document.body.classList.add('mcv' + P.mcV);
  /* 월간이 비어 보이지 않게 11월 둘째·셋째 주 예시 */
  if (!A.byId('m1')) [
    ['m1', '스프린트 회고', 'todo', '2026-11-09', 10, 11, ['work'], 'team'],
    ['m2', 'API 계약 리뷰', 'todo', '2026-11-09', 14, 15.5, ['work', '리뷰'], 'team'],
    ['m3', '알고리즘 스터디', 'todo', '2026-11-10', 20, 21.5, ['study'], 'study'],
    ['m4', '온보딩 문서 개편', 'todo', '2026-11-10', null, null, ['work'], 'team', '2026-11-13'],
    ['m5', '디자인 QA', 'todo', '2026-11-11', 11, 12, ['work'], 'team'],
    ['m6', '블로그 초안', 'todo', '2026-11-12', null, null, ['side'], 'me'],
    ['m7', '1:1 미팅', 'todo', '2026-11-12', 16, 16.5, ['work'], 'team'],
    ['m8', '릴리스 노트 작성', 'todo', '2026-11-13', 15, 16, ['work'], 'team'],
    ['m9', '모의 면접', 'todo', '2026-11-16', 19, 20, ['study'], 'study'],
    ['m10', '사이드 프로젝트 배포', 'todo', '2026-11-17', null, null, ['side'], 'me', '2026-11-19'],
    ['m11', '보안 점검', 'todo', '2026-11-18', 10, 12, ['work', '버그'], 'team'],
    ['m12', '월간 회고', 'todo', '2026-11-20', 17, 18, ['study'], 'me'],
  ].forEach(([id, title, status, date, start, end, tags, cal, until]) => A.todos.push({ id, title, status, date, start, end, tags, cal, note: '', ...(until ? { until } : {}) }));
  const md = (s) => `${+s.slice(5, 7)}/${+s.slice(8)}`;
  P.monthItem = (t, d, dow) => {
    const multi = P.multi(t), pos = !multi ? '' : d === t.date ? 's' : d === t.until ? 'e' : 'm';
    const kind = multi ? 'sp' : t.start == null ? 'ad' : 'tm';
    const label = !multi || pos === 's' || dow === 0, due = multi ? P.due(t) : null;
    const tm = kind === 'tm' ? A.hmc(t.start) : kind === 'ad' ? '종일' : pos === 's' ? '기간' : '';
    const sub = kind === 'tm' ? A.range(t.start, t.end) : kind === 'ad' ? '종일' : `${md(t.date)} ~ ${md(t.until)} · ${due.txt}`;
    return `<div class="mi mi-${kind} ${pos}" role="button" tabindex="0" data-id="${t.id}" data-st="${t.status}" draggable="true" aria-current="${A.s.sel === t.id}" aria-label="${A.esc(t.title)}, ${P.when(t, true)}, ${A.ST[t.status]}" style="--tc:${P.STC[t.status]};--cc:${P.calC(t)}">`
      + `<i class="ic">${P.stIcon ? P.stIcon(t.status) : ''}</i>`
      + (label ? `<span class="tt">${A.esc(t.title)}</span>` : '<span class="tt"></span>')
      + (tm ? `<em class="tm">${tm}</em>` : '')
      + `<small class="sub">${label ? sub : ''}</small>`
      + (pos === 'e' ? `<b class="dd">마감</b>` : '') + `</div>`;
  };
})();

/* ---------- 상단 컨트롤 시안: 오늘 버튼(?tg=0..5) · 사이드바 토글(?sb=0..5) · 일/주/월 전환(?vw=0..5) ---------- */
(function () {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const top = window.top === window, Q = new URLSearchParams(location.search);
  /* 확정: 오늘 0(현재) · 사이드바 4(아이콘 레일) · 전환 3(메뉴). ?tg= ?sb= ?vw= 로 다른 시안을 볼 수 있음 */
  const pick = (k, def) => { const q = Q.get(k); try { if (q != null && top) localStorage.setItem('archive.c2.' + k, q); return +(q ?? localStorage.getItem('archive.c2.' + k) ?? def); } catch (e) { return q != null ? +q : def; } };
  P.tgV = pick('tg', 0); P.sbV = pick('sb', 4); P.vwV = pick('vw', 3);
  document.body.classList.add('tgv' + P.tgV, 'sbv' + P.sbV, 'vwv' + P.vwV);
  const I = (p) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ic = {
    panel: I('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/><rect class="pf" x="3.5" y="4.5" width="6" height="15" rx="2.5" stroke="none"/>'),
    pin: I('<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/>'),
    dbl: I('<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>'),
    dblr: I('<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>'),
    cal: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'),
    hash: I('<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>'),
    link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    chev: I('<path d="m6 9 6 6 6-6"/>'),
    tgt: I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>'),
  };
  const td = A.s2d(A.TODAY);

  /* 오늘 버튼 */
  P.TODAY = [
    () => '<button class="btn" data-nav="today">오늘</button>',
    () => `<button class="tg1" data-nav="today" title="오늘로 (T)"><b>오늘</b><span>${td.getMonth() + 1}.${td.getDate()} ${A.DOW[td.getDay()]}</span></button>`,
    () => `<button class="tg2" data-nav="today" title="오늘로 (T)" aria-label="오늘로">${ic.cal}<span>${td.getDate()}</span></button>`,
    (dir = 'in') => `<button class="tg3" data-nav="today" data-dir="${dir}" title="오늘로 (T)"><i class="al">←</i><i class="au">↑</i><span>오늘</span><i class="ar">→</i><i class="ad">↓</i></button>`,
    () => '<button class="tg4" data-nav="today" title="오늘로">오늘<kbd>T</kbd></button>',
    () => `<button class="tg5" data-nav="today" title="오늘로 (T)">${ic.tgt}<span>오늘</span></button>`,
  ];
  P.todayBtn = (v = P.tgV, dir) => P.TODAY[v](dir);
  P.markToday = (dir) => document.querySelectorAll('.tg3[data-nav=today]').forEach((b) => (b.dataset.dir = dir));

  /* 사이드바 토글 */
  P.SIDE = [
    () => `<button class="ibtn" data-side aria-label="사이드바 접기">${A.ico.l}</button>`,
    () => `<button class="ibtn sb1" data-side aria-label="사이드바 열고 닫기" title="사이드바 ([)">${ic.panel}</button>`,
    () => `<button class="ibtn sb2" data-side aria-label="사이드바 열기" title="사이드바 열기 ([)">${ic.dblr}</button>`,
    () => `<button class="ibtn sb3" data-side aria-label="사이드바 고정" title="사이드바 고정 / 해제 ([) · 접혀 있을 때 왼쪽 끝에 마우스를 대면 잠깐 열림">${ic.pin}</button>`,
    () => '',
    () => `<button class="sb5" data-side title="사이드바 열고 닫기">${ic.panel}<span>사이드바</span><kbd>[</kbd></button>`,
  ];
  P.sideBtn = (v = P.sbV) => P.SIDE[v]();
  P.sideIn = () => (P.sbV === 4 ? `<button class="ibtn sb4c" data-side aria-label="사이드바 접기" title="레일로 접기 ([)">${ic.dbl}</button>` : '');
  P.sideExtra = () => P.sbV === 2 ? '<button class="sb2h" data-side aria-label="사이드바 접기" title="사이드바 접기 ([)"><i></i></button>'
    : P.sbV === 4 ? `<nav class="rail" aria-label="접힌 사이드바"><button class="rl-ws" data-side title="펼치기 ([)"><i></i></button><button class="ibtn" data-side title="미니 달력">${ic.cal}</button><button class="ibtn" data-side title="캘린더와 태그">${ic.hash}</button><button class="ibtn" data-side title="연동">${ic.link}</button><span style="flex:1"></span><button class="ibtn" data-side title="펼치기">${ic.dblr}</button><span class="av">D</span></nav>`
    : '';
  if (P.sbV === 3) document.addEventListener('DOMContentLoaded', () => {
    const app = $('#app'); if (!app) return;
    app.insertAdjacentHTML('beforeend', '<div class="peekz" aria-hidden="true"></div>');
  });
  document.addEventListener('mouseover', (e) => {
    if (P.sbV !== 3) return; const app = $('#app'); if (!app) return;
    if (e.target.closest('.peekz') && app.classList.contains('no-side')) app.classList.add('peek');
    else if (app.classList.contains('peek') && !e.target.closest('.side') && !e.target.closest('.peekz')) app.classList.remove('peek');
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-side]')) { const app = $('#app'); app && app.classList.remove('peek'); } }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== '[' || e.target.closest('input,textarea,dialog') || document.querySelector('dialog[open]')) return;
    P.side = !P.side; A.rerender();
  });

  /* 일 / 주 / 월: 하나의 컨트롤 */
  const VS = ['day', 'week', 'month'], SH = { day: '일', week: '주', month: '월' }, LG = { day: '일간', week: '주간', month: '월간' };
  let prevView = null;
  P.VIEW = [
    (cur) => `<div class="seg" role="group" aria-label="보기">${VS.map((k) => `<button data-view="${k}" aria-pressed="${cur === k}">${SH[k]}</button>`).join('')}</div>`,
    /* 1 슬라이드: 한 줄 트랙 위를 손잡이가 미끄러짐. ←/→ 키 */
    (cur) => `<div class="vw1" data-sw role="radiogroup" aria-label="보기" tabindex="0" style="--i:${VS.indexOf(cur)}"><i class="th"></i>${VS.map((k) => `<button role="radio" data-vv="${k}" aria-checked="${cur === k}" tabindex="-1">${SH[k]}</button>`).join('')}</div>`,
    /* 2 순환: 버튼 하나. 클릭 → 다음, 우클릭 → 이전, 휠로도 */
    (cur, chg) => `<button class="vw2 ${chg || ''}" data-cyc title="클릭: 다음 보기 · 우클릭: 이전 · 휠로 돌리기" aria-label="보기: ${LG[cur]}"><span class="lb">${LG[cur]}</span><span class="dots">${VS.map((k) => `<i class="${cur === k ? 'on' : ''}"></i>`).join('')}</span></button>`,
    /* 3 메뉴: 현재 보기 버튼 → 펼침 목록 + 단축키 */
    (cur) => `<div class="vw3"><button class="vw3b" data-vw3 aria-haspopup="menu" aria-expanded="false">${LG[cur]}${ic.chev}</button><div class="vw3m" role="menu" hidden>${VS.map((k, i) => `<button role="menuitemradio" data-view="${k}" aria-checked="${cur === k}"><span>${LG[k]}</span></button>`).join('')}</div></div>`,
    /* 4 줌: − 가까이(일) · + 멀리(월). 가운데 눈금이 단계 */
    (cur) => { const i = VS.indexOf(cur); return `<div class="vw4" role="group" aria-label="보기 확대/축소"><button data-zoom="-1" ${i === 0 ? 'disabled' : ''} title="더 가까이 (일)" aria-label="더 가까이">−</button><span class="lv"><b>${LG[cur]}</b><span class="tk">${VS.map((k, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</span></span><button data-zoom="1" ${i === 2 ? 'disabled' : ''} title="더 멀리 (월)" aria-label="더 멀리">+</button></div>`; },
    /* 5 다이얼: 위아래로 굴러가는 원통. 휠·드래그·클릭 */
    (cur) => `<div class="vw5" data-sw data-drum role="listbox" aria-label="보기" tabindex="0" title="휠로 돌리거나 위·아래 항목 클릭" style="--i:${VS.indexOf(cur)}"><div class="drum">${VS.map((k) => `<button role="option" data-vv="${k}" aria-selected="${cur === k}" tabindex="-1">${LG[k]}</button>`).join('')}</div></div>`,
  ];
  P.viewSwitch = (cur, v = P.vwV) => { const chg = prevView && prevView !== cur ? (VS.indexOf(cur) > VS.indexOf(prevView) ? 'chg up' : 'chg dn') : ''; prevView = cur; return P.VIEW[v](cur, chg); };
  const go = (k) => { if (!k || k === A.s.view) return; A.s.view = k; A.rerender(); };
  const step = (n) => go(VS[Math.min(2, Math.max(0, VS.indexOf(A.s.view) + n))]);
  const slide = (sw, k) => { sw.style.setProperty('--i', VS.indexOf(k)); sw.querySelectorAll('[data-vv]').forEach((b) => b.setAttribute(b.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-selected', b.dataset.vv === k)); setTimeout(() => go(k), 170); };
  document.addEventListener('click', (e) => {
    let b;
    if ((b = e.target.closest('[data-vv]'))) return slide(b.closest('[data-sw]'), b.dataset.vv);
    if (e.target.closest('[data-cyc]')) return go(VS[(VS.indexOf(A.s.view) + 1) % 3]);
    if ((b = e.target.closest('[data-zoom]'))) return step(+b.dataset.zoom);
    if ((b = e.target.closest('[data-vw3]'))) { const m = b.nextElementSibling; m.hidden = !m.hidden; b.setAttribute('aria-expanded', !m.hidden); return; }
    document.querySelectorAll('.vw3m').forEach((m) => { if (!m.hidden && !e.target.closest('.vw3')) { m.hidden = true; m.previousElementSibling.setAttribute('aria-expanded', 'false'); } });
  });
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-cyc]')) { e.preventDefault(); go(VS[(VS.indexOf(A.s.view) + 2) % 3]); } });
  let wl = 0;
  document.addEventListener('wheel', (e) => {
    const el = e.target.closest('[data-cyc],[data-drum]'); if (!el) return; e.preventDefault();
    const now = Date.now(); if (now - wl < 260) return; wl = now;
    const n = e.deltaY > 0 ? 1 : -1;
    if (el.matches('[data-drum]')) { const k = VS[Math.min(2, Math.max(0, VS.indexOf(A.s.view) + n))]; slide(el, k); }
    else go(VS[(VS.indexOf(A.s.view) + (n > 0 ? 1 : 2)) % 3]);
  }, { passive: false });
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest && e.target.closest('[data-sw]'); if (!el) return;
    const n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!n) return;
    e.preventDefault(); e.stopPropagation(); const k = VS[Math.min(2, Math.max(0, VS.indexOf(A.s.view) + n))]; slide(el, k);
  }, true);
  /* 다이얼 끌기 */
  let drag = null;
  document.addEventListener('pointerdown', (e) => { const el = e.target.closest('[data-drum]'); if (el) drag = { el, y: e.clientY }; });
  document.addEventListener('pointerup', (e) => {
    if (!drag) return; const dy = e.clientY - drag.y, el = drag.el; drag = null;
    if (Math.abs(dy) > 8) { const k = VS[Math.min(2, Math.max(0, VS.indexOf(A.s.view) + (dy < 0 ? 1 : -1)))]; slide(el, k); }
  });
})();

/* ---------- 오른쪽 아이콘 줄: 오늘 마무리 창이 열려 있는 동안 그 버튼을 눌린 모양으로 ---------- */
(function () {
  const A = window.ARC; if (!A) return;
  let rf = false, queued = false;
  const paint = () => { queued = false; const b = document.querySelector('.strip [data-reflect]'); if (!b) return; const d = document.querySelector('#dlg'); if (rf && !(d && d.open)) rf = false; if (b.getAttribute('aria-pressed') !== String(rf)) b.setAttribute('aria-pressed', rf); };
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.strip [data-reflect]')) { rf = true; later(); } }, true);
  document.addEventListener('close', later, true);
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
})();
