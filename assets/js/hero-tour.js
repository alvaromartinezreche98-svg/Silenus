/* SILENUS — 02 · The product tour (2026-11-16)
   ONE dashboard travels from the hero into the tour. Section 2 starts right under the hero's CTAs, so the dashboard
   rests exactly where the hero always showed it; it is never hidden, duplicated or replaced.

   DESKTOP (≥ 1024 px, motion allowed) — .hx__tour.is-pinned; everything is a function of the scroll position,
   so scrolling up plays it all backwards:
     · rise — from the top of the page until section 2's stage reaches the top of the screen, the dashboard moves
              up and grows (eased), from its hero place to its final place under the stage's title. While it rises
              the stage itself scrolls up with the page; the two meet exactly when the stage pins, so the final
              place on screen is reached at the moment the CSS sticky takes over — no jump.
     · tour — pinned and still: four stages; each switches the real screen and the sidebar's selection, lights the
              part that carries the point, dims the rest, and cross-fades the title above.
     Final size: as large as fits between the title and a clear margin above the bottom of the screen (48–88 px,
     7 % of its height) — up to × 1.12, never wider than the screen — and centred in that room. The dashboard is
     never flush with, or cut by, the bottom of the screen.
     Per frame: one transform and one opacity. ScrollTrigger (bundled, driven by Lenis on GSAP's ticker) reports
     the position; the stage is plain CSS sticky, so no pin-spacer and no second system on the same properties.

   PHONES, TABLETS, REDUCED MOTION — .hx__tour.is-stacked: no pinning; after the hero's dashboard the three other
     screens follow, each with its title; on phones each copy is cropped around its point.
   Plain JS; uses window.ScrollTrigger when present, otherwise a rAF-throttled scroll listener. */
(() => {
  'use strict';
  const tour = document.querySelector('[data-tour]');
  if (!tour) return;
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('reduced-motion');
  const stage = tour.querySelector('[data-tour-stage]');
  const product = tour.querySelector('.hx__product');
  const zoom = tour.querySelector('[data-tour-zoom]');
  const frame = tour.querySelector('[data-hx-frame]');
  const dsh = frame && frame.querySelector('.dsh');
  const capsBox = tour.querySelector('[data-tour-caps]');
  const caps = capsBox ? [...capsBox.querySelectorAll('.hx__cap')] : [];
  const nav = document.querySelector('header.nav .nav__dock') || document.querySelector('header.nav');
  if (!stage || !product || !zoom || !frame || !dsh || caps.length < 2) return;
  const KEYS = caps.map((c) => c.dataset.cap);
  const N = KEYS.length;

  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (a, b, v) => { const q = clamp((v - a) / (b - a)); return q * q * (3 - 2 * q); };

  // show one area on a dashboard: its screen, its sidebar item, and (optionally) its spotlight
  const show = (d, key, spot) => {
    d.querySelectorAll('.dsh__screen').forEach((s) => s.classList.toggle('is-on', s.dataset.screen === key));
    d.querySelectorAll('[data-dsh-nav]').forEach((li) => li.classList.toggle('is-on', li.dataset.dshNav === key));
    d.classList.toggle('has-spot', !!spot);
  };

  /* ---- pinned (desktop) -------------------------------------------------------------------------- */
  let geo = null, lastK = -2, lastSpot = null, lastCap = -2, st = null;
  const fitMain = () => {                                  // the dashboard's own scale (its UI is laid out at 1280 × 800)
    const w = parseFloat(getComputedStyle(product).getPropertyValue('--dsh-w')) || 1280;
    dsh.style.setProperty('--k', (frame.clientWidth / w).toFixed(4));
  };
  const measure = () => {
    const vw = innerWidth, vh = innerHeight;
    const navH = nav ? nav.getBoundingClientRect().height : 72;
    const capsTop = Math.round(navH + 20);
    const capsH = Math.max(...caps.map((c) => c.offsetHeight)) || 120;
    // the final place: the whole dashboard between the title and a clear margin above the bottom of the screen,
    // centred in that room; as large as fits (up to × 1.12, never wider than the screen, never taller than the room)
    const yTop = capsTop + capsH + 28;
    const padB = Math.round(Math.max(48, Math.min(88, vh * .07)));   // breathing room under the dashboard
    const w0 = product.offsetWidth, h0 = frame.offsetHeight;
    const room = Math.max(160, vh - yTop - padB);
    const s1 = Math.min(1.12, (vw - 48) / w0, room / h0);
    const T = Math.round(yTop + Math.max(0, (room - h0 * s1) / 2));
    tour.style.setProperty('--caps-top', capsTop + 'px');
    tour.style.setProperty('--caps-h', capsH + 'px');
    const len = Math.round(N * .62 * vh);
    const exit = Math.round(.9 * vh);                       // the exit (2026-11-17): after the last stage, before release
    tour.style.setProperty('--tour-len', (len + exit) + 'px');
    const top = tour.getBoundingClientRect().top + scrollY;   // the stage's top in the page (never transformed)
    const tp = Math.max(1, top);
    const w = Math.max(0, Math.min(1, ((.9 * tp) / Math.max(1, T) - 1) / .5));   // cubic's peak slope is 1.5
    geo = { top: tp, len, T, s1, w, exit, vh };
    fitMain();
  };

  const update = (y) => {
    if (!geo) return;
    const a = clamp(y / geo.top);                          // the rise: 0 at the top of the page, 1 as the stage pins
    // eased, but never faster than the page scrolls: on tall screens (a far-down final place) the ease is blended
    // toward linear so the dashboard always travels upward on screen, never dips back
    const cubic = a < .5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2;
    const e = cubic * geo.w + a * (1 - geo.w);
    // a compositor hint only while it moves: kept on a resting element, the browser keeps its first raster and
    // scales that bitmap, which blurred the dashboard's text at its final size
    // the exit (2026-11-18), in strict sequence — one scroll range, three phases that never overlap:
    //   1  .00–.36  the words rise out of the screen and fade
    //   2  .40–1    only then the dashboard sinks out of the bottom of the screen and dissolves
    //   3  then the stage releases, empty, and section 3 takes the screen (kl.js: its title's own entrance)
    const x = clamp((y - geo.top - geo.len) / geo.exit);
    const xc = smooth(0, .36, x), xd = smooth(.4, 1, x);
    const xe = xd * xd;                                      // eased in: it gathers speed as it goes
    zoom.style.willChange = (a > 0 && a < 1) || (x > 0 && x < 1) ? 'transform, opacity' : 'auto';
    zoom.style.transform = `translate3d(0, ${(geo.T * e + geo.vh * .78 * xe).toFixed(2)}px, 0) scale(${((1 + (geo.s1 - 1) * e) * (1 - .06 * xe)).toFixed(4)})`;
    zoom.style.opacity = x > 0 ? (1 - smooth(.35, 1, xd)).toFixed(3) : '';
    capsBox.style.opacity = (smooth(.72, .98, a) * (1 - smooth(.15, 1, xc))).toFixed(3);
    capsBox.style.transform = xc > 0 ? `translate3d(0, ${(-(geo.vh * .32) * xc * xc).toFixed(2)}px, 0)` : '';
    const q = clamp((y - geo.top) / geo.len);              // the tour: 0 … 1 across the stages
    const k = a < 1 ? 0 : Math.min(N - 1, Math.floor(q * N));
    const spot = a > .94;
    if (k !== lastK || spot !== lastSpot) { show(dsh, KEYS[k], spot); lastK = k; lastSpot = spot; }
    if (k !== lastCap) { caps.forEach((el, i) => el.classList.toggle('is-on', i === k)); lastCap = k; }
  };

  /* ---- stacked (phones, tablets, reduced motion) ---------------------------------------------------- */
  let stack = null, ro = null;
  const fitCopy = (f) => {
    const d = f.querySelector('.dsh'); if (!d) return;
    const w = parseFloat(getComputedStyle(f.parentElement).getPropertyValue('--dsh-w')) || 1280;
    const k = f.clientWidth / w;
    d.style.setProperty('--k', k.toFixed(4));
    // phones show a crop: centre it on the lit part of this screen
    d.style.setProperty('--dsh-x', 0);
    if (w < 1280) {
      const spot = d.querySelector('.dsh__screen.is-on [data-spot]');
      if (spot) {
        const x = (spot.getBoundingClientRect().left - d.getBoundingClientRect().left) / k;
        d.style.setProperty('--dsh-x', Math.round(Math.max(0, Math.min(1280 - w, x - 24))));
      }
    }
  };
  const capBlock = (i) => {
    const c = document.createElement('div'); c.className = 'hx__stack-cap';
    c.innerHTML = caps[i].innerHTML;
    return c;
  };
  const buildStack = () => {
    stack = document.createElement('div'); stack.className = 'hx__stack';
    stack.appendChild(capBlock(0));                      // the hero's dashboard is stage 1; its caption follows it
    for (let i = 1; i < N; i++) {
      const step = document.createElement('div'); step.className = 'hx__stack-step';
      const f = frame.cloneNode(true);
      f.removeAttribute('data-hx-frame');
      const capT = caps[i].querySelector('.hx__capt');   // (the stage labels were removed; name the screen by its title)
      f.setAttribute('aria-label', 'The Silenus dashboard: ' + (capT ? capT.textContent.trim() : KEYS[i]));
      const d = f.querySelector('.dsh'); d.removeAttribute('data-hx-pd');
      show(d, KEYS[i], true);
      step.appendChild(f); step.appendChild(capBlock(i));
      stack.appendChild(step);
    }
    product.after(stack);
    const frames = [...stack.querySelectorAll('.hx__frame')];
    requestAnimationFrame(() => frames.forEach(fitCopy));
    if ('ResizeObserver' in window) { ro = new ResizeObserver((es) => es.forEach((e) => fitCopy(e.target))); frames.forEach((f) => ro.observe(f)); }
  };

  /* ---- mode ------------------------------------------------------------------------------------------ */
  let mode = '';
  const setMode = () => {
    const next = !calm && innerWidth >= 1024 ? 'pinned' : 'stacked';
    if (next === mode) return;
    mode = next;
    tour.classList.toggle('is-pinned', mode === 'pinned');
    tour.classList.toggle('is-stacked', mode === 'stacked');
    if (mode === 'pinned') {
      if (stack) { ro && ro.disconnect(); stack.remove(); stack = null; }
      lastK = lastSpot = lastCap = -2;
      measure(); update(scrollY);
    } else {
      zoom.style.transform = ''; zoom.style.opacity = ''; capsBox.style.opacity = ''; capsBox.style.transform = '';
      requestAnimationFrame(fitMain);
      caps.forEach((el) => el.classList.remove('is-on'));
      show(dsh, KEYS[0], false);
      if (!stack) buildStack();
    }
  };

  if ('ResizeObserver' in window) new ResizeObserver(fitMain).observe(frame);
  // the hero's background continues under section 2 (hero.css: main#main) down to section 2's end
  const sec2 = document.getElementById('knowledge-layer') || tour.closest('section'), mainEl = document.getElementById('main');   // the last section that continues the hero's ground
  const setEnd = () => { if (sec2 && mainEl) mainEl.style.setProperty('--hx-end', Math.round(sec2.getBoundingClientRect().bottom - mainEl.getBoundingClientRect().top) + 'px'); };
  if ('ResizeObserver' in window && sec2) new ResizeObserver(setEnd).observe(sec2);
  addEventListener('load', setEnd, { once: true });
  setMode();
  setEnd();
  // one update per frame: from ScrollTrigger (driven by Lenis on GSAP's ticker, the same loop the wave draws on),
  // or, without it, from a rAF-throttled scroll listener
  const onScroll = () => { if (mode === 'pinned') update(scrollY); };
  const onRefresh = () => { if (mode === 'pinned') { measure(); update(scrollY); } };
  if (window.ScrollTrigger) {
    st = window.ScrollTrigger.create({ start: 0, end: 'max', onUpdate: onScroll });
    window.ScrollTrigger.addEventListener('refresh', onRefresh);
    addEventListener('pagehide', (e) => { if (!e.persisted && st) { st.kill(); st = null; window.ScrollTrigger.removeEventListener('refresh', onRefresh); } });
  } else {
    let raf = 0;
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
  }
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { setMode(); if (mode === 'pinned') { measure(); update(scrollY); } }); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (mode === 'pinned') { measure(); update(scrollY); } });
  addEventListener('load', () => { if (mode === 'pinned') { measure(); update(scrollY); } window.ScrollTrigger && window.ScrollTrigger.refresh(); }, { once: true });
})();
