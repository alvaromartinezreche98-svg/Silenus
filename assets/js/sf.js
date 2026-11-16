/* SILENUS — The footer (2026-11-18): the wordmark's letters rise in, one after another, as it comes into view (as on
   silenus.vercel.app). Reduced motion: shown as they are. */
(() => {
  'use strict';
  const wm = document.querySelector('[data-sf-mark]');
  if (!wm || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion')) return;
  document.documentElement.classList.add('sf-anim');
  new IntersectionObserver(([e]) => { wm.classList.toggle('is-in', e.isIntersecting); }, { threshold: .35 }).observe(wm);
})();
