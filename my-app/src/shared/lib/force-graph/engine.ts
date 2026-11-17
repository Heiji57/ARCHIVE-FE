/**
 * 힘 배치 그래프 엔진. 시안 `prototypes/linear-shell/shared/tgraph.js` 를 TS 로 옮겼다.
 *
 * - 계산(시뮬레이션, 화면 맞추기, 확대)은 DOM 없이 쓰는 순수 함수/객체: `createSimulation`, `fitView`, `zoomView`, `toScreen`.
 * - `createForceGraph(svg, opts)` 는 그 위에 SVG 그리기와 입력(휠 확대, 바탕 끌어 이동, 점 끌어 옮기기,
 *   마우스를 올리면 이웃만 밝게)을 얹는다.
 * - 움직임 줄이기(`prefers-reduced-motion: reduce`)면 배치를 한 번에 끝내고 멈춘 그림으로 그린다.
 *
 * 시안에서 고른 배치는 동심원(GN=5: radial + rings, 원 모양 점, 종류 색) 하나뿐이라 점 모양(shape/glyph),
 * 묶음 테두리(hulls), 깊이, 시간 재생, 찾기는 옮기지 않았다.
 */

export interface ForceNode {
  id: string;
  /** 종류(반지름, 동심원 자리, 굵기를 고른다) */
  k: string;
  /** 이름 */
  lb: string;
  /** 점 색(CSS 값). 없으면 CSS 기본 */
  color?: string | null;
  /** 점 아래 글자(없으면 lb) */
  short?: string;
  /** 읽어 주기 이름(없으면 lb) */
  aria?: string;
  /** 추가 class(예: 할 일 상태) */
  cls?: string;
  /** 처음 자리(없으면 엔진이 정한다) */
  x?: number;
  y?: number;
}

export type ForceLink = [a: string, b: string, kind: string, color?: string | null];

export interface SimOptions {
  /** 서로 밀어내는 힘 배수 */
  repel?: number;
  /** 선 길이 배수 */
  dist?: number;
  /** 점 크기 배수 */
  size?: number;
  /** 종류별 동심원 반지름. 0 이면 가운데에 고정 */
  radial?: Record<string, number> | null;
  /** 종류별 기본 반지름 */
  r0?: Record<string, number> | null;
  /** 선 종류별 길이 배수 */
  linkDist?: Record<string, number>;
  seed?: number;
}

export interface SimNode<N extends ForceNode = ForceNode> {
  n: N;
  id: string;
  k: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 끌고 있는 자리 */
  fx: number | null;
  fy: number | null;
  vis: boolean;
  r: number;
}

export interface SimLink<N extends ForceNode = ForceNode> {
  a: SimNode<N>;
  b: SimNode<N>;
  k: string;
  color: string | null;
}

export interface Simulation<N extends ForceNode = ForceNode> {
  nodes: SimNode<N>[];
  links: SimLink<N>[];
  byId: Map<string, SimNode<N>>;
  nb: Map<string, Set<string>>;
  alpha: number;
  /** 한 걸음 */
  tick(): void;
  /** 다시 움직이게(alpha 를 a 이상으로) */
  heat(a: number): void;
  /** 멈출 때까지(alpha <= ALPHA_MIN) 또는 max 걸음. 걸은 수를 돌려준다 */
  settle(max?: number): number;
  /** 종류를 숨김(숨긴 점은 힘 계산과 그리기에서 빠진다) */
  setHidden(kinds: ReadonlySet<string>): void;
  readonly running: boolean;
}

export const ALPHA_MIN = 0.004;
const R0: Record<string, number> = { tp: 6, th: 4.5, e: 3, x: 3, t: 2.5, c: 2 };
const LD: Record<string, number> = { th: 1.7, src: 1, cm: 0.55, wl: 1.5, x: 1.9 };

export function createSimulation<N extends ForceNode>(
  nodes: readonly N[],
  links: readonly ForceLink[],
  opts: SimOptions = {},
): Simulation<N> {
  const o = { repel: 1, dist: 1, size: 1, radial: null, r0: null, linkDist: LD, seed: 7, ...opts };
  let sd = o.seed;
  const rnd = () => {
    sd = (sd * 9301 + 49297) % 233280;
    return sd / 233280;
  };
  const fresh = nodes.some((n) => n.x == null);
  const sn: SimNode<N>[] = nodes.map((n) => {
    let x = n.x;
    let y = n.y;
    if (x == null || y == null) {
      const a = rnd() * Math.PI * 2;
      const r = n.k === "tp" ? 0 : n.k === "th" ? 60 : 90 + rnd() * 160;
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
    }
    return { n, id: n.id, k: n.k, x, y, vx: 0, vy: 0, fx: null, fy: null, vis: true, r: 3 };
  });
  const byId = new Map(sn.map((n) => [n.id, n]));
  const nb = new Map(sn.map((n) => [n.id, new Set<string>()]));
  const sl: SimLink<N>[] = [];
  for (const [a, b, k, c] of links) {
    const A = byId.get(a);
    const B = byId.get(b);
    if (!A || !B) continue;
    nb.get(a)!.add(b);
    nb.get(b)!.add(a);
    sl.push({ a: A, b: B, k, color: c ?? null });
  }

  const radius = () => {
    for (const n of sn) {
      const deg = [...nb.get(n.id)!].filter((m) => byId.get(m)!.vis).length;
      n.r = (((o.r0 ?? R0)[n.k] ?? 3) + Math.sqrt(deg) * (o.r0 ? 0.3 : 0.6)) * o.size;
    }
  };
  radius();

  const sim: Simulation<N> = {
    nodes: sn,
    links: sl,
    byId,
    nb,
    alpha: fresh ? 1 : 0.12,
    tick() {
      const alpha = sim.alpha;
      const vs = sn.filter((n) => n.vis);
      const rep = 2600 * o.repel;
      const ld = 72 * o.dist;
      for (let i = 0; i < vs.length; i++) {
        for (let j = i + 1; j < vs.length; j++) {
          const p = vs[i];
          const q = vs[j];
          let dx = q.x - p.x;
          let dy = q.y - p.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            dx = rnd() - 0.5;
            dy = rnd() - 0.5;
            d2 = 1;
          }
          if (d2 > 160000) continue;
          const d = Math.sqrt(d2);
          const f = Math.min(10, rep / d2) * Math.max(alpha, 0.02);
          p.vx -= (dx / d) * f;
          p.vy -= (dy / d) * f;
          q.vx += (dx / d) * f;
          q.vy += (dy / d) * f;
        }
      }
      for (const l of sl) {
        if (!l.a.vis || !l.b.vis) continue;
        const dx = l.b.x - l.a.x;
        const dy = l.b.y - l.a.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - ld * (o.linkDist[l.k] ?? 1)) * 0.06 * alpha * (l.k === "wl" ? 0.3 : 1) * (o.radial ? 0.25 : 1);
        l.a.vx += (dx / d) * f;
        l.a.vy += (dy / d) * f;
        l.b.vx -= (dx / d) * f;
        l.b.vy -= (dy / d) * f;
      }
      if (o.radial) {
        for (const n of vs) {
          const R = o.radial[n.k];
          if (R == null) continue;
          if (R === 0) {
            n.x = n.y = n.vx = n.vy = 0;
            continue;
          }
          const d = Math.hypot(n.x, n.y) || 1;
          const f = (d - R) * 0.4 * Math.max(alpha, 0.12);
          n.vx -= (n.x / d) * f;
          n.vy -= (n.y / d) * f;
        }
      }
      for (const n of vs) {
        n.vx -= n.x * 0.0025 * Math.max(alpha, 0.02);
        n.vy -= n.y * 0.0025 * Math.max(alpha, 0.02);
        if (n.fx != null && n.fy != null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = n.vy = 0;
          continue;
        }
        n.vx *= 0.62;
        n.vy *= 0.62;
        n.x += n.vx;
        n.y += n.vy;
      }
      sim.alpha = alpha * 0.982;
    },
    heat(a) {
      sim.alpha = Math.max(sim.alpha, a);
    },
    settle(max = 400) {
      let i = 0;
      for (; i < max && sim.alpha > ALPHA_MIN; i++) sim.tick();
      return i;
    },
    setHidden(kinds) {
      for (const n of sn) n.vis = !kinds.has(n.k);
      radius();
    },
    get running() {
      return sim.alpha > ALPHA_MIN;
    },
  };
  return sim;
}

// ─── 화면 ────────────────────────────────────────────────────────────────────────

/** 화면 변환: 그래프 좌표 p 는 화면의 (W/2 + x + p.x * k, H/2 + y + p.y * k) */
export interface View {
  k: number;
  x: number;
  y: number;
}
export interface Size {
  w: number;
  h: number;
}

export function toScreen(view: View, size: Size, p: { x: number; y: number }) {
  return { x: size.w / 2 + view.x + p.x * view.k, y: size.h / 2 + view.y + p.y * view.k };
}

export function toWorld(view: View, size: Size, s: { x: number; y: number }) {
  return { x: (s.x - size.w / 2 - view.x) / view.k, y: (s.y - size.h / 2 - view.y) / view.k };
}

/**
 * 모든 점이 화면에 들어오게 맞춘 보기. 둘레 여백 pad(가로, 세로 합) 만큼 남긴다(글자 자리).
 * 확대 배수는 [min, max] 로 묶는다. ease < 1 이면 지금 보기에서 그만큼만 다가간다.
 */
export function fitView(
  points: ReadonlyArray<{ x: number; y: number }>,
  size: Size,
  opts: { padX?: number; padY?: number; min?: number; max?: number; from?: View; ease?: number } = {},
): View {
  const { padX = 160, padY = 140, min = 0.35, max = 2.2, from = { k: 1, x: 0, y: 0 }, ease = 1 } = opts;
  if (!points.length) return from;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const k = Math.max(min, Math.min(max, Math.min(size.w / (x1 - x0 + padX), size.h / (y1 - y0 + padY))));
  const to = { k, x: (-(x0 + x1) / 2) * k, y: (-(y0 + y1) / 2) * k };
  return { k: from.k + (to.k - from.k) * ease, x: from.x + (to.x - from.x) * ease, y: from.y + (to.y - from.y) * ease };
}

/** 화면의 (mx, my) 를 중심으로 f 배 확대 */
export function zoomView(view: View, size: Size, f: number, mx = size.w / 2, my = size.h / 2): View {
  const k2 = Math.max(0.3, Math.min(4, view.k * f));
  const wx = (mx - size.w / 2 - view.x) / view.k;
  const wy = (my - size.h / 2 - view.y) / view.k;
  return { k: k2, x: mx - size.w / 2 - wx * k2, y: my - size.h / 2 - wy * k2 };
}

// ─── SVG 그래프 ──────────────────────────────────────────────────────────────────

export interface ForceGraphData<N extends ForceNode = ForceNode> {
  nodes: N[];
  links: ForceLink[];
}

export interface ForceGraphOptions<N extends ForceNode = ForceNode> extends SimOptions {
  /** 동심원 반지름과 글자 */
  rings?: Array<[radius: number, label: string]>;
  /** 모든 점 글자를 늘 보이기 */
  labels?: boolean;
  /** svg 읽어 주기 이름 */
  label?: string;
  /** 글자가 드러나기 시작하는 확대 배수 */
  fade?: number;
  /** 선 굵기 배수 */
  lw?: number;
  /** 처음 보기(없으면 자동 맞추기) */
  view?: View | null;
  /** 움직임 줄이기 판단(기본: matchMedia) */
  reducedMotion?: () => boolean;
  onSelect?: (n: N | null) => void;
  onHover?: (n: N | null) => void;
}

export interface ForceGraphApi<N extends ForceNode = ForceNode> {
  set(data: ForceGraphData<N>): void;
  fit(): void;
  /** f 배 확대(1.25 확대, 0.8 축소) */
  zoom(f: number): void;
  select(id: string | null): void;
  /** 바깥 목록에서 밝게 할 점들 */
  hl(ids: readonly string[] | null): void;
  /** 숨길 종류 */
  hide(kinds: ReadonlySet<string>): void;
  screen(id: string): { x: number; y: number } | null;
  node(id: string): N | null;
  view(): View;
  /** 자동 맞추기 켜고 끄기(손으로 옮기거나 확대하면 꺼진다) */
  auto(on?: boolean): boolean;
  destroy(): void;
}

const NS = "http://www.w3.org/2000/svg";
const mk = (tag: string, at: Record<string, string | number> = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(at)) e.setAttribute(k, String(v));
  return e;
};
const defaultReduce = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function createForceGraph<N extends ForceNode>(
  svg: SVGSVGElement,
  opts: ForceGraphOptions<N> = {},
): ForceGraphApi<N> {
  const o = { fade: 1, lw: 1, labels: false, ...opts };
  const reduce = o.reducedMotion ?? defaultReduce;
  const size = (): Size => ({ w: svg.clientWidth || 800, h: svg.clientHeight || 500 });

  svg.replaceChildren();
  svg.setAttribute("class", `tg-s c-kind${o.labels ? " lab-all" : ""}`);
  svg.setAttribute("role", "group");
  if (o.label) svg.setAttribute("aria-label", o.label);
  const vp = mk("g", { class: "tg-vp" });
  const gr = mk("g", { class: "tg-rings" });
  const gl = mk("g");
  const gn = mk("g");
  vp.append(gr, gl, gn);
  svg.append(vp);
  for (const [R, lb] of o.rings ?? []) {
    gr.append(mk("circle", { r: R }));
    const t = mk("text", { y: -R - 6 });
    t.textContent = lb;
    gr.append(t);
  }

  let sim: Simulation<N> = createSimulation<N>([], [], o);
  let els = new Map<string, { g: SVGGElement; c: SVGCircleElement; t: SVGTextElement }>();
  let les: SVGLineElement[] = [];
  let hidden: ReadonlySet<string> = new Set();
  let view: View = o.view ? { ...o.view } : { k: 1, x: 0, y: 0 };
  let auto = !o.view;
  let raf = 0;
  let sel: string | null = null;
  let hov: string | null = null;
  let ext: Set<string> | null = null;

  function draw() {
    const { w, h } = size();
    vp.setAttribute("transform", `translate(${w / 2 + view.x} ${h / 2 + view.y}) scale(${view.k})`);
    svg.style.setProperty("--lo", Math.max(0, Math.min(1, (view.k - 1.05 * o.fade) * 2.5)).toFixed(2));
    svg.style.setProperty("--lw", ((1.2 * o.lw) / view.k).toFixed(2));
    svg.style.setProperty("--fs", (12 / Math.max(0.7, Math.min(view.k, 1.6))).toFixed(1));
    sim.links.forEach((l, i) => {
      const el = les[i];
      const on = l.a.vis && l.b.vis;
      el.style.display = on ? "" : "none";
      if (!on) return;
      el.setAttribute("x1", l.a.x.toFixed(1));
      el.setAttribute("y1", l.a.y.toFixed(1));
      el.setAttribute("x2", l.b.x.toFixed(1));
      el.setAttribute("y2", l.b.y.toFixed(1));
    });
    for (const n of sim.nodes) {
      const e = els.get(n.id)!;
      e.g.style.display = n.vis ? "" : "none";
      if (!n.vis) continue;
      e.g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
      e.c.setAttribute("r", n.r.toFixed(1));
      e.t.setAttribute("y", (n.r + 11).toFixed(1));
    }
  }
  const visible = () => sim.nodes.filter((n) => n.vis);
  const fitNow = (ease = 1) => {
    view = fitView(visible(), size(), { from: view, ease });
  };
  function frame() {
    sim.tick();
    if (auto) fitNow(0.12);
    draw();
    raf = sim.running ? requestAnimationFrame(frame) : 0;
  }
  function heat(a: number) {
    sim.heat(a);
    if (reduce()) {
      sim.settle(400);
      if (auto) fitNow();
      draw();
      return;
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function mark() {
    const hs = hov ? new Set([hov, ...(sim.nb.get(hov) ?? [])]) : ext;
    const ss = sel && sim.byId.has(sel) ? new Set([sel, ...(sim.nb.get(sel) ?? [])]) : null;
    svg.classList.toggle("hov", !!hs);
    svg.classList.toggle("has", !!ss);
    for (const n of sim.nodes) {
      const g = els.get(n.id)!.g;
      g.classList.toggle("hn", !!hs && hs.has(n.id));
      g.classList.toggle("sel", n.id === sel);
      g.classList.toggle("nb", !!ss && ss.has(n.id));
    }
    sim.links.forEach((l, i) => {
      const el = les[i];
      el.classList.toggle("hn", !!hs && (hov ? l.a.id === hov || l.b.id === hov : hs.has(l.a.id) && hs.has(l.b.id)));
      el.classList.toggle("nb", !!ss && (l.a.id === sel || l.b.id === sel));
    });
  }
  function select(id: string | null) {
    sel = id;
    mark();
    o.onSelect?.(id ? (sim.byId.get(id)?.n ?? null) : null);
  }
  const setHov = (id: string | null) => {
    if (id === hov) return;
    hov = id;
    mark();
    o.onHover?.(id ? (sim.byId.get(id)?.n ?? null) : null);
  };

  // 입력
  const local = (e: PointerEvent | WheelEvent) => {
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const gidOf = (t: EventTarget | null) => (t instanceof Element ? t.closest("[data-gid]")?.getAttribute("data-gid") ?? null : null);
  type Drag = { id: string | null; moved: boolean; x0: number; y0: number; vx: number; vy: number };
  let drag: Drag | null = null;
  const onDown = (e: PointerEvent) => {
    const id = gidOf(e.target);
    svg.setPointerCapture?.(e.pointerId);
    drag = { id, moved: false, x0: e.clientX, y0: e.clientY, vx: view.x, vy: view.y };
    if (id) {
      const w = toWorld(view, size(), local(e));
      const n = sim.byId.get(id)!;
      n.fx = w.x;
      n.fy = w.y;
    }
  };
  const onMove = (e: PointerEvent) => {
    if (!drag) {
      setHov(gidOf(e.target));
      return;
    }
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 3) drag.moved = true;
    if (!drag.moved) return;
    if (!drag.id) {
      auto = false;
      view = { ...view, x: drag.vx + e.clientX - drag.x0, y: drag.vy + e.clientY - drag.y0 };
      draw();
      return;
    }
    const w = toWorld(view, size(), local(e));
    const n = sim.byId.get(drag.id)!;
    n.fx = w.x;
    n.fy = w.y;
    if (reduce()) {
      n.x = w.x;
      n.y = w.y;
      draw();
    } else heat(0.25);
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.id) {
      const n = sim.byId.get(d.id);
      if (n) n.fx = n.fy = null;
      if (!d.moved) select(d.id);
    } else if (!d.moved) select(null);
  };
  const onLeave = () => {
    if (!drag) setHov(null);
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    auto = false;
    const p = local(e);
    view = zoomView(view, size(), Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    draw();
  };
  const onKey = (e: KeyboardEvent) => {
    const id = gidOf(e.target);
    if (id && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      select(id);
    }
  };
  const onFocus = (e: FocusEvent) => setHov(gidOf(e.target));
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
  svg.addEventListener("pointerleave", onLeave);
  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("keydown", onKey);
  svg.addEventListener("focusin", onFocus);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (auto) fitNow(); draw(); }) : null;
  ro?.observe(svg);

  const api: ForceGraphApi<N> = {
    set(data) {
      cancelAnimationFrame(raf);
      raf = 0;
      // 이미 있던 점은 자리를 이어받는다
      const prev = new Map(sim.nodes.map((n) => [n.id, n]));
      const nodes = data.nodes.map((n) => {
        const p = prev.get(n.id);
        return p ? { ...n, x: p.x, y: p.y } : n;
      });
      sim = createSimulation(nodes, data.links, o);
      sim.setHidden(hidden);
      gl.replaceChildren();
      gn.replaceChildren();
      les = sim.links.map((l) => {
        const el = mk("line", { class: `tg-l ${l.k}` }) as SVGLineElement;
        if (l.color) el.style.setProperty("--c", l.color);
        gl.append(el);
        return el;
      });
      els = new Map();
      for (const n of sim.nodes) {
        const g = mk("g", {
          class: `tg-n k-${n.k}${n.n.cls ? ` ${n.n.cls}` : ""}`,
          tabindex: 0,
          role: "button",
          "aria-label": n.n.aria ?? n.n.lb,
          "data-gid": n.id,
        }) as SVGGElement;
        if (n.n.color) g.style.setProperty("--c", n.n.color);
        const c = mk("circle") as SVGCircleElement;
        const t = mk("text") as SVGTextElement;
        t.textContent = n.n.short ?? n.n.lb;
        g.append(c, t);
        gn.append(g);
        els.set(n.id, { g, c, t });
      }
      mark();
      if (!auto) draw();
      heat(sim.alpha);
    },
    fit() {
      auto = false;
      fitNow();
      draw();
    },
    zoom(f) {
      auto = false;
      view = zoomView(view, size(), f);
      draw();
    },
    select,
    hl(ids) {
      ext = ids && ids.length ? new Set(ids) : null;
      mark();
    },
    hide(kinds) {
      hidden = new Set(kinds);
      sim.setHidden(hidden);
      mark();
      heat(0.5);
      draw();
    },
    screen(id) {
      const n = sim.byId.get(id);
      return n ? toScreen(view, size(), n) : null;
    },
    node: (id) => sim.byId.get(id)?.n ?? null,
    view: () => ({ ...view }),
    auto(on) {
      if (on != null) {
        auto = on;
        if (on) {
          fitNow();
          draw();
        }
      }
      return auto;
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onUp);
      svg.removeEventListener("pointerleave", onLeave);
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("keydown", onKey);
      svg.removeEventListener("focusin", onFocus);
    },
  };
  return api;
}
