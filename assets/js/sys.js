/* SILENUS — 04 · The connected system (2026-11-17)
   ============================================================================================================
   SYS_TOOLS — the tools, in one place. Only tools Silenus supports (FAQ: Microsoft 365 and Gmail, SharePoint, Google
   Drive, Google and Outlook calendars, Shopify, external tools through MCP; Word and Excel are among the documents it
   reads). `mark` is a symbol in assets/img/integrations.svg; `c` the mark's colour once its stream flows (the brand's
   own, lifted where it would be too dark on the tile); `d` the place on the stage (0 … 1) on wide screens; `m` on phones and tablets ([x, y]: y < .5 in the band above the
   centre, y > .5 in the band below).
   ============================================================================================================ */
const SYS_TOOLS = [
  { mark: 'outlook',    name: 'Outlook',         c: '#3A96DD', d: [.135, .2],  m: [.1, .3] },
  { mark: 'sharepoint', name: 'SharePoint',      c: '#2BA9A6', d: [.31, .07],  m: [.36, .12] },
  { mark: 'excel',      name: 'Excel',           c: '#33A86B', d: [.7, .09],   m: [.64, .12] },
  { mark: 'gdrive',     name: 'Google Drive',    c: '#F4B400', d: [.875, .22], m: [.9, .3] },
  { mark: 'shopify',    name: 'Shopify',         c: '#95BF47', d: [.955, .56], m: [.92, .72] },
  { mark: 'mcp',        name: 'Your other tools, through MCP', c: '#DDE3E8', d: [.79, .9], m: [.7, .9] },
  { mark: 'word',       name: 'Word',            c: '#5B8FDB', d: [.29, .93],  m: [.47, .78] },
  { mark: 'gcal',       name: 'Google Calendar', c: '#5A95F5', d: [.11, .79],  m: [.25, .9] },
  { mark: 'gmail',      name: 'Gmail',           c: '#EA4335', d: [.045, .49], m: [.07, .72] }
];

/* THE BRAND AT THE CENTRE (2026-11-18) — one stage, one scrubbed GSAP timeline (ScrollTrigger, no pinning):
     · the words at the centre: the eyebrow first; then the wordmark, built by the particles; then "makes it one.",
       the line beneath and the button, one after another
     · the tools around it appear, and their streams grow toward the centre, ending at small terminals around it;
       information keeps flowing along them (the streams keep changing shape: a living morph)
     · the particles (a screen-wide canvas): each sets off from just beyond the edge of the screen and drifts, on its
       own gently curved path (no trail), to its own point on one letter of the wordmark — across the letter's full
       stroke. The letters fill in from S to S; as a letter's particles arrive, its stroke draws in (at its final weight
       and colour) and the particles dissolve into it, so the word ends solid and fully readable.
   Reduced motion: the finished composition, still. */
(() => {
  'use strict';
  const stage = document.querySelector('[data-sys]');
  if (!stage) return;
  const sec = stage.closest('section'), svg = stage.querySelector('[data-sys-svg]'), defs = stage.querySelector('[data-sys-defs]');
  const cv = stage.querySelector('[data-sys-canvas]'), cx = cv.getContext('2d'), list = stage.querySelector('[data-sys-tools]');
  const core = stage.querySelector('[data-sys-core]'), word = stage.querySelector('[data-sys-word]');
  const letters = [...stage.querySelectorAll('[data-sys-l]')], wordsIn = [...stage.querySelectorAll('[data-sys-w]')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion');
  const NS = 'http://www.w3.org/2000/svg', SPRITE = 'assets/img/integrations.svg';
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (a, b, v) => { const q = clamp((v - a) / (b - a)); return q * q * (3 - 2 * q); };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const MINT = [155, 235, 200], LOGO_A = [79, 163, 224], LOGO_B = [111, 207, 154];
  const STRANDS = 3, PER = 7;
  const el = (tag, cls, parent) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); (parent || svg).appendChild(e); return e; };

  /* ---- the tools and their streams --------------------------------------------------------------------- */
  let hot = -1;
  const tools = SYS_TOOLS.map((t, i) => {
    const li = document.createElement('li');
    li.className = 'sys__tool'; li.style.setProperty('--c', t.c);
    li.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${SPRITE}#${t.mark}"/></svg><span class="sys__tool-n"></span>`;
    li.querySelector('.sys__tool-n').textContent = t.name;
    li.setAttribute('aria-label', t.name);
    list.appendChild(li);
    const g = el('g', 'sys__rib');
    const gr = document.createElementNS(NS, 'linearGradient'); gr.id = 'sys-g' + i; gr.setAttribute('gradientUnits', 'userSpaceOnUse');
    const rgb = hex(t.c);
    // the stream's colour: the tool's at its start, the brand's mint toward the centre, dissolving as it arrives
    gr.innerHTML = `<stop offset="0" stop-color="rgb(${rgb})" stop-opacity=".36"/><stop offset=".6" stop-color="rgb(${MINT})" stop-opacity=".24"/><stop offset="1" stop-color="rgb(${MINT})" stop-opacity=".08"/>`;
    defs.appendChild(gr);
    const paths = Array.from({ length: STRANDS }, () => { const p = el('path', null, g); p.setAttribute('pathLength', '1'); p.setAttribute('stroke', `url(#sys-g${i})`); return p; });
    const end = el('circle', 'sys__end', svg); end.setAttribute('r', '2.4');
    // a mouse only: on touch screens a tap must not leave the sequence held
    li.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; g.classList.add('is-hot'); hot = i; seq.hold(true); });
    li.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; g.classList.remove('is-hot'); hot = -1; seq.hold(false); });
    return { ...t, i, li, g, gr, paths, end, rgb, show: 0, draw: 0, flow: 0, x: 0, y: 0, live: false, act: 0, em: 0 };
  });
  const G = window.gsap;
  const st = { word: 0 };                                     // the wordmark's construction (0 … 1)

  /* ---- the tools, one at a time (2026-11-18): once all are shown, each in turn is the current one for a moment —
     its colour, a little more presence, its name — then the next; round again. Hovering a tool holds the sequence
     (that tool is shown instead); leaving resumes from the next one. Runs only while the section is on screen; not
     with reduced motion. */
  const seq = { cur: -1, held: false, call: null,
    step() { this.call = null; if (this.held) return; this.cur = (this.cur + 1) % tools.length; tools.forEach((o) => o.li.classList.toggle('is-cur', o.i === this.cur)); this.call = G && G.delayedCall(2.4, () => this.step()); },
    start() { if (calm || !G || this.held || this.call || this.cur >= 0 || !tools.every((o) => o.show >= 1)) return; this.call = G.delayedCall(.8, () => this.step()); },
    stop() { if (this.call) { this.call.kill(); this.call = null; } this.cur = -1; tools.forEach((o) => o.li.classList.remove('is-cur')); },
    hold(on) {
      this.held = on;
      if (this.cur < 0) return;
      if (on) { if (this.call) { this.call.kill(); this.call = null; } tools.forEach((o) => o.li.classList.remove('is-cur')); }
      else if (!this.call) this.call = G.delayedCall(.9, () => this.step());
    } };

  /* ---- geometry ------------------------------------------------------------------------------------- */
  let W = 0, H = 0, dpr = 1, C = [0, 0], wide = true, phone = false, BOX = null, TILE = 56;
  const nav = document.querySelector('header.nav');
  const measure = () => {
    wide = innerWidth >= 1024; phone = innerWidth < 768;
    dpr = Math.min(2, devicePixelRatio || 1);
    // the stage: tall enough for the centre and a band of tools around it; on wide screens, one screen below the nav
    const coreH = core.offsetHeight, room = innerHeight - (nav ? nav.offsetHeight : 64) - 24;
    // the bands of tools above and below the centre: as wide as the screen allows (on short wide screens they narrow, so
    // the whole composition still fits below the nav)
    const band = phone ? 118 : wide ? Math.max(96, Math.min(150, (room - coreH) / 2)) : 140;
    H = Math.round(Math.max(coreH + band * 2, wide ? Math.min(room, 920) : 0));
    stage.style.height = H + 'px';
    W = stage.clientWidth;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    C = [W / 2, H / 2];
    TILE = phone ? 44 : 56; stage.style.setProperty('--tile', TILE + 'px');
    // the centre's box: the streams end just outside it
    const cr = core.getBoundingClientRect(), sr = stage.getBoundingClientRect(), m = phone ? 6 : -18;   // a little inside the centre's box: the streams reach in toward the words
    BOX = { x0: cr.left - sr.left - m, y0: cr.top - sr.top - m, x1: cr.right - sr.left + m, y1: cr.bottom - sr.top + m };
    const bw = BOX.x1 - BOX.x0, bh = BOX.y1 - BOX.y0, bandTop = BOX.y0, bandBot = H - BOX.y1;
    tools.forEach((o) => {
      let fx, fy;
      if (wide) [fx, fy] = o.d;
      else { const [mx, my] = o.m; fx = mx; fy = my < .5 ? (my * 2 * bandTop) / H : (BOX.y1 + (my - .5) * 2 * bandBot) / H; }
      o.li.style.setProperty('--x', fx); o.li.style.setProperty('--y', fy);
      o.x = fx * W; o.y = fy * H;
      o.gr.setAttribute('x1', o.x.toFixed(1)); o.gr.setAttribute('y1', o.y.toFixed(1));
    });
    // each tool's terminal: on the side of the box that faces it, those on one side spread evenly along it
    const sides = { l: [], r: [], t: [], b: [] };
    tools.forEach((o) => {
      const dx = (o.x - C[0]) / (bw / 2), dy = (o.y - C[1]) / (bh / 2);
      o.side = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 't' : 'b');
      sides[o.side].push(o);
    });
    Object.entries(sides).forEach(([sd, arr]) => {
      const vert = sd === 'l' || sd === 'r';
      arr.sort((a, b) => (vert ? a.y - b.y : a.x - b.x));
      const len = (vert ? bh : bw) * (vert ? .5 : .62);
      arr.forEach((o, j) => {
        const f = arr.length === 1 ? .5 : j / (arr.length - 1), along = -len / 2 + f * len;
        const nx = sd === 'l' ? -1 : sd === 'r' ? 1 : 0, ny = sd === 't' ? -1 : sd === 'b' ? 1 : 0;
        const px = vert ? (sd === 'l' ? BOX.x0 : BOX.x1) : C[0] + along, py = vert ? (BOX.y0 + BOX.y1) / 2 + along : (sd === 't' ? BOX.y0 : BOX.y1);
        o.pt = [px, py]; o.n = [nx, ny];
        o.end.setAttribute('cx', px.toFixed(1)); o.end.setAttribute('cy', py.toFixed(1));
        o.gr.setAttribute('x2', px.toFixed(1)); o.gr.setAttribute('y2', py.toFixed(1));
      });
    });
  };
  // one strand of a stream at time t: from the tool to its terminal, arriving straight on
  const strand = (o, k, t) => {
    const dx = o.pt[0] - o.x, dy = o.pt[1] - o.y, L = Math.hypot(dx, dy) || 1, nx = dx / L, ny = dy / L, px = -ny, py = nx;
    const P0 = [o.x + nx * (TILE / 2 + 4), o.y + ny * (TILE / 2 + 4)], P3 = o.pt;
    const off = (k - (STRANDS - 1) / 2) * (phone ? 5 : 8);
    const w1 = Math.sin(t * .62 + o.i * 1.7 + k * .9) * L * .07 + Math.sin(t * .23 + o.i) * L * .03;
    const w2 = Math.sin(t * .48 + o.i * 2.3 + k * 1.4 + 1) * L * .025;
    const c1 = [o.x + dx * .38 + px * (off + w1), o.y + dy * .38 + py * (off + w1)];
    const reach = Math.min(L * .36, 120), tx = -o.n[1], ty = o.n[0];
    const c2 = [P3[0] + o.n[0] * reach + tx * (off * .5 + w2), P3[1] + o.n[1] * reach + ty * (off * .5 + w2)];
    return [P0, c1, c2, P3];
  };
  const bez = (s, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]]; };

  /* ---- the wordmark's particles --------------------------------------------------------------------- */
  const sCv = stage.querySelector('[data-sys-s]'), sCx = sCv && sCv.getContext('2d');
  const VB = word.viewBox.baseVal, NL = letters.length;
  const hsh = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const LS = (li) => .03 + li * .07;                        // when letter li begins to be built (on st.word)
  let parts = null, sW = 0, sH = 0;
  const build = () => {
    const L = letters.map((p) => p.getTotalLength()), total = L.reduce((a, b) => a + b, 0), N = phone ? 170 : wide ? 300 : 230;   // restrained: enough to read as the letters forming, never a cloud
    parts = [];
    letters.forEach((p, li) => {
      const n = Math.max(12, Math.round(N * L[li] / total)), ox = +p.dataset.x, hw = li === 0 || li === NL - 1 ? 7 : 6;
      for (let j = 0; j < n; j++) {
        const k = parts.length, s = (j + .5) / n, q = p.getPointAtLength(L[li] * s), q2 = p.getPointAtLength(Math.min(L[li], L[li] * s + .6));
        const dx = q2.x - q.x, dy = q2.y - q.y, l = Math.hypot(dx, dy) || 1, w = (((k * .6180339) % 1) - .5) * 2 * hw * .9;
        const x = ox + q.x - dy / l * w, y = q.y + dx / l * w;
        parts.push({ x, y, li, t1: LS(li) + s * .1 + hsh(k, 4) * .04, a: hsh(k, 2) * 6.2832, far: hsh(k, 3), go: hsh(k, 5), z: hsh(k, 6), g: (x + 10) / 618 });
      }
    });
  };
  const sizeS = () => { if (!sCv) return; sW = innerWidth; sH = innerHeight; sCv.width = Math.round(sW * dpr); sCv.height = Math.round(sH * dpr); };
  const FLY = .4, GST = 16;                                 // a longer, softer flight
  const drawParts = () => {
    if (!sCx) return;
    sCx.setTransform(dpr, 0, 0, dpr, 0, 0); sCx.clearRect(0, 0, sW, sH);
    if (!parts || calm || st.word <= 0 || st.word >= 1) return;
    const wr = word.getBoundingClientRect(), k = wr.width / VB.width, R = Math.hypot(sW, sH) / 2;
    const B = new Map(), r0 = Math.max(.9, Math.min(1.5, k * 2));
    const at = (p, ex, ey, f) => {
      const e = f * f * (3 - 2 * f), v = 1 - e, d0 = R + 14 + p.far * 70;   // eased in and out: no rush
      const sx = sW / 2 + Math.cos(p.a) * d0, sy = sH / 2 + Math.sin(p.a) * d0, dx = ex - sx, dy = ey - sy, bend = (p.go - .5) * .42;
      const mx = (sx + ex) / 2 - dy * bend, my = (sy + ey) / 2 + dx * bend;
      return [v * v * sx + 2 * v * e * mx + e * e * ex, v * v * sy + 2 * v * e * my + e * e * ey, e];
    };
    parts.forEach((p) => {
      const f = clamp((st.word - p.t1) / FLY), gone = smooth(p.t1 + FLY, p.t1 + FLY + .1, st.word);
      if (f <= 0 || gone >= 1) return;
      const ex = wr.left + (p.x - VB.x) * k, ey = wr.top + (p.y - VB.y) * k;
      const gi = Math.min(GST - 1, Math.floor(p.g * GST));
      let x = ex, y = ey, fly = 0;
      if (f < 1) {
        const [px, py, e] = at(p, ex, ey, f); x = px; y = py; fly = 1 - e;
      }
      const al = Math.min(9, Math.floor(.85 * Math.min(1, f * 5) * (1 - gone) * 10)), key = gi * 10 + al;
      if (al <= 0) return;
      let b = B.get(key); if (!b) { b = { p: new Path2D(), gi, al }; B.set(key, b); }
      const rr = r0 * (.8 + .4 * p.z) * (1 + .35 * fly);   // only slightly larger in flight
      b.p.moveTo(x + rr, y); b.p.arc(x, y, rr, 0, 6.2832);
    });
    const col = (gi) => { const q = (gi + .5) / GST; return LOGO_A.map((v, i) => Math.round(v + (LOGO_B[i] - v) * q)); };
    B.forEach((b) => { sCx.fillStyle = `rgba(${col(b.gi)},${((b.al + .5) / 10).toFixed(2)})`; sCx.fill(b.p); });
  };
  // each letter's stroke draws in as its particles arrive (at its final weight and colour)
  const drawLetters = () => letters.forEach((p, li) => { const v = calm ? 1 : smooth(LS(li) + .2, LS(li) + .5, st.word); p.style.strokeDashoffset = (1 - v).toFixed(4); });

  /* ---- render ----------------------------------------------------------------------------------------- */
  const render = (t) => {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    tools.forEach((o) => {
      // its presence: shown by the scroll; then, in the sequence, quieter unless it is the current one
      const target = seq.cur < 0 ? 1 : seq.held ? (o.i === hot ? 1 : 0) : (o.i === seq.cur ? 1 : 0);   // hover takes priority
      o.em += (target - o.em) * .08;                         // eased toward its state (no jumps)
      const quiet = seq.cur < 0 ? 1 : .58 + .42 * o.em;
      o.li.style.opacity = (o.show * quiet).toFixed(3);
      const sc = (.92 + .08 * o.show) * (1 + (seq.cur < 0 ? 0 : .07 * o.em));
      o.li.style.transform = o.show >= 1 && Math.abs(sc - 1) < .001 ? 'none' : `translate3d(0, ${((1 - o.show) * 10).toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
      const live = o.flow > .5;
      if (live !== o.live) { o.live = live; o.li.classList.toggle('is-live', live); }
      const S = [];
      for (let k = 0; k < STRANDS; k++) {
        const s = strand(o, k, t); S.push(s);
        if (o.draw > 0) {
          o.paths[k].setAttribute('d', `M${s[0][0].toFixed(1)} ${s[0][1].toFixed(1)}C${s[1][0].toFixed(1)} ${s[1][1].toFixed(1)} ${s[2][0].toFixed(1)} ${s[2][1].toFixed(1)} ${s[3][0].toFixed(1)} ${s[3][1].toFixed(1)}`);
          o.paths[k].style.strokeDashoffset = (1 - o.draw).toFixed(4);
        }
        o.paths[k].style.opacity = o.draw > 0 ? (hot === o.i ? 1 : .85).toFixed(2) : '0';
      }
      if (o.flow > 0) {
        const speed = calm ? 0 : .085 + (o.i % 3) * .012;
        for (let k = 0; k < STRANDS; k++) for (let j = 0; j < PER; j++) {
          const u = ((t * speed + j / PER + k * .13 + o.i * .07) % 1 + 1) % 1;
          if (u > o.draw) continue;
          const [x, y] = bez(S[k], u), m = Math.pow(u, 1.4);
          const c = o.rgb.map((v, i) => Math.round(v + (MINT[i] - v) * m));
          const al = o.flow * clamp(u / .08) * (1 - clamp((u - .82) / .18)) * (hot === o.i ? 1 : .82);
          cx.fillStyle = `rgba(${c},${al.toFixed(3)})`;
          cx.beginPath(); cx.arc(x, y, (k === 1 ? 1.7 : 1.25) * (phone ? .9 : 1), 0, 6.2832); cx.fill();
          if (u > .96) o.act = Math.min(1, o.act + .25 * o.flow);
        }
      }
      o.act *= .9;
      o.end.style.opacity = (o.draw >= 1 ? .45 + .55 * o.act : 0).toFixed(3);
    });
    drawLetters();
    drawParts();
    if (tools.every((o) => o.show >= 1)) seq.start(); else if (seq.cur >= 0 || seq.call) seq.stop();
  };

  /* ---- the sequence: one master timeline, scrubbed by the scroll ----------------------------------------- */
  if (calm) { tools.forEach((o) => { o.show = o.draw = o.flow = 1; }); st.word = 1; sec.classList.add('is-calm'); }
  else if (G && window.ScrollTrigger) {
    const [eyebrow, one, desc, cta] = wordsIn;
    G.set(wordsIn, { opacity: 0 });
    const tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: stage, start: 'top 88%', end: () => `top ${(nav ? nav.offsetHeight : 64) + 8}px`, scrub: .5, invalidateOnRefresh: true } });
    tl.fromTo(eyebrow, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12, ease: 'power3.out' }, 0);
    tools.forEach((o, i) => {
      tl.to(o, { show: 1, duration: .1, ease: 'power2.out' }, .02 + i * .012)
        .to(o, { draw: 1, duration: .2, ease: 'power1.inOut' }, .08 + i * .014)
        .to(o, { flow: 1, duration: .12 }, .2 + i * .014);
    });
    tl.to(st, { word: 1, duration: .62 }, .12)                                                    // the wordmark, built
      .fromTo(one, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .1, ease: 'power3.out' }, .74)
      .fromTo(desc, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .1, ease: 'power3.out' }, .82)
      .fromTo(cta, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .1, ease: 'power3.out' }, .9)
      .to({}, { duration: .001 }, .999);
    addEventListener('pagehide', (e) => { if (!e.persisted) { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); } });
  } else { tools.forEach((o) => { o.show = o.draw = o.flow = 1; }); st.word = 1; }

  /* ---- loop: only while the stage is on screen ----------------------------------------------------------- */
  const T = G && G.ticker;
  let running = false, inView = !('IntersectionObserver' in window);
  const t0 = performance.now();
  const frame = () => render((performance.now() - t0) / 1000);
  const start = () => { if (running || calm) return; running = true; T ? T.add(frame) : (function f() { if (!running) return; frame(); requestAnimationFrame(f); })(); };
  const stop = () => { seq.stop(); if (!running) return; running = false; T && T.remove(frame); };
  const mainEl = document.getElementById('main');
  const setEnd = () => { if (mainEl) mainEl.style.setProperty('--sys-end', Math.round(sec.getBoundingClientRect().bottom - mainEl.getBoundingClientRect().top) + 'px'); };
  const refresh = () => { measure(); sizeS(); build(); setEnd(); render(calm ? 0 : (performance.now() - t0) / 1000); };
  refresh();
  addEventListener('load', () => { refresh(); window.ScrollTrigger && window.ScrollTrigger.refresh(); }, { once: true });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(refresh);
  window.ScrollTrigger && window.ScrollTrigger.addEventListener('refresh', setEnd);
  if (!inView) new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView && !document.hidden) start(); else { stop(); sCx && sCx.clearRect(0, 0, sCv.width, sCv.height); } if (calm) render(0); }, { rootMargin: '10% 0px' }).observe(stage);
  else start();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (inView) start(); });
  let rq = 0; addEventListener('resize', () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(refresh); });
  addEventListener('pagehide', stop);
})();
