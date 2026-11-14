/* SILENUS — Context (#connected) entrance (2026-11-14).
   Order, once, when the grid comes into view — and only after the page grid has drawn its cell lines
   (window.SilenusGrid.ready(grid, 'body'), arch-sections.js):
     1. the customer hub settles in from its edge;
     2. the five linked records arrive one by one: each scales forward 0.92 → 1.025 and settles to exactly 1
        (0.92 → 1.03 → 1; transform only, so nothing in the layout moves), 130 ms apart;
     3. as each card lands its illustration plays its own motion — the record's lines fill in, the signature writes,
        the envelope's flap folds shut, the crate travels as progress fills to 62 %, the gap between two amounts is
        bracketed;
     4. the conclusion arrives last — the morning briefing: the dark cell, its labels, the headline (out of its mask),
        then the sentence.
   Reduced motion / no GSAP: everything is simply there (the markup holds every illustration in its final state). */
(() => {
  'use strict';
  const grid = document.querySelector('#connected [data-cn]');
  if (!grid) return;
  const g = window.gsap, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hub = grid.querySelector('.bt-cn__hub'), cards = [...grid.querySelectorAll('.bt-cn__l')], res = grid.querySelector('.bt-cn__res');
  if (calm || !g || !hub || !res) { grid.classList.add('is-in', 'cn-done'); return; }

  // each illustration's own motion, played as its card lands
  const motion = (card) => {
    const svg = card.querySelector('.cn-ill'), tl = g.timeline();
    if (!svg) return tl;
    const q = (s) => [...svg.querySelectorAll(s)];
    const draw = (els, at, dur) => els.forEach((p) => { const L = p.getTotalLength(); tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, at); });
    if (svg.classList.contains('cn-ill--crm')) {                  // the record fills in
      tl.fromTo(q('[data-cn-line]'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: .45, ease: 'power3.out', stagger: .12 }, 0);
    } else if (svg.classList.contains('cn-ill--contract')) {      // it gets signed
      draw(q('[data-cn-draw]'), .05, .8);
    } else if (svg.classList.contains('cn-ill--mail')) {          // the flap folds shut
      tl.fromTo(q('[data-cn-flap]'), { scaleY: -1, svgOrigin: '12 7' }, { scaleY: 1, duration: .65, ease: 'power3.inOut' }, 0);
    } else if (svg.classList.contains('cn-ill--project')) {       // the board's columns fill as the work moves
      tl.fromTo(q('[data-cn-col]'), { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: .55, ease: 'power3.out', stagger: .12 }, 0);
    } else if (svg.classList.contains('cn-ill--finance')) {       // two amounts, then the gap between them
      tl.fromTo(q('[data-cn-line]'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: .4, ease: 'power3.out', stagger: .1 }, 0);
      draw(q('[data-cn-draw]'), .45, .45);
    }
    return tl;
  };

  let ran = false;
  const run = () => {
    if (ran) return; ran = true;
    const all = [hub, ...cards, res];
    g.set(all, { opacity: 0 });
    grid.classList.add('is-in');                                  // releases the CSS hold; GSAP holds them from here
    const top = res.querySelector('.cn-res__top'), head = res.querySelector('.cn-res__t'), text = res.querySelector('.cn-res__d');
    const tl = g.timeline({ onComplete: () => { g.set(all, { clearProps: 'opacity,transform,zIndex' }); grid.classList.add('cn-done'); } });
    tl.fromTo(hub, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: .65, ease: 'power3.out' }, 0);
    cards.forEach((c, i) => {
      const at = .22 + i * .13;
      tl.set(c, { zIndex: 2 }, at)
        .fromTo(c, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1.03, duration: .42, ease: 'power2.out' }, at)
        .to(c, { scale: 1, duration: .4, ease: 'power2.inOut' }, at + .42)
        .add(motion(c), at + .3);
    });
    const end = .22 + cards.length * .13 + .3;
    // the conclusion: the dark cell, its labels, the headline out of its mask, then the sentence
    const parts = [top, head, text].filter(Boolean);
    g.set(parts, { opacity: 0 });
    tl.fromTo(res, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power2.out' }, end)
      .fromTo(top, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power2.out' }, end + .2)
      .fromTo(head, { opacity: 0, y: 18, clipPath: 'inset(0% 0% 100% 0%)' }, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: .8, ease: 'power4.out' }, end + .3)
      .fromTo(text, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, end + .5)
      .add(() => g.set(parts, { clearProps: 'opacity,transform,clipPath' }));
  };

  const ready = () => (window.SilenusGrid ? window.SilenusGrid.ready(grid, 'body') : Promise.resolve());
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); ready().then(run); } }, { threshold: .15 });
    io.observe(grid);
  } else ready().then(run);
})();
