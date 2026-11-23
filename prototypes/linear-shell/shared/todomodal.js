/* 캘린더: 할 일을 누르면 오른쪽 패널 대신 가운데 모달. ?tm=1..5 */
(() => {
  const A = window.ARC, P = window.PL, $ = (q, r = document) => r.querySelector(q);
  const Q = new URLSearchParams(location.search), TM = (() => { const v = +(Q.get('tm') || 1); return v >= 1 && v <= 10 ? v : 1; })();
  window.TMV = TM;
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ic = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'), edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>'), cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'), clock: I('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'), tag: I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>'), rep: I('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'), warn: I('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>'), check: I('<path d="m5 12 5 5 9-10"/>'), next: I('<path d="M5 12h14M13 6l6 6-6 6"/>'), note: I('<path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h4"/>'), gc: I('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'), chev: I('<path d="m9 6 6 6-6 6"/>'), flag: I('<path d="M5 21V4h11l-2 4 2 4H5"/>'), plus: I('<path d="M12 5v14M5 12h14"/>') };
  const S = { edit: false, tok: null, arm: false, newTag: '', closed: new Set(), shown: new Set(), addOpen: false };
  const calOf = (id) => A.cals.find((c) => c.id === id) || A.cals[0];
  const kh = (h) => { const H = Math.floor(h), M = Math.round((h - H) * 60); return `${H < 12 ? '오전' : '오후'} ${H % 12 || 12}시${M ? ` ${M}분` : ''}`; };
  const dL = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${A.DOW[d.getDay()]}요일`; };
  const dS = (s) => { const d = A.s2d(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const timeTxt = (t) => (P.multi(t) ? `${dS(t.date)}부터 ${dS(t.until)}까지` : t.start != null ? `${kh(t.start)}부터 ${kh(t.end ?? t.start + 1)}까지` : '종일');
  const whenTxt = (t) => (P.multi(t) ? timeTxt(t) : `${dL(t.date)}, ${timeTxt(t)}`);
  const REPS = [['', '반복 안 함'], ['매일', '매일'], ['매주', '매주 같은 요일'], ['평일마다', '평일마다'], ['매월', '매월 같은 날']];
  const repTxt = (t) => (REPS.find((r) => r[0] === (t.rep || '')) || [0, t.rep])[1];
  const tagName = (k) => A.TAG[k] || k;

  /* ---------- 공통 조각 ---------- */
  const F = (t) => ({
    title: (cls = '') => `<input class="tm-title ${cls}" data-tmf="title" value="${A.esc(t.title)}" aria-label="제목" autocomplete="off">`,
    st: (cls = '') => `<span class="tm-seg ${cls}" role="radiogroup" aria-label="상태">${['todo', 'doing', 'done'].map((s) => `<button type="button" role="radio" aria-checked="${t.status === s}" data-tms="${s}">${P.stIcon(s)}${A.ST[s]}</button>`).join('')}</span>`,
    date: () => `<span class="tm-dt"><input type="date" class="tm-in" data-tmf="date" value="${t.date || ''}" aria-label="날짜">${P.multi(t) ? `<span class="tm-mu">~</span><input type="date" class="tm-in" data-tmf="until" min="${t.date}" value="${t.until}" aria-label="마감일">` : ''}</span>`,
    time: () => (P.multi(t) ? '<span class="tm-mu">기간 할 일은 시간 없이 날짜로만 보여요</span>' : `<span class="tm-dt"><input type="time" step="1800" class="tm-in" data-tmf="start" value="${t.start != null ? A.hm(t.start) : ''}" aria-label="시작"><span class="tm-mu">~</span><input type="time" step="1800" class="tm-in" data-tmf="end" value="${t.end != null ? A.hm(t.end) : ''}" aria-label="끝">${t.start != null ? `<button type="button" class="tm-lnk" data-tmx="notime">종일로</button>` : ''}</span>`),
    cal: (cls = '') => `<span class="tm-cals ${cls}" role="radiogroup" aria-label="캘린더">${A.cals.map((c) => `<button type="button" role="radio" aria-checked="${P.cal(t) === c.id}" data-tmcal="${c.id}" style="--cc:${c.color}"><i aria-hidden="true"></i>${A.esc(c.name)}</button>`).join('')}</span>`,
    tags: () => `<span class="tm-tags">${P.tags(t).map((k) => `<span class="tm-tag">#${A.esc(tagName(k))}<button type="button" data-tmtagx="${A.esc(k)}" aria-label="${A.esc(tagName(k))} 태그 빼기">${ic.x}</button></span>`).join('')}${P.tags(t).length < 10 ? `<input class="tm-tagin" data-tmtagin placeholder="태그 추가" aria-label="태그 추가" maxlength="20" value="${A.esc(S.newTag)}">` : ''}</span>`,
    due: () => `<span class="tm-dt"><input type="date" class="tm-in" data-tmf="due" value="${t.due || ''}" min="${t.date}" aria-label="마감일">${t.due ? `<button type="button" class="tm-lnk" data-tmx="nodue">지우기</button>` : ''}</span>`,
    rep: () => `<span class="tm-reps" role="radiogroup" aria-label="반복">${REPS.map(([v, l]) => `<button type="button" role="radio" aria-checked="${(t.rep || '') === v}" data-tmrep="${v}">${l}</button>`).join('')}</span>`,
    note: (rows = 4) => `<textarea class="tm-note" data-tmf="note" rows="${rows}" placeholder="맥락이나 참고 링크를 적어 두세요" aria-label="메모">${A.esc(t.note || '')}</textarea>`,
    g: () => (t.push === 'failed' ? `<span class="tm-g bad">${ic.warn}<span>Google Calendar에 보내지 못했어요</span><button type="button" class="tm-b" data-tmx="resend">다시 보내기</button></span>`
      : t.gcal ? `<span class="tm-g ok">${ic.check}<span>Google Calendar에 있어요</span><button type="button" class="tm-lnk" data-tmx="gcal">빼기</button></span>`
      : `<span class="tm-g"><span>Google Calendar에 없어요</span><button type="button" class="tm-b" data-tmx="gcal">보내기</button></span>`),
    del: (txt = true) => `<button type="button" class="tm-del ${S.arm ? 'arm' : ''}" data-tmx="del" aria-label="삭제">${ic.trash}${txt || S.arm ? `<span>${S.arm ? '한 번 더 누르면 삭제' : '삭제'}</span>` : ''}</button>`,
    close: () => `<button type="button" class="tm-ib" data-tmx="close" aria-label="닫기">${ic.x}</button>`,
    calTag: () => { const c = calOf(P.cal(t)); return `<span class="tm-calname" style="--cc:${c.color}"><i aria-hidden="true"></i>${A.esc(c.name)}</span>`; },
  });

  function html(t) {
    const f = F(t), c = calOf(P.cal(t));
    if (P.tdHTML) return P.tdHTML(t, f, H);
    if (TM === 1) return `<div class="tm tm1"><header class="tm-bar">${f.calTag()}<span class="sp"></span>${f.del(false)}${f.close()}</header>${f.title('big')}
      <dl class="tm1-p"><div><dt>${P.stIcon(t.status)}상태</dt><dd>${f.st()}</dd></div><div><dt>${ic.cal}날짜</dt><dd>${f.date()}</dd></div><div><dt>${ic.clock}시간</dt><dd>${f.time()}</dd></div>
        <div><dt><i class="tm-dot" style="--cc:${c.color}"></i>캘린더</dt><dd>${f.cal()}</dd></div><div><dt>${ic.tag}태그</dt><dd>${f.tags()}</dd></div><div><dt>${ic.rep}반복</dt><dd>${f.rep()}</dd></div><div><dt>${ic.gc}Google</dt><dd>${f.g()}</dd></div></dl>
      <div class="tm1-n"><p>메모</p>${f.note(5)}</div></div>`;
    if (TM === 2) return `<div class="tm tm2"><div class="tm2-m"><header class="tm-bar"><span class="tm-crumb">${A.esc(c.name)} <span>/</span> ${dS(t.date)}</span><span class="sp"></span>${f.close()}</header>${f.title('big')}${f.note(9)}
        <p class="tm2-log">${t.push === 'failed' ? `${ic.warn}Google Calendar로 보내지 못했어요. 오른쪽 아래에서 다시 보낼 수 있어요.` : `${ic.check}${t.gcal ? 'Google Calendar와 맞춰져 있어요' : '이 할 일은 ARCHIVE에만 있어요'}`}</p></div>
      <aside class="tm2-a"><section><p>상태</p>${f.st('col')}</section><section><p>날짜</p>${f.date()}</section><section><p>시간</p>${f.time()}</section><section><p>캘린더</p>${f.cal('col')}</section><section><p>태그</p>${f.tags()}</section><section><p>반복</p><span class="tm-val">${ic.rep}${repTxt(t)}</span></section><section><p>Google</p>${f.g()}</section><span class="sp"></span>${f.del()}</aside></div>`;
    if (TM === 3) { const done = t.status === 'done';
      return `<div class="tm tm3" style="--cc:${c.color}"><header class="tm-bar">${f.calTag()}<span class="sp"></span><button type="button" class="tm-ib" data-tmx="edit" aria-pressed="${S.edit}" aria-label="자세히 고치기">${ic.edit}</button>${f.del(false)}${f.close()}</header>
        ${S.edit ? f.title() : `<h2 class="tm3-t ${done ? 'done' : ''}">${A.esc(t.title)}</h2>`}
        <p class="tm3-w">${ic.clock}<span>${whenTxt(t)}</span></p>
        <p class="tm3-s">${P.stIcon(t.status)}<span>${A.ST[t.status]}</span>${P.tags(t).map((k) => `<em>#${A.esc(tagName(k))}</em>`).join('')}${t.rep ? `<em>${ic.rep}${repTxt(t)}</em>` : ''}</p>
        ${t.push === 'failed' ? f.g() : ''}${!S.edit && t.note ? `<p class="tm3-n">${A.esc(t.note)}</p>` : ''}
        ${S.edit ? `<div class="tm3-e"><label><span>상태</span>${f.st()}</label><label><span>날짜</span>${f.date()}</label><label><span>시간</span>${f.time()}</label><label><span>캘린더</span>${f.cal()}</label><label><span>태그</span>${f.tags()}</label><label><span>반복</span>${f.rep()}</label><label><span>메모</span>${f.note(3)}</label></div>` : ''}
        <footer class="tm3-f"><button type="button" class="tm-b p" data-tms="${done ? 'todo' : 'done'}">${ic.check}${done ? '다시 열기' : '완료로 바꾸기'}</button>${done || P.multi(t) ? '' : `<button type="button" class="tm-b" data-tmx="tom">내일로</button>`}<span class="sp"></span>${S.edit ? '' : `<button type="button" class="tm-lnk" data-tmx="edit">자세히 고치기</button>`}</footer></div>`; }
    if (TM === 4) { const nx = { todo: ['doing', '시작하기'], doing: ['done', '완료로 표시'], done: ['todo', '다시 열기'] }[t.status], i = ['todo', 'doing', 'done'].indexOf(t.status);
      const quick = [[A.TODAY, '오늘'], [A.add(A.TODAY, 1), '내일'], [A.add(A.TODAY, ((8 - A.s2d(A.TODAY).getDay()) % 7) || 7), '다음 주 월']];
      return `<div class="tm tm4"><header class="tm-bar">${f.calTag()}<span class="sp"></span>${f.close()}</header>
        <ol class="tm4-st" aria-label="상태">${['todo', 'doing', 'done'].map((s, k) => `<li><button type="button" data-tms="${s}" aria-current="${s === t.status ? 'step' : 'false'}" class="${k < i ? 'past' : ''}">${P.stIcon(s)}<span>${A.ST[s]}</span></button></li>`).join('')}</ol>
        ${f.title('big')}
        <section class="tm4-s"><p>언제</p><div class="tm4-q">${quick.map(([d, l]) => `<button type="button" aria-pressed="${t.date === d && !P.multi(t)}" data-tmday="${d}">${l}</button>`).join('')}</div>${f.date()}${f.time()}</section>
        <section class="tm4-s two"><div><p>캘린더</p>${f.cal()}</div><div><p>태그</p>${f.tags()}</div></section>
        ${t.note || S.edit ? `<section class="tm4-s"><p>메모</p>${f.note(3)}</section>` : `<button type="button" class="tm-lnk tm4-add" data-tmx="edit">${ic.note}메모 추가</button>`}
        ${t.push === 'failed' ? f.g() : ''}
        <footer class="tm4-f">${f.del()}<span class="sp"></span><button type="button" class="tm-b" data-tmx="close">닫기</button><button type="button" class="tm-b p" data-tms="${nx[0]}">${nx[0] === 'done' ? ic.check : ic.next}${nx[1]}</button></footer></div>`; }
    /* 6~10: 1 문서형 속성 목록에서 파생 */
    if (TM >= 6) {
      const dn = t.due ? Math.round((A.s2d(t.due) - A.s2d(A.TODAY)) / 864e5) : null, dueV = t.due ? `${dL(t.due)} <em class="${dn < 0 ? 'late' : dn <= 1 ? 'soon' : ''}">${dn < 0 ? `${-dn}일 지남` : dn === 0 ? '오늘' : dn === 1 ? '내일' : `${dn}일 남음`}</em>` : '';
      const gV = t.push === 'failed' ? '<em class="late">보내지 못했어요</em>' : t.gcal ? 'Google Calendar에 있어요' : '';
      const R = [
        ['st', P.stIcon(t.status), '상태', `${A.ST[t.status]}`, () => f.st(), true, false],
        ['date', ic.cal, '날짜', P.multi(t) ? timeTxt(t) : dL(t.date), () => f.date(), true, false],
        ['time', ic.clock, '시간', t.start != null && !P.multi(t) ? timeTxt(t) : '', () => f.time(), t.start != null, true],
        ['due', ic.flag, '마감일', dueV, () => f.due(), !!t.due, true],
        ['rep', ic.rep, '반복', t.rep ? repTxt(t) : '', () => f.rep(), !!t.rep, true],
        ['cal', `<i class="tm-dot" style="--cc:${c.color}"></i>`, '캘린더', A.esc(c.name), () => f.cal(), true, false],
        ['tags', ic.tag, '태그', P.tags(t).map((k) => '#' + A.esc(tagName(k))).join(' '), () => f.tags(), P.tags(t).length > 0, true],
        ['g', ic.gc, 'Google', gV, () => f.g(), !!(t.gcal || t.push === 'failed'), true],
      ];
      const head = `<header class="tm-bar">${f.calTag()}<span class="sp"></span>${f.del(false)}${f.close()}</header>${f.title('big')}`;
      const val = (r) => r[3] || `<span class="tm-mu">${r[0] === 'time' ? '종일' : '없음'}</span>`;
      if (TM === 6) return `<div class="tm tm6">${head}<ul class="tm6-l">${R.map((r) => `<li class="${S.tok === r[0] ? 'tm-open' : ''}"><button type="button" data-tmtok="${r[0]}" aria-expanded="${S.tok === r[0]}"><span class="k">${r[1]}${r[2]}</span><span class="v">${val(r)}</span>${ic.chev}</button>${S.tok === r[0] ? `<div class="tm6-e">${r[4]()}</div>` : ''}</li>`).join('')}</ul>
        <div class="tm1-n"><p>메모</p>${f.note(4)}</div></div>`;
      if (TM === 7) { const G = [['when', '언제', ['date', 'time', 'due', 'rep']], ['sort', '분류', ['cal', 'tags']], ['sync', '연동', ['g']]];
        return `<div class="tm tm7">${head}<div>${f.st()}</div>${f.note(3)}
          ${G.map(([k, l, ks]) => { const on = !S.closed.has(k), rs = ks.map((x) => R.find((r) => r[0] === x)); return `<section class="tm7-g"><button type="button" class="tm7-h" data-tmgrp="${k}" aria-expanded="${on}">${ic.chev}<b>${l}</b>${on ? '' : `<span>${rs.map((r) => r[3]).filter(Boolean).join(', ') || '비어 있어요'}</span>`}</button>
            ${on ? `<dl class="tm1-p">${rs.map((r) => `<div><dt>${r[1]}${r[2]}</dt><dd>${r[4]()}</dd></div>`).join('')}</dl>` : ''}</section>`; }).join('')}</div>`; }
      if (TM === 8) { const r0 = R.find((r) => r[0] === S.tok);
        return `<div class="tm tm8">${head}<div class="tm8-c" role="group" aria-label="속성">${R.map((r) => `<button type="button" class="${r[3] ? '' : 'emp'}" data-tmtok="${r[0]}" aria-expanded="${S.tok === r[0]}" title="${r[2]}">${r[1]}<span>${r[3] || `${r[2]} ${r[0] === 'time' ? '정하기' : '추가'}`}</span></button>`).join('')}</div>
          ${r0 ? `<div class="tm8-p tm-open"><p><b>${r0[2]}</b><button type="button" class="tm-lnk" data-tmtok="${r0[0]}">닫기</button></p>${r0[4]()}</div>` : ''}
          ${f.note(8)}</div>`; }
      if (TM === 9) { const cell = (k, wide) => { const r = R.find((x) => x[0] === k); return `<div class="${wide ? 'w' : ''}"><p>${r[1]}${r[2]}</p>${r[4]()}</div>`; }; const done = t.status === 'done';
        return `<div class="tm tm9">${head}${f.st('full')}<div class="tm9-g">${cell('date')}${cell('time')}${cell('due')}${cell('cal')}${cell('rep', true)}${cell('tags', true)}</div>
          <div class="tm1-n"><p>메모</p>${f.note(3)}</div><footer class="tm9-f">${f.g()}<span class="sp"></span><button type="button" class="tm-b p" data-tms="${done ? 'todo' : 'done'}">${ic.check}${done ? '다시 열기' : '완료로 바꾸기'}</button></footer></div>`; }
      /* 10 빈 속성 숨김 */
      const shown = R.filter((r) => !r[6] || r[5] || S.shown.has(r[0])), hidden = R.filter((r) => !shown.includes(r)).concat(!t.note && !S.shown.has('note') ? [['note', ic.note, '메모']] : []);
      return `<div class="tm tm10">${head}<dl class="tm1-p">${shown.map((r) => `<div><dt>${r[1]}${r[2]}</dt><dd>${r[4]()}${r[6] ? `<button type="button" class="tm-ib sm" data-tmclr="${r[0]}" aria-label="${r[2]} 빼기" title="${r[2]} 빼기">${ic.x}</button>` : ''}</dd></div>`).join('')}</dl>
        ${t.note || S.shown.has('note') ? `<div class="tm1-n"><p>메모 <button type="button" class="tm-lnk" data-tmclr="note">빼기</button></p>${f.note(4)}</div>` : ''}
        ${hidden.length ? `<div class="tm10-add"><button type="button" class="tm-b" data-tmadd aria-expanded="${S.addOpen}">${ic.plus}속성 추가</button>${S.addOpen ? `<div class="tm10-m" role="menu">${hidden.map((r) => `<button type="button" role="menuitem" data-tmshow="${r[0]}">${r[1]}${r[2]}</button>`).join('')}</div>` : ''}</div>` : ''}</div>`;
    }
    /* 5 문장형 */
    const tk = (k, inner, lbl) => `<button type="button" class="tm5-k" data-tmtok="${k}" aria-expanded="${S.tok === k}" aria-label="${lbl} 바꾸기">${inner}</button>`;
    const ed = { cal: () => f.cal(), when: () => `${f.date()}${f.time()}`, st: () => f.st(), tags: () => f.tags(), rep: () => f.rep() };
    return `<div class="tm tm5"><header class="tm-bar"><span class="tm-mu">할 일</span><span class="sp"></span>${f.del(false)}${f.close()}</header>${f.title('big')}
      <p class="tm5-p">${tk('cal', `<i class="tm-dot" style="--cc:${c.color}"></i>${A.esc(c.name)}`, '캘린더')} 캘린더의 ${tk('when', whenTxt(t), '날짜와 시간')}에 하는 ${tk('st', `${P.stIcon(t.status)}${A.ST[t.status]}`, '상태')} 할 일이에요.
        태그는 ${tk('tags', P.tags(t).length ? P.tags(t).map((k) => '#' + A.esc(tagName(k))).join(' ') : '없음', '태그')}, ${tk('rep', repTxt(t), '반복')}.</p>
      ${S.tok ? `<div class="tm5-e">${ed[S.tok]()}</div>` : ''}
      ${t.push === 'failed' ? f.g() : ''}
      <div class="tm5-n">${f.note(4)}</div>
      <p class="tm5-f">${f.g()}</p></div>`;
  }

  const H = { ic, kh, dL, dS, whenTxt, timeTxt, repTxt, tagName, calOf, S, REPS };
  P.tmH = H;
  /* ---------- 그리기 ---------- */
  let lastId = null;
  P.tmShow = () => {
    const dlg = $('#detail'); if (!dlg) return; const t = A.byId(A.s.sel);
    if (!t) { if (dlg.open) dlg.close(); lastId = null; return; }
    if (lastId !== t.id) { S.edit = false; S.tok = null; S.arm = false; S.newTag = ''; S.shown = new Set(); S.addOpen = false; lastId = t.id; }
    const fa = document.activeElement && dlg.contains(document.activeElement) ? [...document.activeElement.attributes].find((a) => a.name.startsWith('data-tm')) : null;
    dlg.className = P.tdHTML ? 'tdv' + P.TDV : 'tmv' + TM; dlg.setAttribute('aria-label', '할 일: ' + t.title); dlg.innerHTML = html(t);
    if (!dlg.open) { dlg.showModal(); (dlg.querySelector('.tm-title') || dlg.querySelector('[data-tmx="close"]'))?.focus({ preventScroll: true }); dlg.querySelector('.tm-title')?.blur(); dlg.querySelector('[data-tmx="close"]')?.focus(); }
    else if (fa) dlg.querySelector(`[${fa.name}${fa.value ? `="${CSS.escape(fa.value)}"` : ''}]`)?.focus({ preventScroll: true });
  };
  const rr = A.rerender; A.rerender = () => { rr(); P.tmShow(); };
  const cur = () => A.byId(A.s.sel);
  const save = (msg) => { if (msg) A.toast(msg); A.rerender(); };

  document.addEventListener('click', (e) => {
    const dlg = $('#detail'); if (!dlg || !dlg.contains(e.target)) return;
    const g = (a) => e.target.closest(`[${a}]`), t = cur(); let el; if (!t) return;
    if (!g('data-tmx') || g('data-tmx').dataset.tmx !== 'del') S.arm = false;
    if ((el = g('data-tms'))) { t.status = el.dataset.tms; return save(); }
    if ((el = g('data-tmcal'))) { t.cal = el.dataset.tmcal; return save(); }
    if ((el = g('data-tmrep'))) { t.rep = el.dataset.tmrep || null; return save(); }
    if ((el = g('data-tmday'))) { t.date = el.dataset.tmday; if (t.until) t.until = null; return save(`${dL(t.date)}로 옮겼어요`); }
    if ((el = g('data-tmtagx'))) { t.tags = P.tags(t).filter((k) => k !== el.dataset.tmtagx); return save(); }
    if ((el = g('data-tmtok'))) { S.tok = S.tok === el.dataset.tmtok ? null : el.dataset.tmtok; P.tmShow(); if (S.tok) dlg.querySelector('.tm-open button, .tm-open input, .tm-open textarea')?.focus(); return; }
    if ((el = g('data-tmgrp'))) { const k = el.dataset.tmgrp; S.closed.has(k) ? S.closed.delete(k) : S.closed.add(k); P.tmShow(); return; }
    if (g('data-tmadd')) { S.addOpen = !S.addOpen; P.tmShow(); if (S.addOpen) dlg.querySelector('[data-tmshow]')?.focus(); return; }
    if ((el = g('data-tmshow'))) { S.shown.add(el.dataset.tmshow); S.addOpen = false; P.tmShow(); dlg.querySelector(`[data-tmclr="${el.dataset.tmshow}"]`)?.closest('div, dd')?.querySelector('input, button:not([data-tmclr]), textarea')?.focus(); return; }
    if ((el = g('data-tmclr'))) { const k = el.dataset.tmclr; S.shown.delete(k); if (k === 'time') { t.start = t.end = null; } else if (k === 'due') t.due = null; else if (k === 'rep') t.rep = null; else if (k === 'tags') t.tags = []; else if (k === 'note') t.note = ''; else if (k === 'g') { t.gcal = false; t.push = null; } return save(); }
    if ((el = g('data-tmx'))) { const x = el.dataset.tmx;
      if (x === 'close') return dlg.close();
      if (x === 'edit') { S.edit = !S.edit; P.tmShow(); return; }
      if (x === 'del') { if (!S.arm) { S.arm = true; return P.tmShow(); } A.todos = A.todos.filter((y) => y.id !== t.id); A.s.sel = null; S.arm = false; dlg.close(); return save('삭제했어요'); }
      if (x === 'nodue') { t.due = null; return save('마감일을 지웠어요'); }
      if (x === 'notime') { t.start = t.end = null; return save('종일 할 일로 바꿨어요'); }
      if (x === 'tom') { t.date = A.add(t.date, 1); return save(`${dL(t.date)}로 옮겼어요`); }
      if (x === 'resend') { t.push = null; t.gcal = true; return save('Google Calendar로 다시 보냈어요'); }
      if (x === 'gcal') { t.gcal = !t.gcal; return save(t.gcal ? 'Google Calendar로 보냈어요' : 'Google Calendar에서 뺐어요'); }
    }
  }, true);
  const hNum = (v) => { const [h, m] = v.split(':').map(Number); return h + m / 60; };
  document.addEventListener('change', (e) => { const el = e.target.closest && e.target.closest('#detail [data-tmf]'); if (!el) return; const t = cur(); if (!t) return; const k = el.dataset.tmf, v = el.value;
    if (k === 'title') { t.title = v.trim() || t.title; return save(); }
    if (k === 'note') { t.note = v; return; }
    if (k === 'date') { if (!v) return; const n = P.multi(t) ? (A.s2d(t.until) - A.s2d(t.date)) / 864e5 : 0; t.date = v; if (n) t.until = A.add(v, n); A.s.date = v; return save(); }
    if (k === 'due') { t.due = v || null; return save(v ? `마감일을 ${dL(v)}로 정했어요` : ''); }
    if (k === 'until') { t.until = v > t.date ? v : null; return save(); }
    if (k === 'start') { if (!v) { t.start = t.end = null; return save(); } const d = t.end != null && t.start != null ? t.end - t.start : 1; t.start = hNum(v); t.end = Math.min(24, t.start + d); return save(); }
    if (k === 'end') { if (!v) return; const h = hNum(v); if (t.start == null) t.start = Math.max(0, h - 1); t.end = h > t.start ? h : t.start + 0.5; return save(); } });
  document.addEventListener('input', (e) => { if (e.target.matches && e.target.matches('#detail [data-tmtagin]')) S.newTag = e.target.value; if (e.target.matches && e.target.matches('#detail [data-tmf="note"]')) { const t = cur(); if (t) t.note = e.target.value; } });
  document.addEventListener('keydown', (e) => { if (!(e.target.matches && e.target.matches('#detail [data-tmtagin]')) || e.key !== 'Enter' || e.isComposing) return; e.preventDefault();
    const t = cur(), v = e.target.value.trim().replace(/^#/, ''); if (!t || !v) return; const k = Object.keys(A.TAG).find((x) => A.TAG[x] === v) || v; if (!P.tags(t).includes(k)) t.tags = [...P.tags(t), k]; S.newTag = ''; save(); $('#detail [data-tmtagin]')?.focus(); });
  if (Q.get('select')) setTimeout(() => P.tmShow(), 400);
})();
