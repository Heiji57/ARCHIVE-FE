/* 오른쪽 패널 시안: 하루 진행, 시간 미정 할 일, 마감 임박·지난 할 일, 그날 GitHub 커밋, AI 작업 추천. ?rp=1..10 (기본 6, ?rp=0이면 끔)
   캘린더(d-calendar.html)와 할 일(d-todos.html)이 같이 씀. 할 일 화면은 그날 시간표가 하나 더 들어감.
   AI 추천은 시안에서는 규칙으로 흉내 냄: 빈 시간 찾기, 지난 마감, 계획 초과, 커밋 메시지와 할 일 제목 맞추기 */
(() => {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), RP = +(Q.get('rp') || 6);
  if (RP < 1 || RP > 10) return;
  P.rpOpen = true;
  /* 예시 데이터: 서비스 할 일은 날짜가 꼭 있으므로 '배치 대기' 대신 오늘의 시간 미정 할 일로. 지난 마감 하나 */
  [['t6', { date: A.TODAY }], ['t7', { date: A.TODAY }], ['t8', { date: '2026-10-31', due: '2026-11-02' }]].forEach(([id, o]) => { const t = A.byId(id); if (t) Object.assign(t, o); });

  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ic = { ai: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'), clock: I('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'), flag: I('<path d="M5 21V4h11l-2 4 2 4H5"/>'), git: I('<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-10 6"/>'), day: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'), chev: I('<path d="m9 6 6 6-6 6"/>'), down: I('<path d="m6 9 6 6 6-6"/>'), x: I('<path d="M6 6l12 12M18 6 6 18"/>'), check: I('<path d="m5 12 5 5 9-10"/>'), warn: I('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>'), cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16"/>') };
  const S = { sw: false, rsel: null, planOff: new Set(), asked: 0, closed: new Set(), tab: null, tile: null, gone: new Set(), done: [], repo: new Set() };
  const md = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const kh = (h) => { const H = Math.floor(h), M = Math.round((h - H) * 60); return `${H < 12 ? '오전' : '오후'} ${H % 12 || 12}시${M ? ` ${M}분` : ''}`; };
  const hm = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const hTxt = (h) => `${Math.floor(h) ? `${Math.floor(h)}시간` : ''}${h % 1 ? ` ${Math.round((h % 1) * 60)}분` : ''}`.trim() || '0시간';
  const dn = (s) => Math.round((A.s2d(s) - A.s2d(A.TODAY)) / 864e5);

  /* ---------- 데이터 ---------- */
  const untimed = (s) => A.onDay(s).filter((t) => t.start == null && !t.until && t.status !== 'done');
  const dueGroups = () => { const o = A.todos.filter((t) => t.due && t.status !== 'done'), g = [['late', '마감 지남', []], ['today', '오늘 마감', []], ['tom', '내일 마감', []], ['week', '이번 주', []]];
    o.forEach((t) => { const n = dn(t.due); (n < 0 ? g[0] : n === 0 ? g[1] : n === 1 ? g[2] : n <= 6 ? g[3] : [0, 0, []])[2].push(t); }); return g.filter((x) => x[2].length); };
  const commits = (s) => A.commits.filter((c) => c.date === s);
  const free = (s, du = 1) => { const busy = A.onDay(s).filter((t) => t.start != null && !t.until).map((t) => [t.start, t.end ?? t.start + 1]);
    for (let h = Math.max(9, s === A.TODAY ? Math.ceil(A.NOW * 2) / 2 : 9); h + du <= 19; h += 0.5) if (!busy.some(([a, b]) => h < b && h + du > a)) return h; return null; };
  /* AI 추천: 실제 서비스에서는 모델이 고르고, 여기서는 같은 결과를 규칙으로 만듦 */
  const suggest = (s) => { const out = [], st = A.stats(s), tom = A.add(s, 1);
    A.todos.filter((t) => t.due && t.status !== 'done' && dn(t.due) < 0).forEach((t) => out.push({ id: 'od-' + t.id, t, kind: 'warn', title: `"${t.title}" 마감이 ${-dn(t.due)}일 지났어요`, why: `${md(t.due)}이 마감이었고 아직 ${A.ST[t.status]}이에요`,
      acts: [['내일 오전 9시에 하기', () => { t.date = A.add(A.TODAY, 1); t.start = 9; t.end = 10; t.due = A.add(A.TODAY, 1); }, '내일 오전 9시로 옮기고 마감도 내일로 바꿨어요'], ['마감만 내일로', () => { t.due = A.add(A.TODAY, 1); }, '마감을 내일로 미뤘어요']] }));
    let taken = []; untimed(s).forEach((t) => { const h = free(s, 1); if (h == null || taken.includes(h)) return; taken.push(h); out.push({ id: 'ut-' + t.id, t, kind: 'time', title: `"${t.title}"를 ${kh(h)}에 넣을까요?`, why: `${kh(h)}부터 1시간이 비어 있어요`, acts: [[`${kh(h)}에 넣기`, () => { t.start = h; t.end = h + 1; }, `${kh(h)}에 넣었어요`]] }); });
    A.onDay(s).filter((t) => t.status === 'doing').forEach((t) => { const cs = commits(s).filter((c) => c.todoId === t.id); if (cs.length < 2) return; out.push({ id: 'cm-' + t.id, t, kind: 'git', title: `"${t.title}" 커밋을 ${cs.length}개 남겼어요. 완료로 바꿀까요?`, why: cs.map((c) => c.msg).join(', '), acts: [['완료로 바꾸기', () => { t.status = 'done'; }, '완료로 바꿨어요']] }); });
    if (st.plan > 8) { const c = A.onDay(s).filter((t) => t.status === 'todo' && t.start != null && !t.until).sort((a, b) => b.start - a.start)[0]; if (c) out.push({ id: 'ov-' + c.id, t: c, kind: 'warn', title: `계획이 ${hTxt(st.plan)}이라 8시간을 넘어요`, why: `가장 늦게 잡힌 "${c.title}"를 내일로 넘기면 ${hTxt(st.plan - (c.end - c.start))}이 돼요`, acts: [['내일로 넘기기', () => { c.date = tom; }, '내일로 넘겼어요']] }); }
    return out.filter((x) => !S.gone.has(x.id)); };

  /* ---------- 조각 ---------- */
  const head = (key, icon, label, count, extra = '') => `<h3 class="rx-h"><button type="button" data-rpx="tog|${key}" aria-expanded="${!S.closed.has(key)}">${ic.down}${icon}<span>${label}</span>${count != null ? `<em>${count}</em>` : ''}</button>${extra}</h3>`;
  const sec = (key, icon, label, count, body, extra = '') => `<section class="rx-s">${head(key, icon, label, count, extra)}${S.closed.has(key) ? '' : `<div class="rx-bd">${body}</div>`}</section>`;
  const prog = (s, small = false) => { const st = A.stats(s), pct = Math.min(100, (st.plan / 8) * 100), over = st.plan > 8;
    return `<div class="rx-pg ${small ? 'sm' : ''}"><p><b>${st.done}/${st.n}</b><span>완료</span><b class="${over ? 'over' : ''}">${hTxt(st.plan)}</b><span>/ 8시간 계획</span></p><div class="rx-bar ${over ? 'over' : ''}" role="img" aria-label="계획 ${hTxt(st.plan)}, 8시간 중"><i style="width:${pct}%"></i></div>${small ? '' : `<small>커밋 ${st.commits}개${st.n - st.done ? `, 남은 할 일 ${st.n - st.done}개` : ''}</small>`}</div>`; };
  const row = (t, right = '', acts = '') => `<div class="rx-r"><span class="rx-t" data-id="${t.id}" draggable="true" role="button" tabindex="0" aria-label="${A.esc(t.title)} 열기, 캘린더로 끌어 놓을 수 있어요">${A.sd(t.status)}<span>${A.esc(t.title)}</span></span>${right ? `<small>${right}</small>` : ''}${acts}</div>`;
  const utBody = (s) => (UT ? doneBar() + utV(s) : utBody0(s));
  const utBody0 = (s) => { const l = untimed(s); if (!l.length) return '<p class="rx-e">시간이 안 정해진 할 일이 없어요</p>';
    return `${l.map((t) => { const h = free(s); return row(t, '', h != null ? `<button type="button" class="rx-a" data-rpx="place|${t.id}|${h}">${kh(h)}에 넣기</button>` : ''); }).join('')}<p class="rx-tip">끌어서 캘린더에 놓아도 시간이 잡혀요</p>`; };
  const dueBody = () => (DD ? doneBar() + ddV(A.s.date) : dueBody0());
  const dueBody0 = () => { const g = dueGroups(); if (!g.length) return '<p class="rx-e">다가오는 마감이 없어요</p>';
    return g.map(([k, l, ts]) => `<div class="rx-g ${k}"><p>${l}<em>${ts.length}</em></p>${ts.map((t) => row(t, md(t.due), `<button type="button" class="rx-a" data-rpx="due1|${t.id}" aria-label="${A.esc(t.title)} 마감 하루 미루기">+1일</button>`)).join('')}</div>`).join(''); };
  const cmBody = (s) => (GC ? gcV(s) : cmBody0(s));
  const cmBody0 = (s) => { const cs = commits(s); if (!cs.length) return '<p class="rx-e">이 날 남긴 커밋이 없어요</p>'; const by = {}; cs.forEach((c) => (by[c.repo] = by[c.repo] || []).push(c));
    return `${Object.entries(by).map(([r, l]) => `<div class="rx-rp"><p>${ic.git}<b>${A.esc(r)}</b><em>${l.length}</em></p><ul>${l.map((c) => `<li><time>${hm(c.start)}</time><span>${A.esc(c.msg)}</span></li>`).join('')}</ul></div>`).join('')}<p class="rx-tip">회고 초안의 "남긴 커밋"에 들어가요</p>`; };
  const aiCard = (x, n) => `<article class="rx-ai ${x.kind}"><p class="rx-ait">${x.kind === 'warn' ? ic.warn : x.kind === 'git' ? ic.git : ic.clock}<b>${A.esc(x.title)}</b></p><p class="rx-aiw">${A.esc(x.why)}</p>
      <div class="rx-aia">${x.acts.map(([l], i) => `<button type="button" class="rx-b ${i ? '' : 'p'}" data-rpx="ai|${x.id}|${i}">${l}</button>`).join('')}<button type="button" class="rx-x" data-rpx="ai-x|${x.id}" aria-label="이 추천 숨기기">${ic.x}</button></div></article>`;
  const doneBar = () => (S.done.length ? `<p class="rx-done" aria-live="polite">${ic.check}<span>${A.esc(S.done[S.done.length - 1].msg)}</span><button type="button" data-rpx="undo">되돌리기</button></p>` : '');
  /* ---------- AI 추천 다섯 모양 (?ra=1..5). 추천 내용과 적용 방식은 같음 ---------- */
  const RA = +(Q.get('ra') || 20); /* 20: 오른쪽 줄의 AI 버튼, 패널을 열면 캘린더에 흐린 일정 칸으로 정함 */
  if (Q.get('rtab')) S.tab = Q.get('rtab');
  const FLD = ['date', 'start', 'end', 'due', 'status'];
  /* 누르면 어떻게 바뀌는지: 실제로 한 번 해 보고 바로 되돌려서 알아냄 */
  const after = (x, i = 0) => { const t = x.t, b = {}; FLD.forEach((k) => { b[k] = t[k]; }); x.acts[i][1](); tweak(x, i); const a = {}; FLD.forEach((k) => { a[k] = t[k]; }); Object.assign(t, b); return { b, a }; };
  const tTxt = (o) => (o.start != null ? `${kh(o.start)}~${kh(o.end ?? o.start + 1).replace('오전 ', '').replace('오후 ', '')}` : '시간 없음');
  const diffs = (x, i = 0) => { const { b, a } = after(x, i), o = [];
    if (a.date !== b.date) o.push(['날짜', md(b.date), md(a.date)]);
    if (a.start !== b.start || a.end !== b.end) o.push(['시간', tTxt(b), tTxt(a)]);
    if (a.due !== b.due) o.push(['마감', b.due ? md(b.due) : '없음', a.due ? md(a.due) : '없음']);
    if (a.status !== b.status) o.push(['상태', A.ST[b.status], A.ST[a.status]]);
    return o; };
  const diffHTML = (x, i = 0) => `<dl class="ra-df">${diffs(x, i).map(([k, f, to]) => `<div><dt>${k}</dt><dd><s>${f}</s>${ic.chev}<b>${to}</b></dd></div>`).join('')}</dl>`;
  const KIND = { warn: ['지금 손볼 것', '마감을 지켜요'], time: ['시간 정하기', '일정에 들어가요'], git: ['끝난 것 정리', '완료가 하나 늘어요'] };
  const impact = (x) => (x.id.startsWith('ov-') ? '하루 8시간 안으로' : KIND[x.kind][1]);
  const dayBar = (s, x) => { const { a, b: b0 } = after(x), H0 = 8, H1 = 20, pct = (h) => `${((Math.min(Math.max(h, H0), H1) - H0) / (H1 - H0)) * 100}%`;
    if (a.date !== s || a.start == null || (a.start === b0.start && a.date === b0.date)) return '';
    const blocks = A.onDay(s).filter((t) => t.start != null && !t.until && t.id !== x.t.id);
    return `<div class="ra-bar" role="img" aria-label="${A.label(s)} ${kh(a.start)}에 들어가요">${blocks.map((t) => `<i style="left:${pct(t.start)};width:calc(${pct(t.end)} - ${pct(t.start)})"></i>`).join('')}<b style="left:${pct(a.start)};width:calc(${pct(a.end)} - ${pct(a.start)})"></b><span class="n" style="left:${pct(A.NOW)}"></span></div><p class="ra-ax"><span>오전 8시</span><span>낮 2시</span><span>저녁 8시</span></p>`; };
  /* ---------- AI 추천 새 다섯 모양 (?ra=6..10). 문장 대신 할 일 이름과 바뀌는 값을 가장 크게 ---------- */
  if (RA >= 6) document.documentElement.dataset.ra = 'b';
  const WHEN = (d) => (d === A.TODAY ? '오늘' : d === A.add(A.TODAY, 1) ? '내일' : md(d));
  const chg = (x, i = 0) => { const { a, b } = after(x, i);
    if (a.status !== b.status) return { top: '상태', big: A.ST[a.status], line: `${A.ST[b.status]}에서 ${A.ST[a.status]}로` };
    if (a.start != null && (a.start !== b.start || a.date !== b.date)) return { top: WHEN(a.date), big: hm(a.start), line: `${WHEN(a.date)} ${tTxt(a)}` };
    if (a.due !== b.due) return { top: '마감', big: a.due ? WHEN(a.due) : '없음', line: `마감 ${a.due ? WHEN(a.due) : '없음'}` };
    return { top: '날짜', big: WHEN(a.date), line: `${WHEN(a.date)}로` }; };
  const KW = { warn: '마감 지남', time: '빈 시간 있음', git: '끝난 것 같음' };
  const kw = (x) => (x.id.startsWith('ov-') ? '계획 초과' : KW[x.kind]);
  const ttl = (x) => A.esc(x.t.title);
  const NOTE = '<p class="rx-tip">AI가 할 일, 마감, 빈 시간, 커밋을 보고 골랐어요. 누르기 전에는 바뀌지 않아요.</p>';
  const btns = (x, go, alt, no) => `<button type="button" class="${go}" data-rpx="ai|${x.id}|0">${x.acts[0][0]}</button>${x.acts[1] ? `<button type="button" class="${alt}" data-rpx="ai|${x.id}|1">${x.acts[1][0]}</button>` : ''}<button type="button" class="${no}" data-rpx="ai-x|${x.id}" aria-label="${ttl(x)} 추천 넘기기" title="넘기기">${ic.x}</button>`;
  /* 8번: 어느 탭에서나 내용 맨 위에 붙는 추천 한 장 */
  const pinCard = (x, pager = '') => { const c = chg(x); return `<article class="rb8 k-${x.kind}"><div class="rb8-s"><small>${c.top}</small><b>${c.big}</b></div><div class="rb8-m"><p class="rb8-k">${kw(x)}</p><h4>${ttl(x)}</h4></div><div class="rb8-a">${btns(x, 'rb8-go', 'rb8-alt', 'rb8-no')}${pager}</div></article>`; };
  const pinStrip = (s) => { const l = suggest(s); if (!l.length) return doneBar(); const i = ((S.pin || 0) % l.length + l.length) % l.length;
    return `${doneBar()}${pinCard(l[i], l.length > 1 ? `<span class="rb8-p"><button type="button" data-rpx="pin|-1" aria-label="이전 추천">${ic.chev}</button><span>${i + 1} / ${l.length}</span><button type="button" data-rpx="pin|1" aria-label="다음 추천">${ic.chev}</button></span>` : '')}`; };
  /* 7번: 캘린더 칸 위에 빗금으로 들어갈 자리를 그림 */
  const ghosts = (d) => suggest(A.s.date).map((x) => { const { a, b } = after(x), T = (h) => (h - A.H0) * A.HH;
    if (a.start != null && a.date === d && (a.start !== b.start || a.date !== b.date)) { const e = a.end ?? a.start + 1;
      return `<div class="rb7-g k-${x.kind}" data-rbid="${x.id}" style="top:${T(a.start)}px;height:${Math.max((e - a.start) * A.HH - 2, 44)}px"><b>${ttl(x)}</b><span class="rb7-ga"><small>${hm(a.start)}</small><button type="button" class="ok" data-rpx="ai|${x.id}|0" aria-label="${A.esc(x.acts[0][0])}" title="${A.esc(x.acts[0][0])}">${ic.check}</button><button type="button" data-rpx="ai-x|${x.id}" aria-label="${ttl(x)} 추천 넘기기" title="넘기기">${ic.x}</button></span></div>`; }
    if (a.status !== b.status && b.date === d && b.start != null) return `<div class="rb7-g mark k-${x.kind}" data-rbid="${x.id}" style="top:${T(b.start)}px;height:${Math.max(((b.end ?? b.start + 1) - b.start) * A.HH - 2, 44)}px"><span class="rb7-ga"><button type="button" class="ok txt" data-rpx="ai|${x.id}|0" title="${A.esc(x.acts[0][0])}">${ic.check}완료로</button><button type="button" data-rpx="ai-x|${x.id}" aria-label="${ttl(x)} 추천 넘기기" title="넘기기">${ic.x}</button></span></div>`;
    return ''; }).join('');
  if (RA === 7 && P.dayCol) { const dc = P.dayCol; P.dayCol = (d, f) => { const h = dc(d, f), g = ghosts(d); return g ? h.replace(/<\/div>$/, `${g}</div>`) : h; }; }
  /* ---------- 7번 파생 (?ra=11..15). 칸을 누르면 펼침, 어디서 오는지 선, 검토 모드, 끌어서 고치기, 패널도 시간순 ---------- */
  const RC = RA >= 11 && RA <= 15;
  S.adj = {};
  /* 14번: 끌어서 고친 시간과 날짜를 추천에 얹음 */
  function tweak(x, i) { const j = RA === 14 && i === 0 && S.adj[x.id], t = x.t; if (!j || t.start == null) return; const du = (t.end ?? t.start + 1) - t.start; t.date = j.date; t.start = j.start; t.end = j.start + du; if (t.due && t.due < t.date) t.due = t.date; }
  const clash = (x, a) => a.start != null && A.onDay(a.date).some((t) => t.id !== x.t.id && t.start != null && !t.until && a.start < (t.end ?? t.start + 1) && (a.end ?? a.start + 1) > t.start);
  const lab = (x) => { if (RA !== 14 || !S.adj[x.id]) return x.acts[0][0]; const { a } = after(x); return `${WHEN(a.date)} ${kh(a.start)}에 넣기`; };
  const nudge = (x, dh, dd = 0) => { const { a } = after(x), du = (a.end ?? a.start + 1) - a.start, date = dd ? A.add(a.date, dd) : a.date; if (date < A.TODAY) return A.toast('지난 날로는 옮길 수 없어요'); S.adj[x.id] = { date, start: Math.min(Math.max(a.start + dh, A.H0), A.H1 - du) }; };
  const moved = (x) => { const { a, b } = after(x); return a.start != null && (a.start !== b.start || a.date !== b.date); };
  const curRev = (l) => l.find((y) => y.id === S.rev) || l[0];
  const xBtn = (x) => `<button type="button" data-rpx="ai-x|${x.id}" aria-label="${ttl(x)} 추천 넘기기" title="넘기기">${ic.x}</button>`;
  const okBtn = (x) => `<button type="button" class="ok" data-rpx="ai|${x.id}|0" aria-label="${A.esc(lab(x))}" title="${A.esc(lab(x))}">${ic.check}</button>`;
  const fromTxt = (b, a) => (b.date !== a.date ? `${+b.date.slice(5, 7)}/${+b.date.slice(8)}에서` : b.start == null ? '종일에서' : `${hm(b.start)}에서`);
  const ghostsC = (d) => { const l = suggest(A.s.date), cur = RA === 13 && !S.noRev ? curRev(l) : null; return l.map((x) => { const { a, b } = after(x), T = (h) => (h - A.H0) * A.HH;
    if (a.start != null && a.date === d && (a.start !== b.start || a.date !== b.date)) { const e = a.end ?? a.start + 1, top = T(a.start), st = `top:${top}px;height:${Math.max((e - a.start) * A.HH - 2, 44)}px`, c = `rb7-g rc k-${x.kind} ${cur === x ? 'cur' : ''}`;
      if (RA === 11) return `<button type="button" class="${c} pick" data-rbid="${x.id}" data-rpx="pop|${x.id}" aria-haspopup="dialog" aria-expanded="${S.pop === x.id}" aria-label="${ttl(x)} 추천 자세히" style="${st}"><b>${ttl(x)}</b><small>${hm(a.start)}</small></button>`;
      if (RA === 14) return `<div class="${c} drag ${clash(x, a) ? 'hit' : ''}" data-rbid="${x.id}" tabindex="0" role="group" aria-label="${ttl(x)}, ${WHEN(a.date)} ${kh(a.start)}. 화살표로 시간과 날짜를 바꿔요" title="끌어서 옮기기" style="${st}"><b>${ttl(x)}</b><span class="rb7-ga"><small>${hm(a.start)}</small>${okBtn(x)}${xBtn(x)}</span></div>`;
      const line = RA === 12 && b.date === a.date && b.start == null ? `<i class="rc-line" style="height:${top}px" aria-hidden="true"></i>` : '';
      return `${line}<div class="${c}" data-rbid="${x.id}" style="${st}"><b>${ttl(x)}</b><span class="rb7-ga"><small>${RA === 12 ? fromTxt(b, a) : hm(a.start)}</small>${okBtn(x)}${xBtn(x)}</span></div>`; }
    if (a.status !== b.status && b.date === d && b.start != null) return `<div class="rb7-g mark rc k-${x.kind} ${cur === x ? 'cur' : ''}" data-rbid="${x.id}" style="top:${T(b.start)}px;height:${Math.max(((b.end ?? b.start + 1) - b.start) * A.HH - 2, 44)}px"><span class="rb7-ga">${RA === 11 ? `<button type="button" class="ok txt" data-rpx="pop|${x.id}" aria-haspopup="dialog" aria-expanded="${S.pop === x.id}">끝났나요?</button>` : `<button type="button" class="ok txt" data-rpx="ai|${x.id}|0" title="${A.esc(x.acts[0][0])}">${ic.check}완료로</button>${xBtn(x)}`}</span></div>`;
    return ''; }).join(''); };
  if (RC && P.dayCol) { const dc = P.dayCol; P.dayCol = (d, f) => { const h = dc(d, f), g = ghostsC(d); return g ? h.replace(/<\/div>$/, `${g}</div>`) : h; }; }
  /* 12번: 종일 칸에서 내려오는 할 일 표시 */
  if (RA === 12 && P.adb) { const ab = P.adb; P.adb = (t) => { const h = ab(t); return suggest(A.s.date).some((x) => x.t.id === t.id && moved(x)) ? h.replace('class="', 'class="rc-from ') : h; }; }
  const popBack = (id) => document.querySelector(`.rb7-g[data-rbid="${id}"] button, button.rb7-g[data-rbid="${id}"], [data-rbid="${id}"] .rc-s`);
  /* 캘린더 쪽 떠 있는 것: 11번 펼침(칸이 없는 화면에서는 패널 줄 옆), 13번 아래 막대 */
  const syncOver = (s) => { const v = $('#view'); if (!v && RA !== 11) return; const l = suggest(s);
    if (RA === 11) { let p = $('#rc-pop'); const x = S.pop && l.find((y) => y.id === S.pop), g = x && ($(`.rb7-g[data-rbid="${x.id}"]`) || $(`[data-rbid="${x.id}"] .rc-s`)); if (!g) { p?.remove(); if (S.pop && !x) S.pop = null; return; }
      if (!p) { p = document.createElement('div'); p.id = 'rc-pop'; p.className = 'rx rc-pop'; p.setAttribute('role', 'dialog'); document.body.append(p); } const c = chg(x); p.setAttribute('aria-label', `${x.t.title} 추천`);
      p.innerHTML = `<p class="rc-k">${kw(x)}</p><h4>${ttl(x)}</h4><p class="rc-v">${c.line}</p><p class="rc-w">${A.esc(x.why)}</p><div class="rc-a">${btns(x, 'rc-go', 'rc-alt', 'rc-no')}</div>`;
      const r = g.getBoundingClientRect(), edge = v ? v.getBoundingClientRect().right : innerWidth, W = p.offsetWidth, H = p.offsetHeight; let L = r.right + 8; if (L + W > edge - 8) L = r.left - W - 8; p.style.left = `${Math.max(8, L)}px`; p.style.top = `${Math.max(8, Math.min(r.top, innerHeight - H - 12))}px`; return; }
    if (RA !== 13 || !v) return; const main = v.parentElement; let b = $('#rc-bar'); if (!l.length) { b?.remove(); v.classList.remove('rc-dim'); return; }
    if (!b) { b = document.createElement('div'); b.id = 'rc-bar'; b.className = 'rx rc-bar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', '추천 검토'); main.append(b); }
    v.classList.toggle('rc-dim', !S.noRev); if (S.noRev) { b.classList.add('off'); b.innerHTML = `<button type="button" class="rc-alt" data-rpx="rev-on">추천 ${l.length}곳 다시 보기</button>`; return; }
    const x = curRev(l), i = l.indexOf(x); let st = $('#rc-keep'); if (!st) { st = document.createElement('style'); st.id = 'rc-keep'; document.head.append(st); } st.textContent = `.rc-dim .ng-col > :not(.rb7-g):not(.nl):not(.rc-line)${l.filter((y) => !moved(y)).map((y) => `:not([data-id="${y.t.id}"])`).join('')}, .rc-dim .adg > * { opacity: .3; }`;
    b.classList.remove('off'); b.innerHTML = `<span class="rc-bn"><button type="button" data-rpx="rev|${l[(i - 1 + l.length) % l.length].id}" aria-label="이전 추천">${ic.chev}</button><span>${i + 1} / ${l.length}</span><button type="button" data-rpx="rev|${l[(i + 1) % l.length].id}" aria-label="다음 추천">${ic.chev}</button></span><p><b>${ttl(x)}</b><small>${chg(x).line}</small></p><button type="button" class="rc-go" data-rpx="ai|${x.id}|0">${x.acts[0][0]}</button><button type="button" class="rc-alt" data-rpx="ai-x|${x.id}">넘기기</button>${l.length > 1 ? `<button type="button" class="rc-alt" data-rpx="all">모두 하기</button>` : ''}<button type="button" class="rc-no" data-rpx="rev-off" aria-label="검토 끄기" title="검토 끄기">${ic.x}</button>`; };
  const rcBody = (s, l) => { const see = RA === 11 ? 'pop' : RA === 13 ? 'rev' : 'see';
    const head = (x, line) => `<button type="button" class="rc-s" data-rpx="${see}|${x.id}"><i class="rc-sw" aria-hidden="true"></i><span><small>${line}</small><b>${ttl(x)}</b></span></button>`;
    if (RA === 11) return `${doneBar()}<ul class="rc-l">${l.map((x) => `<li class="rc-r k-${x.kind}" data-rbid="${x.id}">${head(x, chg(x).line)}</li>`).join('')}</ul><p class="rx-tip">누르면 이유와 버튼이 나와요</p>${NOTE}`;
    if (RA === 12) return `${doneBar()}<ul class="rc-l">${l.map((x) => { const { a, b } = after(x), c = chg(x); return `<li class="rc-r k-${x.kind}" data-rbid="${x.id}">${head(x, moved(x) ? `${b.date !== a.date ? md(b.date) : b.start == null ? '종일' : hm(b.start)}에서 ${c.line}로` : c.line)}<p>${A.esc(x.why)}</p><div class="rc-a">${btns(x, 'rc-go', 'rc-alt', 'rc-no')}</div></li>`; }).join('')}</ul>${NOTE}`;
    if (RA === 13) { const x0 = S.noRev ? null : curRev(l); return `${doneBar()}<ul class="rc-l">${l.map((x) => `<li class="rc-r k-${x.kind} ${x === x0 ? 'cur' : ''}" data-rbid="${x.id}" ${x === x0 ? 'aria-current="true"' : ''}>${head(x, chg(x).line)}</li>`).join('')}</ul><p class="rx-tip">다른 일정을 흐리게 하고 추천 칸만 남겼어요. 아래 막대로 하나씩 정해요</p>${NOTE}`; }
    if (RA === 14) return `${doneBar()}<ul class="rc-l">${l.map((x) => { const { a } = after(x), mv = moved(x), hit = mv && clash(x, a); return `<li class="rc-r k-${x.kind}" data-rbid="${x.id}">${head(x, chg(x).line)}${mv ? `<div class="rc-st"><button type="button" data-rpx="adj|${x.id}|-0.5">30분 앞으로</button><button type="button" data-rpx="adj|${x.id}|0.5">30분 뒤로</button>${hit ? '<em>다른 일정과 겹쳐요</em>' : ''}</div>` : ''}<div class="rc-a"><button type="button" class="rc-go" data-rpx="ai|${x.id}|0">${lab(x)}</button><button type="button" class="rc-no" data-rpx="ai-x|${x.id}" aria-label="${ttl(x)} 추천 넘기기" title="넘기기">${ic.x}</button></div></li>`; }).join('')}</ul><p class="rx-tip">빗금 칸을 끌면 시간과 날짜가 바뀌어요. 칸을 고른 뒤 화살표 키로도 옮겨요</p>${NOTE}`;
    /* 15 패널도 시간순: 그날 일정 사이에 추천이 자기 시간대로 끼어듦 */
    const here = l.filter((x) => { const { a, b } = after(x); return (moved(x) && a.date === s) || (!moved(x) && b.date === s); }), away = l.filter((x) => !here.includes(x)), byId = new Map(here.filter((x) => !moved(x)).map((x) => [x.t.id, x]));
    const rows = [...A.onDay(s).filter((t) => t.start != null && !t.until).map((t) => ({ h: t.start, t, x: byId.get(t.id) })), ...here.filter(moved).map((x) => ({ h: after(x).a.start, x, add: true })), { h: A.NOW, now: true }].sort((p, q) => p.h - q.h);
    const line = (r) => (r.now ? `<li class="rc-now"><time>${hm(A.NOW)}</time><span>지금</span></li>` : r.add ? `<li class="rc-tr add k-${r.x.kind}" data-rbid="${r.x.id}"><time>${hm(r.h)}</time><span>${ttl(r.x)}<small>${A.esc(r.x.why)}</small></span><span class="rc-tb">${okBtn(r.x)}${xBtn(r.x)}</span></li>` : `<li class="rc-tr ${r.x ? 'mk' : ''} ${r.x ? `k-${r.x.kind}` : ''}" ${r.x ? `data-rbid="${r.x.id}"` : ''}><time>${hm(r.h)}</time><span>${A.esc(r.t.title)}${r.x ? `<small>${A.esc(r.x.why)}</small>` : ''}</span>${r.x ? `<span class="rc-tb"><button type="button" class="ok txt" data-rpx="ai|${r.x.id}|0">완료로</button>${xBtn(r.x)}</span>` : ''}</li>`);
    return `${doneBar()}<ol class="rc-t">${rows.map(line).join('')}</ol>${away.length ? `<p class="rc-th">다른 날에 들어가는 추천</p><ol class="rc-t">${away.map((x) => { const { a } = after(x); return `<li class="rc-tr add k-${x.kind}" data-rbid="${x.id}"><time>${WHEN(a.date)}<br>${a.start != null ? hm(a.start) : ''}</time><span>${ttl(x)}<small>${A.esc(x.why)}</small></span><span class="rc-tb">${okBtn(x)}${xBtn(x)}</span></li>`; }).join('')}</ol>` : ''}${NOTE}`; };
  const rbBody = (s) => { const l = suggest(s);
    if (!l.length) return `${doneBar()}<p class="rx-e">지금은 추천할 게 없어요</p>${NOTE}`;
    if (RC) return rcBody(s, l);
    /* 6 밝은 카드 한 장: 가장 급한 추천 하나만 화면에서 제일 밝게, 나머지는 눌러서 올림 */
    if (RA === 6) { const x = l.find((y) => y.id === S.hero) || l[0], c = chg(x), n = l.indexOf(x) + 1, rest = l.filter((y) => y !== x);
      return `${doneBar()}<article class="rb6 k-${x.kind}"><p class="rb6-n"><span>${kw(x)}</span><span>${n} / ${l.length}</span></p><h4>${ttl(x)}</h4><p class="rb6-v">${c.line}</p><p class="rb6-w">${A.esc(x.why)}</p><div class="rb6-a">${btns(x, 'rb6-go', 'rb6-alt', 'rb6-no')}</div></article>
        ${rest.length ? `<ul class="rb6-l">${rest.map((y) => `<li><button type="button" data-rpx="hero|${y.id}"><b>${ttl(y)}</b><small>${chg(y).line}</small></button></li>`).join('')}</ul>` : ''}${NOTE}`; }
    /* 7 캘린더 위에 자리 표시: 패널 줄과 캘린더 빗금 칸이 같은 모양 */
    if (RA === 7) return `${doneBar()}<p class="rx-tip">빗금 칸이 캘린더에 들어갈 자리예요</p><ul class="rb7">${l.map((x) => `<li class="rb7-r k-${x.kind}" data-rbid="${x.id}"><button type="button" class="rb7-s" data-rpx="see|${x.id}" title="캘린더에서 자리 보기"><small>${chg(x).line}</small><b>${ttl(x)}</b></button><p>${A.esc(x.why)}</p><div class="rb7-a">${btns(x, 'rx-b p', 'rx-b', 'rx-x')}</div></li>`).join('')}</ul>${NOTE}`;
    /* 8 어느 탭에서나 맨 위: AI 탭에서는 전부 펼침 */
    if (RA === 8) return `${doneBar()}${l.map((x) => pinCard(x)).join('')}${NOTE}`;
    /* 9 안내판: 언제 하는지를 아주 크게, 제목을 그다음으로. 칸 없이 줄로만 나눔 */
    if (RA === 9) return `${doneBar()}<ol class="rb9">${l.map((x) => { const c = chg(x); return `<li class="k-${x.kind}"><p class="rb9-b"><b>${c.big}</b><span>${c.top}</span></p><h4>${ttl(x)}</h4><p class="rb9-w">${A.esc(x.why)}</p><div class="rb9-a">${btns(x, 'rb9-go', 'rx-b', 'rx-x')}</div></li>`; }).join('')}</ol>${NOTE}`;
    /* 10 색면: 추천마다 종류 색으로 칸을 다 채움 */
    return `${doneBar()}${l.map((x) => `<article class="rb10 k-${x.kind}"><p class="rb10-k">${kw(x)}</p><h4>${ttl(x)}</h4><p class="rb10-v">${chg(x).line}</p><div class="rb10-a">${btns(x, 'rb10-go', 'rb10-alt', 'rb10-no')}</div></article>`).join('')}${NOTE}`; };
  const raBody = (s) => { if (RA >= 6) return rbBody(s); const l = suggest(s), note = `<p class="rx-note">${ic.ai}할 일, 마감, 빈 시간, 커밋을 보고 골랐어요. 누르기 전에는 아무것도 바뀌지 않아요.</p>`;
    if (!l.length) return `${doneBar()}<p class="rx-e">지금은 추천할 게 없어요</p>${note}`;
    /* 1 바뀌는 모습 먼저: 전과 후, 그날 막대에 들어갈 자리 */
    if (RA === 1) return `${doneBar()}${l.map((x) => `<article class="ra1 ${x.kind}"><p class="rx-ait">${x.kind === 'warn' ? ic.warn : x.kind === 'git' ? ic.git : ic.clock}<b>${A.esc(x.title)}</b></p>${dayBar(s, x)}${diffHTML(x)}<p class="rx-aiw">${A.esc(x.why)}</p>
        <div class="rx-aia">${x.acts.map(([lb], i) => `<button type="button" class="rx-b ${i ? '' : 'p'}" data-rpx="ai|${x.id}|${i}">${lb}</button>`).join('')}<button type="button" class="rx-x" data-rpx="ai-x|${x.id}" aria-label="이 추천 숨기기">${ic.x}</button></div></article>`).join('')}${note}`;
    /* 2 한 줄 목록: 줄을 고르면 이유가 펼쳐지고, 오른쪽 ✓ ×. ↑↓ Enter ⌫ */
    if (RA === 2) { const sel = l.find((x) => x.id === S.rsel) ? S.rsel : l[0].id;
      return `${doneBar()}<ul class="ra2" role="listbox" aria-label="AI 추천" tabindex="0" aria-activedescendant="ra2-${sel}">${l.map((x) => `<li id="ra2-${x.id}" role="option" aria-selected="${x.id === sel}" class="${x.kind}"><button type="button" class="ra2-t" data-rpx="rsel|${x.id}"><i></i><span>${A.esc(x.title)}</span></button>
          <button type="button" class="ra2-ok" data-rpx="ai|${x.id}|0" aria-label="${A.esc(x.acts[0][0])}" title="${A.esc(x.acts[0][0])}">${ic.check}</button><button type="button" class="ra2-no" data-rpx="ai-x|${x.id}" aria-label="넘기기" title="넘기기">${ic.x}</button>
          ${x.id === sel ? `<div class="ra2-d"><p>${A.esc(x.why)}</p>${diffHTML(x)}${x.acts[1] ? `<button type="button" class="rx-b" data-rpx="ai|${x.id}|1">${x.acts[1][0]}</button>` : ''}</div>` : ''}</li>`).join('')}</ul><p class="rx-tip"><kbd>↑</kbd><kbd>↓</kbd> 고르기, <kbd>Enter</kbd> 하기, <kbd>⌫</kbd> 넘기기</p>${note}`; }
    /* 3 하루 계획 고친 안: 추천을 모두 넣은 하루를 한 번에 보고, 뺄 것만 빼고 적용 */
    if (RA === 3) { const on = l.filter((x) => !S.planOff.has(x.id)), byT = {}; on.forEach((x) => { byT[x.t.id] = { x, ...after(x) }; });
      const rows = A.onDay(s).filter((t) => !t.until).map((t) => { const c = byT[t.id], a = c ? c.a : t; return { t, a, c, gone: c && c.a.date !== s }; }).sort((p, q) => (p.a.start ?? 99) - (q.a.start ?? 99));
      const away = on.filter((x) => !A.onDay(s).includes(x.t));
      return `${doneBar()}<div class="ra3"><p class="ra3-h"><b>AI가 고친 ${s === A.TODAY ? '오늘' : md(s)}</b><span>바뀌는 곳 ${on.length}곳</span></p><ol class="ra3-l">${rows.map(({ t, a, c, gone }) => `<li class="${c ? (gone ? 'out' : 'chg') : ''}"><time>${a.start != null && !gone ? hm(a.start) : '--:--'}</time><span>${A.sd(a.status)}<span class="${a.status === 'done' ? 'dn' : ''}">${A.esc(t.title)}</span></span>${c ? `<em>${gone ? `${md(c.a.date)}로` : c.b.start == null ? '시간 생김' : c.a.status !== c.b.status ? '완료로' : '바뀜'}</em>` : ''}</li>`).join('')}</ol>
        ${away.length ? `<p class="ra3-o">다른 날에서: ${away.map((x) => `${A.esc(x.t.title)} → ${md(after(x).a.date)}`).join(', ')}</p>` : ''}</div>
        <div class="ra3-p" role="group" aria-label="넣을 추천">${l.map((x) => `<button type="button" class="ra3-c" data-rpx="plan|${x.id}" aria-pressed="${!S.planOff.has(x.id)}">${x.kind === 'warn' ? ic.warn : x.kind === 'git' ? ic.git : ic.clock}<span>${A.esc(x.acts[0][0])}</span><small>${A.esc(x.t.title)}</small></button>`).join('')}</div>
        <div class="ra3-f"><button type="button" class="rx-b p" data-rpx="planok" ${on.length ? '' : 'disabled'}>이대로 ${on.length}곳 바꾸기</button></div>${note}`; }
    /* 4 하나씩 묻기: 이월 22번처럼 질문 하나에 답 고르기 */
    if (RA === 4) { const x = l[0], n = S.asked + l.length;
      return `${doneBar()}<div class="ra4"><p class="ra4-n"><span>${S.asked + 1} / ${n}</span><span class="ra4-p" aria-hidden="true">${[...Array(n)].map((_, i) => `<i class="${i < S.asked ? 'd' : i === S.asked ? 'c' : ''}"></i>`).join('')}</span></p>
        <p class="ra4-q">${A.esc(x.title)}</p><p class="ra4-w">${A.esc(x.why)}</p>${diffHTML(x)}
        <div class="ra4-a">${x.acts.map(([lb], i) => `<button type="button" class="${i ? '' : 'p'}" data-rpx="ask|${x.id}|${i}"><kbd>${i + 1}</kbd>${lb}</button>`).join('')}<button type="button" data-rpx="askx|${x.id}"><kbd>${x.acts.length + 1}</kbd>이건 넘기기</button></div></div>${note}`; }
    /* 5 이유별 묶음: 지금 손볼 것, 시간 정하기, 끝난 것 정리. 묶음마다 모두 하기 */
    return `${doneBar()}${Object.entries(KIND).map(([k, [lb]]) => { const g = l.filter((x) => x.kind === k); if (!g.length) return '';
      return `<section class="ra5 ${k}"><h4><span>${lb}</span><em>${g.length}</em>${g.length > 1 ? `<button type="button" class="rx-b" data-rpx="grp|${k}">모두 하기</button>` : ''}</h4>${g.map((x) => `<div class="ra5-r"><p><b>${A.esc(x.title)}</b><small>${A.esc(x.why)}</small></p><span class="ra5-i">${impact(x)}</span><button type="button" class="rx-b p" data-rpx="ai|${x.id}|0">${x.acts[0][0]}</button></div>`).join('')}</section>`; }).join('')}${note}`; };
  const aiBody = (s, max = 3) => { if (RA) return raBody(s); const l = suggest(s); return `${doneBar()}${l.length ? l.slice(0, max).map(aiCard).join('') + (l.length > max ? `<p class="rx-tip">추천 ${l.length - max}개 더 있어요</p>` : '') : '<p class="rx-e">지금은 추천할 게 없어요</p>'}<p class="rx-note">${ic.ai}할 일, 마감, 빈 시간, 커밋을 보고 골랐어요. 누르기 전에는 아무것도 바뀌지 않아요.</p>`; };
  const tl = (s, page) => (page === 'todos' ? `<div class="rx-tl">${P.dayView(s)}</div>` : '');

  /* ---------- 16: AI 추천은 오른쪽 줄의 버튼으로 따로 열고, 캘린더에는 미리보기를 켤 때만 자리를 그림 ---------- */
  const AIP = RA >= 16 && RA <= 21, EYE = I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'), HATCH = I('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 16l8-8M12 16l4-4M8 12l4-4"/>').replace('<svg ', '<svg class="i" '); /* 다른 아이콘과 같은 16px */
  /* 추천 칸 색 다섯 가지 (?ag=1..5). 종류 색(빨강, 노랑, 초록) 대신 서비스의 인디고 하나로 맞추고, 칸 안에 AI 표시(빗금 네모)를 붙임 */
  if (AIP) document.documentElement.dataset.ag = Q.get('ag') || '5'; /* 5 흐린 일정 칸으로 정함 */
  const MARK = `<i class="ag-ai" aria-hidden="true">${HATCH}</i>`, mk = (h) => h.replace(/<b>|<small class="ag-c">|<small class="pv-chip">|<span class="ag-lb">|<span class="ag-a">|<span class="ag-lone">/, (m) => m + MARK);
  S.pv = new Set(); S.aiOpen = AIP && (Q.has('aip') || Q.has('aipv')); if (RA === 16 && Q.get('aipv')) S.pv.add(Q.get('aipv'));
  const pvGhost = (d) => (!S.pv.size ? '' : suggest(A.s.date).filter((x) => S.pv.has(x.id)).map((x) => { const { a, b } = after(x), T = (h) => (h - A.H0) * A.HH;
    if (a.start != null && a.date === d && (a.start !== b.start || a.date !== b.date)) { const e = a.end ?? a.start + 1; return `<div class="rb7-g rc pv k-${x.kind}" data-rbid="${x.id}" style="top:${T(a.start)}px;height:${Math.max((e - a.start) * A.HH - 2, 44)}px"><b>${MARK}${ttl(x)}</b><small class="pv-l">미리보기, ${hm(a.start)}</small></div>`; }
    if (a.status !== b.status && b.date === d && b.start != null) return `<div class="rb7-g mark rc pv k-${x.kind}" data-rbid="${x.id}" style="top:${T(b.start)}px;height:${Math.max(((b.end ?? b.start + 1) - b.start) * A.HH - 2, 44)}px"><small class="pv-chip">${MARK}미리보기: ${A.ST[a.status]}로</small></div>`;
    return ''; }).join(''));

  /* ---------- 17~21: 캘린더 칸과 추천 목록을 같이 다시. AI 패널이 열려 있을 때만 칸을 그리고, 닫으면 사라짐 ---------- */
  const AV = RA >= 17 && RA <= 21 ? RA : 0;
  S.sel = Q.get('aipv') || null;
  const geo = (x) => { const { a, b } = after(x); return { a, b, place: a.start != null && (a.start !== b.start || a.date !== b.date), stat: a.status !== b.status }; };
  const gT = (h) => (h - A.H0) * A.HH, gH = (st, en) => Math.max(((en ?? st + 1) - st) * A.HH - 2, 40);
  const curSel = (l) => l.find((y) => y.id === S.sel) || l[0];
  const doneTxt = (a) => `${A.ST[a.status]}로`;
  const vGhost = (d) => { if (!AV || !S.aiOpen) return ''; const l = suggest(A.s.date), cur = curSel(l);
    return l.map((x, i) => { if (AV === 21 && x !== cur) return ''; const { a, b, place, stat } = geo(x), n = i + 1;
      const box = (top, h, cls, inner) => `<div class="ag ag${AV} ${cls} k-${x.kind} ${x === cur && (AV === 17 || AV === 19) && S.sel ? 'sel' : ''}" data-rbid="${x.id}" data-rpx="sel|${x.id}" style="top:${top}px;height:${h}px" title="AI 추천, ${ttl(x)}: ${A.esc(chg(x).line)}">${mk(inner)}</div>`;
      let o = '';
      if (place && a.date === d) o += box(gT(a.start), gH(a.start, a.end), 'to', ({
        17: `<span class="ag-n" aria-hidden="true">${n}</span><b>${ttl(x)}</b><small>${hm(a.start)}</small>`,
        18: `<b>${ttl(x)}</b><small><span class="ag-tag">바뀌면</span> ${tTxt(a)}</small>`,
        19: `<i class="ag-bar" aria-hidden="true"></i><span class="ag-lb"><b>${ttl(x)}</b><small>${hm(a.start)}</small></span>`,
        20: `<b>${ttl(x)}</b><small><span class="ag-tag">추천</span> ${hm(a.start)}</small>`,
        21: `<b>${ttl(x)}</b><small><span class="ag-tag">추천 ${n} / ${l.length}</span> ${tTxt(a)}</small>`,
      })[AV]);
      if (AV === 18 && place && b.start != null && b.date === d) o += box(gT(b.start), gH(b.start, b.end), 'from', `<b>${ttl(x)}</b><small class="ag-tag">지금 자리</small>`);
      if (stat && b.date === d && b.start != null) o += box(gT(b.start), gH(b.start, b.end), 'st', ({
        17: `<span class="ag-n" aria-hidden="true">${n}</span><small class="ag-c">${doneTxt(a)}</small>`,
        18: `<small class="ag-c">${A.ST[b.status]}에서 <b>${A.ST[a.status]}</b>로</small>`,
        19: `<i class="ag-bar" aria-hidden="true"></i><span class="ag-lb"><small>${doneTxt(a)}</small></span>`,
        20: `<span class="ag-lone"></span>`,
        21: `<small class="ag-tag">추천 ${n} / ${l.length}</small><small class="ag-c">${doneTxt(a)}</small>`,
      })[AV]);
      return o; }).join(''); };
  const showSel = (id) => requestAnimationFrame(() => { let g = document.querySelector(`.ag[data-rbid="${id}"]`); if (!g && $('#view')) { const x = suggest(A.s.date).find((y) => y.id === id); if (!x) return; const { a } = after(x); if (a.date !== A.s.date && a.start != null) { A.s.date = a.date; A.rerender(); } g = document.querySelector(`.ag[data-rbid="${id}"]`); } g?.scrollIntoView({ block: 'center', inline: 'nearest' }); });
  const calLink = (x) => ($('#view') ? '' : `<a class="ag-cal" href="d-calendar.html?ra=${AV}&aipv=${x.id}">캘린더에서 보기</a>`);
  const goBtns = (x) => `<div class="rc-a">${btns(x, 'rc-go', 'rc-alt', 'rc-no')}</div>${calLink(x)}`;
  const vPanel = (s) => { const l = suggest(s); if (!l.length) return `${doneBar()}<p class="rx-e">지금은 추천할 게 없어요</p>${NOTE}`; const cur = curSel(l);
    /* 17 번호: 캘린더 칸의 번호와 같은 번호. 고른 하나만 펼침 */
    if (AV === 17) return `${doneBar()}<p class="ag-h">추천 ${l.length}개. 번호는 캘린더 칸의 번호예요.</p><ol class="ag17-l">${l.map((x, i) => { const op = x === cur; return `<li class="k-${x.kind} ${op ? 'open' : ''}" data-rbid="${x.id}"><button type="button" class="ag17-r" data-rpx="sel|${x.id}" aria-expanded="${op}"><span class="ag-n">${i + 1}</span><span class="ag17-t"><small class="ai-k">${kw(x)}</small><b>${ttl(x)}</b><span>${chg(x).line}</span></span></button>${op ? `<div class="ag17-d"><p class="ai-w">${A.esc(x.why)}</p>${goBtns(x)}</div>` : ''}</li>`; }).join('')}</ol>${NOTE}`;
    /* 18 지금과 바뀌면: 값을 두 칸에 나란히 */
    if (AV === 18) return `${doneBar()}<p class="ag-h">추천 ${l.length}개</p><ul class="ag18-l">${l.map((x) => `<li class="ai-c k-${x.kind}" data-rbid="${x.id}"><p class="ai-k">${kw(x)}</p><h4>${ttl(x)}</h4><table class="ag18-t"><thead><tr><th scope="col"><span class="sr">항목</span></th><th scope="col">지금</th><th scope="col">바뀌면</th></tr></thead><tbody>${diffs(x).map(([k, f, t]) => `<tr><th scope="row">${k}</th><td>${f}</td><td><b>${t}</b></td></tr>`).join('')}</tbody></table><p class="ai-w">${A.esc(x.why)}</p>${goBtns(x)}</li>`).join('')}</ul>${NOTE}`;
    /* 19 시간순: 들어갈 시각 순서로, 날짜마다 묶음 */
    if (AV === 19) { const at = (x) => { const { a, b, place } = geo(x); return place ? { d: a.date, h: a.start } : { d: b.date, h: b.start ?? 99 }; }, o = [...l].sort((x, y) => (at(x).d + String(at(x).h).padStart(5, '0')).localeCompare(at(y).d + String(at(y).h).padStart(5, '0'))); let last = '';
      return `${doneBar()}${o.map((x) => { const w = at(x), op = x === cur, hd = w.d !== last ? `<h4 class="ag19-d">${WHEN(w.d)}</h4>` : ''; last = w.d; return `${hd}<div class="ag19-r k-${x.kind} ${op ? 'open' : ''}" data-rbid="${x.id}"><button type="button" class="ag19-b" data-rpx="sel|${x.id}" aria-expanded="${op}"><time>${w.h === 99 ? '종일' : hm(w.h)}</time><span><b>${ttl(x)}</b><small>${kw(x)}, ${chg(x).line}</small></span></button>${op ? `<div class="ag19-x"><p class="ai-w">${A.esc(x.why)}</p>${goBtns(x)}</div>` : ''}</div>`; }).join('')}${NOTE}`; }
    /* 20 종류별 묶음: 한 줄씩, 바로 넣기와 넘기기 */
    if (AV === 20) { const G = ['warn', 'time', 'git'].map((k) => [k, l.filter((x) => x.kind === k)]).filter((g) => g[1].length);
      return `${doneBar()}${G.map(([k, g]) => `<section class="ag20-g k-${k}"><h4><span>${KIND[k][0]}</span><em>${g.length}</em>${g.length > 1 ? `<button type="button" class="ag20-all" data-rpx="grp|${k}">모두 하기</button>` : ''}</h4><ul>${g.map((x) => `<li data-rbid="${x.id}"><button type="button" class="ag20-r" data-rpx="sel|${x.id}" title="${A.esc(x.why)}"><b>${ttl(x)}</b><small>${chg(x).line}</small></button><span class="ag-a">${okBtn(x)}${xBtn(x)}</span>${calLink(x)}</li>`).join('')}</ul></section>`).join('')}${NOTE}`; }
    /* 21 하나씩: 캘린더에는 지금 보는 추천 하나만 */
    const i = l.indexOf(cur), rest = l.filter((x) => x !== cur);
    return `${doneBar()}<div class="ag21-p"><span>${i + 1} / ${l.length}</span><button type="button" data-rpx="step|-1" aria-label="이전 추천" ${l.length < 2 ? 'disabled' : ''}>${ic.chev}</button><button type="button" data-rpx="step|1" aria-label="다음 추천" ${l.length < 2 ? 'disabled' : ''}>${ic.chev}</button></div>
      <article class="ai-c ag21 k-${cur.kind}" data-rbid="${cur.id}"><p class="ai-k">${kw(cur)}</p><h4>${ttl(cur)}</h4>${diffHTML(cur)}<p class="ai-w">${A.esc(cur.why)}</p>${goBtns(cur)}</article>
      ${rest.length ? `<p class="ag-h ag21-h">다음 추천</p><ul class="ag21-l">${rest.map((x) => `<li data-rbid="${x.id}"><button type="button" data-rpx="sel|${x.id}"><b>${ttl(x)}</b><small>${kw(x)}</small></button></li>`).join('')}</ul>` : ''}${NOTE}`; };
  if (AIP && P.dayCol) { const dc = P.dayCol; P.dayCol = (d, f) => { const h = dc(d, f), g = AV ? vGhost(d) : pvGhost(d); return g ? h.replace(/<\/div>$/, `${g}</div>`) : h; }; }
  const showPv = (id) => requestAnimationFrame(() => { let g = document.querySelector(`.rb7-g.pv[data-rbid="${id}"]`); if (!g) { const x = suggest(A.s.date).find((y) => y.id === id); if (!x) return; const { a } = after(x); if (a.date !== A.s.date) { A.s.date = a.date; A.rerender(); } g = document.querySelector(`.rb7-g.pv[data-rbid="${id}"]`); } g?.scrollIntoView({ block: 'center', inline: 'nearest' }); });
  const aiPanel = (s) => { const l = suggest(s), cal = !!$('#view'), all = l.length && l.every((x) => S.pv.has(x.id));
    if (!l.length) return `${doneBar()}<p class="rx-e">지금은 추천할 게 없어요</p>${NOTE}`;
    return `${doneBar()}<div class="ai-h"><p>추천 ${l.length}개</p>${cal ? `<button type="button" class="ai-pall" data-rpx="pvall" aria-pressed="${!!all}">${EYE}${all ? '미리보기 모두 끄기' : '모두 미리보기'}</button>` : ''}</div><ul class="ai-l">${l.map((x) => { const c = chg(x), on = S.pv.has(x.id);
      return `<li class="ai-c k-${x.kind} ${on ? 'on' : ''}" data-rbid="${x.id}"><div class="ai-t"><p class="ai-k">${kw(x)}</p>${cal ? `<button type="button" class="ai-pv" data-rpx="pv|${x.id}" aria-pressed="${on}" aria-label="${ttl(x)} 캘린더에서 미리보기">${EYE}<span>${on ? '미리보는 중' : '미리보기'}</span></button>` : `<a class="ai-pv" href="d-calendar.html?aipv=${x.id}">${EYE}<span>캘린더에서 보기</span></a>`}</div><h4>${ttl(x)}</h4><p class="ai-v">${c.line}</p><p class="ai-w">${A.esc(x.why)}</p><div class="rc-a">${btns(x, 'rc-go', 'rc-alt', 'rc-no')}</div></li>`; }).join('')}</ul>${NOTE}`; };
  if (AIP) {
    const ps = P.strip; P.strip = (l, i) => ps(l, i).replace(/(<button data-rp [^>]*>.*?<\/button>)/, `$1\n    <button data-aip aria-pressed="false" aria-label="AI 추천" title="AI 추천">${HATCH}</button>`);
    const pf = P.frame; P.frame = () => { pf(); const on = P.rp && S.aiOpen, n = suggest(A.s.date).length; $('[data-rp]')?.setAttribute('aria-pressed', P.rp && !S.aiOpen); const b = $('[data-aip]'); if (b) { b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', `AI 추천${n ? ` ${n}개` : ''}`); } };
    document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-aip], .strip [data-rp]'); if (!b) return;
      if (b.matches('[data-aip]')) { e.stopPropagation(); S.aiOpen = !(S.aiOpen && P.rp); P.rp = true; return A.rerender(); }
      if (S.aiOpen) { e.stopPropagation(); S.aiOpen = false; P.rp = true; A.rerender(); } }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.pv.size && !document.querySelector('dialog[open]') && !(e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]'))) { S.pv.clear(); A.rerender(); } });
    if (S.pv.size) addEventListener('load', () => setTimeout(() => showPv([...S.pv][0]), 200));
    if (AV && Q.get('aipv')) addEventListener('load', () => setTimeout(() => showSel(Q.get('aipv')), 200));
  }

  /* ---------- 6~10: 요소마다 탭 하나. 탭 놓는 방식만 다름 ---------- */
  const dayBody = (s) => (DY ? dyV(s) : dayBody0(s));
  const dayBody0 = (s) => { const l = A.onDay(s).filter((t) => t.status !== 'done' && !t.until).sort((a, b) => (a.start ?? 99) - (b.start ?? 99));
    return `${prog(s)}<p class="rx-sub">남은 할 일 ${l.length}개</p>${l.map((t) => row(t, t.start != null ? `${kh(t.start)}` : '시간 미정')).join('') || `<p class="rx-e">${A.onDay(s).length ? '다 끝냈어요' : '오늘은 할 일이 없어요'}</p>`}`; };
  const noGit = !A.ghOn(), tabsOf = (s, page) => tabs0(s, page).filter((x) => !(noGit && x[0] === 'cm') && !(AIP && x[0] === 'ai')), tabs0 = (s, page) => { const ut = untimed(s).length, dg = dueGroups(), late = dg.find((g) => g[0] === 'late');
    return [['day', ic.day, '하루', null, () => dayBody(s), `${A.stats(s).done}/${A.stats(s).n} 완료`], ...(page === 'todos' ? [['tl', ic.cal, '시간표', null, () => tl(s, page), '그날 시간표']] : []),
      ['ut', ic.clock, '시간 미정', ut, () => utBody(s), ut ? `${ut}개, 빈 시간 찾기` : '없어요'], ['due', ic.flag, '마감', dg.reduce((a, g) => a + g[2].length, 0), dueBody, late ? `${late[2].length}개 지남` : '지난 것 없음', !!late],
      ['cm', ic.git, '커밋', commits(s).length, () => cmBody(s), `${commits(s).length}개`], ['ai', ic.ai, 'AI 추천', suggest(s).length, () => aiBody(s), suggest(s).length ? `${suggest(s).length}개` : '없어요']]; };
  const curTab = (T, page) => (T.find((x) => x[0] === S.tab) ? S.tab : page === 'todos' ? 'tl' : 'day');
  const tabHTML = (T, cur, cls, vertical = false) => `<div class="${cls}" role="tablist" aria-label="오른쪽 패널" aria-orientation="${vertical ? 'vertical' : 'horizontal'}">${T.map(([k, i, l, n, , , warn]) => `<button type="button" role="tab" id="rxt-${k}" aria-controls="rxp" aria-selected="${cur === k}" tabindex="${cur === k ? 0 : -1}" data-rpx="tab|${k}" title="${l}">${i}<span>${l}</span>${n ? `<em class="${warn ? 'warn' : ''}">${n}</em>` : ''}</button>`).join('')}</div>`;
  const paneHTML = (T, cur) => `<div class="rx-pane" id="rxp" role="tabpanel" aria-labelledby="rxt-${cur}" tabindex="0">${RA === 8 && cur !== 'ai' ? pinStrip(A.s.date) : ''}${T.find((x) => x[0] === cur)[4]()}</div>`;


  /* ---------- 패널 탭 시안: 하루 ?dy=1..5, 시간 미정 ?ut=1..5, 마감 ?dd=1..5, 커밋 ?gc=1..5 (없으면 지금 모양) ---------- */
  /* 정함: 하루 2, 시간 미정은 지금 모양(0), 마감 2, 커밋 4. 주소에 0을 주면 이전 모양 */
  const qv = (k, d) => (Q.has(k) ? +Q.get(k) || 0 : d);
  const DY = qv('dy', 2), UT = qv('ut', 0), DD = qv('dd', 2), GC = qv('gc', 4);
  S.dur = {}; S.ddSel = null; S.cvOut = new Set(); S.dyDone = false;
  const H0b = 8, H1b = 20, pc = (h) => `${((Math.min(Math.max(h, H0b), H1b) - H0b) / (H1b - H0b)) * 100}%`;
  const timed = (s) => A.onDay(s).filter((t) => t.start != null && !t.until);
  const left = (s) => A.onDay(s).filter((t) => t.status !== 'done' && !t.until).sort((a, b) => (a.start ?? 99) - (b.start ?? 99));
  const isToday = (s) => s === A.TODAY, nowH = (s) => (isToday(s) ? A.NOW : null);
  const tagTxt = (t) => P.tags(t).map((k) => '#' + (A.TAG[k] || k)).join(' ');
  /* 하루를 가로 막대로: 계획한 칸, 끝낸 칸, 지금 */
  const dayStrip = (s, opt = {}) => { const n = nowH(s);
    return `<div class="px-strip ${opt.cls || ''}" role="img" aria-label="${A.label(s)} 계획 막대">${timed(s).map((t) => `<i class="${t.status}" style="left:${pc(t.start)};width:calc(${pc(t.end ?? t.start + 1)} - ${pc(t.start)})" title="${A.esc(t.title)}"></i>`).join('')}${(opt.gaps || []).map(([a, b]) => `<b class="gap" style="left:${pc(a)};width:calc(${pc(b)} - ${pc(a)})"></b>`).join('')}${n != null ? `<span class="px-nl" style="left:${pc(n)}" title="지금 ${hm(n)}"></span>` : ''}</div><p class="px-ax"><span>오전 8시</span><span>낮 2시</span><span>저녁 8시</span></p>`; };
  const gaps = (s) => { const busy = timed(s).map((t) => [t.start, t.end ?? t.start + 1]).sort((a, b) => a[0] - b[0]), o = []; let h = Math.max(9, isToday(s) ? Math.ceil(A.NOW * 2) / 2 : 9);
    busy.forEach(([a, b]) => { if (a > h && a <= 19) o.push([h, Math.min(a, 19)]); h = Math.max(h, b); }); if (h < 19) o.push([h, 19]); return o.filter(([a, b]) => b - a >= 0.5); };
  const freeSum = (s) => gaps(s).reduce((a, [x, y]) => a + y - x, 0);
  const tRow = (t, right = '', acts = '', cls = '') => row(t, right, acts).replace('class="rx-r"', `class="rx-r ${cls}"`);

  const dyV = (s) => { const l = left(s), st = A.stats(s), n = nowH(s), cur = n != null ? timed(s).find((t) => t.start <= n && n < (t.end ?? t.start + 1) && t.status !== 'done') : null, next = l.find((t) => t.start != null && (n == null || t.start >= n) && t !== cur), done = A.onDay(s).filter((t) => t.status === 'done');
    const empty = !A.onDay(s).length ? '<p class="rx-e">이 날은 할 일이 없어요</p>' : '';
    if (empty) return empty;
    /* 1 하루 막대: 계획한 칸과 지금 위치를 먼저, 목록은 그 아래 */
    if (DY === 1) return `<div class="px-card"><p class="px-big"><b>${l.length}</b><span>개 남음</span><small>${st.done}/${st.n} 완료, 계획 ${hTxt(st.plan)}</small></p>${dayStrip(s)}</div>
      <div class="px-list">${l.map((t) => tRow(t, t.start != null ? hm(t.start) : '시간 미정')).join('')}</div>`;
    /* 2 지금과 다음: 지금 하는 일, 다음 일까지 남은 시간 */
    if (DY === 2) { const til = next && n != null ? next.start - n : null;
      return `${cur ? `<div class="px-now"><p class="px-k">지금</p><h4>${A.esc(cur.title)}</h4><p class="px-m">${A.range(cur.start, cur.end)}</p><div class="rx-bar"><i style="width:${Math.min(100, ((n - cur.start) / ((cur.end ?? cur.start + 1) - cur.start)) * 100)}%"></i></div></div>` : `<div class="px-now quiet"><p class="px-k">지금</p><p class="px-m">잡혀 있는 일이 없어요</p></div>`}
        ${next ? `<div class="px-next"><p class="px-k">다음${til != null ? `, ${hTxt(til)} 뒤` : ''}</p><h4>${A.esc(next.title)}</h4><p class="px-m">${A.range(next.start, next.end ?? next.start + 1)}</p></div>` : ''}
        <p class="rx-sub">그 밖에 ${l.filter((t) => t !== cur && t !== next).length}개</p><div class="px-list">${l.filter((t) => t !== cur && t !== next).map((t) => tRow(t, t.start != null ? kh(t.start) : '시간 미정')).join('')}</div>`; }
    /* 3 세로 시간 줄: 끝낸 일도 흐리게 남기고, 지금 선을 사이에 */
    if (DY === 3) { const all = A.onDay(s).filter((t) => !t.until).sort((a, b) => (a.start ?? 99) - (b.start ?? 99)); let drew = false;
      return `${prog(s, true)}<ol class="px-tl">${all.map((t) => { let line = ''; if (!drew && n != null && (t.start == null || t.start > n)) { drew = true; line = `<li class="px-nowl" aria-label="지금 ${hm(n)}"><span>${hm(n)}</span></li>`; }
        return `${line}<li class="${t.status}"><time>${t.start != null ? hm(t.start) : '미정'}</time><i aria-hidden="true"></i>${tRow(t, '', '', 'px-in')}</li>`; }).join('')}</ol>`; }
    /* 4 세 칸 숫자 + 상태별 묶음 */
    if (DY === 4) { const g = [['doing', '진행 중'], ['todo', '진행 전']];
      return `<div class="px-tiles"><div><small>완료</small><b>${st.done}<span>/${st.n}</span></b></div><div class="${st.plan > 8 ? 'over' : ''}"><small>계획</small><b>${hTxt(st.plan)}</b></div><div><small>커밋</small><b>${st.commits}</b></div></div>
        ${g.map(([k, lb]) => { const x = l.filter((t) => t.status === k); return x.length ? `<p class="rx-sub">${lb} ${x.length}</p><div class="px-list">${x.map((t) => tRow(t, t.start != null ? kh(t.start) : '시간 미정')).join('')}</div>` : ''; }).join('')}`; }
    /* 5 한 문장 + 시각 먼저인 목록, 끝낸 일은 접어 둠 */
    return `<p class="px-say">${st.n}개 중 <b>${st.done}개</b>를 끝냈고 <b>${l.length}개</b>가 남았어요.${next ? ` 다음은 <b>${kh(next.start)}</b> ${A.esc(next.title)}이에요.` : ''}</p>
      <div class="px-ag">${l.map((t) => `<div class="px-ag-r"><time>${t.start != null ? hm(t.start) : '미정'}</time>${tRow(t)}</div>`).join('')}</div>
      ${done.length ? `<button type="button" class="px-more" data-rpx="dydone" aria-expanded="${S.dyDone}">${ic.down}끝낸 일 ${done.length}개</button>${S.dyDone ? `<div class="px-list done">${done.map((t) => tRow(t, t.start != null ? hm(t.start) : '')).join('')}</div>` : ''}` : ''}`; };

  const utV = (s) => { const l = untimed(s); if (!l.length) return '<p class="rx-e">시간이 안 정해진 할 일이 없어요</p>'; const g = gaps(s), fs = freeSum(s);
    const slots = (du = 1) => { const o = []; g.forEach(([a, b]) => { for (let h = a; h + du <= b && o.length < 3; h += 0.5) o.push(h); }); return o; };
    /* 1 빈 시간 세 개 중 고르기 */
    if (UT === 1) return `<p class="rx-sub">빈 시간을 눌러 바로 넣어요</p>${l.map((t) => `<div class="px-ut1">${tRow(t)}<div class="px-chips">${slots().map((h) => `<button type="button" class="px-chip" data-rpx="place|${t.id}|${h}">${kh(h)}</button>`).join('') || '<span class="rx-e">남은 빈 시간이 없어요</span>'}</div></div>`).join('')}`;
    /* 2 하루 막대 위 빈 칸: 비어 있는 곳을 보고 넣기 */
    if (UT === 2) return `<div class="px-card"><p class="px-big"><b>${hTxt(fs)}</b><span>비어 있어요</span></p>${dayStrip(s, { gaps: g })}</div><div class="px-list">${l.map((t) => { const h = free(s); return tRow(t, '', h != null ? `<button type="button" class="rx-a" data-rpx="place|${t.id}|${h}">${kh(h)}</button>` : ''); }).join('')}</div><p class="rx-tip">점선 칸이 빈 시간이에요. 끌어서 캘린더에 놓아도 돼요</p>`;
    /* 3 길이부터 정하기: 길이를 고르면 들어갈 시각이 바뀜 */
    if (UT === 3) return l.map((t) => { const du = S.dur[t.id] || 1, h = free(s, du); return `<div class="px-ut3">${tRow(t)}<div class="px-row"><div class="px-seg" role="group" aria-label="${A.esc(t.title)} 걸리는 시간">${[[0.5, '30분'], [1, '1시간'], [2, '2시간']].map(([v, lb]) => `<button type="button" data-rpx="utdur|${t.id}|${v}" aria-pressed="${du === v}">${lb}</button>`).join('')}</div>${h != null ? `<button type="button" class="rx-a" data-rpx="placed|${t.id}|${h}|${du}">${kh(h)}에 넣기</button>` : '<small class="px-m">맞는 빈 시간 없음</small>'}</div></div>`; }).join('');
    /* 4 끌어 놓는 카드: 손잡이와 태그를 크게 */
    if (UT === 4) return `<p class="rx-sub">카드를 캘린더 시간 칸으로 끌어 놓아요</p>${l.map((t) => `<div class="px-ut4" data-id="${t.id}" draggable="true" role="button" tabindex="0" aria-label="${A.esc(t.title)} 열기, 캘린더로 끌어 놓을 수 있어요"><span class="px-grip" aria-hidden="true"></span><span class="px-ut4-t"><b>${A.esc(t.title)}</b><small>${tagTxt(t) || '태그 없음'}${t.due ? `, 마감 ${md(t.due)}` : ''}</small></span></div>`).join('')}`;
    /* 5 한 번에 넣기: 빈 시간에 차례로 */
    { let taken = []; const plan = l.map((t) => { const busy = [...timed(s).map((x) => [x.start, x.end ?? x.start + 1]), ...taken]; let h = null; for (let x = Math.max(9, isToday(s) ? Math.ceil(A.NOW * 2) / 2 : 9); x + 1 <= 19; x += 0.5) if (!busy.some(([a, b]) => x < b && x + 1 > a)) { h = x; break; } if (h != null) taken.push([h, h + 1]); return [t, h]; });
      return `<div class="px-card"><p class="px-big"><b>${l.length}</b><span>개가 시간 없음</span><small>남은 빈 시간 ${hTxt(fs)}</small></p><button type="button" class="rc-go px-wide" data-rpx="utall" ${plan.some((p) => p[1] != null) ? '' : 'disabled'}>빈 시간에 차례로 넣기</button></div>
        <div class="px-list">${plan.map(([t, h]) => tRow(t, h != null ? `${kh(h)}에 들어가요` : '자리 없음')).join('')}</div>`; } };

  const ddV = (s) => { const all = A.todos.filter((t) => t.due && t.status !== 'done' && dn(t.due) <= 13).sort((a, b) => (a.due < b.due ? -1 : 1)); if (!all.length) return '<p class="rx-e">다가오는 마감이 없어요</p>';
    const dtag = (t) => { const n = dn(t.due); return n < 0 ? `D+${-n}` : n === 0 ? 'D-day' : `D-${n}`; }, cls = (t) => { const n = dn(t.due); return n < 0 ? 'late' : n <= 1 ? 'soon' : ''; };
    const plus = (t) => `<button type="button" class="rx-a" data-rpx="due1|${t.id}" aria-label="${A.esc(t.title)} 마감 하루 미루기">+1일</button>`;
    /* 1 D-숫자 먼저 */
    if (DD === 1) return `<div class="px-list">${all.map((t) => `<div class="px-dd1 ${cls(t)}"><b class="px-d">${dtag(t)}</b>${tRow(t, md(t.due), plus(t))}</div>`).join('')}</div>`;
    /* 2 일주일 띠: 날을 누르면 그날 마감만 */
    if (DD === 2) { const days = [...Array(7)].map((_, i) => A.add(A.TODAY, i)), late = all.filter((t) => dn(t.due) < 0), sel = S.ddSel, shown = sel === 'late' ? late : sel ? all.filter((t) => t.due === sel) : all.filter((t) => dn(t.due) <= 6);
      const cell = (k, lb, sub, n, c = '') => `<button type="button" class="${c}" data-rpx="ddsel|${k}" aria-pressed="${sel === k}"><small>${lb}</small><b>${sub}</b><span>${'<i></i>'.repeat(Math.min(n, 3))}</span></button>`;
      return `<div class="px-week" role="group" aria-label="이번 주 마감">${late.length ? cell('late', '지남', late.length, late.length, 'late') : ''}${days.map((d) => cell(d, A.DOW[A.s2d(d).getDay()], +d.slice(8), all.filter((t) => t.due === d).length, d === A.TODAY ? 'today' : '')).join('')}</div>
        <p class="rx-sub">${sel === 'late' ? '마감 지남' : sel ? md(sel) + ' 마감' : '7일 안 마감'} ${shown.length}</p><div class="px-list">${shown.map((t) => tRow(t, dtag(t), plus(t), cls(t))).join('') || '<p class="rx-e">이 날은 마감이 없어요</p>'}</div>`; }
    /* 3 지난 마감은 경고 상자, 나머지는 평범한 목록 */
    if (DD === 3) { const late = all.filter((t) => dn(t.due) < 0), rest = all.filter((t) => dn(t.due) >= 0);
      return `${late.length ? `<div class="px-warn"><p class="px-k">${ic.warn}마감이 지났어요 ${late.length}</p>${late.map((t) => `<div class="px-warn-r">${tRow(t, `${-dn(t.due)}일 지남`)}<div class="px-chips"><button type="button" class="px-chip" data-rpx="due0|${t.id}">마감을 오늘로</button><button type="button" class="px-chip" data-rpx="due1|${t.id}">+1일</button></div></div>`).join('')}</div>` : ''}
        <p class="rx-sub">다가오는 마감 ${rest.length}</p><div class="px-list">${rest.map((t) => tRow(t, dn(t.due) === 0 ? '오늘' : dn(t.due) === 1 ? '내일' : md(t.due), plus(t))).join('')}</div>`; }
    /* 4 남은 날 막대: 7일을 한 칸으로, 지난 것은 꽉 참 */
    if (DD === 4) return `<div class="px-list">${all.map((t) => { const n = dn(t.due), w = n < 0 ? 100 : Math.max(4, 100 - (n / 7) * 100); return `<div class="px-dd4 ${cls(t)}">${tRow(t, dtag(t), plus(t))}<div class="px-meter" role="img" aria-label="${dtag(t)}"><i style="width:${w}%"></i></div></div>`; }).join('')}</div><p class="rx-tip">막대가 찰수록 마감이 가까워요</p>`;
    /* 5 두 주 달력: 마감 있는 날에 점 */
    { const ws = A.weekStart(A.TODAY), days = [...Array(14)].map((_, i) => A.add(ws, i)), sel = S.ddSel && S.ddSel !== 'late' ? S.ddSel : null, late = all.filter((t) => dn(t.due) < 0), shown = sel ? all.filter((t) => t.due === sel) : all;
      return `<div class="px-cal" role="grid" aria-label="두 주 마감 달력"><div class="px-cal-h">${A.DOW.map((d) => `<span>${d}</span>`).join('')}</div><div class="px-cal-g">${days.map((d) => { const n = all.filter((t) => t.due === d).length; return `<button type="button" class="${d === A.TODAY ? 'today' : ''} ${d < A.TODAY ? 'past' : ''}" data-rpx="ddsel|${d}" aria-pressed="${sel === d}" aria-label="${md(d)} 마감 ${n}개">${+d.slice(8)}${n ? '<i></i>' : ''}</button>`; }).join('')}</div></div>
        ${!sel && late.filter((t) => t.due < ws).length ? `<p class="rx-sub late">이 달력보다 앞에서 지난 마감 ${late.filter((t) => t.due < ws).length}</p>` : ''}<p class="rx-sub">${sel ? md(sel) + ' 마감' : '두 주 안 마감'} ${shown.length}</p><div class="px-list">${shown.map((t) => tRow(t, dtag(t), plus(t), cls(t))).join('') || '<p class="rx-e">이 날은 마감이 없어요</p>'}</div>`; } };

  const gcV = (s) => { const cs = commits(s); if (!cs.length) return '<p class="rx-e">이 날 남긴 커밋이 없어요</p>';
    const typ = (c) => (c.msg.match(/^(\w+)(\(|:)/) || [, '기타'])[1], body = (c) => c.msg.replace(/^\w+(\([^)]*\))?:\s*/, ''), tt = (c) => (c.todoId ? A.byId(c.todoId) : null);
    /* 1 할 일에 묶어서: 어느 할 일에 쓴 커밋인지 */
    if (GC === 1) { const by = new Map(); cs.forEach((c) => { const k = c.todoId || ''; by.set(k, [...(by.get(k) || []), c]); });
      return [...by].map(([k, l]) => { const t = k && A.byId(k); return `<div class="px-gc1">${t ? tRow(t, `${l.length}개`) : `<p class="px-k">할 일과 안 묶인 커밋 ${l.length}</p>`}<ul>${l.map((c) => `<li><time>${hm(c.start)}</time><span>${A.esc(c.msg)}</span></li>`).join('')}</ul></div>`; }).join(''); }
    /* 2 하루 막대 위 점: 언제 일했는지 */
    if (GC === 2) return `<div class="px-card"><p class="px-big"><b>${cs.length}</b><span>개 커밋</span><small>${hm(cs[0].start)}부터 ${hm(cs[cs.length - 1].start)}까지</small></p><div class="px-strip dots" role="img" aria-label="커밋 시각">${cs.map((c) => `<span class="px-cmd" style="left:${pc(c.start)}" title="${hm(c.start)} ${A.esc(c.msg)}"></span>`).join('')}</div><p class="px-ax"><span>오전 8시</span><span>낮 2시</span><span>저녁 8시</span></p></div>
      <ul class="px-cl">${cs.map((c) => `<li><time>${hm(c.start)}</time><span>${A.esc(c.msg)}</span></li>`).join('')}</ul>`;
    /* 3 종류별: fix, test, review 처럼 앞말로 묶음 */
    if (GC === 3) { const by = {}; cs.forEach((c) => (by[typ(c)] = by[typ(c)] || []).push(c));
      return `<p class="px-types">${Object.entries(by).map(([k, l]) => `<span><b>${A.esc(k)}</b>${l.length}</span>`).join('')}</p>${Object.entries(by).map(([k, l]) => `<div class="px-gc3"><p class="px-k">${A.esc(k)}</p><ul class="px-cl">${l.map((c) => `<li><time>${hm(c.start)}</time><span>${A.esc(body(c))}</span></li>`).join('')}</ul></div>`).join('')}`; }
    /* 4 세로 시간 줄: 저장소와 묶인 할 일까지 */
    if (GC === 4) return `<ol class="px-tl gc">${cs.map((c) => { const t = tt(c); return `<li><time>${hm(c.start)}</time><i aria-hidden="true"></i><div><p>${A.esc(c.msg)}</p><small>${A.esc(c.repo)}${t ? `, ${A.esc(t.title)}` : ''}</small></div></li>`; }).join('')}</ol>`;
    /* 5 회고에 넣을 것 고르기 (눌러서 빼고 넣기) */
    { const n = cs.filter((c) => !S.cvOut.has(c.id)).length;
      return `<p class="px-say">회고 초안의 "남긴 커밋"에 <b>${n}개</b>가 들어가요.</p><ul class="px-gc5">${cs.map((c) => { const on = !S.cvOut.has(c.id); return `<li><button type="button" data-rpx="cvin|${c.id}" aria-pressed="${on}"><time>${hm(c.start)}</time><span>${A.esc(c.msg)}</span><em>${on ? '넣음' : '뺌'}</em></button></li>`; }).join('')}</ul><p class="rx-tip">누르면 넣고 빼요. 할 일과 안 묶인 커밋도 고를 수 있어요</p>`; } };

  /* ---------- 다섯 가지 ---------- */
  P.rpHTML = (s, page) => { if (RC) syncOver(s);
    if (AIP && S.aiOpen) return `<div class="rx rx6 rxai"><div class="rx-top"><b>AI 추천</b><small>${A.label(s)}</small></div><div class="rx-pane" id="rxp" tabindex="0">${AV ? vPanel(s) : aiPanel(s)}</div></div>`;
    if (RP >= 6) { const T = tabsOf(s, page), cur = curTab(T, page), lab = T.find((x) => x[0] === cur);
      /* 6 위쪽 글자 탭 */
      if (RP === 6) return `<div class="rx rx6"><div class="rx-top"><b>${A.label(s)}</b></div>${tabHTML(T, cur, 'rx-t6')}${paneHTML(T, cur)}</div>`;
      /* 7 오른쪽 아이콘 줄: 탭이 패널 가장자리에 세로로 */
      if (RP === 7) return `<div class="rx rx7"><div class="rx7-c"><div class="rx-top"><b>${lab[2]}</b><small>${A.label(s)}</small></div>${paneHTML(T, cur)}</div>${tabHTML(T, cur, 'rx-t7', true)}</div>`;
      /* 8 아래쪽 탭 막대 */
      if (RP === 8) return `<div class="rx rx8"><div class="rx-top"><b>${lab[2]}</b><small>${A.label(s)}</small></div>${paneHTML(T, cur)}${tabHTML(T, cur, 'rx-t8')}</div>`;
      /* 9 탭마다 한 줄 요약이 붙은 목록, 고르면 그 탭만 */
      if (RP === 9) return `<div class="rx rx9"><div class="rx-top"><b>${A.label(s)}</b></div><div class="rx-t9" role="tablist" aria-label="오른쪽 패널" aria-orientation="vertical">${T.map(([k, i, l, n, , sub, warn]) => `<button type="button" role="tab" id="rxt-${k}" aria-controls="rxp" aria-selected="${cur === k}" tabindex="${cur === k ? 0 : -1}" data-rpx="tab|${k}">${i}<span>${l}</span><small class="${warn ? 'warn' : ''}">${sub}</small></button>`).join('')}</div>${paneHTML(T, cur)}</div>`;
      /* 10 머리의 보기 고르기: 지금 탭 이름을 누르면 목록, 숫자 키 1~6 */
      return `<div class="rx rx10"><div class="rx10-h"><button type="button" class="rx10-sw" data-rpx="sw" aria-expanded="${!!S.sw}" aria-haspopup="true">${lab[1]}<b>${lab[2]}</b>${lab[3] ? `<em>${lab[3]}</em>` : ''}${ic.down}</button><small>${A.label(s)}</small></div>
        ${S.sw ? `<div class="rx10-m" role="tablist" aria-label="오른쪽 패널" aria-orientation="vertical">${T.map(([k, i, l, n, , sub, warn], j) => `<button type="button" role="tab" id="rxt-${k}" aria-controls="rxp" aria-selected="${cur === k}" tabindex="${cur === k ? 0 : -1}" data-rpx="tab|${k}">${i}<span>${l}</span><small class="${warn ? 'warn' : ''}">${sub}</small><kbd>${j + 1}</kbd></button>`).join('')}</div>` : ''}
        ${paneHTML(T, cur)}<p class="rx-tip">숫자 키 1~${T.length}로 바로 바꿔요</p></div>`; }
    const ut = untimed(s).length, dg = dueGroups(), dc = dg.reduce((a, g) => a + g[2].length, 0), late = dg.find((g) => g[0] === 'late'), cc = commits(s).length, ai = suggest(s).length;
    const top = `<div class="rx-top"><b>${A.label(s)}</b>${page === 'todos' ? '<a class="rx-lnk" href="d-calendar.html">캘린더로</a>' : ''}</div>`;
    /* 1 쌓기: 모든 것을 섹션으로, 접을 수 있음 */
    if (RP === 1) return `<div class="rx rx1">${top}${prog(s)}${sec('ai', ic.ai, 'AI 추천', ai, aiBody(s, 2))}${page === 'todos' ? sec('tl', ic.day, '시간표', null, tl(s, page)) : ''}${sec('ut', ic.clock, '시간 미정', ut, utBody(s))}${sec('due', ic.flag, '마감', dc, dueBody(), late ? `<span class="rx-late">${late[2].length}개 지남</span>` : '')}${sec('cm', ic.git, '커밋', cc, cmBody(s))}</div>`;
    /* 2 탭: 한 번에 하나만 크게 */
    if (RP === 2) { const T = [...(page === 'todos' ? [['tl', ic.day, '시간표', null]] : []), ['ai', ic.ai, 'AI', ai], ['ut', ic.clock, '시간 미정', ut], ['due', ic.flag, '마감', dc], ['cm', ic.git, '커밋', cc]], cur = T.find((x) => x[0] === S.tab) ? S.tab : T[0][0];
      const B = { tl: () => tl(s, page), ai: () => aiBody(s), ut: () => utBody(s), due: () => dueBody(), cm: () => cmBody(s) };
      return `<div class="rx rx2">${top}${prog(s, true)}<div class="rx-tabs" role="tablist" aria-label="오른쪽 패널">${T.map(([k, i, l, n]) => `<button type="button" role="tab" aria-selected="${cur === k}" data-rpx="tab|${k}" title="${l}">${i}<span>${l}</span>${n ? `<em class="${k === 'due' && late ? 'warn' : ''}">${n}</em>` : ''}</button>`).join('')}</div><div class="rx-pane" role="tabpanel">${B[cur]()}</div></div>`; }
    /* 3 처리함: 손봐야 할 할 일을 한 목록에, AI 추천은 그 줄 안에 */
    if (RP === 3) { const sg = suggest(s), byT = {}; sg.forEach((x) => { (byT[x.t.id] = byT[x.t.id] || []).push(x); });
      const items = [...(late ? late[2].map((t) => [t, `마감 ${-dn(t.due)}일 지남`, 'late']) : []), ...untimed(s).map((t) => [t, '시간 미정', '']), ...dg.filter((g) => g[0] !== 'late').flatMap((g) => g[2].map((t) => [t, `${g[1]}`, g[0] === 'today' || g[0] === 'tom' ? 'soon' : '']))].filter((x, i, a) => a.findIndex((y) => y[0].id === x[0].id) === i);
      const extra = sg.filter((x) => !items.some((it) => it[0].id === x.t.id));
      return `<div class="rx rx3">${top}${prog(s)}${tl(s, page)}<section class="rx-s"><h3 class="rx-h plain">손볼 할 일 <em>${items.length}</em></h3>${doneBar()}<div class="rx-in">${items.map(([t, why, k]) => `<div class="rx-ii ${k}">${row(t, why)}${(byT[t.id] || []).map((x) => `<div class="rx-sg"><span>${ic.ai}${A.esc(x.acts[0][0])}</span><button type="button" class="rx-b p" data-rpx="ai|${x.id}|0">하기</button>${x.acts[1] ? `<button type="button" class="rx-b" data-rpx="ai|${x.id}|1">${x.acts[1][0]}</button>` : ''}</div>`).join('')}</div>`).join('') || '<p class="rx-e">손볼 할 일이 없어요</p>'}</div>
        ${extra.length ? `<div class="rx-more">${extra.map(aiCard).join('')}</div>` : ''}</section>
        <section class="rx-s"><h3 class="rx-h"><button type="button" data-rpx="tog|cm3" aria-expanded="${S.closed.has('cm3') ? 'false' : 'true'}">${ic.down}${ic.git}<span>커밋</span><em>${cc}</em></button></h3>${S.closed.has('cm3') ? '' : `<div class="rx-bd">${cmBody(s)}</div>`}</section><p class="rx-note">${ic.ai}AI 추천은 누르기 전에는 아무것도 바꾸지 않아요.</p></div>`; }
    /* 4 요약 칸: 숫자 넷을 먼저, 누르면 그 아래 펼침 */
    if (RP === 4) { const TL = [['ut', ic.clock, '시간 미정', ut, ut ? '넣을 시간 찾기' : '없어요'], ['due', ic.flag, '마감', dc, late ? `${late[2].length}개 지남` : '지난 것 없음'], ['cm', ic.git, '커밋', cc, `${new Set(commits(s).map((c) => c.repo)).size}개 저장소`], ['ai', ic.ai, 'AI 추천', ai, ai ? '눌러서 보기' : '없어요']];
      const B = { ai: () => aiBody(s), ut: () => utBody(s), due: () => dueBody(), cm: () => cmBody(s) };
      return `<div class="rx rx4">${top}${prog(s)}<div class="rx-tiles">${TL.map(([k, i, l, n, sub]) => `<button type="button" class="rx-tile ${S.tile === k ? 'on' : ''} ${k === 'due' && late ? 'warn' : ''}" data-rpx="tile|${k}" aria-expanded="${S.tile === k}"><span>${i}${l}</span><b>${n}</b><small>${sub}</small></button>`).join('')}</div>
        ${S.tile ? `<div class="rx-open">${B[S.tile]()}</div>` : ''}${tl(s, page)}</div>`; }
    /* 5 AI 브리핑: 맨 위에 하루를 한 문단으로, 추천을 번호로. 나머지는 한 줄씩 */
    const st = A.stats(s), sg = suggest(s);
    const brief = `${st.n}개 중 ${st.done}개를 끝냈고 계획은 ${hTxt(st.plan)}이에요. ${late ? `마감이 지난 일이 ${late[2].length}개 있고, ` : ''}${ut ? `시간이 안 정해진 일이 ${ut}개 있어요. ` : ''}${cc ? `커밋은 ${cc}개 남겼어요.` : '아직 커밋이 없어요.'}`;
    const line = (k, i, l, n, body) => `<section class="rx-s"><h3 class="rx-h"><button type="button" data-rpx="tog5|${k}" aria-expanded="${S.tile === k}">${ic.chev}${i}<span>${l}</span><em>${n}</em></button></h3>${S.tile === k ? `<div class="rx-bd">${body()}</div>` : ''}</section>`;
    return `<div class="rx rx5">${top}<div class="rx-brief"><p class="rx-bh">${ic.ai}<b>AI가 본 ${s === A.TODAY ? '오늘' : md(s)}</b></p><p>${brief}</p>${prog(s, true)}</div>
      ${doneBar()}${sg.length ? `<ol class="rx-ol">${sg.map((x, n) => `<li><span class="rx-n">${n + 1}</span><div>${aiCard(x)}</div></li>`).join('')}</ol>${sg.length > 1 ? `<button type="button" class="rx-b all" data-rpx="all">추천 ${sg.length}개 모두 첫 번째로 하기</button>` : ''}` : '<p class="rx-e">지금은 추천할 게 없어요</p>'}
      ${tl(s, page)}${line('ut', ic.clock, '시간 미정', ut, () => utBody(s))}${line('due', ic.flag, '마감', dc, dueBody)}${line('cm', ic.git, '커밋', cc, () => cmBody(s))}<p class="rx-note">${ic.ai}추천은 누르기 전에는 아무것도 바꾸지 않아요.</p></div>`;
  };

  /* ---------- 동작 ---------- */
  const snap = (t) => ({ t, v: { date: t.date, start: t.start, end: t.end, due: t.due, status: t.status } });
  const apply = (t, fn, msg) => { const sn = snap(t); fn(); S.done.push({ ...sn, msg }); A.toast(msg); A.rerender(); };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-rpx]'); if (!el || !el.closest('.rx, .rb7-g, .ag')) return; e.stopPropagation();
    const [a, v, w] = el.dataset.rpx.split('|'), s = A.s.date, keep = `[data-rpx="${el.dataset.rpx}"]`;
    const redraw = (sel) => { A.rerender(); (sel && $(sel))?.focus(); };
    if (a === 'tog') { S.closed.has(v) ? S.closed.delete(v) : S.closed.add(v); return redraw(keep); }
    if (a === 'tab') { S.tab = v; S.sw = false; return redraw(`#rxt-${v}, .rx10-sw`); }
    if (a === 'sw') { S.sw = !S.sw; return redraw(S.sw ? '.rx10-m [aria-selected="true"]' : '.rx10-sw'); }
    if (a === 'tile') { S.tile = S.tile === v ? null : v; return redraw(keep); }
    if (a === 'tog5') { S.tile = S.tile === v ? null : v; return redraw(keep); }
    if (a === 'dydone') { S.dyDone = !S.dyDone; return redraw(keep); }
    if (a === 'utdur') { S.dur[v] = +w; return redraw(keep); }
    if (a === 'placed') { const t = A.byId(v), h = +w, du = +el.dataset.rpx.split('|')[3]; return apply(t, () => { t.start = h; t.end = h + du; }, `"${t.title}"를 ${kh(h)}에 넣었어요`); }
    if (a === 'utall') { const l = untimed(s); let n = 0; l.forEach((t) => { const h = free(s, 1); if (h == null) return; const sn = snap(t); t.start = h; t.end = h + 1; n++; S.done.push({ ...sn, msg: `${n}개를 빈 시간에 넣었어요`, batch: a }); }); S.done.slice(-n).forEach((d) => { d.msg = `${n}개를 빈 시간에 넣었어요`; }); A.toast(`${n}개를 빈 시간에 넣었어요`); return redraw('.rx-done button'); }
    if (a === 'due0') { const t = A.byId(v); return apply(t, () => { t.due = A.TODAY; }, `"${t.title}" 마감을 오늘로 바꿨어요`); }
    if (a === 'ddsel') { S.ddSel = S.ddSel === v ? null : v; return redraw(keep); }
    if (a === 'cvin') { S.cvOut.has(v) ? S.cvOut.delete(v) : S.cvOut.add(v); return redraw(keep); }
    if (a === 'place') { const t = A.byId(v), h = +w; return apply(t, () => { t.start = h; t.end = h + 1; }, `"${t.title}"를 ${kh(h)}에 넣었어요`); }
    if (a === 'due1') { const t = A.byId(v); return apply(t, () => { t.due = A.add(t.due, 1); }, `"${t.title}" 마감을 ${md(A.add(t.due, 1))}로 미뤘어요`); }
    if (a === 'pop') { S.pop = S.pop === v ? null : v; const g = document.querySelector(`.rb7-g[data-rbid="${v}"]`); S.quiet = Date.now(); g?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); A.rerender(); return (S.pop ? $('#rc-pop button') : popBack(v))?.focus(); }
    if (a === 'rev') { S.rev = v; S.noRev = false; S.quiet = Date.now(); A.rerender(); document.querySelector(`.rb7-g[data-rbid="${v}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const lb = el.getAttribute('aria-label'); return (lb ? $(`#rc-bar [aria-label="${lb}"]`) : $('#rc-bar .rc-go'))?.focus(); }
    if (a === 'rev-off') { S.noRev = true; return redraw('#rc-bar button'); }
    if (a === 'rev-on') { S.noRev = false; return redraw('#rc-bar .rc-go'); }
    if (a === 'adj') { const x = suggest(s).find((y) => y.id === v); if (x) nudge(x, +w); return redraw(keep); }
    if (a === 'hero') { S.hero = v; return redraw('.rb6-go'); }
    if (a === 'pin') { S.pin = (S.pin || 0) + +v; return redraw(keep); }
    if (a === 'see') { const g = document.querySelector(`.rb7-g[data-rbid="${v}"]`); if (!g) return A.toast('이 추천은 캘린더 칸에 그릴 자리가 없어요'); g.scrollIntoView({ block: 'center', inline: 'center' }); return; }
    if (a === 'rsel') { S.rsel = v; return redraw(`#ra2-${v} .ra2-t`); }
    if (a === 'plan') { S.planOff.has(v) ? S.planOff.delete(v) : S.planOff.add(v); return redraw(keep); }
    if (a === 'planok') { const l = suggest(s).filter((x) => !S.planOff.has(x.id)); l.forEach((x) => { S.gone.add(x.id); const sn = snap(x.t); x.acts[0][1](); S.done.push({ ...sn, msg: `${l.length}곳을 바꿨어요`, batch: a }); }); A.toast(`AI 안대로 ${l.length}곳을 바꿨어요`); return redraw('.rx-done button'); }
    if (a === 'ask') { const x = suggest(s).find((y) => y.id === v); if (!x) return; S.gone.add(x.id); S.asked++; const [, fn, msg] = x.acts[+w]; apply(x.t, fn, msg); return (document.querySelector('.ra4-a button') || document.querySelector('.rx-done button'))?.focus(); }
    if (a === 'askx') { S.gone.add(v); S.asked++; return redraw('.ra4-a button, .rx-done button'); }
    if (a === 'grp') { const l = suggest(s).filter((x) => x.kind === v); l.forEach((x) => { S.gone.add(x.id); const sn = snap(x.t); x.acts[0][1](); S.done.push({ ...sn, msg: `${KIND[v][0]} ${l.length}개를 했어요`, batch: a }); }); A.toast(`${KIND[v][0]} ${l.length}개를 했어요`); return redraw('.rx-done button'); }
    if (a === 'pv') { S.pv.has(v) ? S.pv.delete(v) : S.pv.add(v); A.rerender(); if (S.pv.has(v)) showPv(v); return $(`[data-rpx="pv|${v}"]`)?.focus(); }
    if (a === 'pvall') { const l = suggest(s), on = l.every((x) => S.pv.has(x.id)); l.forEach((x) => (on ? S.pv.delete(x.id) : S.pv.add(x.id))); A.rerender(); if (!on && l[0]) showPv(l[0].id); return $('[data-rpx="pvall"]')?.focus(); }
    if (a === 'sel') { const from = el.closest('.ag') ? 'ag' : 'rx'; S.sel = (AV === 17 || AV === 19) && S.sel === v && from === 'rx' ? null : v; A.rerender(); if (S.sel) showSel(v); return $(from === 'ag' ? `.rx [data-rbid="${v}"] [data-rpx="sel|${v}"], .rx .ag21 .rc-go` : `.rx [data-rpx="sel|${v}"]`)?.focus(); }
    if (a === 'step') { const l = suggest(s), i = Math.max(0, l.indexOf(curSel(l))), x = l[(i + +v + l.length) % l.length]; S.sel = x.id; A.rerender(); showSel(x.id); return $(keep)?.focus(); }
    if (a === 'ai' || a === 'ai-x') S.pv.delete(v);
    if (a === 'ai') { const x = suggest(s).find((y) => y.id === v); if (!x) return; S.gone.add(x.id); const [, fn, msg] = x.acts[+w], tw = RA === 14 && +w === 0 && S.adj[v]; if (RC) S.pop = null; apply(x.t, tw ? () => { fn(); tweak(x, 0); } : fn, tw ? `${WHEN(tw.date)} ${kh(tw.start)}에 넣었어요` : msg); if (RA >= 6) $(RA === 13 && !S.noRev ? '#rc-bar .rc-go, .rx-done button' : '.rx-done button')?.focus(); return; }
    if (a === 'ai-x') { S.pop = null; S.gone.add(v); A.toast('이 추천을 숨겼어요'); return redraw(RA === 13 && !S.noRev ? '#rc-bar .rc-go' : '.rx [data-rpx^="ai|"], .rx [data-rpx^="pop|"], .rb7-g.pick, .rx-top b'); }
    if (a === 'all') { const l = suggest(s); l.forEach((x) => { S.gone.add(x.id); const sn = snap(x.t); x.acts[0][1](); S.done.push({ ...sn, msg: `추천 ${l.length}개를 했어요`, batch: a }); }); A.toast(`추천 ${l.length}개를 했어요`); A.rerender(); $('.rx-done button')?.focus(); return; }
    if (a === 'undo') { const d = S.done.pop(); if (!d) return; const set = [d]; while (d.batch && S.done.length && S.done[S.done.length - 1].batch === d.batch && S.done[S.done.length - 1].msg === d.msg) set.push(S.done.pop()); if (S.asked) S.asked--; set.forEach((u) => { Object.assign(u.t, u.v); [...S.gone].filter((id) => id.endsWith('-' + u.t.id)).forEach((id) => S.gone.delete(id)); }); A.toast('되돌렸어요'); return redraw('.rx-done button, .rx [data-rpx^="ai|"]'); }
  }, true);
  /* 탭 키보드: 화살표로 옆 탭, 10번은 숫자 키 */
  document.addEventListener('keydown', (e) => { if (RP < 6) return; const tab = e.target.closest && e.target.closest('.rx [role=tab]'); const s = A.s.date, page = document.querySelector('#board') ? 'todos' : 'cal';
    if (RP === 10 && /^[1-6]$/.test(e.key) && !e.target.closest('input, textarea, dialog') && document.querySelector('.rx10')) { const T = tabsOf(s, page), x = T[+e.key - 1]; if (x) { S.tab = x[0]; A.rerender(); } return; }
    if (!tab) return; const vert = tab.closest('[aria-orientation=vertical]'), k = e.key, fw = vert ? 'ArrowDown' : 'ArrowRight', bw = vert ? 'ArrowUp' : 'ArrowLeft';
    if (![fw, bw, 'Home', 'End'].includes(k)) return; e.preventDefault(); const l = [...tab.parentNode.querySelectorAll('[role=tab]')], i = l.indexOf(tab), j = k === 'Home' ? 0 : k === 'End' ? l.length - 1 : (i + (k === fw ? 1 : -1) + l.length) % l.length;
    S.tab = l[j].dataset.rpx.split('|')[1]; A.rerender(); document.querySelector(`#rxt-${S.tab}`)?.focus(); });
  /* AI 추천 2번 목록, 4번 질문 키보드 */
  document.addEventListener('keydown', (e) => { if (!RA || e.target.closest('input, textarea, dialog')) return; const s = A.s.date;
    if (RA === 2 && e.target.closest('.ra2')) { const l = suggest(s); if (!l.length) return; const i = Math.max(0, l.findIndex((x) => x.id === S.rsel)), k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); S.rsel = l[(i + (k === 'ArrowDown' ? 1 : -1) + l.length) % l.length].id; A.rerender(); return document.querySelector(`#ra2-${S.rsel} .ra2-t`)?.focus(); }
      if (k === 'Enter' && !e.target.closest('.ra2-ok, .ra2-no, .rx-b')) { e.preventDefault(); return document.querySelector(`#ra2-${l[i].id} .ra2-ok`)?.click(); }
      if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); return document.querySelector(`#ra2-${l[i].id} .ra2-no`)?.click(); } }
    if (RA === 4 && /^[1-9]$/.test(e.key) && document.querySelector('.ra4')) { const b = document.querySelectorAll('.ra4-a button')[+e.key - 1]; if (b) { e.preventDefault(); b.click(); } } });
  /* 7번: 빗금 칸 위에서 끌어 만들기 막기, 패널 줄과 캘린더 칸을 같이 강조 */
  if (RA === 7 || RC || AV) { ['mousedown', 'pointerdown', 'dblclick'].forEach((n) => document.addEventListener(n, (e) => { if (e.target.closest && e.target.closest('.rb7-g, .ag')) e.stopPropagation(); }, true));
    const lit = (id) => document.querySelectorAll('[data-rbid]').forEach((n) => n.classList.toggle('on', n.dataset.rbid === id));
    ['mouseover', 'focusin'].forEach((n) => document.addEventListener(n, (e) => { const r = e.target.closest && e.target.closest('[data-rbid]'); lit(r ? r.dataset.rbid : null); })); }
  /* 11번: 바깥 누르기, Esc, 스크롤로 펼침 닫기 */
  if (RA === 11) { const close = (back) => { if (!S.pop) return; const id = S.pop; S.pop = null; $('#rc-pop')?.remove(); document.querySelectorAll('[aria-haspopup="dialog"][aria-expanded="true"]').forEach((n) => n.setAttribute('aria-expanded', 'false')); if (back) popBack(id)?.focus(); };
    /* 펼침이 열려 있을 때 시간표 빈 곳을 누르면 닫기만 하고 새 할 일 창은 열지 않음 */
    ['mousedown', 'mouseup', 'click'].forEach((n) => document.addEventListener(n, (e) => { if (!S.pop || e.target.closest('#rc-pop, [data-rpx^="pop|"]')) return; if (e.target.closest('#view, #board, .ng-col')) e.stopPropagation(); if (n === 'click') close(false); }, true));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.pop) { e.stopPropagation(); close(true); } }, true);
    document.addEventListener('scroll', (e) => { if (S.pop && e.target.nodeType === 1 && !e.target.closest('#rc-pop') && Date.now() - (S.quiet || 0) > 250) close(false); }, true); }
  /* 14번: 빗금 칸 끌기, 화살표 키 */
  if (RA === 14) { let D = null; const snap = (dy) => Math.round(dy / (A.HH / 2)) * (A.HH / 2);
    const refocus = (id) => document.querySelector(`.rb7-g[data-rbid="${id}"]`)?.focus();
    document.addEventListener('pointerdown', (e) => { const g = e.target.closest && e.target.closest('.rb7-g.drag'); if (!g || e.target.closest('button')) return; const x = suggest(A.s.date).find((y) => y.id === g.dataset.rbid); if (!x) return; D = { g, x, a: after(x).a, sx: e.clientX, sy: e.clientY, dy: 0 }; g.classList.add('on-drag'); e.preventDefault(); }, true);
    document.addEventListener('pointermove', (e) => { if (!D) return; D.dy = snap(e.clientY - D.sy); D.g.style.transform = `translate(${e.clientX - D.sx}px, ${D.dy}px)`; const t = D.g.querySelector('small'); if (t) t.textContent = hm(D.a.start + D.dy / A.HH); });
    document.addEventListener('pointerup', (e) => { if (!D) return; const { x, a, g, dy } = D, lane = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.dataset && n.dataset.lane), du = (a.end ?? a.start + 1) - a.start; D = null; g.classList.remove('on-drag'); let date = lane ? lane.dataset.lane : a.date; if (date < A.TODAY) { date = a.date; A.toast('지난 날로는 옮길 수 없어요'); } S.adj[x.id] = { date, start: Math.min(Math.max(a.start + dy / A.HH, A.H0), A.H1 - du) }; A.rerender(); refocus(x.id); });
    document.addEventListener('keydown', (e) => { const g = e.target.closest && e.target.closest('.rb7-g.drag'); if (!g || e.target !== g) return; const M = { ArrowUp: [-0.5, 0], ArrowDown: [0.5, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key]; if (!M) return; e.preventDefault(); e.stopPropagation(); const x = suggest(A.s.date).find((y) => y.id === g.dataset.rbid); if (!x) return; nudge(x, ...M); A.rerender(); refocus(x.id); }, true); }
  /* 줄 제목: Enter 로 열기 (끌어 놓기는 기존 캘린더 동작) */
  document.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const t = e.target.closest && e.target.closest('.rx-t[data-id]'); if (!t) return; e.preventDefault(); A.s.sel = t.dataset.id; A.rerender(); });
})();
