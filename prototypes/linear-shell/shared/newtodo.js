/* 새 할 일 창 시안 1~5 (?na=1..5, 기본 3). 밀러의 법칙: 처음 보이는 묶음을 다섯 개 안으로 줄이고,
   자주 안 바꾸는 값(상태, 마감, 메모)은 눌러야 열린다. ?naopen=1 이면 열린 채로 시작 (na 없이 쓰면 지금 창) */
(function () {
  const A = window.ARC, P = window.PL;
  if (!A || !P) return;
  const Q = new URLSearchParams(location.search), NA = Q.has('na') ? +Q.get('na') : 3; /* 3번으로 정함. ?na=0 은 이전 창 */
  const autoOpen = () => { if (Q.get('naopen')) setTimeout(() => { P.openNew({ date: A.s.date || A.TODAY }); if (NA && Q.get('natext')) { const i = document.querySelector('#nwdlg [data-nwt]'); i.value = Q.get('natext'); i.dispatchEvent(new Event('input', { bubbles: true })); } if (NA && Q.get('napop')) { const b = document.querySelector(`#nwdlg [data-nwp="${Q.get('napop')}"]`); if (b) b.click(); } }, 300); };
  if (!NA) { autoOpen(); return; }

  const $ = (q, r = document) => r.querySelector(q), esc = A.esc, pad = A.pad, T = A.TODAY;
  const I = (p) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ic = {
    date: A.ico.cal, time: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), due: I('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
    tags: I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'), st: I('<circle cx="12" cy="12" r="8"/>'),
    note: I('<path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/>'), check: I('<path d="m5 12 5 5L20 7"/>'), x: A.ico.x,
  };
  const LBL = { date: '날짜', time: '시간', due: '마감일', cal: '캘린더', tags: '태그', st: '상태' };
  const EMPTY = { date: '날짜 없음', time: '시간 없음', due: '마감 없음', tags: '태그 없음', st: '' };

  /* 날짜, 시간 글자 */
  const dow = (s) => A.s2d(s).getDay();
  const md = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${A.DOW[d.getDay()]})`; };
  const rel = (s) => (s === T ? '오늘' : s === A.add(T, 1) ? '내일' : s === A.add(T, 2) ? '모레' : '');
  const dayTxt = (s) => (rel(s) ? `${rel(s)}, ${md(s)}` : md(s));
  const nextDow = (w, from = T) => { let d = from; while (dow(d) !== w) d = A.add(d, 1); return d; };
  const weekend = () => nextDow(6);
  const kt = (h) => { const m = Math.round(h * 60), H = Math.floor(m / 60) % 24, mm = m % 60; return `${H < 12 ? '오전' : '오후'} ${H % 12 || 12}시${mm ? ` ${mm}분` : ''}`; };
  const tmv = (v) => { if (!v) return null; const [h, m] = v.split(':').map(Number); return h + m / 60; };
  const calOf = (id) => A.cals.find((c) => c.id === id) || A.cals[0];
  const tn = (k) => A.TAG[k] || k;
  const tagKey = (n) => Object.keys(A.TAG).find((k) => A.TAG[k] === n) || n;
  const allTags = () => [...new Set([...A.todos.flatMap((t) => P.tags(t)), ...(N ? N.tags : [])])];

  let N = null, B = null;
  const S = { pop: null, q: '', note: false, more: false, lock: {}, got: new Set(), raw: '', opts: [] };

  const VAL = {
    date: () => (N.date ? dayTxt(N.date) : ''),
    time: () => (N.start == null ? '' : `${kt(N.start)} ~ ${kt(N.end)}`),
    due: () => (N.due ? `${md(N.due)}까지` : ''),
    cal: () => calOf(N.cal).name,
    tags: () => N.tags.map((k) => '#' + tn(k)).join(' '),
    st: () => A.ST[N.status],
  };
  const OPT = {
    date: () => [[T, '오늘'], [A.add(T, 1), '내일'], [A.add(T, 2), '모레'], [weekend(), '이번 주말'], [A.add(A.weekStart(T), 8), '다음 주 월요일']].map(([v, l]) => ({ v, l, sub: md(v), on: N.date === v })),
    time: () => [[null, '시간 없음', '그날 종일'], [9, '오전 9시'], [10, '오전 10시'], [14, '오후 2시'], [16, '오후 4시'], [18, '오후 6시']].map(([v, l, sub]) => ({ v, l, sub: sub || '1시간', on: v == null ? N.start == null : N.start === v })),
    due: () => { const b = N.date || T, fri = nextDow(5, b); return [['', '마감 없음'], [A.add(b, 1), '다음 날'], [fri, fri === b ? '그날 금요일' : '금요일'], [A.add(b, 7), '일주일 뒤']].map(([v, l]) => ({ v, l, sub: v ? md(v) : '', on: (N.due || '') === v })); },
    cal: () => A.cals.map((c) => ({ v: c.id, l: c.name, dot: c.color, sub: c.def ? '기본' : '', on: N.cal === c.id })),
    st: () => ['todo', 'doing', 'done'].map((s) => ({ v: s, l: A.ST[s], pre: P.stIcon ? P.stIcon(s) : '', on: N.status === s })),
    tags: () => {
      const q = S.q.trim().replace(/^#+/, ''), L = allTags().filter((k) => !q || tn(k).includes(q) || k.includes(q)).map((k) => ({ v: k, l: '#' + tn(k), on: N.tags.includes(k) }));
      if (q && !allTags().some((k) => tn(k) === q || k === q)) L.push({ v: q, l: `#${q} 새로 만들기`, mk: true });
      return L;
    },
  };
  const optsHTML = (k) => { S.opts = OPT[k](); return S.opts.length ? S.opts.map((o, i) => `<button type="button" role="option" class="nw-o ${o.on ? 'on' : ''}" aria-selected="${!!o.on}" data-nwv="${k}|${i}">${o.dot ? `<i class="nw-dot" style="--cc:${o.dot}"></i>` : o.pre || ''}<span>${esc(o.l)}</span>${o.sub ? `<em>${esc(o.sub)}</em>` : ''}${o.on ? ic.check : ''}</button>`).join('') : '<p class="nw-none">맞는 태그가 없어요</p>'; };
  const custom = (k) => (k === 'date' || k === 'due' ? `<label class="nw-cu"><span>다른 날</span><input type="date" data-nwc="${k}" value="${N[k] || ''}" aria-label="${LBL[k]} 직접 고르기"></label>`
    : k === 'time' ? `<div class="nw-cu" role="group" aria-label="시간 직접 입력"><span>직접</span><input type="time" step="900" data-nwc="start" value="${N.start != null ? A.hm(N.start) : ''}" aria-label="시작 시각"><span>~</span><input type="time" step="900" data-nwc="end" value="${N.end != null ? A.hm(N.end) : ''}" aria-label="끝 시각"></div>` : '');
  const popHTML = (k) => `<div class="nw-pop" role="dialog" aria-label="${LBL[k]} 고르기">${k === 'tags' ? `<input class="nw-pin" data-nwq value="${esc(S.q)}" placeholder="태그 찾기, 없으면 새로 만들기" aria-label="태그 찾기" autocomplete="off">` : ''}<div class="nw-ol" role="listbox" aria-label="${LBL[k]}" ${k === 'tags' ? 'aria-multiselectable="true"' : ''}>${optsHTML(k)}</div>${custom(k)}</div>`;
  /* 값 단추 + 그 아래 찾기 메뉴. bare: 아이콘 없이 값만 (속성 줄에서 씀) */
  const trig = (k, bare) => {
    const v = VAL[k](), lead = k === 'cal' ? `<i class="nw-dot" style="--cc:${calOf(N.cal).color}"></i>` : k === 'st' && P.stIcon ? P.stIcon(N.status) : ic[k];
    return `<span class="nw-a"><button type="button" class="nw-t ${v ? '' : 'emp'}" data-nwp="${k}" aria-haspopup="dialog" aria-expanded="${S.pop === k}" aria-label="${LBL[k]}: ${esc(v || EMPTY[k])}">${bare && k !== 'cal' ? '' : lead}<span>${esc(v || EMPTY[k])}</span></button>${S.pop === k ? popHTML(k) : ''}</span>`;
  };

  /* 어디에 놓이는지 한 문장 + 겹치는 일정 */
  const clash = () => (N.start == null || !N.date ? [] : A.todos.filter((t) => t.date === N.date && t.start != null && t.status !== 'done' && t.start < N.end && t.end > N.start));
  const hint = () => {
    if (!N.date) return '';
    const d = rel(N.date) || md(N.date), c = clash();
    return (N.start == null ? `${d} 종일 할 일로 들어가요.` : `${d} ${kt(N.start)}부터 캘린더에 놓여요.`) + (c.length ? ` <b>겹치는 일정: ${esc(c[0].title)}${c.length > 1 ? ` 외 ${c.length - 1}개` : ''}</b>` : '');
  };
  const titleIn = (ph, cls = '') => `<input class="nw-title ${cls}" data-nwt value="${esc(NA === 4 ? S.raw : N.title)}" placeholder="${ph}" aria-label="${NA === 4 ? '할 일을 한 줄로' : '제목'}" autocomplete="off" spellcheck="false">`;
  const memo = (rows = 3) => `<textarea class="nw-memo" data-nwm rows="${rows}" placeholder="작업의 맥락이나 참고 링크를 적어 두세요" aria-label="메모">${esc(N.note)}</textarea>`;
  const head = () => `<div class="nw-h"><h2>새 할 일</h2><button type="button" class="ibtn" data-nwx aria-label="닫기">${ic.x}</button></div>`;
  const foot = (kb = 'Ctrl Enter') => `<div class="nw-f"><p class="nw-hint" data-nwr="hint" aria-live="polite"></p><span class="kbd">${kb}</span><button type="button" class="btn" data-nwx>취소</button><button type="submit" class="btn btn-p">추가</button></div>`;

  /* 1~5 화면 */
  const H0 = 7, H1 = 24, HH = 32, yy = (h) => (h - H0) * HH;
  const REG = {
    hint,
    /* 5: 그날 시간표 */
    tl: () => {
      const ev = N.date ? A.todos.filter((t) => t.date === N.date && t.start != null && t.status !== 'done' && t.end > H0) : [], cl = new Set(clash());
      const hrs = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
      const slots = Array.from({ length: (H1 - H0) * 2 }, (_, i) => H0 + i / 2);
      return hrs.map((h) => `<div class="nw5-hr" style="top:${yy(h)}px"><span>${A.hmc(h)}</span></div>`).join('')
        + slots.map((h) => `<button type="button" class="nw5-sl" data-nwslot="${h}" style="top:${yy(h)}px" aria-label="${kt(h)}에 놓기"></button>`).join('')
        + ev.map((t) => `<div class="nw5-b ${cl.has(t) ? 'cl' : ''}" style="top:${yy(Math.max(t.start, H0))}px;height:${Math.max((t.end - Math.max(t.start, H0)) * HH - 2, 14)}px"><span>${esc(t.title)}</span></div>`).join('')
        + (N.start != null ? `<div class="nw5-b mine ${cl.size ? 'half' : ''}" style="top:${yy(Math.max(N.start, H0))}px;height:${Math.max((N.end - Math.max(N.start, H0)) * HH - 2, 14)}px"><span>${esc(N.title || '새 할 일')}</span><small>${kt(N.start)}</small></div>` : '');
    },
    ad: () => {
      const l = N.date ? A.todos.filter((t) => t.date === N.date && t.start == null && t.status !== 'done') : [];
      return `<span class="nw5-adk">종일</span>${N.start == null ? `<span class="nw5-me">${esc(N.title || '새 할 일')}</span>` : ''}${l.slice(0, 2).map((t) => `<span>${esc(t.title)}</span>`).join('')}${l.length > 2 ? `<span>외 ${l.length - 2}개</span>` : ''}${!l.length && N.start != null ? '<span>없음</span>' : ''}`;
    },
    /* 4: 한 줄에서 읽은 값 */
    out: () => `<div class="nw4-c tt"><dt>제목</dt><dd>${N.title ? esc(N.title) : '<span class="nw-mu">날짜, 시간을 빼고 남은 글이 제목이 돼요</span>'}</dd></div>`
      + ['date', 'time', 'due', 'cal', 'tags'].map((k) => `<div class="nw4-c ${S.got.has(k) ? 'got' : ''}"><dt>${LBL[k]}${S.got.has(k) ? '<em>글에서 읽음</em>' : S.lock[k] ? '<em>직접 고름</em>' : ''}</dt><dd>${trig(k, true)}</dd></div>`).join(''),
  };
  const VIEW = {
    /* 1 세 묶음: 언제, 어디에, 메모 */
    1: () => `<form class="nw nw1" data-nwform novalidate>${head()}${titleIn('무엇을 할까요?')}
      <div class="nw1-g"><span class="nw1-k">언제</span><div class="nw1-v">${trig('date')}${trig('time')}${trig('due')}</div></div>
      <div class="nw1-g"><span class="nw1-k">어디에</span><div class="nw1-v">${trig('cal')}${trig('tags')}</div></div>
      <div class="nw1-g"><span class="nw1-k">메모</span><div class="nw1-v">${S.note || N.note ? memo() : '<button type="button" class="nw-lnk" data-nwa="note">메모 쓰기</button>'}</div></div>
      ${foot()}</form>`,
    /* 2 칩 한 줄: 제목 + 값 네 개, 나머지는 더 보기 */
    2: () => `<form class="nw nw2" data-nwform novalidate>${titleIn('할 일 이름을 쓰고 Enter')}
      <div class="nw2-chips">${trig('date')}${trig('time')}${trig('cal')}${trig('tags')}<button type="button" class="nw-lnk" data-nwa="more" aria-expanded="${S.more}">${S.more ? '접기' : '마감, 상태, 메모'}</button></div>
      ${S.more ? `<div class="nw2-chips nw2-more">${trig('due')}${trig('st')}</div>${memo(2)}` : ''}
      <div class="nw-f"><p class="nw-hint" data-nwr="hint" aria-live="polite"></p><span class="nw2-k"><span class="kbd">Enter</span> 추가</span><span class="nw2-k"><span class="kbd">Esc</span> 닫기</span><button type="submit" class="btn btn-p">추가</button></div></form>`,
    /* 3 할 일 창(26)과 같은 모양: 속성 다섯 줄, 상태는 더 보기 */
    3: () => { const rows = ['date', 'time', 'due', 'cal', 'tags', ...(S.more ? ['st'] : [])];
      return `<form class="nw nw3" data-nwform novalidate><div class="nw3-top"><p class="nw3-crumb"><i class="nw-dot" style="--cc:${calOf(N.cal).color}"></i><span>${esc(calOf(N.cal).name)}</span><span>${N.date ? md(N.date) : ''}</span><em>새 할 일</em></p><button type="button" class="ibtn" data-nwx aria-label="닫기">${ic.x}</button></div>
      ${titleIn('제목 없음', 'big')}
      <div class="nw3-p">${rows.map((k) => `<div class="nw3-r"><span class="nw3-k">${k === 'cal' ? `<i class="nw-dot" style="--cc:${calOf(N.cal).color}"></i>` : k === 'time' ? ic.time : ic[k]}${LBL[k] === '시간' ? '시간대' : LBL[k]}</span>${trig(k, true)}</div>`).join('')}
        <button type="button" class="nw3-more" data-nwa="more" aria-expanded="${S.more}">${S.more ? '상태 숨기기' : '상태 더 보기 (진행 전)'}</button></div>
      <textarea class="nw3-desc" data-nwm rows="4" placeholder="작업의 맥락이나 참고 링크를 적어 두세요" aria-label="상세 설명">${esc(N.note)}</textarea>
      ${foot()}</form>`; },
    /* 4 한 줄로 쓰기: 날짜, 시간, #태그, @캘린더를 읽어 칸에 나눔 */
    4: () => `<form class="nw nw4" data-nwform novalidate>${head()}${titleIn('예: 내일 오후 3시 디자인 리뷰 #업무 @팀', 'big')}
      <p class="nw4-help">날짜와 시간, <code>#태그</code>, <code>@캘린더</code>를 같이 쓰면 나눠서 넣어요. <code>금요일까지</code>는 마감일이 돼요.</p>
      <dl class="nw4-out" data-nwr="out"></dl>${foot()}</form>`,
    /* 5 그날 시간표와 같이: 왼쪽 세 묶음, 오른쪽 그날 시간표. 빈 칸을 누르면 그 시간 */
    5: () => `<form class="nw nw5" data-nwform novalidate>${head()}<div class="nw5-c"><div class="nw5-l">${titleIn('무엇을 할까요?')}
      <section class="nw5-s"><h3>언제</h3><div>${trig('date')}${trig('time')}${trig('due')}</div></section>
      <section class="nw5-s"><h3>어디에</h3><div>${trig('cal')}${trig('tags')}</div></section>
      <section class="nw5-s"><h3>메모</h3>${memo(3)}</section></div>
      <aside class="nw5-r" aria-label="그날 시간표"><p class="nw5-d">${N.date ? dayTxt(N.date) : '날짜 없음'}</p><p class="nw5-ad" data-nwr="ad"></p><div class="nw5-tl"><div class="nw5-in" data-nwr="tl" style="height:${(H1 - H0) * HH}px"></div></div><p class="nw5-x">빈 칸을 누르면 그 시간으로 정해져요.</p></aside></div>
      ${foot()}</form>`,
  };

  document.body.insertAdjacentHTML('beforeend', `<dialog id="nwdlg" class="na${NA}" aria-label="새 할 일"></dialog>`);
  const dlg = $('#nwdlg');
  const soft = () => dlg.querySelectorAll('[data-nwr]').forEach((el) => { el.innerHTML = REG[el.dataset.nwr](); });
  /* 메뉴만 닫기: 다시 그리지 않아서 누른 입력칸의 포커스가 그대로 남음 */
  const closePop = () => { if (!S.pop) return; S.pop = null; const p = $('.nw-pop', dlg); if (p) p.remove(); dlg.querySelectorAll('[data-nwp]').forEach((b) => b.setAttribute('aria-expanded', 'false')); };
  /* 화면 오른쪽을 넘으면 메뉴를 왼쪽으로 당김 */
  const placePop = () => { const p = $('.nw-pop', dlg); if (!p) return; const r = p.getBoundingClientRect(), over = r.right - (window.innerWidth - 8); if (over > 0) p.style.left = `${-Math.min(over, r.left - 8)}px`; };
  const focusPop = () => { const f = $('.nw-pop .nw-pin', dlg) || $('.nw-pop .nw-o.on', dlg) || $('.nw-pop .nw-o', dlg); if (f) f.focus(); };
  const draw = (f) => {
    const tl0 = $('.nw5-tl', dlg), st = tl0 ? tl0.scrollTop : null;
    dlg.innerHTML = VIEW[NA](); soft();
    const tl = $('.nw5-tl', dlg); if (tl) tl.scrollTop = st != null && !f?.startsWith('[data-nwp="time"') ? st : Math.max(yy((N.start ?? 9) - 1), 0);
    if (f) { const el = $(f, dlg); if (el) el.focus(); }
    if (S.pop) { placePop(); focusPop(); }
  };

  /* 4: 한 줄 읽기 (규칙만, AI 아님) */
  const W = '[일월화수목금토]';
  const DATE = `(오늘|내일|모레|글피|이번\\s?주말|다음\\s?주\\s?${W}요일|${W}요일|\\d{1,2}월\\s?\\d{1,2}일|\\d{1,2}\\/\\d{1,2})`;
  const TP = '(오전|오후|아침|저녁|밤)?\\s?(\\d{1,2})(?::(\\d{2})|시(?:\\s?(반|\\d{1,2}분))?)';
  const dateOf = (x) => {
    x = x.replace(/\s/g, ''); let m;
    const fix = { 오늘: 0, 내일: 1, 모레: 2, 글피: 3 }; if (x in fix) return A.add(T, fix[x]);
    if (x === '이번주말') return weekend();
    if ((m = x.match(/^다음주(.)요일$/))) return A.add(A.weekStart(T), 7 + A.DOW.indexOf(m[1]));
    if ((m = x.match(/^(.)요일$/))) return nextDow(A.DOW.indexOf(m[1]));
    if ((m = x.match(/^(\d{1,2})(?:월|\/)(\d{1,2})일?$/))) { const y = +T.slice(0, 4), s = (yr) => `${yr}-${pad(+m[1])}-${pad(+m[2])}`; return s(y) < T ? s(y + 1) : s(y); }
    return null;
  };
  const hOf = (ap, h, mm, x) => {
    h = +h; if (/오후|저녁|밤/.test(ap || '') && h < 12) h += 12; if (/오전|아침/.test(ap || '') && h === 12) h = 0; if (!ap && h >= 1 && h <= 6) h += 12;
    return Math.min(h + (mm ? +mm : x === '반' ? 30 : x ? parseInt(x, 10) : 0) / 60, 24);
  };
  const rd = (s) => {
    const r = {}; let rest = ` ${s} `;
    const take = (re, fn) => { const m = rest.match(re); if (m) { fn(m); rest = rest.replace(m[0], ' '); return true; } return false; };
    rest = rest.replace(/#([^\s#@]+)/g, (_, t) => { (r.tags = r.tags || []).push(tagKey(t)); return ' '; });
    take(/@(\S+)/, (m) => { const c = A.cals.find((c) => c.name.includes(m[1]) || c.id === m[1]); if (c) r.cal = c.id; });
    take(new RegExp(`${TP}\\s?(?:~|-|부터)\\s?${TP}(?:까지)?(?:에)?`), (m) => { r.start = hOf(m[1], m[2], m[3], m[4]); let e = hOf(m[5] || m[1], m[6], m[7], m[8]); if (e <= r.start && e + 12 <= 24) e += 12; r.end = e > r.start ? e : Math.min(r.start + 1, 24); })
      || take(new RegExp(`${TP}(?:에)?`), (m) => { r.start = hOf(m[1], m[2], m[3], m[4]); r.end = Math.min(r.start + 1, 24); });
    take(new RegExp(`${DATE}\\s?까지`), (m) => { r.due = dateOf(m[1]); });
    take(new RegExp(`${DATE}(?:에는|에)?`), (m) => { r.date = dateOf(m[1]); });
    r.title = rest.replace(/\s+/g, ' ').trim();
    return r;
  };
  const parse = () => {
    const r = rd(S.raw);
    S.got = new Set(['date', 'due', 'cal', 'tags'].filter((k) => r[k] && !S.lock[k]).concat(r.start != null && !S.lock.time ? ['time'] : []));
    N.title = r.title;
    if (!S.lock.date) N.date = r.date || B.date;
    if (!S.lock.time) { N.start = r.start ?? B.start; N.end = r.start != null ? r.end : B.end; }
    if (!S.lock.due) N.due = r.due || B.due;
    if (!S.lock.cal) N.cal = r.cal || B.cal;
    if (!S.lock.tags) N.tags = [...new Set([...B.tags, ...(r.tags || [])])];
  };

  const pick = (k, o) => {
    if (!o) return;
    if (k === 'tags') { const i = N.tags.indexOf(o.v); if (i < 0) N.tags.push(o.v); else N.tags.splice(i, 1); S.lock.tags = true; S.q = ''; draw(); return; }
    if (k === 'date') { N.date = o.v; if (N.due && N.due < N.date) N.due = ''; }
    if (k === 'time') { N.start = o.v; N.end = o.v == null ? null : Math.min(o.v + 1, 24); }
    if (k === 'due') N.due = o.v;
    if (k === 'cal') N.cal = o.v;
    if (k === 'st') N.status = o.v;
    S.lock[k] = true; S.got.delete(k); S.pop = null; draw(`[data-nwp="${k}"]`);
  };
  const submit = () => {
    const ti = $('[data-nwt]', dlg), title = (N.title || '').trim();
    if (!title) { ti.classList.remove('shake'); void ti.offsetWidth; ti.classList.add('shake'); ti.focus(); return; }
    const t = { ...N, title, tags: [...N.tags], id: 'n' + Date.now() };
    if (!t.due) delete t.due; if (!t.note) delete t.note;
    A.todos.push(t); dlg.close();
    A.toast(`${A.label(t.date)}에 추가했어요`); A.rerender();
  };

  P.openNew = (seed = {}) => {
    N = { title: '', status: 'todo', date: A.s.date || T, start: null, end: null, due: '', tags: P.chan && P.chan !== 'all' ? [P.chan] : [], note: '', cal: P.defCal ? P.defCal() : A.cals[0].id, ...seed };
    if (N.until) { N.due = N.until; delete N.until; }
    N.tags = [...N.tags]; B = { ...N, tags: [...N.tags] };
    Object.assign(S, { pop: null, q: '', note: false, more: false, lock: {}, got: new Set(), raw: '' });
    draw(); if (!dlg.open) dlg.showModal(); const i = $('[data-nwt]', dlg); i.focus();
  };

  dlg.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('[data-nwt]')) {
      if (NA === 4) { S.raw = el.value; parse(); } else N.title = el.value;
      closePop(); soft(); return;
    }
    if (el.matches('[data-nwq]')) { S.q = el.value; $('.nw-pop .nw-ol', dlg).innerHTML = optsHTML('tags'); return; }
    if (el.matches('[data-nwm]')) N.note = el.value;
  });
  dlg.addEventListener('change', (e) => {
    const el = e.target, c = el.dataset.nwc; if (!c) return;
    if (c === 'date' || c === 'due') { if (el.value) pick(c, { v: el.value }); return; }
    const v = tmv(el.value);
    if (c === 'start') { N.start = v; if (v == null) N.end = null; else if (N.end == null || N.end <= v) N.end = Math.min(v + 1, 24); }
    else if (N.start != null && v != null && v > N.start) N.end = v;
    S.lock.time = true; S.got.delete('time'); draw(`[data-nwc="${c}"]`);
  });
  dlg.addEventListener('click', (e) => {
    const t = e.target; let b;
    if (t === dlg || t.closest('[data-nwx]')) { dlg.close(); return; }
    if (S.pop && !t.closest('.nw-a')) closePop();
    if ((b = t.closest('[data-nwp]'))) { const k = b.dataset.nwp; S.pop = S.pop === k ? null : k; S.q = ''; draw(S.pop ? null : `[data-nwp="${k}"]`); return; }
    if ((b = t.closest('[data-nwv]'))) { const [k, i] = b.dataset.nwv.split('|'); pick(k, S.opts[+i]); if (k === 'tags') { const f = $(`.nw-pop [data-nwv="tags|${i}"]`, dlg); if (f) f.focus(); } return; }
    if ((b = t.closest('[data-nwa]'))) { const a = b.dataset.nwa; if (a === 'note') { S.note = true; draw('[data-nwm]'); } else { S.more = !S.more; draw(`[data-nwa="${a}"]`); } return; }
    if ((b = t.closest('[data-nwslot]'))) { const h = +b.dataset.nwslot, d = N.start != null ? N.end - N.start : 1; N.start = h; N.end = Math.min(h + d, 24); S.lock.time = true; draw(`[data-nwslot="${h}"]`); }
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); return; }
    if (S.pop && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.closest('.nw-pop')) {
      const L = [...dlg.querySelectorAll('.nw-pop .nw-o')]; if (!L.length) return; e.preventDefault();
      const i = L.indexOf(document.activeElement); L[e.key === 'ArrowDown' ? (i + 1) % L.length : i <= 0 ? L.length - 1 : i - 1].focus(); return;
    }
    if (e.key !== 'Enter' || e.isComposing) return;
    if (e.target.matches('[data-nwq]')) { e.preventDefault(); if (S.q.trim() && S.opts[0]) pick('tags', S.opts[0]); return; }
    if (e.target.matches('[data-nwt]')) { e.preventDefault(); submit(); return; }
    if (e.target.matches('.nw-cu input')) e.preventDefault();
  });
  dlg.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  dlg.addEventListener('cancel', (e) => { if (S.pop) { e.preventDefault(); const k = S.pop; S.pop = null; draw(`[data-nwp="${k}"]`); } });
  dlg.addEventListener('close', () => { N = null; S.pop = null; });
  autoOpen();
})();
