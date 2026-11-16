/* SILENUS — Hero: one dotted wave, born from the wordmark (2026-11-16, dark system)

   THE WAVE. One ribbon of dots spans the hero through the middle of the first screen. It is a sheet: columns
   of dots along its length, rows across its width. Its centre line travels and breathes (two slow sines and a
   slow amplitude), its width swells and pinches, and the sheet twists along its length, so rows turn toward
   the viewer and away: nearer dots are larger and brighter. Dots drift slowly along the ribbon and carry a
   fixed small jitter, so it never reads as a grid. Colour: the brand's blue → green across its length, cooled
   with depth. Quiet behind the type, full elsewhere; it fades out at the screen's edges.

   THE INTRO (first visit of a session; site.min.js hands over the finished wordmark via window.SilenusIntro):
     1 typography   the preloader's own SILENUS wordmark, drawn as always;
     2 dissolution  its strokes are sampled into dots exactly where they are, and the drawn letters give way
                    to them; letter by letter, left to right, the dots loosen;
     3 movement     each dot leaves along its own curve, out through the composition;
     4 formation    and comes back in to its own place in the wave, which is already moving;
     5 continuity   when the last dot lands, the wave simply goes on: every dot was flying to a live point.
   The hero's entrance (the bundled timeline: headline, copy, product) is released as the wave forms.
   Later visits in the session: the wave fades in with the entrance. Reduced motion: one still frame.

   THE PRODUCT. The dashboard is laid out at its real size (1280 × 800) and scaled as one piece to its frame:
   --k = frame width / the design width shown (--dsh-w: 1280, or 820 on phones, which shows a crop).

   Rendering: one canvas; dots are batched into a few dozen Path2D fills per frame. Runs only while the hero is
   on screen. Plain JS, no dependency. */
(() => {
  'use strict';
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('reduced-motion');

  /* ---- the product's scale ------------------------------------------------------------------------- */
  const frame = hero.querySelector('[data-hx-frame]'), pd = hero.querySelector('[data-hx-pd]');
  const fit = () => {
    if (!frame || !pd) return;
    const w = parseFloat(getComputedStyle(frame.parentElement).getPropertyValue('--dsh-w')) || 1280;
    pd.style.setProperty('--k', (frame.clientWidth / w).toFixed(4));
  };
  fit();
  // the dark site's page-wide top light (body::after) stays off while the hero is on screen (hero.css)
  // (and section 2, which continues it: the light must not switch on mid-transition, it reads as a boundary)
  if ('IntersectionObserver' in window) {
    const seen = new Map(), tourSec = document.getElementById('tour'), klSec = document.getElementById('knowledge-layer');
    const io = new IntersectionObserver((es) => { es.forEach((e) => seen.set(e.target, e.isIntersecting)); root.classList.toggle('hx-out', ![...seen.values()].some(Boolean)); });
    io.observe(hero); if (tourSec) io.observe(tourSec); if (klSec) io.observe(klSec);
  }
  else root.classList.add('hx-out');
  if ('ResizeObserver' in window && frame) new ResizeObserver(fit).observe(frame);
  else addEventListener('resize', fit);

  /* ---- the wave -------------------------------------------------------------------------------------- */
  const cv = hero.querySelector('[data-hx-waves]');
  if (!cv) return;
  const cx = cv.getContext('2d');
  const words = [...hero.querySelectorAll('.hx__title, .hx__lead, .hx__actions')];

  const BLUE = [95, 169, 216], GREEN = [99, 201, 168], FAR = [38, 74, 86], NEAR = [214, 240, 236];
  // colour buckets: depth × position along the ribbon; opacity in 10 steps (fewer steps made dots visibly
  // jump between levels as they moved — a shimmer)
  const DEPTHS = 6, HUES = 3, ALPHAS = 10;
  let W = 0, H = 0, Hs = 0, dpr = 1, cols = 0, rows = 0, gap = 9, dots = [], quiet = null;
  // the dispersion (2026-11-16): the canvas covers the viewport (fixed, still behind the hero's content) so a
  // dot can travel anywhere on screen; the wave itself is laid out in page coordinates and scrolls as before
  const tourEl = document.querySelector('[data-tour]');
  let heroTop = 0, riseTop = 1, ox = 0, oy = 0, R = 1;
  cv.classList.add('is-fixed');

  const measure = () => {
    const phone = innerWidth < 768;
    dpr = Math.min(1.5, devicePixelRatio || 1);   // small soft dots: 1.5× is visually the same and far cheaper than 2×
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    Hs = innerHeight * 1.05;                                    // the wave's frame: the first screen, as before
    heroTop = hero.getBoundingClientRect().top + scrollY;
    // the rise, as hero-tour.js measures it: 0 at the top of the page, 1 when the dashboard has risen into focus
    riseTop = tourEl ? Math.max(1, tourEl.getBoundingClientRect().top + scrollY) : Math.max(1, innerHeight);
    // dots leave the dashboard's area: the point it rises into, low in the middle of the screen
    ox = W / 2; oy = innerHeight * .72; R = Math.hypot(W, innerHeight) * (phone ? .34 : .44);
    gap = phone ? 8 : W < 1200 ? 8.5 : 9;
    rows = phone ? 16 : 22;
    const n = Math.ceil((W * 1.16) / gap);
    if (n !== cols || dots.length !== n * rows) {
      cols = n; dots = [];
      for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
        const h = Math.sin((r * 7919 + i * 104729) * 12.9898) * 43758.5453, f = h - Math.floor(h);
        const h2 = Math.sin((r * 3571 + i * 2741) * 78.233) * 12543.123, g = h2 - Math.floor(h2);
        const h3 = Math.sin((r * 1013 + i * 7727) * 45.164) * 24634.633, m = h3 - Math.floor(h3);
        dots.push({ s: rows > 1 ? r / (rows - 1) - .5 : 0, u: i / cols, jx: (f - .5) * .7, js: (g - .5) * .5 / rows, k: f, k2: g,
          // the dispersion: when it lets go (0 … .3 of the release), how long it travels (.4 … .7), how far, which
          // way off the straight line out, and which way it curls
          dd: m * .3, ds: .4 + g * .3, dr: .55 + f * 1.05, da: (g - .5) * 1.3, dw: (m - .5) * 2 });
      }
    }
    // the type's box (centre + half sizes), in canvas coordinates: the wave goes quiet behind it
    const hb = hero.getBoundingClientRect();
    const rs = words.map((e) => e.getBoundingClientRect()).filter((r) => r.width);
    if (rs.length) {
      const l = Math.min(...rs.map((r) => r.left)), rt = Math.max(...rs.map((r) => r.right));
      const tp = Math.min(...rs.map((r) => r.top)), bt = Math.max(...rs.map((r) => r.bottom));
      quiet = { x: (l + rt) / 2 - hb.left, y: (tp + bt) / 2 - hb.top, rx: (rt - l) * .55, ry: (bt - tp) * .6 };
    }
    if (calm) render(14, null);
  };

  const smooth = (a, c, v) => { const q = Math.max(0, Math.min(1, (v - a) / (c - a))); return q * q * (3 - 2 * q); };
  const mix = (a, b, q) => a + (b - a) * q;

  // where dot d sits in the wave at time t → [x, y, z (0 far … 1 near), visibility]
  const place = (d, t) => {
    let u = d.u + t * .0045; u -= Math.floor(u);              // drift along the ribbon
    const x = -W * .08 + u * W * 1.16 + d.jx * gap;
    const v = x / W;
    const A = Hs * .1 * (1 + .35 * Math.sin(t * .1 + 1.3));    // the ribbon breathes
    const yc = Hs * .5
      + A * Math.sin(v * 6.283 * .72 + t * .16)
      + A * .5 * Math.sin(v * 6.283 * 1.55 - t * .11 + 2.1)
      + A * .18 * Math.sin(v * 6.283 * 3.1 + t * .23 + .7);
    const wid = Hs * (.11 + .07 * Math.sin(v * 5.2 - t * .14 + .4)) * (.75 + .25 * Math.sin(t * .07));   // swells and pinches
    const th = v * 4.6 - t * .19;                              // the twist
    const s = d.s + d.js;
    const y = yc + s * wid * 2 * Math.sin(th);
    const z = .5 + s * Math.cos(th);
    let q = smooth(-.02, .12, v) * (1 - smooth(.88, 1.02, v));
    if (quiet) { const ex = (x - quiet.x) / quiet.rx, ey = (y - quiet.y) / quiet.ry; q *= .3 + .7 * smooth(.55, 1.15, Math.hypot(ex, ey)); }
    return [x, y, z, q, v];
  };

  /* ---- drawing ------------------------------------------------------------------------------------- */
  // buckets: [hue][depth][intro step] → one Path2D each
  const STEPS = 12;                                            // white → wave colour in fine steps (5 read as flicker)
  const colourOf = (hue, depth, e) => {
    const base = BLUE.map((c, k) => mix(c, GREEN[k], (hue + .5) / HUES));
    const deep = (depth + .5) / DEPTHS;
    const wave = base.map((c, k) => (deep < .5 ? mix(FAR[k], c, deep * 2) : mix(c, NEAR[k], (deep - .5) * 1.1)));
    return wave.map((c, k) => Math.round(mix(243, c, e)));   // e: 0 = still the wordmark's white, 1 = the wave
  };
  let fade = 0, intro = null;

  const release = () => (calm ? 0 : smooth(.015, .74, Math.max(0, Math.min(1, scrollY / riseTop))));   // quick, tied to the rise
  let lastD = -1, lastN = 0;
  // one dot into its colour / size / opacity bucket (one Path2D per bucket, one fill each)
  const put = (B, x, y, size, alpha, v, z, e) => {
    if (x < -8 || x > W + 8 || y < -8 || y > H + 8 || alpha * fade < .02) return;
    const hue = Math.min(HUES - 1, Math.max(0, Math.floor(v * HUES)));
    const depth = Math.min(DEPTHS - 1, Math.max(0, Math.floor(z * DEPTHS)));
    const step = Math.round(Math.max(0, Math.min(1, e)) * (STEPS - 1));
    const al = Math.min(ALPHAS - 1, Math.floor(Math.min(1, alpha) * ALPHAS));
    const key = ((hue * DEPTHS + depth) * STEPS + step) * ALPHAS + al;
    let b = B.get(key);
    if (!b) { b = { p: new Path2D(), hue, depth, step, al }; B.set(key, b); }
    b.p.moveTo(x + size, y); b.p.arc(x, y, size, 0, 6.2832);
  };
  const KLnow = () => { const K = window.SilenusKL; return K && K.visible() ? K.progress() : 0; };
  const render = (t, now) => {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    const D = release(); lastD = D;
    const nN = KLnow(); lastN = nN;
    if (D >= 1 && nN <= 0) return;                              // every dot has gone, none has come back yet
    const dy0 = heroTop - (cv.classList.contains('is-fixed') ? scrollY : 0);
    const B = new Map();
    const T = intro ? (now - intro.t0) / 1000 : 0;
    if (D < 1) for (let k = 0; k < dots.length; k++) {
      const d = dots[k];
      let [x, y, z, q, v] = place(d, t);
      let e = 1, size = (.75 + 1.25 * z), alpha = (.22 + .78 * z) * q;
      if (intro) {
        const p = intro.p[k];
        const tau = Math.max(0, Math.min(1, (T - p.d) / p.D));
        if (tau < 1) {
          // 2 dissolution: before it leaves, the dot loosens where its letter was
          const loose = smooth(p.d - .45, p.d, T) * 1.2;      // a slow, slight loosening, not a shiver
          if (tau <= 0) {
            x = p.sx + Math.sin(T * 1.4 + p.a) * loose; y = p.sy + Math.cos(T * 1.2 + p.a) * loose;
            e = 0; size = 1.25; alpha = intro.show;
          } else {
            // 3 movement → 4 formation: a curve out through the composition and in to its live place
            const s = tau < .5 ? 4 * tau * tau * tau : 1 - Math.pow(-2 * tau + 2, 3) / 2, r = 1 - s;
            const c1x = p.sx + p.ox, c1y = p.sy + p.oy, c2x = x + p.ix, c2y = y + p.iy;
            const bx = r * r * r * p.sx + 3 * r * r * s * c1x + 3 * r * s * s * c2x + s * s * s * x;
            const by = r * r * r * p.sy + 3 * r * r * s * c1y + 3 * r * s * s * c2y + s * s * s * y;
            const wob = Math.sin(Math.PI * tau) * 4;
            x = bx + Math.sin(T * 1.7 + p.a) * wob; y = by + Math.cos(T * 1.3 + p.a) * wob;
            e = smooth(.15, .95, tau);
            size = mix(1.25, size, e); alpha = mix(.9, alpha, e);
          }
        }
      }
      y += dy0;                                                  // page → screen
      if (D > 0) {
        // the dispersion: each dot lets go at its own moment, travels out from the dashboard's area along its own
        // slightly bent line, at its own pace and distance, curling a little, and fades only once it is well away
        const p = smooth(d.dd, d.dd + d.ds, D);
        if (p > 0) {
          const a = Math.atan2(y - oy, x - ox) + d.da;
          const go = R * d.dr * p * p * (3 - 2 * p);
          const curl = R * .16 * d.dw * Math.sin(Math.PI * p);
          x += Math.cos(a) * go - Math.sin(a) * curl;
          y += Math.sin(a) * go + Math.cos(a) * curl;
          alpha *= 1 - smooth(.55, 1, p);                        // the dot keeps its size: it only travels and fades
        }
      }
      put(B, x, y, size, alpha, v, z, e);
    }
    B.forEach((b) => {
      const c = colourOf(b.hue, b.depth, b.step / (STEPS - 1));
      cx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(((b.al + .5) / ALPHAS) * .95 * fade).toFixed(3)})`;
      cx.fill(b.p);
    });
  };

  /* ---- (2026-11-17) the dots no longer come back in section 03: the particle S forms only in section 04 (sys.js) */

  /* ---- the intro: the wordmark's strokes become the wave's dots ------------------------------------ */
  const sampleWordmark = (el) => {
    const pts = [], hb = hero.getBoundingClientRect();
    const paths = [...el.querySelectorAll('.pl4__l')];
    const sw = 12;                                              // the strokes' width when full (svg units)
    paths.forEach((path) => {
      const L = path.getTotalLength(), m = path.getScreenCTM();
      if (!L || !m) return;
      const scale = Math.hypot(m.a, m.b) || 1, step = Math.max(.8, 2.6 / scale), across = Math.max(2, Math.round(sw * scale / 2.6));
      for (let l = 0; l <= L; l += step) {
        const a = path.getPointAtLength(Math.max(0, l - .5)), b = path.getPointAtLength(Math.min(L, l + .5)), c = path.getPointAtLength(l);
        const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
        for (let j = 0; j < across; j++) {
          const off = (j / (across - 1) - .5) * sw * .9;
          const px = c.x - dy / n * off, py = c.y + dx / n * off;
          pts.push([m.a * px + m.c * py + m.e - hb.left, m.b * px + m.d * py + m.f - hb.top]);
        }
      }
    });
    return pts;
  };

  /* THE SEQUENCE (2026-11-16) — one stage at a time, each starting only when the one before has finished:
       1 the wordmark (the preloader draws it; site.min.js hands it over here, full and still)
       2 its strokes become dots, in place                    ┐ the intro below
       3 the dots fly out and settle into the background wave  ┘ (≈ 2.9 s)
       4 the dashboard enters from below (the hero's own rise: 70 px, fade, expo out)
       5 the hero's entrance: enter() releases the bundled timeline (headline, copy, CTAs) and the nav fades in.
     Until 4 the dashboard is hidden, until 5 the nav and the hero copy (hero.css, html.hx-intro); the page stays
     scroll-locked until 5 (the preloader's .is-loading). The bundled 6 s "show it anyway" failsafe is pushed back
     while this runs (hero.css), so nothing appears early; a guard here releases everything if a stage stalls. */
  const sequence = (enter) => {
    let entered = false;
    const toContent = () => { if (entered) return; entered = true; root.classList.add('hx-dash', 'hx-content'); enter(); };
    const toDash = () => {
      root.classList.add('hx-dash');
      const prod = document.querySelector('[data-tour-product]'), g = window.gsap;
      if (prod && g) g.fromTo(prod, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.05, ease: 'expo.out', clearProps: 'opacity,transform', onComplete: toContent });
      else setTimeout(toContent, 700);
    };
    return { toDash, toContent };
  };
  const startIntro = ({ el, enter }) => {
    try { sessionStorage.setItem('silenus:intro', '1'); } catch (e) {}
    root.classList.add('hx-intro');
    const seq = sequence(enter);
    setTimeout(seq.toContent, 12000);                              // guard: never leave the page locked
    measure();
    const src = sampleWordmark(el);
    if (!src.length) { el.remove(); fade = 1; seq.toDash(); return; }
    let minX = Infinity, maxX = -Infinity, cxw = 0, cyw = 0;
    src.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); cxw += x; cyw += y; });
    cxw /= src.length; cyw /= src.length;
    const span = Math.max(1, maxX - minX), R = Math.min(W, Hs) * .42;
    // each wave dot takes a point of the wordmark (shuffled evenly, so every letter feeds the whole wave)
    const p = dots.map((d, k) => {
      const s = src[Math.floor(((k * 0.6180339887) % 1) * src.length)];
      const sx = s[0] + (d.k - .5) * 1.4, sy = s[1] + (d.k2 - .5) * 1.4;
      const nx = (sx - minX) / span;
      const ang = Math.atan2(sy - cyw, sx - cxw) + (d.k - .5) * 2.4;   // outward from the word, fanned
      const out = R * (.45 + .75 * d.k2);
      const back = (d.k - .5) * 6.283;
      return {
        sx, sy, a: d.k * 6.283,
        d: .2 + nx * .52 + d.k2 * .15,                            // letter by letter, left to right
        D: 1.6 + d.k * .45,
        ox: Math.cos(ang) * out, oy: Math.sin(ang) * out * .8,
        ix: Math.cos(back) * R * .35, iy: Math.sin(back) * R * .22
      };
    });
    const t0 = performance.now();
    intro = { p, t0, show: 1 };
    fade = 1;
    el.classList.add('is-dissolving');                           // the drawn letters give way to their dots
    setTimeout(() => el.remove(), 600);
    // when the last dot has settled into the wave, the dashboard comes in; then the hero's entrance
    const last = Math.max(...p.map((x) => x.d + x.D));
    setTimeout(() => { intro = null; measure(); seq.toDash(); }, (last + .05) * 1000);
    if (!running) go(true);
  };

  /* ---- loop ----------------------------------------------------------------------------------------
     On GSAP's ticker when it is there: the same frame loop that runs Lenis and ScrollTrigger (site.min.js), so
     the dots read the same scroll position as the dashboard's rise in the same frame (no one-frame lag between
     them). Falls back to requestAnimationFrame. Idles when the hero is off screen, the tab is hidden, or every
     dot has dispersed; a scroll back wakes it and the wave re-forms. */
  const G = window.gsap && window.gsap.ticker;
  let raf = 0, tStart = 0, on = true, running = false;
  const paint = (ms) => {
    if (!tStart) tStart = ms;
    if (!intro) fade = Math.min(1, fade + .02);
    render(14 + (ms - tStart) / 1000, ms);
    const kl = window.SilenusKL && window.SilenusKL.visible();
    if (!((on || intro || kl) && !document.hidden && (lastD < 1 || intro || lastN > 0))) stop();
  };
  const tick = G ? () => paint(performance.now()) : (ms) => { raf = 0; paint(ms); if (running) raf = requestAnimationFrame(tick); };
  const stop = () => { if (!running) return; running = false; if (G) G.remove(tick); else if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const go = (force) => {
    if (running || calm || !(on || force || (window.SilenusKL && window.SilenusKL.visible()))) return;
    running = true;
    if (G) G.add(tick); else raf = requestAnimationFrame(tick);
  };
  addEventListener('scroll', () => { if (!running && ((on && release() < 1) || KLnow() > 0)) go(); }, { passive: true });
  addEventListener('silenus:kl', () => { if (!running && KLnow() > 0) go(); });   // section 3 came into view (also after a jump)
  addEventListener('pagehide', stop);

  measure();
  let rz = 0;
  const remeasure = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (!intro) measure(); fit(); if (!calm && !running) render(14 + (performance.now() - (tStart || performance.now())) / 1000, performance.now()); go(); }); };
  addEventListener('resize', remeasure);
  addEventListener('load', remeasure, { once: true });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(remeasure);
  addEventListener('silenus:enter', () => setTimeout(remeasure, 1800), { once: true });   // the type has settled: re-read its box
  if (calm) {                                                    // still frames, redrawn as the page scrolls
    fade = 1; render(14, null);
    let rq = 0; const still = () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; render(14, null); }); };
    addEventListener('scroll', still, { passive: true });
    addEventListener('silenus:kl', still);                       // the section came into view: draw its Core
    return;
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) go(); else if (!(window.SilenusKL && window.SilenusKL.visible())) { stop(); cx.clearRect(0, 0, cv.width, cv.height); } }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else go(); });

  // first visit of the session: the preloader will hand its wordmark over; otherwise the wave fades in now
  if (root.classList.contains('is-loading') && document.querySelector('[data-pl4]')) {
    window.SilenusIntro = startIntro;
    fade = 0;                                                    // nothing drawn until the wordmark hands over
  } else {
    go();
  }
})();
