(() => {
  const { $, mouse, reduce, coarse, PX2MM } = Site;

  const cv = $('#grid'), ctx = cv.getContext('2d');
  let W = 0, H = 0;
  function resize(){
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  const pings = [];
  const meas = { on: false, x1: 0, y1: 0, x2: 0, y2: 0 };
  const done = [];
  const interactive = 'a,button,.name,.quote,.facts,.dc,.parts,.blk-h,.strip';

  addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest(interactive)) return;
    if (e.pointerType !== 'touch') e.preventDefault();
    meas.on = true;
    meas.x1 = meas.x2 = e.clientX; meas.y1 = meas.y2 = e.clientY;
  });
  addEventListener('pointermove', e => {
    if (meas.on) { meas.x2 = e.clientX; meas.y2 = e.clientY; }
  }, { passive: true });
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

  function warp(x, y, now){
    let dx = 0, dy = 0;
    if (mouse.on && !coarse) {
      const vx = x - mouse.sx, vy = y - mouse.sy, r2 = vx * vx + vy * vy;
      const k = 0.16 * Math.exp(-r2 / (150 * 150));
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

  function gridPath(major, now){
    ctx.beginPath();
    const seg = 14;
    for (let i = 0, x = 0.5; x < W + STEP; x += STEP, i++) {
      if ((i % MAJOR === 0) !== major) continue;
      let [px, py] = warp(x, 0, now); ctx.moveTo(px, py);
      for (let y = seg; y <= H + seg; y += seg) { [px, py] = warp(x, y, now); ctx.lineTo(px, py); }
    }
    for (let j = 0, y = 0.5; y < H + STEP; y += STEP, j++) {
      if ((j % MAJOR === 0) !== major) continue;
      let [px, py] = warp(0, y, now); ctx.moveTo(px, py);
      for (let x = seg; x <= W + seg; x += seg) { [px, py] = warp(x, y, now); ctx.lineTo(px, py); }
    }
  }

  function lit(base, peak){
    if (!mouse.on || coarse) return `rgba(255,255,255,${base})`;
    const g = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 260);
    g.addColorStop(0, `rgba(255,255,255,${peak})`);
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

  function frameTicks(){
    const r = $('#sheet').getBoundingClientRect();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    for (let x = r.left; x <= r.right; x += 10) { const l = Math.round(x - r.left) % 100 === 0 ? 6 : 3; ctx.fillRect(x, r.top - l - 2, 1, l); }
    for (let y = r.top; y <= r.bottom; y += 10) { const l = Math.round(y - r.top) % 100 === 0 ? 6 : 3; ctx.fillRect(r.left - l - 2, y, l, 1); }
    if (mouse.on && !coarse) {
      ctx.fillStyle = 'rgba(237,237,237,.85)';
      const mx = Math.min(r.right, Math.max(r.left, mouse.sx)), my = Math.min(r.bottom, Math.max(r.top, mouse.sy));
      ctx.beginPath(); ctx.moveTo(mx, r.top - 2); ctx.lineTo(mx - 4, r.top - 9); ctx.lineTo(mx + 4, r.top - 9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r.left - 2, my); ctx.lineTo(r.left - 9, my - 4); ctx.lineTo(r.left - 9, my + 4); ctx.fill();
    }
  }

  Site.drawBackground = now => {
    for (let i = pings.length - 1; i >= 0; i--) if (now - pings[i].t > 1600) pings.splice(i, 1);

    ctx.fillStyle = '#060606'; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    gridPath(false, now); ctx.strokeStyle = lit(.028, .11); ctx.stroke();
    gridPath(true, now);  ctx.strokeStyle = lit(.06, .22);  ctx.stroke();

    for (const p of pings) {
      const age = (now - p.t) / 1600;
      ctx.strokeStyle = `rgba(237,237,237,${.5 * (1 - age)})`; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.arc(p.x, p.y, age * 520, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    }

    frameTicks();

    for (let i = done.length - 1; i >= 0; i--) {
      const age = (now - done[i].t) / 3000;
      if (age >= 1) { done.splice(i, 1); continue; }
      drawMeasure(done[i], .85 * (1 - age));
    }
    if (meas.on) drawMeasure(meas, .95);
  };
})();
