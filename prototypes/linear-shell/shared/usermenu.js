/* ---------- 왼쪽 아래 사용자 메뉴 (모든 탭 공용) ----------
   사이드바 아래 사용자를 누르면 위로 메뉴가 열린다. 설정은 여기서만 들어간다.
   바로 보임: 이름과 로그인 계정, 설정 열기, 로그아웃
   필요할 때만: 단축키(창), 도움말과 의견(옆 메뉴)
   planner.js 다음에 로드. P.shell 의 .foot 를 바꿔 끼운다. */
(function () {
  const A = window.ARC, P = window.PL;
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ic = {
    ud: I('<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>'), set: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    moon: I('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'), sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    mon: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'), key: I('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
    help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>'), out: I('<path d="M15 12H4M8 8l-4 4 4 4"/><path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"/>'),
    right: I('<path d="m9 6 6 6-6 6"/>'), check: I('<path d="m5 12 5 5 9-10"/>'), book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
    chat: I('<path d="M4 5h16v11H8l-4 4z"/>'), news: I('<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>'), x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  };
  const ME = { name: 'developer', mail: 'developer@archive.dev', ini: 'D' };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const U = (window.UM = { open: false, sub: null, bye: false });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mode = () => +(ls('archive.sview') || 3);
  U.settingsURL = (sec) => `d-settings.html${sec ? '#' + sec : ''}`;

  /* 설정 열기: 3번(창) 시안이면 지금 화면 위에 창으로, 아니면 설정 화면으로 이동 */
  U.openSettings = (sec, sheet) => {
    close();
    if (/d-settings\.html/.test(location.pathname) && window.SX) { window.SX.go(sec || window.SX.cur()); return; }
    if (sheet || mode() === 3) {
      if (document.querySelector('.um-sheet')) return;
      document.body.insertAdjacentHTML('beforeend', `<div class="um-sheet"><iframe title="설정" src="d-settings.html?sv=3&embed=1${sec ? '#' + sec : ''}"></iframe></div>`);
      return;
    }
    try { sessionStorage.setItem('archive.from', location.pathname.split('/').pop() + location.search); } catch (e) {}
    location.href = U.settingsURL(sec);
  };
  window.addEventListener('message', (e) => { if (e.data === 'um:close') document.querySelector('.um-sheet')?.remove(); });

  const foot = () => `<div class="foot um-foot"><button type="button" class="um-btn" data-um aria-haspopup="menu" aria-expanded="${U.open}" aria-label="${ME.name} 메뉴 열기"><span class="av">${ME.ini}</span><span class="um-who"><b>${ME.name}</b></span>${ic.ud}</button></div>`;
  const s0 = P.shell;
  P.shell = (page) => s0(page).replace(/<div class="foot">[\s\S]*?<\/div>/, foot());

  function menuHTML() {
    if (U.bye) return `<div class="um-menu um-bye" role="alertdialog" aria-label="로그아웃 확인"><p><b>로그아웃할까요?</b><span>이 기기에서만 로그아웃돼요. 다른 기기는 설정의 데이터와 보안에서 정리할 수 있어요.</span></p>
      <div class="um-ft"><button type="button" class="um-b" data-umbye="0">취소</button><button type="button" class="um-b p" data-umbye="go">로그아웃</button></div></div>`;
    const sub = U.sub === 'help' ? `<div class="um-menu um-sub" role="menu" aria-label="도움말과 의견">${[[ic.book, '사용법 보기', '처음 쓰는 분을 위한 안내'], [ic.chat, '의견 보내기', '불편한 점, 바라는 점'], [ic.news, '바뀐 점', '최근 업데이트']].map(([i, t, d]) => `<button type="button" role="menuitem" data-umtoast="${t}">${i}<span>${t}<small>${d}</small></span></button>`).join('')}</div>` : '';
    return `<div class="um-menu" role="menu" aria-label="사용자 메뉴">
      <button type="button" role="menuitem" class="um-me" data-umset="acct"><span class="av um-av">${ME.ini}</span><span><b>${esc(ME.name)}</b><small>${esc(ME.mail)}</small></span></button>
      <hr>
      <button type="button" role="menuitem" data-umset="">${ic.set}<span>설정</span><kbd>Ctrl ,</kbd></button>
      <button type="button" role="menuitem" data-umkeys>${ic.key}<span>단축키</span><kbd>?</kbd></button>
      <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded="${U.sub === 'help'}" data-umsub="help">${ic.help}<span>도움말과 의견</span>${ic.right}</button>
      <hr>
      <button type="button" role="menuitem" data-umbye="1">${ic.out}<span>로그아웃</span></button>
    </div>${sub}`;
  }
  function draw() {
    document.querySelectorAll('.um-layer').forEach((x) => x.remove());
    document.querySelectorAll('[data-um]').forEach((b) => b.setAttribute('aria-expanded', U.open));
    if (!U.open) return;
    const b = document.querySelector('[data-um]'); if (!b) return;
    const r = b.getBoundingClientRect();
    document.body.insertAdjacentHTML('beforeend', `<div class="um-layer" style="--um-x:${Math.max(8, r.left)}px;--um-y:${innerHeight - r.top + 6}px">${menuHTML()}</div>`);
    const L = document.querySelector('.um-layer'), m = L.querySelector('.um-menu'), s = L.querySelector('.um-sub');
    if (s) { const t = L.querySelector(`[data-umsub="${U.sub}"]`).getBoundingClientRect(); s.style.left = `${m.getBoundingClientRect().right + 4}px`; s.style.top = `${Math.min(t.top - 4, innerHeight - s.offsetHeight - 8)}px`; }
    (s || m).querySelector('button')?.focus({ preventScroll: true });
  }
  function close() { if (!U.open) return; U.open = false; U.sub = null; U.bye = false; draw(); document.querySelector('[data-um]')?.focus({ preventScroll: true }); }
  U.close = close;

  function keys() {
    const K = [['Ctrl K', '찾기'], ['Ctrl ,', '설정 열기'], ['?', '단축키 보기'], ['Esc', '창, 메뉴 닫기'], ['Enter', '부탁 보내기 (AI 탭)'], ['Shift Enter', '줄 바꾸기 (AI 탭)']];
    document.body.insertAdjacentHTML('beforeend', `<div class="um-keys-w" data-umkx><div class="um-keys" role="dialog" aria-modal="true" aria-labelledby="umk-h"><div class="um-kh"><b id="umk-h">단축키</b><button type="button" class="um-ib" data-umkx aria-label="닫기">${ic.x}</button></div>
      <dl>${K.map(([k, t]) => `<div><dt>${t}</dt><dd>${k.split(' ').map((x) => `<kbd>${x}</kbd>`).join('')}</dd></div>`).join('')}</dl></div></div>`);
    document.querySelector('.um-keys .um-ib').focus();
  }

  window.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const g = (a) => e.target.closest(`[${a}]`); let el;
    if (g('data-um')) { e.stopPropagation(); U.open = !U.open; U.sub = null; U.bye = false; draw(); return; }
    if ((el = g('data-umkx')) && (el.classList.contains('um-ib') || e.target === el)) { e.stopPropagation(); el.closest('.um-keys-w')?.remove() || document.querySelector('.um-keys-w')?.remove(); return; }
    if (!U.open) return;
    if (!e.target.closest('.um-layer')) { close(); return; }
    e.stopPropagation();
    if ((el = g('data-umset'))) { U.openSettings(el.dataset.umset); return; }
    if ((el = g('data-umsub'))) { U.sub = U.sub === el.dataset.umsub ? null : el.dataset.umsub; draw(); return; }
    if (g('data-umkeys')) { close(); keys(); return; }
    if ((el = g('data-umtoast'))) { close(); A.toast(`"${el.dataset.umtoast}"는 시안에서 생략했어요`); return; }
    if ((el = g('data-umbye'))) { const v = el.dataset.umbye; if (v === 'go') { close(); A.toast('로그아웃했어요 (시안이라 화면은 그대로예요)'); } else { U.bye = v === '1'; U.sub = null; draw(); } return; }
  }, true);
  window.addEventListener('keydown', (e) => {
    const typing = e.target.matches && e.target.matches('input, textarea, select, [contenteditable="true"]');
    if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); U.openSettings(); return; }
    if (e.key === 'Escape') {
      const k = document.querySelector('.um-keys-w'); if (k) { k.remove(); e.stopPropagation(); return; }
      if (U.open) { if (U.sub) { U.sub = null; draw(); } else if (U.bye) { U.bye = false; draw(); } else close(); e.stopPropagation(); return; }
      const sh = document.querySelector('.um-sheet'); if (sh) { sh.remove(); e.stopPropagation(); return; }
    }
    if (e.key === '?' && !typing && !document.querySelector('.um-keys-w')) { keys(); return; }
    if (U.open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const box = document.activeElement && document.activeElement.closest('.um-menu'); if (!box) return;
      if (e.key === 'ArrowRight' && document.activeElement.dataset.umsub) { e.preventDefault(); document.activeElement.click(); return; }
      if (e.key === 'ArrowLeft' && box.classList.contains('um-sub')) { e.preventDefault(); const k = U.sub; U.sub = null; draw(); document.querySelector(`[data-umsub="${k}"]`)?.focus(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
      e.preventDefault(); const bs = [...box.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
      bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus();
    }
  }, true);
  window.addEventListener('resize', () => U.open && draw());
  const qs = new URLSearchParams(location.search), q = qs.get('um');
  if (qs.get('sheet')) window.addEventListener('load', () => setTimeout(() => U.openSettings(qs.get('sheet') === '1' ? '' : qs.get('sheet'), true), 300));
  if (q) window.addEventListener('load', () => setTimeout(() => { U.open = true; U.sub = q === 'help' ? q : null; draw(); }, 300));
})();
