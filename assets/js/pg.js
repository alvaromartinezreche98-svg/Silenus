/* SILENUS — 07 · Where we are. What's next. (2026-11-18, simplified)
   ============================================================================================================
   PG_SERIES — documents processed per month, the live site's own eight values (silenus.vercel.app #traction,
   "Apr – Nov 2026 · sample"), in thousands. Nothing is added or smoothed into extra points.
   ============================================================================================================ */
const PG_SERIES = [['Apr', 3.1], ['May', 4.6], ['Jun', 6.8], ['Jul', 9.2], ['Aug', 13.5], ['Sep', 18.9], ['Oct', 26.4], ['Nov', 34.8]];

/* THE SECTION — type, a chart and a roadmap; one motion: the growth line draws in once, as the section is read.
   Desktop: the horizontal journey from Trust (Trust leaves to the left, this section arrives from the right, held on
   one screen while the line draws), then the page carries on to the footer. Elsewhere: the line draws as it scrolls in.
   Reduced motion: drawn. */
(() => {
  'use strict';
  const sec = document.getElementById('traction');
  if (!sec || !sec.classList.contains('pg')) return;
  const G = window.gsap, ST = window.ScrollTrigger;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion');
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* ---- the chart: the line, a soft area beneath it, the months, the last point ------------------------------ */
  const svg = sec.querySelector('[data-pg-svg]'), plot = svg.parentElement;
  const MAX = 40, PAD = { l: 6, r: 8, t: 14, b: 26 };
  let C = null;
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); (parent || svg).appendChild(e); return e; };
  const buildChart = () => {
    const W = plot.clientWidth, H = svg.clientHeight || 260;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
    el('defs').innerHTML = '<linearGradient id="pg-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4FA3E0"/><stop offset="1" stop-color="#6FCF9A"/></linearGradient>'
      + '<linearGradient id="pg-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FCF9A" stop-opacity=".16"/><stop offset="1" stop-color="#4FA3E0" stop-opacity="0"/></linearGradient>'
      + `<clipPath id="pg-clip"><rect data-pg-clip x="0" y="0" width="${W}" height="${H}"/></clipPath>`;
    const x0 = PAD.l, x1 = W - PAD.r, y0 = H - PAD.b, y1 = PAD.t;
    const X = (i) => x0 + (i / (PG_SERIES.length - 1)) * (x1 - x0), Y = (v) => y0 - (v / MAX) * (y0 - y1);
    el('line', { class: 'pg__base', x1: x0, x2: x1, y1: y0, y2: y0 });
    const xg = el('g', { class: 'pg__x' });
    PG_SERIES.forEach(([m], i) => { const t = el('text', { x: X(i), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === PG_SERIES.length - 1 ? 'end' : 'middle' }, xg); t.textContent = m; });
    const P = PG_SERIES.map(([, v], i) => [X(i), Y(v)]);
    let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    for (let i = 1; i < P.length; i++) { const dx = (P[i][0] - P[i - 1][0]) * .42; d += ` C${(P[i - 1][0] + dx).toFixed(1)} ${P[i - 1][1].toFixed(1)} ${(P[i][0] - dx).toFixed(1)} ${P[i][1].toFixed(1)} ${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)}`; }
    const g = el('g', { 'clip-path': 'url(#pg-clip)' });
    el('path', { class: 'pg__area', d: `${d} L${x1} ${y0} L${x0} ${y0} Z` }, g);
    const line = el('path', { class: 'pg__line', d, pathLength: 1 });
    const end = el('circle', { class: 'pg__pt is-end', cx: P[P.length - 1][0], cy: P[P.length - 1][1], r: 4.5 });
    C = { x0, x1, line, end, clip: svg.querySelector('[data-pg-clip]') };
    setDraw(drawP);
  };
  let drawP = calm ? 1 : 0;
  const setDraw = (q) => {
    drawP = q; if (!C) return;
    C.line.style.strokeDasharray = '1'; C.line.style.strokeDashoffset = (1 - q).toFixed(4);
    C.clip.setAttribute('width', (C.x0 + (C.x1 - C.x0) * q + 2).toFixed(1));
    C.end.style.opacity = clamp((q - .96) / .04).toFixed(3);
  };
  const refresh = () => buildChart();
  refresh();
  addEventListener('load', refresh, { once: true });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(refresh);
  let rq = 0; addEventListener('resize', () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(refresh); });

  if (calm || !G || !ST) { setDraw(1); return; }
  const chart = sec.querySelector('[data-pg-chart]'), dr = { q: 0 };
  G.matchMedia().add({ h: '(min-width: 1024px) and (min-height: 660px)', v: '(max-width: 1023.98px), (max-height: 659.98px)' }, (cx) => {
    if (cx.conditions.v) {
      G.to(dr, { q: 1, ease: 'none', onUpdate: () => setDraw(dr.q), scrollTrigger: { trigger: chart, start: 'top 80%', end: 'bottom 75%', scrub: .6 } });
      return undefined;
    }
    /* ---- THE HORIZONTAL JOURNEY (desktop): Trust and this section side by side in a wrapper while it lasts (put
       back exactly as they were when the screen no longer suits it). Pinned, on one scrubbed timeline: Trust holds a
       moment; the scroll carries the reader right — Trust leaves to the left, this section arrives from the right (no
       line or shape joins them); held, the growth line draws; then the page lets go. ------------------------------ */
    const trust = document.getElementById('security');
    if (!trust) return undefined;
    const wrap = document.createElement('div'), row = document.createElement('div');
    wrap.className = 'pgx'; row.className = 'pgx__row';
    trust.before(wrap); wrap.appendChild(row); row.append(trust, sec);
    document.documentElement.classList.add('pg-h');
    refresh();
    const tl = G.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: wrap, start: 'top top', end: () => '+=' + innerHeight * 2.4, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    tl.fromTo(row, { xPercent: 0 }, { xPercent: -50, duration: .38, ease: 'power2.inOut' }, .14)   // Trust leaves left, this arrives from the right
      .to(dr, { q: 1, duration: .32, onUpdate: () => setDraw(dr.q) }, .58)                          // the growth line draws
      .to({}, { duration: .001 }, .999);
    return () => {
      document.documentElement.classList.remove('pg-h');
      G.set(row, { clearProps: 'all' });
      wrap.before(trust, sec); wrap.remove();
      requestAnimationFrame(() => { refresh(); ST.refresh(); });
    };
  });
})();
