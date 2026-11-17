(() => {
  const { $, mouse, touch, reduce, coarse, PX2MM } = Site;

  const cv = $('#grid'), ctx = cv.getContext('2d');
  let W = 0, H = 0, need = true, lastSY = NaN, hadL = false, lastFull = 0;
  function resize(){
    const d = Math.min(devicePixelRatio || 1, 2);
    if (coarse) {
      const h = Math.round(cv.getBoundingClientRect().height) || innerHeight;
      if (innerWidth === W && h === H) return;
      W = innerWidth; H = h;
    } else { W = innerWidth; H = innerHeight; }
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    need = true;
  }
  addEventListener('resize', resize);
  resize();

  const pings = [];
  const meas = { on: false, x1: 0, y1: 0, x2: 0, y2: 0 };
  const done = [];
  const interactive = 'a,button,.name,.quote,.facts,.dc,.parts,.blk-h,.strip';

  addEventListener('pointerdown', e => {
    if (coarse || e.button !== 0 || e.target.closest(interactive)) return;
    if (e.pointerType !== 'touch') e.preventDefault();
    meas.on = true;
    meas.x1 = meas.x2 = e.clientX; meas.y1 = meas.y2 = e.clientY;
  });
  addEventListener('pointermove', e => {
    if (meas.on) { meas.x2 = e.clientX; meas.y2 = e.clientY; }
  }, { passive: true });
  addEventListener('pointercancel', () => { meas.on = false; });
  addEventListener('pointerup', () => {
    if (!meas.on) return;
    meas.on = false;
    if (Math.hypot(meas.x2 - meas.x1, meas.y2 - meas.y1) > 10) {
      done.push({ ...meas, t: performance.now() });
      if (done.length > 4) done.shift();
    } else if (!reduce) {
      pings.push({ x: meas.x1, y: meas.y1, t: performance.now() });
    }
  });

  const STEP = 28, MAJOR = 5;

  let L = null;
  function lens(){
    if (mouse.on && !coarse) return [mouse.sx, mouse.sy, 1];
    if (coarse && !reduce && touch.k > .01) return [touch.sx, touch.sy, touch.k];
    return null;
  }

  function warp(x, y, now){
    let dx = 0, dy = 0;
    if (L) {
      const vx = x - L[0], vy = y - L[1], r2 = vx * vx + vy * vy;
      const k = 0.16 * L[2] * Math.exp(-r2 / (150 * 150));
      dx += vx * k; dy += vy * k;
    }
    for (const p of pings) {
      const age = (now - p.t) / 1600, R = age * 520;
      const vx = x - p.x, vy = y - p.y, r = Math.hypot(vx, vy) || 1;
      const a = 9 * (1 - age) * Math.exp(-((r - R) ** 2) / (2 * 26 * 26));
      dx += vx / r * a; dy += vy / r * a;
    }
    return [x + dx, y + dy];
  }

  const DUR = 1000, V_STAGGER = 14, H_STAGGER = 22;
  let introT = null, introDone = reduce;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function grow(now, delay){
    if (introDone) return 1;
    if (introT === null) return 0;
    return easeOut(Math.max(0, Math.min(1, (now - introT - delay) / DUR)));
  }

  function gridPath(major, now){
    ctx.beginPath();
    const seg = 14, bend = !coarse || L || pings.length;
    const cols = Math.ceil((W + STEP) / STEP), rows = Math.ceil((H + STEP) / STEP);

    for (let i = 0, x = 0.5; x < W + STEP; x += STEP, i++) {
      if ((i % MAJOR === 0) !== major) continue;
      const p = grow(now, (cols - 1 - i) * V_STAGGER);
      if (p <= 0) continue;
      const start = H + seg, end = start - (H + seg * 2) * p;
      if (!bend) { ctx.moveTo(x, start); ctx.lineTo(x, end); continue; }
      let [px, py] = warp(x, start, now); ctx.moveTo(px, py);
      for (let y = start - seg; y > end; y -= seg) { [px, py] = warp(x, y, now); ctx.lineTo(px, py); }
      [px, py] = warp(x, end, now); ctx.lineTo(px, py);
    }

    const off = coarse && !reduce ? scrollY * .4 : 0, j0 = Math.floor(off / STEP);
    for (let j = j0, y = j0 * STEP - off + 0.5; y < H + STEP; y += STEP, j++) {
      if ((j % MAJOR === 0) !== major) continue;
      const p = grow(now, (rows - 1 - (j - j0)) * H_STAGGER);
      if (p <= 0) continue;
      const start = W + seg, end = start - (W + seg * 2) * p;
      if (!bend) { ctx.moveTo(start, y); ctx.lineTo(end, y); continue; }
      let [px, py] = warp(start, y, now); ctx.moveTo(px, py);
      for (let x = start - seg; x > end; x -= seg) { [px, py] = warp(x, y, now); ctx.lineTo(px, py); }
      [px, py] = warp(end, y, now); ctx.lineTo(px, py);
    }
  }

  function introStep(now){
    if (introDone) return;
    const cl = document.documentElement.classList;
    if (introT === null && (cl.contains('lines') || cl.contains('ready'))) introT = now;
    if (introT === null) return;
    const cols = Math.ceil((W + STEP) / STEP), rows = Math.ceil((H + STEP) / STEP);
    const last = Math.max((cols - 1) * V_STAGGER, (rows - 1) * H_STAGGER) + DUR;
    if (now - introT > last) introDone = true;
  }

  function lit(base, peak){
    if (!L) return `rgba(255,255,255,${base})`;
    const g = ctx.createRadialGradient(L[0], L[1], 0, L[0], L[1], 260);
    g.addColorStop(0, `rgba(255,255,255,${L[2] === 1 ? peak : base + (peak - base) * L[2]})`);
    g.addColorStop(1, `rgba(255,255,255,${base})`);
    return g;
  }

  function drawMeasure(m, a){
    const { x1, y1, x2, y2 } = m, len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = -uy, ny = ux;
    ctx.strokeStyle = ctx.fillStyle = `rgba(237,237,237,${a})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.moveTo(x + nx * 8, y + ny * 8); ctx.lineTo(x - nx * 8, y - ny * 8); }
    ctx.stroke();

    const label = (len * PX2MM).toFixed(1) + ' mm';
    let ang = Math.atan2(y2 - y1, x2 - x1);
    if (Math.abs(ang) > Math.PI / 2) ang += Math.PI;
    ctx.save();
    ctx.translate((x1 + x2) / 2, (y1 + y2) / 2); ctx.rotate(ang);
    ctx.font = '500 11px "Google Sans Flex", system-ui, sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = `rgba(6,6,6,${Math.min(1, a + .15)})`; ctx.fillRect(-tw / 2 - 6, -19, tw + 12, 16);
    ctx.fillStyle = `rgba(237,237,237,${a})`; ctx.textAlign = 'center'; ctx.fillText(label, 0, -7);
    ctx.restore();
  }

  function frameTicks(now){
    const a = introDone ? 1 : introT === null ? 0 : Math.max(0, Math.min(1, (now - introT - 900) / 600));
    if (a <= 0) return;
    const r = $('#sheet').getBoundingClientRect();
    ctx.fillStyle = `rgba(255,255,255,${.12 * a})`;
    for (let x = r.left; x <= r.right; x += 10) { const l = Math.round(x - r.left) % 100 === 0 ? 6 : 3; ctx.fillRect(x, r.top - l - 2, 1, l); }
    for (let y = r.top; y <= r.bottom; y += 10) { const l = Math.round(y - r.top) % 100 === 0 ? 6 : 3; ctx.fillRect(r.left - l - 2, y, l, 1); }
    if (mouse.on && !coarse) {
      ctx.fillStyle = `rgba(237,237,237,${.85 * a})`;
      const mx = Math.min(r.right, Math.max(r.left, mouse.sx)), my = Math.min(r.bottom, Math.max(r.top, mouse.sy));
      ctx.beginPath(); ctx.moveTo(mx, r.top - 2); ctx.lineTo(mx - 4, r.top - 9); ctx.lineTo(mx + 4, r.top - 9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r.left - 2, my); ctx.lineTo(r.left - 9, my - 4); ctx.lineTo(r.left - 9, my + 4); ctx.fill();
    }
  }

  Site.drawBackground = now => {
    for (let i = pings.length - 1; i >= 0; i--) if (now - pings[i].t > 1600) pings.splice(i, 1);
    introStep(now);
    L = lens();

    if (coarse) {
      const sy = scrollY;
      if (now - lastFull > 500) need = true;
      const busy = need || !introDone || L || hadL || sy !== lastSY || pings.length || done.length || meas.on;
      hadL = !!L; lastSY = sy;
      if (!busy) return;
      need = false; lastFull = now;
    }

    ctx.fillStyle = '#060606'; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    gridPath(false, now); ctx.strokeStyle = lit(.028, .11); ctx.stroke();
    gridPath(true, now);  ctx.strokeStyle = lit(.06, .22);  ctx.stroke();

    for (const p of pings) {
      const age = (now - p.t) / 1600;
      ctx.strokeStyle = `rgba(237,237,237,${.5 * (1 - age)})`; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.arc(p.x, p.y, age * 520, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    }

    frameTicks(now);

    for (let i = done.length - 1; i >= 0; i--) {
      const age = (now - done[i].t) / 3000;
      if (age >= 1) { done.splice(i, 1); continue; }
      drawMeasure(done[i], .85 * (1 - age));
    }
    if (meas.on) drawMeasure(meas, .95);
  };
})();
