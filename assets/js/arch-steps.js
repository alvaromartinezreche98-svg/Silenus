/* SILENUS — How it works (2026-11-14, v2). An architectural stage, assembled in front of the reader.
   1) Lines: drawn on the real edges of the stage's cells (head · tabs | recording | step, and each tab),
      merged where they meet, the three horizontals run out to the page's margin lines so every intersection closes.
   2) Grid first: when the section approaches (ScrollTrigger 'top 75%', once) the lines construct (teal → the line
      colour, as everywhere on the page) with a light running the top line; only then is the content placed:
      eyebrow → title (out of its masks) → lead → tabs → the recording (through a mask) → the step text.
   3) Steps: desktop (≥1024) — the stage pins while its track scrolls; the scroll position selects 01 → 04, and a tab
      moves the scroll to its step. Smaller screens — tabs only. A change: the new recording wipes in through a mask
      from the cell's edge (a thin light rides the wipe; the picture settles from 1.035 to 1), the old one recedes;
      the text crossfades with a small sideways shift; the chosen tab turns solid green (CSS).
   Reduced motion: lines and content are simply there; steps switch without movement. Needs GSAP + ScrollTrigger
   (site.min.js); without them the section is a static, fully usable tab set. */
(() => {
  'use strict';
  const sec = document.querySelector('[data-kx]');
  if (!sec) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = window.gsap, ST = window.ScrollTrigger;
  const anim = !calm && !!g;
  const $ = (s) => sec.querySelector(s), $$ = (s) => [...sec.querySelectorAll(s)];
  const track = $('[data-kx-track]'), stage = $('[data-kx-stage]'), layer = $('[data-kx-lines]');
  const tabs = $$('[data-kx-tab]'), wins = $$('[data-kx-win]'), copies = $$('[data-kx-copy]');
  const wipe = $('[data-kx-wipe]'), vis = $('[data-kx-vis]');
  const N = tabs.length;
  const desk = () => innerWidth >= 1024;
  let cur = 0, built = false, onScreen = false;

  // the title's two clauses get masks of their own (the composition's spans stay as they are)
  const title = $('.kx__title');
  if (title && !title.querySelector('.kx-l')) {
    const mut = title.querySelector('.sec-head__muted');
    const wrap = (nodes) => { const l = document.createElement('span'), i = document.createElement('span'); l.className = 'kx-l'; i.className = 'kx-li'; nodes.forEach((n) => i.appendChild(n)); l.appendChild(i); return l; };
    const first = [...title.childNodes].filter((n) => n !== mut);
    title.append(wrap(first)); if (mut) title.append(wrap([mut]));
  }

  /* ---- lines ---------------------------------------------------------------------------------- */
  const rel = (el) => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
  const merge = (segs) => {
    const by = new Map();
    segs.forEach((s) => { const k = s.o + Math.round(s.c); (by.get(k) || by.set(k, []).get(k)).push(s); });
    const out = [];
    by.forEach((list) => { list.sort((a, b) => a.a - b.a); let c = { ...list[0] };
      for (let i = 1; i < list.length; i++) { const s = list[i]; if (s.a <= c.b + 2) c.b = Math.max(c.b, s.b); else { out.push(c); c = { ...s }; } }
      out.push(c); });
    return out.filter((s) => s.b - s.a > 3);
  };
  const cells = () => {
    const list = [$('.kx__head'), $('.kx__tabs'), vis, ...$$('.kx__tabs > li')];
    if (desk()) list.push($('.kx__copy-cell')); else list.push(copies[cur]);
    return list.filter((e) => e && e.offsetParent !== null);
  };
  const plan = () => {
    const S = stage.getBoundingClientRect(), W = S.width, grid = rel($('[data-kx-grid]'));
    const X0 = grid.x, X1 = grid.x + grid.w, ml = Math.round(X0 * .42), mr = Math.round(W - (W - X1) * .42), margins = innerWidth >= 768;
    const segs = [];
    cells().forEach((el) => { const b = rel(el);
      segs.push({ o: 'h', c: b.y, a: b.x, b: b.x + b.w }, { o: 'h', c: b.y + b.h, a: b.x, b: b.x + b.w },
        { o: 'v', c: b.x, a: b.y, b: b.y + b.h }, { o: 'v', c: b.x + b.w, a: b.y, b: b.y + b.h }); });
    return merge(segs).map((s) => {
      // a line across the whole frame runs on to the margin lines; the frame's own edges run the stage's height
      if (s.o === 'h' && margins && s.a <= X0 + 2 && s.b >= X1 - 2) { s.a = ml; s.b = mr; }
      if (s.o === 'v' && desk() && (Math.abs(s.c - X0) < 2 || Math.abs(s.c - X1) < 2)) { s.a = 0; s.b = S.height; }
      return s;
    });
  };
  let lines = [];
  const draw = () => {
    const frag = document.createDocumentFragment();
    lines = plan().map((s) => {
      const e = document.createElement('i'); e.className = 'ax-sl ax-sl--' + s.o;
      // round the two ends, not the start and the length: lines meet to the pixel
      const a = Math.round(s.a), z = Math.max(a + 1, Math.round(s.b) + (s.o === 'v' ? 1 : 0));
      if (s.o === 'h') Object.assign(e.style, { left: a + 'px', top: Math.round(s.c) + 'px', width: (z - a + 1) + 'px', transformOrigin: '0 50%' });
      else Object.assign(e.style, { left: Math.round(s.c) + 'px', top: a + 'px', height: (z - a) + 'px', transformOrigin: '50% 0' });
      frag.appendChild(e); return e;
    });
    layer.replaceChildren(frag);
  };

  /* ---- recordings: only the shown one plays, only while the section is on screen ---------------- */
  const play = () => wins.forEach((w, i) => { const v = w.querySelector('video'); if (!v) return;
    if (i === cur && onScreen && !calm) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); });

  /* ---- step change ------------------------------------------------------------------------------- */
  const select = (k, { animate = true } = {}) => {
    k = Math.max(0, Math.min(N - 1, k));
    if (k === cur) return;
    const prev = cur, dir = k > prev ? 1 : -1; cur = k;
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', i === k ? 'true' : 'false'); t.tabIndex = i === k ? 0 : -1; });
    copies.forEach((c, i) => { c.classList.toggle('is-on', i === k); c.inert = i !== k; });
    wins.forEach((w, i) => w.classList.toggle('is-on', i === k));
    play();
    if (!desk()) requestAnimationFrame(draw);   // the step cell's height can change on one column
    if (!(animate && anim && built)) return;
    const nw = wins[k], ow = wins[prev], nc = copies[k], oc = copies[prev];
    g.killTweensOf([...wins, ...wins.map((w) => w.querySelector('video')), wipe, ...copies, ...copies.flatMap((c) => [...c.querySelectorAll('.kx-copy__meta > *, .kx-copy__text > *')])]);
    wins.forEach((w) => { if (w !== nw && w !== ow) g.set(w, { clearProps: 'all' }); });
    // the picture: the new window wipes in from the cell edge it is coming from; a light rides the wipe's edge
    g.set(ow, { visibility: 'visible', opacity: 1, zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' });
    g.set(nw, { zIndex: 3 });
    const W = vis.clientWidth;
    g.timeline({ defaults: { ease: 'power3.inOut' } })
      .fromTo(nw, { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .85 }, 0)
      .fromTo(nw.querySelector('video'), { scale: 1.035 }, { scale: 1, duration: 1.1, ease: 'power3.out' }, 0)
      .fromTo(wipe, { x: dir > 0 ? W : 0, opacity: 1 }, { x: dir > 0 ? 0 : W, duration: .85 }, 0)
      .to(wipe, { opacity: 0, duration: .25, ease: 'none' }, .7)
      .to(ow, { opacity: 0, scale: .985, duration: .5, ease: 'power2.out' }, .35)
      .add(() => { g.set(ow, { clearProps: 'all' }); g.set(nw, { clearProps: 'clipPath,zIndex' }); });
    // the text: out with a short sideways step, in a little later from the other side
    g.set(oc, { visibility: 'visible', opacity: 1 });
    g.to(oc, { opacity: 0, x: -10 * dir, duration: .28, ease: 'power2.in', onComplete: () => g.set(oc, { clearProps: 'all' }) });
    g.fromTo(nc.querySelectorAll('.kx-copy__meta > *, .kx-copy__text > *'), { opacity: 0, x: 14 * dir }, { opacity: 1, x: 0, duration: .6, ease: 'power3.out', stagger: .06, delay: .22, clearProps: 'transform,opacity' });
  };

  /* ---- tabs: click, arrows; on desktop a tab moves the scroll to its step ------------------------ */
  let pin = null, hold = 0;   // while a tab's scroll runs, the scroll position does not re-select the steps it passes
  const scrollToStep = (k) => {
    if (!desk() || !pin) return false;
    clearTimeout(hold); hold = setTimeout(() => { hold = 0; }, 1200);
    const y = pin.start + (pin.end - pin.start) * ((k + .5) / N);
    const L = window.Silenus && window.Silenus.lenis;
    if (L && !calm) L.scrollTo(y, { duration: 1 }); else scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
    return true;
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { scrollToStep(i); select(i); });
    t.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, Home: -99, End: 99 }[e.key]; if (!d) return;
      e.preventDefault(); const k = Math.max(0, Math.min(N - 1, d === 99 ? N - 1 : d === -99 ? 0 : cur + d));
      tabs[k].focus(); tabs[k].click();
    });
  });

  /* ---- build: lines first, then the content ------------------------------------------------------ */
  const build = (animate) => {
    if (built) return;
    draw();
    if (!animate || !anim) { built = true; sec.classList.remove('kx-pre'); return; }
    const hl = lines.filter((e) => e.classList.contains('ax-sl--h')).sort((a, b) => a.offsetTop - b.offsetTop);
    const vl = lines.filter((e) => e.classList.contains('ax-sl--v')).sort((a, b) => a.offsetLeft - b.offsetLeft);
    const ins = $$('[data-kx-in]'), lis = $$('.kx__tabs > li'), cl = [...copies[cur].querySelectorAll('.kx-copy__meta > *, .kx-copy__text > *')];
    const win = wins[cur], cols = getComputedStyle(layer.querySelector('.ax-sl') || layer).backgroundColor;
    sec.classList.remove('kx-pre');
    g.set(hl, { scaleX: 0, backgroundColor: '#3FA1A5' }); g.set(vl, { scaleY: 0, backgroundColor: '#3FA1A5' });
    g.set(ins, { opacity: 0, x: -8 }); g.set($$('.kx__title .kx-li'), { yPercent: 108 }); g.set(lis, { opacity: 0, x: -8 }); g.set(cl, { opacity: 0, x: 12 });
    g.set(win, { clipPath: 'inset(0% 100% 0% 0%)' });
    const tl = g.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { built = true; g.set([...hl, ...vl], { clearProps: 'transform,backgroundColor' }); } });
    // phase 1 — the frames: horizontals run out, verticals drop from them, a light runs the top line
    tl.to(hl, { scaleX: 1, backgroundColor: cols, duration: .9, stagger: .09 }, 0)
      .to(vl, { scaleY: 1, backgroundColor: cols, duration: .8, stagger: .06 }, .3);
    const top = hl[0];
    if (top) {
      const run = document.createElement('i'); run.className = 'ax-srun'; layer.appendChild(run);
      tl.set(run, { x: top.offsetLeft - 160, y: top.offsetTop, opacity: 0 }, .25)
        .to(run, { opacity: 1, duration: .2, ease: 'none' }, .25)
        .to(run, { x: top.offsetLeft + top.offsetWidth, duration: 1.4, ease: 'power2.inOut' }, .25)
        .to(run, { opacity: 0, duration: .3, ease: 'none', onComplete: () => run.remove() }, 1.35);
    }
    // phase 2 — the content, placed into the frames
    tl.add(() => { built = true; }, 1.05)
      .to(ins[0] || [], { opacity: 1, x: 0, duration: .6, ease: 'power3.out' }, 1.05)
      .to($$('.kx__title .kx-li'), { yPercent: 0, duration: 1, ease: 'power4.out', stagger: .1 }, 1.12)
      .to(ins.slice(1), { opacity: 1, x: 0, duration: .6, ease: 'power3.out', stagger: .08 }, 1.4)
      .to(lis, { opacity: 1, x: 0, duration: .5, ease: 'power3.out', stagger: .06 }, 1.45)
      .to(win, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05 }, 1.3)
      .to(cl, { opacity: 1, x: 0, duration: .6, ease: 'power3.out', stagger: .06, clearProps: 'transform,opacity' }, 1.85)
      .add(() => g.set([...ins, ...lis, win], { clearProps: 'transform,opacity,clipPath' }));
  };

  /* ---- start ------------------------------------------------------------------------------------- */
  const start = () => {
    if (anim) sec.classList.add('kx-pre');
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; play(); }, { threshold: .15 }).observe(sec); else onScreen = true;
    if (!g || !ST) { build(false); return; }
    // the scroll through the pinned track selects the step (desktop)
    const mm = g.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      pin = ST.create({
        trigger: track, start: () => `top top+=${(document.querySelector('header.nav') || {}).offsetHeight || 72}`, end: 'bottom bottom',
        onUpdate: (self) => { if (!hold) select(Math.min(N - 1, Math.floor(self.progress * N * .9999)), { animate: true }); }
      });
      return () => { pin && pin.kill(); pin = null; };
    });
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0) build(false);
    else if (r.top < innerHeight * .75) build(anim);
    else ST.create({ trigger: sec, start: 'top 75%', once: true, onEnter: () => build(anim) });
    // keep the lines on their edges
    let t = 0; const redraw = () => { clearTimeout(t); t = setTimeout(() => { if (built) draw(); }, 140); };
    addEventListener('resize', redraw); addEventListener('load', redraw);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(redraw);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(redraw); ro.observe(stage); $$('[data-kx-cell]').forEach((c) => ro.observe(c)); }
  };
  const go = () => requestAnimationFrame(() => { start(); ST && ST.refresh(); });
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(go, 0), { once: true }); else go();
})();
