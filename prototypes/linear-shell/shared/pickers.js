/* ---------- 날짜 · 시간 고르기 (할 일 · 캘린더 공용) ----------
   날짜: 회고 "새 회고" 모달과 같은 달력(월요일 시작, ‹ › 로 월 이동, 아래 고른 날짜 + "오늘로")
   시간: 직접 입력(확정). ?tk=1~5 로 다른 시안 비교 (1 목록 · 2 직접 입력 · 3 오전/오후 · 시 · 분 · 4 시간 버튼 · 5 길이로 끝 정하기)
   기존 <input type=date|time> 은 값 보관용으로 숨겨 두고, 값을 바꾸면 change 이벤트를 그대로 보낸다. */
(function () {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search);
  const TK = (() => { const q = Q.get('tk'); try { if (q != null && window.top === window) localStorage.setItem('archive.tk', q); const v = +(q ?? 2); return v >= 1 && v <= 5 ? v : 2; } catch (e) { return q != null ? +q : 2; } })();
  document.body.classList.add('tk' + TK);
  const I = (p) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ic = { cal: A.ico.cal, clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), l: A.ico.l, r: A.ico.r, chev: I('<path d="m6 9 6 6 6-6"/>') };
  const DOW = ['월', '화', '수', '목', '금', '토', '일'];
  const pad = (n) => String(n).padStart(2, '0');
  const toH = (v) => { if (!v) return null; const [h, m] = v.split(':').map(Number); return h + m / 60; };
  const toV = (h) => { const m = Math.round(h * 60); return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`; };
  const dLabel = (v) => { if (!v) return ''; const d = A.s2d(v); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${A.DOW[d.getDay()]})`; };
  const lastDay = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const dur = (a, b) => { const m = Math.round((b - a) * 60); if (m <= 0) return ''; const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h}시간 ${r}분` : h ? `${h}시간` : `${r}분`; };

  let S = null; /* { kind, input, trig, cm, temp } */
  const host = (el) => el.closest('dialog') || document.body;
  const pairStart = (inp) => { const n = inp.dataset.n ? 'n' : 'f', box = inp.closest('form, .td, .pn, dl, .frow') || document; const s = box.querySelector(`input[type=time][data-${n}="start"]`) || document.querySelector(`input[type=time][data-${n}="start"]`); return s && s !== inp ? toH(s.value) : null; };

  /* ---------- 트리거 붙이기 ---------- */
  function enhance(root) {
    root.querySelectorAll('input[type=date]:not([data-pk]):not(.hid)').forEach((inp) => {
      inp.dataset.pk = 'd'; inp.classList.add('pk-in');
      inp.insertAdjacentHTML('beforebegin', `<button type="button" class="pk-trig pk-d" data-pkopen="d" aria-haspopup="dialog" ${inp.disabled ? 'disabled' : ''}>${ic.cal}<span>${dLabel(inp.value) || '<span class="pk-mu">없음</span>'}</span></button>`);
    });
    root.querySelectorAll('input[type=time]:not([data-pk])').forEach((inp) => {
      inp.dataset.pk = 't'; inp.classList.add('pk-in');
      const h = toH(inp.value);
      inp.insertAdjacentHTML('beforebegin', `<button type="button" class="pk-trig pk-t" data-pkopen="t" aria-haspopup="dialog" aria-label="${inp.getAttribute('aria-label') || '시간'}" ${inp.disabled ? 'disabled' : ''}>${ic.clock}<span>${h != null ? A.hmd(h) : '<span class="pk-mu">시간 없음</span>'}</span></button>`);
    });
  }
  const label = (inp) => { const b = inp.previousElementSibling; if (!b || !b.classList.contains('pk-trig')) return;
    const s = b.querySelector('span'); if (inp.type === 'date') s.innerHTML = dLabel(inp.value) || '<span class="pk-mu">없음</span>'; else { const h = toH(inp.value); s.innerHTML = h != null ? A.hmd(h) : '<span class="pk-mu">시간 없음</span>'; } };
  const sib = (inp, n) => { const box = inp.closest('form, .td, dl') || document; return box.querySelector(`input[data-${inp.dataset.n ? 'n' : 'f'}="${n}"]`); };
  const setVal = (inp, v) => { inp.value = v; label(inp);
    if (inp.dataset.n === 'date') { const u = sib(inp, 'until'); if (u && (!v || (u.value && u.value < v))) { u.value = v; label(u); } } inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };

  /* ---------- 달력 (회고 모달과 같은 모양) ---------- */
  function calHTML() {
    const inp = S.input, val = inp.value, min = inp.min || '', ym = S.cm || (val || A.TODAY).slice(0, 7), [y, m] = ym.split('-').map(Number), first = `${ym}-01`;
    const start = A.add(first, -((A.s2d(first).getDay() + 6) % 7)), prev = A.add(first, -1).slice(0, 7), next = A.add(`${ym}-${pad(lastDay(ym))}`, 1).slice(0, 7);
    const clear = inp.dataset.n === 'date' || inp.dataset.n === 'until';
    return `<div class="pk-mh"><button type="button" class="pk-ib" data-pkm="${prev}" aria-label="이전 달">${ic.l}</button><b>${y}년 ${m}월</b><button type="button" class="pk-ib" data-pkm="${next}" aria-label="다음 달">${ic.r}</button></div>
      <div class="pk-g">${DOW.map((w, i) => `<span class="${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${w}</span>`).join('')}${[...Array(42)].map((_, i) => { const d = A.add(start, i);
        return `<button type="button" class="${d.startsWith(ym) ? '' : 'out'} ${d === A.TODAY ? 'today' : ''}" data-pkd="${d}" aria-pressed="${d === val}" ${min && d < min ? 'disabled' : ''} aria-label="${dLabel(d)}">${+d.slice(8)}</button>`; }).join('')}</div>
      <div class="pk-ft"><span>${val ? dLabel(val) : '날짜 없음'}</span><span class="pk-sp"></span>${clear && val ? `<button type="button" class="pk-lnk" data-pkclear>${inp.dataset.n === 'until' ? '마감 없음' : '날짜 지우기'}</button>` : ''}<button type="button" class="pk-lnk" data-pkd="${A.TODAY}" ${min && A.TODAY < min ? 'disabled' : ''}>오늘로</button></div>`;
  }

  /* ---------- 시간 시안 5가지 ---------- */
  const SLOTS = [...Array(48)].map((_, i) => i / 2);
  const isEnd = () => S.input.dataset.f === 'end' || S.input.dataset.n === 'end';
  const tag = (h) => { const s = isEnd() ? pairStart(S.input) : null; return s != null && h > s ? `<small>${dur(s, h)}</small>` : ''; };
  function timeHTML() {
    const cur = toH(S.input.value), none = `<button type="button" class="pk-row ${cur == null ? 'on' : ''}" data-pkt="">시간 없음<small>종일</small></button>`;
    if (TK === 2) { const g = S.temp != null ? S.temp : null;
      const sug = (g != null ? [g, g + 0.5, g + 1] : [9, 10, 13, 14, 15, 18]).filter((h) => h < 24);
      return `<label class="pk-type">${ic.clock}<input id="pk-q" value="${S.q || ''}" placeholder="예: 3pm, 오후 3시, 15:30" autocomplete="off" aria-label="시간 입력"></label>
        <p class="pk-hint">${S.q ? (g != null ? `Enter 로 ${A.hmd(g)}` : '알아볼 수 없는 시간이에요') : '숫자나 "오후 3시 30분"처럼 쳐 보세요'}</p>
        <div class="pk-list s">${sug.map((h) => `<button type="button" class="pk-row ${cur === h ? 'on' : ''}" data-pkt="${toV(h)}">${A.hmd(h)}${tag(h)}</button>`).join('')}${none}</div>`; }
    if (TK === 3) { const t = S.temp != null ? S.temp : cur != null ? cur : 9, pm = t >= 12, h12 = Math.floor(t) % 12 || 12, mm = Math.round((t % 1) * 60);
      const col = (items, on, key) => `<div class="pk-col" role="listbox">${items.map(([v, l]) => `<button type="button" role="option" aria-selected="${v === on}" data-pkw="${key}:${v}">${l}</button>`).join('')}</div>`;
      return `<div class="pk-wh">${col([['am', '오전'], ['pm', '오후']], pm ? 'pm' : 'am', 'p')}${col([...Array(12)].map((_, i) => [i + 1, i + 1]), h12, 'h')}${col([0, 15, 30, 45].map((v) => [v, pad(v)]), mm - (mm % 15), 'm')}</div>
        <div class="pk-ft"><span>${A.hmd(t)}${tag(t) ? ` <small>${dur(pairStart(S.input), t)}</small>` : ''}</span><span class="pk-sp"></span><button type="button" class="pk-lnk" data-pkt="">시간 없음</button><button type="button" class="pk-ok" data-pkt="${toV(t)}">적용</button></div>`; }
    if (TK === 4) { const grp = [['오전', 7, 12], ['오후', 12, 18], ['저녁', 18, 23]];
      return `${grp.map(([n, a, b]) => `<p class="pk-eb">${n}</p><div class="pk-chips">${SLOTS.filter((h) => h >= a && h < b).map((h) => `<button type="button" class="${cur === h ? 'on' : ''}" data-pkt="${toV(h)}">${A.hmc(h).replace(/ (AM|PM)$/, '')}</button>`).join('')}</div>`).join('')}
        <div class="pk-ft"><span>${cur != null ? A.hmd(cur) : '시간 없음'}</span><span class="pk-sp"></span><button type="button" class="pk-lnk" data-pkt="">시간 없음</button></div>`; }
    if (TK === 5 && isEnd() && pairStart(S.input) != null && !S.full) { const s = pairStart(S.input);
      return `<p class="pk-eb">시작 ${A.hmd(s)}부터 얼마나?</p><div class="pk-chips dur">${[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].filter((d) => s + d <= 24).map((d) => `<button type="button" class="${cur != null && Math.abs(cur - s - d) < 0.01 ? 'on' : ''}" data-pkt="${toV(s + d)}"><b>${dur(0, d)}</b><small>${A.hmd(s + d)}까지</small></button>`).join('')}</div>
        <div class="pk-ft"><button type="button" class="pk-lnk" data-pkfull>끝 시각 직접 고르기</button><span class="pk-sp"></span><button type="button" class="pk-lnk" data-pkt="">시간 없음</button></div>`; }
    if (TK === 5 && !isEnd()) { const now = Math.ceil((A.NOW || 9) * 2) / 2;
      return `<div class="pk-chips q">${[now, now + 1].filter((h) => h < 24).map((h, i) => `<button type="button" data-pkt="${toV(h)}">${i ? '1시간 뒤' : '지금'}<small>${A.hmd(h)}</small></button>`).join('')}</div>
        <div class="pk-list">${none}${SLOTS.map((h) => `<button type="button" class="pk-row ${cur === h ? 'on' : ''}" data-pkt="${toV(h)}">${A.hmd(h)}</button>`).join('')}</div>`; }
    return `<div class="pk-list">${none}${SLOTS.map((h) => `<button type="button" class="pk-row ${cur === h ? 'on' : ''}" data-pkt="${toV(h)}">${A.hmd(h)}${tag(h)}</button>`).join('')}</div>`;
  }
  const parseT = (raw) => {
    let s = (raw || '').trim().toLowerCase().replace(/\s+/g, ''); if (!s) return null;
    const pm = /pm|오후|저녁|밤/.test(s), am = /am|오전|아침|새벽/.test(s); s = s.replace(/pm|am|오후|오전|저녁|밤|아침|새벽|p|a/g, '');
    let h, m = 0, x;
    if ((x = s.match(/^(\d{1,2})시반$/))) { h = +x[1]; m = 30; }
    else if ((x = s.match(/^(\d{1,2})시(\d{1,2})분?$/))) { h = +x[1]; m = +x[2]; }
    else if ((x = s.match(/^(\d{1,2})(?::|시)?(\d{2})?$/))) { h = +x[1]; m = x[2] ? +x[2] : 0; }
    else if ((x = s.match(/^(\d{3,4})$/))) { const n = x[1].padStart(4, '0'); h = +n.slice(0, 2); m = +n.slice(2); }
    else return null;
    if (pm && h < 12) h += 12; if (am && h === 12) h = 0;
    return h > 23 || m > 59 ? null : h + m / 60;
  };

  /* ---------- 열기 · 닫기 ---------- */
  function draw() {
    let el = $('#pkpop');
    if (!el || el.parentElement !== host(S.trig)) { el && el.remove(); host(S.trig).insertAdjacentHTML('beforeend', '<div class="pk-pop" id="pkpop" role="dialog"></div>'); el = $('#pkpop'); }
    el.className = `pk-pop ${S.kind === 'd' ? 'pk-cal' : 'pk-time tkv' + TK}`; el.setAttribute('aria-label', S.kind === 'd' ? '날짜 고르기' : '시간 고르기');
    el.innerHTML = S.kind === 'd' ? calHTML() : timeHTML();
    const r = S.trig.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    el.style.top = (r.bottom + 6 + h > innerHeight - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
    const center = (box, item, top) => { if (box && item) box.scrollTop = top ? item.offsetTop - box.offsetTop : item.offsetTop - box.offsetTop - (box.clientHeight - item.offsetHeight) / 2; };
    const list = el.querySelector('.pk-list:not(.s)'); if (list) { const on = list.querySelector('.on[data-pkt]:not([data-pkt=""])'); center(list, on || list.querySelector('[data-pkt="09:00"]'), !on); }
    el.querySelectorAll('.pk-col').forEach((c) => center(c, c.querySelector('[aria-selected=true]')));
    const q = $('#pk-q'); if (q && document.activeElement !== q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function open(trig) {
    const inp = trig.nextElementSibling && trig.nextElementSibling.matches('input') ? trig.nextElementSibling : trig.querySelector('input');
    if (!inp || inp.disabled) return;
    if (inp.dataset.n === 'until') { const d = sib(inp, 'date'); if (d && d.value) inp.min = d.value; }
    S = { kind: inp.type === 'date' ? 'd' : 't', input: inp, trig, cm: null, temp: null, q: '' };
    trig.setAttribute('aria-expanded', 'true'); draw();
  }
  function close() { if (!S) return; S.trig && S.trig.setAttribute('aria-expanded', 'false'); const el = $('#pkpop'); el && el.remove(); const t = S.trig; S = null; t && t.isConnected && t.focus(); }
  function pick(v) { const s = S; close(); setVal(s.input, v); }

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    let b;
    if ((b = e.target.closest('[data-pkopen]'))) { e.preventDefault(); e.stopPropagation(); if (S && S.trig === b) close(); else { close(); open(b); } return; }
    if ((b = e.target.closest('.td [data-tdx=pick]'))) { e.preventDefault(); e.stopPropagation(); if (S && S.trig === b) close(); else { close(); open(b); } return; }
    if (!S) return;
    if (!e.target.closest('#pkpop')) { close(); return; }
    e.stopPropagation();
    if ((b = e.target.closest('[data-pkm]'))) { S.cm = b.dataset.pkm; draw(); return; }
    if ((b = e.target.closest('[data-pkd]'))) { pick(b.dataset.pkd); return; }
    if (e.target.closest('[data-pkclear]')) { pick(''); return; }
    if ((b = e.target.closest('[data-pkt]'))) { pick(b.dataset.pkt); return; }
    if (e.target.closest('[data-pkfull]')) { S.full = true; draw(); return; }
    if ((b = e.target.closest('[data-pkw]'))) { const [k, v] = b.dataset.pkw.split(':'); const cur = S.temp != null ? S.temp : toH(S.input.value) ?? 9; let H = Math.floor(cur), M = Math.round((cur % 1) * 60), pm = H >= 12;
      if (k === 'p') pm = v === 'pm'; if (k === 'h') H = (+v % 12) + (pm ? 12 : 0); else H = (H % 12) + (pm ? 12 : 0); if (k === 'm') M = +v;
      S.temp = H + M / 60; draw(); return; }
  }, true);
  document.addEventListener('input', (e) => { if (e.target.id === 'pk-q' && S) { S.q = e.target.value; S.temp = parseT(S.q); draw(); } });
  document.addEventListener('keydown', (e) => {
    if (!S) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Enter' && e.target.id === 'pk-q') { e.preventDefault(); e.stopPropagation(); if (S.temp != null) pick(toV(S.temp)); }
  }, true);
  addEventListener('resize', () => close());
  document.addEventListener('change', () => setTimeout(() => document.querySelectorAll('input[data-pk]').forEach((i) => { const t = i.previousElementSibling; if (t && t.classList.contains('pk-trig')) t.disabled = i.disabled; }), 0));
  document.addEventListener('scroll', (e) => { if (S && !(e.target instanceof Element && e.target.closest('#pkpop'))) close(); }, true);

  /* 화면이 다시 그려질 때마다 새 입력 칸에 트리거를 붙인다 */
  let q = 0; new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; enhance(document); }); }).observe(document.body, { childList: true, subtree: true });
  enhance(document);

  /* 시안 비교용: ?pksel=t3&pkopen=start | ?pknew=1&pkopen=date */
  const sel = Q.get('pksel'), po = Q.get('pkopen');
  setTimeout(() => {
    if (sel && A.byId(sel)) { A.s.sel = sel; A.s.date = A.byId(sel).date || A.s.date; A.rerender(); if (P) { P.dtab = 'schedule'; A.rerender(); } }
    if (Q.get('pknew') && P && P.openNew) P.openNew();
    if (po) setTimeout(() => { const inp = document.querySelector(`input[data-f="${po}"], input[data-n="${po}"]`); const t = inp && (inp.closest('[data-tdx=pick]') || inp.previousElementSibling); t && t.click(); }, 120);
  }, 60);
})();
