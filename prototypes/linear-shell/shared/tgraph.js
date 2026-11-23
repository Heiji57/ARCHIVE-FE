/* 주제 연결 그래프: 점과 선을 SVG 로 그리고, 힘 배치를 매 프레임 조금씩 진행한다.
   휠로 확대, 바탕을 끌어 이동, 점을 끌어 옮기기, 마우스를 올리면 이웃만 밝게, 확대할수록 글자가 드러남.
   움직임 줄이기 설정이면 배치를 한 번에 끝내고 멈춘 그림으로 보여 준다. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mk = (tag, at = {}) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  const R0 = { tp: 6, th: 4.5, e: 3, x: 3, t: 2.5, c: 2 };
  const LD = { th: 1.7, src: 1, cm: 0.55, wl: 1.5, x: 1.9 };
  /* 점 모양(mode: 'shape')과 점 안 아이콘(mode: 'glyph') */
  const SH = { th: 'sq', t: 'dm', c: 'tr' };
  const shapeD = (k, r) => { const s = SH[k]; if (s === 'sq') { const a = r * 0.92; return `M${-a} ${-a}h${2 * a}v${2 * a}h${-2 * a}z`; } if (s === 'dm') { const a = r * 1.35; return `M0 ${-a}L${a} 0L0 ${a}L${-a} 0z`; } if (s === 'tr') { const a = r * 1.4; return `M0 ${-a}L${a * 0.9} ${a * 0.62}L${-a * 0.9} ${a * 0.62}z`; } return `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0z`; };
  const GY = { tp: 'M4.5 2.5h7v11l-3.5-2.6-3.5 2.6z', th: 'M3.5 3.5h9v9h-9z', e: 'M4 2h5l3 3v9H4z', x: 'M4 2h5l3 3v9H4z', t: 'M3 8.5l3 3L13 4.5', c: 'M1.5 8h4M10.5 8h4M8 5.6a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 1 1 0-4.8' };
  const hull = (P) => { if (P.length < 3) return P; P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of P.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); };

  function mount(host, data, o = {}) {
    const opt = Object.assign({ repel: 1, dist: 1, size: 1, lw: 1, fade: 1, color: 'mono', depth: 0, center: 'T', until: null, query: '', hide: new Set(), sel: null, r0: null, mode: null, hulls: false, radial: null, rings: null, labels: false }, o);
    const N = data.nodes, L = data.links, I = new Map(N.map((n) => [n.id, n]));
    const nb = new Map(N.map((n) => [n.id, new Set()])); L.forEach(([a, b]) => { nb.get(a).add(b); nb.get(b).add(a); });
    let sd = 7; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
    const fresh = N.some((n) => n.x == null);
    N.forEach((n) => { if (n.x == null) { const a = rnd() * Math.PI * 2, r = n.k === 'tp' ? 0 : n.k === 'th' ? 60 : 90 + rnd() * 160; n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; } n.vx = 0; n.vy = 0; n.fx = null; });

    host.innerHTML = '';
    const svg = mk('svg', { class: `tg-s c-${opt.color} ${opt.mode ? 'm-' + opt.mode : ''} ${opt.labels ? 'lab-all' : ''}`, role: 'group', 'aria-label': o.label || '연결' });
    const vp = mk('g', { class: 'tg-vp' }), gr = mk('g', { class: 'tg-rings' }), gh = mk('g', { class: 'tg-hulls' }), gl = mk('g'), gn = mk('g');
    vp.append(gr, gh, gl, gn);
    (opt.rings || []).forEach(([R, lb]) => { gr.append(mk('circle', { r: R })); const t = mk('text', { y: -R - 6 }); t.textContent = lb; gr.append(t); });
    const HU = opt.hulls ? N.filter((n) => n.k === 'th').map((h) => { const p = mk('path', { class: 'tg-hull' }); p.style.setProperty('--c', (h.cols && h.cols.group) || 'var(--ink3)'); gh.append(p); return { h, el: p }; }) : []; svg.append(vp); host.append(svg);
    const LE = L.map(([a, b, k, c]) => { const l = mk('line', { class: `tg-l ${k}` }); if (c) l.style.setProperty('--c', c); gl.append(l); return { a: I.get(a), b: I.get(b), el: l, k }; });
    N.forEach((n) => { const g = mk('g', { class: `tg-n k-${n.k} ${n.st || ''}`, tabindex: '0', role: 'button', 'aria-label': n.aria || n.lb, 'data-gid': n.id });
      const c = mk(opt.mode === 'shape' ? 'path' : 'circle'), t = mk('text'); t.textContent = n.short || n.lb; g.append(c); if (opt.mode === 'glyph') { n.gy = mk('path', { class: 'gy', d: GY[n.k] || '' }); g.append(n.gy); } g.append(t); gn.append(g); n.el = g; n.ce = c; n.te = t; });

    let view = o.view ? { ...o.view } : { x: 0, y: 0, k: 1 }, alpha = fresh ? 1 : 0.12, raf = 0, auto = !o.view, sel = opt.sel, hov = null, ext = null;
    const W = () => host.clientWidth || 800, H = () => host.clientHeight || 500;

    function computeVis() {
      let inDepth = null;
      if (opt.depth > 0 && I.has(opt.center)) { inDepth = new Set([opt.center]); let fr = [opt.center]; for (let d = 0; d < opt.depth; d++) { const nx = []; fr.forEach((id) => nb.get(id).forEach((m) => { if (!inDepth.has(m)) { inDepth.add(m); nx.push(m); } })); fr = nx; } }
      N.forEach((n) => { n.vis = !opt.hide.has(n.k === 'x' ? 'e' : n.k) && (!inDepth || inDepth.has(n.id)) && (!opt.until || !n.d || n.d <= opt.until); });
      if (opt.until) N.forEach((n) => { if (n.k === 'th') n.vis = n.vis && [...nb.get(n.id)].some((m) => I.get(m).vis && I.get(m).k !== 'tp'); });
      const q = opt.query.trim().toLowerCase();
      N.forEach((n) => { n.el.classList.toggle('qm', !!q && n.lb.toLowerCase().includes(q)); n.el.style.setProperty('--c', (n.cols && n.cols[opt.color]) || ''); });
      svg.classList.toggle('q', !!q); svg.setAttribute('class', svg.getAttribute('class').replace(/c-\w+/, `c-${opt.color}`));
      N.forEach((n) => { const deg = [...nb.get(n.id)].filter((m) => I.get(m).vis).length; n.r = (((opt.r0 || R0)[n.k] || 3) + Math.sqrt(deg) * (opt.r0 ? 0.3 : 0.6)) * opt.size; });
    }
    function tick() {
      const vs = N.filter((n) => n.vis), rep = 2600 * opt.repel, ld = 72 * opt.dist;
      for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) { const p = vs[i], q = vs[j]; let dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 1) { dx = rnd() - 0.5; dy = rnd() - 0.5; d2 = 1; } if (d2 > 160000) continue; const d = Math.sqrt(d2), f = Math.min(10, rep / d2) * Math.max(alpha, 0.02); p.vx -= dx / d * f; p.vy -= dy / d * f; q.vx += dx / d * f; q.vy += dy / d * f; }
      LE.forEach((l) => { if (!l.a.vis || !l.b.vis) return; const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1, f = (d - ld * (LD[l.k] || 1)) * 0.06 * alpha * (l.k === 'wl' ? 0.3 : 1) * (opt.radial ? 0.25 : 1); l.a.vx += dx / d * f; l.a.vy += dy / d * f; l.b.vx -= dx / d * f; l.b.vy -= dy / d * f; });
      if (opt.radial) vs.forEach((n) => { const R = opt.radial[n.k]; if (R == null) return; if (R === 0) { n.x = n.y = n.vx = n.vy = 0; return; } const d = Math.hypot(n.x, n.y) || 1, f = (d - R) * 0.4 * Math.max(alpha, 0.12); n.vx -= n.x / d * f; n.vy -= n.y / d * f; });
      vs.forEach((n) => { n.vx -= n.x * 0.0025 * Math.max(alpha, 0.02); n.vy -= n.y * 0.0025 * Math.max(alpha, 0.02); if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; return; } n.vx *= 0.62; n.vy *= 0.62; n.x += n.vx; n.y += n.vy; });
      alpha *= 0.982;
    }
    function draw() {
      vp.setAttribute('transform', `translate(${W() / 2 + view.x} ${H() / 2 + view.y}) scale(${view.k})`);
      svg.style.setProperty('--lo', Math.max(0, Math.min(1, (view.k - 1.05 * opt.fade) * 2.5)).toFixed(2));
      svg.style.setProperty('--lw', (1.2 * opt.lw / view.k).toFixed(2));
      svg.style.setProperty('--fs', (12 / Math.max(0.7, Math.min(view.k, 1.6))).toFixed(1));
      LE.forEach((l) => { const on = l.a.vis && l.b.vis; l.el.style.display = on ? '' : 'none'; if (on) { l.el.setAttribute('x1', l.a.x.toFixed(1)); l.el.setAttribute('y1', l.a.y.toFixed(1)); l.el.setAttribute('x2', l.b.x.toFixed(1)); l.el.setAttribute('y2', l.b.y.toFixed(1)); } });
      N.forEach((n) => { n.el.style.display = n.vis ? '' : 'none'; if (!n.vis) return; n.el.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`); if (opt.mode === 'shape') n.ce.setAttribute('d', shapeD(n.k, n.r)); else n.ce.setAttribute('r', n.r.toFixed(1)); if (n.gy) n.gy.setAttribute('transform', `translate(${(-n.r * 0.62).toFixed(2)} ${(-n.r * 0.62).toFixed(2)}) scale(${(n.r * 1.24 / 16).toFixed(3)})`); n.te.setAttribute('y', (n.r * (opt.mode === 'shape' && n.k !== 'e' ? 1.35 : 1) + 11).toFixed(1)); });
      HU.forEach((u) => { const ms = [u.h, ...[...nb.get(u.h.id)].map((m) => I.get(m)).filter((m) => m.k !== 'tp')].filter((m) => m.vis); u.el.style.display = u.h.vis ? '' : 'none'; if (!u.h.vis) return; const P = hull(ms.map((m) => [m.x, m.y])); u.el.setAttribute('d', 'M' + P.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z'); });
      if (o.onDraw) o.onDraw(api);
    }
    function frame() { tick(); if (auto) fit(true, 0.12); draw(); raf = alpha > 0.004 ? requestAnimationFrame(frame) : 0; }
    function heat(a) { alpha = Math.max(alpha, a); if (reduce()) { for (let i = 0; i < 400 && alpha > 0.004; i++) tick(); if (auto) fit(true); draw(); return; } if (!raf) raf = requestAnimationFrame(frame); }
    function fit(silent, ease = 1) { const vs = N.filter((n) => n.vis); if (!vs.length) return; const xs = vs.map((n) => n.x), ys = vs.map((n) => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const k = Math.max(0.35, Math.min(2.2, Math.min(W() / (x1 - x0 + 160), H() / (y1 - y0 + 140)))); const to = { k, x: -(x0 + x1) / 2 * k, y: -(y0 + y1) / 2 * k }; view = { k: view.k + (to.k - view.k) * ease, x: view.x + (to.x - view.x) * ease, y: view.y + (to.y - view.y) * ease }; if (!silent) draw(); }
    function zoomAt(f, mx = W() / 2, my = H() / 2) { auto = false; const k2 = Math.max(0.3, Math.min(4, view.k * f)), wx = (mx - W() / 2 - view.x) / view.k, wy = (my - H() / 2 - view.y) / view.k; view = { k: k2, x: mx - W() / 2 - wx * k2, y: my - H() / 2 - wy * k2 }; draw(); }
    const world = (e) => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - W() / 2 - view.x) / view.k, y: (e.clientY - r.top - H() / 2 - view.y) / view.k, mx: e.clientX - r.left, my: e.clientY - r.top }; };
    const screen = (n) => ({ x: W() / 2 + view.x + n.x * view.k, y: H() / 2 + view.y + n.y * view.k });

    function mark() {
      const hs = hov ? new Set([hov, ...nb.get(hov)]) : ext, ss = sel && I.has(sel) ? new Set([sel, ...nb.get(sel)]) : null;
      svg.classList.toggle('hov', !!hs); svg.classList.toggle('has', !!ss);
      N.forEach((n) => { n.el.classList.toggle('hn', !!hs && hs.has(n.id)); n.el.classList.toggle('sel', n.id === sel); n.el.classList.toggle('nb', !!ss && ss.has(n.id)); });
      LE.forEach((l) => { l.el.classList.toggle('hn', !!hs && (hov ? (l.a.id === hov || l.b.id === hov) : hs.has(l.a.id) && hs.has(l.b.id))); l.el.classList.toggle('nb', !!ss && (l.a.id === sel || l.b.id === sel)); });
    }
    let drag = null;
    svg.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-gid]'); const w = world(e); svg.setPointerCapture(e.pointerId);
      drag = g ? { n: I.get(g.dataset.gid), moved: false, x0: e.clientX, y0: e.clientY } : { pan: true, vx: view.x, vy: view.y, x0: e.clientX, y0: e.clientY, moved: false }; if (g) { drag.n.fx = w.x; drag.n.fy = w.y; } });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) { const g = e.target.closest('[data-gid]'), id = g ? g.dataset.gid : null; if (id !== hov) { hov = id; mark(); if (o.onHover) o.onHover(id ? I.get(id) : null, api); } return; }
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 3) drag.moved = true; if (!drag.moved) return;
      if (drag.pan) { auto = false; view.x = drag.vx + e.clientX - drag.x0; view.y = drag.vy + e.clientY - drag.y0; draw(); if (o.onHover && hov) o.onHover(I.get(hov), api); return; }
      const w = world(e); drag.n.fx = w.x; drag.n.fy = w.y; heat(0.25); if (reduce()) { drag.n.x = w.x; drag.n.y = w.y; draw(); } });
    const up = (e) => { if (!drag) return; const d = drag; drag = null; if (d.n) { d.n.fx = null; if (!d.moved) select(d.n.id); } else if (!d.moved) select(null); };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('pointerleave', () => { if (hov && !drag) { hov = null; mark(); if (o.onHover) o.onHover(null, api); } });
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    svg.addEventListener('keydown', (e) => { const g = e.target.closest('[data-gid]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(g.dataset.gid); } });
    svg.addEventListener('focusin', (e) => { const g = e.target.closest('[data-gid]'); hov = g ? g.dataset.gid : null; mark(); if (o.onHover) o.onHover(hov ? I.get(hov) : null, api); });
    function select(id) { sel = id; mark(); if (o.onSelect) o.onSelect(id ? I.get(id) : null, api); }

    const api = {
      set(p) { const re = ['repel', 'dist', 'depth', 'center', 'until', 'hide'].some((k) => k in p); Object.assign(opt, p); computeVis(); mark(); if (re) heat(0.5); draw(); if (re && 'center' in p && opt.depth) setTimeout(() => fit(), reduce() ? 0 : 500); },
      fit: () => { auto = false; fit(); }, hl(ids) { ext = ids && ids.length ? new Set(ids) : null; mark(); }, zoom: (f) => zoomAt(f), select, screen, node: (id) => I.get(id), get view() { return view; }, get auto() { return auto; }, get opt() { return opt; },
      destroy() { cancelAnimationFrame(raf); },
    };
    computeVis(); mark(); if (o.view) draw(); heat(fresh ? 1 : 0.12); if (!o.view && !fresh) fit();
    return api;
  }
  window.TG = { mount };
})();
