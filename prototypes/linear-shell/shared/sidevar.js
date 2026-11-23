/* 사이드바 시안: 오늘 회고(rd), 연동 문제(pb), 할 일 내일로 이월(co) 각 1~5
   ?rd=1..5  ?rdw=1(오늘 회고 쓴 상태)  ?pb=1..5  ?co=1..5  ?close=1(하루 닫기 창 바로 열기)  ?issues=0 */
(() => {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), pick = (k, d = 1, max = 5) => { const v = +(Q.get(k) || d); return v >= 1 && v <= max ? v : d; };
  const RD = pick('rd', 5), PB = pick('pb', 3), CO = pick('co', 1, 20);
  /* 예시 데이터: 마감일, 반복, Google 연결 (tododetail.js 와 같은 값) */
  [['t4', { due: '2026-11-04' }], ['t5', { rep: '매일' }], ['t3', { gcal: true }]].forEach(([id, o]) => { const t = A.byId(id); if (t) Object.assign(t, o); });
  if (Q.get('rdw') === '1') A.retro.add(A.TODAY);
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ic = { warn: P.warnIc, chev: I('<path d="m9 6 6 6-6 6"/>'), down: I('<path d="m6 9 6 6 6-6"/>'), right: I('<path d="M5 12h14M13 6l6 6-6 6"/>'), left: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'), check: I('<path d="m5 12 5 5 9-10"/>'), x: I('<path d="M6 6l12 12M18 6 6 18"/>') };
  const BR = {
    gh: '<svg class="sv-br svgh" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
    gcal: '<svg class="sv-br svgc" viewBox="0 0 24 24" aria-hidden="true"><path class="w" d="M6 6h12v12H6z"/><path class="b" d="M3 0h15v6H6v12H0V3a3 3 0 0 1 3-3z"/><path class="y" d="M18 0h3a3 3 0 0 1 3 3v15h-6z"/><path class="g" d="M6 18h12v6H6z"/><path class="d" d="M0 18h6v6H3a3 3 0 0 1-3-3z"/><path class="r" d="M18 18h6l-6 6z"/></svg>',
  };
  const S = { pbOpen: false, pbPop: false, fixed: new Set() };
  const settings = () => { if (window.UM && UM.openSettings) UM.openSettings('link'); else location.href = 'd-settings.html#link'; };
  const iss0 = P.issues;
  P.issues = () => iss0().filter((x) => !S.fixed.has(x.k)).map((x) => ({ ...x, act: x.k === 'gcal' ? '다시 보내기' : '권한 받기', short: x.k === 'gcal' ? 'Google 보내기 실패' : 'GitHub 권한 필요' }));
  const dLabel = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${A.DOW[d.getDay()]}요일`; };
  const dShort = (s) => { const d = A.s2d(s); return `${A.DOW[d.getDay()]} ${d.getDate()}`; };

  /* ---------- 오늘 회고 ---------- */
  function rdHTML() {
    const w = A.retro.has(A.TODAY), st = A.stats(A.TODAY), view = `d-retro.html?date=${A.TODAY}`;
    const done = A.onDay(A.TODAY).filter((t) => t.status === 'done');
    if (RD === 1) return `<h2>오늘 회고</h2>${w ? `<a class="rd on" href="${view}">${A.ico.mark}<span>오늘 회고 보기</span><em>썼어요</em></a>` : `<button type="button" class="rd" data-reflect="${A.TODAY}">${A.ico.mark}<span>오늘 회고 쓰기</span><em>완료 ${st.done}/${st.n}</em></button>`}`;
    if (RD === 2) { const pct = st.n ? Math.round((st.done / st.n) * 100) : 0;
      return `<h2>오늘 회고</h2><div class="rd2 ${w ? 'on' : ''}"><p class="rd2-h"><b>${w ? '오늘 회고를 썼어요' : '아직 안 썼어요'}</b><span>${dShort(A.TODAY)}일</span></p>
        <span class="rd2-bar" role="img" aria-label="할 일 ${st.n}개 중 ${st.done}개 끝냄"><i style="--p:${pct / 100}"></i></span><p class="rd2-m">할 일 ${st.done}/${st.n} 끝냄, 커밋 ${st.commits}개</p>
        ${w ? `<a class="rd2-b q" href="${view}">회고 보기</a>` : `<button type="button" class="rd2-b" data-reflect="${A.TODAY}">회고 쓰기</button>`}</div>`; }
    if (RD === 3) { const ws = A.weekStart(A.TODAY), days = [...Array(7)].map((_, i) => A.add(ws, i)), n = days.filter((d) => A.retro.has(d)).length;
      return `<h2>이번 주 회고</h2><div class="rd3"><div class="rd3-d" role="list">${days.map((d) => { const has = A.retro.has(d), today = d === A.TODAY, fut = d > A.TODAY;
          const inner = `<small>${A.DOW[A.s2d(d).getDay()]}</small>${has ? A.ico.mark : '<i aria-hidden="true"></i>'}`;
          return `<span role="listitem">${today && !has ? `<button type="button" class="t" data-reflect="${d}" aria-label="오늘 회고 쓰기">${inner}</button>` : has ? `<a class="on ${today ? 't' : ''}" href="d-retro.html?date=${d}" aria-label="${dLabel(d)} 회고 보기">${inner}</a>` : `<span class="${fut ? 'fut' : 'miss'}" aria-label="${dLabel(d)} ${fut ? '아직' : '안 씀'}">${inner}</span>`}</span>`; }).join('')}</div>
        <p class="rd3-m"><span>이번 주 ${n}일 썼어요</span>${w ? `<a href="${view}">오늘 보기</a>` : `<button type="button" data-reflect="${A.TODAY}">오늘 쓰기</button>`}</p></div>`; }
    if (RD === 4) return `<h2>오늘 회고</h2><div class="rd4 ${w ? 'on' : ''}">${w ? `<p class="rd4-q">오늘 회고를 썼어요. 끝낸 일 ${st.done}개와 커밋 ${st.commits}개가 들어 있어요.</p><a class="rd4-b q" href="${view}">회고 보기</a>`
      : `<p class="rd4-l">초안에 들어갈 내용</p><ul class="rd4-q">${done.slice(0, 2).map((t) => `<li>${A.esc(t.title)}</li>`).join('')}${done.length > 2 ? `<li>외 ${done.length - 2}개</li>` : ''}<li>커밋 ${st.commits}개</li></ul><button type="button" class="rd4-b" data-reflect="${A.TODAY}">${A.ico.sparkle}이 내용으로 초안 만들기</button>`}</div>`;
    return '';
  }
  function rd5() { const mini = $('#mini'); if (!mini) return; mini.querySelector('.rd5')?.remove(); const w = A.retro.has(A.TODAY);
    mini.insertAdjacentHTML('beforeend', `<p class="rd5 ${w ? 'on' : ''}">${A.ico.mark}<span>${w ? '오늘 회고 썼어요' : '오늘 회고 아직 안 썼어요'}</span>${w ? `<a href="d-retro.html?date=${A.TODAY}">보기</a>` : `<button type="button" data-reflect="${A.TODAY}">쓰기</button>`}</p>`); }

  /* ---------- 연동 문제 ---------- */
  const item1 = (x) => `<button type="button" class="pb" data-pb="${x.k}">${ic.warn}<span><b>${x.t}</b><small>${x.d}</small></span></button>`;
  function pbHTML(iss) {
    if (PB === 1) return `<h2>연동 문제</h2>${iss.map(item1).join('')}`;
    if (PB === 2) return `<button type="button" class="pb2" data-pb2 aria-expanded="${S.pbOpen}">${ic.warn}<span>연동 문제 ${iss.length}개</span>${ic.down}</button>
      ${S.pbOpen ? `<div class="pb2-l">${iss.map((x) => `<div class="pb2-i"><span><b>${x.t}</b><small>${x.d}</small></span><button type="button" data-pbfix="${x.k}">${x.act}</button></div>`).join('')}<button type="button" class="pb2-s" data-pb="all">설정에서 연동 보기</button></div>` : ''}`;
    if (PB === 3) return `<h2>연동 문제</h2>${iss.map((x) => `<div class="pb3"><span class="pb3-i">${BR[x.k]}<i aria-hidden="true">!</i></span><span class="pb3-t"><b>${x.short}</b><small>${x.d}</small></span><button type="button" data-pbfix="${x.k}">${x.act}</button></div>`).join('')}`;
    if (PB === 4) return `<button type="button" class="pb4" data-pb="all">${ic.warn}<span><b>연동 문제 ${iss.length}개</b><small>${iss.map((x) => x.short).join(', ')}</small></span>${ic.chev}</button>`;
    return '';
  }
  function pb5(iss) { const foot = $('.side .foot'); if (!foot) return; foot.querySelector('.pb5')?.remove(); document.querySelector('.pb5-pop')?.remove(); if (!iss.length) return;
    foot.style.position = 'relative';
    foot.insertAdjacentHTML('beforeend', `<button type="button" class="pb5" data-pb5 aria-expanded="${S.pbPop}" aria-label="연동 문제 ${iss.length}개">${ic.warn}<span>${iss.length}</span></button>`);
    if (S.pbPop) foot.insertAdjacentHTML('beforeend', `<div class="pb5-pop" role="dialog" aria-label="연동 문제"><p>연동 문제 ${iss.length}개</p>${iss.map((x) => `<div class="pb5-i">${BR[x.k]}<span><b>${x.t}</b><small>${x.d}</small></span><button type="button" data-pbfix="${x.k}">${x.act}</button></div>`).join('')}</div>`); }

  function draw() {
    const rd = $('#rday'), pe = $('#probs'), iss = P.issues();
    if (rd) { rd.hidden = RD === 5; rd.innerHTML = RD === 5 ? '' : rdHTML(); rd.className = 'svr' + RD; }
    if (RD === 5) rd5();
    if (pe) { pe.hidden = !iss.length || PB === 5; pe.innerHTML = iss.length && PB !== 5 ? pbHTML(iss) : ''; pe.className = 'svp' + PB; }
    if (PB === 5) pb5(iss);
  }
  const sb = P.sidebar; P.sidebar = () => { sb(); draw(); };

  document.addEventListener('click', (e) => {
    const g = (a) => e.target.closest(`[${a}]`); let el;
    if (S.pbPop && !g('data-pb5') && !e.target.closest('.pb5-pop')) { S.pbPop = false; draw(); }
    if (g('data-pb2')) { S.pbOpen = !S.pbOpen; draw(); $('[data-pb2]')?.focus(); return; }
    if (g('data-pb5')) { S.pbPop = !S.pbPop; draw(); (S.pbPop ? $('.pb5-pop button') : $('[data-pb5]'))?.focus(); return; }
    if ((el = g('data-pbfix'))) { const k = el.dataset.pbfix; if (k === 'gh') { S.pbPop = false; settings(); return; }
      S.fixed.add(k); A.toast('디자인 리뷰를 Google Calendar로 다시 보냈어요'); draw(); return; }
  }, true);

  /* ---------- 할 일 내일로 이월: 하루 닫기 창의 첫 단계 ---------- */
  const TOM = A.add(A.TODAY, 1);
  const dayOpts = () => { const o = [[A.add(A.s.date, 1), '내일']]; for (let i = 2; i <= 4; i++) o.push([A.add(A.s.date, i), null]); const d = A.s2d(A.s.date), nm = A.add(A.s.date, ((8 - d.getDay()) % 7) || 7); if (!o.some((x) => x[0] === nm)) o.push([nm, '다음 주 월']); return o.map(([s, l]) => [s, l || dShort(s)]); };
  function finish(d, s, plan, slot = {}, extra = '') {
    const done = A.onDay(s).filter((t) => t.status === 'done'), cm = A.commits.filter((c) => c.date === s); let carried = 0, closed = 0;
    Object.entries(plan).forEach(([id, v]) => { const t = A.byId(id); if (v === 'done') { t.status = 'done'; closed++; } else if (v) { t.date = v; carried++; if (slot[id] === 'all') { t.start = t.end = null; } else if (slot[id] != null) { const du = t.start != null && t.end != null ? t.end - t.start : 1; t.start = slot[id]; t.end = slot[id] + du; } } });
    const lines = A.onDay(s).filter((t) => t.status === 'done').map((t) => `- ${t.title}`).join('\n'), cl = cm.map((c) => `- ${c.msg} (${c.repo})`).join('\n');
    d.innerHTML = `<form class="dg" method="dialog"><h2>회고 초안</h2>
      <pre>## ${A.label(s)}\n\n완료한 일\n${lines || '- 없음'}\n\n남긴 커밋\n${cl || '- 없음'}\n\n넘긴 일 ${carried}개${closed ? `, 끝냄으로 바꾼 일 ${closed}개` : ''}${extra}\n\n배운 점: </pre>
      <div class="foot"><button class="btn" value="x">닫기</button><button class="btn btn-p" id="sv" value="x" type="button">회고로 저장</button></div></form>`;
    $('#sv', d).onclick = () => { A.retro.add(s); d.close(); A.toast('회고로 저장했어요. 달력에 책갈피가 생겼어요'); A.rerender(); };
    A.rerender(); $('#sv', d).focus(); }

  A.closeDay = () => {
    const s = A.s.date, d = A.dlg(), open = A.onDay(s).filter((t) => t.status !== 'done' && !t.until), st = A.stats(s), opts = dayOpts();
    const plan = {}; open.forEach((t) => { plan[t.id] = opts[0][0]; });
    const C = { i: 0, more: false, other: null, slot: {}, pick: new Set(), hist: [], sel: null, top: [], rest: null, f: 0, why: {}, dec: new Set(), last: null, edit: null, rev: false };
    const head = `<h2>${A.label(s)} 닫기</h2><p>끝낸 일 ${st.done}개, 커밋 ${st.commits}개. 남은 일 ${open.length}개를 어떻게 할지 정하면 회고 초안을 만들어요.</p>`;
    const go = (lbl = '넘기고 회고 초안 만들기') => `<div class="foot"><button class="btn" value="x">취소</button><button class="btn btn-p" id="mk" type="button">${A.ico.sparkle}${lbl}</button></div>`;
    const where = (v) => (v === 'done' ? '끝냄' : v ? (v === opts[0][0] ? '내일' : dShort(v) + '일') : '오늘에 둠');
    const sd = (t) => A.sd(t.status);
    const body = () => {
      if (!open.length) return `<p class="co-none">남은 일이 없어요.</p>`;
      if (CO >= 6) return bodyX();
      if (CO === 1) return `<div class="co1">${open.map((t) => { const v = plan[t.id], k = v === opts[0][0] ? 'tom' : v ? 'other' : 'keep';
        return `<div class="co1-r"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><span class="co-seg" role="radiogroup" aria-label="${A.esc(t.title)}">${[['tom', '내일'], ['other', '다른 날'], ['keep', '오늘에 두기']].map(([kk, l]) => `<button type="button" role="radio" aria-checked="${k === kk}" data-c1="${t.id}|${kk}">${l}${kk === 'other' && k === 'other' ? ` ${dShort(v)}` : ''}</button>`).join('')}</span>
          ${C.other === t.id ? `<span class="co1-d" role="radiogroup" aria-label="넘길 날">${opts.slice(1).map(([ds, l]) => `<button type="button" role="radio" aria-checked="${v === ds}" data-c1d="${t.id}|${ds}">${l}</button>`).join('')}</span>` : ''}</div>`; }).join('')}</div>`;
      if (CO === 2) { if (C.i >= open.length) return `<div class="co2-sum"><p>이렇게 정했어요</p><ul>${open.map((t) => `<li><span>${A.esc(t.title)}</span><b>${where(plan[t.id])}</b></li>`).join('')}</ul><button type="button" class="co-lnk" data-c2i="0">처음부터 다시</button></div>`;
        const t = open[C.i]; return `<div class="co2"><p class="co2-n"><span>남은 일 ${open.length}개 중 ${C.i + 1}번째</span><span class="co2-p" aria-hidden="true">${open.map((_, i) => `<i class="${i < C.i ? 'd' : i === C.i ? 'c' : ''}"></i>`).join('')}</span></p>
          <div class="co2-c"><b>${A.esc(t.title)}</b><small>${A.ST[t.status]}${t.start != null ? `, ${A.range(t.start, t.end)}` : ''}</small></div>
          <div class="co2-a">${[[opts[0][0], '내일로'], [opts[2][0], `${dShort(opts[2][0])}일로`], [null, '오늘에 두기'], ['done', '사실 끝냈어요']].map(([v, l], i) => `<button type="button" class="${i ? '' : 'p'}" data-c2="${v ?? ''}">${l}</button>`).join('')}</div></div>`; }
      if (CO === 3) { const col = (keep) => open.filter((t) => (plan[t.id] ? !keep : keep));
        const card = (t, keep) => `<button type="button" class="co3-i" data-c3="${t.id}" aria-label="${A.esc(t.title)}, ${keep ? '내일로 옮기기' : '오늘에 두기'}">${keep ? '' : ''}${sd(t)}<span class="co3-tt">${A.esc(t.title)}</span>${keep ? ic.right : ic.left}</button>`;
        return `<div class="co3"><div class="co3-c"><p><b>오늘에 둘 일</b><span>${col(true).length}</span></p>${col(true).map((t) => card(t, true)).join('') || '<small>없어요</small>'}</div>
          <div class="co3-c on"><p><b>내일(${dShort(opts[0][0])}일)로 넘길 일</b><span>${col(false).length}</span></p>${col(false).map((t) => card(t, false)).join('') || '<small>없어요</small>'}</div></div><p class="co-tip">누르면 반대쪽으로 옮겨져요</p>`; }
      if (CO === 4) return `<div class="co4"><div class="co4-h" aria-hidden="true"><span></span>${opts.map(([ds, l]) => `<span>${l}</span>`).join('')}<span>두기</span></div>${open.map((t) => `<div class="co4-r" role="radiogroup" aria-label="${A.esc(t.title)} 넘길 날"><span class="co-t">${sd(t)}${A.esc(t.title)}</span>${[...opts.map((o) => o[0]), ''].map((ds) => `<button type="button" role="radio" aria-checked="${(plan[t.id] || '') === ds}" data-c4="${t.id}|${ds}" aria-label="${ds ? dLabel(ds) : '오늘에 두기'}"><i></i></button>`).join('')}</div>`).join('')}</div>`;
      const n = open.filter((t) => plan[t.id]).length;
      return `<div class="co5"><p class="co5-s">${n === open.length ? `남은 일 <b>${open.length}개</b>를 모두 <b>${dLabel(opts[0][0])}</b>로 넘겨요.` : n ? `<b>${n}개</b>는 내일로 넘기고, <b>${open.length - n}개</b>는 오늘에 둬요.` : '아무것도 넘기지 않고 오늘에 둬요.'}</p>
        <button type="button" class="co-lnk" data-c5 aria-expanded="${C.more}">${C.more ? '접기' : '하나씩 정하기'}</button>
        ${C.more ? `<div class="co5-l">${open.map((t) => `<div class="co5-r"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><small>${plan[t.id] ? '내일로' : '오늘에 둠'}</small><button type="button" class="tgl5" role="switch" aria-checked="${!!plan[t.id]}" aria-label="${A.esc(t.title)} 내일로 넘기기" data-c5t="${t.id}"></button></div>`).join('')}</div>` : ''}</div>`;
    };

    /* 6~10 */
    const kh = (h) => { const H = Math.floor(h), M = Math.round((h - H) * 60); return `${H < 12 ? '오전' : '오후'} ${H % 12 || 12}시${M ? ` ${M}분` : ''}`; };
    const du = (t) => (t.start != null && t.end != null ? t.end - t.start : 1);
    const duTxt = (h) => `${Math.floor(h) ? `${Math.floor(h)}시간` : ''}${h % 1 ? ` ${Math.round((h % 1) * 60)}분` : ''}`.trim();
    const tom = opts[0][0];
    const busyTom = () => [...A.onDay(tom).filter((x) => x.start != null && !open.includes(x)).map((x) => [x.start, x.end ?? x.start + 1, x.title, false]),
      ...open.filter((t) => plan[t.id] === tom && typeof C.slot[t.id] === 'number').map((t) => [C.slot[t.id], C.slot[t.id] + du(t), t.title, true])].sort((a, b) => a[0] - b[0]);
    const freeFor = (t) => { const b = busyTom().filter((x) => !(x[3] && x[2] === t.title)), d = du(t), out = []; for (let h = 9; h + d <= 18 && out.length < 3; h += 0.5) if (!b.some(([a, e]) => h < e && h + d > a)) { out.push(h); h += Math.max(0, d - 0.5); } return out; };

    /* 11~15 */
    const dMD = (x) => { const y = A.s2d(x); return `${y.getMonth() + 1}월 ${y.getDate()}일`; };
    const fx = (t, v) => { const o = []; if (v && v !== 'done') { if (t.due) { if (v > t.due) o.push(['late', `마감 ${dMD(t.due)}이 지나요`]); else if (v === t.due) o.push(['soon', '넘기면 마감 당일이에요']); } if (t.rep) o.push(['', '반복 할 일이라 이번 회차만 옮겨요']); if (t.gcal) o.push(['', 'Google 일정도 같이 옮겨져요']); } else if (!v && t.due && t.due <= opts[0][0]) o.push(['soon', `마감이 ${t.due === s ? '오늘' : '내일'}이에요`]); return o; };
    const fxHTML = (t, v) => fx(t, v).map(([k, x]) => `<span class="fx ${k}">${k ? '!' : ''}${x}</span>`).join('');
    const WHY = [['time', '시간이 모자랐어요'], ['stuck', '막혔어요'], ['prio', '우선순위가 바뀌었어요'], ['cut', '다른 일이 끼어들었어요']];
    const dest = [[tom, '내일'], [opts[2][0], `${dShort(opts[2][0])}일`], ['', '오늘에 두기'], ['done', '끝냄']];
    /* 16~20: 2 한 장씩에서 파생. 고치기 쉽게: 되돌리기, 앞뒤 이동, 결과 미리 보기, 언제든 마무리 */
    const fri = opts[2][0], whereL = (v) => (v === 'done' ? '끝냄으로' : v === tom ? '내일로' : v ? `${dShort(v)}일로` : '오늘에 두기로');
    const OPT = [[tom, '내일로', '1'], [fri, `${dShort(fri)}일로`, '2'], [null, '오늘에 두기', '3'], ['done', '사실 끝냈어요', '4']];
    const info = (t) => [t.status === 'doing' ? '하던 중' : '시작 전', t.start != null ? A.range(t.start, t.end) : '시간 없음', t.due ? `마감 ${dMD(t.due)}` : '', t.rep ? `${t.rep} 반복` : '', t.gcal ? 'Google Calendar에 있음' : ''].filter(Boolean);
    const nextOpen = (from) => { for (let k = 0; k < open.length; k++) { const j = (from + k) % open.length; if (!C.dec.has(open[j].id)) return j; } return open.length; };
    const decide = (id, v, adv = true) => { C.hist.push([C.i, id, plan[id], C.dec.has(id)]); plan[id] = v; C.dec.add(id); C.last = `"${A.byId(id).title}"을(를) ${whereL(v)} 정했어요`; if (adv) C.i = nextOpen(open.findIndex((t) => t.id === id) + 1); if (CO === 20 && C.i >= open.length) C.rev = true; };
    const undo = () => { const h = C.hist.pop(); if (!h) return; const [i, id, pv, had] = h; plan[id] = pv; if (!had) C.dec.delete(id); C.i = i; C.rev = false; C.last = C.hist.length ? '한 단계 되돌렸어요' : null; };
    const rec = (t) => (t.rep ? [null, `${t.rep} 반복이라 내일 회차가 따로 있어요`] : t.due && t.due <= tom ? [tom, `마감이 ${t.due === s ? '오늘' : '내일'}이라 내일 바로 해요`] : t.status === 'doing' ? [tom, '하던 중이라 이어서 하는 게 좋아요'] : [fri, '급하지 않아서 조금 뒤로 미뤄도 돼요']);
    const cardZ = (t) => `<div class="co2-c"><b>${A.esc(t.title)}</b><small>${info(t).join(', ')}</small></div>`;
    const actsZ = (t, r) => `<div class="cz-a">${OPT.map(([v, l, k]) => { const on = C.dec.has(t.id) && (plan[t.id] ?? null) === v, w = fx(t, v)[0], isR = r && r[0] === v;
      return `<button type="button" class="${on ? 'on' : ''} ${isR ? 'rec' : ''}" data-cz="${t.id}|${v ?? ''}" aria-pressed="${on}"><span><kbd>${k}</kbd>${l}${isR ? '<em>추천</em>' : ''}</span>${w ? `<small class="${w[0]}">${w[1]}</small>` : ''}</button>`; }).join('')}</div>`;
    const undoBar = () => (C.hist.length ? `<p class="cz-undo"><span>${C.last || ''}</span><button type="button" data-czu><kbd>⌫</kbd>되돌리기</button></p>` : '');
    const seg = (t) => `<span class="co-seg" role="radiogroup" aria-label="${A.esc(t.title)}">${OPT.map(([v, l]) => `<button type="button" role="radio" aria-checked="${(plan[t.id] ?? null) === v}" data-czs="${t.id}|${v ?? ''}">${l.replace('로', '').replace('사실 ', '').replace('냈어요', '냄')}</button>`).join('')}</span>`;
    const dots = () => `<span class="cz-dots">${open.map((t, i) => `<button type="button" data-czj="${i}" class="${C.dec.has(t.id) ? 'd' : ''}" aria-current="${i === C.i}" aria-label="${i + 1}번째 ${A.esc(t.title)}, ${C.dec.has(t.id) ? where(plan[t.id]) : '아직 안 정함'}"></button>`).join('')}</span>`;
    const bodyZ = () => {
      const n = open.length, cur = open[C.i];
      if (CO === 16) { if (!cur) return `<div class="co2-sum"><p>이렇게 정했어요. 줄을 누르면 그 카드로 돌아가요.</p><ul class="cz-sum">${open.map((t, i) => `<li><button type="button" data-czj="${i}"><span>${A.esc(t.title)}</span><b>${where(plan[t.id])}</b><em>고치기</em></button></li>`).join('')}</ul></div>${undoBar()}`;
        return `<div class="co2"><p class="co2-n cz-nav"><button type="button" class="cz-pv" data-czj="${C.i - 1}" ${C.i ? '' : 'disabled'}>이전</button><span>${C.i + 1} / ${n}</span>${dots()}<button type="button" class="cz-pv" data-czj="${C.i + 1 < n ? C.i + 1 : n}">${C.i + 1 < n ? '다음' : '정리 보기'}</button></p>${cardZ(cur)}${actsZ(cur)}${undoBar()}</div>`; }
      if (CO === 17) return `<div class="co17"><div class="co17-m">${cur ? `<p class="co2-n"><span>${C.i + 1} / ${n}</span></p>${cardZ(cur)}${actsZ(cur)}` : '<p class="co17-ok">다 정했어요. 오른쪽에서 언제든 바꿀 수 있어요.</p>'}${undoBar()}</div>
        <aside class="co17-l" aria-label="정한 것"><p>정한 것</p>${open.map((t, i) => `<div class="co17-r ${i === C.i ? 'cur' : ''}"><button type="button" class="t" data-czj="${i}">${sd(t)}<span>${A.esc(t.title)}</span></button><button type="button" class="v ${C.dec.has(t.id) ? '' : 'no'}" data-czed="${t.id}" aria-expanded="${C.edit === t.id}">${C.dec.has(t.id) ? where(plan[t.id]) : '아직'}</button>
          ${C.edit === t.id ? `<div class="co17-e" role="menu">${OPT.map(([v, l]) => `<button type="button" role="menuitemradio" aria-checked="${C.dec.has(t.id) && (plan[t.id] ?? null) === v}" data-czs="${t.id}|${v ?? ''}">${l}</button>`).join('')}</div>` : ''}</div>`).join('')}</aside></div>`;
      if (CO === 18) { if (!cur) return `<div class="co2-sum"><p>이렇게 정했어요. 여기서 바로 바꿀 수 있어요.</p><div class="cz-rev">${open.map((t) => `<div class="cz-row"><span class="co-t">${sd(t)}${A.esc(t.title)}</span>${seg(t)}</div>`).join('')}</div><button type="button" class="co-lnk" data-czj="0">카드로 다시 보기</button></div>${undoBar()}`;
        const r = rec(cur); return `<div class="co2"><p class="co2-n"><span>${C.i + 1} / ${n}</span>${dots()}</p>${cardZ(cur)}<p class="cz-rec"><b>추천: ${OPT.find((o) => o[0] === r[0])[1]}</b><span>${r[1]}</span><kbd>Enter</kbd></p>${actsZ(cur, r)}
          <div class="cz-days" role="group" aria-label="다른 날 고르기"><span>다른 날</span>${opts.map(([ds, l]) => `<button type="button" data-cz="${cur.id}|${ds}" aria-pressed="${C.dec.has(cur.id) && plan[cur.id] === ds}">${l}</button>`).join('')}</div>${undoBar()}</div>`; }
      if (CO === 19) return `<div class="co19">${open.map((t, i) => i === C.i ? `<div class="co19-cur"><p class="co2-n"><span>${i + 1} / ${n}</span>${C.dec.has(t.id) ? `<span>지금: ${where(plan[t.id])}</span>` : ''}</p>${cardZ(t)}${actsZ(t)}</div>`
          : C.dec.has(t.id) ? `<button type="button" class="co19-d" data-czj="${i}"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><b>${where(plan[t.id])}</b><em>고치기</em></button>` : `<div class="co19-n"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><em>아직</em></div>`).join('')}${cur ? '' : '<p class="co19-ok">다 정했어요. 줄을 누르면 다시 고칠 수 있어요.</p>'}</div>${undoBar()}`;
      /* 20 빠르게 넘기고 목록에서 고치기 */
      if (!C.rev && cur) return `<div class="co2"><p class="co2-n"><span>${C.i + 1} / ${n}</span><button type="button" class="co-lnk" data-czrev>목록에서 한 번에 보기</button></p>${cardZ(cur)}${actsZ(cur)}<button type="button" class="cz-skip" data-czskip>건너뛰기 <span>정하지 않으면 내일로 넘어가요</span></button>${undoBar()}</div>`;
      return `<div class="cz-rev20"><p>이렇게 넘겨요. 바꿀 줄만 고치세요.</p>${open.map((t) => { const fxs = fx(t, plan[t.id]); return `<div class="cz-row ${C.dec.has(t.id) ? '' : 'skip'}"><div><span class="co-t">${sd(t)}${A.esc(t.title)}${C.dec.has(t.id) ? '' : '<em class="cz-tag">건너뜀, 기본값 내일</em>'}</span>${fxs.length ? `<p class="co11-fx">${fxHTML(t, plan[t.id])}</p>` : ''}</div>${seg(t)}</div>`; }).join('')}<button type="button" class="co-lnk" data-czcard>카드로 돌아가기</button></div>${undoBar()}`;
    };
    const bodyY = () => {
      if (CO >= 16) return bodyZ();
      if (CO === 11) { const warn = open.filter((t) => fx(t, plan[t.id]).some((x) => x[0])).length;
        return `<div class="co11">${open.map((t) => `<div class="co11-r"><div class="co11-h"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><span class="co-seg" role="radiogroup" aria-label="${A.esc(t.title)}">${dest.map(([v, l]) => `<button type="button" role="radio" aria-checked="${(plan[t.id] || '') === v}" data-c11="${t.id}|${v}">${l}</button>`).join('')}</span></div>${fx(t, plan[t.id]).length ? `<p class="co11-fx">${fxHTML(t, plan[t.id])}</p>` : ''}</div>`).join('')}</div>
          <p class="co-tip">${warn ? `확인할 일이 ${warn}개 있어요. 느낌표 줄을 보세요.` : '넘겨도 문제없어요.'}</p>`; }
      if (CO === 12) { const H0 = 9, H1 = 19, rowH = 22;
        const blk = (t, h, cls, attr) => `<button type="button" class="co12-b ${cls}" style="--y:${(h - H0) * rowH * 2}px;--h:${du(t) * rowH * 2}px" ${attr}>${A.esc(t.title)}<small>${kh(h)}</small></button>`;
        const todayB = open.map((t) => { const moved = plan[t.id] === tom; const h = t.start ?? 9; return blk(t, h, `${moved ? 'ghost' : ''} ${C.sel === t.id ? 'sel' : ''}`, `data-c12="${t.id}" aria-pressed="${C.sel === t.id}"`); }).join('');
        const tomB = A.onDay(tom).filter((x) => x.start != null && !open.includes(x)).map((x) => `<span class="co12-b fixed" style="--y:${(x.start - H0) * rowH * 2}px;--h:${du(x) * rowH * 2}px">${A.esc(x.title)}<small>${kh(x.start)}</small></span>`).join('') + open.filter((t) => plan[t.id] === tom).map((t) => { const h = typeof C.slot[t.id] === 'number' ? C.slot[t.id] : t.start ?? 9; return blk(t, h, 'mine', `data-c12="${t.id}"`); }).join('');
        const grid = [...Array((H1 - H0) * 2)].map((_, i) => `<button type="button" class="co12-c" data-c12h="${H0 + i / 2}" aria-label="내일 ${kh(H0 + i / 2)}에 놓기" ${C.sel ? '' : 'tabindex="-1"'}></button>`).join('');
        const hrs = [...Array(H1 - H0)].map((_, i) => `<span style="--y:${i * rowH * 2}px">${(H0 + i) % 12 || 12}${H0 + i < 12 ? 'am' : 'pm'}</span>`).join('');
        return `<p class="co-tip">${C.sel ? `"${A.esc(A.byId(C.sel).title)}"를 골랐어요. 내일 칸의 시간을 누르면 거기로 옮겨요. 오늘 칸을 다시 누르면 오늘에 둬요.` : '오늘 남은 일을 누른 뒤 내일 칸의 시간을 누르세요.'}</p>
          <div class="co12" style="--rows:${(H1 - H0) * 2};--rh:${rowH}px"><div class="co12-hd"><span></span><b>오늘 ${dShort(s)}</b><b>내일 ${dShort(tom)}</b></div><div class="co12-bd"><div class="co12-hr">${hrs}</div><div class="co12-col">${todayB}</div><div class="co12-col t ${C.sel ? 'arm' : ''}">${grid}${tomB}</div></div></div>`; }
      if (CO === 13) { const rest = open.filter((t) => !C.top.includes(t.id));
        return `<p class="co13-h">내일 꼭 할 일을 세 개까지 골라 주세요.</p><ol class="co13-s">${[0, 1, 2].map((i) => { const id = C.top[i], t = id && A.byId(id); return `<li>${t ? `<button type="button" data-c13x="${id}" aria-label="${A.esc(t.title)} 빼기"><span class="n">${i + 1}</span>${sd(t)}<b>${A.esc(t.title)}</b>${ic.x}</button>` : `<span class="emp"><span class="n">${i + 1}</span>비어 있어요</span>`}</li>`; }).join('')}</ol>
          <div class="co13-r"><p>남은 일</p>${rest.map((t) => `<button type="button" data-c13="${t.id}" ${C.top.length >= 3 ? 'disabled' : ''}>${sd(t)}<span class="co13-tt">${A.esc(t.title)}</span><em>${C.top.length >= 3 ? '' : '내일 꼭 할 일에 넣기'}</em></button>`).join('') || '<small>모두 골랐어요</small>'}</div>
          ${rest.length ? `<div class="co13-o"><span>고르지 않은 일은</span><span class="co-seg" role="radiogroup" aria-label="고르지 않은 일">${[['', '오늘에 두기'], [dest[1][0], dest[1][1] + '로']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${(C.rest || '') === v}" data-c13o="${v}">${l}</button>`).join('')}</span></div>` : ''}`; }
      if (CO === 14) { return `<div class="co14" role="listbox" aria-label="남은 할 일" tabindex="0" data-c14l aria-activedescendant="co14-${C.f}">${open.map((t, i) => `<div class="co14-r ${i === C.f ? 'f' : ''}" id="co14-${i}" role="option" aria-selected="${i === C.f}" data-c14="${i}"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><b>${where(plan[t.id])}</b></div>`).join('')}</div>
          <p class="co14-k"><kbd>↑</kbd><kbd>↓</kbd><span>고르기</span><kbd>→</kbd><span>내일</span><kbd>F</kbd><span>${dest[1][1]}</span><kbd>←</kbd><span>오늘에 두기</span><kbd>D</kbd><span>끝냄</span></p>`; }
      return `<div class="co15">${open.map((t) => `<div class="co15-r"><div class="co15-h"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><span class="co-seg" role="radiogroup" aria-label="${A.esc(t.title)}">${[[tom, '내일로'], ['', '오늘에 두기']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${(plan[t.id] || '') === v}" data-c15="${t.id}|${v}">${l}</button>`).join('')}</span></div>
          <div class="co15-w" role="radiogroup" aria-label="못 끝낸 이유"><span>못 끝낸 이유</span>${WHY.map(([k, l]) => `<button type="button" role="radio" aria-checked="${C.why[t.id] === k}" data-c15w="${t.id}|${k}">${l}</button>`).join('')}</div></div>`).join('')}</div>
        <p class="co-tip">고른 이유는 회고 초안의 "못 끝낸 이유"에 들어가요.</p>`;
    };
    const bodyX = () => {
      if (CO >= 11) return bodyY();
      if (CO === 6) { open.forEach((t) => { if (plan[t.id] === tom && !(t.id in C.slot)) { const fr = freeFor(t); C.slot[t.id] = fr.length ? fr[0] : 'all'; } }); const bt = busyTom();
        return `<div class="co6"><div class="co6-l">${open.map((t) => { const v = plan[t.id], sl = C.slot[t.id], fr = freeFor(t);
            return `<div class="co6-r"><p class="co-t">${sd(t)}${A.esc(t.title)}<small>${duTxt(du(t))}</small></p><div class="co6-c" role="radiogroup" aria-label="${A.esc(t.title)} 내일 시간">${[...new Set([...(typeof sl === 'number' ? [sl] : []), ...fr])].sort((a, b) => a - b).map((h) => `<button type="button" role="radio" aria-checked="${v === tom && sl === h}" data-c6="${t.id}|${h}">${kh(h)}</button>`).join('')}<button type="button" role="radio" aria-checked="${v === tom && (sl === 'all' || sl == null)}" data-c6="${t.id}|all">시간 없이</button><button type="button" role="radio" aria-checked="${!v}" data-c6="${t.id}|keep">오늘에 두기</button></div></div>`; }).join('')}</div>
          <aside class="co6-tl" aria-label="내일 일정"><p>내일 ${dLabel(tom)}</p><ol>${bt.map(([a, e, ti, mine]) => `<li class="${mine ? 'mine' : ''}"><span>${kh(a)}</span><b>${A.esc(ti)}</b></li>`).join('') || '<li class="emp">잡힌 일정 없음</li>'}</ol><small>오전 9시부터 오후 6시 사이 빈 시간을 골라 드려요</small></aside></div>`; }
      if (CO === 7) { const Qx = (t) => (t.status === 'doing' ? `"${A.esc(t.title)}"는 하던 중이었어요. 내일 이어서 할까요?` : `"${A.esc(t.title)}"는 아직 시작 못 했어요. 언제 할까요?`);
        const ans = [[tom, '내일 할게요'], [opts[2][0], `${dShort(opts[2][0])}일에 할게요`], [null, '오늘에 둘게요'], ['done', '사실 끝냈어요']];
        const said = (v) => (ans.find((a) => a[0] === v) || [0, '오늘에 둘게요'])[1];
        return `<div class="co7" role="log">${open.slice(0, C.i).map((t, i) => `<p class="q">${Qx(t)}</p><p class="a"><button type="button" data-c7r="${i}" aria-label="다시 고르기">${said(plan[t.id])}</button></p>`).join('')}
          ${C.i < open.length ? `<p class="q now">${Qx(open[C.i])}</p><div class="co7-c">${ans.map(([v, l]) => `<button type="button" data-c7="${v ?? ''}">${l}</button>`).join('')}</div>` : `<p class="q">다 정했어요. 회고 초안으로 넘어갈까요?</p>`}</div>`; }
      if (CO === 8) { const cap = 9, booked = A.onDay(tom).filter((x) => x.start != null && !open.includes(x)).reduce((a, x) => a + du(x), 0), picked = open.filter((t) => plan[t.id]).reduce((a, t) => a + du(t), 0), over = booked + picked > cap;
        return `<p class="co8-h">내일 이어서 할 일만 눌러서 고르세요. 안 고른 일은 오늘에 남아요.</p><div class="co8">${open.map((t) => `<button type="button" class="co8-t" aria-pressed="${!!plan[t.id]}" data-c8="${t.id}">${sd(t)}<b>${A.esc(t.title)}</b><small>${duTxt(du(t))}${t.status === 'doing' ? ', 하던 중' : ''}</small><span class="co8-m" aria-hidden="true">${ic.check}</span></button>`).join('')}</div>
          <div class="co8-cap"><p><span>내일 일할 시간 ${cap}시간</span><b class="${over ? 'over' : ''}">${duTxt(booked + picked) || '0시간'} 찼어요</b></p><span class="co8-bar" role="img" aria-label="이미 잡힌 ${duTxt(booked)}, 고른 일 ${duTxt(picked) || '0시간'}"><i class="b" style="--w:${Math.min(1, booked / cap)}"></i><i class="p" style="--w:${Math.min(1, picked / cap)}"></i></span><small>이미 잡힌 일정 ${duTxt(booked) || '없음'}, 고른 일 ${duTxt(picked) || '없음'}${over ? '. 일하는 시간을 넘어요' : ''}</small></div>`; }
      if (CO === 9) { const n = C.pick.size;
        return `<div class="co9-top"><button type="button" class="co-lnk" data-c9all>${n === open.length ? '모두 풀기' : '모두 고르기'}</button><span>${n ? `${n}개 고름` : '줄을 눌러 고르세요'}</span></div>
          <div class="co9" role="listbox" aria-multiselectable="true" aria-label="남은 할 일">${open.map((t) => `<button type="button" role="option" aria-selected="${C.pick.has(t.id)}" data-c9="${t.id}"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><em>${where(plan[t.id])}</em></button>`).join('')}</div>
          <div class="co9-bar ${n ? '' : 'off'}"><span>${n ? `고른 ${n}개를` : '고른 일을'}</span>${[[tom, '내일'], [opts[1][0], dShort(opts[1][0]) + '일'], [opts[2][0], dShort(opts[2][0]) + '일'], ['', '오늘에 두기'], ['done', '끝냄']].map(([v, l]) => `<button type="button" data-c9to="${v}" ${n ? '' : 'disabled'}>${l}</button>`).join('')}</div>`; }
      /* 10 이월과 초안을 한 화면에 */
      const doneL = A.onDay(s).filter((t) => t.status === 'done'), cm = A.commits.filter((c) => c.date === s), car = open.filter((t) => plan[t.id]);
      return `<div class="co10"><div class="co10-l"><p>남은 일</p>${open.map((t) => `<div class="co10-r"><span class="co-t">${sd(t)}${A.esc(t.title)}</span><button type="button" class="co10-p" aria-pressed="${!!plan[t.id]}" data-c10="${t.id}">${plan[t.id] ? `${ic.right}내일로` : '오늘에 둠'}</button></div>`).join('')}</div>
        <div class="co10-d"><p>회고 초안 <small>바꾸면 바로 고쳐져요</small></p><pre>## ${A.label(s)}\n\n완료한 일\n${doneL.map((t) => `- ${t.title}`).join('\n') || '- 없음'}\n\n남긴 커밋\n${cm.map((c) => `- ${c.msg}`).join('\n') || '- 없음'}\n\n내일로 넘긴 일\n${car.map((t) => `- ${t.title}`).join('\n') || '- 없음'}\n\n배운 점: </pre></div></div>`;
    };
    const draw2 = (focus) => { const f = focus && document.activeElement?.getAttribute && [...document.activeElement.attributes].find((a) => a.name.startsWith('data-c'));
      const undec = open.filter((t) => !C.dec.has(t.id)).length;
      const lbl = CO >= 16 ? (undec && open.length ? `남은 ${undec}개는 내일로 하고 초안 만들기` : '넘기고 회고 초안 만들기') : CO === 10 ? '넘기고 회고로 저장' : (CO === 2 || CO === 7) && C.i < open.length ? null : CO === 5 && !open.some((t) => plan[t.id]) ? '회고 초안 만들기' : '넘기고 회고 초안 만들기';
      d.innerHTML = `<form class="dg co co-${CO}" method="dialog">${head}${body()}${lbl ? go(lbl) : `<div class="foot"><button class="btn" value="x">취소</button></div>`}</form>`;
      if (f) d.querySelector(`[${f.name}="${f.value}"]`)?.focus(); else if (focus) d.querySelector('[data-c2], [data-c3], .btn-p')?.focus();
      if (CO === 14) d.querySelector('[data-c14l]')?.focus();
      const mk = $('#mk', d); if (mk) mk.onclick = () => { if (CO === 13) open.forEach((t) => { plan[t.id] = C.top.includes(t.id) ? tom : C.rest || null; }); if (CO === 15) { const ws = open.filter((t) => C.why[t.id]); return finish(d, s, plan, C.slot, ws.length ? `\n\n못 끝낸 이유\n${ws.map((t) => `- ${t.title}: ${WHY.find((w) => w[0] === C.why[t.id])[1]}`).join('\n')}` : ''); } if (CO === 10) { finish(d, s, plan, C.slot); A.retro.add(s); d.close(); A.toast('넘기고 회고로 저장했어요'); A.rerender(); return; } finish(d, s, plan, C.slot); }; };
    d.onclick = (e) => { const g = (a) => e.target.closest(`[${a}]`); let el;
      if ((el = g('data-czu'))) { undo(); draw2(); d.querySelector('[data-cz], [data-czs], .btn-p')?.focus(); return; }
      if ((el = g('data-cz'))) { const [id, v] = el.dataset.cz.split('|'); decide(id, v || null); draw2(); d.querySelector('[data-cz], [data-czj], .btn-p')?.focus(); return; }
      if ((el = g('data-czs'))) { const [id, v] = el.dataset.czs.split('|'); decide(id, v || null, false); C.edit = null; draw2(true); return; }
      if ((el = g('data-czj'))) { C.i = Math.max(0, Math.min(open.length, +el.dataset.czj)); C.rev = false; draw2(); d.querySelector('[data-cz]')?.focus(); return; }
      if ((el = g('data-czed'))) { C.edit = C.edit === el.dataset.czed ? null : el.dataset.czed; draw2(); d.querySelector('.co17-e button')?.focus(); return; }
      if (g('data-czskip')) { C.i += 1; if (C.i >= open.length) C.rev = true; draw2(); d.querySelector('[data-cz], [data-czs]')?.focus(); return; }
      if (g('data-czrev')) { C.rev = true; draw2(); d.querySelector('[data-czs]')?.focus(); return; }
      if (g('data-czcard')) { C.rev = false; C.i = Math.max(0, open.findIndex((t) => !C.dec.has(t.id))); draw2(); d.querySelector('[data-cz]')?.focus(); return; }
      if ((el = g('data-c11'))) { const [id, v] = el.dataset.c11.split('|'); plan[id] = v || null; draw2(true); return; }
      if ((el = g('data-c12h'))) { if (!C.sel) return; plan[C.sel] = tom; C.slot[C.sel] = +el.dataset.c12h; C.sel = null; draw2(); return; }
      if ((el = g('data-c12'))) { const id = el.dataset.c12; if (C.sel === id) { plan[id] = null; delete C.slot[id]; C.sel = null; } else C.sel = id; draw2(); d.querySelector(`[data-c12="${id}"]`)?.focus(); return; }
      if ((el = g('data-c13'))) { if (C.top.length < 3) C.top.push(el.dataset.c13); draw2(); d.querySelector('[data-c13], .btn-p')?.focus(); return; }
      if ((el = g('data-c13x'))) { C.top = C.top.filter((x) => x !== el.dataset.c13x); draw2(); d.querySelector('[data-c13]')?.focus(); return; }
      if ((el = g('data-c13o'))) { C.rest = el.dataset.c13o || null; draw2(true); return; }
      if ((el = g('data-c14'))) { C.f = +el.dataset.c14; draw2(); return; }
      if ((el = g('data-c15w'))) { const [id, k] = el.dataset.c15w.split('|'); C.why[id] = C.why[id] === k ? null : k; draw2(true); return; }
      if ((el = g('data-c15'))) { const [id, v] = el.dataset.c15.split('|'); plan[id] = v || null; draw2(true); return; }
      if ((el = g('data-c6'))) { const [id, h] = el.dataset.c6.split('|'); if (h === 'keep') { plan[id] = null; delete C.slot[id]; } else { plan[id] = tom; C.slot[id] = h === 'all' ? 'all' : +h; } draw2(true); return; }
      if ((el = g('data-c7'))) { plan[open[C.i].id] = el.dataset.c7 || null; C.i++; draw2(); d.querySelector('[data-c7], .btn-p')?.focus(); return; }
      if ((el = g('data-c7r'))) { C.i = +el.dataset.c7r; draw2(); d.querySelector('[data-c7]')?.focus(); return; }
      if ((el = g('data-c8'))) { const id = el.dataset.c8; plan[id] = plan[id] ? null : tom; draw2(true); return; }
      if ((el = g('data-c9'))) { const id = el.dataset.c9; C.pick.has(id) ? C.pick.delete(id) : C.pick.add(id); draw2(true); return; }
      if (g('data-c9all')) { if (C.pick.size === open.length) C.pick.clear(); else open.forEach((t) => C.pick.add(t.id)); draw2(true); return; }
      if ((el = g('data-c9to'))) { const v = el.dataset.c9to; C.pick.forEach((id) => { plan[id] = v || null; }); const n = C.pick.size; C.pick.clear(); A.toast(`${n}개를 ${v === 'done' ? '끝냄으로' : v ? dShort(v) + '일로' : '오늘에 두기로'} 정했어요`); draw2(); d.querySelector('[data-c9]')?.focus(); return; }
      if ((el = g('data-c10'))) { const id = el.dataset.c10; plan[id] = plan[id] ? null : tom; draw2(true); return; }
      if ((el = g('data-c1'))) { const [id, k] = el.dataset.c1.split('|'); if (k === 'tom') { plan[id] = opts[0][0]; C.other = null; } else if (k === 'keep') { plan[id] = null; C.other = null; } else { C.other = C.other === id ? null : id; if (plan[id] === opts[0][0] || !plan[id]) plan[id] = opts[1][0]; } draw2(true); return; }
      if ((el = g('data-c1d'))) { const [id, ds] = el.dataset.c1d.split('|'); plan[id] = ds; C.other = null; draw2(); d.querySelector(`[data-c1="${id}|other"]`)?.focus(); return; }
      if ((el = g('data-c2'))) { plan[open[C.i].id] = el.dataset.c2 || null; C.i++; draw2(); d.querySelector('[data-c2], .btn-p')?.focus(); return; }
      if ((el = g('data-c2i'))) { C.i = 0; draw2(); d.querySelector('[data-c2]')?.focus(); return; }
      if ((el = g('data-c3'))) { const id = el.dataset.c3; plan[id] = plan[id] ? null : opts[0][0]; draw2(); d.querySelector(`[data-c3="${id}"]`)?.focus(); return; }
      if ((el = g('data-c4'))) { const [id, ds] = el.dataset.c4.split('|'); plan[id] = ds || null; draw2(true); return; }
      if (g('data-c5')) { C.more = !C.more; draw2(true); return; }
      if ((el = g('data-c5t'))) { const id = el.dataset.c5t; plan[id] = plan[id] ? null : opts[0][0]; draw2(true); return; }
    };
    const keyZ = (e) => { if (e.target.matches('input, textarea')) return; const cur = open[C.i]; const k = e.key;
      if ((k === 'Backspace' || k.toLowerCase() === 'z') && C.hist.length) { e.preventDefault(); undo(); draw2(); return; }
      if (!cur || (CO === 20 && C.rev)) return;
      if (/^[1-4]$/.test(k)) { e.preventDefault(); decide(cur.id, OPT[+k - 1][0]); draw2(); d.querySelector('[data-cz], .btn-p')?.focus(); return; }
      if (CO === 18 && k === 'Enter' && e.target.matches('[data-cz], .co2-c, dialog, form')) { e.preventDefault(); decide(cur.id, rec(cur)[0]); draw2(); d.querySelector('[data-cz], .btn-p')?.focus(); return; }
      if (CO === 16 && (k === 'ArrowLeft' || k === 'ArrowRight') && !e.target.matches('[role=radio]')) { e.preventDefault(); C.i = Math.max(0, Math.min(open.length, C.i + (k === 'ArrowRight' ? 1 : -1))); draw2(); d.querySelector('[data-cz]')?.focus(); } };
    d.onkeydown = CO >= 16 ? keyZ : CO !== 14 ? null : (e) => { if (!e.target.closest('[data-c14l]')) return; const k = e.key, t = open[C.f]; if (!t) return;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); C.f = Math.max(0, Math.min(open.length - 1, C.f + (k === 'ArrowDown' ? 1 : -1))); draw2(); return; }
      const v = k === 'ArrowRight' ? tom : k === 'ArrowLeft' ? null : k.toLowerCase() === 'd' ? 'done' : k.toLowerCase() === 'f' ? dest[1][0] : undefined; if (v === undefined) return; e.preventDefault(); plan[t.id] = v; if (C.f < open.length - 1) C.f++; draw2(); };
    draw2(); if (!d.open) d.showModal(); d.querySelector('[data-c14l], [data-c1], [data-c2], [data-c3], [data-c4], [data-c5], [data-c6], [data-c7], [data-c8], [data-c9], [data-c10], [data-c11], [data-c12], [data-c13], [data-c15], .btn-p')?.focus();
  };
  if (Q.get('close') === '1') setTimeout(() => { A.s.date = A.TODAY; A.closeDay(); }, 300);
})();
