/* SILENUS — page grid (2026-11-14). The hero's line language continues down the homepage.
   Each section below the hero is built once, as it approaches (ScrollTrigger, start 'top 82%'):
     1. its boundary line draws across the page — teal, cooling to the grid grey, like the hero's handover;
     2. the hero's two margin lines continue down through it (so they run the length of the page);
     3. its head box forms (edges + the title / lead divider) while a short light runs the boundary;
     4. its body cells form (the real cell edges, measured — no invented boxes).
   The section's existing reveals are gated on it (window.SilenusGrid.ready): the title rises once the head box
   exists, the cells settle once their lines are drawn. Each section builds once; nothing replays on scroll back.
   Sections already above the viewport on load, and reduced motion, get their lines at once (no animation) and
   their content is never held back. Sticky content (the platform demo, the 'How it works' column) gets no inner
   lines — only its section boundary, the margins and its fixed dividers — so no line ever drifts off its edge.
   Needs GSAP + ScrollTrigger (bundled in site.min.js); without them, nothing is gated and nothing is drawn. */
(() => {
  'use strict';
  const main = document.getElementById('main');
  if (!main || !document.querySelector('[data-ax-hero]')) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BEAM = '#3FA1A5';

  // per section: the head box, the body cells, extra fixed verticals (selectors are relative to the section)
  const SPEC = {
    platform:  { head: null, cells: null, vlines: [] },
    knowledge: { head: null, cells: null, vlines: [] },     // its stage draws its own lines (arch-steps.js); here: boundary + margins
    connected: { head: '.bt-head', cells: '.bt-cn > .bt-c' },
    product:   { head: '.bt-head', cells: '.pd-gal .mg__tab, .pd-gal > .bt-c' },
    security:  { head: '.bt-head', cells: '.bt-sc > .bt-c', split: false },   // the head is one cell of the grid: no title / lead divider
    traction:  { head: '.bt-head', cells: '.bt-tr > .bt-c' },
    demo:      { head: null, cells: '.cta2__grid > .bt-c', top: '.cta2__grid' }
  };

  const deferred = () => { let r; const p = new Promise((res) => { r = res; }); return { p, r }; };
  const S = new Map();
  Object.keys(SPEC).forEach((id) => {
    const sec = document.getElementById(id);
    if (sec && sec.parentElement === main) S.set(id, { id, sec, spec: SPEC[id], built: false, tl: null, head: deferred(), body: deferred() });
  });
  const active = () => !calm && !!(window.gsap && window.ScrollTrigger);

  // the reveals in index.html ask before they show a section's content
  window.SilenusGrid = {
    ready(el, phase) {
      const sec = el && el.closest('#main > section'), st = sec && S.get(sec.id);
      if (!st || !active()) return Promise.resolve();
      return (phase === 'head' ? st.head : st.body).p;
    }
  };

  /* ---- geometry: layout boxes relative to the section (offsets ignore the reveals' transforms) ---- */
  // before the reveals: layout offsets (they ignore the cells' entrance transforms, but round per level);
  // once a section has settled: its live, sub-pixel boxes, so every line lands exactly on its border
  let precise = false;
  const box = (el, host) => {
    if (precise) { const r = el.getBoundingClientRect(), h = host.getBoundingClientRect(); return { x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height }; }
    let x = 0, y = 0, e = el;
    while (e && e !== host) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return e === host ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
  };
  const merge = (segs) => {   // collinear, overlapping or touching segments become one
    const by = new Map();
    segs.forEach((s) => { const k = s.o + Math.round(s.c); (by.get(k) || by.set(k, []).get(k)).push(s); });
    const out = [];
    by.forEach((list) => {
      list.sort((a, b) => a.a - b.a);
      let cur = { ...list[0] };
      for (let i = 1; i < list.length; i++) {
        const s = list[i];
        if (s.a <= cur.b + 2) { cur.b = Math.max(cur.b, s.b); if (s.g < cur.g) cur.g = s.g; } else { out.push(cur); cur = { ...s }; }
      }
      out.push(cur);
    });
    return out.filter((s) => s.b - s.a > 3);
  };

  const plan = (st) => {
    const { sec, spec } = st, W = sec.clientWidth, H = sec.offsetHeight;
    const wrap = sec.querySelector('.wrap'), fr = wrap && box(wrap, sec);
    if (!fr) return [];
    const X0 = Math.round(fr.x), X1 = Math.round(fr.x + fr.w);
    const ml = Math.round(X0 * .42), mr = Math.round(W - (W - X1) * .42);
    const desk = innerWidth >= 1024, margins = innerWidth >= 768;
    const segs = [];
    const H_ = (y, a, b, g) => segs.push({ o: 'h', c: y, a: Math.min(a, b), b: Math.max(a, b), g, from: a <= b ? 'start' : 'end' });
    const V_ = (x, a, b, g) => segs.push({ o: 'v', c: x, a: Math.min(a, b), b: Math.max(a, b), g, from: 'start' });

    const headEl = spec.head && sec.querySelector(spec.head), hb = headEl && box(headEl, sec);
    const topEl = spec.top && sec.querySelector(spec.top), tb = topEl && box(topEl, sec);
    const top = hb ? hb.y : tb ? tb.y : 0;

    // 1 · the boundary: across the page (the platform demo crosses its own top, so there only the margins)
    if (st.id === 'platform') { H_(top, 0, X0, 0); H_(top, W, X1, 0); } else H_(top, 0, W, 0);
    // 2 · the hero's margin lines, continued
    if (margins) { V_(ml, 0, H, 1); V_(mr, 0, H, 1); }
    // 3 · the head box: its edges, the title / lead divider, its base line out to the margins
    if (hb) {
      V_(hb.x, hb.y, hb.y + hb.h, 2); V_(hb.x + hb.w, hb.y, hb.y + hb.h, 2);
      const t = headEl.querySelector('.bt-head__t'), tt = t && box(t, sec);
      if (tt && desk && spec.split !== false) V_(tt.x + tt.w, hb.y, hb.y + hb.h, 2);
      H_(hb.y + hb.h, margins ? ml : 0, margins ? mr : W, 2);
    }
    (spec.vlines || []).forEach((s) => { const e = sec.querySelector(s), b = e && box(e, sec); if (b && desk) V_(b.x, b.y, b.y + b.h, 2); });
    // 4 · the body cells (desktop: below 1024 the bento groups become swipe carousels)
    if (spec.cells && desk) {
      sec.querySelectorAll(spec.cells).forEach((c) => {
        const b = box(c, sec); if (!b || b.w < 8 || b.h < 8) return;
        H_(b.y, b.x, b.x + b.w, 3); H_(b.y + b.h, b.x, b.x + b.w, 3);
        V_(b.x, b.y, b.y + b.h, 3); V_(b.x + b.w, b.y, b.y + b.h, 3);
      });
    }
    return merge(segs);
  };

  /* ---- drawing ------------------------------------------------------------------------------------ */
  const tone = (sec) => {
    const m = getComputedStyle(sec).backgroundColor.match(/\d+(\.\d+)?/g) || [255, 255, 255];
    const [r, g, b] = m.map(Number), lum = (r * .299 + g * .587 + b * .114) / 255;
    return lum < .4 ? 'rgba(255, 255, 255, .12)' : '#DCE0E5';
  };
  const layerOf = (st) => {
    if (!st.layer) { st.layer = document.createElement('div'); st.layer.className = 'ax-sgrid'; st.layer.setAttribute('aria-hidden', 'true'); st.sec.appendChild(st.layer); }
    return st.layer;
  };
  const render = (st, exact) => {
    precise = !!exact;
    const layer = layerOf(st), col = tone(st.sec), segs = plan(st), frag = document.createDocumentFragment();
    precise = false;
    const els = segs.map((s) => {
      const e = document.createElement('i');
      e.className = 'ax-sl ax-sl--' + s.o;
      e.style.background = col;
      if (s.o === 'h') Object.assign(e.style, { left: Math.round(s.a) + 'px', top: Math.round(s.c) + 'px', width: Math.round(s.b - s.a) + 'px', transformOrigin: (s.from === 'start' ? '0' : '100%') + ' 50%' });
      else Object.assign(e.style, { left: Math.round(s.c) + 'px', top: Math.round(s.a) + 'px', height: Math.round(s.b - s.a) + 'px', transformOrigin: '50% 0' });
      if (s.g === 0 && s.o === 'h' && st.spec.accent) { e.classList.add('ax-sl--accent'); e.style.background = '#58B69A'; }   // the section's edge: solid green, 2 px
      e.dataset.g = s.g; frag.appendChild(e);
      return e;
    });
    layer.replaceChildren(frag);
    return { els, col, segs };
  };

  const build = (st, animate) => {
    if (st.built) return;
    st.built = true;
    const { els, col, segs } = render(st);
    const settle = () => setTimeout(() => { if (!(st.tl && st.tl.isActive())) render(st, true); }, 1300);   // after the cells' entrance
    const done = () => { st.head.r(); st.body.r(); settle(); };
    const g = window.gsap;
    if (!animate || !g) { done(); return; }
    const grp = (n) => els.filter((e) => +e.dataset.g === n);
    const tl = g.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { g.set(els, { clearProps: 'transform' }); done(); } });
    const draw = (list, at, dur, stagger) => {
      const h = list.filter((e) => e.classList.contains('ax-sl--h')), v = list.filter((e) => e.classList.contains('ax-sl--v'));
      if (h.length) tl.fromTo(h, { scaleX: 0, backgroundColor: BEAM }, { scaleX: 1, backgroundColor: col, duration: dur, stagger }, at);
      if (v.length) tl.fromTo(v, { scaleY: 0, backgroundColor: BEAM }, { scaleY: 1, backgroundColor: col, duration: dur, stagger }, at + .05);
    };
    const acc = els.filter((e) => e.classList.contains('ax-sl--accent'));
    if (acc.length) tl.fromTo(acc, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power3.inOut' }, 0);   // the accent edge stays green
    draw(grp(0).filter((e) => !acc.includes(e)), 0, .8, 0);   // the boundary
    draw(grp(1), .12, 1.4, .08);                    // the margin lines run on down
    draw(grp(2), .3, .6, .06);                      // the head box
    tl.add(() => st.head.r(), .62);                 // → the title may rise
    draw(grp(3), .5, .55, .03);                     // the cells
    tl.add(() => st.body.r(), .95);                 // → the cells may settle
    // a short light along the boundary
    const b0 = segs.find((s) => s.g === 0 && s.o === 'h');
    if (b0 && !st.spec.accent) {   // (no travelling gradient light on the solid-edged sections)
      const run = document.createElement('i'); run.className = 'ax-srun'; st.layer.appendChild(run);
      g.set(run, { x: b0.a - 160, y: Math.round(b0.c) });
      tl.fromTo(run, { opacity: 0 }, { opacity: 1, duration: .2, ease: 'none' }, .25)
        .to(run, { x: b0.b, duration: 1.5, ease: 'power2.inOut' }, .25)
        .to(run, { opacity: 0, duration: .3, ease: 'none', onComplete: () => run.remove() }, 1.45);
    }
    st.tl = tl;
  };

  /* ---- keep the lines on their edges as the layout settles (fonts, images, resize) ----------------- */
  let t = 0;
  const redraw = () => { clearTimeout(t); t = setTimeout(() => S.forEach((st) => { if (st.built && !(st.tl && st.tl.isActive())) render(st, true); }), 160); };

  const start = () => {
    if (!active()) { S.forEach((st) => build(st, false)); return; }
    const ST = window.ScrollTrigger;
    S.forEach((st) => {
      const r = st.sec.getBoundingClientRect();
      if (r.bottom < 0) { build(st, false); return; }                 // already scrolled past on load: just there
      if (r.top < innerHeight * .82) { build(st, true); return; }      // already in view on load
      st.trigger = ST.create({ trigger: st.sec, start: 'top 82%', once: true, onEnter: () => build(st, true) });
    });
    addEventListener('resize', redraw);
    addEventListener('load', redraw);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(redraw);
    if ('ResizeObserver' in window) {   // the section and every box it measures (a chart or a title can settle late)
      const ro = new ResizeObserver(redraw);
      S.forEach((st) => { ro.observe(st.sec); const sp = st.spec; [sp.head, sp.cells, sp.top, ...(sp.vlines || [])].filter(Boolean).forEach((sel) => st.sec.querySelectorAll(sel).forEach((e) => ro.observe(e))); });
    }
  };
  // after the page's own scripts have set up their pins and sizes (they run on DOMContentLoaded)
  const go = () => requestAnimationFrame(() => { start(); window.ScrollTrigger && window.ScrollTrigger.refresh(); });
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(go, 0), { once: true }); else go();
})();
