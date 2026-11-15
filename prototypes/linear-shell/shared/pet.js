/* 어느 화면에서나 부르는 AI 펫 시안. ?pet=1..10 (없으면 6번 빗금이, 설정에서 끄면 꺼짐). AI 탭은 화면 자체가 비서라 펫을 두지 않음.
   답은 시안에서는 규칙으로 흉내 냄. 누르기 전에는 아무것도 바뀌지 않고, 한 것은 되돌릴 수 있음. 대화는 탭을 옮겨도 이어짐 */
(() => {
  const BOOK = ['..xxxxxxxxxx..', '.x++++++++++x.', '.x++++++++++x.', '.x##########x.', '.x##e####e##x.', '.x##e####e##x.', '.x+########+x.', '.x####aa####x.', '.x##########x.', '.x##########x.', '.x##########x.', '.x####xx####x.', '.x###x..x###x.', '.x##x....x##x.', '.x#x......x#x.', '.xx........xx.'];
  const DRAWER = ['.xxxxxxxxxxxxxx.', 'x++++++++++++++x', 'x##############x', 'x##############x', 'x#kkkkkkkkkkkk#x', 'x#kkeekkkkeekk#x', 'x#kkeekkkkeekk#x', 'x#kkkkkkkkkkkk#x', 'x##############x', 'x#####aaaa#####x', 'x##############x', 'x++++++++++++++x', '.xxxxxxxxxxxxxx.'];
  const PAGE = ['.xxxxxxxxxx...', '.x#######x+x..', '.x#######x++x.', '.x#######xxxx.', '.x##########x.', '.x##e###e###x.', '.x##e###e###x.', '.x##########x.', '.x#++++++###x.', '.x##########x.', '.x#+++++####x.', '.x##########x.', '.xxxxxxxxxxxx.', '...rl....lr...', '...rl....lr...'];
  const OWL = ['..xx........xx..', '.x##x......x##x.', '.x###xxxxxx###x.', 'x##############x', 'x#wwww####wwww#x', 'x#wwee####eeww#x', 'x#wwee####eeww#x', 'x#wwww#aa#wwww#x', 'x######aa######x', 'x##+##+##+##+##x', 'x#+##+##+##+###x', 'x##+##+##+##+##x', '.x############x.', '..xaaxxxxxxaax..'];
  const D = { 1: { n: '갈피', r: BOOK, s: 3 }, 2: { n: '서랍이', r: DRAWER, s: 3, lid: 4 }, 3: { n: '활자' }, 4: { n: '낱장', r: PAGE, s: 3 }, 5: { n: '부엉', r: OWL, s: 3 } };
  const CL = { '#': 'a', '+': 'b', x: 'o', k: 'o', a: 'c', w: 'w', e: 'e', l: 'l', r: 'l' };
  const spr = (n) => { const { r, s, lid = 0 } = D[n], by = {}, W = r[0].length, H = r.length;
    r.forEach((row, y) => [...row].forEach((c, x) => { if (c === '.') return; const g = c === 'e' ? 'pxeye' : c === 'l' ? 'pxl1' : c === 'r' ? 'pxl2' : y < lid ? 'pxlid' : 'pxbd'; (by[g] = by[g] || []).push(`<rect class="px${CL[c]}" x="${x}" y="${y}" width="1" height="1"/>`); }));
    return `<svg class="pet-s s${n}" viewBox="0 0 ${W} ${H}" width="${W * s}" height="${H * s}" shape-rendering="crispEdges" aria-hidden="true">${Object.entries(by).map(([k, v]) => `<g class="${k}">${v.join('')}</g>`).join('')}</svg>`; };
  const EY = { idle: 'o o', think: 'o .', think2: '. o', done: '^ ^', note: 'O O', sleep: '- -', blink: '- -' };
  const type = (st) => `<pre class="pet-a" aria-hidden="true"> .---.\n( ${EY[st] || EY.idle} )\n '-v-'${st === 'sleep' ? ' z' : '  '}</pre>`;
  /* 6~10: 빗금 칸. 6번만 Rough.js로 손으로 그은 선을 만들고 나머지는 SVG로 직접 그림. px가 작으면 빗금을 줄임 */
  const ROUGH = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js';
  let hid = 0;
  const hatch = (x, y, w, h, gap) => { let d = ''; for (let i = -gap * 2; i < w + h + gap * 2; i += gap) d += `M${x + i} ${y}l${-h} ${h}`; return d; };
  const eyes = (cy, dx, w, h) => `<g class="pxeye hx-ey"><rect x="${24 - dx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="1.2"/><rect x="${24 + dx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="1.2"/></g>`;
  const hx = (n, st, px = 48) => { const id = `hx${++hid}`, sm = px < 24, mid = px < 40, gap = sm ? 12 : mid ? 8 : 6, w = sm ? 6 : 4, h = sm ? 11 : 8, dx = sm ? 8 : 7, dash = sm ? '' : 'stroke-dasharray="5 3.5"', H = (g = gap) => `<path class="hx-h" style="--g:${g}px" d="${hatch(0, 0, 48, 48, g)}"/>`, wrap = (b) => `<svg class="pet-s hx hx${n} ${sm ? 'sm' : ''}" viewBox="0 0 48 48" width="${px}" height="${px}" aria-hidden="true">${b}</svg>`, pad = (y, ph = h + 6) => `<rect class="hx-pad" x="${24 - dx - w / 2 - 3}" y="${y - ph / 2}" width="${dx * 2 + w + 6}" height="${ph}" rx="3"/>`;
    if (n === 6 && window.rough) { const g = window.rough.generator(), mk = (seed) => g.toPaths(g.rectangle(6, 6, 36, 36, { fill: 'x', fillStyle: 'hachure', hachureAngle: -45, hachureGap: sm ? 9 : 5, fillWeight: sm ? 2 : 1.3, stroke: 'x', strokeWidth: sm ? 2.2 : 1.6, roughness: sm ? 0.8 : 1.5, bowing: 1.2, seed })), p = mk(st === 'think' ? 1 + Math.floor(Math.random() * 9999) : 11);
      return wrap(`<defs><clipPath id="${id}"><rect x="5" y="5" width="38" height="38" rx="3"/></clipPath></defs><rect class="hx-bg" x="6" y="6" width="36" height="36" rx="3"/><g clip-path="url(#${id})"><path class="hx-h nof" d="${p[0].d}"/><rect class="hx-fill" x="5" y="5" width="38" height="38"/></g><path class="hx-b" ${dash} d="${p[p.length - 1].d}"/>${pad(23)}${eyes(23, dx, w, h)}`); }
    if (n === 8) return wrap(`<defs><clipPath id="${id}"><rect x="12" y="3" width="28" height="42" rx="4"/></clipPath></defs><path class="hx-t" d="M2 11h6M2 24h6M2 37h6"/><g class="hx-sl"><rect class="hx-bg" x="12" y="3" width="28" height="42" rx="4"/><g clip-path="url(#${id})">${H()}<rect class="hx-fill" x="12" y="3" width="28" height="42"/></g><rect class="hx-b" ${dash} x="12" y="3" width="28" height="42" rx="4"/><path class="hx-b solid" d="M21 40.5h10"/></g><g transform="translate(2 0)">${pad(17)}${eyes(17, dx, w, h)}</g>`);
    if (n === 9) { const Y = [4, 18, 32], rows = Y.map((y, i) => `<rect class="hx-r r${i}" x="7" y="${y}" width="34" height="12" rx="2.5"/>`).join(''), bd = Y.map((y) => `<rect class="hx-b" ${dash} x="7" y="${y}" width="34" height="12" rx="2.5"/>`).join('');
      return wrap(`<defs><clipPath id="${id}">${Y.map((y) => `<rect x="7" y="${y}" width="34" height="12" rx="2.5"/>`).join('')}</clipPath></defs>${Y.map((y) => `<rect class="hx-bg" x="7" y="${y}" width="34" height="12" rx="2.5"/>`).join('')}<g clip-path="url(#${id})">${H()}${rows}</g>${bd}${pad(24, 12)}${eyes(24, dx, w, sm ? 9 : 7)}`); }
    if (n === 10) { const ew = sm ? 7 : 6, eh = sm ? 13 : 12; return wrap(`<defs><mask id="${id}"><rect class="hx-mw" x="4" y="4" width="40" height="40" rx="6"/><g class="pxeye hx-me"><rect x="${24 - 8 - ew / 2}" y="${23 - eh / 2}" width="${ew}" height="${eh}" rx="1.5"/><rect x="${24 + 8 - ew / 2}" y="${23 - eh / 2}" width="${ew}" height="${eh}" rx="1.5"/></g></mask></defs><g mask="url(#${id})">${H(sm ? 8 : 4.5)}<rect class="hx-fill" x="4" y="4" width="40" height="40"/></g>`); }
    /* 7번, 그리고 Rough.js를 못 불러왔을 때의 6번 */
    return wrap(`<defs><clipPath id="${id}"><rect x="6" y="6" width="36" height="36" rx="5"/></clipPath></defs><rect class="hx-bg" x="6" y="6" width="36" height="36" rx="5"/><g clip-path="url(#${id})">${H()}<rect class="hx-fill" x="6" y="6" width="36" height="36"/><rect class="hx-k" x="6" y="6" width="3.5" height="36"/></g><rect class="hx-b" ${dash} x="6" y="6" width="36" height="36" rx="5"/>${pad(23)}${eyes(23, dx, w, h)}`); };
  [6, 7, 8, 9, 10].forEach((k) => { D[k] = { n: '빗금이' }; });
  const face = (n, st = 'idle', px) => n >= 6 ? hx(n, st, px) : n === 3 ? type(st) : spr(n);
  window.PET = { face, names: Object.fromEntries(Object.entries(D).map(([k, v]) => [k, v.n])) };

  const Q = new URLSearchParams(location.search), A = window.ARC, N = +(Q.get('pet') || ((() => { try { return localStorage.getItem('archive.petOff') === '1'; } catch (e) { return false; } })() ? 0 : 6));
  if (!(N >= 1 && N <= 10) || !A || Q.has('embed')) return;
  const PET = D[N], $ = (q, r = document) => r.querySelector(q), esc = A.esc, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = /calendar/.test(location.pathname) ? 'calendar' : /todos/.test(location.pathname) ? 'todos' : /retro/.test(location.pathname) ? 'retro' : 'settings';
  const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };
  const kh = (h) => { const m = Math.round((h % 1) * 60), H = Math.floor(h); return `${H < 12 ? '오전' : '오후'} ${H % 12 || 12}시${m ? ` ${m}분` : ''}`; };
  const overdue = () => A.todos.filter((t) => t.due && t.due < A.TODAY && t.status !== 'done');
  const remain = () => A.onDay(A.TODAY).filter((t) => !t.until && t.status !== 'done');
  const PG = { calendar: ['캘린더', ['오늘 못 끝낸 일 내일로 옮겨줘', '내일 오후 3시에 디자인 리뷰 추가해줘', '오늘 남은 일 알려줘']], todos: ['할 일', ['오늘 남은 일 알려줘', '금요일에 릴리스 노트 정리 추가해줘', '오늘 못 끝낸 일 내일로 옮겨줘']], retro: ['회고', ['오늘 회고 써줘', '어제 회고 써줘', '오늘 남은 일 알려줘']], settings: ['설정', ['연동 문제 알려줘', '오늘 남은 일 알려줘', '내일 오전 10시에 회의 추가해줘']] }[page];
  const NOTE = page === 'retro' ? '오늘 회고 아직 안 썼어요' : page === 'settings' ? '연동 문제가 2개 있어요' : `오늘 남은 일 ${remain().length}개예요`;
  const KEY = 'archive.pet', S = { open: false, busy: false, ctx: null, T: [] };
  try { S.T = JSON.parse(sessionStorage.getItem(KEY) || '[]').filter((m) => m.st !== 'busy'); } catch (e) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(S.T.slice(-6))); } catch (e) {} };

  /* ---------- 규칙으로 흉내 낸 답 ---------- */
  const DW = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 }, tmr = A.add(A.TODAY, 1);
  const dateOf = (s) => { let m; if (/모레/.test(s)) return A.add(A.TODAY, 2); if (/내일/.test(s)) return tmr; if (/어제/.test(s)) return A.add(A.TODAY, -1); if (/오늘/.test(s)) return A.TODAY; if ((m = s.match(/([월화수목금토일])요일/))) { let d = (DW[m[1]] - A.s2d(A.TODAY).getDay() + 7) % 7; return A.add(A.TODAY, d || 7); } return A.TODAY; };
  const timeOf = (s) => { const m = s.match(/(오전|오후|저녁|밤)?\s*(\d{1,2})\s*시(?!간)\s*(반)?/); if (!m) return null; let h = +m[2]; if (/오후|저녁|밤/.test(m[1] || '') && h < 12) h += 12; if (!m[1] && h >= 1 && h <= 7) h += 12; return h + (m[3] ? 0.5 : 0); };
  const dayW = (d) => d === A.TODAY ? '오늘' : d === tmr ? '내일' : A.label(d).replace(/^\d+월 /, '');
  const whenW = (x) => `${dayW(x.date)}${x.start != null ? ` ${kh(x.start)}` : ', 종일'}`;
  const parse = (q) => q.replace(/(할\s*일로\s*)?(추가해\s*줘|만들어\s*줘|잡아\s*줘|넣어\s*줘|등록해\s*줘)[.!]?/g, '').split(/\s*(?:,|그리고)\s*/).map((s) => s.trim()).filter((s) => s.length > 1).map((seg, i) => { const date = dateOf(seg), start = timeOf(seg), m = seg.match(/(\d+(?:\.\d+)?)\s*시간/);
    const title = seg.replace(/[월화수목금토일]요일(까지|에)?/g, '').replace(/(오늘|내일|모레)(까지|에)?/g, '').replace(/(오전|오후|저녁|밤)?\s*\d{1,2}\s*시(?!간)\s*(반)?(에|부터)?/g, '').replace(/\d+(\.\d+)?\s*시간(\s*동안)?/g, '').replace(/\s+/g, ' ').trim();
    return { id: `pet${Date.now()}${i}`, title: title || '새 할 일', date, start, end: start != null ? Math.min(24, start + (m ? +m[1] : 1)) : null }; });
  const retroHTML = (d) => { const l = A.onDay(d).filter((t) => !t.until), dn = l.filter((t) => t.status === 'done'), op = l.filter((t) => t.status !== 'done'), li = (a, e) => a.length ? a.map((t) => `<li>${esc(t.title)}</li>`).join('') : `<li>${e}</li>`; return `<h2>한 일</h2><ul>${li(dn, '끝낸 일이 없어요')}</ul><h2>못 끝낸 일</h2><ul>${li(op, '없어요')}</ul><h2>배운 점</h2><ul><li>한 줄 써 주세요</li></ul>`; };
  function plan(q) { const c = S.ctx;
    if (c) { const t = A.byId(c); if (t) { const nm = (a, b) => `<b>${esc(t.title)}</b>${josa(t.title, a, b).slice(t.title.length)}`;
      if (/완료|끝냈|끝났/.test(q)) return { say: `${nm('을', '를')} 완료로 바꿀까요?`, kind: 'patch', act: '완료로', items: [{ id: t.id, title: t.title, w: `${A.ST[t.status]}에서 완료로`, patch: { status: 'done' } }] };
      if (/옮겨|미뤄|로\s*$/.test(q) || /내일|요일/.test(q)) { const d = dateOf(q); return { say: `${nm('을', '를')} ${dayW(d)}로 옮길까요?`, kind: 'patch', act: '옮기기', items: [{ id: t.id, title: t.title, w: `${dayW(t.date)}에서 ${dayW(d)}로`, patch: { date: d } }] }; } } }
    if (/회고/.test(q) && /(써|쓰|작성|초안)/.test(q)) { const d = dateOf(q); return { say: `${dayW(d)} 기록으로 <b>회고 초안</b>을 써 두었어요. 배운 점은 직접 적어 주세요.`, kind: 'retro', date: d, act: '회고로 저장', html: retroHTML(d) }; }
    if (/연동|문제/.test(q)) return { say: 'Google 보내기 1건이 실패했고, GitHub 권한이 필요해요. 설정의 연동에서 고칠 수 있어요.', kind: 'text' };
    if (/마감\s*지난/.test(q)) { const l = overdue(); if (!l.length) return { say: '마감이 지난 일이 없어요.', kind: 'text' }; return { say: `마감이 지난 <b>${l.length}개</b>를 내일로 옮길까요?`, kind: 'patch', act: `${l.length}개 옮기기`, items: l.map((t) => ({ id: t.id, title: t.title, w: '날짜와 마감을 내일로', patch: { date: tmr, due: tmr } })) }; }
    if (/옮겨|미뤄|넘겨/.test(q)) { const l = remain(); return { say: `남은 <b>${l.length}개</b>를 내일 같은 시간으로 옮길까요?`, kind: 'patch', act: `${l.length}개 옮기기`, items: l.map((t) => ({ id: t.id, title: t.title, w: `내일${t.start != null ? ` ${kh(t.start)}` : ', 시간 미정'}`, patch: { date: tmr } })) }; }
    if (/남은|뭐\s*있|몇\s*개|알려/.test(q)) { const l = remain(); return { say: `오늘 남은 일은 <b>${l.length}개</b>예요.`, kind: 'list', items: l.slice(0, 5).map((t) => ({ title: t.title, w: t.start != null ? kh(t.start) : '시간 미정' })) }; }
    if (/추가|만들|잡아|넣어|등록|회의|리뷰|정리/.test(q)) { const l = parse(q); return { say: `할 일 <b>${l.length}개</b>로 정리했어요.`, kind: 'add', act: `${l.length}개 추가`, items: l.map((x) => ({ ...x, w: whenW(x) })) }; }
    return { say: '할 일을 추가하거나 옮기고, 회고 초안을 쓸 수 있어요. "내일 오후 3시에 디자인 리뷰 추가해줘"처럼 말해 주세요.', kind: 'text' }; }
  const refresh = () => A.rerender && A.rerender();
  const aiTodos = (fn) => { try { sessionStorage.setItem('archive.aiTodos', JSON.stringify(fn(JSON.parse(sessionStorage.getItem('archive.aiTodos') || '[]')))); } catch (e) {} };
  const aiRetros = (fn) => { try { sessionStorage.setItem('archive.aiRetros', JSON.stringify(fn(JSON.parse(sessionStorage.getItem('archive.aiRetros') || '[]')))); } catch (e) {} };
  function apply(m) { if (m.kind === 'add') { const l = m.items.map((x) => ({ id: x.id, title: x.title, status: 'todo', date: x.date, start: x.start, end: x.end, tag: 'work', tags: ['work'], note: 'AI 펫이 만든 할 일', ai: true })); l.forEach((t) => A.todos.push(t)); aiTodos((a) => [...a, ...l]); m.doneW = '추가했어요'; }
    if (m.kind === 'patch') { m.items.forEach((x) => { const t = A.byId(x.id); if (!t) return; x.prev = Object.fromEntries(Object.keys(x.patch).map((k) => [k, t[k]])); Object.assign(t, x.patch); }); m.doneW = m.act === '완료로' ? '완료로 바꿨어요' : '옮겼어요'; }
    if (m.kind === 'retro') { m.rid = `air${Date.now()}`; aiRetros((a) => [...a, { id: m.rid, date: m.date, title: '', html: m.html }]); m.doneW = '회고로 저장했어요'; }
    m.st = 'done'; refresh(); }
  function undo(m) { if (m.kind === 'add') { const ids = m.items.map((x) => x.id); A.todos = A.todos.filter((t) => !ids.includes(t.id)); aiTodos((a) => a.filter((t) => !ids.includes(t.id))); }
    if (m.kind === 'patch') m.items.forEach((x) => { const t = A.byId(x.id); if (t && x.prev) Object.assign(t, x.prev); });
    if (m.kind === 'retro') aiRetros((a) => a.filter((r) => r.id !== m.rid));
    m.st = 'ask'; m.doneW = null; refresh(); }

  /* ---------- 그리기 ---------- */
  const ic = { x: A.ico.x, send: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>' };
  const root = document.createElement('div'); root.id = 'pet'; root.className = N >= 6 ? 'pet v1 hxp' : `pet v${N}`; root.dataset.st = 'idle';
  const inputH = `<div class="pet-in"><input id="pet-i" autocomplete="off" placeholder="${PET.n}에게 부탁하기" aria-label="${PET.n}에게 부탁하기"><button type="button" class="pet-go" data-pet="send" aria-label="보내기">${ic.send}</button></div>`;
  root.innerHTML = `<button type="button" class="pet-note" data-pet="open" hidden></button>
    <section class="pet-card" role="dialog" aria-label="${PET.n}에게 부탁하기">
      <header class="pet-h"><b>${PET.n}</b><small>${PG[0]} 화면을 보는 중</small><button type="button" class="pet-tx" data-pet="hide">숨기기</button><button type="button" class="pet-x" data-pet="close" aria-label="닫기">${ic.x}</button></header>
      <div class="pet-th" aria-live="polite"></div><div class="pet-low"></div>${N === 3 ? '' : inputH}</section>
    ${N === 3 ? `<div class="pet-bar"><button type="button" class="pet-me" data-pet="toggle" aria-label="${PET.n} 부르기" aria-expanded="false" title="Ctrl+/">${face(3)}</button>${inputH}</div>` : `<button type="button" class="pet-me" data-pet="toggle" aria-label="${PET.n} 부르기" aria-expanded="false" title="Ctrl+/">${face(N)}</button>`}`;
  /* 2번은 상단 바 안에 들어감. 화면이 상단 바를 다시 그리면 다시 끼움 */
  const dock = () => { if (N !== 2) { if (!root.isConnected) document.body.append(root); return; } const b = page === 'settings' ? null : $('.top [data-act=palette]'); /* 설정은 상단 바가 시트 뒤에 가려짐 */ if (b && root.nextElementSibling !== b) { const f = document.activeElement === $('#pet-i', root); b.before(root); if (f) $('#pet-i', root).focus(); } else if (!b && !root.isConnected) document.body.append(root); root.classList.toggle('nobar', !b); };
  dock(); if (N === 2) new MutationObserver(dock).observe(document.body, { childList: true, subtree: true });
  const card = $('.pet-card', root), me = $('.pet-me', root), th = $('.pet-th', root), low = $('.pet-low', root), note = $('.pet-note', root), inp = $('#pet-i', root);
  const row = (x) => `<li><span>${esc(x.title)}</span><small>${esc(x.w)}</small></li>`;
  const turn = (m, i) => m.st === 'busy' ? `<article class="pet-t"><p class="pet-q">${esc(m.q)}</p><p class="pet-b">${m.step}</p></article>` : `<article class="pet-t"><p class="pet-q">${esc(m.q)}</p><p class="pet-y">${m.say}</p>${m.items && m.items.length ? `<ul class="pet-l">${m.items.map(row).join('')}</ul>` : ''}
    ${m.act ? (m.st === 'done' ? `<div class="pet-a2"><span>${m.doneW}${m.kind === 'retro' ? ` <a href="d-retro2.html?entry=${m.rid}${N ? `&pet=${N}` : ''}">회고에서 열기</a>` : ''}</span><button type="button" class="pet-tx" data-pet="undo|${i}">되돌리기</button></div>` : m.st === 'no' ? '<div class="pet-a2"><span>안 했어요</span></div>' : `<div class="pet-a2"><button type="button" class="pet-p" data-pet="apply|${i}">${esc(m.act)}</button><button type="button" class="pet-tx" data-pet="no|${i}">안 할래요</button></div>`) : ''}</article>`;
  const quick = () => { const c = S.ctx && A.byId(S.ctx), qs = c ? ['내일로 옮겨줘', '금요일로 옮겨줘', '완료로 바꿔줘'] : N >= 6 && overdue().length ? ['마감 지난 일 내일로 옮겨줘', ...PG[1].filter((x) => !/내일로 옮겨/.test(x)).slice(0, 2)] : PG[1], l = N === 4 && !c ? remain().slice(0, 3) : [];
    return `${c ? `<p class="pet-ctx"><span>${esc(c.title)}</span><button type="button" class="pet-x" data-pet="unctx" aria-label="고른 할 일 빼기">${ic.x}</button></p>` : ''}${!c && N === 4 ? '<p class="pet-tip">할 일 위에 나를 끌어다 놓거나, 여기서 골라요</p>' : ''}${l.length ? `<div class="pet-qs">${l.map((t) => `<button type="button" data-pet="ctx|${t.id}">${esc(t.title)}</button>`).join('')}</div>` : ''}<div class="pet-qs">${qs.map((q) => `<button type="button" data-pet="ask|${esc(q)}">${esc(q)}</button>`).join('')}</div>`; };
  const draw = () => { th.innerHTML = S.T.slice(-6).map((m) => turn(m, S.T.indexOf(m))).join(''); th.hidden = !S.T.length; const lastM = S.T[S.T.length - 1]; low.innerHTML = S.busy || (lastM && lastM.st === 'ask' && lastM.act) ? '' : quick(); th.scrollTop = th.scrollHeight; };
  /* 6~10: 평소에 처리할 게 있으면 말 걸지 않고 모양만 '제안 있음'으로 둠 */
  let boil = 0;
  const setSt = (s) => { if (N >= 6) { const o = overdue().length; if (s === 'idle' && o) s = 'note'; root.style.setProperty('--k', o ? 'var(--danger)' : 'var(--warn)'); } root.dataset.st = s; if (N === 3) me.innerHTML = type(s); if (N >= 6) { me.innerHTML = face(N, s); clearInterval(boil); if (N === 6 && s === 'think' && !RM) boil = setInterval(() => { me.innerHTML = face(6, 'think'); }, 220); } };
  const place = () => { if (N !== 4) return; const W = Math.min(340, innerWidth - 16); root.style.setProperty('--cx', `${Math.round(Math.max(8 - X, Math.min(innerWidth - 8 - W - X, -W / 2 + 21)))}px`); };
  const setOpen = (v, back) => { S.open = v; root.classList.toggle('open', v); me.setAttribute('aria-expanded', v); if (N === 5) { card.inert = !v; } else card.hidden = !v; if (v) { note.hidden = true; place(); draw(); inp.focus(); if (root.dataset.st === 'sleep' || root.dataset.st === 'note') setSt('idle'); } else if (back) me.focus(); };
  function send(q) { q = (q || '').trim(); if (!q || S.busy) return; const r = { q, ...plan(q), st: 'busy', step: '살펴보는 중' }; S.T.push(r); S.busy = true; inp.value = ''; setSt('think'); if (!S.open) setOpen(true); draw();
    setTimeout(() => { r.step = page === 'retro' ? '기록 읽는 중' : '일정 맞춰 보는 중'; draw(); }, 450);
    setTimeout(() => { r.st = 'ask'; S.busy = false; save(); setSt(N >= 6 ? (r.act ? 'note' : 'idle') : 'done'); draw(); inp.focus(); setTimeout(() => { if (root.dataset.st === 'done') setSt('idle'); }, 1600); }, 950); }
  /* 펫 안의 클릭은 화면으로 넘기지 않음(설정 화면은 바깥 클릭을 닫기로 처리) */
  root.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-pet]'); if (!b) return; const [a, v] = b.dataset.pet.split(/\|(.*)/s);
    if (a === 'toggle') { if (Date.now() - (S.dragEnd || 0) < 200) return; return setOpen(!S.open, !S.open ? false : true); }
    if (a === 'open') return setOpen(true); if (a === 'close') return setOpen(false, true);
    if (a === 'send') return send(inp.value); if (a === 'ask') return send(v);
    if (a === 'ctx') { S.ctx = v; draw(); return inp.focus(); } if (a === 'unctx') { S.ctx = null; draw(); return inp.focus(); }
    if (a === 'hide') { setOpen(false); root.hidden = true; return A.toast(`${PET.n}를 숨겼어요. Ctrl+/ 로 다시 불러요`); }
    const m = S.T[+v]; if (!m) return;
    if (a === 'apply') { apply(m); if (m.kind !== 'retro') A.toast(m.doneW); if (N >= 6) { setSt('done'); setTimeout(() => { if (root.dataset.st === 'done') setSt('idle'); }, 1600); } } if (a === 'undo') { undo(m); A.toast('되돌렸어요'); if (N >= 6) setSt('idle'); } if (a === 'no') { m.st = 'no'; if (N >= 6) setSt('idle'); }
    save(); draw(); ($('.pet-p, .pet-a2 .pet-tx', th.lastElementChild) || inp).focus(); });
  if (N === 3) inp.addEventListener('focus', () => { if (!S.open) setOpen(true); });
  /* 화면마다 단축키가 있어서 window 캡처에서 먼저 받음. 입력칸에 치는 글자는 화면으로 넘기지 않음 */
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.open && !document.querySelector('dialog[open]')) { e.stopPropagation(); setOpen(false, true); return; }
    if (OFF) return;
    if ((e.ctrlKey || e.metaKey) && e.code === 'Slash') { e.preventDefault(); e.stopPropagation(); root.hidden = false; setOpen(!S.open, true); return; }
    if (e.target === inp) { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(inp.value); } } }, true);
  document.addEventListener('pointerdown', (e) => { if (S.open && N !== 5 && N !== 3 && !e.target.closest('#pet') && !S.busy) setOpen(false); if (S.open && N === 3 && !e.target.closest('#pet')) setOpen(false); }, true);

  /* 설정에서 끄기: 같은 화면이면 바로, 설정 창이 따로 열려 있으면 storage 이벤트로 */
  let OFF = false;
  window.PET.setOff = (v) => { OFF = v; if (v) { if (S.open) setOpen(false); root.hidden = true; } else root.hidden = false; };
  if (!Q.has('pet')) addEventListener('storage', (e) => { if (e.key === 'archive.petOff') window.PET.setOff(e.newValue === '1'); });

  /* 평소 모습: 시선, 알림, 잠 */
  let tid = 0, last = Date.now(), raf = 0;
  const wake = () => { last = Date.now(); if (root.dataset.st === 'sleep') setSt('idle'); };
  document.addEventListener('pointermove', (e) => { wake(); if (raf || RM) return; raf = requestAnimationFrame(() => { raf = 0; const r = me.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), u = N >= 6 ? 2 : 1; root.style.setProperty('--lx', `${Math.abs(dx) < 40 ? 0 : Math.sign(dx) * u}px`); root.style.setProperty('--ly', `${Math.abs(dy) < 40 ? 0 : Math.sign(dy) * u}px`); }); }, { passive: true });
  document.addEventListener('keydown', wake, true);
  setInterval(() => { if (!S.open && !S.busy && !drag && Date.now() - last > 40000 && (root.dataset.st === 'idle' || (N >= 6 && root.dataset.st === 'note'))) setSt('sleep'); if (N === 3 && root.dataset.st === 'think') { tid = 1 - tid; me.innerHTML = type(tid ? 'think2' : 'think'); } if (N === 3 && root.dataset.st === 'idle') { tid = (tid + 1) % 9; me.innerHTML = type(tid === 0 ? 'blink' : 'idle'); } }, 500);
  setTimeout(() => { if (N >= 6 || S.open || root.hidden || S.T.length && S.busy) return; note.textContent = NOTE; note.hidden = false; setSt('note'); setTimeout(() => { note.hidden = true; if (root.dataset.st === 'note') setSt('idle'); }, 8000); }, Q.has('quiet') ? 1e9 : 3000);

  /* 4번: 화면 아래를 걸어 다니고, 끌어다 할 일 위에 놓으면 그 일을 묻는다 */
  let X = 0, drag = null;
  if (N === 4) { const bounds = () => { const s = $('.side')?.getBoundingClientRect(), t = $('.strip')?.getBoundingClientRect(), a = (s && s.width ? s.right : 0) + 12, b = (t && t.width ? t.left : innerWidth) - 56; return b > a ? [a, b] : [8, Math.max(8, innerWidth - 56)]; };
    const put = (x, y = 0, ms = 0) => { X = x; root.style.transitionDuration = `${ms}ms`; root.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
    const [a0, b0] = bounds(); put(Math.round(b0 - (b0 - a0) * 0.18));
    let tm = 0; const walk = () => { clearTimeout(tm); tm = setTimeout(walk, 4000 + Math.random() * 5000); if (S.open || drag || RM || root.hidden || root.dataset.st === 'sleep' || S.busy) return; const [a, b] = bounds(), nx = Math.round(a + Math.random() * (b - a)), ms = Math.abs(nx - X) / 50 * 1000; me.classList.toggle('flip', nx < X); root.classList.add('walk'); put(nx, 0, Math.min(ms, 3600)); clearTimeout(walk.s); walk.s = setTimeout(() => root.classList.remove('walk'), Math.min(ms, 3600)); };
    tm = setTimeout(walk, 1800); const halt = () => { const r = new DOMMatrix(getComputedStyle(root).transform); put(Math.round(r.m41)); root.classList.remove('walk'); clearTimeout(walk.s); };
    addEventListener('resize', () => { const [a, b] = bounds(); put(Math.min(b, Math.max(a, X))); });
    let hit = null; const mark = (n) => { if (hit === n) return; hit?.classList.remove('pet-hit'); hit = n; n?.classList.add('pet-hit'); };
    me.addEventListener('pointerdown', (e) => { halt(); const r = root.getBoundingClientRect(); drag = { px: e.clientX, py: e.clientY, ox: r.left, oy: 0, moved: false }; me.setPointerCapture(e.pointerId); });
    me.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.px, dy = e.clientY - drag.py; if (!drag.moved && Math.hypot(dx, dy) < 5) return; if (!drag.moved) { drag.moved = true; if (S.open) setOpen(false); root.classList.add('drag'); } put(drag.ox + dx, Math.min(0, dy)); const n = document.elementsFromPoint(e.clientX, e.clientY).map((x) => x.closest('[data-id]')).find((x) => x && !x.closest('#pet')); mark(n || null); });
    const up = () => { if (!drag) return; const d = drag; drag = null; root.classList.remove('drag'); if (!d.moved) return; S.dragEnd = Date.now(); const [a, b] = bounds(); put(Math.max(a, Math.min(b, X)), 0, 180); if (hit) { const id = hit.dataset.id; mark(null); S.ctx = A.byId(id) ? id : null; setTimeout(() => setOpen(true), 190); } };
    me.addEventListener('pointerup', up); me.addEventListener('pointercancel', up); }
  card.hidden = N !== 5; if (N === 5) card.inert = true; draw();
  if (N >= 6) { setSt('idle'); if (N === 6 && !window.rough) { const sc = document.createElement('script'); sc.src = ROUGH; sc.onload = () => setSt(root.dataset.st); document.head.append(sc); } }
  if (Q.has('petopen')) setOpen(true);
})();
