/* 할 일 상세 모달 16~20. d-calendar2.html 에서만 씀. ?tm=16..20&select=t4 (반복 할 일은 select=t5, Google 재연결 필요는 &reauth=1)
   들어가는 요소는 지금 서비스(my-app TaskDetailPanel)와 같음. 모양은 새로 짬.
   제목, 상태 3단계, 태그(최근 사용, 검색, 새로 만들기, 최대 10개, 20자), 상세 설명, 날짜(빠른 날짜 + 달력), 마감일(날짜 이후, 지우기),
   반복(프리셋 + 맞춤: 주기, 단위, 요일, 몇째 주, 종료일, 미리보기 / 반복 전환), 시간대(시작, 종료, 지우기),
   Google Calendar(추가, 빼기, 동기화 상태 5가지, 재연결), 삭제(Delete 키), 반복 할 일의 적용 범위(이 일정만, 이후 전체, 모두) */
(() => {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), TM = Q.get('tm') ? +Q.get('tm') : 26; /* 26 가운데 모달로 정함 */
  if (TM < 16 || TM > 30 || !P.tmH) return;
  const H = P.tmH, ic = H.ic, REAUTH = Q.get('reauth') === '1';
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ix = { back: I('<path d="m15 6-6 6 6 6"/>'), left: I('<path d="m15 6-6 6 6 6"/>'), sync: I('<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>'), minus: I('<path d="M5 12h14"/>'), link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>') };

  /* ---------- 날짜 도구 ---------- */
  const DOW = A.DOW, NTH = ['첫째', '둘째', '셋째', '넷째'];
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const md = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const mdw = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`; };
  const dim = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const nthOf = (d) => (d.getDate() + 7 > dim(d) ? -1 : Math.ceil(d.getDate() / 7));
  const weekend = () => { const d = A.s2d(A.TODAY); return A.add(A.TODAY, (6 - d.getDay() + 7) % 7 || 7); };
  const monOf = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

  /* ---------- 반복 규칙: 서버 RecurrenceRule 과 같은 칸 (unit, interval, weekdays, monthWeek, until) ---------- */
  const fmt = (r, dk) => { if (!r) return '반복 안 함'; const d = A.s2d(dk), n = r.interval || 1; let s;
    if (r.unit === 'day') s = n === 1 ? '매일' : `${n}일마다`;
    else if (r.unit === 'week') { const w = (r.weekdays && r.weekdays.length ? r.weekdays : [d.getDay()]).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      s = n === 1 && w.join() === '1,2,3,4,5' ? '주중 매일(월-금)' : `${n === 1 ? '매주' : `${n}주마다`} ${w.map((x) => DOW[x]).join(', ')}요일`; }
    else if (r.unit === 'month') { const k = r.monthWeek ?? nthOf(d); s = `${n === 1 ? '매월' : `${n}개월마다`} ${k === -1 ? '마지막' : NTH[k - 1]} ${DOW[d.getDay()]}요일`; }
    else s = `${n === 1 ? '매년' : `${n}년마다`} ${md(dk)}`;
    return r.until ? `${s}, ${md(r.until)}까지` : s; };
  const hit = (r, s0, day) => { const a = A.s2d(s0), n = r.interval || 1; if (day < a) return false; if (r.until && key(day) > r.until) return false;
    const diff = Math.round((day - a) / 864e5);
    if (r.unit === 'day') return diff % n === 0;
    if (r.unit === 'week') { const w = r.weekdays && r.weekdays.length ? r.weekdays : [a.getDay()]; return w.includes(day.getDay()) && Math.round((monOf(day) - monOf(a)) / 6048e5) % n === 0; }
    if (r.unit === 'month') { const k = r.monthWeek ?? nthOf(a), m = (day.getFullYear() - a.getFullYear()) * 12 + day.getMonth() - a.getMonth(); return m % n === 0 && day.getDay() === a.getDay() && (k === -1 ? nthOf(day) === -1 : Math.ceil(day.getDate() / 7) === k); }
    return day.getMonth() === a.getMonth() && day.getDate() === a.getDate() && (day.getFullYear() - a.getFullYear()) % n === 0; };
  const nextN = (r, s0, c = 4) => { const out = [], a = A.s2d(s0); for (let i = 0; i < 1500 && out.length < c; i++) { const d = new Date(a); d.setDate(a.getDate() + i); if (hit(r, s0, d)) out.push(key(d)); } return out; };
  const presets = (dk) => { const d = A.s2d(dk), b = { interval: 1, until: null }; return [{ ...b, unit: 'day' }, { ...b, unit: 'week', weekdays: null }, { ...b, unit: 'month', monthWeek: nthOf(d) }, { ...b, unit: 'year' }, { ...b, unit: 'week', weekdays: [1, 2, 3, 4, 5] }]; };
  const same = (a, b, dk) => !!a && !!b && fmt(a, dk) === fmt(b, dk);
  /* 예시 데이터의 반복 글자를 규칙으로 */
  const R0 = { 매일: { unit: 'day' }, 매주: { unit: 'week' }, 평일마다: { unit: 'week', weekdays: [1, 2, 3, 4, 5] }, 매월: { unit: 'month' } };
  A.todos.forEach((t) => { if (t.rep && !t.rule && R0[t.rep]) { t.rule = { interval: 1, until: null, weekdays: null, ...R0[t.rep] }; t.rep = fmt(t.rule, t.date || A.TODAY); } });
  const rec = (t) => !!t.rule;

  /* ---------- 상태 ---------- */
  const Z = { id: null, pop: null, cur: null, mode: 'date', ask: null, scope: 'this', page: null, cx: null, tq: '', ti: 0, sug: false, cpk: false, dr: {}, lv2: false, menu: null, cmd: null, opts: [], copts: [], peek: 'side', hideE: true, log: [], prevS: null };
  const reset = (t) => { Object.assign(Z, { id: t.id, pop: null, cur: (t.date || A.TODAY).slice(0, 7), mode: 'date', ask: null, scope: 'this', page: null, cx: null, tq: '', ti: 0, sug: false, cpk: false, dr: {}, lv2: false, menu: null, cmd: null, opts: [], copts: [], log: [], prevS: null }); };
  const sync = (t) => (t.push === 'failed' ? 'failed' : t.push || (t.gcal ? 'synced' : null));
  const SYNC = { pending: ['동기화 대기', ''], syncing: ['동기화 중', ''], synced: ['동기화 완료', 'ok'], failed: ['동기화 실패', 'bad'], pending_delete: ['삭제 대기', ''] };
  const tn = (k) => H.tagName(k);
  const allTags = () => [...new Set(A.todos.flatMap((x) => P.tags(x)))];
  const SCOPE = [['this', '이 일정만'], ['following', '이 일정 이후 전체'], ['all', '모든 반복 일정']];

  /* ---------- 조각: 모양은 변형마다 감싸는 쪽이 정함 ---------- */
  const titleIn = (t, cls = '') => `<input class="z-title ${cls}" data-tmzf="title" value="${A.esc(t.title)}" aria-label="제목" maxlength="200" autocomplete="off">`;
  /* 상세 설명: 문단(Enter)과 줄(Shift+Enter)의 간격을 나누려고 textarea 대신 문단을 쓰는 입력칸 */
  const noteHTML = (t) => t.noteHtml || (t.note ? t.note.split(/\n{2,}/).map((p) => `<p>${A.esc(p).replace(/\n/g, '<br>')}</p>`).join('') : '');
  const descIn = (t) => `<div class="z-desc" data-tmzf="desc" contenteditable="true" role="textbox" aria-multiline="true" aria-label="상세 설명" data-ph="작업의 맥락이나 참고 링크를 적어 두세요">${noteHTML(t)}</div>`;
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}

  /* 빈 본문에 바로 쓰면 첫 줄이 문단으로 감싸지지 않아 간격이 어긋나므로, 들어갈 때 빈 문단을 하나 둠 */
  const paraStart = (sel) => { document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest(sel); if (!el || el.textContent.trim() || el.querySelector('p')) return; el.innerHTML = '<p><br></p>'; const r = document.createRange(); r.setStart(el.firstChild, 0); r.collapse(true); const g = getSelection(); g.removeAllRanges(); g.addRange(r); });
    document.addEventListener('focusout', (e) => { const el = e.target.closest && e.target.closest(sel); if (el && !el.textContent.trim()) el.innerHTML = ''; }); };
  paraStart('#detail [data-tmzf="desc"]');
  document.addEventListener('focusout', (e) => { const el = e.target.closest && e.target.closest('#detail [data-tmzf="desc"]'); if (!el) return; const t = A.byId(A.s.sel); if (!t) return; const v = el.innerText.replace(/\n{3,}/g, '\n\n').trim(), h = v ? el.innerHTML : ''; if (v === (t.note || '').trim()) return; gate(t, 'field', () => { t.note = v; t.noteHtml = h; }, '이 변경사항을 적용할 범위'); });
  const stSeg = (t, cls = '') => `<span class="z-st ${cls}" role="radiogroup" aria-label="상태">${['todo', 'doing', 'done'].map((s) => `<button type="button" role="radio" aria-checked="${t.status === s}" data-tms="${s}">${P.stIcon(s)}<span>${A.ST[s]}</span></button>`).join('')}</span>`;
  const repBadge = (t) => (rec(t) ? `<span class="z-rb">${ic.rep}<span>반복, ${A.esc(fmt(t.rule, t.date))}</span></span>` : '');
  /* 달력: kind = date | due | until. 16번은 날짜와 마감을 한 달력에 */
  const cal = (t, kind, opt = {}) => {
    const val = kind === 'date' ? t.date : kind === 'due' ? t.due : (Z.cx && Z.cx.until), min = kind === 'date' ? null : t.date;
    const [y, m] = Z.cur.split('-').map(Number), first = new Date(y, m - 1, 1), lead = (first.getDay() + 6) % 7, n = new Date(y, m, 0).getDate(), cells = [];
    for (let i = 0; i < lead; i++) cells.push(''); for (let i = 1; i <= n; i++) cells.push(key(new Date(y, m - 1, i)));
    const quick = kind === 'date' ? [[A.TODAY, '오늘'], [A.add(A.TODAY, 1), '내일'], [weekend(), '이번 주말']] : kind === 'due' ? [['', '없음'], [A.add(t.date, 1), '다음 날'], [A.add(t.date, 7), '일주일 뒤']] : [['', '종료일 없음'], [A.add(t.date, 30), '한 달 뒤'], [A.add(t.date, 90), '석 달 뒤']];
    return `<div class="z-cal" data-kind="${kind}">${opt.noQuick ? '' : `<div class="z-q" role="group" aria-label="빠른 날짜">${quick.map(([v, l]) => `<button type="button" data-tmz="pick|${kind}|${v}" aria-pressed="${(val || '') === v}" ${min && v && v < min ? 'disabled' : ''}>${l}</button>`).join('')}</div>`}
      <div class="z-mh"><button type="button" class="z-ib" data-tmz="mon|-1" aria-label="이전 달">${ix.left}</button><b>${y}년 ${m}월</b><button type="button" class="z-ib" data-tmz="mon|1" aria-label="다음 달">${ic.chev}</button></div>
      <div class="z-g" role="grid" aria-label="${kind === 'date' ? '날짜' : kind === 'due' ? '마감일' : '종료일'} 고르기">${['월', '화', '수', '목', '금', '토', '일'].map((w) => `<span class="z-w">${w}</span>`).join('')}
        ${cells.map((c) => { if (!c) return '<span></span>'; const off = min && c < min, span = opt.span && t.due && c > t.date && c < t.due, isD = c === t.date, isU = c === t.due;
          return `<button type="button" data-tmz="pick|${kind}|${c}" class="${c === A.TODAY ? 'today' : ''} ${span ? 'span' : ''} ${opt.span && isD ? 'is-d' : ''} ${opt.span && isU ? 'is-u' : ''}" aria-pressed="${c === val}" ${off ? 'disabled' : ''} aria-label="${mdw(c)}${opt.span && isD ? ', 할 날' : ''}${opt.span && isU ? ', 마감일' : ''}">${+c.slice(8)}</button>`; }).join('')}</div></div>`; };
  const timeEd = (t) => `<div class="z-tm"><span class="z-tr"><label><span>시작</span><input type="time" step="1800" class="z-in" data-tmzf="start" value="${t.start != null ? A.hm(t.start) : ''}"></label><label><span>종료</span><input type="time" step="1800" class="z-in" data-tmzf="end" value="${t.end != null ? A.hm(t.end) : ''}"></label>
      ${t.start != null ? '<button type="button" class="z-lnk" data-tmz="notime">시간 지우기</button>' : ''}</span><small>비워 두면 일간 보기에서 만든 시각부터 1시간 블록으로 보여요</small></div>`;
  const repList = (t) => { const ps = presets(t.date), cur = t.rule; const custom = cur && !ps.some((p) => same(p, cur, t.date));
    return `<div class="z-rep"><p class="z-hint">${rec(t) ? '바꾸면 이 일정부터 이후 전체에 적용돼요. 이전 일정은 지금 규칙을 그대로 둬요.' : '이 할 일의 날짜를 첫 회차로 삼아 반복으로 바꿔요.'}</p>
      <div class="z-rl" role="radiogroup" aria-label="반복">${custom ? `<button type="button" role="radio" aria-checked="true" data-tmz="custom">${A.esc(fmt(cur, t.date))}<small>맞춤</small></button>` : ''}${ps.map((p, i) => `<button type="button" role="radio" aria-checked="${same(p, cur, t.date)}" data-tmz="preset|${i}">${A.esc(fmt(p, t.date))}</button>`).join('')}
      <button type="button" class="z-more" data-tmz="custom" aria-expanded="${!!Z.cx}">맞춤 반복 만들기</button></div></div>`; };
  const builder = (t, inline = false) => { const c = Z.cx; if (!c) return ''; const d = A.s2d(t.date), nx = nextN(c, t.date);
    return `<div class="z-cx ${inline ? 'inl' : ''}" role="group" aria-label="맞춤 반복">${inline ? '' : '<p class="z-cxh">맞춤 반복</p>'}
      <div class="z-cr"><span class="z-lb">주기</span><span class="z-step"><button type="button" class="z-ib" data-tmz="cxn|-1" aria-label="주기 줄이기" ${c.interval <= 1 ? 'disabled' : ''}>${ix.minus}</button><b aria-live="polite">${c.interval}</b><button type="button" class="z-ib" data-tmz="cxn|1" aria-label="주기 늘리기" ${c.interval >= 99 ? 'disabled' : ''}>${ic.plus}</button></span>
        <span class="z-seg" role="radiogroup" aria-label="단위">${[['day', '일'], ['week', '주'], ['month', '개월'], ['year', '년']].map(([u, l]) => `<button type="button" role="radio" aria-checked="${c.unit === u}" data-tmz="cxu|${u}">${l}</button>`).join('')}</span><span class="z-mu">마다</span></div>
      ${c.unit === 'week' ? `<div class="z-cr"><span class="z-lb">요일</span><span class="z-wd" role="group" aria-label="반복 요일">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<button type="button" data-tmz="cxw|${w}" aria-pressed="${(c.weekdays || [d.getDay()]).includes(w)}">${DOW[w]}</button>`).join('')}</span></div>` : ''}
      ${c.unit === 'month' ? `<div class="z-cr"><span class="z-lb">날</span><span class="z-seg" role="radiogroup" aria-label="몇째 주">${[...new Set([Math.ceil(d.getDate() / 7), nthOf(d)])].filter((k) => k <= 4 || k === -1).map((k) => `<button type="button" role="radio" aria-checked="${(c.monthWeek ?? nthOf(d)) === k}" data-tmz="cxm|${k}">${k === -1 ? '마지막' : NTH[k - 1]} ${DOW[d.getDay()]}요일</button>`).join('')}</span></div>` : ''}
      ${c.unit === 'year' ? `<p class="z-hint">시작일 기준 매년 ${md(t.date)}에 반복해요</p>` : ''}
      <div class="z-cr"><span class="z-lb">종료</span><span class="z-seg" role="radiogroup" aria-label="종료"><button type="button" role="radio" aria-checked="${!c.until}" data-tmz="cxe|none">종료일 없음</button><button type="button" role="radio" aria-checked="${!!c.until}" data-tmz="cxe|date">${c.until ? `${md(c.until)}까지` : '종료일 지정'}</button></span></div>
      ${Z.cpk ? cal(t, 'until') : ''}
      <div class="z-pv"><b>${A.esc(fmt(c, t.date))}</b><span>다음: ${nx.map(md).join(', ')}</span></div>
      <div class="z-cf"><button type="button" class="z-b" data-tmz="cxx">취소</button><button type="button" class="z-b p" data-tmz="cxok">${rec(t) ? '이 일정부터 적용' : '반복으로 바꾸기'}</button></div></div>`; };
  const tagEd = (t) => `<div class="z-tags"><span class="z-tw">${P.tags(t).map((k) => `<span class="z-tag">#${A.esc(tn(k))}<button type="button" data-tmz="tagx|${A.esc(k)}" aria-label="${A.esc(tn(k))} 태그 빼기">${ic.x}</button></span>`).join('')}
      ${P.tags(t).length < 10 ? `<input class="z-tin" data-tmzt placeholder="태그 추가" aria-label="태그 추가" maxlength="20" autocomplete="off" role="combobox" aria-expanded="${Z.sug}" aria-controls="ztsug" value="${A.esc(Z.tq)}">` : ''}</span>
      <div id="ztsug" class="z-sug" role="listbox" ${Z.sug ? '' : 'hidden'}>${Z.sug ? sugHTML(t) : ''}</div><small class="z-lim">${P.tags(t).length}/10, 태그 하나에 20자까지</small></div>`;
  const sugRows = (t) => { const q = Z.tq.trim().replace(/^#/, ''), has = new Set(P.tags(t)), pool = allTags().filter((k) => !has.has(k));
    if (!q) return { head: '최근 사용', rows: pool.slice(0, 5).map((k) => ['tag', k]) };
    const m = pool.filter((k) => tn(k).includes(q) || k.includes(q)).map((k) => ['tag', k]); const exact = allTags().some((k) => tn(k) === q || k === q);
    return { head: '검색 결과', rows: exact ? m : [...m, ['new', q]] }; };
  const sugHTML = (t) => { const { head, rows } = sugRows(t); if (!rows.length) return `<p class="z-sh">${head}</p><p class="z-se">일치하는 태그가 없어요</p>`;
    return `<p class="z-sh">${head}</p>${rows.map(([k, v], i) => `<button type="button" role="option" id="zo${i}" aria-selected="${i === Z.ti}" data-tmz="tagadd|${A.esc(v)}">${k === 'new' ? `'${A.esc(v)}' 새로 만들기` : `#${A.esc(tn(v))}`}</button>`).join('')}`; };
  const gEd = (t) => { if (REAUTH) return `<div class="z-gg bad"><span class="z-gs">${ic.warn}<span>캘린더를 다시 연결해 주세요</span></span><button type="button" class="z-b" data-tmz="reauth">다시 연결</button><button type="button" class="z-sw" role="switch" aria-checked="${!!t.gcal}" disabled aria-label="Google 캘린더 연동"><i></i></button></div>`;
    const s = sync(t); if (!t.gcal && !s) return `<div class="z-gg"><span class="z-gs"><span>Google 캘린더에 없어요</span></span><button type="button" class="z-b" data-tmz="gadd">${ix.link}Google 캘린더에 추가</button></div>`;
    const [l, k] = SYNC[s] || SYNC.synced; return `<div class="z-gg ${k}"><span class="z-gs">${k === 'bad' ? ic.warn : s === 'synced' ? ic.check : ix.sync}<span>${l}</span></span>${s === 'failed' ? '<button type="button" class="z-b" data-tmz="gre">다시 보내기</button>' : ''}${s === 'pending_delete' ? '' : '<button type="button" class="z-lnk" data-tmz="grm">캘린더에서 빼기</button>'}</div>`; };
  const delBtn = (txt = false) => `<button type="button" class="z-del" data-tmz="del" aria-label="삭제" aria-keyshortcuts="Delete">${ic.trash}${txt ? '<span>삭제</span>' : ''}</button>`;
  const closeBtn = () => '<button type="button" class="tm-ib" data-tmx="close" aria-label="닫기">' + ic.x + '</button>';
  const vDate = (t) => (P.multi(t) ? `${md(t.date)} ~ ${md(t.until)}` : mdw(t.date));
  const vDue = (t) => { if (!t.due) return ''; const n = Math.round((A.s2d(t.due) - A.s2d(A.TODAY)) / 864e5); return `${mdw(t.due)}<em class="${n < 0 ? 'late' : n <= 1 ? 'soon' : ''}">${n < 0 ? `${-n}일 지남` : n === 0 ? '오늘' : n === 1 ? '내일' : `${n}일 남음`}</em>`; };
  const vTime = (t) => (t.start != null ? `${H.kh(t.start)} ~ ${H.kh(t.end ?? t.start + 1)}` : '');
  const vG = (t) => (REAUTH ? '<em class="late">다시 연결 필요</em>' : sync(t) ? `<em class="${sync(t) === 'failed' ? 'late' : ''}">${SYNC[sync(t)][0]}</em>` : '');
  const vTags = (t) => P.tags(t).map((k) => '#' + A.esc(tn(k))).join(' ');
  const vCal = (t) => { const c = H.calOf(P.cal(t)); return `<i class="tm-dot" style="--cc:${c.color}"></i>${A.esc(c.name)}`; };
  const none = (l = '없음') => `<span class="z-none">${l}</span>`;
  /* 반복 할 일의 범위 묻기 (삭제, 시간, 제목·설명·태그) */
  const askLayer = (t) => { if (!Z.ask) return ''; const a = Z.ask;
    return `<div class="z-ask" role="alertdialog" aria-modal="true" aria-labelledby="zah"><div class="z-ab"><p id="zah">${a.title}</p>${a.note ? `<small>${a.note}</small>` : ''}
      ${rec(t) ? `<div class="z-ao">${SCOPE.map(([k, l]) => `<button type="button" class="z-b ${a.kind === 'del' ? 'danger' : ''}" data-tmz="scope|${k}">${l}</button>`).join('')}</div>` : `<div class="z-ao"><button type="button" class="z-b danger" data-tmz="scope|this">삭제</button></div>`}
      <button type="button" class="z-lnk" data-tmz="askx">취소</button></div></div>`; };

  /* ---------- 다섯 가지 ---------- */
  P.TDV = 'z' + TM;
  P.tdHTML = (t, f) => {
    if (Z.id !== t.id) reset(t);
    const bar = (extra = '') => `<header class="tm-bar">${f.calTag()}${repBadge(t)}<span class="sp"></span>${extra}${delBtn()}${closeBtn()}</header>`;
    /* 16 한 달력으로 날짜와 마감: 오른쪽 달력에서 할 날과 마감일을 같이 보고 고름 */
    if (TM === 16) return `<div class="tm z16">${bar()}${titleIn(t, 'big')}<div class="z16-c"><div class="z16-l">
        <div class="z-f"><p class="z-k">상태</p>${stSeg(t)}</div>
        <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 6)}</div>
        <div class="z-f"><p class="z-k">태그</p>${tagEd(t)}</div>
        <div class="z-f"><p class="z-k">캘린더</p>${f.cal()}</div>
        <div class="z-f"><p class="z-k">Google 캘린더</p>${gEd(t)}</div></div>
      <div class="z16-r"><div class="z16-m" role="radiogroup" aria-label="달력에서 고를 것"><button type="button" role="radio" aria-checked="${Z.mode === 'date'}" data-tmz="mode|date"><span class="z16-dot d"></span>날짜<b>${md(t.date)}</b></button><button type="button" role="radio" aria-checked="${Z.mode === 'due'}" data-tmz="mode|due"><span class="z16-dot u"></span>마감일<b>${t.due ? md(t.due) : '없음'}</b></button></div>
        ${cal(t, Z.mode, { span: true })}${t.due ? `<p class="z-hint">${md(t.date)}부터 ${md(t.due)}까지 ${Math.round((A.s2d(t.due) - A.s2d(t.date)) / 864e5)}일이에요</p>` : ''}
        <div class="z-f"><p class="z-k">시간대</p>${timeEd(t)}</div>
        <div class="z-f"><p class="z-k">반복</p><button type="button" class="z-val" data-tmz="pop|rep" aria-expanded="${Z.pop === 'rep'}">${ic.rep}<span>${rec(t) ? A.esc(fmt(t.rule, t.date)) : '반복으로 전환'}</span>${ic.down || ''}</button>${Z.pop === 'rep' ? (Z.cx ? builder(t) : repList(t)) : ''}</div></div></div>${askLayer(t)}</div>`;
    /* 17 속성 줄 + 바로 아래 펼침 카드 */
    if (TM === 17) { const rows = [['st', P.stIcon(t.status), '상태', A.ST[t.status], () => stSeg(t)], ['date', ic.cal, '날짜', vDate(t), () => cal(t, 'date')], ['due', ic.flag, '마감일', vDue(t), () => cal(t, 'due')],
        ['time', ic.clock, '시간대', vTime(t), () => timeEd(t)], ['rep', ic.rep, '반복', rec(t) ? A.esc(fmt(t.rule, t.date)) : '', () => (Z.cx ? builder(t) : repList(t))], ['cal', vCal(t).split('</i>')[0] + '</i>', '캘린더', A.esc(H.calOf(P.cal(t)).name), () => f.cal()],
        ['tags', ic.tag, '태그', vTags(t), () => tagEd(t)], ['g', ic.gc, 'Google', vG(t), () => gEd(t)]];
      return `<div class="tm z17">${bar()}${titleIn(t, 'big')}<div class="z17-p">${rows.map(([k, i, l, v, ed]) => `<div class="z17-r ${Z.pop === k ? 'on' : ''}"><span class="z17-k">${i}${l}</span><button type="button" class="z17-v" data-tmz="pop|${k}" aria-expanded="${Z.pop === k}">${v || none(k === 'time' ? '종일' : k === 'rep' ? '반복 안 함' : '없음')}</button>
          ${Z.pop === k ? `<div class="z17-pop" role="group" aria-label="${l}">${ed()}<div class="z17-pf">${k === 'due' && t.due ? '<button type="button" class="z-lnk" data-tmz="pick|due|">마감일 지우기</button>' : ''}<span class="sp"></span><button type="button" class="z-lnk" data-tmz="pop|${k}">닫기</button></div></div>` : ''}</div>`).join('')}</div>
        <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 5)}</div>${askLayer(t)}</div>`; }
    /* 18 고칠 범위를 먼저 정하기: 반복 할 일이면 맨 위에서 한 번 고르고, 그 뒤로는 묻지 않음 */
    if (TM === 18) { const sc = SCOPE.find((s) => s[0] === Z.scope);
      return `<div class="tm z18">${bar()}
        ${rec(t) ? `<div class="z18-s"><p><b>반복 할 일이에요. 고치면 어디까지 바꿀까요?</b><span>제목, 설명, 태그, 시간대에 적용해요. 삭제할 때만 한 번 더 물어요.</span></p><span class="z-seg" role="radiogroup" aria-label="고칠 범위">${SCOPE.map(([k, l]) => `<button type="button" role="radio" aria-checked="${Z.scope === k}" data-tmz="sc|${k}">${l}</button>`).join('')}</span></div>`
          : `<div class="z18-s off"><p><b>반복하지 않는 할 일이에요</b><span>반복으로 바꾸면 여기서 고칠 범위를 정해요.</span></p><button type="button" class="z-b" data-tmz="pop|rep" aria-expanded="${Z.pop === 'rep'}">${ic.rep}반복으로 전환</button></div>`}
        ${titleIn(t, 'big')}
        <section class="z18-g"><h3>할 일</h3><div class="z-f row"><p class="z-k">상태</p>${stSeg(t)}</div><div class="z-f row"><p class="z-k">태그</p>${tagEd(t)}</div><div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 3)}</div></section>
        <section class="z18-g"><h3>일정</h3>
          <div class="z18-2"><div class="z-f"><p class="z-k">날짜</p><button type="button" class="z-val" data-tmz="pop|date" aria-expanded="${Z.pop === 'date'}">${ic.cal}<span>${vDate(t)}</span></button></div><div class="z-f"><p class="z-k">마감일</p><span class="z-vr"><button type="button" class="z-val" data-tmz="pop|due" aria-expanded="${Z.pop === 'due'}">${ic.flag}<span>${t.due ? vDue(t) : '없음'}</span></button>${t.due ? '<button type="button" class="z-ib" data-tmz="pick|due|" aria-label="마감일 지우기">' + ic.x + '</button>' : ''}</span></div></div>
          ${Z.pop === 'date' || Z.pop === 'due' ? cal(t, Z.pop) : ''}
          <div class="z-f"><p class="z-k">시간대</p>${timeEd(t)}</div>
          <div class="z-f"><p class="z-k">반복</p>${rec(t) ? `<button type="button" class="z-val" data-tmz="pop|rep" aria-expanded="${Z.pop === 'rep'}">${ic.rep}<span>${A.esc(fmt(t.rule, t.date))}</span></button>` : none('반복 안 함')}${Z.pop === 'rep' ? (Z.cx ? builder(t) : repList(t)) : ''}</div></section>
        <section class="z18-g"><h3>연동</h3><div class="z-f row"><p class="z-k">캘린더</p>${f.cal()}</div><div class="z-f row"><p class="z-k">Google</p>${gEd(t)}</div></section>
        ${rec(t) ? `<p class="z18-n">지금 고치면: <b>${sc[1]}</b></p>` : ''}${askLayer(t)}</div>`; }
    /* 19 반복을 창 안에서 끝내기: 맞춤 반복이 늘 펼쳐져 있고 다음 날짜가 보임 */
    if (TM === 19) { if (!Z.cx) Z.cx = { interval: 1, until: null, weekdays: null, monthWeek: null, unit: 'week', ...(t.rule || {}) };
      const changed = !t.rule || !same(Z.cx, t.rule, t.date);
      return `<div class="tm z19">${bar()}${titleIn(t, 'big')}
        <div class="z19-q"><div class="z-f"><p class="z-k">상태</p>${stSeg(t)}</div>
          <div class="z19-4">${[['date', ic.cal, '날짜', vDate(t)], ['due', ic.flag, '마감일', t.due ? vDue(t) : none()], ['time', ic.clock, '시간대', vTime(t) || none('종일')]].map(([k, i, l, v]) => `<button type="button" class="z19-c" data-tmz="pop|${k}" aria-expanded="${Z.pop === k}"><span class="z-k">${i}${l}</span><span class="z19-v">${v}</span></button>`).join('')}</div>
          ${Z.pop === 'date' || Z.pop === 'due' ? `<div class="z19-pop">${cal(t, Z.pop)}</div>` : Z.pop === 'time' ? `<div class="z19-pop">${timeEd(t)}</div>` : ''}</div>
        <section class="z19-r"><div class="z19-rh"><h3>${ic.rep}반복</h3><span>${rec(t) ? `지금: ${A.esc(fmt(t.rule, t.date))}` : '반복하지 않아요'}</span></div>
          <div class="z19-ps" role="group" aria-label="자주 쓰는 반복">${presets(t.date).map((p, i) => `<button type="button" data-tmz="cxp|${i}" aria-pressed="${same(p, Z.cx, t.date)}">${A.esc(fmt(p, t.date))}</button>`).join('')}</div>
          ${builder(t, true).replace(/<div class="z-cf">[\s\S]*?<\/div><\/div>$/, '</div>')}
          <div class="z19-f"><p class="z-hint">${rec(t) ? '이 일정부터 이후 전체에 적용돼요. 이전 일정은 지금 규칙을 그대로 둬요.' : '이 할 일의 날짜가 첫 회차가 돼요.'}</p>${changed ? `<button type="button" class="z-b" data-tmz="cxreset">되돌리기</button><button type="button" class="z-b p" data-tmz="cxok">${rec(t) ? '이 일정부터 적용' : '반복으로 바꾸기'}</button>` : ''}</div></section>
        <div class="z19-b"><div class="z-f"><p class="z-k">태그</p>${tagEd(t)}</div><div class="z-f"><p class="z-k">캘린더</p>${f.cal()}</div></div>
        <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 3)}</div><div class="z-f"><p class="z-k">Google 캘린더</p>${gEd(t)}</div>${askLayer(t)}</div>`; }
    /* 21~25: 17 속성 줄에서 파생. 펼친 부분을 다르게 */
    if (TM >= 21 && TM <= 25) {
      const tt = TM === 24 ? { ...t, ...Z.dr } : t;
      const PR = (x) => [['st', P.stIcon(x.status), '상태', A.ST[x.status]], ['date', ic.cal, '날짜', vDate(x)], ['due', ic.flag, '마감일', vDue(x)], ['time', ic.clock, '시간대', vTime(x)],
        ['rep', ic.rep, '반복', x.rule ? A.esc(fmt(x.rule, x.date)) : ''], ['cal', vCal(x).split('</i>')[0] + '</i>', '캘린더', A.esc(H.calOf(x.cal || P.cal(t)).name)], ['tags', ic.tag, '태그', vTags(x)], ['g', ic.gc, 'Google', vG(x)]];
      const rows = PR(tt), lbl = (k) => rows.find((r) => r[0] === k)[2];
      const empty = (k) => none(k === 'time' ? '종일' : k === 'rep' ? '반복 안 함' : '없음');
      const HINT = { st: '누르면 바로 바뀌어요', date: '고르면 이 날로 옮기고 닫혀요', due: `할 날(${md(t.date)}) 이후만 고를 수 있어요`, time: '비워 두면 일간 보기에서 1시간 블록으로 보여요',
        rep: rec(t) ? '바꾸면 이 일정부터 이후 전체에 적용돼요' : '이 할 일의 날짜를 첫 회차로 반복을 만들어요', cal: '할 일의 색과 묶음이 바뀌어요', tags: '최근 사용을 누르거나 검색해서 붙여요. 10개까지', g: 'Google 캘린더와 맞춰 둘지 정해요' };
      const ED = (k) => ({ st: () => stSeg(t), date: () => cal(t, 'date'), due: () => cal(t, 'due'), time: () => timeEd(t), rep: () => (Z.cx ? builder(t) : repList(t)), cal: () => f.cal(), tags: () => tagEd(t), g: () => gEd(t) })[k]();
      const CLR = (k) => (k === 'due' && t.due ? '<button type="button" class="z-lnk" data-tmz="pick|due|">마감일 지우기</button>' : '');
      const head = `<header class="tm-bar">${f.calTag()}${repBadge(t)}<span class="sp"></span>${delBtn()}${closeBtn()}</header>${titleIn(t, 'big')}`;
      const rowBtn = (r, cls = 'z17-v') => `<button type="button" class="${cls}" data-tmz="pop|${r[0]}" aria-expanded="${Z.pop === r[0]}">${r[3] || empty(r[0])}</button>`;
      /* 21 줄이 그대로 커짐: 이름 칸에 설명, 값 칸이 고치는 칸으로 */
      if (TM === 21) return `<div class="tm z21">${head}<div class="z21-p">${rows.map((r) => Z.pop === r[0]
          ? `<div class="z21-r on"><div class="z21-k"><span class="z17-k">${r[1]}${r[2]}</span><small>${HINT[r[0]]}</small></div><div class="z21-e zp" role="group" aria-label="${r[2]} 고치기">${ED(r[0])}<div class="z21-f">${CLR(r[0])}<span class="sp"></span><button type="button" class="z-b" data-tmz="pop|${r[0]}">완료</button></div></div></div>`
          : `<div class="z21-r"><span class="z17-k">${r[1]}${r[2]}</span>${rowBtn(r)}</div>`).join('')}</div>
        <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 4)}</div>${askLayer(t)}</div>`;
      /* 22 옆에 붙는 칸: 왼쪽 목록은 그대로, 오른쪽에서 고침. 아무것도 안 열면 오른쪽은 설명 */
      if (TM === 22) return `<div class="tm z22">${head}<div class="z22-c"><ul class="z22-l" aria-label="속성">${rows.map((r) => `<li><button type="button" data-tmz="pop|${r[0]}" aria-expanded="${Z.pop === r[0]}" aria-controls="z22pn"><span class="z17-k">${r[1]}${r[2]}</span><span class="z22-v">${r[3] || empty(r[0])}</span>${ic.chev}</button></li>`).join('')}</ul>
        <div class="z22-r" id="z22pn">${Z.pop ? `<div class="zp z22-pn" role="group" aria-label="${lbl(Z.pop)} 고치기"><div class="z22-h"><h3>${lbl(Z.pop)}</h3><button type="button" class="z-ib" data-tmz="pop|${Z.pop}" aria-label="닫고 설명 보기">${ic.x}</button></div><p class="z-hint">${HINT[Z.pop]}</p>${ED(Z.pop)}${CLR(Z.pop) ? `<div class="z22-f">${CLR(Z.pop)}</div>` : ''}</div>`
          : `<div class="z-f z22-d"><p class="z-k">상세 설명</p>${descIn(t, 13)}<small class="z-lim">왼쪽에서 속성을 누르면 이 자리에서 고쳐요</small></div>`}</div></div>${askLayer(t)}</div>`;
      /* 23 빠른 선택 먼저, 자세히는 한 번 더 */
      if (TM === 23) { const today = A.TODAY, nm = A.add(today, ((8 - A.s2d(today).getDay()) % 7) || 7), fri = A.add(today, ((5 - A.s2d(today).getDay() + 7) % 7) || 7);
        const chip = (on, act, l) => `<button type="button" class="z23-c" data-tmz="${act}" aria-pressed="${on}">${l}</button>`;
        const QK = {
          date: () => [[today, '오늘'], [A.add(today, 1), '내일'], [A.add(today, 2), '모레'], [weekend(), '이번 주말'], [nm, '다음 주 월']].map(([v, l]) => chip(t.date === v, `pick|date|${v}`, l)).join(''),
          due: () => [['', '없음'], [A.add(t.date, 1), '다음 날'], [fri >= t.date ? fri : A.add(fri, 7), '금요일'], [A.add(t.date, 7), '일주일 뒤']].map(([v, l]) => chip((t.due || '') === v, `pick|due|${v}`, l)).join(''),
          time: () => [[null, '종일'], [9, '오전 9시'], [14, '오후 2시'], [16, '오후 4시'], [18, '오후 6시']].map(([v, l]) => chip(v == null ? t.start == null : t.start === v, `qt|${v ?? ''}`, l)).join(''),
          rep: () => presets(t.date).map((p, i) => chip(same(p, t.rule, t.date), `preset|${i}`, A.esc(fmt(p, t.date)))).join(''),
          tags: () => P.tags(t).map((k) => chip(true, `tagx|${A.esc(k)}`, `#${A.esc(tn(k))} ×`)).join('') + allTags().filter((k) => !P.tags(t).includes(k)).slice(0, 5).map((k) => chip(false, `tagadd|${A.esc(k)}`, `+ #${A.esc(tn(k))}`)).join('') };
        const MORE = { date: '달력에서 고르기', due: '달력에서 고르기', time: '시간 직접 입력', rep: '맞춤 반복 만들기', tags: '검색해서 추가' };
        return `<div class="tm z23">${head}<div class="z17-p">${rows.map((r) => `<div class="z17-r ${Z.pop === r[0] ? 'on' : ''}"><span class="z17-k">${r[1]}${r[2]}</span>${rowBtn(r)}
          ${Z.pop === r[0] ? `<div class="zp z23-pn" role="group" aria-label="${r[2]} 고치기">${QK[r[0]] && !Z.lv2 ? `<div class="z23-q">${QK[r[0]]()}</div>` : ED(r[0])}
            <div class="z23-f">${MORE[r[0]] ? `<button type="button" class="z23-m" data-tmz="lv2" aria-expanded="${Z.lv2}">${Z.lv2 ? '간단히' : MORE[r[0]]}${Z.lv2 ? '' : ic.chev}</button>` : `<span class="z-hint">${HINT[r[0]]}</span>`}<span class="sp"></span>${CLR(r[0])}<button type="button" class="z-lnk" data-tmz="pop|${r[0]}">닫기</button></div></div>` : ''}</div>`).join('')}</div>
          <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 4)}</div>${askLayer(t)}</div>`; }
      /* 24 바꿀 값을 먼저 보여 주고 적용: 지금 → 바뀔 값, 취소하면 그대로 */
      if (TM === 24) { const DRK = { st: ['status'], date: ['date'], due: ['due'], time: ['start', 'end'], rep: ['rule'], cal: ['cal'] };
        const dirty = (k) => DRK[k] && DRK[k].some((x) => x in Z.dr && JSON.stringify(Z.dr[x]) !== JSON.stringify(t[x] ?? null));
        const vOf = (x, k) => PR(x).find((r) => r[0] === k)[3] || empty(k);
        const ED24 = (k) => ({ st: () => `<span class="z-st" role="radiogroup" aria-label="상태">${['todo', 'doing', 'done'].map((s) => `<button type="button" role="radio" aria-checked="${tt.status === s}" data-tmz="dst|${s}">${P.stIcon(s)}<span>${A.ST[s]}</span></button>`).join('')}</span>`,
          date: () => cal(tt, 'date'), due: () => cal(tt, 'due'), time: () => timeEd(tt), rep: () => (Z.cx ? builder(t) : repList(tt)),
          cal: () => `<span class="tm-cals" role="radiogroup" aria-label="캘린더">${A.cals.map((c) => `<button type="button" role="radio" aria-checked="${(tt.cal || P.cal(t)) === c.id}" data-tmz="dcal|${c.id}" style="--cc:${c.color}"><i aria-hidden="true"></i>${A.esc(c.name)}</button>`).join('')}</span>`,
          tags: () => tagEd(t), g: () => gEd(t) })[k]();
        return `<div class="tm z24">${head}<div class="z17-p">${rows.map((r) => `<div class="z17-r ${Z.pop === r[0] ? 'on' : ''}"><span class="z17-k">${r[1]}${r[2]}</span><button type="button" class="z17-v" data-tmz="pop|${r[0]}" aria-expanded="${Z.pop === r[0]}">${Z.pop === r[0] ? vOf(t, r[0]) : r[3] || empty(r[0])}</button>
          ${Z.pop === r[0] ? `<div class="zp z24-pn" role="group" aria-label="${r[2]} 고치기">${DRK[r[0]] ? `<p class="z24-d ${dirty(r[0]) ? 'on' : ''}" aria-live="polite"><span>지금</span><b>${vOf(t, r[0])}</b>${dirty(r[0]) ? `${ic.next}<span>바뀔 값</span><b>${vOf(tt, r[0])}</b>` : '<span class="z-mu">고르면 여기서 먼저 보여요</span>'}</p>` : `<p class="z-hint">${r[0] === 'tags' ? '태그는 누르면 바로 붙고 빠져요' : '누르면 바로 바뀌어요'}</p>`}
            ${ED24(r[0])}<div class="z24-f">${CLR(r[0])}<span class="sp"></span>${DRK[r[0]] ? `<button type="button" class="z-b" data-tmz="dx">취소</button><button type="button" class="z-b p" data-tmz="apply" ${dirty(r[0]) ? '' : 'disabled'}>적용</button>` : `<button type="button" class="z-b" data-tmz="pop|${r[0]}">닫기</button>`}</div></div>` : ''}</div>`).join('')}</div>
          <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 4)}</div>${askLayer(t)}</div>`; }
      /* 25 아래에서 올라오는 판: 목록은 흐리게 남고, 고치는 판은 창 아래에 붙음 */
      return `<div class="tm z25 ${Z.pop ? 'has' : ''}">${head}<div class="z25-p">${rows.map((r) => `<div class="z25-r ${Z.pop === r[0] ? 'on' : ''}"><span class="z17-k">${r[1]}${r[2]}</span>${rowBtn(r)}</div>`).join('')}</div>
        <div class="z-f z25-d"><p class="z-k">상세 설명</p>${descIn(t, 4)}</div>
        ${Z.pop ? `<div class="zp z25-sh" role="group" aria-label="${lbl(Z.pop)} 고치기"><div class="z25-h"><div><h3>${lbl(Z.pop)}</h3><p class="z-hint">${HINT[Z.pop]}</p></div><button type="button" class="z-ib" data-tmz="pop|${Z.pop}" aria-label="닫기">${ic.x}</button></div>${ED(Z.pop)}<div class="z25-f">${CLR(Z.pop)}<span class="sp"></span><button type="button" class="z-b p" data-tmz="pop|${Z.pop}">완료</button></div></div>` : ''}${askLayer(t)}</div>`;
    }
    /* 26~30: Notion 페이지 속성, Linear 이슈, 백로그에서 정보 바꾸는 방식을 참고. 값을 누르면 그 자리에 찾기 메뉴 */
    if (TM >= 26) {
      const mk = (x, k, cls = '') => `<span class="zm-a">${propBtn(x, k, cls)}${Z.menu && Z.menu.k === k && Z.menu.id === x.id && TM !== 28 ? menuHTML(x, k) : ''}</span>`;
      /* 26 가운데 모달: 문서처럼 속성 목록, 빈 속성 숨김, 값 옆 찾기 메뉴 (정함) */
      if (TM === 26) { const shown = PM.filter((p) => p[0] === 'due' || valText(t, p[0]) || !Z.hideE || (Z.menu && Z.menu.k === p[0])), hid = PM.length - shown.length;
        return `<div class="tm z26"><div class="z26-doc"><div class="z26-top"><p class="z26-crumb">${vCal(t)}<span>${md(t.date)}</span>${repBadge(t)}</p><span class="sp"></span>${delBtn()}${closeBtn()}</div>${titleIn(t, 'big')}
          <div class="z26-p">${shown.map((p) => `<div class="z26-r"><span class="z26-k">${pIcon(t, p)}${p[2]}</span>${mk(t, p[0], 'z26-v')}</div>`).join('')}
            ${hid ? `<button type="button" class="z26-more" data-tmz="hideE" aria-expanded="false">빈 속성 ${hid}개 더 보기</button>` : Z.hideE ? '' : '<button type="button" class="z26-more" data-tmz="hideE" aria-expanded="true">빈 속성 숨기기</button>'}</div>
          <div class="z26-body">${descIn(t, 10)}</div></div>${askLayer(t)}</div>`; }
      /* 27 이슈형: 왼쪽 글과 활동, 오른쪽 속성 사이드바. 글자 키로 메뉴 */
      if (TM === 27) { const S = Object.fromEntries([...PM.map((p) => [p[0], valText(t, p[0])]), ['title', t.title]]);
        if (Z.prevS && Z.prevS.id === t.id) Object.keys(S).forEach((k) => { if (k !== 'id' && S[k] !== Z.prevS[k]) Z.log.unshift({ k, from: Z.prevS[k], to: S[k], at: new Date() }); });
        Z.prevS = { ...S, id: t.id };
        const lab = (k) => (k === 'title' ? '제목' : PM.find((p) => p[0] === k)[2]), hm = (d) => `${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `<div class="tm z27"><header class="tm-bar"><span class="z27-crumb">${vCal(t)}<span>${md(t.date)}</span></span>${repBadge(t)}<span class="sp"></span>${delBtn()}${closeBtn()}</header>
          <div class="z27-c"><div class="z27-m">${titleIn(t, 'big')}${descIn(t, 8)}
            <section class="z27-act"><h3>활동</h3>${Z.log.length ? `<ol>${Z.log.slice(0, 8).map((l) => `<li><span class="z27-dot"></span><p><b>${lab(l.k)}</b>을(를) <s>${A.esc(l.from || '없음')}</s>에서 <b>${A.esc(l.to || '없음')}</b>(으)로 바꿨어요</p><time>${hm(l.at)}</time></li>`).join('')}</ol>` : '<p class="z-hint">이 창에서 바꾼 것이 여기에 순서대로 남아요</p>'}</section></div>
            <aside class="z27-s" aria-label="속성">${PM.map((p) => `<div class="z27-r"><span class="z27-k">${p[2]}</span>${mk(t, p[0], 'z27-v')}</div>`).join('')}<p class="z27-h">글자 키로 바로 열어요: ${PM.slice(0, 6).map((p) => `<span><kbd>${p[3]}</kbd>${p[2]}</span>`).join(' ')}</p></aside></div>${askLayer(t)}</div>`; }
      /* 28 명령 메뉴: / 또는 Ctrl+K 로 무엇이든 찾아 바꿈 */
      if (TM === 28) return `<div class="tm z28">${bar()}${titleIn(t, 'big')}<p class="z28-sum">${PM.map((p) => `<button type="button" class="z28-c ${valText(t, p[0]) ? '' : 'emp'}" data-tmz="cmd|${p[0]}" title="${p[2]} 바꾸기 (${p[3]})">${pIcon(t, p)}<span>${valHTML(t, p[0]) || `${p[2]} 없음`}</span></button>`).join('')}</p>
          ${descIn(t, 8)}<button type="button" class="z28-k" data-tmz="cmd|">${ic.edit}<span>무엇이든 바꾸기</span><kbd>/</kbd><kbd>Ctrl K</kbd></button>
          ${Z.cmd ? `<div class="zc" role="dialog" aria-label="명령"><div class="zc-b">${Z.menu ? `<p class="zc-crumb"><button type="button" data-tmz="cmdb">${ix.left}명령</button><span>${PM.find((p) => p[0] === Z.menu.k)[2]}</span></p>${menuHTML(t, Z.menu.k, 'in')}`
            : `<input class="zm-in" data-tmzc value="${A.esc(Z.cmd.q)}" placeholder="바꿀 것을 찾아요. 예: 진행 중, 금요일, 매주" role="combobox" aria-expanded="true" aria-controls="zcl"><div class="zm-l" id="zcl" role="listbox">${cmdList(t)}</div><p class="zm-f">↑↓ 고르기, Enter 실행, Esc 닫기</p>`}</div></div>` : ''}${askLayer(t)}</div>`;
      /* 29 백로그 줄: 맨 위에 한 줄짜리 할 일, 아래 같은 날 할 일. J/K 로 옮겨 다님 */
      const day = A.onDay(t.date).slice().sort((a, b) => (a.start ?? 99) - (b.start ?? 99)), ix0 = day.findIndex((x) => x.id === t.id);
      if (TM === 29) return `<div class="tm z29"><header class="tm-bar"><span class="z29-n">${md(t.date)} 할 일 ${day.length}개 중 ${ix0 + 1}번째</span><button type="button" class="z-ib" data-tmz="jk|-1" aria-label="이전 할 일 (K)" ${ix0 > 0 ? '' : 'disabled'}>${ix.left}</button><button type="button" class="z-ib" data-tmz="jk|1" aria-label="다음 할 일 (J)" ${ix0 < day.length - 1 ? '' : 'disabled'}>${ic.chev}</button><span class="sp"></span>${delBtn()}${closeBtn()}</header>
          <div class="z29-top"><span class="zm-a">${propBtn(t, 'st', 'z29-st', true)}${Z.menu && Z.menu.k === 'st' && Z.menu.id === t.id ? menuHTML(t, 'st') : ''}</span>${titleIn(t, 'big')}</div>
          <div class="z29-pills">${PM.filter((p) => p[0] !== 'st').map((p) => mk(t, p[0], 'z29-pill')).join('')}</div>${descIn(t, 4)}
          <section class="z29-l"><h3>같은 날 할 일 <small>J, K 로 옮겨 가고, 동그라미를 누르면 상태만 바꿔요</small></h3>${day.map((x) => `<div class="z29-r ${x.id === t.id ? 'on' : ''}"><span class="zm-a">${propBtn(x, 'st', 'z29-sti', true)}${Z.menu && Z.menu.k === 'st' && Z.menu.id === x.id && x.id !== t.id ? menuHTML(x, 'st', 'up') : ''}</span>
            <button type="button" class="z29-t" data-tmz="sel|${x.id}" aria-current="${x.id === t.id}">${A.esc(x.title)}</button><span class="z29-m">${[vTime(x), x.due ? `마감 ${md(x.due)}` : '', vTags(x)].filter(Boolean).join(', ')}</span></div>`).join('')}</section>${askLayer(t)}</div>`;
      /* 30 표: 같은 날 할 일을 표로, 칸을 누르면 그 칸에서 고침 */
      const COLS = [['st', '상태'], ['time', '시간대'], ['due', '마감일'], ['rep', '반복'], ['tags', '태그']];
      return `<div class="tm z30">${bar()}<p class="z30-n">${md(t.date)}의 할 일. 칸을 누르면 그 할 일을 바로 고쳐요. 줄 제목을 누르면 아래에서 자세히 봐요.</p>
        <div class="z30-t" role="table" aria-label="${md(t.date)} 할 일"><div class="z30-h" role="row"><span role="columnheader">제목</span>${COLS.map((c) => `<span role="columnheader">${c[1]}</span>`).join('')}</div>
          ${day.map((x) => `<div class="z30-r ${x.id === t.id ? 'on' : ''}" role="row"><span role="cell" class="z30-tc"><button type="button" data-tmz="sel|${x.id}" aria-current="${x.id === t.id}">${A.esc(x.title)}</button></span>${COLS.map((c) => `<span role="cell" data-label="${c[1]}">${mk(x, c[0], 'z30-v')}</span>`).join('')}</div>`).join('')}</div>
        <section class="z30-d">${titleIn(t, 'big')}<div class="z30-d2"><div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 4)}</div><div class="z30-d3">${['date', 'cal', 'g'].map((k) => { const p = PM.find((q) => q[0] === k); return `<div class="z-f"><p class="z-k">${pIcon(t, p)}${p[2]}</p>${mk(t, k, 'z26-v')}</div>`; }).join('')}</div></div></section>${askLayer(t)}</div>`;
    }
    /* 20 하위 화면으로 넘기기: 좁은 창, 줄을 누르면 그 설정 화면으로 */
    const PG = { date: ['날짜', () => cal(t, 'date')], due: ['마감일', () => `${cal(t, 'due')}${t.due ? '<button type="button" class="z-lnk" data-tmz="pick|due|">마감일 지우기</button>' : ''}`], time: ['시간대', () => timeEd(t)], rep: ['반복', () => (Z.cx ? builder(t) : repList(t))], tags: ['태그', () => tagEd(t)], cal: ['캘린더', () => f.cal('col')], g: ['Google 캘린더', () => gEd(t)] };
    if (Z.page) { const [l, ed] = PG[Z.page]; return `<div class="tm z20 pg"><header class="tm-bar"><button type="button" class="z20-bk" data-tmz="page|" aria-label="뒤로">${ix.back}<span>${A.esc(t.title)}</span></button><span class="sp"></span>${closeBtn()}</header><h3 class="z20-h">${l}</h3>${ed()}${askLayer(t)}</div>`; }
    return `<div class="tm z20">${bar()}${titleIn(t, 'big')}${stSeg(t, 'full')}
      <ul class="z20-l">${[['date', ic.cal, '날짜', vDate(t)], ['due', ic.flag, '마감일', t.due ? vDue(t) : ''], ['time', ic.clock, '시간대', vTime(t)], ['rep', ic.rep, '반복', rec(t) ? A.esc(fmt(t.rule, t.date)) : ''], ['tags', ic.tag, '태그', vTags(t)], ['cal', vCal(t).split('</i>')[0] + '</i>', '캘린더', A.esc(H.calOf(P.cal(t)).name)], ['g', ic.gc, 'Google', vG(t)]]
        .map(([k, i, l, v]) => `<li><button type="button" data-tmz="page|${k}"><span class="z-k">${i}${l}</span><span class="z20-v">${v || none(k === 'time' ? '종일' : k === 'rep' ? '반복 안 함' : k === 'g' ? '연결 안 함' : '없음')}</span>${ic.chev}</button></li>`).join('')}</ul>
      <div class="z-f"><p class="z-k">상세 설명</p>${descIn(t, 4)}</div>${askLayer(t)}</div>`;
  };

  /* ---------- 동작 ---------- */
  const cur = () => A.byId(A.s.sel), dlg = () => $('#detail');
  const save = (msg) => { if (msg) A.toast(msg); A.rerender(); };
  const show = (sel) => { P.tmShow(); if (sel) dlg()?.querySelector(sel)?.focus(); };
  const SC_MSG = { this: '이 일정만 바꿨어요', following: '이 일정 이후 전체를 바꿨어요', all: '모든 반복 일정을 바꿨어요' };
  /* 반복 할 일이면 범위를 묻고(18번은 위에서 고른 범위로 바로), 아니면 바로 적용 */
  const gate = (t, kind, run, title) => { if (!rec(t)) { run(); return save(); } if (TM === 18) { run(); return save(SC_MSG[Z.scope]); } Z.ask = { kind, title, run }; show('.z-ask button'); };
  const setRule = (t, r) => { const was = rec(t); Z.menu = null; Z.cmd = null; t.rule = { ...r }; t.rep = fmt(t.rule, t.date); Z.cx = TM === 19 ? { ...t.rule } : null; Z.cpk = false; if (TM !== 19) Z.pop = null; save(was ? '이 일정부터 반복 규칙을 바꿨어요' : '반복 할 일로 바꿨어요'); };
  const addTag = (t, v) => { v = v.trim().replace(/^#/, '').slice(0, 20); if (!v) return; const k = Object.keys(A.TAG).find((x) => A.TAG[x] === v) || v; if (P.tags(t).includes(k) || P.tags(t).length >= 10) return;
    Z.tq = ''; Z.ti = 0; gate(t, 'field', () => { t.tags = [...P.tags(t), k]; }, '이 변경사항을 적용할 범위'); if (!Z.ask) dlg()?.querySelector('[data-tmzt]')?.focus(); };
  /* ---------- 26~30 공통: 속성 정보와 찾기 메뉴 ---------- */
  const PM = [['st', null, '상태', 'S'], ['date', ic.cal, '날짜', 'D'], ['due', ic.flag, '마감일', 'M'], ['time', ic.clock, '시간대', 'T'], ['rep', ic.rep, '반복', 'R'], ['tags', ic.tag, '태그', 'L'], ['cal', null, '캘린더', 'C'], ['g', ic.gc, 'Google 캘린더', 'G']];
  const pIcon = (x, p) => (p[0] === 'st' ? P.stIcon(x.status) : p[0] === 'cal' ? `<i class="tm-dot" style="--cc:${H.calOf(P.cal(x)).color}"></i>` : p[1]);
  const valText = (x, k) => ({ st: A.ST[x.status], date: x.date ? mdw(x.date) : '', due: x.due ? mdw(x.due) : '', time: vTime(x), rep: x.rule ? fmt(x.rule, x.date) : '', tags: P.tags(x).map(tn).map((s) => '#' + s).join(' '), cal: H.calOf(P.cal(x)).name, g: REAUTH ? '다시 연결 필요' : sync(x) ? SYNC[sync(x)][0] : '' })[k];
  const valHTML = (x, k) => (k === 'due' ? vDue(x) : k === 'g' ? vG(x) : A.esc(valText(x, k)));
  const propBtn = (x, k, cls = '', iconOnly = false) => { const p = PM.find((q) => q[0] === k), v = valHTML(x, k);
    return `<button type="button" class="zpb ${cls} ${v ? '' : 'emp'}" data-tmz="mopen|${k}|${x.id}" aria-haspopup="dialog" aria-expanded="${!!(Z.menu && Z.menu.k === k && Z.menu.id === x.id)}" aria-label="${A.esc(x.title)} ${p[2]}: ${A.esc(valText(x, k) || '비어 있음')}">${iconOnly ? pIcon(x, p) : `${cls.includes('z29-pill') || cls.includes('z27-v') || cls.includes('z30-v') ? pIcon(x, p) : ''}<span>${v || (cls.includes('z29-pill') ? p[2] : k === 'due' && cls.includes('z26-v') ? '마감일 정하기' : '비어 있음')}</span>`}</button>`; };
  const parseDay = (q) => { q = q.trim(); let m; const y = A.TODAY.slice(0, 4), td = A.s2d(A.TODAY);
    if ((m = q.match(/^(\d{1,2})\s*월\s*(\d{1,2})\s*일?$/))) return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    if ((m = q.match(/^(\d{1,2})\s*일?$/))) { const d = new Date(td.getFullYear(), td.getMonth(), +m[1]); if (d < td) d.setMonth(d.getMonth() + 1); return key(d); }
    if ((m = q.match(/^([일월화수목금토])(요일)?$/))) return A.add(A.TODAY, ((DOW.indexOf(m[1]) - td.getDay() + 7) % 7) || 7);
    return null; };
  const norm = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, '').toLowerCase();
  const closeM = (msg) => { Z.menu = null; Z.cmd = null; save(msg); };
  const opts = (x, k, q) => { const O = [], add = (txt, run, on = false, kbd = '', html = A.esc(txt), keep = false) => O.push({ txt, run, on, kbd, html, keep });
    const setDate = (v) => { const n = P.multi(x) ? (A.s2d(x.until) - A.s2d(x.date)) / 864e5 : 0; x.date = v; if (n) x.until = A.add(v, n); if (x.due && x.due < v) x.due = null; A.s.date = v; closeM(`${mdw(v)}로 옮겼어요`); };
    const dq = parseDay(q || '');
    if (k === 'st') ['todo', 'doing', 'done'].forEach((s, i) => add(A.ST[s], () => { x.status = s; closeM(); }, x.status === s, String(i + 1), `${P.stIcon(s)}${A.ST[s]}`));
    if (k === 'date') { if (dq) add(mdw(dq), () => setDate(dq), x.date === dq, '', `${mdw(dq)} <em>입력한 날</em>`, true);
      [[A.TODAY, '오늘'], [A.add(A.TODAY, 1), '내일'], [A.add(A.TODAY, 2), '모레'], [weekend(), '이번 주말'], [A.add(A.TODAY, ((8 - A.s2d(A.TODAY).getDay()) % 7) || 7), '다음 주 월요일']].forEach(([v, l]) => add(`${l} ${mdw(v)}`, () => setDate(v), x.date === v, '', `${l} <em>${mdw(v)}</em>`));
      add('달력에서 고르기', () => { Z.menu.cal = true; Z.cur = x.date.slice(0, 7); show('.zm .z-g button[aria-pressed="true"], .zm .z-g button'); }, false, '', `${ic.cal}달력에서 고르기`, true); }
    if (k === 'due') { const ok = (v) => !v || v >= x.date, setDue = (v) => { x.due = v || null; closeM(v ? `마감일을 ${mdw(v)}로 정했어요` : '마감일을 지웠어요'); };
      if (dq && ok(dq)) add(mdw(dq), () => setDue(dq), x.due === dq, '', `${mdw(dq)} <em>입력한 날</em>`, true);
      add('없음', () => setDue(null), !x.due, '', '없음 <em>마감일 지우기</em>');
      const fri = A.add(x.date, ((5 - A.s2d(x.date).getDay() + 7) % 7) || 7);
      [[A.add(x.date, 1), '다음 날'], [fri, '그 주 금요일'], [A.add(x.date, 7), '일주일 뒤']].forEach(([v, l]) => add(`${l} ${mdw(v)}`, () => setDue(v), x.due === v, '', `${l} <em>${mdw(v)}</em>`));
      add('달력에서 고르기', () => { Z.menu.cal = true; Z.cur = (x.due || x.date).slice(0, 7); show('.zm .z-g button:not(:disabled)'); }, false, '', `${ic.cal}달력에서 고르기`, true); }
    if (k === 'time') { const du = x.start != null && x.end != null ? x.end - x.start : 1, setT = (h) => { Z.menu = null; gate(x, 'time', () => { if (h == null) { x.start = x.end = null; } else { x.start = h; x.end = Math.min(24, h + du); } }, '반복 일정 시간 변경'); };
      add('종일', () => setT(null), x.start == null, '', '종일 <em>일간 보기에서 1시간 블록</em>');
      for (let h = 7; h <= 21.5; h += 0.5) add(H.kh(h), () => setT(h), x.start === h, '', `${H.kh(h)} <em>~ ${H.kh(Math.min(24, h + du))}</em>`); }
    if (k === 'rep') { presets(x.date).forEach((p) => add(fmt(p, x.date), () => { Z.menu = null; setRule(x, p); }, same(p, x.rule, x.date)));
      if (x.rule && !presets(x.date).some((p) => same(p, x.rule, x.date))) add(fmt(x.rule, x.date), () => closeM(), true, '', `${A.esc(fmt(x.rule, x.date))} <em>맞춤</em>`);
      if (x.id === A.s.sel) add('맞춤 반복 만들기', () => { Z.menu.cx = true; Z.cx = { interval: 1, until: null, weekdays: null, monthWeek: null, unit: 'week', ...(x.rule || {}) }; show('.zm [data-tmz^="cxu"][aria-checked="true"]'); }, false, '', `${ic.plus}맞춤 반복 만들기`, true); }
    if (k === 'cal') A.cals.forEach((c) => add(c.name, () => { x.cal = c.id; closeM(`${c.name} 캘린더로 옮겼어요`); }, P.cal(x) === c.id, '', `<i class="tm-dot" style="--cc:${c.color}"></i>${A.esc(c.name)}`));
    if (k === 'tags') { const has = new Set(P.tags(x)), qq = (q || '').trim().replace(/^#/, '');
      allTags().forEach((tg) => add('#' + tn(tg), () => { if (!has.has(tg) && has.size >= 10) return A.toast('태그는 10개까지예요'); gate(x, 'field', () => { x.tags = has.has(tg) ? P.tags(x).filter((y) => y !== tg) : [...P.tags(x), tg]; }, '이 변경사항을 적용할 범위'); }, has.has(tg)));
      if (qq && !allTags().some((tg) => tn(tg) === qq || tg === qq)) add(qq, () => { if (has.size >= 10) return A.toast('태그는 10개까지예요'); const v = qq.slice(0, 20); Z.menu.q = ''; gate(x, 'field', () => { x.tags = [...P.tags(x), v]; }, '이 변경사항을 적용할 범위'); }, false, '', `${ic.plus}'${A.esc(qq.slice(0, 20))}' 새로 만들기`, true); }
    if (k === 'g') { if (REAUTH) add('설정에서 다시 연결', () => { if (window.UM && UM.openSettings) UM.openSettings('link'); }, false, '', `${ic.warn}설정에서 다시 연결`);
      else { const s = sync(x); if (!x.gcal && !s) add('Google 캘린더에 추가', () => { x.gcal = true; x.push = 'syncing'; closeM('Google 캘린더로 보내는 중이에요'); setTimeout(() => { x.push = 'synced'; A.rerender(); }, 1200); });
        if (s === 'failed') add('다시 보내기', () => { x.push = 'syncing'; closeM('다시 보내는 중이에요'); setTimeout(() => { x.push = 'synced'; A.rerender(); }, 1200); });
        if (x.gcal || s) add('캘린더에서 빼기', () => { x.push = 'pending_delete'; closeM('캘린더에서 빼는 중이에요'); setTimeout(() => { x.gcal = false; x.push = null; A.rerender(); }, 1200); }); } }
    const nq = norm(q || ''); return nq ? O.filter((o) => o.keep || norm(o.txt).includes(nq)) : O; };
  const listHTML = (O, idp = 'zmo') => (O.length ? O.map((o, i) => `<button type="button" role="option" id="${idp}${i}" aria-selected="${i === (Z.menu || Z.cmd).i}" data-tmz="${idp === 'zmo' ? 'mo' : 'co'}|${i}" class="${o.on ? 'on' : ''}"><span>${o.html}</span>${o.on ? ic.check : ''}${o.kbd ? `<kbd>${o.kbd}</kbd>` : ''}</button>`).join('') : '<p class="zm-e">맞는 항목이 없어요</p>');
  const menuHTML = (x, k, cls = '') => { const m = Z.menu, p = PM.find((q) => q[0] === k);
    if (m.cx && !Z.cx) m.cx = false;
    if (m.cx) return `<div class="zm ${cls} wide" role="dialog" aria-label="맞춤 반복">${builder(x)}</div>`;
    if (m.cal) return `<div class="zm ${cls} wide" role="dialog" aria-label="${p[2]} 달력"><button type="button" class="zm-back" data-tmz="mcal">${ix.left}목록으로</button>${cal(x, k, { noQuick: true })}</div>`;
    Z.opts = opts(x, k, m.q);
    return `<div class="zm ${cls}" role="dialog" aria-label="${p[2]} 바꾸기"><input class="zm-in" data-tmzq value="${A.esc(m.q)}" placeholder="${{ date: '찾거나 입력: 금, 11월 9일', due: '찾거나 입력: 금, 11월 9일', tags: '태그 찾기 또는 새로 만들기', time: '찾기: 오후 3시' }[k] || `${p[2]} 찾기`}" role="combobox" aria-expanded="true" aria-controls="zml" aria-activedescendant="zmo${m.i}" autocomplete="off"><div class="zm-l" id="zml" role="listbox" aria-label="${p[2]}">${listHTML(Z.opts)}</div><p class="zm-f">↑↓ 고르기, Enter 바꾸기, Esc 닫기</p></div>`; };
  /* 28: 명령 목록. 찾는 말이 있으면 값까지 바로 보여 줌 */
  const cmdOpts = (t) => { const q = Z.cmd.q, O = PM.map((p) => ({ txt: `${p[2]} 바꾸기`, html: `${pIcon(t, p)}${p[2]} 바꾸기 <em>${A.esc(valText(t, p[0]) || '비어 있음')}</em>`, kbd: p[3], run: () => openM(t, p[0]) }));
    O.push({ txt: '삭제', html: `${ic.trash}삭제`, kbd: 'Del', run: () => { Z.cmd = null; dlg()?.querySelector('[data-tmz="del"]')?.click(); } });
    if (!q.trim()) return O; const nq = norm(q), out = O.filter((o) => norm(o.txt).includes(nq));
    ['st', 'date', 'due', 'rep', 'cal', 'tags'].forEach((k) => opts(t, k, q).filter((o) => !o.txt.startsWith('달력') && !o.txt.startsWith('맞춤')).slice(0, 3).forEach((o) => { if (norm(o.txt).includes(nq) || (o.keep && k !== 'tags')) out.push({ ...o, txt: o.txt, html: `<span class="zc-pre">${PM.find((p) => p[0] === k)[2]}</span>${o.html}` }); }));
    return out.sort((a, b) => (a.on ? 1 : 0) - (b.on ? 1 : 0)); };
  const cmdList = (t) => { Z.copts = cmdOpts(t); return listHTML(Z.copts, 'zco'); };
  const openM = (x, k) => { const O = opts(x, k, ''); Z.menu = { k, id: x.id, q: '', i: Math.max(0, O.findIndex((o) => o.on)), cal: false, cx: false }; Z.cx = null; Z.cpk = false; show('[data-tmzq]'); dlg()?.querySelector('.zm-l [aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); };
  const paintM = () => { const d = dlg(), t = Z.menu && A.byId(Z.menu.id); if (!d || !t) return; const l = d.querySelector('#zml'), i = d.querySelector('[data-tmzq]'); if (!l) return; Z.opts = opts(t, Z.menu.k, Z.menu.q); Z.menu.i = Math.min(Z.menu.i, Math.max(0, Z.opts.length - 1)); l.innerHTML = listHTML(Z.opts); i?.setAttribute('aria-activedescendant', `zmo${Z.menu.i}`); l.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); };
  const paintC = () => { const d = dlg(), t = cur(), l = d && d.querySelector('#zcl'); if (!l || !t) return; l.innerHTML = cmdList(t); Z.cmd.i = Math.min(Z.cmd.i, Math.max(0, Z.copts.length - 1)); l.innerHTML = listHTML(Z.copts, 'zco'); l.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); };
  document.addEventListener('click', (e) => {
    const d = dlg(); if (!d || !d.contains(e.target) || TM < 26) return; const t = cur(); if (!t) return;
    const el = e.target.closest('[data-tmz]'), [a, v, w] = el ? el.dataset.tmz.split('|') : [];
    if (Z.menu && !Z.ask && !e.target.closest('.zm, .zc') && a !== 'mopen' && TM !== 28) { Z.menu = null; if (!el) return show(); }
    if (!el) { if (Z.cmd && !e.target.closest('.zc-b') && !Z.ask) { Z.cmd = null; Z.menu = null; show('[data-tmz="cmd|"]'); } return; }
    if (a === 'mopen') { e.stopImmediatePropagation(); if (Z.menu && Z.menu.k === v && Z.menu.id === w) { Z.menu = null; return show(`[data-tmz="mopen|${v}|${w}"]`); } return openM(A.byId(w), v); }
    if (a === 'mo') { e.stopImmediatePropagation(); const o = Z.opts[+v]; if (o) { Z.menu.i = +v; o.run(); } return; }
    if (a === 'co') { e.stopImmediatePropagation(); const o = Z.copts[+v]; if (o) o.run(); return; }
    if (a === 'mcal') { e.stopImmediatePropagation(); Z.menu.cal = false; return show('[data-tmzq]'); }
    if (a === 'hideE') { e.stopImmediatePropagation(); Z.hideE = !Z.hideE; return show('[data-tmz="hideE"]'); }
    if (a === 'cmd') { e.stopImmediatePropagation(); Z.cmd = { q: '', i: 0 }; Z.menu = null; if (v) return openM(t, v); return show('[data-tmzc]'); }
    if (a === 'cmdb') { e.stopImmediatePropagation(); Z.menu = null; return show('[data-tmzc]'); }
    if (a === 'sel' || a === 'jk') { e.stopImmediatePropagation(); const day = A.onDay(t.date).slice().sort((x, y) => (x.start ?? 99) - (y.start ?? 99)), i = day.findIndex((x) => x.id === t.id);
      const nx = a === 'sel' ? A.byId(v) : day[Math.max(0, Math.min(day.length - 1, i + +v))]; if (!nx || nx.id === t.id) return; A.s.sel = nx.id; A.rerender(); dlg()?.querySelector(a === 'jk' ? `[data-tmz="jk|${v}"]` : `[data-tmz="sel|${nx.id}"]`)?.focus(); }
  }, true);
  document.addEventListener('input', (e) => { if (!e.target.matches) return;
    if (e.target.matches('#detail [data-tmzq]')) { Z.menu.q = e.target.value; Z.menu.i = 0; paintM(); }
    if (e.target.matches('#detail [data-tmzc]')) { Z.cmd.q = e.target.value; Z.cmd.i = 0; paintC(); } });
  document.addEventListener('keydown', (e) => {
    const d = dlg(); if (!d || !d.open || !d.contains(e.target) || TM < 26 || Z.ask) return; const t = cur(); if (!t) return;
    const inM = e.target.matches('[data-tmzq]'), inC = e.target.matches('[data-tmzc]');
    if (inM || inC) { const st = inM ? Z.menu : Z.cmd, list = inM ? Z.opts : Z.copts;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); st.i = Math.max(0, Math.min(list.length - 1, st.i + (e.key === 'ArrowDown' ? 1 : -1))); return inM ? paintM() : paintC(); }
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopImmediatePropagation(); const o = list[st.i]; if (o) o.run(); return; }
      if (inM && /^[1-3]$/.test(e.key) && !Z.menu.q && Z.menu.k === 'st') { e.preventDefault(); return list[+e.key - 1]?.run(); }
      if (inM && e.key === 'Backspace' && !e.target.value && TM === 28) { e.preventDefault(); Z.menu = null; return show('[data-tmzc]'); }
      return; }
    if (e.target.matches('input, textarea')) return;
    if (TM === 28 && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); Z.cmd = { q: '', i: 0 }; Z.menu = null; return show('[data-tmzc]'); }
    if ((TM === 29 || TM === 30) && /^[jk]$/i.test(e.key) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); const jb = d.querySelector(`[data-tmz="jk|${e.key.toLowerCase() === 'j' ? 1 : -1}"]`); if (jb) { if (!jb.disabled) jb.click(); return; } return (() => { const day = A.onDay(t.date).slice().sort((x, y) => (x.start ?? 99) - (y.start ?? 99)), i = day.findIndex((x) => x.id === t.id), nx = day[i + (e.key.toLowerCase() === 'j' ? 1 : -1)]; if (nx) { A.s.sel = nx.id; A.rerender(); } })(); }
    const p = PM.find((q) => q[3] === e.key.toUpperCase()); if (p && !e.metaKey && !e.ctrlKey && !e.altKey && (TM === 27 || TM === 28 || TM === 29)) { e.preventDefault(); if (TM === 28) Z.cmd = { q: '', i: 0 }; return openM(t, p[0]); }
  }, true);
  document.addEventListener('cancel', (e) => { if (e.target.id !== 'detail' || TM < 26 || Z.ask) return;
    if (Z.menu) { e.preventDefault(); e.stopImmediatePropagation(); const m = Z.menu; if (m.cal || m.cx) { m.cal = false; m.cx = false; Z.cx = null; return show('[data-tmzq]'); } Z.menu = null; if (TM === 28 && Z.cmd) return show('[data-tmzc]'); return show(`[data-tmz="mopen|${m.k}|${m.id}"]`); }
    if (Z.cmd) { e.preventDefault(); e.stopImmediatePropagation(); Z.cmd = null; return show('[data-tmz="cmd|"]'); } }, true);
  document.addEventListener('click', (e) => {
    const d = dlg(); if (!d || !d.contains(e.target)) return; const t = (Z.menu && A.byId(Z.menu.id)) || cur(); if (!t) return;
    if (Z.sug && !e.target.closest('.z-tags')) { Z.sug = false; const s = d.querySelector('.z-sug'); if (s) { s.hidden = true; s.innerHTML = ''; } }
    const el = e.target.closest('[data-tmz]'); if (!el) return; const [a, v, w] = el.dataset.tmz.split('|');
    if (a === 'lv2') { Z.lv2 = !Z.lv2; if (Z.lv2 && Z.pop === 'rep') Z.cx = { interval: 1, until: null, weekdays: null, monthWeek: null, unit: 'week', ...(t.rule || {}) }; if (!Z.lv2) Z.cx = null; return show('[data-tmz="lv2"]'); }
    if (a === 'qt') return gate(t, 'time', () => { if (v === '') { t.start = t.end = null; } else { const du = t.start != null && t.end != null ? t.end - t.start : 1; t.start = +v; t.end = Math.min(24, +v + du); } }, '반복 일정 시간 변경');
    if (TM === 24 && Z.pop) {
      if (a === 'pick' && (v === 'date' || v === 'due')) { if (v === 'due' && w && w < (Z.dr.date || t.date)) return; Z.dr[v] = w || null; return show(`[data-tmz="pick|${v}|${w}"]`); }
      if (a === 'dst') { Z.dr.status = v; return show(`[data-tmz="dst|${v}"]`); }
      if (a === 'dcal') { Z.dr.cal = v; return show(`[data-tmz="dcal|${v}"]`); }
      if (a === 'preset') { Z.dr.rule = { ...presets(t.date)[+v] }; return show(`[data-tmz="preset|${v}"]`); }
      if (a === 'notime') { Z.dr.start = null; Z.dr.end = null; return show('[data-tmz="apply"]'); }
      if (a === 'dx') { const k = Z.pop; Z.dr = {}; Z.pop = null; return show(`[data-tmz="pop|${k}"]`); }
      if (a === 'apply') { const dr = Z.dr, k = Z.pop; Z.dr = {}; Z.pop = null;
        if ('rule' in dr) return setRule(t, dr.rule);
        const run = () => { Object.assign(t, dr); if (dr.date) { A.s.date = dr.date; if (t.due && t.due < dr.date) t.due = null; } };
        if ('start' in dr) return gate(t, 'time', run, '반복 일정 시간 변경'); run(); save('바꿨어요'); return dlg()?.querySelector(`[data-tmz="pop|${k}"]`)?.focus(); }
    }
    if (a === 'pop') { Z.dr = {}; Z.lv2 = false; Z.pop = Z.pop === v ? null : v; if (TM >= 21) { Z.cx = null; Z.cpk = false; if (Z.pop === 'date' || Z.pop === 'due') Z.cur = ((v === 'due' ? t.due : t.date) || t.date).slice(0, 7); return show(Z.pop ? '.zp button:not([disabled]), .zp input' : `[data-tmz="pop|${v}"]`); } Z.cx = TM === 19 ? Z.cx : null; Z.cpk = false; if (Z.pop === 'date' || Z.pop === 'due') Z.cur = ((v === 'due' ? t.due : t.date) || t.date).slice(0, 7); return show(Z.pop ? `[data-tmz="pop|${v}"]` : null); }
    if (a === 'page') { const prev = Z.page; Z.page = v || null; Z.cx = null; Z.cpk = false; if (v === 'date' || v === 'due') Z.cur = ((v === 'due' ? t.due : t.date) || t.date).slice(0, 7); return show(v ? '.z20-bk' : `[data-tmz="page|${prev}"]`); }
    if (a === 'mode') { Z.mode = v; Z.cur = ((v === 'due' ? t.due : t.date) || t.date).slice(0, 7); return show(`[data-tmz="mode|${v}"]`); }
    if (a === 'mon') { const [y, m] = Z.cur.split('-').map(Number), n = new Date(y, m - 1 + +v, 1); Z.cur = key(n).slice(0, 7); return show(`[data-tmz="mon|${v}"]`); }
    if (a === 'pick' && TM >= 26 && v !== 'until') { Z.menu = null; Z.cmd = null; }
    if (a === 'pick') {
      if (v === 'until') { Z.cx.until = w || null; Z.cpk = false; return show('[data-tmz="cxe|date"], [data-tmz="cxe|none"]'); }
      if (v === 'due') { if (w && w < t.date) return; t.due = w || null; if (TM >= 17 && TM !== 20) Z.pop = null; if (TM === 20) Z.page = null; return save(w ? `마감일을 ${mdw(w)}로 정했어요` : '마감일을 지웠어요'); }
      const n = P.multi(t) ? (A.s2d(t.until) - A.s2d(t.date)) / 864e5 : 0; t.date = w; if (n) t.until = A.add(w, n); if (t.due && t.due < w) t.due = null; A.s.date = w; if (TM !== 16) Z.pop = null; if (TM === 20) Z.page = null; if (TM === 16 && !t.due) { /* 다음은 마감일 고르기 */ }
      return save(`${mdw(w)}로 옮겼어요`); }
    if (a === 'notime') return gate(t, 'time', () => { t.start = t.end = null; }, '반복 일정 시간 변경');
    if (a === 'preset') return setRule(t, presets(t.date)[+v]);
    if (a === 'custom') { Z.cx = { interval: 1, until: null, weekdays: null, monthWeek: null, unit: 'week', ...(t.rule || {}) }; return show('[data-tmz^="cxu"][aria-checked="true"]'); }
    if (a === 'cxn') { Z.cx.interval = Math.max(1, Math.min(99, Z.cx.interval + +v)); return show(`[data-tmz="cxn|${v}"]`); }
    if (a === 'cxu') { Z.cx.unit = v; if (v !== 'week') Z.cx.weekdays = null; return show(`[data-tmz="cxu|${v}"]`); }
    if (a === 'cxw') { const wd = new Set(Z.cx.weekdays || [A.s2d(t.date).getDay()]), k = +v; wd.has(k) ? wd.size > 1 && wd.delete(k) : wd.add(k); Z.cx.weekdays = [...wd]; return show(`[data-tmz="cxw|${v}"]`); }
    if (a === 'cxm') { Z.cx.monthWeek = +v; return show(`[data-tmz="cxm|${v}"]`); }
    if (a === 'cxe') { if (v === 'none') { Z.cx.until = null; Z.cpk = false; } else { Z.cpk = !Z.cpk; Z.cur = (Z.cx.until || A.add(t.date, 30)).slice(0, 7); } return show(`[data-tmz="cxe|${v}"]`); }
    if (a === 'cxp') { Z.cx = { ...presets(t.date)[+v], weekdays: presets(t.date)[+v].weekdays ?? null, monthWeek: presets(t.date)[+v].monthWeek ?? null }; return show(`[data-tmz="cxp|${v}"]`); }
    if (a === 'cxreset') { Z.cx = null; return show('[data-tmz^="cxp"]'); }
    if (a === 'cxx') { Z.cx = null; Z.cpk = false; return show('[data-tmz="custom"]'); }
    if (a === 'cxok') return setRule(t, Z.cx);
    if (a === 'sc') { Z.scope = v; return show(`[data-tmz="sc|${v}"]`); }
    if (a === 'tagx') return gate(t, 'field', () => { t.tags = P.tags(t).filter((k) => k !== v); }, '이 변경사항을 적용할 범위');
    if (a === 'tagadd') return addTag(t, v);
    if (a === 'gadd') { t.gcal = true; t.push = 'syncing'; save('Google 캘린더로 보내는 중이에요'); setTimeout(() => { if (t.push === 'syncing') { t.push = 'synced'; A.rerender(); } }, 1200); return; }
    if (a === 'gre') { t.push = 'syncing'; save('다시 보내는 중이에요'); setTimeout(() => { t.push = 'synced'; A.rerender(); }, 1200); return; }
    if (a === 'grm') { t.push = 'pending_delete'; save('캘린더에서 빼는 중이에요'); setTimeout(() => { t.gcal = false; t.push = null; A.rerender(); }, 1200); return; }
    if (a === 'reauth') { if (window.UM && UM.openSettings) UM.openSettings('link'); return; }
    if (a === 'del') { Z.ask = { kind: 'del', title: rec(t) ? '반복 일정 삭제' : '이 할 일을 삭제할까요?', note: t.gcal ? '연동된 캘린더 일정도 함께 삭제돼요.' : '', run: () => { A.todos = A.todos.filter((y) => y.id !== t.id); A.s.sel = null; } };
      if (TM === 18 && rec(t)) Z.ask.title = `반복 일정 삭제. 위에서 고른 범위는 "${SCOPE.find((s) => s[0] === Z.scope)[1]}"이에요`; return show('.z-ask button'); }
    if (a === 'askx') { Z.ask = null; return save(); }
    if (a === 'scope') { const k = Z.ask; Z.ask = null; k.run(); if (k.kind === 'del') { d.close(); return save(rec(t) ? `${SCOPE.find((s) => s[0] === v)[1]} 삭제했어요` : '삭제했어요'); } return save(SC_MSG[v]); }
  }, true);
  const hNum = (v) => { const [h, m] = v.split(':').map(Number); return h + m / 60; };
  document.addEventListener('change', (e) => { const el = e.target.closest && e.target.closest('#detail [data-tmzf]'); if (!el) return; const t = cur(); if (!t) return; const k = el.dataset.tmzf, v = el.value;
    if (k === 'title') { const nv = v.trim(); if (!nv || nv === t.title) { el.value = t.title; return; } return gate(t, 'field', () => { t.title = nv; }, '이 변경사항을 적용할 범위'); }
    if (k === 'desc') { if (v === (t.note || '')) return; return gate(t, 'field', () => { t.note = v; }, '이 변경사항을 적용할 범위'); }
    if (TM === 24 && Z.pop === 'time' && (k === 'start' || k === 'end')) { const b = { ...t, ...Z.dr }; if (k === 'start') { if (!v) { Z.dr.start = Z.dr.end = null; } else { const du = b.start != null && b.end != null ? b.end - b.start : 1; Z.dr.start = hNum(v); Z.dr.end = Math.min(24, Z.dr.start + du); } } else if (v) { const h = hNum(v), st = b.start ?? Math.max(0, h - 1); Z.dr.start = st; Z.dr.end = h > st ? h : st + 0.5; } return show(`[data-tmzf="${k}"]`); }
    if (k === 'start') return gate(t, 'time', () => { if (!v) { t.start = t.end = null; return; } const du = t.start != null && t.end != null ? t.end - t.start : 1; t.start = hNum(v); t.end = Math.min(24, t.start + du); }, '반복 일정 시간 변경');
    if (k === 'end') { if (!v) return; return gate(t, 'time', () => { const h = hNum(v); if (t.start == null) t.start = Math.max(0, h - 1); t.end = h > t.start ? h : t.start + 0.5; }, '반복 일정 시간 변경'); } });
  const paintSug = () => { const d = dlg(), t = cur(), s = d && d.querySelector('.z-sug'), i = d && d.querySelector('[data-tmzt]'); if (!s || !t) return; s.hidden = !Z.sug; s.innerHTML = Z.sug ? sugHTML(t) : ''; if (i) { i.setAttribute('aria-expanded', Z.sug); i.setAttribute('aria-activedescendant', Z.sug ? `zo${Z.ti}` : ''); } };
  document.addEventListener('focusin', (e) => { if (e.target.matches && e.target.matches('#detail [data-tmzt]')) { Z.sug = true; paintSug(); } });
  document.addEventListener('input', (e) => { if (e.target.matches && e.target.matches('#detail [data-tmzt]')) { Z.tq = e.target.value; Z.ti = 0; Z.sug = true; paintSug(); } });
  document.addEventListener('keydown', (e) => {
    const d = dlg(); if (!d || !d.open || !d.contains(e.target)) return; const t = cur(); if (!t) return;
    if (e.target.matches('[data-tmzt]')) { const { rows } = sugRows(t);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); Z.ti = Math.max(0, Math.min(rows.length - 1, Z.ti + (e.key === 'ArrowDown' ? 1 : -1))); return paintSug(); }
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const r = rows[Z.ti]; return addTag(t, Z.tq.trim() && (!r || r[0] === 'new') ? Z.tq : r ? r[1] : Z.tq); }
      if (e.key === 'Backspace' && !e.target.value && P.tags(t).length) { e.preventDefault(); const last = P.tags(t)[P.tags(t).length - 1]; return gate(t, 'field', () => { t.tags = P.tags(t).slice(0, -1); }, `"${tn(last)}" 태그를 빼는 범위`); }
      return; }
    if (e.key === 'Delete' && !e.target.matches('input, textarea') && !Z.ask) { e.preventDefault(); d.querySelector('[data-tmz="del"]')?.click(); }
  }, true);
  /* Esc: 범위 묻기 → 태그 제안 → 펼친 것 → 하위 화면 → 창 순서로 닫기 */
  document.addEventListener('cancel', (e) => { if (e.target.id !== 'detail') return;
    if (Z.ask) { e.preventDefault(); Z.ask = null; return show('[data-tmz="del"]'); }
    if (Z.sug) { e.preventDefault(); Z.sug = false; return paintSug(); }
    if (Z.cx && TM !== 19) { e.preventDefault(); Z.cx = null; return show('[data-tmz="custom"]'); }
    if (Z.page) { e.preventDefault(); const p = Z.page; Z.page = null; return show(`[data-tmz="page|${p}"]`); }
    if (Z.pop && TM !== 16) { e.preventDefault(); const p = Z.pop; Z.pop = null; return show(`[data-tmz="pop|${p}"]`); } }, true);
})();
