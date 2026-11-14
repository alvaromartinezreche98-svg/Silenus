/* SILENUS — Architectural hero (2026-11-14, v2: editorial type; the lines frame the type, never cross it)
   1) Line work: reads the hero grid's real tracks (getComputedStyle) and draws an art-directed plan of
      lines, intersections and light trails on them, per breakpoint. Redrawn on resize / fonts / nav size.
   2) Preloader → hero: the restored SILENUS wordmark preloader (site.min.js drives it with real readiness);
      when it is full, its luminous line is turned into the hero grid, then the hero content arrives inside it
      (see the timeline below).
   3) Reduced motion: no preloader (set in <head>), no trails, everything shown at once.
   Needs: GSAP (bundled in site.min.js, loaded before this file). Without it the hero simply shows. */
(() => {
  'use strict';
  const hero = document.querySelector('[data-ax-hero]');
  if (!hero) return;
  const root = document.documentElement;
  const grid = hero.querySelector('[data-ax-grid]');
  const layer = hero.querySelector('[data-ax-lines]');
  const nav = document.querySelector('header.nav');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- Line plans --------------------------------------------------------------------------------
     Positions: x — column edge index (0 … n, decimals interpolate), 'L' / 'R' viewport edges,
     'ml' / 'mr' a point inside the left / right margin; y — row edge index (0 = top, 1 = under the nav …).
     Lines draw from their first point to their second. Trails: [kind, at, from, to, duration s, delay s].
     Crosses: [x, y, variant]; 'pulse' crosses flash when a chained trail arrives (same duration). */
  const PLANS = {
    // rows: 0 top · 1 nav · 2 type base · 3 CTA band = frame top · 4 bottom. No line crosses the type.
    desk: {
      lines: [
        ['v', 0, 1, 4], ['v', 4, 1, 4],
        ['h', 2, 4, 'L'],                 // the type's base line, run out into the left margin
        ['h', 3, 'L', 'R'],               // the product frame's top
        ['v', 1, 1, 4],                   // the type's left edge, down to the hero's end
        ['v', 2, 2, 3],                   // CTA band divider
        ['v', 'mr', 0, 4],                // right margin: the hero's full height, top edge to end
        ['v', 'ml', 2, 4]                 // left margin: from the type's base line to the end
      ],
      cross: [[1, 2], [4, 2], [0, 3], [2, 3], [1, 3, 'sig pulse', 14, 4.92], ['ml', 2], ['ml', 3], ['mr', 3]],
      trails: [
        ['v', 1, 1, 3, 14, 1],            // down the type's edge …
        ['h', 3, 1, 'R', 14, 4.92],       // … and on along the frame top (chained: 1 + .28 × 14)
        ['h', 2, 4, 'L', 19, 9]
      ]
    },
    // rows: 0 · 1 nav · 2 type base · 3 lead · 4 CTA band = frame top · 5 bottom
    tab: {
      lines: [
        ['v', 0, 1, 5], ['v', 3, 1, 5],
        ['h', 2, 3, 'L'], ['h', 4, 'L', 'R'], ['h', 3, 0, 2],
        ['v', 2, 2, 3], ['v', 1, 3, 4],
        ['v', 'mr', 0, 5], ['v', 'ml', 2, 5]   // margin lines: right full height, left from the type's base line
      ],
      cross: [[2, 2], [2, 3], [0, 4], [1, 4], [3, 4, 'sig pulse', 15, 5.2]],
      trails: [['v', 3, 1, 4, 15, 1], ['h', 4, 3, 'L', 15, 5.2]]
    },
    // rows: 0 · 1 nav · 2 type base · 3 lead · 4 CTA · 5 link = frame top · 6 bottom
    mob: {
      lines: [
        ['v', 0, 1, 6], ['v', 1, 1, 6],
        ['h', 2, 1, 'L'], ['h', 3, 0, 'R'], ['h', 4, 0, 1], ['h', 5, 'L', 'R']
      ],
      cross: [[0, 2], [1, 5, 'sig']],
      trails: [['h', 5, 'R', 'L', 18, 4]]
    }
  };
  const planFor = () => (innerWidth >= 1200 ? 'desk' : innerWidth >= 768 ? 'tab' : 'mob');

  const tracks = (s) => s.split(' ').map(parseFloat).filter((n) => !Number.isNaN(n));
  const at = (edges, v) => { const i = Math.max(0, Math.min(edges.length - 1, Math.floor(v))), f = v - i; return i < edges.length - 1 ? edges[i] + (edges[i + 1] - edges[i]) * f : edges[i]; };

  let geo = null, planName = '';
  const measure = () => {
    if (nav) hero.style.setProperty('--ax-nav-h', Math.max(0, nav.offsetHeight - 1) + 'px');
    const hb = hero.getBoundingClientRect(), gb = grid.getBoundingClientRect(), cs = getComputedStyle(grid);
    const X = [gb.left - hb.left], Y = [gb.top - hb.top];
    tracks(cs.gridTemplateColumns).forEach((c) => X.push(X[X.length - 1] + c));
    tracks(cs.gridTemplateRows).forEach((r) => Y.push(Y[Y.length - 1] + r));
    const W = hb.width, H = hb.height;
    const x = (v) => (v === 'L' ? 0 : v === 'R' ? W : v === 'ml' ? Math.round(X[0] * .42) : v === 'mr' ? Math.round(W - (W - X[X.length - 1]) * .42) : Math.round(at(X, v)));
    const y = (v) => (v === 'T' ? 0 : v === 'B' ? H : Math.round(at(Y, v)));
    return { x, y, W, H };
  };

  // the frame top (where the dashboard settles) — read by the 02 shared-element script
  const frameTop = () => { const f = hero.querySelector('[data-ax-frame]'); return f ? f.getBoundingClientRect().top + scrollY : null; };
  window.SilenusHero = { frameTop };

  const el = (cls, css) => { const e = document.createElement('i'); e.className = cls; Object.assign(e.style, css); return e; };

  const draw = () => {
    planName = planFor();
    const plan = PLANS[planName];
    geo = measure();
    const { x, y } = geo;
    const frag = document.createDocumentFragment();
    plan.lines.forEach(([k, a, p, q]) => {
      if (k === 'h') {
        const yy = y(a), x1 = x(p), x2 = x(q), l = Math.min(x1, x2), w = Math.abs(x2 - x1);
        frag.appendChild(el('ax-l ax-l--h', { left: l + 'px', top: yy + 'px', width: w + 'px', transformOrigin: (x1 <= x2 ? '0' : '100%') + ' 50%' }));
      } else {
        const xx = x(a), y1 = y(p), y2 = y(q), t = Math.min(y1, y2), h = Math.abs(y2 - y1);
        frag.appendChild(el('ax-l ax-l--v', { left: xx + 'px', top: t + 'px', height: h + 'px', transformOrigin: '50% ' + (y1 <= y2 ? '0' : '100%') }));
      }
    });
    const trail = ([k, a, p, q, dur, delay]) => {
      const rev = k === 'h' ? x(p) > x(q) : y(p) > y(q);
      const e = el(`ax-t ax-t--${k}${rev ? ' ax-t--rev' : ''}`, {});
      if (k === 'h') { const l = Math.min(x(p), x(q)), w = Math.abs(x(q) - x(p)); Object.assign(e.style, { left: l + 'px', top: y(a) + 'px', width: w + 'px' }); e.style.setProperty('--w', w + 'px'); }
      else { const t = Math.min(y(p), y(q)), h = Math.abs(y(q) - y(p)); Object.assign(e.style, { left: x(a) + 'px', top: t + 'px', height: h + 'px' }); e.style.setProperty('--h', h + 'px'); }
      if (dur) { e.style.setProperty('--dur', dur + 's'); e.style.setProperty('--delay', delay + 's'); }
      e.appendChild(document.createElement('b'));
      return e;
    };
    plan.trails.forEach((t) => frag.appendChild(trail(t)));
    plan.cross.forEach(([cx, cy, v = '', dur, delay]) => {
      const e = el('ax-x' + v.split(' ').filter(Boolean).map((m) => ' ax-x--' + m).join(''), { left: x(cx) + 'px', top: y(cy) + 'px' });
      if (dur) { e.style.setProperty('--dur', dur + 's'); e.style.setProperty('--delay', delay + 's'); }
      e.appendChild(document.createElement('b'));
      frag.appendChild(e);
    });
    layer.replaceChildren(frag);
  };

  let raf = 0, lastW = 0, lastH = 0;
  const req = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; const r = hero.getBoundingClientRect(); if (r.width === lastW && r.height === lastH && planName === planFor()) return; lastW = r.width; lastH = r.height; draw(); }); };
  const force = () => { lastW = lastH = 0; req(); };
  draw();
  addEventListener('resize', req);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(req); ro.observe(hero); nav && ro.observe(nav); }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(force);
  addEventListener('load', force, { once: true });

  /* ---- Ambient: trails run only while the hero is on screen ------------------------------------ */
  const live = () => {
    if (calm.matches) return;
    hero.classList.add('ax-live');
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => hero.classList.toggle('ax-idle', !e.isIntersecting)).observe(hero);
  };

  /* ---- Preloader → grid → hero -------------------------------------------------------------------
     t = 0 when the wordmark is full (site.min.js adds .is-full: the strokes thicken, S in the logo gradient).
     Phase 1  .55 s  the letters fade; the luminous line beneath them stays.
     Phase 2  .9 s   handover: the overlay goes (same ground as the hero) and the hero's horizontal lines start
                     exactly on that line — same place, length and teal — then split and slide to their rows;
                     the verticals grow out of the line's height; the intersections settle.
     Phase 3  1.3 s  the CTA cell fills, the type rises, the nav and the copy arrive; the dashboard (02 script,
                     'wh:reveal' + .85 s) lifts into its frame. Ambient trails start when it is all done.
     Every full load (as the original preloader). Without a preloader (reduced motion is handled above), a short entrance. */
  const pl = document.querySelector('[data-pl4]');
  const BEAM = '#3FA1A5';
  let revealed = false;

  const content = (tl, at) => {
    const q = (s) => [...hero.querySelectorAll(s)];
    tl.fromTo(q('[data-ax-fill]'), { scaleX: 0 }, { scaleX: 1, duration: .8, ease: 'power4.inOut' }, at)
      .fromTo(q('.ax-ln > span'), { yPercent: 108 }, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: .09 }, at + .1)
      .fromTo(q('[data-ax-in]'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, stagger: .05, clearProps: 'transform' }, at + .35);
    if (nav) tl.fromTo(nav, { opacity: 0 }, { opacity: 1, duration: .6, ease: 'power2.out', clearProps: 'opacity' }, at + .25);
  };

  const reveal = (fromWordmark) => {
    if (revealed) return; revealed = true;
    root.classList.add('ax-on');
    const g = window.gsap;
    if (calm.matches || !g) { window.dispatchEvent(new Event('wh:reveal')); live(); return; }
    const hl = [...layer.querySelectorAll('.ax-l--h')], vl = [...layer.querySelectorAll('.ax-l--v')], xs = [...layer.querySelectorAll('.ax-x')];
    const done = () => { g.set([...hl, ...vl], { clearProps: 'transform,backgroundColor,opacity' }); live(); };
    const tl = g.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

    if (fromWordmark && pl) {
      const letters = [...pl.querySelectorAll('.pl4__l')], wire = pl.querySelector('.pl4__wire');
      let W0 = null;   // the line's geometry in hero coordinates, read once, at the handover
      const geoW = () => {
        if (!W0) { const hb = hero.getBoundingClientRect(), wr = wire.getBoundingClientRect(); W0 = { l: wr.left - hb.left, w: Math.max(1, wr.width), y: wr.top + wr.height / 2 - hb.top }; }
        return W0;
      };
      g.set([...hl, ...vl, ...xs], { opacity: 0 });
      // phase 1: the wordmark goes, the line stays
      tl.to(pl.querySelectorAll('.pl4__track, .pl4__head'), { opacity: 0, duration: .3 }, .1)
        .to(letters, { opacity: 0, duration: .4, ease: 'power2.in', stagger: { each: .03, from: 'center' } }, .55)
        // phase 2: the line becomes the grid
        .add(() => { geoW(); g.set(pl, { opacity: 0, pointerEvents: 'none' }); }, .9)
        .fromTo(hl, {
          opacity: 1, transformOrigin: '0 50%', backgroundColor: BEAM,
          x: (i, e) => geoW().l - e.offsetLeft, y: (i, e) => geoW().y - e.offsetTop, scaleX: (i, e) => geoW().w / e.offsetWidth,
          immediateRender: false
        }, { x: 0, y: 0, scaleX: 1, backgroundColor: '#DCE0E5', duration: .7, ease: 'power3.inOut', stagger: .08 }, .9)
        .fromTo(vl, {
          opacity: 1, scaleY: 0, backgroundColor: BEAM,
          transformOrigin: (i, e) => `50% ${Math.min(e.offsetHeight, Math.max(0, geoW().y - e.offsetTop))}px`,
          immediateRender: false
        }, { scaleY: 1, backgroundColor: '#DCE0E5', duration: .65, ease: 'power3.inOut', stagger: .06 }, 1.15)
        .to(xs, { opacity: 1, duration: .4, stagger: .04 }, 1.55)
        .add(() => window.dispatchEvent(new Event('wh:reveal')), .95);
      content(tl, 1.3);
    } else {
      // no preloader on this load: the grid is already there; the copy settles in
      window.dispatchEvent(new Event('wh:reveal'));
      tl.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power1.out' }, 0);
      content(tl, .05);
    }
    setTimeout(() => window.ScrollTrigger && window.ScrollTrigger.refresh(), 80);
  };

  if (root.classList.contains('is-loading') && pl) {
    const check = () => { if (pl.classList.contains('is-full')) reveal(true); };
    new MutationObserver(check).observe(pl, { attributes: true, attributeFilter: ['class'] });
    check();
    addEventListener('silenus:enter', () => reveal(true), { once: true });   // safety: never leave the hero hidden
  } else {
    reveal(false);
  }
})();
