import { describe, expect, it } from "vitest";
import { ALPHA_MIN, createSimulation, fitView, toScreen, toWorld, zoomView, type ForceLink, type ForceNode } from "./engine";

const nodes = (): ForceNode[] => [
  { id: "T", k: "tp", lb: "주제" },
  ...[1, 2, 3].map((i) => ({ id: `h${i}`, k: "th", lb: `큰 주제 ${i}` })),
  ...Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, k: i % 2 ? "e" : "t", lb: `근거 ${i}` })),
];
const links: ForceLink[] = [
  ["T", "h1", "th"],
  ["T", "h2", "th"],
  ["T", "h3", "th"],
  ...Array.from({ length: 12 }, (_, i): ForceLink => [`h${(i % 3) + 1}`, `e${i}`, "src"]),
];
const RADIAL = { tp: 0, th: 100, e: 200, t: 280 };

describe("createSimulation", () => {
  it("settle 은 alpha 가 바닥에 닿을 때까지 한 번에 계산하고 멈춘다(움직임 줄이기)", () => {
    const sim = createSimulation(nodes(), links, { radial: RADIAL });
    const steps = sim.settle(400);
    expect(steps).toBeGreaterThan(100);
    expect(steps).toBeLessThanOrEqual(400);
    expect(sim.running).toBe(false);
    expect(sim.alpha).toBeLessThanOrEqual(ALPHA_MIN);
    expect(sim.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });
  it("같은 입력이면 같은 배치(시드 고정)", () => {
    const a = createSimulation(nodes(), links, { radial: RADIAL });
    const b = createSimulation(nodes(), links, { radial: RADIAL });
    a.settle();
    b.settle();
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(b.nodes.map((n) => [n.x, n.y]));
  });
  it("동심원: 주제는 가운데, 종류마다 제 고리 가까이", () => {
    const sim = createSimulation(nodes(), links, { radial: RADIAL });
    sim.settle();
    const r = (k: string) => {
      const ns = sim.nodes.filter((n) => n.k === k);
      return ns.reduce((a, n) => a + Math.hypot(n.x, n.y), 0) / ns.length;
    };
    expect(r("tp")).toBe(0);
    expect(r("th")).toBeLessThan(r("e"));
    expect(r("e")).toBeLessThan(r("t"));
    expect(Math.abs(r("e") - 200)).toBeLessThan(40);
  });
  it("숨긴 종류는 힘 계산에서 빠지고 이웃 수(반지름)도 다시 센다", () => {
    const sim = createSimulation(nodes(), links);
    const before = sim.byId.get("h1")!.r;
    sim.setHidden(new Set(["e", "t"]));
    expect(sim.nodes.filter((n) => n.vis).map((n) => n.k)).toEqual(["tp", "th", "th", "th"]);
    expect(sim.byId.get("h1")!.r).toBeLessThan(before);
  });
});

describe("fitView", () => {
  it("모든 점이 화면 안에 들어온다", () => {
    const sim = createSimulation(nodes(), links, { radial: RADIAL });
    sim.settle();
    for (const size of [{ w: 800, h: 500 }, { w: 360, h: 640 }, { w: 1400, h: 700 }]) {
      const v = fitView(sim.nodes, size);
      for (const n of sim.nodes) {
        const p = toScreen(v, size, n);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(size.w);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(size.h);
      }
    }
  });
  it("가운데를 맞추고 ease 만큼만 다가간다", () => {
    const pts = [{ x: 100, y: 0 }, { x: 300, y: 100 }];
    const v = fitView(pts, { w: 800, h: 500 });
    const c = toScreen(v, { w: 800, h: 500 }, { x: 200, y: 50 });
    expect(c.x).toBeCloseTo(400);
    expect(c.y).toBeCloseTo(250);
    const half = fitView(pts, { w: 800, h: 500 }, { from: { k: 1, x: 0, y: 0 }, ease: 0.5 });
    expect(half.k).toBeCloseTo((1 + v.k) / 2);
  });
});

describe("zoomView", () => {
  it("마우스 자리를 고정한 채 확대하고 0.3..4 로 묶는다", () => {
    const size = { w: 800, h: 500 };
    const v0 = { k: 1, x: 10, y: -20 };
    const m = { x: 600, y: 120 };
    const w0 = toWorld(v0, size, m);
    const v1 = zoomView(v0, size, 1.5, m.x, m.y);
    const w1 = toWorld(v1, size, m);
    expect(w1.x).toBeCloseTo(w0.x);
    expect(w1.y).toBeCloseTo(w0.y);
    expect(zoomView(v0, size, 100).k).toBe(4);
    expect(zoomView(v0, size, 0.001).k).toBe(0.3);
  });
});
