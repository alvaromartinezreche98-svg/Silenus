/* SILENUS — footer signature (2026-11-14). The oversized wordmark rises letter by letter out of its cell the first
   time it comes into view. No JS / reduced motion: it is simply there. */
(() => {
  'use strict';
  const wm = document.querySelector('.afoot2__wm');
  if (!wm) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { wm.classList.add('is-in'); return; }
  document.documentElement.classList.add('wm-anim');
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); wm.classList.add('is-in'); } }, { threshold: .3 });
  io.observe(wm);
})();
