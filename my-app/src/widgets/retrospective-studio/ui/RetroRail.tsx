/**
 * 좌우로 넘기기 레일(시안 retro-views.css `.crl`, d-retro2.html railSync/railStep/railCenter).
 * 계획 props(items, currentId, onGo)에 점 색, 위치 글자, 점 줄 아래 이름(marks)을 더했다.
 * 회고 넘기기와 주제 넘기기(Task 5, TopicRail 이 이것을 다시 내보냄)가 같이 쓴다. 내용은 items[].render 로만 받는다.
 * currentId 가 바뀌면(기간 고르기 등) 그 항목으로 옮긴다.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ICON_STROKE } from "@/shared/ui/icons";

export interface RetroRailItem {
  id: string;
  render: () => ReactNode;
  /** 점과 슬라이드 읽어 주기 이름 */
  label?: string;
  /** 슬라이드와 점에 줄 class, style(색 변수) */
  className?: string;
  style?: CSSProperties;
}

export interface RetroRailProps {
  items: RetroRailItem[];
  /** 처음 가운데에 둘 항목(없으면 첫 항목) */
  currentId: string | null;
  /** 가운데 항목이 바뀌면 */
  onGo: (id: string) => void;
  trackLabel: string;
  prevLabel: string;
  nextLabel: string;
  /** 아래 위치 글자 */
  posText?: (item: RetroRailItem, index: number, total: number) => string;
  /** 점 줄 아래 이름(시안 .crl-m, 예: 달이 바뀌는 자리의 "11월"). index 는 items 의 자리 */
  marks?: Array<{ index: number; label: string }>;
}

const reduceMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function RetroRail({ items, currentId, onGo, trackLabel, prevLabel, nextLabel, posText, marks }: RetroRailProps) {
  const track = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(() => Math.max(0, items.findIndex((x) => x.id === currentId)));
  const curRef = useRef(cur);
  const onGoRef = useRef(onGo);
  useEffect(() => {
    onGoRef.current = onGo;
  }, [onGo]);

  const slides = () => [...(track.current?.querySelectorAll<HTMLElement>(".crl-s") ?? [])];
  const center = useCallback((i: number, smooth: boolean) => {
    const t = track.current;
    const el = [...(t?.querySelectorAll<HTMLElement>(".crl-s") ?? [])][i];
    if (!t || !el) return;
    t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: smooth && !reduceMotion() ? "smooth" : "auto" });
  }, []);

  // 처음 자리
  useEffect(() => {
    center(curRef.current, false);
  }, [center]);

  // 밖에서 고른 항목이 바뀌면 그리로 옮긴다
  useEffect(() => {
    const i = items.findIndex((x) => x.id === currentId);
    if (i >= 0 && i !== curRef.current) center(i, true);
    // items 가 바뀔 때마다가 아니라 고른 id 가 바뀔 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, center]);

  // 스크롤하면 가운데 항목을 고른다
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const sync = () => {
      const mid = t.scrollLeft + t.clientWidth / 2;
      let best = 0;
      let bd = Infinity;
      [...t.querySelectorAll<HTMLElement>(".crl-s")].forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best !== curRef.current) {
        curRef.current = best;
        setCur(best);
        const id = t.querySelectorAll<HTMLElement>(".crl-s")[best]?.dataset.rid;
        if (id) onGoRef.current(id);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    // 세로 휠은 한 장씩 넘긴다(가운데 카드 안이 스크롤되는 중이면 그대로)
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>(".crl-s.cur .crl-b") : null;
      if (b && b.scrollHeight > b.clientHeight + 2 && !((e.deltaY < 0 && b.scrollTop <= 0) || (e.deltaY > 0 && b.scrollTop + b.clientHeight >= b.scrollHeight - 1))) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lock < 380 || Math.abs(e.deltaY) < 4) return;
      lock = now;
      const n = t.querySelectorAll(".crl-s").length;
      center(Math.max(0, Math.min(n - 1, curRef.current + (e.deltaY > 0 ? 1 : -1))), true);
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("wheel", onWheel);
    };
  }, [center]);

  const step = (d: number) => center(Math.max(0, Math.min(slides().length - 1, cur + d)), true);
  const go = (i: number) => center(i, true);
  const n = items.length;
  const dotLeft = (i: number) => `${((i + 0.5) / (n + 1)) * 100}%`;
  const item = items[cur];

  return (
    <div
      className="crl"
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if ((e.target as Element).closest("input, textarea, select, [contenteditable='true']")) return;
        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      }}
    >
      <div className="crl-track" ref={track} tabIndex={0} aria-label={trackLabel}>
        {items.map((x, i) => (
          <article
            key={x.id}
            className={`crl-s ${x.className ?? ""}${i === cur ? " cur" : ""}`}
            style={x.style}
            data-rid={x.id}
            aria-label={x.label}
            onClick={i === cur ? undefined : () => go(i)}
          >
            {x.render()}
          </article>
        ))}
      </div>
      <button type="button" className="crl-nav prev" aria-label={prevLabel} disabled={cur <= 0} onClick={() => step(-1)}>
        <ChevronLeft size={18} strokeWidth={ICON_STROKE} />
      </button>
      <button type="button" className="crl-nav next" aria-label={nextLabel} disabled={cur >= n - 1} onClick={() => step(1)}>
        <ChevronRight size={18} strokeWidth={ICON_STROKE} />
      </button>
      <div className="crl-bar">
        <span className="crl-pos">{item && posText ? posText(item, cur, n) : ""}</span>
        <div className="crl-line">
          {items.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={`crl-dot ${x.className ?? ""}`}
              style={{ ...x.style, left: dotLeft(i) }}
              aria-label={x.label}
              title={x.label}
              aria-current={i === cur ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
          {marks?.map((m) => (
            <span key={m.index} className="crl-m" style={{ left: dotLeft(m.index) }}>
              {m.label}
            </span>
          ))}
          <i className="crl-cur" style={{ left: dotLeft(cur) }} />
        </div>
      </div>
    </div>
  );
}
