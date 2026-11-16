(() => {
  const { $, mouse, reduce, fine } = Site;

  const cur = $('#cur');
  if (fine) document.documentElement.classList.add('has-cur');

  const TARGETS = 'a,button,[data-cursor]';
  const NEAR = 80;
  const DOT = 12;
  const SWELL = 10;

  const S = (v = 0) => ({ v, vel: 0 });
  const morph = S();
  const g = { x: S(), y: S(), w: S(DOT), h: S(DOT), r: S(DOT / 2) };
  let hoverEl = null, lastEl = null, pressed = false, placed = false, lastT = 0;
  let targets = [];

  const collect = () => { targets = [...document.querySelectorAll(TARGETS)]; };
  collect();
  addEventListener('load', collect);

  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    hoverEl = e.target.closest(TARGETS);
    if (hoverEl) lastEl = hoverEl;
  });
  addEventListener('pointerdown', () => { pressed = true; });
  addEventListener('pointerup', () => { pressed = false; });

  function spring(s, target, dt, w, z){
    const n = Math.ceil(dt / (1 / 120)), h = dt / n;
    for (let i = 0; i < n; i++) {
      s.vel += (w * w * (target - s.v) - 2 * z * w * s.vel) * h;
      s.v += s.vel * h;
    }
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const clamp01 = t => Math.max(0, Math.min(1, t));

  function nearest(){
    let best = null, bestD = Infinity, px = 0, py = 0;
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const nx = Math.max(r.left, Math.min(mouse.x, r.right));
      const ny = Math.max(r.top, Math.min(mouse.y, r.bottom));
      const d = Math.hypot(mouse.x - nx, mouse.y - ny);
      if (d < bestD) { bestD = d; best = el; px = nx; py = ny; }
    }
    const q = best ? clamp01(1 - bestD / NEAR) : 0;
    return { el: best, q: ease(q), px, py };
  }

  function outlineOf(el){
    const r = el.getBoundingClientRect();
    const pad = el.dataset.pad != null ? +el.dataset.pad : 8;
    const round = el.dataset.cursor === 'round';
    let w = r.width + pad * 2, h = r.height + pad * 2;
    if (pressed) { w -= 8; h -= 8; }
    return {

      x: r.left + r.width / 2 + (mouse.x - (r.left + r.width / 2)) * .04,
      y: r.top + r.height / 2 + (mouse.y - (r.top + r.height / 2)) * .06,
      w, h, r: round ? Math.min(w, h) / 2 : 0, round,
    };
  }

  Site.cursorStep = now => {
    const dt = Math.min(.05, (now - (lastT || now)) / 1000);
    lastT = now;
    if (!fine) return;
    cur.classList.toggle('show', mouse.on);
    if (!mouse.on) { placed = false; return; }

    const over = !!(hoverEl && hoverEl.isConnected);

    const n = nearest();
    const q = over ? 1 : n.q;
    let size = DOT + SWELL * q;
    if (pressed) size *= .7;
    const dot = {
      x: mouse.x + (n.px - mouse.x) * q * .28,
      y: mouse.y + (n.py - mouse.y) * q * .28,
      w: size, h: size, r: size / 2,
    };

    if (!placed || reduce) { morph.v = over ? 1 : 0; morph.vel = 0; }
    else spring(morph, over ? 1 : 0, dt, 12, 1);
    const e = ease(clamp01(morph.v));

    const el = over ? hoverEl : lastEl;
    const out = el && el.isConnected && e > .001 ? outlineOf(el) : dot;
    const tgt = {
      x: lerp(dot.x, out.x, e), y: lerp(dot.y, out.y, e),
      w: lerp(dot.w, out.w, e), h: lerp(dot.h, out.h, e),
      r: lerp(dot.r, out.r, e),
    };
    cur.classList.toggle('round', !!(out.round && e > .5));

    if (!placed || reduce) {
      for (const k in g) { g[k].v = tgt[k]; g[k].vel = 0; }
      placed = true;
    } else {
      const wPos = lerp(40, 20, e), wSize = lerp(34, 18, e);
      spring(g.x, tgt.x, dt, wPos, 1); spring(g.y, tgt.y, dt, wPos, 1);
      spring(g.w, tgt.w, dt, wSize, .9); spring(g.h, tgt.h, dt, wSize, .9);
      spring(g.r, tgt.r, dt, wSize, 1);
    }

    const w = Math.max(4, g.w.v), h = Math.max(4, g.h.v);
    const rad = Math.max(0, Math.min(g.r.v, Math.min(w, h) / 2));
    cur.style.width = w.toFixed(2) + 'px';
    cur.style.height = h.toFixed(2) + 'px';
    cur.style.borderRadius = rad.toFixed(2) + 'px';
    cur.style.transform = `translate3d(${(g.x.v - w / 2).toFixed(2)}px,${(g.y.v - h / 2).toFixed(2)}px,0)`;

    cur.style.setProperty('--p', e.toFixed(3));
    cur.style.setProperty('--c', e.toFixed(3));
  };
})();
