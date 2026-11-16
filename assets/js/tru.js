/* SILENUS — Trust · Built for business, designed for trust (2026-11-18)
   As the section arrives (GSAP + ScrollTrigger, scrubbed — no pinning): the statement rises in, its two registers a
   beat apart; then the foundation line fills in the logo's gradient (left to right; on phones, top to bottom) and each
   principle comes up as the line reaches it — its node lights, its number, title and line rise in, one after another.
   Reduced motion: everything shown, the line full. */
(() => {
  'use strict';
  const box = document.querySelector('[data-tru]');
  if (!box) return;
  const sec = box.closest('section'), head = sec.querySelector('[data-tru-head]'), rail = box.querySelector('[data-tru-rail]');
  const items = [...box.querySelectorAll('[data-tru-p]')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion');
  const G = window.gsap;

  // the page-long thread passes this section by (tru.css: its mask runs on to this section's end)
  const mainEl = document.getElementById('main');
  const setEnd = () => { if (mainEl) mainEl.style.setProperty('--tru-end', Math.round(sec.getBoundingClientRect().bottom - mainEl.getBoundingClientRect().top) + 'px'); };
  setEnd(); addEventListener('load', setEnd, { once: true });
  if ('ResizeObserver' in window) new ResizeObserver(setEnd).observe(document.body);
  window.ScrollTrigger && window.ScrollTrigger.addEventListener('refresh', setEnd);

  if (calm || !G || !window.ScrollTrigger) { sec.classList.add('is-calm'); items.forEach((p) => p.classList.add('is-on')); return; }

  G.matchMedia().add({ narrow: '(max-width: 639.98px)', wide: '(min-width: 640px)' }, (c) => {
    const narrow = c.conditions.narrow;
    const hk = [...head.querySelectorAll('.tru__r1, .tru__r2, .tru__aside')];
    G.fromTo(hk, { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power3.out', stagger: .12,
      scrollTrigger: { trigger: head, start: 'top 88%', end: 'top 52%', scrub: .6 } });
    // the line, and each principle as the line reaches it
    const tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: box, start: 'top 82%', end: narrow ? 'bottom 70%' : 'top 30%', scrub: .6,
      onUpdate: (st) => items.forEach((p, i) => p.classList.toggle('is-on', st.progress >= at(i) + .04)) } });
    const at = (i) => (narrow ? i / items.length : i * .15) * .9;
    tl.fromTo(rail, narrow ? { scaleY: 0 } : { scaleX: 0 }, narrow ? { scaleY: 1, duration: 1 } : { scaleX: 1, duration: 1 }, 0);
    items.forEach((p, i) => {
      tl.fromTo([...p.children].filter((k) => !k.classList.contains('tru__node')), { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: .3, stagger: .05, ease: 'power3.out' }, at(i));
    });
    return () => items.forEach((p) => p.classList.remove('is-on'));
  });
})();
