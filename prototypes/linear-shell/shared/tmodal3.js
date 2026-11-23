/* 캘린더 할 일 모달 11~15 (1 문서형 속성 목록에서 파생). d-calendar2.html 에서만 씀. ?tm=11..15&select=t4
   todomodal.js 의 P.tdHTML 자리를 빌려 그리고, 기존 data-tm* 고치기 동작을 그대로 씀 */
(() => {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), TM = +(Q.get('tm') || 0);
  if (TM < 11 || TM > 15 || !P.tmH) return;
  const H = P.tmH, ic = H.ic;
  const Y = { id: null, base: null, row: null, edit: false, snap: null, q: '', own: new Set() };
  const FIELDS = ['title', 'status', 'date', 'until', 'start', 'end', 'cal', 'tags', 'rep', 'due', 'gcal', 'push', 'note'];
  const snap = (t) => { const o = {}; FIELDS.forEach((k) => { o[k] = Array.isArray(t[k]) ? [...t[k]] : t[k] ?? null; }); o.cal = P.cal(t); o.tags = [...P.tags(t)]; return o; };
  const KEYS = { st: ['status'], date: ['date', 'until'], time: ['start', 'end'], due: ['due'], rep: ['rep'], cal: ['cal'], tags: ['tags'], g: ['gcal', 'push'], note: ['note'], title: ['title'] };
  const same = (a, b, k) => KEYS[k].every((f) => JSON.stringify(a[f] ?? null) === JSON.stringify(b[f] ?? null));
  const restore = (t, from, k) => KEYS[k].forEach((f) => { t[f] = Array.isArray(from[f]) ? [...from[f]] : from[f]; });
  const dn = (t) => (t.due ? Math.round((A.s2d(t.due) - A.s2d(A.TODAY)) / 864e5) : null);
  const dueTxt = (t) => { if (!t.due) return ''; const n = dn(t); return `${H.dL(t.due)} <em class="${n < 0 ? 'late' : n <= 1 ? 'soon' : ''}">${n < 0 ? `${-n}일 지남` : n === 0 ? '오늘' : n === 1 ? '내일' : `${n}일 남음`}</em>`; };
  /* 값 글자: 모달 1의 속성 순서를 그대로 */
  const val = (t, k) => ({
    st: A.ST[t.status], date: P.multi(t) ? H.timeTxt(t) : t.date ? H.dL(t.date) : '', time: t.start != null && !P.multi(t) ? H.timeTxt(t) : '',
    due: dueTxt(t), rep: t.rep ? H.repTxt(t) : '', cal: A.esc((A.cals.find((c) => c.id === (t.cal || P.cal(t))) || A.cals[0]).name),
    tags: (t.tags || []).map((x) => '#' + A.esc(H.tagName(x))).join(' '), g: t.push === 'failed' ? '<em class="late">보내지 못했어요</em>' : t.gcal ? 'Google Calendar에 있어요' : '', note: A.esc(t.note || ''),
  })[k];
  const empty = (k) => `<span class="tm-mu">${k === 'time' ? '종일' : k === 'g' ? 'Google Calendar에 없어요' : '없음'}</span>`;
  const ROWS = (t, f) => { const c = H.calOf(P.cal(t)); return [
    ['st', P.stIcon(t.status), '상태', () => f.st(), 'S'], ['date', ic.cal, '날짜', () => f.date(), 'D'], ['time', ic.clock, '시간', () => f.time(), 'T'],
    ['due', ic.flag, '마감일', () => f.due(), 'M'], ['rep', ic.rep, '반복', () => f.rep(), 'R'], ['cal', `<i class="tm-dot" style="--cc:${c.color}"></i>`, '캘린더', () => f.cal(), 'C'],
    ['tags', ic.tag, '태그', () => f.tags(), 'G'], ['g', ic.gc, 'Google', () => f.g(), 'O']]; };
  const head = (f) => `<header class="tm-bar">${f.calTag()}<span class="sp"></span>${f.del(false)}${f.close()}</header>${f.title('big')}`;

  /* ---------- 13 빠른 입력 줄: 적은 대로 바뀔 값을 먼저 보여 주고 Enter로 적용 ---------- */
  const DOWK = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOf = (w) => { const base = A.s2d(A.TODAY), td = base.getDay();
    if (w === '오늘') return A.TODAY; if (w === '내일') return A.add(A.TODAY, 1); if (w === '모레') return A.add(A.TODAY, 2);
    let m = w.match(/^다음\s*주\s*([일월화수목금토])(요일)?$/); if (m) { const nm = A.add(A.TODAY, ((8 - td) % 7) || 7); return A.add(nm, (DOWK.indexOf(m[1]) + 6) % 7); }
    m = w.match(/^([일월화수목금토])요일$/); if (m) return A.add(A.TODAY, ((DOWK.indexOf(m[1]) - td + 7) % 7) || 7);
    m = w.match(/^(\d{1,2})월\s*(\d{1,2})일$/); if (m) return `${A.TODAY.slice(0, 4)}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    return null; };
  const DAYRE = '(다음\\s*주\\s*[일월화수목금토](?:요일)?|[일월화수목금토]요일|오늘|내일|모레|\\d{1,2}월\\s*\\d{1,2}일)';
  const parse = (t, q) => { const out = []; let s = ` ${q} `;
    const take = (re, fn) => { s = s.replace(re, (...m) => { fn(m); return ' '; }); };
    take(new RegExp(`마감\\s*${DAYRE}`), (m) => { const v = dayOf(m[1].replace(/\s+/g, ' ')); if (v) out.push(['due', '마감일', v, (x) => { x.due = v; }]); });
    take(new RegExp(DAYRE), (m) => { const v = dayOf(m[1].replace(/\s+/g, ' ')); if (v) out.push(['date', '날짜', v, (x) => { x.date = v; x.until = null; }]); });
    const hs = []; take(/(오전|오후)?\s*(\d{1,2})시\s*(반|(\d{1,2})분)?/g, (m) => { let h = +m[2] % 24; if (m[1] === '오후' && h < 12) h += 12; if (!m[1] && h < 8) h += 12; if (m[1] === '오전' && h === 12) h = 0; hs.push(h + (m[3] === '반' ? 0.5 : m[4] ? +m[4] / 60 : 0)); });
    if (/종일/.test(s)) { s = s.replace('종일', ' '); out.push(['time', '시간', null, (x) => { x.start = x.end = null; }]); }
    else if (hs.length) { const a = hs[0], b = hs[1] > a ? hs[1] : a + (t.start != null && t.end != null ? t.end - t.start : 1); out.push(['time', '시간', [a, b], (x) => { x.start = a; x.end = Math.min(24, b); }]); }
    take(/#([^\s#,]+)/g, (m) => { const k = Object.keys(A.TAG).find((x) => A.TAG[x] === m[1]) || m[1]; out.push(['tags', '태그', k, (x) => { if (!P.tags(x).includes(k) && P.tags(x).length < 10) x.tags = [...P.tags(x), k]; }]); });
    take(/(반복\s*안\s*함|매일|매주|평일마다|매월)/, (m) => { const v = /안/.test(m[1]) ? null : m[1]; out.push(['rep', '반복', v, (x) => { x.rep = v; }]); });
    take(/(완료|끝냄|하는\s*중|진행\s*중|시작\s*전)/, (m) => { const v = /완료|끝/.test(m[1]) ? 'done' : /전/.test(m[1]) ? 'todo' : 'doing'; out.push(['st', '상태', v, (x) => { x.status = v; }]); });
    const left = s.replace(/[,.]/g, ' ').trim(); return { out, left }; };
  const shown = (k, v) => (k === 'date' || k === 'due' ? H.dL(v) : k === 'time' ? (v ? `${H.kh(v[0])}부터 ${H.kh(v[1])}까지` : '종일') : k === 'tags' ? `#${A.esc(H.tagName(v))} 더하기` : k === 'rep' ? (v ? H.repTxt({ rep: v }) : '반복 안 함') : k === 'st' ? A.ST[v] : v);
  const preview = (t) => { if (!Y.q.trim()) return '<p class="x13-h">날짜, 시간, #태그, 반복, 마감, 상태를 한 줄로 적어요. 예: <b>모레 오후 3시 #업무 마감 금요일</b></p>';
    const { out, left } = parse(t, Y.q);
    return `${out.length ? `<ul class="x13-l">${out.map(([k, l, v]) => `<li><span>${l}</span><s>${k === 'tags' ? '' : val(t, k) || '없음'}</s>${ic.next}<b>${shown(k, v)}</b></li>`).join('')}</ul>` : ''}
      ${left ? `<p class="x13-h warn">"${A.esc(left)}"은(는) 알아듣지 못했어요</p>` : out.length ? `<p class="x13-h"><kbd>Enter</kbd>로 ${out.length}가지 바꾸기</p>` : ''}`; };

  P.TDV = 'x' + TM;
  P.tdHTML = (t, f) => {
    if (Y.id !== t.id) { Y.id = t.id; Y.base = snap(t); Y.row = null; Y.edit = false; Y.snap = null; Y.q = ''; Y.own = new Set(); }
    const R = ROWS(t, f);
    /* 11 키보드 속성 줄 */
    if (TM === 11) return `<div class="tm x11">${head(f)}<ul class="x11-l" role="list">${R.map(([k, i, l, ed, key]) => `<li class="${Y.row === k ? 'tm-open on' : ''}">
        <button type="button" class="x11-r" data-tmy="row|${k}" aria-expanded="${Y.row === k}" aria-keyshortcuts="${key}"><span class="k">${i}${l}</span><span class="v">${val(t, k) || empty(k)}</span><kbd>${key}</kbd></button>
        ${Y.row === k ? `<div class="x11-e">${ed()}<p class="x11-h"><kbd>Esc</kbd> 다 고쳤으면 닫기</p></div>` : ''}</li>`).join('')}</ul>
      <div class="tm1-n"><p>메모</p>${f.note(3)}</div><p class="x11-f"><kbd>↑</kbd><kbd>↓</kbd> 줄 이동, <kbd>Enter</kbd> 또는 글자 키로 고치기</p></div>`;
    /* 12 바뀐 값 표시 + 줄마다 되돌리기 */
    if (TM === 12) { const ch = [...R.map((r) => r[0]), 'note', 'title'].filter((k) => !same(t, Y.base, k)); const b = Y.base;
      const was = (k) => { const v = val(b, k); return v || (k === 'time' ? '종일' : '없음'); };
      return `<div class="tm x12">${head(f)}${ch.includes('title') ? `<p class="x12-c">처음 제목: ${A.esc(b.title)} <button type="button" class="tm-lnk" data-tmy="rv|title">되돌리기</button></p>` : ''}
        <p class="x12-s ${ch.length ? 'on' : ''}" aria-live="polite">${ch.length ? `<span>이 창을 연 뒤 바뀐 것 ${ch.length}개</span><button type="button" class="tm-b" data-tmy="rvall">모두 되돌리기</button>` : '<span>바꾸면 여기와 그 줄에 처음 값이 남아요</span>'}</p>
        <dl class="tm1-p x12-p">${R.map(([k, i, l, ed]) => `<div class="${ch.includes(k) ? 'chg' : ''}"><dt>${i}${l}</dt><dd>${ed()}${ch.includes(k) ? `<p class="x12-c">처음: ${was(k)} <button type="button" class="tm-lnk" data-tmy="rv|${k}">되돌리기</button></p>` : ''}</dd></div>`).join('')}</dl>
        <div class="tm1-n ${ch.includes('note') ? 'chg' : ''}"><p>메모${ch.includes('note') ? ' <button type="button" class="tm-lnk" data-tmy="rv|note">처음 메모로 되돌리기</button>' : ''}</p>${f.note(3)}</div></div>`; }
    /* 13 빠른 입력 줄 + 속성 목록 */
    if (TM === 13) return `<div class="tm x13">${head(f)}<div class="x13-q"><label for="x13in">한 줄로 바꾸기</label><input id="x13in" class="tm-in" data-tmy="q" value="${A.esc(Y.q)}" placeholder="예: 내일 오후 2시 #학습 매주" autocomplete="off"><div class="x13-pv" aria-live="polite">${preview(t)}</div></div>
      <dl class="tm1-p">${R.map(([k, i, l, ed]) => `<div><dt>${i}${l}</dt><dd>${ed()}</dd></div>`).join('')}</dl><div class="tm1-n"><p>메모</p>${f.note(3)}</div></div>`;
    /* 14 읽기, 고치기 모드: 고치는 동안 바꾼 것은 취소로 한 번에 돌아감 */
    if (TM === 14) { if (!Y.edit) return `<div class="tm x14"><header class="tm-bar">${f.calTag()}<span class="sp"></span><button type="button" class="tm-b" data-tmy="edit" aria-keyshortcuts="E">${ic.edit}고치기<kbd>E</kbd></button>${f.close()}</header>
        <h2 class="x14-t ${t.status === 'done' ? 'done' : ''}">${A.esc(t.title)}</h2><dl class="x14-r">${R.map(([k, i, l]) => `<div><dt>${i}${l}</dt><dd>${val(t, k) || empty(k)}</dd></div>`).join('')}</dl>
        <div class="x14-n">${t.note ? `<p>${A.esc(t.note)}</p>` : '<p class="tm-mu">메모가 없어요</p>'}</div>
        <footer class="x14-f"><button type="button" class="tm-b p" data-tms="${t.status === 'done' ? 'todo' : 'done'}">${ic.check}${t.status === 'done' ? '다시 열기' : '완료로 바꾸기'}</button></footer></div>`;
      const n = [...R.map((r) => r[0]), 'note', 'title'].filter((k) => !same(t, Y.snap, k)).length;
      return `<div class="tm x14 ed"><p class="x14-b">${ic.edit}<span>고치는 중이에요. ${n ? `${n}가지 바꿨어요. ` : ''}취소하면 고치기를 누른 뒤 바꾼 것이 모두 돌아가요.</span></p>${f.title('big')}
        <dl class="tm1-p">${R.map(([k, i, l, ed]) => `<div><dt>${i}${l}</dt><dd>${ed()}</dd></div>`).join('')}</dl><div class="tm1-n"><p>메모</p>${f.note(4)}</div>
        <footer class="x14-f">${f.del()}<span class="sp"></span><button type="button" class="tm-b" data-tmy="cancel">취소</button><button type="button" class="tm-b p" data-tmy="done">${ic.check}다 고쳤어요</button></footer></div>`; }
    /* 15 줄마다 빠른 값 칩, 없으면 직접 */
    const today = A.TODAY, nm = A.add(today, ((8 - A.s2d(today).getDay()) % 7) || 7), fri = A.add(today, ((5 - A.s2d(today).getDay() + 7) % 7) || 7);
    const chip = (on, a, l) => `<button type="button" class="x15-c" data-tmy="${a}" aria-pressed="${on}">${l}</button>`;
    const own = (k, ed) => (Y.own.has(k) ? `<span class="x15-o">${ed()}</span>` : chip(false, `own|${k}`, '직접'));
    const QV = {
      date: () => [[today, '오늘'], [A.add(today, 1), '내일'], [A.add(today, 2), '모레'], [nm, '다음 주 월']].map(([v, l]) => chip(t.date === v && !P.multi(t), `day|${v}`, l)).join('') + own('date', f.date),
      time: () => (P.multi(t) ? f.time() : [[null, '종일'], [9, '오전 9시'], [14, '오후 2시'], [16, '오후 4시']].map(([v, l]) => chip(v == null ? t.start == null : t.start === v, `time|${v ?? ''}`, l)).join('') + own('time', f.time)),
      due: () => [['', '없음'], [A.add(t.date || today, 1), '하루 뒤'], [fri, '이번 금요일'], [nm, '다음 주 월']].map(([v, l]) => chip((t.due || '') === v, `due|${v}`, l)).join('') + own('due', f.due),
    };
    const sug = Object.keys(A.TAG).filter((k) => !P.tags(t).includes(k));
    return `<div class="tm x15">${head(f)}<dl class="tm1-p x15-p">${R.map(([k, i, l, ed]) => `<div><dt>${i}${l}</dt><dd>${QV[k] ? `<span class="x15-q">${QV[k]()}</span>` : ed()}${k === 'tags' && sug.length && P.tags(t).length < 10 ? `<span class="x15-q">${sug.map((x) => chip(false, `tag|${x}`, `#${A.esc(H.tagName(x))}`)).join('')}</span>` : ''}</dd></div>`).join('')}</dl>
      <div class="tm1-n"><p>메모</p>${f.note(3)}</div></div>`;
  };

  /* ---------- 동작 ---------- */
  const cur = () => A.byId(A.s.sel), dlg = () => $('#detail');
  const save = (msg) => { if (msg) A.toast(msg); A.rerender(); };
  const focusRow = (k) => dlg()?.querySelector(`[data-tmy="row|${k}"]`)?.focus();
  document.addEventListener('click', (e) => {
    const d = dlg(); if (!d || !d.contains(e.target)) return; const el = e.target.closest('[data-tmy]'), t = cur(); if (!el || !t) return;
    const [a, v] = el.dataset.tmy.split('|');
    if (a === 'row') { Y.row = Y.row === v ? null : v; P.tmShow(); if (Y.row) d.querySelector('.x11-e button, .x11-e input')?.focus(); else focusRow(v); return; }
    if (a === 'rv') { restore(t, Y.base, v); return save('처음 값으로 되돌렸어요'); }
    if (a === 'rvall') { Object.keys(KEYS).forEach((k) => restore(t, Y.base, k)); return save('창을 연 때로 모두 되돌렸어요'); }
    if (a === 'edit') { Y.edit = true; Y.snap = snap(t); P.tmShow(); d.querySelector('.tm-title')?.focus(); return; }
    if (a === 'cancel') { Object.keys(KEYS).forEach((k) => restore(t, Y.snap, k)); Y.edit = false; save('고친 것을 모두 취소했어요'); d.querySelector('[data-tmy="edit"]')?.focus(); return; }
    if (a === 'done') { Y.edit = false; save('저장했어요'); d.querySelector('[data-tmy="edit"]')?.focus(); return; }
    if (a === 'own') { Y.own.add(v); P.tmShow(); d.querySelector('.x15-o input')?.focus(); return; }
    if (a === 'day') { t.date = v; t.until = null; A.s.date = v; return save(`${H.dL(v)}로 옮겼어요`); }
    if (a === 'time') { if (v === '') { t.start = t.end = null; } else { const du = t.start != null && t.end != null ? t.end - t.start : 1; t.start = +v; t.end = Math.min(24, +v + du); } return save(); }
    if (a === 'due') { t.due = v || null; return save(v ? `마감일을 ${H.dL(v)}로 정했어요` : '마감일을 지웠어요'); }
    if (a === 'tag') { t.tags = [...P.tags(t), v]; return save(); }
  }, true);
  document.addEventListener('input', (e) => { if (!e.target.matches || !e.target.matches('#detail [data-tmy="q"]')) return; Y.q = e.target.value; const t = cur(), pv = $('#detail .x13-pv'); if (t && pv) pv.innerHTML = preview(t); });
  document.addEventListener('keydown', (e) => {
    const d = dlg(); if (!d || !d.open || !d.contains(e.target)) return; const t = cur(); if (!t) return;
    if (TM === 13 && e.target.matches('[data-tmy="q"]') && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const { out } = parse(t, Y.q); if (!out.length) return; out.forEach((o) => o[3](t)); if (out.some((o) => o[0] === 'date')) A.s.date = t.date; Y.q = ''; save(`${out.length}가지를 바꿨어요`); d.querySelector('[data-tmy="q"]')?.focus(); return; }
    if (e.target.matches('input, textarea')) return;
    if (TM === 14 && !Y.edit && e.key.toLowerCase() === 'e') { e.preventDefault(); d.querySelector('[data-tmy="edit"]')?.click(); return; }
    if (TM !== 11) return;
    const rows = [...d.querySelectorAll('.x11-r')], i = rows.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (Y.row && i < 0) return; e.preventDefault(); const j = i < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))); rows[j].focus(); return; }
    const r = ROWS(t, {}).find((x) => x[4] === e.key.toUpperCase()); if (r && !e.metaKey && !e.ctrlKey) { e.preventDefault(); Y.row = r[0]; P.tmShow(); d.querySelector('.x11-e button, .x11-e input')?.focus(); }
  }, true);
  /* 11: Esc 는 열린 줄만 닫고 창은 그대로 */
  document.addEventListener('cancel', (e) => { if (e.target.id === 'detail' && TM === 11 && Y.row) { e.preventDefault(); const k = Y.row; Y.row = null; P.tmShow(); focusRow(k); } }, true);
})();
