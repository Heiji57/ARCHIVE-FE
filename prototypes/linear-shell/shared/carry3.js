/* 하루 닫기: 내일로 이월 21~25 (2 한 장씩에서 파생). 기본은 22 묻고 답하기. ?co=21..25&close=1 (1~20은 sidevar.js)
   공통: 숫자 키 1~4, ⌫ 되돌리기, 고르기 전에 결과 미리 보기, 다 안 정해도 언제든 마무리 */
(() => {
  const A = window.ARC, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), CO = Q.get('co') ? +Q.get('co') : 22; /* 22 묻고 답하기로 정함 */
  if (CO < 21 || CO > 25) return;

  const dShort = (x) => { const y = A.s2d(x); return `${A.DOW[y.getDay()]} ${y.getDate()}`; };
  const dMD = (x) => { const y = A.s2d(x); return `${y.getMonth() + 1}월 ${y.getDate()}일`; };
  const dLong = (x) => { const y = A.s2d(x); return `${y.getMonth() + 1}월 ${y.getDate()}일 ${A.DOW[y.getDay()]}요일`; };
  const du = (t) => (t.start != null && t.end != null ? t.end - t.start : 1);
  const hTxt = (h) => `${Math.floor(h) ? `${Math.floor(h)}시간` : ''}${h % 1 ? ` ${Math.round((h % 1) * 60)}분` : ''}`.trim() || '0시간';

  function finish(d, s, plan, extra = '') {
    const cm = A.commits.filter((c) => c.date === s); let carried = 0, closed = 0;
    Object.entries(plan).forEach(([id, v]) => { const t = A.byId(id); if (v === 'done') { t.status = 'done'; closed++; } else if (v) { t.date = v; carried++; } });
    const lines = A.onDay(s).filter((t) => t.status === 'done').map((t) => `- ${t.title}`).join('\n'), cl = cm.map((c) => `- ${c.msg} (${c.repo})`).join('\n');
    d.innerHTML = `<form class="dg" method="dialog"><h2>회고 초안</h2>
      <pre>## ${A.label(s)}\n\n완료한 일\n${lines || '- 없음'}\n\n남긴 커밋\n${cl || '- 없음'}\n\n넘긴 일 ${carried}개${closed ? `, 끝냄으로 바꾼 일 ${closed}개` : ''}${extra}\n\n배운 점: </pre>
      <div class="foot"><button class="btn" value="x">닫기</button><button class="btn btn-p" id="sv" value="x" type="button">회고로 저장</button></div></form>`;
    $('#sv', d).onclick = () => { A.retro.add(s); d.close(); A.toast('회고로 저장했어요. 달력에 책갈피가 생겼어요'); A.rerender(); };
    A.rerender(); $('#sv', d).focus();
  }

  A.closeDay = () => {
    const s = A.s.date, d = A.dlg(), st = A.stats(s);
    const open = A.onDay(s).filter((t) => t.status !== 'done' && !t.until);
    const tom = A.add(s, 1), fri = A.add(s, 3), nm = A.add(s, ((8 - A.s2d(s).getDay()) % 7) || 7);
    const DAYS = [[tom, '내일'], [A.add(s, 2), dShort(A.add(s, 2))], [fri, dShort(fri)], [nm, '다음 주 월']].filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i);
    const OPT = [[tom, '내일로'], [fri, `${dShort(fri)}일로`], [null, '오늘에 두기'], ['done', '사실 끝냈어요']];
    const plan = {}; open.forEach((t) => { plan[t.id] = tom; });
    const C = { i: 0, dec: new Set(), hist: [], last: null, q2: false, edit: null };

    const where = (v) => (v === 'done' ? '끝냄' : v === tom ? '내일' : v ? `${dShort(v)}일` : '오늘에 둠');
    const whereL = (v) => (v === 'done' ? '끝냄으로' : v === tom ? '내일로' : v ? `${dShort(v)}일로` : '오늘에 두기로');
    const capTom = (extra = []) => { const base = A.onDay(tom).filter((x) => x.status !== 'done' && !open.includes(x)); const mv = open.filter((t) => plan[t.id] === tom && C.dec.has(t.id)).concat(extra.filter((t) => !(plan[t.id] === tom && C.dec.has(t.id)))); return { base, mv, h: [...base, ...mv].reduce((a, t) => a + du(t), 0) }; };
    const fx = (t, v) => { const o = [];
      if (v && v !== 'done') { if (t.due) { if (v > t.due) o.push(['late', `마감 ${dMD(t.due)}이 지나요`]); else if (v === t.due) o.push(['soon', '넘기면 마감 당일이에요']); }
        if (t.rep) o.push(['', '반복 할 일이라 이번 회차만 옮겨요']); if (t.gcal) o.push(['', 'Google 일정도 같이 옮겨져요']);
        if (CO === 23 && v === tom && capTom([t]).h > 8) o.push(['soon', '내일이 8시간을 넘어요']); }
      else if (!v && t.due && t.due <= tom) o.push(['soon', `마감이 ${t.due === s ? '오늘' : '내일'}이에요`]);
      return o; };
    const fxHTML = (t, v) => fx(t, v).map(([k, x]) => `<span class="fx ${k}">${k ? '!' : ''}${x}</span>`).join('');
    const info = (t) => [t.status === 'doing' ? '하던 중' : '시작 전', t.start != null ? A.range(t.start, t.end) : '시간 없음', t.due ? `마감 ${dMD(t.due)}` : '', t.rep ? `${t.rep} 반복` : '', t.gcal ? 'Google Calendar에 있음' : ''].filter(Boolean);
    const card = (t) => `<div class="co2-c"><b>${A.esc(t.title)}</b><small>${info(t).join(', ')}</small></div>`;
    const nextOpen = (from) => { for (let k = 0; k < open.length; k++) { const j = (from + k) % open.length; if (!C.dec.has(open[j].id)) return j; } return open.length; };
    const decide = (id, v, adv = true) => { C.hist.push([C.i, id, plan[id], C.dec.has(id)]); plan[id] = v; C.dec.add(id); C.q2 = false; C.edit = null;
      C.last = `"${A.byId(id).title}"을(를) ${whereL(v)} 정했어요`; if (adv) C.i = nextOpen(open.findIndex((t) => t.id === id) + 1); };
    const undo = () => { const h = C.hist.pop(); if (!h) return; const [i, id, pv, had] = h; plan[id] = pv; if (!had) C.dec.delete(id); C.i = i; C.q2 = false; C.last = C.hist.length ? '한 단계 되돌렸어요' : null; };
    /* 25: 이 기록 다음에 한 것 모두 되돌리기 */
    const rewind = (n) => { while (C.hist.length > n) undo(); C.last = `${n + 1}번째 기록 직후로 되돌렸어요`; };
    const acts = (t, list = OPT) => `<div class="cz-a">${list.map(([v, l], i) => { const on = C.dec.has(t.id) && (plan[t.id] ?? null) === v, w = v === 'other' ? null : fx(t, v)[0];
      return `<button type="button" class="${on ? 'on' : ''}" data-cy="${t.id}|${v ?? ''}" aria-pressed="${on}"><span><kbd>${i + 1}</kbd>${l}</span>${w ? `<small class="${w[0]}">${w[1]}</small>` : ''}</button>`; }).join('')}</div>`;
    const undoBar = () => (C.hist.length ? `<p class="cz-undo"><span>${C.last || ''}</span><button type="button" data-cyu><kbd>⌫</kbd>되돌리기</button></p>` : '');
    const seg = (t) => `<span class="co-seg" role="radiogroup" aria-label="${A.esc(t.title)}">${OPT.map(([v, l]) => `<button type="button" role="radio" aria-checked="${C.dec.has(t.id) && (plan[t.id] ?? null) === v}" data-cys="${t.id}|${v ?? ''}">${l.replace('로', '').replace('사실 ', '').replace('냈어요', '냄')}</button>`).join('')}</span>`;

    const body = () => {
      const n = open.length, cur = open[C.i];
      if (!n) return '<p class="co-none">남은 일이 없어요.</p>';
      /* 21 필름 줄: 위에 모든 장이 작게, 누르면 그 장으로 */
      if (CO === 21) return `<div class="c21"><div class="c21-s" role="tablist" aria-label="남은 일">${open.map((t, i) => `<button type="button" role="tab" data-cyj="${i}" aria-selected="${i === C.i}" class="${C.dec.has(t.id) ? 'd' : ''}"><span>${A.esc(t.title)}</span><b>${C.dec.has(t.id) ? where(plan[t.id]) : '아직'}</b></button>`).join('')}</div>
        ${cur ? `<p class="co2-n"><span>${C.i + 1} / ${n}</span><span class="c21-k"><kbd>←</kbd><kbd>→</kbd>로 장 넘기기</span></p>${card(cur)}${acts(cur)}` : '<p class="c-ok">다 정했어요. 위에서 아무 장이나 누르면 다시 고칠 수 있어요.</p>'}${undoBar()}</div>`;
      /* 22 묻고 답하기 두 단계: 넘길지 먼저, 다른 날이면 언제인지 */
      if (CO === 22) { const trail = open.filter((t) => C.dec.has(t.id)).map((t) => `<button type="button" class="c22-a" data-cyj="${open.indexOf(t)}"><span>${A.esc(t.title)}</span><b>${where(plan[t.id])}</b><em>바꾸기</em></button>`).join('');
        const q = cur && (C.q2 ? `<div class="c22-q"><p class="c22-ask">언제 할까요?</p>${acts(cur, DAYS.slice(1).map(([v, l]) => [v, l === '다음 주 월' ? l : `${l}일`]))}<button type="button" class="co-lnk" data-cyq="0">앞 질문으로</button></div>`
          : `<div class="c22-q"><p class="c22-ask">"${A.esc(cur.title)}" 내일 이어서 할까요?</p><p class="c22-i">${info(cur).join(', ')}</p>${acts(cur, [[tom, '네, 내일'], ['other', '다른 날에'], [null, '오늘에 두기'], ['done', '이미 끝냈어요']])}</div>`);
        return `<div class="c22">${trail ? `<div class="c22-t" aria-label="지금까지 답">${trail}</div>` : ''}${q || '<p class="c-ok">다 답했어요. 위의 답을 누르면 그 질문으로 돌아가요.</p>'}${undoBar()}</div>`; }
      /* 23 카드 + 내일 하루 용량 */
      if (CO === 23) { const c = capTom(), pct = Math.min(100, (c.h / 8) * 100), over = c.h > 8;
        return `<div class="c23"><div class="c23-m">${cur ? `<p class="co2-n"><span>${C.i + 1} / ${n}</span><span>${du(cur) ? hTxt(du(cur)) : ''} 걸리는 일</span></p>${card(cur)}${acts(cur)}` : '<p class="c-ok">다 정했어요. 오른쪽에서 내일로 간 일을 뺄 수 있어요.</p>'}${undoBar()}</div>
          <aside class="c23-r" aria-label="내일 하루"><p><b>내일 ${dMD(tom)}</b><span class="${over ? 'over' : ''}">${hTxt(c.h)} / 8시간</span></p><div class="c23-bar ${over ? 'over' : ''}" role="img" aria-label="내일 계획 ${hTxt(c.h)}, 8시간 중"><i style="width:${pct}%"></i></div>
            <ul>${c.base.map((t) => `<li><span>${A.esc(t.title)}</span><small>${hTxt(du(t))}</small></li>`).join('')}${c.mv.map((t) => `<li class="mv"><span>${A.esc(t.title)}</span><small>${hTxt(du(t))}</small><button type="button" data-cys="${t.id}|" aria-label="${A.esc(t.title)} 내일에서 빼기">빼기</button></li>`).join('')}</ul>
            ${c.base.length + c.mv.length ? '' : '<small>아직 비어 있어요</small>'}</aside></div>`; }
      /* 24 바구니: 버튼이 곧 바구니, 바구니 속 이름을 누르면 다시 카드로 */
      if (CO === 24) return `<div class="c24">${cur ? `<p class="co2-n"><span>${C.i + 1} / ${n}</span><span>아래 칸을 누르거나 숫자 키로 넣어요</span></p>${card(cur)}` : '<p class="c-ok">다 넣었어요. 칸 속 이름을 누르면 카드로 꺼내 다시 정해요.</p>'}
        <div class="c24-b">${OPT.map(([v, l], i) => { const inB = open.filter((t) => C.dec.has(t.id) && (plan[t.id] ?? null) === v), w = cur && fx(cur, v)[0];
          return `<div class="c24-k"><button type="button" class="c24-h" ${cur ? `data-cy="${cur.id}|${v ?? ''}"` : 'disabled'}><span><kbd>${i + 1}</kbd>${l}</span><em>${inB.length}</em>${w ? `<small class="${w[0]}">${w[1]}</small>` : ''}</button>
            <div class="c24-i">${inB.map((t) => `<button type="button" data-cyj="${open.indexOf(t)}" aria-label="${A.esc(t.title)} 꺼내서 다시 정하기">${A.esc(t.title)}</button>`).join('')}</div></div>`; }).join('')}</div>${undoBar()}</div>`;
      /* 25 정한 순서 기록: 아무 줄로 되감거나 그 줄만 고치기 */
      const log = C.hist.map(([, id], k) => [k, id]).filter(([k, id]) => C.hist.slice(k + 1).every((h) => h[1] !== id));
      return `<div class="c25"><div class="c25-m">${cur ? `<p class="co2-n"><span>${C.i + 1} / ${n}</span></p>${card(cur)}${acts(cur)}` : '<p class="c-ok">다 정했어요. 오른쪽 기록에서 되감거나 고칠 수 있어요.</p>'}${undoBar()}</div>
        <aside class="c25-l" aria-label="정한 순서"><p>정한 순서</p>${log.length ? `<ol>${log.map(([k, id]) => { const t = A.byId(id); return `<li><div class="c25-r"><span class="n">${k + 1}</span><span class="t">${A.esc(t.title)}</span><button type="button" class="v" data-cye="${id}" aria-expanded="${C.edit === id}">${where(plan[id])}</button></div>
          ${C.edit === id ? `<div class="c25-e">${seg(t)}</div>` : ''}${k < C.hist.length - 1 ? `<button type="button" class="co-lnk c25-w" data-cyw="${k + 1}">여기까지만 남기고 되감기</button>` : ''}</li>`; }).join('')}</ol>` : '<small>정하면 여기에 순서대로 쌓여요</small>'}</aside></div>`;
    };

    const draw = (fsel) => { const undec = open.filter((t) => !C.dec.has(t.id)).length;
      const lbl = undec && open.length ? `남은 ${undec}개는 내일로 하고 초안 만들기` : '넘기고 회고 초안 만들기';
      d.innerHTML = `<form class="dg co co-${CO}" method="dialog"><h2>${A.label(s)} 닫기</h2><p>끝낸 일 ${st.done}개, 커밋 ${st.commits}개. 남은 일 ${open.length}개를 어떻게 할지 정하면 회고 초안을 만들어요.</p>${body()}
        <div class="foot"><button class="btn" value="x">취소</button><button class="btn btn-p" id="mk" type="button">${A.ico.sparkle}${lbl}</button></div></form>`;
      $('#mk', d).onclick = () => finish(d, s, plan);
      (fsel && d.querySelector(fsel) || d.querySelector('[data-cy], .btn-p'))?.focus(); };

    d.onclick = (e) => { const g = (a) => e.target.closest(`[${a}]`); let el;
      if (g('data-cyu')) { undo(); return draw(); }
      if ((el = g('data-cy'))) { const [id, v] = el.dataset.cy.split('|'); if (v === 'other') { C.q2 = true; return draw(); } decide(id, v || null); return draw(); }
      if ((el = g('data-cys'))) { const [id, v] = el.dataset.cys.split('|'); decide(id, v || null, false); return draw(CO === 23 ? '.c23-r button, [data-cy]' : `[data-cye="${id}"]`); }
      if ((el = g('data-cyj'))) { C.i = +el.dataset.cyj; C.q2 = false; return draw(); }
      if ((el = g('data-cyq'))) { C.q2 = false; return draw(); }
      if ((el = g('data-cye'))) { C.edit = C.edit === el.dataset.cye ? null : el.dataset.cye; return draw(`[data-cye="${el.dataset.cye}"]`); }
      if ((el = g('data-cyw'))) { rewind(+el.dataset.cyw); return draw(); }
    };
    d.onkeydown = (e) => { if (e.target.matches('input, textarea')) return; const k = e.key, cur = open[C.i];
      if ((k === 'Backspace' || k.toLowerCase() === 'z') && C.hist.length) { e.preventDefault(); undo(); return draw(); }
      if (CO === 21 && (k === 'ArrowLeft' || k === 'ArrowRight')) { e.preventDefault(); C.i = Math.max(0, Math.min(open.length - 1, C.i + (k === 'ArrowRight' ? 1 : -1))); return draw(); }
      if (!cur || !/^[1-4]$/.test(k)) return; e.preventDefault();
      const b = d.querySelectorAll('[data-cy]')[+k - 1]; if (b) b.click(); };
    draw(); if (!d.open) d.showModal(); d.querySelector('[data-cy], .btn-p')?.focus();
  };
})();
