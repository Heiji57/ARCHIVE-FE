/* 할 일 화면: 할 일을 누르면 여는 상세 창 5가지. ?td=1..5  (todomodal.js 의 칸과 핸들러를 같이 씀)
   들어가는 요소 (my-app TaskDetailPanel 기준): 제목, 상태, 메모(description), 태그(10개, 20자), 날짜, 마감일(dueDate),
   시간(시작, 끝, 지우기), 반복(요약, 바꾸기, 고칠 범위: 이 일정만, 이후 모두, 전체), Google Calendar(보내기, 빼기, 실패 시 다시),
   삭제(반복이면 범위), 닫기. 시안 쪽 추가: 캘린더 고르기, 목록 안 위치(이전, 다음). */
(() => {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), TD = (() => { const v = +(Q.get('td') || 1); return v >= 1 && v <= 5 ? v : 1; })();
  P.TDV = TD;
  const X = { scope: 'this' };
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`, UP = I('<path d="m6 15 6-6 6 6"/>'), DN = I('<path d="m6 9 6 6 6-6"/>');
  /* 예시 데이터: 마감일, 반복, Google 연결 */
  [['t4', { due: '2026-11-04' }], ['t11', { due: '2026-11-04' }], ['t14', { rep: '매주' }], ['t3', { gcal: true }], ['t12', { due: '2026-11-05', gcal: true }]].forEach(([id, o]) => { const t = A.byId(id); if (t) Object.assign(t, o); });

  const order = () => [...new Set([...document.querySelectorAll('main [data-id], #view [data-id], .board [data-id], .list [data-id]')].map((e) => e.dataset.id))].filter((id) => A.byId(id));
  const daysTo = (s) => Math.round((A.s2d(s) - A.s2d(A.TODAY)) / 864e5);
  const series = (t, n = 5) => { const step = { 매일: 1, 매주: 7, 평일마다: 1, 매월: 30 }[t.rep] || 7, out = []; let d = t.date; while (out.length < n) { const w = A.s2d(d).getDay(); if (!(t.rep === '평일마다' && (w === 0 || w === 6))) out.push(d); d = t.rep === '매월' ? (() => { const x = A.s2d(d); x.setMonth(x.getMonth() + 1); return A.d2s(x); })() : A.add(d, step); } return out; };
  const SCOPE = [['this', '이 일정만'], ['after', '이후 모두'], ['all', '전체']];

  P.tdHTML = (t, f, H) => {
    const { ic, dL, dS, repTxt, calOf } = H, S = H.S, c = calOf(P.cal(t));
    const due = () => `<span class="tm-dt"><input type="date" class="tm-in" data-tmf="due" value="${t.due || ''}" min="${t.date}" aria-label="마감일">${t.due ? `<button type="button" class="tm-lnk" data-tdx="nodue">지우기</button>` : ''}</span>`;
    const dueTxt = () => { if (!t.due) return ['', '마감 없음']; const n = daysTo(t.due); return n < 0 ? ['late', `마감 ${-n}일 지남`] : n === 0 ? ['today', '오늘 마감'] : n === 1 ? ['soon', '내일 마감'] : ['', `마감까지 ${n}일`]; };
    const ids = order(), idx = ids.indexOf(t.id);

    /* 1 오른쪽 서랍: 목록은 그대로 보이고 위아래로 다음 할 일 */
    if (TD === 1) return `<div class="tm td1"><header class="tm-bar"><span class="td-pos">${idx >= 0 ? `${idx + 1} / ${ids.length}` : ''}</span><button type="button" class="tm-ib" data-tdnav="-1" aria-label="이전 할 일" ${idx > 0 ? '' : 'disabled'}>${UP}</button><button type="button" class="tm-ib" data-tdnav="1" aria-label="다음 할 일" ${idx >= 0 && idx < ids.length - 1 ? '' : 'disabled'}>${DN}</button><span class="sp"></span>${f.del(false)}${f.close()}</header>
      ${f.title('big')}<div>${f.st()}</div>
      <section class="td-s"><h3>일정</h3><div class="td-g"><span>날짜</span>${f.date()}<span>시간</span>${f.time()}<span>마감일</span>${due()}<span>반복</span>${f.rep()}</div></section>
      <section class="td-s"><h3>분류</h3><div class="td-g"><span>캘린더</span>${f.cal()}<span>태그</span>${f.tags()}</div></section>
      <section class="td-s"><h3>메모</h3>${f.note(5)}</section>
      <section class="td-s"><h3>Google Calendar</h3>${f.g()}</section>
      <p class="td-kh"><kbd>↑</kbd><kbd>↓</kbd><span>다른 할 일</span><kbd>Esc</kbd><span>닫기</span></p></div>`;

    /* 2 넓은 문서 + 기록 */
    if (TD === 2) { const log = [[A.add(t.date, -2), '만들었어요'], ...(t.status !== 'todo' ? [[A.TODAY, `${A.ST[t.status]}(으)로 바꿨어요`]] : []), ...(t.push === 'failed' ? [[A.TODAY, 'Google Calendar로 보내지 못했어요']] : t.gcal ? [[A.add(t.date, -1), 'Google Calendar로 보냈어요']] : [])];
      return `<div class="tm td2"><header class="tm-bar"><span class="tm-crumb">할 일 <span>/</span> ${A.esc(c.name)}</span><span class="sp"></span>${f.close()}</header>
        <div class="td2-g"><div class="td2-m">${f.title('big')}<div>${f.st()}</div>${f.note(14)}</div>
        <aside class="td2-a"><dl><div><dt>날짜</dt><dd>${f.date()}</dd></div><div><dt>시간</dt><dd>${f.time()}</dd></div><div><dt>마감일</dt><dd>${due()}</dd></div><div><dt>반복</dt><dd><span class="tm-val">${ic.rep}${repTxt(t)}</span></dd></div><div><dt>캘린더</dt><dd>${f.cal()}</dd></div><div><dt>태그</dt><dd>${f.tags()}</dd></div><div><dt>Google</dt><dd>${f.g()}</dd></div></dl>
          <section class="td2-log"><h3>기록</h3><ol>${log.map(([d, x]) => `<li><span>${dS(d)}</span>${x}</li>`).join('')}</ol></section>${f.del()}</aside></div></div>`; }

    /* 3 마감 중심 */
    if (TD === 3) { const [cls, txt] = dueTxt(), days = [...Array(7)].map((_, i) => A.add(t.date, i));
      return `<div class="tm td3"><header class="tm-bar">${f.calTag()}<span class="sp"></span>${f.del(false)}${f.close()}</header>
        <div class="td3-due ${cls}"><div><b>${txt}</b><small>${t.due ? dL(t.due) : '마감일을 정하면 할 일 목록에서 먼저 보여요'}</small></div>${due()}</div>
        <ol class="td3-strip" aria-label="시작일부터 7일">${days.map((d) => { const k = d === t.date ? 'st' : d === t.due ? 'du' : ''; const inR = t.due && d > t.date && d < t.due; return `<li class="${k} ${inR ? 'in' : ''} ${d === A.TODAY ? 'today' : ''}"><small>${A.DOW[A.s2d(d).getDay()]}</small><b>${A.s2d(d).getDate()}</b><em>${k === 'st' ? '시작' : k === 'du' ? '마감' : d === A.TODAY ? '오늘' : ''}</em></li>`; }).join('')}</ol>
        ${f.title('big')}<div>${f.st()}</div>
        <div class="td-g"><span>날짜</span>${f.date()}<span>시간</span>${f.time()}<span>반복</span>${f.rep()}<span>캘린더</span>${f.cal()}<span>태그</span>${f.tags()}<span>Google</span>${f.g()}</div>${f.note(3)}</div>`; }

    /* 4 반복 중심: 고칠 범위를 먼저 */
    if (TD === 4) { const sr = t.rep ? series(t) : [];
      return `<div class="tm td4"><header class="tm-bar">${f.calTag()}${t.rep ? `<span class="td4-b">${ic.rep}${repTxt(t)}</span>` : ''}<span class="sp"></span>${f.close()}</header>
        ${t.rep ? `<div class="td4-scope"><p>고친 내용을 어디까지 적용할까요?</p><span class="tm-seg" role="radiogroup" aria-label="적용 범위">${SCOPE.map(([k, l]) => `<button type="button" role="radio" aria-checked="${X.scope === k}" data-tdscope="${k}">${l}</button>`).join('')}</span></div>` : ''}
        ${f.title('big')}<div>${f.st()}</div>
        ${t.rep ? `<section class="td-s"><h3>다가오는 회차</h3><ol class="td4-sr">${sr.map((d, i) => `<li class="${i === 0 ? 'cur' : X.scope === 'this' ? '' : X.scope === 'after' || X.scope === 'all' ? 'hit' : ''}"><b>${dS(d)}</b><small>${A.DOW[A.s2d(d).getDay()]}</small></li>`).join('')}</ol><p class="td4-n">${X.scope === 'this' ? '이 회차만 바뀌고 다른 회차는 그대로예요.' : X.scope === 'after' ? '이 회차부터 뒤로 모두 바뀌어요. 지난 회차는 그대로예요.' : '지난 회차까지 모두 바뀌어요.'}</p></section>`
          : `<section class="td-s"><h3>반복</h3><p class="td4-n">반복으로 바꾸면 ${dL(t.date)}이 첫 회차가 돼요.</p>${f.rep()}</section>`}
        <div class="td-g"><span>날짜</span>${f.date()}<span>시간</span>${f.time()}<span>마감일</span>${due()}${t.rep ? `<span>반복</span>${f.rep()}` : ''}<span>캘린더</span>${f.cal()}<span>태그</span>${f.tags()}<span>Google</span>${f.g()}</div>${f.note(3)}
        <footer class="td4-f">${f.del()}${t.rep ? `<span class="tm-mu">${SCOPE.find((x) => x[0] === X.scope)[1]} 삭제돼요</span>` : ''}<span class="sp"></span><button type="button" class="tm-b" data-tmx="close">닫기</button></footer></div>`; }

    /* 5 단축키 목록 */
    const rows = [['s', 'st', '상태', `${P.stIcon(t.status)}${A.ST[t.status]}`, () => f.st()], ['d', 'date', '날짜', dL(t.date), () => f.date()], ['t', 'time', '시간', H.timeTxt(t), () => f.time()], ['u', 'due', '마감일', t.due ? `${dL(t.due)} <em class="${dueTxt()[0]}">${dueTxt()[1]}</em>` : '없음', () => due()],
      ['r', 'rep', '반복', repTxt(t), () => f.rep()], ['c', 'cal', '캘린더', `<i class="tm-dot" style="--cc:${c.color}"></i>${A.esc(c.name)}`, () => f.cal()], ['#', 'tags', '태그', P.tags(t).map((k) => '#' + A.esc(H.tagName(k))).join(' ') || '없음', () => f.tags()],
      ['g', 'g', 'Google', t.push === 'failed' ? '<em class="late">보내지 못함</em>' : t.gcal ? '보냄' : '안 보냄', () => f.g()], ['m', 'note', '메모', t.note ? A.esc(t.note.slice(0, 40)) : '없음', () => f.note(4)]];
    P.tdKeys = Object.fromEntries(rows.map((r) => [r[0], r[1]]));
    return `<div class="tm td5"><header class="tm-bar">${f.calTag()}<span class="sp"></span>${f.del(false)}${f.close()}</header>${f.title('big')}
      <ul class="td5-l">${rows.map(([k, tok, l, v, ed]) => `<li class="${S.tok === tok ? 'tm-open' : ''}"><button type="button" data-tmtok="${tok}" aria-expanded="${S.tok === tok}"><kbd>${k.toUpperCase()}</kbd><span class="l">${l}</span><span class="v">${v}</span></button>${S.tok === tok ? `<div class="td5-e">${ed()}</div>` : ''}</li>`).join('')}</ul>
      <p class="td-kh"><span>글자 키로 바로 열어요</span><kbd>Esc</kbd><span>닫기</span></p></div>`;
  };
  P.detail = () => P.tmShow();

  const go = (d) => { const ids = order(), i = ids.indexOf(A.s.sel); const n = ids[i + d]; if (!n) return; A.s.sel = n; A.rerender(); $('#detail [data-tdnav="' + d + '"]')?.focus(); };
  document.addEventListener('click', (e) => { const dlg = $('#detail'); if (!dlg || !dlg.contains(e.target)) return; const g = (a) => e.target.closest(`[${a}]`); let el; const t = A.byId(A.s.sel); if (!t) return;
    if ((el = g('data-tdnav'))) { go(+el.dataset.tdnav); return; }
    if ((el = g('data-tdscope'))) { X.scope = el.dataset.tdscope; P.tmShow(); return; }
    if ((el = g('data-tdx')) && el.dataset.tdx === 'nodue') { t.due = null; A.toast('마감일을 지웠어요'); A.rerender(); }
  }, true);
  document.addEventListener('keydown', (e) => { const dlg = $('#detail'); if (!dlg || !dlg.open || !dlg.contains(document.activeElement || e.target)) return; if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (TD === 1 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); go(e.key === 'ArrowUp' ? -1 : 1); return; }
    if (TD === 5 && P.tdKeys) { const tok = P.tdKeys[e.key.toLowerCase()] || (e.key === '#' ? 'tags' : null); if (tok) { e.preventDefault(); P.tmH.S.tok = P.tmH.S.tok === tok ? null : tok; P.tmShow(); dlg.querySelector('.tm-open .td5-e button, .tm-open .td5-e input, .tm-open .td5-e textarea')?.focus(); } } });
})();
