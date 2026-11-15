/* ARCHIVE 로고 시안. ?logo=1..40 (없으면 39번, ?logo=0이면 옛 모양). 사이드바와 파비콘에 들어감. 탭을 옮겨도 ?logo, ?pet 을 유지 */
(() => {
  const K = 'var(--lg-a, currentColor)', C = 'var(--lg-b, var(--primary-h))';
  /* 같은 로고를 여러 번 그려도 그라데이션과 마스크가 각자의 색을 쓰도록 id를 나눔 */
  let uid = 0;
  const svg = (b) => { const u = ++uid; return `<svg class="lg-m" viewBox="0 0 24 24" aria-hidden="true">${b.replace(/(id="|url\(#)(l[ag]\d+[a-z]*)/g, `$1$2-${u}`)}</svg>`; };
  const ring = (r, gap, rot, col) => `<circle cx="12" cy="12" r="${r}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" pathLength="100" stroke-dasharray="${100 - gap} ${gap}" transform="rotate(${rot} 12 12)"/>`;
  const L = {
    1: { n: '책갈피 A', d: '캘린더 칸에 꽂히는 책갈피의 갈라진 끝이 A의 다리가 되고, 위쪽 구멍이 A의 속이 됩니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: `<path fill="${K}" fill-rule="evenodd" d="M5.5 2h13a1 1 0 0 1 1 1v18.2a.6.6 0 0 1-1 .45L12 15l-6.5 6.65a.6.6 0 0 1-1-.45V3a1 1 0 0 1 1-1Zm6.5 4.2L8.9 11.8h6.2L12 6.2Z"/>` },
    2: { n: '지금 선', d: 'A의 가로획이 캘린더의 "지금" 표시입니다. 점이 왼쪽으로 튀어나와 시간표의 현재 시각과 같은 모양이 됩니다.', w: 'archive', wc: 'lgw-low', b: `<path fill="none" stroke="${K}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 21 13 3.5 19.5 21"/><path fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round" d="M4.5 15h13.2"/><circle cx="3.6" cy="15" r="2.4" fill="${C}"/>` },
    3: { n: '기댄 두 권', d: '서로 기댄 책 두 권이 A가 되고, 눕혀 놓은 한 권이 가로획이 됩니다.', w: 'ARCHIVE', wc: 'lgw-cap', b: `<path fill="${K}" d="M2.4 22 10.6 2.3l3.3 1.4L6.4 22Z"/><path fill="${K}" opacity=".62" d="M21.6 22 15.2 6.5l-2 4.8L17.6 22Z"/><rect x="7.6" y="14.6" width="9" height="3.2" rx=".5" fill="${C}"/>` },
    4: { n: '기록 상자', d: '보관 상자에 오늘의 종이 한 장이 들어가는 순간입니다. 뚜껑 위로 나온 종이만 색을 넣었습니다.', w: 'Archive', wc: 'lgw-title', b: `<rect x="9" y="1.6" width="6" height="6" rx="1" fill="${C}"/><rect x="2.5" y="5.6" width="19" height="5.2" rx="1.2" fill="${K}"/><path fill="${K}" fill-rule="evenodd" d="M4 12.2h16v7.3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.3Zm5.6 2.6a1 1 0 1 0 0 2h4.8a1 1 0 1 0 0-2H9.6Z"/>` },
    5: { n: '나이테', d: '하루가 쌓여 굵어지는 나이테입니다. 가운데 점이 오늘이고, 끊긴 자리가 돌아가며 시간이 흐르는 느낌을 줍니다.', w: 'archive', wc: 'lgw-mono', b: `${ring(10, 16, -60, K)}${ring(6.4, 22, 70, K)}<circle cx="12" cy="12" r="2.4" fill="${C}"/>` },
  };
  /* 6~10: 일곱 칸 A. A.R.C.H.I.V.E 일곱 글자 = 일주일 일곱 칸. 칸은 확정된 일정처럼 채우고, 오늘 한 칸만 색. 빗금은 AI 전용이라 쓰지 않음 */
  const f = (n) => +n.toFixed(2), box = (x, y, w, h, col, rx = 0.9) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${col}"/>`;
  const seven = () => [[8.6, 1.3, 6.8], [5.9, 7.1, 5.5], [12.6, 7.1, 5.5], [3.5, 12.9, 7.9], [12.6, 12.9, 7.9], [1.2, 18.7, 5.5], [17.3, 18.7, 5.5]].map(([x, y, w], i) => box(x, y, w, 4.6, i ? K : C)).join('');
  const slant = () => { const k = 0.32, W = 4.2, xo = (y) => 1.2 + (22 - y) * k, seg = [[2, 7.8], [9.1, 14.9], [16.2, 22]], poly = (m) => seg.map(([a, b]) => { const P = [[xo(a), a], [xo(a) + W, a], [xo(b) + W, b], [xo(b), b]].map(([x, y]) => `${f(m ? 24 - x : x)},${y}`).join(' '); return `<polygon points="${P}" fill="${K}"/>`; }).join(''); return poly(false) + poly(true) + box(9.3, 12.8, 5.4, 3.6, C, 0.7); };
  const dots = () => [[9.05, 3.5], [6, 12], [2.95, 20.5], [14.95, 3.5], [18, 12], [21.05, 20.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.75" fill="${K}"/>`).join('') + `<circle cx="12" cy="13.6" r="2.75" fill="${C}"/>`;
  const week = () => `<path fill="${K}" fill-rule="evenodd" d="M4 1h16a3 3 0 0 1 3 3v11.5a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3Zm8 2.4L6.3 16h3l.8-2.3h3.8l.8 2.3h3L12 3.4Zm0 5.1 1.1 3h-2.2l1.1-3Z"/>${[...Array(7)].map((_, i) => box(0.05 + i * 3.55, 20, 2.3, 3, i ? K : C, 0.6)).join('')}`;
  const rows = () => { let o = ''; for (let i = 0; i < 7; i++) { const w = 6 + i * 2.75, y = 0.7 + i * 3.4, x = 12 - w / 2, gap = { 2: 2.2, 4: 5, 5: 7.75, 6: 10.5 }[i], col = i === 3 ? C : K; o += gap ? box(x, y, (w - gap) / 2, 2.2, col, 0.6) + box(12 + gap / 2, y, (w - gap) / 2, 2.2, col, 0.6) : box(x, y, w, 2.2, col, 0.6); } return o; };
  /* 11~15: 10번 일곱 줄의 변형. 줄 하나 = 하루, 가로획 줄 = 오늘 */
  const stack = (o) => { let y = o.y0, r = ''; for (let i = 0; i < 7; i++) { const h = o.h(i), w = o.w(i, y + h / 2), x = 12 - w / 2, g = o.gap(i), col = i === 3 ? C : K, dl = o.dl ? o.dl[i] : 0, dr = o.dr ? o.dr[i] : 0; r += g ? box(x + dl, y, (w - g) / 2 - dl, h, col, o.rx(h)) + box(12 + g / 2, y, (w - g) / 2 - dr, h, col, o.rx(h)) : box(x + dl, y, w - dl - dr, h, col, o.rx(h)); y += h + o.g; } return r; };
  const W16 = [4, 6, 8, 10, 12, 14, 16], G16 = [0, 0, 2, 0, 6, 8, 10];
  const pixel = () => stack({ y0: 1.5, g: 1.5, h: () => 1.5, w: (i) => W16[i] * 1.5, gap: (i) => G16[i] * 1.5, rx: () => 0 });
  const pill = () => stack({ y0: 0.7, g: 1, h: () => 2.4, w: (i) => 6 + i * 2.75, gap: (i) => ({ 2: 2.4, 4: 5, 5: 7.75, 6: 10.5 })[i] || 0, rx: () => 1.2, dl: [0, 0.8, -0.5, 0, 0.8, -0.7, 0.5], dr: [0, -0.6, 0.7, 0, -0.5, 0.8, -0.4] });
  const beam = () => { const ix = (y) => 10.9 + (y - 0.7) * 0.34, lf = (i) => 12 - (6 + i * 2.75) / 2; let o = `<polygon points="10.9,0.7 15,0.7 23.6,23.3 18.7,23.3" fill="${K}"/>`; for (let i = 0; i < 7; i++) { const y = 0.7 + i * 3.4, x = lf(i), full = i === 0 || i === 3, end = ix(y + 1.1) - 1.2, w = full ? end - x : Math.min(4.6, end - x); o += box(x, y, Math.max(1.4, w), 2.2, i === 3 ? C : K, 0.5); } return o; };
  const band = () => stack({ y0: 1, g: 1.1, h: (i) => (i === 3 ? 4.6 : 1.8), w: (i, y) => 5.5 + y * 0.74, gap: (i) => ({ 2: 2.2, 4: 5, 5: 7.5, 6: 10 })[i] || 0, rx: () => 0.6 });
  const grow = () => { const H = [1.2, 1.5, 1.9, 2.4, 2.9, 3.4, 3.9]; return stack({ y0: 0.4, g: 1, h: (i) => H[i], w: (i, y) => 5 + y * 0.8, gap: (i) => ({ 2: 2.2, 4: 5, 5: 7, 6: 9 })[i] || 0, rx: () => 0.5 }); };
  Object.assign(L, {
    11: { n: '픽셀 줄', d: '줄 두께와 간격을 16px 격자에 맞췄습니다. 파비콘에서 줄이 뭉치지 않고 한 줄씩 또렷합니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: pixel() },
    12: { n: '둥근 막대', d: '줄 끝을 둥글게 하고 길이를 조금씩 달리했습니다. 길이가 제각각인 일정 막대가 모인 모습입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: pill() },
    13: { n: '한 획 기둥', d: '오른쪽 획은 끊지 않고, 왼쪽의 일곱 날이 그 획에 기대어 쌓입니다. 줄 수는 그대로 두고 A의 뼈대를 세웠습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: beam() },
    14: { n: '오늘 띠', d: '가로획인 오늘 줄만 두껍게 키웠습니다. 작아져도 오늘 띠가 남아 A의 가로획이 보입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: band() },
    15: { n: '쌓일수록 굵게', d: '아래로 갈수록 줄이 굵어집니다. 지난날이 쌓여 무게가 생기는 모습이고, 다리가 튼튼해집니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: grow() },
  });
  /* 16~20: 12번의 둥근 막대를 A에서 풀어낸 추상 표식. 막대 일곱 개 = 일주일, 한 개만 오늘의 색. 기울인 줄 무리는 빗금(AI 전용)과 헷갈려 쓰지 않음 */
  const bar = (x1, y1, x2, y2, col, sw) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const ripple = () => { const W = [9, 13, 11, 15, 10, 14, 8]; return W.map((w, i) => { const cx = Math.min(23.4 - w / 2, Math.max(0.6 + w / 2, 12 + 4.2 * Math.sin(i * 0.95))); return box(cx - w / 2, 0.7 + i * 3.4, w, 2.4, i === 3 ? C : K, 1.2); }).join(''); };
  const fan = () => { const R = [10.4, 11.8, 14, 17.2, 15, 11.2, 10.4], cx = 12, cy = 20.4, r0 = 4.6; return R.map((r, i) => { const a = Math.PI - i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); return bar(cx + r0 * c, cy - r0 * s, cx + r * c, cy - r * s, i === 3 ? C : K, 3); }).join(''); };
  const hepta = () => { const cx = 12, cy = 12.5, R = 10.4, P = [...Array(7)].map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 7; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; }); return P.map((p, i) => { const q = P[(i + 1) % 7], d = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / d, uy = (q[1] - p[1]) / d, t = 2.45; return bar(p[0] + ux * t, p[1] + uy * t, q[0] - ux * t, q[1] - uy * t, i ? K : C, 3.6); }).join(''); };
  const globe = () => [-9, -6, -3, 0, 3, 6, 9].map((d, i) => { const hw = Math.sqrt(100 - d * d), x = 10.4 - hw, w = i === 3 ? 23.4 - x : 2 * hw; return box(x, 12 + d - 1.1, w, 2.2, i === 3 ? C : K, 1.1); }).join('');
  const weave = () => [[2.5, 1.6, 11], [15.2, 1.6, 6.3], [0.8, 9.1, 5.8], [8.3, 9.1, 7.4, 1], [17.4, 9.1, 5.8], [3.2, 16.6, 7], [11.9, 16.6, 9.4]].map(([x, y, w, on]) => box(x, y, w, 5.8, on ? C : K, 2.9)).join('');
  Object.assign(L, {
    16: { n: '물결 막대', d: '길이가 다른 일곱 막대가 물결처럼 흘러갑니다. 가로줄 반복으로 인상을 만드는 IBM의 방식에서 배웠습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: ripple() },
    17: { n: '저녁 부채', d: '일곱 막대가 한 점으로 모이는 반원입니다. "하루의 끝에서 모든 기록이 모인다"를 해 지는 모양으로 옮겼습니다. 길이가 다른 막대는 Deezer의 이퀄라이저에서 배웠습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: fan() },
    18: { n: '일곱 변', d: '막대 일곱 개가 칠각형으로 둘러서서 한 주를 닫습니다. 같은 둥근 조각을 돌려서 표식을 만드는 Slack의 방식에서 배웠습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: hepta() },
    19: { n: '오늘 한 줄', d: '일곱 줄이 둥근 덩어리를 이루고, 오늘 한 줄만 밖으로 나옵니다. 줄로 덩어리를 만드는 IBM의 방식에 "오늘"이라는 예외를 더했습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: globe() },
    20: { n: '맞물린 칸', d: '굵은 막대 일곱 개가 벽돌처럼 맞물립니다. 몇 개의 조각이 모여 협력을 보여 주는 Asana의 방식에서 배웠습니다. 작게 줄여도 가장 튼튼합니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: weave() },
  });
  /* 21~25: A를 유지하면서 그 안에 서비스 요소를 담은 복합 표식. s는 파비콘처럼 작을 때 쓰는 축약형 */
  const AP = 'M9.7 1h4.6L23.4 23h-5.7l-1.7-4.4H8L6.3 23H.6ZM12 6.9 9.7 13.4h4.6Z';
  const op = (o) => (o < 1 ? ` fill-opacity="${o}"` : '');
  const clipA = (id, inner) => `<defs><clipPath id="${id}"><path clip-rule="evenodd" d="${AP}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
  /* 21 한 주 창: A 모양 창으로 들여다본 일주일 시간표 */
  const weekA = () => { const D = [[[0, 8, 1], [8.7, 5, 0.45], [14.4, 10, 1]], [[0, 4, 0.45], [4.7, 9, 1], [14.4, 3.4, 0.45], [18.5, 6, 1]], [[0, 6.4, 1], [7.1, 3, 0.45], [10.8, 7.6, 1], [19.1, 5, 0.45]], [[0, 13.2, 0.45], [13.9, 4.7, 2], [19.3, 5, 1]], [[0, 5, 0.45], [5.7, 7.5, 1], [13.9, 4.7, 1], [19.3, 5, 0.45]], [[0, 9, 1], [9.7, 4, 0.45], [14.4, 3, 1], [18.1, 6, 1]], [[0, 11, 0.45], [11.7, 6, 1], [18.4, 6, 0.45]]]; return clipA('la21', D.map((c, i) => c.map(([y, h, o]) => `<rect x="${f(i * 3.43)}" y="${y}" width="2.85" height="${h}" rx=".5" fill="${o === 2 ? C : K}"${op(o)}/>`).join('')).join('')); };
  const weekAs = () => clipA('la21s', `<rect width="24" height="24" fill="${K}"/><rect x="0" y="13.4" width="24" height="5.2" fill="${C}"/>`);
  /* 22 기록의 줄기: 양쪽 획이 계획과 기록의 줄기, 가로획이 오늘 */
  const lx = (y) => 2.2 + (22.6 - y) * 0.4272;
  const node = (x, y, r, col = K) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${col}"/>`;
  const stem = () => { const line = (d, col = K, w = 1.7) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; return line('M2.2 22.6 11 2h2l8.8 20.6', K, 1.9) + line('M8.6 15C8.8 12.4 10.4 11.4 11.3 9.6', K, 1.2) + line('M15.4 15C15.4 17.4 14 18.6 13.7 20.8', K, 1.2) + line('M8.9 15C8.9 17 9.7 18.4 9.9 19.8', K, 1.2) + line(`M${f(lx(15))} 15H${f(24 - lx(15))}`, C, 2.2) + node(lx(19.8), 19.8, 1.5) + node(lx(8.4), 8.4, 1.5) + node(24 - lx(12), 12, 1.5) + node(24 - lx(18.9), 18.9, 1.5) + node(11.3, 9.6, 1.05) + node(13.7, 20.8, 1.05) + node(9.9, 19.8, 1.05) + node(12, 15, 2.2, C); };
  const stemS = () => `<path d="M2.6 22.5 12 2l9.4 20.5" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.8 15.4h10.4" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`;
  /* 23 쌓인 결: 안으로 겹쳐 쌓인 등고선, 가운데를 오늘 띠가 가로지름 */
  const strata = () => { const seg = (x0, ay, gap) => { const m = (y) => x0 + (22.8 - y) * ((12 - x0) / (22.8 - ay)), pt = (y, r) => `${f(r ? 24 - m(y) : m(y))} ${y}`; const up = 14.2, lo = 18.1; const top = ay < up ? `M${pt(up, 0)}L12 ${ay}L${pt(up, 1)}` : ''; return `<path d="${top}M${pt(22.8, 0)}L${pt(lo, 0)}M${pt(lo, 1)}L${pt(22.8, 1)}" fill="none" stroke="${K}" stroke-width="${gap}" stroke-linejoin="round"${gap < 1.5 ? ' stroke-opacity=".6"' : ''}/>`; }; return seg(1.4, 1.6, 2.2) + seg(5.2, 6, 1.4) + seg(8.4, 10.2, 1.1) + `<rect x="4.2" y="15" width="15.6" height="2.3" rx="1.15" fill="${C}"/>` + box(11.1, 19.2, 1.8, 3.6, K, 0.9); };
  const strataS = () => `<path d="M2.2 22.8 12 2 21.8 22.8" fill="none" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><rect x="5.5" y="14.2" width="13" height="3.2" rx="1.6" fill="${C}"/>`;
  /* 24 오늘로 모이는 면: 일곱 조각의 선이 가로획의 한 점으로 모임, 지난날일수록 옅음 */
  const shards = (id, cut, ray) => { const H = [12, 16], R = 40, P = (a) => [H[0] + R * Math.cos(a * Math.PI / 180), H[1] - R * Math.sin(a * Math.PI / 180)]; const A0 = ray, n = A0.length, tones = [2, 1, 0.82, 0.64, 0.46, 0.34, 0.58]; const sec = A0.map((a, i) => { const b = i === n - 1 ? A0[0] + 360 : A0[i + 1], m = P((a + b) / 2), p = P(a), q = P(b); return `<polygon points="${H.join(',')} ${f(p[0])},${f(p[1])} ${f(m[0])},${f(m[1])} ${f(q[0])},${f(q[1])}" fill="${tones[i] === 2 ? C : K}"${op(tones[i])}/>`; }).join(''); const lines = A0.map((a) => { const p = P(a); return `<line x1="12" y1="16" x2="${f(p[0])}" y2="${f(p[1])}" stroke="black" stroke-width="${cut}"/>`; }).join(''); return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><path fill="white" fill-rule="evenodd" d="${AP}"/>${lines}</mask></defs><g mask="url(#${id})">${sec}</g>`; };
  const facet = () => shards('la24', 0.8, [-22, 34, 90, 146, 204, 240, 300]);
  const facetS = () => shards('la24s', 1.5, [-30, 90, 215]);
  /* 25 엮인 날: 일곱 날의 막대를 A의 두 획이 위아래로 엮음 */
  const woven = () => { const W = 4.8, lo = (y) => 0.9 + (23 - y) * 0.39, Y = [...Array(7)].map((_, i) => 1.6 + 3.1 * i), H = 2.2, G = 0.65, over = (i) => i % 2 === 1; let cuts = [1]; Y.forEach((y, i) => { if (over(i)) cuts.push(y - G, y + H + G); }); cuts.push(23); let legs = ''; for (let i = 0; i < cuts.length; i += 2) { const a = cuts[i], b = cuts[i + 1], mk = (m) => [[lo(a), a], [lo(a) + W, a], [lo(b) + W, b], [lo(b), b]].map(([x, y]) => `${f(m ? 24 - x : x)},${f(y)}`).join(' '); legs += `<polygon points="${mk(0)}" fill="${K}"/><polygon points="${mk(1)}" fill="${K}"/>`; } let bars = ''; Y.forEach((y, i) => { const yc = y + H / 2, x = lo(yc), ext = Math.max(0.2, x - 1.4), col = i === 3 ? C : K; if (over(i)) { if (i === 5) { bars += box(ext, y, x + W + 1.1 - ext, H, col, 1.1) + box(24 - (x + W + 1.1), y, x + W + 1.1 - ext, H, col, 1.1); } else bars += box(ext, y, 24 - 2 * ext, H, col, 1.1); } else { const sw = x - G - ext; if (sw > 0.9) bars += box(ext, y, sw, H, K, 0.7) + box(24 - ext - sw, y, sw, H, K, 0.7); } }); return legs + bars; };
  const wovenS = () => `<path d="M2.6 22.5 12 2l9.4 20.5" fill="none" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><rect x="3.5" y="13.8" width="17" height="3.4" rx="1.7" fill="${C}"/>`;
  Object.assign(L, {
    21: { n: '한 주 창', d: 'A 모양 창으로 들여다본 일주일입니다. 일곱 세로 칸에 길이가 다른 일정이 있고, 오늘 칸의 지금 시간만 색입니다. 캘린더가 곧 A의 몸이 됩니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: weekA(), s: weekAs() },
    22: { n: '기록의 줄기', d: '왼쪽 획은 계획, 오른쪽 획은 기록의 줄기입니다. GitHub 커밋처럼 가지와 마디가 뻗고, 두 줄기는 오늘 가로획에서 만납니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: stem(), s: stemS() },
    23: { n: '쌓인 결', d: '안쪽으로 겹겹이 쌓인 등고선이 A를 이룹니다. 지난 기록의 층을 오늘 띠가 가로지릅니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: strata(), s: strataS() },
    24: { n: '오늘로 모이는 면', d: 'A를 일곱 조각으로 나눴고, 모든 선이 가로획의 한 점으로 모입니다. 지난날일수록 옅고 오늘만 색입니다. "흩어진 하루가 한 자리에 모입니다"를 그대로 옮겼습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: facet(), s: facetS() },
    25: { n: '엮인 날', d: '12번의 둥근 막대를 A의 두 획이 위아래로 번갈아 엮습니다. 일곱 날의 막대가 계획과 기록 사이에 짜여 들어간 직물입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: woven(), s: wovenS() },
  });
  /* 26~30: 한눈에 읽히는 A. 접힌 면, 이어진 선, 가늘어지는 획처럼 하나의 동작으로 만든 표식. 색은 같은 남색 계열 안에서만 변함 */
  const DP = 'var(--lg-c, var(--primary))';
  const grad = (id, x1, y1, x2, y2, a = C, z = DP) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop stop-color="${a}"/><stop offset="1" stop-color="${z}"/></linearGradient>`;
  const pg = (p, fill) => `<polygon points="${p}" fill="${fill}"/>`;
  const fold = () => `<defs>${grad('lg26', 11, 1.4, 3, 22.6)}${grad('lg26b', 15.8, 15.2, 8.2, 18.6, DP, C)}</defs>${pg('9.8,1.4 13.2,1.4 6.7,22.6 0.9,22.6', 'url(#lg26)')}${pg('10.9,1.4 14.2,1.4 23.1,22.6 17.3,22.6 12,10', K)}${pg('9.7,15.2 14.4,15.2 15.8,18.6 8.3,18.6', 'url(#lg26b)')}`;
  const spiral = () => `<path d="M1.7 22.8 12 2.6l10.3 20.2h-5.1L12 12.4l-3.2 6.4h2.4" fill="none" stroke="${K}" stroke-width="2.3" stroke-miterlimit="8"/><circle cx="13.1" cy="18.8" r="1.5" fill="${C}"/>`;
  const sweep = () => `<defs>${grad('lg28', 3, 21.6, 21, 6)}</defs><path d="M3.4 21.6 12 3.4l8.6 18.2" fill="none" stroke="url(#lg28)" stroke-width="4.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.4 14.4C10 14.2 17 14.7 23.6 15.5 17 16.2 10 16.9 4.4 16.8Z" fill="${K}"/><circle cx="3" cy="15.6" r="1.9" fill="${K}"/>`;
  const serif = (thin, br) => `${pg(`${f(11.7 - thin / 2)},1.6 ${f(11.7 + thin / 2)},1.6 ${f(4 + thin / 2)},22.2 ${f(4 - thin / 2)},22.2`, K)}${pg('10.6,1.6 13.1,1.6 20.7,22.4 15.7,22.4', K)}${box(0.9, 22, 6.4, 0.95, K, 0)}${box(13.6, 22, 9.5, 0.95, K, 0)}${br ? pg('2.4,22 5.6,22 4,20.3', K) + pg('15,22 21.6,22 20,20.4 16.3,20.4', K) : ''}${box(7, 15, 8.4, thin < 1.6 ? 0.95 : 1.8, K, 0)}${pg('19,2.3 21.6,5.2 19,8.1 16.4,5.2', C)}`;
  const pin = (n, w, gap, first) => { const ln = (x1, y1, x2, y2, col = K, sw = w) => bar(x1, y1, x2, y2, col, sw).replace(' stroke-linecap="round"', ''); let o = ''; for (let i = 0; i < n; i++) { const fx = first + i * gap, yt = Math.max(1.4, 22.6 - (11.6 - fx) / 0.44), xt = fx + (22.6 - yt) * 0.44; o += ln(fx, 22.6, xt, yt) + ln(24 - fx, 22.6, 24 - xt, yt); } const xi = first + (n - 1) * gap + 6.6 * 0.44; return o + ln(xi + 1.1, 16, 24 - xi - 1.1, 16, C, w + 0.7); };
  Object.assign(L, {
    26: { n: '접힌 면', d: '면 하나가 꼭대기에서 접혀 내려옵니다. 왼쪽 면은 남색으로 깊어지고, 접혀 들어온 가로획이 오늘입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: fold() },
    27: { n: '한 줄로 감은 A', d: '끊기지 않는 한 줄이 A의 바깥에서 안으로 감겨 들어갑니다. 줄이 끝나는 자리에 오늘의 점이 있습니다. 기록이 쌓여 오늘에 닿는 모습입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: spiral() },
    28: { n: '지금 선', d: '둥근 한 획의 A를 시간표의 지금 선이 가로지릅니다. 왼쪽 점에서 시작해 끝으로 갈수록 가늘어지며 획을 지나 뻗어 나갑니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: sweep() },
    29: { n: '세리프 A', d: '얇은 획과 굵은 획이 대비되는 격식 있는 A입니다. 위쪽의 마름모 하나가 오늘입니다. 반짝이 별은 AI처럼 보여서 쓰지 않았습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: serif(1.1, true), s: serif(2.2, false) },
    30: { n: '일곱 줄 기하', d: '양쪽 세 줄씩과 색 가로획 하나, 모두 일곱 줄로 그린 A입니다. 가는 선으로 정돈된 기하 구조를 만들었습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: pin(3, 1.05, 2.25, 1.2), s: pin(2, 2.3, 4, 1.6) },
  });
  /* 31~35: 두 다리와 가로획이라는 틀을 벗어난 구조. 조각, 잘라 낸 면, 고리, 봉우리, 음각 */
  const round = (p, fill, w = 1) => `<polygon points="${p}" fill="${fill}" stroke="${fill}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const crest = () => `<defs>${grad('lg31', 6, 11, 2, 22)}</defs>${round('12,2 15.9,8.6 12,12.4 8.1,8.6', K)}${round('6.5,11.4 10.2,15.1 6.8,22.4 1.6,22.4', 'url(#lg31)')}${round('17.5,11.4 22.4,22.4 17.2,22.4 13.8,15.1', K)}${round('12,16.4 13.7,18.9 12,21.4 10.3,18.9', C, 0.7)}`;
  const leafCal = () => `<defs><mask id="la32" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect x="1.6" y="2.6" width="20.8" height="20.8" rx="5" fill="white"/><circle cx="7.4" cy="6.6" r="1.5" fill="black"/><circle cx="16.6" cy="6.6" r="1.5" fill="black"/><path d="M12 9.2 19.6 24H4.4Z" fill="black"/><rect x="4" y="16.6" width="16" height="2.5" fill="white"/></mask></defs><rect width="24" height="24" fill="${K}" mask="url(#la32)"/><rect x="8.6" y="16.6" width="6.8" height="2.5" fill="${C}"/>`;
  const clockA = () => `<circle cx="10.4" cy="15.9" r="5.5" fill="none" stroke="${K}" stroke-width="3.2"/><path d="M19.2 22.5V10.6C19.2 5.2 15.4 2.4 10.8 2.4 8 2.4 5.9 3.3 4.3 4.7" fill="none" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/><path d="M10.4 15.9v-3.1" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/><circle cx="10.4" cy="15.9" r="1.7" fill="${C}"/>`;
  const peak = () => `<defs>${grad('lg34', 0.6, 19, 23.4, 19)}</defs><path d="M2.2 18.4H6.9L12 3.2l5.1 15.2h.9" fill="none" stroke="url(#lg34)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.2 22.4h3.9l1.9-4.4 1.9 4.4h3.9" fill="none" stroke="${K}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21.6" cy="18.4" r="2.2" fill="${K}"/>`;
  const disc = (orbit, id) => { const r = orbit ? 8.9 : 11.2, cut = orbit ? 2.3 : 3; return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><circle cx="12" cy="12" r="${r}" fill="white"/><path d="M${orbit ? 6.7 : 5.4} 24 12 ${orbit ? 7.2 : 5.6}l${orbit ? 5.3 : 6.6} ${orbit ? 16.8 : 18.4}" fill="none" stroke="black" stroke-width="${cut}" stroke-linejoin="round"/><path d="M8.8 16.6h6.4" stroke="black" stroke-width="${orbit ? 1.5 : 2}"/></mask></defs><circle cx="12" cy="12" r="${r}" fill="${K}" mask="url(#${id})"/>${orbit ? `<circle cx="12" cy="12" r="11.1" fill="none" stroke="${K}" stroke-width="1.1" stroke-opacity=".7" pathLength="70" stroke-dasharray="8.6 1.4" transform="rotate(-62 12 12)"/><circle cx="19.85" cy="4.15" r="2" fill="${C}"/>` : `<circle cx="20.2" cy="3.8" r="2.7" fill="${C}"/>`}`; };
  Object.assign(L, {
    31: { n: '세 조각 문장', d: '둥글게 깎은 조각 세 개와 작은 마름모 하나로 만든 문장입니다. 가로획 없이 조각의 배치만으로 봉우리를 세웠습니다. 흩어진 조각이 모인 모습입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: crest() },
    32: { n: '달력 한 장', d: '위쪽에 고리 구멍 두 개가 있는 달력 한 장입니다. 아래를 쐐기처럼 잘라 낸 빈자리가 A가 되고, 그 가운데 오늘이 걸려 있습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: leafCal() },
    33: { n: '시계 품은 a', d: '대문자를 버리고 소문자 a로 그렸습니다. 둥근 몸통이 시계이고, 바늘 끝의 점이 지금입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: clockA() },
    34: { n: '하루의 봉우리', d: '평평하게 흐르던 타임라인이 한 번 솟았다 다시 흐릅니다. 활동 그래프처럼 보이고, 아래 작은 봉우리가 지난 기록의 잔상이며, 오른쪽 끝의 점이 오늘입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: peak() },
    35: { n: '하루의 궤도', d: '꽉 찬 원이 하루이고, 안을 깎아 낸 자리가 A입니다. 바깥 궤도는 일곱 토막이고, 그 위의 점이 오늘입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: disc(true, 'la35'), s: disc(false, 'la35s') },
  });
  /* 36~40: 31번 세 조각 문장의 파생 */
  const lock = () => `<defs>${grad('lg36', 6, 12, 2, 22)}</defs>${round('12,2.2 16.4,10.2 12,14.2 7.6,10.2', K, 0.8)}${round('6.5,12 10.8,16 8.2,22.4 1.7,22.4', 'url(#lg36)', 0.8)}${round('17.5,12 22.3,22.4 15.8,22.4 13.2,16', K, 0.8)}${round('12,17.4 14.3,22.4 9.7,22.4', C, 0.8)}`;
  const spin = () => `<defs>${grad('lg37', 7, 10, 2, 22)}</defs>${round('13.2,2 17.6,8.2 13.8,12.4 9,7.8', K)}${round('6.3,9.8 10.9,14.4 7.2,22.2 1.4,22.2', 'url(#lg37)')}${round('18.7,12.4 22.8,20.8 18.4,22.4 14.7,16.1', K)}${round('12.2,16.2 14.1,19 12.2,21.8 10.3,19', C, 0.7)}`;
  const shield = () => { const SH = 'M12 .8 22.2 5.2V13.4C22.2 18.8 17.6 21.8 12 23.4 6.4 21.8 1.8 18.8 1.8 13.4V5.2Z'; return `<defs>${grad('lg38', 12, 12, 12, 24)}<clipPath id="la38b"><path d="${SH}"/></clipPath><mask id="la38" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><path d="${SH}" fill="white"/><path d="M12 8.8 3.4 25.2H20.6Z" fill="black"/></mask></defs><rect width="24" height="24" fill="${K}" mask="url(#la38)"/><g clip-path="url(#la38b)">${round('12,12 18.2,24 5.8,24', 'url(#lg38)', 0.8)}</g>${round('12,3.6 13.8,6 12,8.4 10.2,6', C, 0.7)}`; };
  const wing = () => { const L1 = 'M6.7 11.2C7.6 13 9.2 14.6 10.6 15.2 9.8 18.4 8.2 21 6.2 22.6 4 22.8 2 22.6 1 21.8 2.6 18 4.6 14.4 6.7 11.2Z'; return `<defs>${grad('lg39', 7, 11, 2, 22)}</defs><path d="M12 1.8C15 5 16.8 7.6 16.2 9.3 15.4 11.4 13.6 12.4 12 13 10.4 12.4 8.6 11.4 7.8 9.3 7.2 7.6 9 5 12 1.8Z" fill="${K}"/><path d="${L1}" fill="url(#lg39)"/><path d="${L1}" fill="${K}" transform="matrix(-1 0 0 1 24 0)"/><ellipse cx="12" cy="19" rx="1.9" ry="2.7" fill="${C}"/>`; };
  const mosaic = () => { const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t], quad = (A, B, C2, D, a, z, o) => { const P = [lerp(A, D, a), lerp(B, C2, a), lerp(B, C2, z), lerp(A, D, z)].map(([x, y]) => `${f(x)},${f(y)}`).join(' '); return `<polygon points="${P}" fill="${K}" stroke="${K}" stroke-width=".5" stroke-linejoin="round"${op(o)}${o < 1 ? ` stroke-opacity="${o}"` : ''}/>`; }, La = [6.5, 11.4], Lb = [10.2, 15.1], Lc = [6.8, 22.4], Ld = [1.6, 22.4], Ra = [17.5, 11.4], Rb = [13.8, 15.1], Rc = [17.2, 22.4], Rd = [22.4, 22.4]; return `${round('12,2 15.9,8.6 12,12.4 8.1,8.6', K)}${quad(La, Lb, Lc, Ld, 0, 0.29, 0.4)}${quad(La, Lb, Lc, Ld, 0.37, 0.63, 0.66)}${quad(La, Lb, Lc, Ld, 0.71, 1, 0.9)}${quad(Ra, Rb, Rc, Rd, 0, 0.45, 1)}${quad(Ra, Rb, Rc, Rd, 0.53, 1, 0.78)}${round('12,16.4 13.7,18.9 12,21.4 10.3,18.9', C, 0.7)}`; };
  Object.assign(L, {
    36: { n: '맞물린 조각', d: '틈의 너비를 고르게 맞추고, 가운데 마름모를 바닥에 닿는 삼각형으로 바꿨습니다. 조각들이 하나의 봉우리로 단단히 맞물립니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: lock() },
    37: { n: '움직이는 조각', d: '꼭대기 조각을 오른쪽으로 밀고 좌우 조각의 길이를 다르게 했습니다. 대칭을 깨서 조각들이 모여드는 순간처럼 보입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: spin() },
    38: { n: '방패 문장', d: '바깥 조각을 이어 방패 모양으로 감쌌습니다. 안쪽 조각은 남색으로 깊어지고, 위쪽 마름모가 오늘입니다. 기록을 지키는 보관소의 인장 같은 느낌입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: shield() },
    39: { n: '둥근 날개', d: '곧은 면을 곡선으로 바꿨습니다. 꼭대기는 물방울, 좌우는 날개가 되어 31번보다 부드럽고 유기적입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: wing() },
    40: { n: '일곱 조각', d: '구조는 31번 그대로 두고 일곱 조각으로 나눴습니다. 왼쪽은 아래로 갈수록 진해져 지난날이 쌓이는 모습이고, 마름모가 오늘입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: mosaic(), s: crest() },
  });
  Object.assign(L, {
    6: { n: '일곱 칸', d: '일정 칸 일곱 개를 쌓아 A를 만들었습니다. 맨 위 한 칸만 오늘의 색입니다. 가운데 줄이 A의 가로획입니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: seven() },
    7: { n: '빗긴 칸', d: 'A의 양쪽 획을 세 칸씩 나누고, 가로획 한 칸을 더해 일곱 칸입니다. A가 가장 또렷하게 읽힙니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: slant() },
    8: { n: '일곱 점', d: 'A.R.C.H.I.V.E의 점을 일곱 개 모아 A로 세웠습니다. 칸 대신 이름의 점에서 왔습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: dots() },
    9: { n: '한 주 줄', d: 'A 칸 아래에 일곱 날을 놓았습니다. 글자도 일곱 칸에 한 글자씩 들어가, 이름이 곧 한 주가 됩니다.', w: [...'ARCHIVE'].map((c, i) => `<i${i ? '' : ' class="on"'}>${c}</i>`).join(''), wc: 'lgw-week', b: week() },
    10: { n: '일곱 줄', d: '일곱 날이 한 줄씩 쌓여 A가 됩니다. 작아지면 줄은 뭉쳐도 A의 윤곽은 남습니다.', w: 'A.R.C.H.I.V.E', wc: 'lgw-dots', b: rows() },
  });
  window.ARCLOGO = { L, mark: (n, small) => svg(small && L[n].s ? L[n].s : L[n].b), word: (n) => `<span class="lg-w ${L[n].wc}">${L[n].w}</span>` };
  const Q = new URLSearchParams(location.search), keep = ['pet', 'logo'].filter((k) => Q.has(k));
  if (keep.length) document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; const h = a.getAttribute('href'); if (!/^d-[\w-]+\.html/.test(h)) return; const [p, hash] = h.split('#'), u = keep.filter((k) => !new RegExp(`[?&]${k}=`).test(p)).map((k) => `${k}=${Q.get(k)}`).join('&'); if (u) a.setAttribute('href', `${p}${p.includes('?') ? '&' : '?'}${u}${hash ? `#${hash}` : ''}`); }, true);
  const N = +(Q.get('logo') || 39), P = window.PL; if (!(N >= 1 && N <= 40)) return;
  document.documentElement.dataset.logo = N;
  if (P && P.shell) { const sh = P.shell; P.shell = (pg) => sh(pg).replace('<i></i>A.R.C.H.I.V.E', `${N >= 21 ? svg(L[N].b).replace('class="lg-m"', 'class="lg-m lg-c"') : svg(L[N].b)}${window.ARCLOGO.word(N)}`); }
  /* 파비콘: 브라우저 탭이 밝아도 보이도록 색을 탭 테마에 맞춤. 색은 토큰에서 읽음 */
  const paint = () => { const cs = getComputedStyle(document.documentElement), T = (k) => cs.getPropertyValue(k).trim(), s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>:root{--lg-a:${T('--ink')};--lg-b:${T('--primary-h')};--lg-c:${T('--primary')}}@media (prefers-color-scheme:light){:root{--lg-a:${T('--canvas')};--lg-b:${T('--primary')};--lg-c:${T('--primary')}}}</style>${L[N].s || L[N].b}</svg>`; let l = document.querySelector('link[rel=icon]'); if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.append(l); } l.href = `data:image/svg+xml,${encodeURIComponent(s)}`; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
})();
