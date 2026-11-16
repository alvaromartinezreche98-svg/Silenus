/* SILENUS — 03 · The Knowledge Layer: the Morphing Knowledge Path (2026-11-17)
   ============================================================================================================
   KL_CHAPTERS — the section's chapters and footage, in one place. To use the final client-approved videos, change
   the paths (and `ratio`, the recording's own width × height) here; nothing else references them.
   TEMPORARY FOOTAGE (existing Silenus recordings, chosen after reviewing their frames; replace when final):
     01 sources  → assets/video/step-sources.*    Documents: SharePoint, Silenus Drive, folders into the vector store
     02 pipeline → assets/video/stage-pipeline.*  Documents → Vector pipeline: 14 agents extract and interpret
     03 context  → assets/video/reel-email.*      the AI bar over an email: "sees email", searches the knowledge base
   Claims are the site's own (Platform → Documents / Knowledge, the FAQ). Optional `fit` / `position` set how a
   recording sits in its frame (default: cover, centred).
   ============================================================================================================ */
const KL_CHAPTERS = [
  {
    id: 'sources', label: 'Sources',
    title: 'Every source, one base',
    line: 'SharePoint, Silenus Drive and Google Drive in one browser, read into one knowledge base.',
    video: { webm: 'assets/video/step-sources.webm', mp4: 'assets/video/step-sources.mp4' },
    poster: 'assets/video/step-sources-poster.jpg', ratio: [1000, 564]
  },
  {
    id: 'pipeline', label: 'Pipeline',
    title: 'Every page, read',
    line: '14 agents break every document down. A fact enters the index only if its evidence is found word for word.',
    video: { webm: 'assets/video/stage-pipeline.webm', mp4: 'assets/video/stage-pipeline.mp4' },
    poster: 'assets/video/stage-pipeline-poster.jpg', ratio: [1280, 662]
  },
  {
    id: 'context', label: 'Context',
    title: 'Context, where you work',
    line: 'Ask from the screen you are on: Silenus sees it, and answers from the whole knowledge base.',
    video: { webm: 'assets/video/reel-email.webm', mp4: 'assets/video/reel-email.mp4' },
    poster: 'assets/video/reel-email-poster.jpg', ratio: [1280, 670]
  }
];

/* THE SECTION (2026-11-17, restructured) — the title, then the videos; the particle S is only in section 04.
   · the title (desktop, motion allowed): the section's stage is held for a short stretch, on one scrubbed timeline —
       .00–.30  the title rises word by word, very large and centred, then settles to its place
       .28–.36  the 18 px line beneath it fades in
       .62–1    the title and its line go out of focus (blur, drift back, fade) as the videos arrive
     Elsewhere the title is simply revealed as it comes into view.
   · the videos, in a zigzag: each opens as it scrolls in (r, 0 → 1, from its own position — no pinning): a slanted
     wipe that travels away from its words, the frame rising into place, the recording settling inside it from a
     slight zoom and drift (a parallax against the frame); its words follow, one after another. Only the chapter
     nearest the middle of the screen plays. */
(() => {
  'use strict';
  const sec = document.getElementById('knowledge-layer');
  const box = sec && sec.querySelector('[data-kl]');
  if (!box) return;
  const list = box.querySelector('[data-kl-chapters]');
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('reduced-motion');
  const intro = box.querySelector('[data-kl-intro]'), stage = box.querySelector('[data-kl-stage]'), words = box.querySelector('[data-kl-words]');
  const title = box.querySelector('.kl__title'), lead = box.querySelector('.kl__lead');
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const G = window.gsap;
  const ease = (q) => 1 - Math.pow(1 - q, 3);

  /* ---- the title, word by word (each word rises through its own mask) ------------------------------------ */
  const wordEls = [];
  const split = (el) => [...el.childNodes].forEach((n) => {
    if (n.nodeType === 1) { split(n); return; }
    if (n.nodeType !== 3) return;
    const f = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach((t) => {
      if (!t) return;
      if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
      const o = document.createElement('span'), i = document.createElement('span');
      o.className = 'kl__w'; i.className = 'kl__wi'; i.textContent = t; o.appendChild(i); f.appendChild(o); wordEls.push(i);
    });
    n.replaceWith(f);
  });
  if (title) split(title);

  /* ---- build the chapters (from the config) -------------------------------------------------------- */
  const canWebm = (() => { const v = document.createElement('video'); return !!v.canPlayType && v.canPlayType('video/webm; codecs="vp9"') !== ''; })();
  const ch = KL_CHAPTERS.map((c, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';            // where the video sits: left, right, left … (the words opposite)
    const li = document.createElement('li');
    li.className = 'kl__chap'; li.dataset.side = side; li.id = 'kl-' + c.id;
    li.innerHTML = `
      <span class="kl__node" aria-hidden="true"><i></i></span>
      <span class="kl__tick" aria-hidden="true"></span>
      <div class="kl__chap-text">
        <p class="kl__chap-idx"><span>${String(i + 1).padStart(2, '0')}</span> ${c.label}</p>
        <h3 class="kl__chap-t"></h3>
        <p class="kl__chap-d"></p>
      </div>
      <figure class="kl__chap-media">
        <div class="kl__frame" style="aspect-ratio:${c.ratio[0]} / ${c.ratio[1]}">
          <video muted playsinline loop preload="none"></video>
          <div class="kl__load" aria-hidden="true"><span class="kl__load-dots"><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="kl__load-bar"><i></i></span></div>
          <p class="kl__missing" hidden>This recording will be added soon.</p>
          <button class="kl__pp is-paused" type="button" aria-label="Play video"><svg viewBox="0 0 16 16" aria-hidden="true"><path class="kl__pp-pause" d="M5 3.5v9M11 3.5v9"/><path class="kl__pp-play" d="M5 3.2v9.6L12.6 8z"/></svg></button>
        </div>
      </figure>`;
    li.querySelector('.kl__chap-t').textContent = c.title;
    li.querySelector('.kl__chap-d').textContent = c.line;
    const v = li.querySelector('video');
    if (c.poster) v.poster = c.poster;
    v.style.objectFit = c.fit || 'cover'; v.style.objectPosition = c.position || '50% 50%';
    v.setAttribute('aria-label', 'Silenus product recording: ' + c.title);
    list.appendChild(li);
    return {
      c, i, side, li, v, media: li.querySelector('.kl__chap-media'), node: li.querySelector('.kl__node'), tick: li.querySelector('.kl__tick'), text: li.querySelector('.kl__chap-text'),
      frame: li.querySelector('.kl__frame'), load: li.querySelector('.kl__load'), bar: li.querySelector('.kl__load-bar i'),
      missing: li.querySelector('.kl__missing'), pp: li.querySelector('.kl__pp'),
      r: -1, loaded: false, ready: false, seen: false, userPaused: calm
    };
  });

  /* ---- video ---------------------------------------------------------------------------------------- */
  const srcOf = (c) => (c.video ? (canWebm && c.video.webm ? c.video.webm : c.video.mp4 || c.video.webm) : '');
  const load = (o) => {
    if (o.loaded) return; o.loaded = true;
    const src = srcOf(o.c);
    if (!src) { o.missing.hidden = false; o.load.hidden = true; return; }
    o.frame.classList.add('is-loading');
    o.v.preload = 'auto'; o.v.src = src;
    o.v.addEventListener('progress', () => { try { const b = o.v.buffered; if (b.length && o.v.duration) o.bar.style.transform = `scaleX(${clamp(b.end(b.length - 1) / o.v.duration).toFixed(3)})`; } catch (e) {} });
    o.v.addEventListener('loadeddata', () => { o.ready = true; o.frame.classList.remove('is-loading'); o.frame.classList.add('is-ready'); sync(); }, { once: true });
    o.v.addEventListener('error', () => { o.frame.classList.remove('is-loading'); o.missing.hidden = false; }, { once: true });
    o.v.load();
  };
  let active = -1;
  const setPP = (o) => { const paused = o.v.paused; o.pp.classList.toggle('is-paused', paused); o.pp.setAttribute('aria-label', paused ? 'Play video' : 'Pause video'); };
  const sync = () => {                                      // only the chapter nearest the middle of the screen plays, once revealed
    ch.forEach((o) => {
      const want = o.i === active && o.seen && o.ready && !o.userPaused && !document.hidden && o.r >= .98;
      if (want && o.v.paused) o.v.play().then(() => setPP(o)).catch(() => { o.userPaused = true; setPP(o); });
      else if (!want && !o.v.paused) o.v.pause();
      setPP(o);
    });
  };
  ch.forEach((o) => {
    o.pp.addEventListener('click', () => {
      if (o.v.paused) { o.userPaused = false; ch.forEach((x) => { if (x !== o && !x.v.paused) x.v.pause(); }); load(o); if (o.ready) o.v.play().then(() => setPP(o)).catch(() => {}); }
      else { o.userPaused = true; o.v.pause(); }
      setPP(o);
    });
  });
  document.addEventListener('visibilitychange', () => sync());
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { const o = ch.find((x) => x.frame === e.target); if (o) { o.seen = e.isIntersecting; sync(); } }), { threshold: .3 });
    ch.forEach((o) => io.observe(o.frame));
  } else ch.forEach((o) => { o.seen = true; });

  /* ---- the journey (2026-11-17): a straight spine down the centre (phones: down the left); each entry is anchored to
     it by a marker and a hairline. As an entry scrolls in, one short scrubbed timeline: its marker lights on the
     spine, the hairline draws out to the recording, the recording comes in from its side, its words from theirs.
     The spine fills as the reader moves through the journey. No pinning. */
  let headOn = false, introOn = false;
  const journey = box.querySelector('[data-kl-journey]'), spineFill = box.querySelector('[data-kl-spine]');
  if (calm || !G || !window.ScrollTrigger) ch.forEach((o) => { o.r = 1; o.node.classList.add('is-on'); });
  else {
    G.matchMedia().add({ wide: '(min-width: 768px)', narrow: '(max-width: 767.98px)' }, (cx) => {
      const wide = cx.conditions.wide;
      ch.forEach((o) => {
        const vd = o.side === 'left' ? -1 : 1;               // the recording comes in from its own side
        const kids = [...o.text.children];
        const tl = G.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: o.li, start: 'top 90%', end: 'top 48%', scrub: .6,
            onUpdate: (st) => { o.r = st.progress >= .995 ? 1 : st.progress; o.node.classList.toggle('is-on', st.progress > .25); } }
        });
        tl.fromTo(o.node, { scale: .2, opacity: 0 }, { scale: 1, opacity: 1, duration: .22, ease: 'power2.out' }, 0)
          .fromTo(o.tick, { scaleX: 0 }, { scaleX: 1, duration: .28, ease: 'power2.inOut' }, .12)
          .fromTo(o.media, wide ? { opacity: 0, x: vd * 56 } : { opacity: 0, y: 28 }, { opacity: 1, x: 0, y: 0, duration: .62, ease: 'power3.out' }, .22)
          .fromTo(kids, wide ? { opacity: 0, x: -vd * 32 } : { opacity: 0, y: 16 }, { opacity: 1, x: 0, y: 0, duration: .5, stagger: .08, ease: 'power3.out' }, .3);
      });
      // the spine's fill: from the first marker to the last, as the reading line (the middle of the screen) passes
      const sf = G.fromTo(spineFill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: journey, start: 'top 55%', end: 'bottom 55%', scrub: .4 } });
      return () => { sf.scrollTrigger && sf.scrollTrigger.kill(); };
    });
  }
  const update = () => {
    const vh = innerHeight;
    if (!introOn) {                                          // no hold: reveal the title as it comes into view
      const on = calm || (words && words.getBoundingClientRect().top < vh * .85);
      if (on !== headOn) { headOn = on; sec.classList.toggle('is-core', on); }
    }
    let act = -1, best = Infinity;
    ch.forEach((o) => {
      const fr = o.media.getBoundingClientRect();
      if (fr.top < vh * 2.2) load(o);                        // lazy: only as it approaches
      const dist = Math.abs(fr.top + fr.height / 2 - vh / 2);
      if (o.r >= .98 && fr.bottom > 0 && fr.top < vh && dist < best) { best = dist; act = o.i; }
    });
    active = act;
    sync();
  };

  /* ---- the title's hold (desktop, motion allowed): one scrubbed timeline ----------------------------- */
  const buildIntro = () => {
    introOn = true; sec.classList.add('is-intro', 'is-core');
    const head = words.parentElement;
    const startY = () => stage.clientHeight / 2 + 32 - (head.offsetTop + title.offsetTop + title.offsetHeight / 2);
    const startS = () => Math.max(1, Math.min(1.6, (innerWidth * .92) / title.offsetWidth, (innerHeight * .7) / title.offsetHeight));
    const tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
    tl.fromTo(wordEls, { yPercent: 150 }, { yPercent: 0, duration: .1, stagger: .03, ease: 'power3.out' }, 0)
      .fromTo(title, { y: startY, scale: startS, transformOrigin: '50% 50%' }, { y: 0, scale: 1, duration: .14, ease: 'power3.inOut' }, .15)
      .fromTo(lead, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .08, ease: 'power2.out' }, .28)
      // out of focus: the words drift back and blur as the videos come up beneath them
      .fromTo(words, { filter: 'blur(0px)', opacity: 1, y: 0, scale: 1 }, { filter: 'blur(10px)', opacity: 0, y: -46, scale: .94, duration: .38, ease: 'power1.in' }, .62)
      .to({}, { duration: .001 }, .999);
    return () => {
      introOn = false; sec.classList.remove('is-intro');
      G.set([title, lead, words, ...wordEls], { clearProps: 'all' }); headOn = false;
      requestAnimationFrame(update);
    };
  };
  if (calm) sec.classList.add('is-calm', 'is-core');
  else if (G && G.matchMedia && window.ScrollTrigger && intro && stage && words) G.matchMedia().add('(min-width: 1024px)', () => buildIntro());

  // the hero's canvas (hero-waves.js) no longer draws in this section: the particle S lives in section 04
  window.SilenusKL = { chapters: KL_CHAPTERS, visible: () => false, progress: () => 0 };

  update();
  if (window.ScrollTrigger) {
    const st = window.ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update });
    addEventListener('pagehide', (e) => { if (!e.persisted) st.kill(); });
  } else {
    let raf = 0;
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
  }
  addEventListener('resize', update);
  addEventListener('load', update, { once: true });
})();
