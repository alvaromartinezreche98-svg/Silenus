/* SILENUS — 05 · Intelligence in Action (2026-11-17)
   ============================================================================================================
   WX_FLOWS — the five workflows and their recordings, in one place. The recordings and their mapping are the live
   site's Workflows section (silenus.vercel.app): each is a real screen recording of the product. `ratio` is the
   recording's own width × height; `fit: 'contain'` keeps a recording whole when it must not be cropped.
   ============================================================================================================ */
const WX_FLOWS = [
  { id: 'documents', title: 'Document Intelligence', line: 'Turn documents into structured, actionable intelligence.',
    video: 'assets/video/stage-pipeline', ratio: [1280, 662] },
  { id: 'projects', title: 'Project Workflow', line: 'Bring tasks, teams, and project operations into one coordinated flow.',
    video: 'assets/video/reel-gantt', ratio: [1280, 628] },
  { id: 'communication', title: 'Business Communication', line: 'Keep business conversations and communication workflows connected.',
    video: 'assets/video/reel-email', ratio: [1280, 670] },
  { id: 'finance', title: 'Finance Workflow', line: 'Bring financial processes and information into a more organized workflow.',
    video: 'assets/video/reel-invoicing', ratio: [1280, 760] },
  // the recording shows a meeting set up from the conversation it is about (the live site's own description)
  { id: 'meetings', title: 'Pilot & Meeting Schedule', line: 'Start a meeting from the conversation it is about: invitees, time and place in one form, linked to its source.',
    video: 'assets/video/reel-meeting', ratio: [1280, 670] }
];

/* THE EXPLORER — a list (tabs) and one stage. The stage keeps a fixed size (the tallest recording's proportion), so
   nothing around it ever moves; inside it, the frame takes each recording's own proportion, so none is cropped or
   letterboxed. Choosing a workflow, in one GSAP timeline: the current recording and its words step back and fade, the
   frame eases to the new proportion, the indicator slides to the new item, the new recording and words come forward.
   Only the chosen recording loads eagerly and plays (muted, looping, only while on screen); the next is preloaded
   once the current one is ready, and any is preloaded when its item is hovered or focused. */
(() => {
  'use strict';
  const box = document.querySelector('[data-wx]');
  if (!box) return;
  const sec = box.closest('section'), tabs = box.querySelector('[data-wx-tabs]'), ind = box.querySelector('[data-wx-ind]'), prog = box.querySelector('[data-wx-prog]');
  const stage = box.querySelector('[data-wx-stage]'), frame = box.querySelector('[data-wx-frame]');
  const capN = box.querySelector('[data-wx-cap-n]'), capT = box.querySelector('[data-wx-cap-t]'), capD = box.querySelector('[data-wx-cap-d]'), cap = box.querySelector('[data-wx-cap]');
  const head = sec.querySelector('[data-wx-head]');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion');
  const G = window.gsap;
  const canWebm = (() => { const v = document.createElement('video'); return !!v.canPlayType && v.canPlayType('video/webm; codecs="vp9"') !== ''; })();
  const num = (i) => String(i + 1).padStart(2, '0');
  const maxR = Math.max(...WX_FLOWS.map((f) => f.ratio[1] / f.ratio[0]));

  /* ---- build ------------------------------------------------------------------------------------------ */
  const items = WX_FLOWS.map((f, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'wx__tab'; b.id = 'wx-tab-' + f.id;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'wx-panel'); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
    b.innerHTML = '<span class="wx__tab-n"></span><span class="wx__tab-t"></span><svg class="wx__tab-a" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3.5 10h12.5"/><path d="M11.5 5.5L16 10l-4.5 4.5"/></svg>';
    b.querySelector('.wx__tab-n').textContent = num(i); b.querySelector('.wx__tab-t').textContent = f.title;
    tabs.appendChild(b);
    const v = document.createElement('video');
    v.className = 'wx__vid'; v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.poster = f.video + '-poster.jpg';
    v.setAttribute('aria-label', 'Silenus product recording: ' + f.title);
    if (f.fit) v.style.objectFit = f.fit;
    frame.appendChild(v);
    return { f, i, b, v, loaded: false, ready: false };
  });
  frame.id = 'wx-panel'; frame.setAttribute('role', 'tabpanel');
  const load = (o) => {
    if (o.loaded) return; o.loaded = true;
    o.v.preload = 'auto'; o.v.src = o.f.video + (canWebm ? '.webm' : '.mp4');
    o.v.addEventListener('loadeddata', () => { o.ready = true; if (o.i === cur) { frame.classList.remove('is-loading'); sync(); load(items[(o.i + 1) % items.length]); } }, { once: true });
    o.v.addEventListener('error', () => { if (!canWebm || o.v.src.endsWith('.mp4')) return; o.v.src = o.f.video + '.mp4'; o.v.load(); }, { once: true });
    o.v.load();
  };

  /* ---- playback: only the chosen recording, only while the section is on screen ------------------------------ */
  let cur = 0, seen = false;
  const sync = () => items.forEach((o) => {
    const want = o.i === cur && seen && !document.hidden && !calm && o.ready;
    if (want && o.v.paused) o.v.play().catch(() => {});
    else if (!want && !o.v.paused) o.v.pause();
  });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) load(items[cur]); sync(); }, { threshold: .25 }).observe(stage);
  else { seen = true; }

  // the indicator follows the playback of the chosen recording
  const tickProg = () => { const v = items[cur].v; if (v.duration) prog.style.transform = `scaleY(${(v.currentTime / v.duration).toFixed(4)})`; };
  items.forEach((o) => o.v.addEventListener('timeupdate', () => { if (o.i === cur) tickProg(); }));

  /* ---- choosing a workflow --------------------------------------------------------------------------- */
  const placeInd = (o, animate) => {
    const y = o.b.offsetTop, h = o.b.offsetHeight;
    if (G && animate && !calm) G.to(ind, { y, height: h, duration: .55, ease: 'power3.inOut' });
    else { ind.style.transform = `translateY(${y}px)`; ind.style.height = h + 'px'; }
  };
  const setCap = (o) => { capN.textContent = num(o.i) + ' / ' + num(items.length - 1); capT.textContent = o.f.title; capD.textContent = o.f.line; };
  const ratioOf = (o) => o.f.ratio[1] / o.f.ratio[0];
  const fitFrame = (o) => { frame.style.height = (stage.clientWidth * ratioOf(o)).toFixed(1) + 'px'; };
  let tl = null;
  const select = (i, focus) => {
    if (i === cur && items[cur].b.getAttribute('aria-selected') === 'true') return;
    const from = items[cur], to = items[i];
    cur = i;
    items.forEach((o) => { const on = o === to; o.b.setAttribute('aria-selected', String(on)); o.b.tabIndex = on ? 0 : -1; o.b.classList.toggle('is-on', on); });
    frame.setAttribute('aria-labelledby', to.b.id);
    if (focus) to.b.focus();
    load(to); if (!to.ready) frame.classList.add('is-loading');
    prog.style.transform = 'scaleY(0)';
    placeInd(to, true);
    if (tl) tl.kill();
    if (!G || calm) {
      items.forEach((o) => { o.v.classList.toggle('is-on', o === to); o.v.style.opacity = o === to ? 1 : 0; });
      setCap(to); fitFrame(to); sync(); return;
    }
    const capKids = [capN, capT, capD];
    tl = G.timeline({ defaults: { overwrite: 'auto' } });
    if (from !== to) {
      tl.to(from.v, { opacity: 0, scale: .985, duration: .35, ease: 'power2.in' }, 0)
        .to(capKids, { opacity: 0, y: -8, duration: .25, stagger: .04, ease: 'power2.in' }, 0);
    }
    tl.to(frame, { height: stage.clientWidth * ratioOf(to), duration: .5, ease: 'power3.inOut' }, .15)
      .add(() => { items.forEach((o) => o.v.classList.toggle('is-on', o === to)); setCap(to); to.v.currentTime = 0; sync(); }, .34)
      .fromTo(to.v, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' }, .36)
      .fromTo(capKids, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, stagger: .06, ease: 'power3.out' }, .4);
    items.forEach((o) => { if (o !== to && o !== from) G.set(o.v, { opacity: 0 }); });
  };
  items.forEach((o) => {
    o.b.addEventListener('click', () => choose(o.i));
    o.b.addEventListener('pointerenter', () => load(o));      // preload on intent
    o.b.addEventListener('focus', () => load(o));
  });
  tabs.addEventListener('keydown', (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); choose((cur + d + items.length) % items.length, true); }
    else if (e.key === 'Home') { e.preventDefault(); choose(0, true); }
    else if (e.key === 'End') { e.preventDefault(); choose(items.length - 1, true); }
  });

  // the first: Document Intelligence
  cur = -1;
  items.forEach((o) => { o.v.style.opacity = 0; });
  const first = items[0];
  cur = 0; items.forEach((o) => { const on = o === first; o.b.setAttribute('aria-selected', String(on)); o.b.tabIndex = on ? 0 : -1; o.b.classList.toggle('is-on', on); });
  frame.setAttribute('aria-labelledby', first.b.id);
  first.v.classList.add('is-on'); first.v.style.opacity = 1; first.v.preload = 'metadata';
  setCap(first); fitFrame(first); placeInd(first, false);
  // the words under the recording keep the height of the longest, so nothing below moves when they change
  const capRoom = () => {
    cap.style.minHeight = '';
    let mx = 0; items.forEach((o) => { setCap(o); mx = Math.max(mx, cap.getBoundingClientRect().height); });
    setCap(items[cur]); cap.style.minHeight = Math.ceil(mx) + 1 + "px";
    // the grid's height, reserved for the tallest recording (the list sits within it): nothing below ever moves
    const body = box, capM = parseFloat(getComputedStyle(cap).marginTop) || 0, phoneL = innerWidth < 768;
    const nav = tabs.offsetHeight, top = Math.max(stage.clientWidth * maxR, phoneL ? 0 : nav);
    body.style.minHeight = Math.ceil(top + capM + Math.ceil(mx) + 1 + (phoneL ? nav + 28 : 0)) + 'px';
  };
  capRoom();
  /* ---- the scroll (2026-11-18): the workflows also advance as the reader scrolls through the section. While the
     track below the heading scrolls past, the explorer (list, recording, words) stays on screen (CSS sticky — no pin
     spacer), and each stretch of scroll makes the next workflow the chosen one; scrolling up goes back through them.
     Where the explorer does not fit on the screen, it is not held: the workflows follow the section's own scroll.
     A click (or a key) chooses at once, then the page glides to that workflow's place in the scroll, so the two
     never disagree; the scroll does not override a click while the page is getting there. */
  const track = sec.querySelector('[data-wx-track]'), pin = sec.querySelector('[data-wx-pin]'), navBar = document.querySelector('header.nav'), N = items.length;
  // the whole section (heading + explorer) is held on screen while its track scrolls past: N equal intervals of scroll,
  // one per workflow — the last one included, so it is fully shown before the section lets go. Where the section is a
  // little taller than the room below the nav, it is drawn slightly smaller (uniformly, as a whole) while held; where
  // it would have to shrink below 78 %, it is not held, and the workflows follow the section's own scroll instead.
  const sy = { on: false, top: 0, range: 0, k: 1, lock: -1, lockUntil: 0, st: null };
  const layoutSync = () => {
    pin.style.transform = '';
    const vh = innerHeight, navH = navBar ? navBar.offsetHeight : 64, ph = pin.offsetHeight, room = vh - navH - 32;   // a margin above and below
    const k = Math.min(1, room / ph), step = Math.round(vh * (innerWidth < 768 ? .36 : .42));
    if (k >= .78) {
      sy.on = true; sy.k = k; sy.range = step * N;
      sy.top = Math.round(navH + 8 + Math.max(0, (room - ph * k) / 2));
      track.style.height = (ph + sy.range) + 'px'; pin.style.top = sy.top + 'px';
      pin.style.transform = k < 1 ? `scale(${k.toFixed(4)})` : '';
      sec.classList.add('is-sync');
    } else {
      sy.on = false; sy.k = 1; track.style.height = ''; pin.style.top = ''; sec.classList.remove('is-sync');
    }
  };
  const choose = (i, focus) => {
    select(i, focus);
    if (!sy.st) return;
    sy.lock = i; sy.lockUntil = performance.now() + 1600;
    const y = sy.st.start + ((i + .5) / N) * (sy.st.end - sy.st.start);   // the middle of that workflow's interval
    const l = window.Silenus && window.Silenus.lenis;
    if (l) l.scrollTo(y, { duration: calm ? 0 : .9 }); else scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
  };
  layoutSync();
  if (window.ScrollTrigger) {
    sy.st = window.ScrollTrigger.create({
      trigger: track, invalidateOnRefresh: true,
      start: () => (sy.on ? `top ${sy.top}px` : 'top 62%'),
      end: () => (sy.on ? `+=${sy.range}` : 'bottom 38%'),
      onUpdate: (st) => {
        const i = Math.max(0, Math.min(N - 1, Math.floor(st.progress * N)));
        if (sy.lock >= 0) { if (i === sy.lock || performance.now() > sy.lockUntil) sy.lock = -1; else return; }
        if (i !== cur) select(i);
      }
    });
    addEventListener('pagehide', (e) => { if (!e.persisted && sy.st) { sy.st.kill(); sy.st = null; } });
  }
  addEventListener('resize', () => { fitFrame(items[cur]); placeInd(items[cur], false); capRoom(); layoutSync(); window.ScrollTrigger && window.ScrollTrigger.refresh(); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { placeInd(items[cur], false); capRoom(); layoutSync(); window.ScrollTrigger && window.ScrollTrigger.refresh(); });

  /* ---- the entrance: once, as the section arrives (no pinning) ------------------------------------------- */
  if (G && window.ScrollTrigger && !calm) {
    const hk = [...head.children], nav = [...tabs.querySelectorAll('.wx__tab')];
    G.set(hk, { opacity: 0, y: 22 }); G.set(nav, { opacity: 0, x: -14 }); G.set(stage, { opacity: 0, y: 30 }); G.set([cap, ind], { opacity: 0 });
    G.timeline({ scrollTrigger: { trigger: sec, start: 'top 72%', once: true } })
      .to(hk, { opacity: 1, y: 0, duration: .9, stagger: .1, ease: 'power3.out' })
      .to(stage, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, .3)
      .to(nav, { opacity: 1, x: 0, duration: .7, stagger: .07, ease: 'power3.out' }, .4)
      .to([cap, ind], { opacity: 1, duration: .6, ease: 'power2.out' }, .75);
  }

  // the page-long thread passes this section by (wx.css: its mask runs to this section's end)
  const mainEl = document.getElementById('main');
  const setEnd = () => { if (mainEl) mainEl.style.setProperty('--wx-end', Math.round(sec.getBoundingClientRect().bottom - mainEl.getBoundingClientRect().top) + 'px'); };
  setEnd(); addEventListener('load', setEnd, { once: true });
  if ('ResizeObserver' in window) new ResizeObserver(setEnd).observe(sec);
  window.ScrollTrigger && window.ScrollTrigger.addEventListener('refresh', setEnd);
})();
