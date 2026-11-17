(() => {
  const { $, mouse, coarse, PX2MM } = Site;

  const nameEl = $('#name');
  const letters = [...'Boris'].map((c, i) => {
    const s = document.createElement('span');
    s.textContent = c;
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', i);
    return s;
  });
  nameEl.replaceChildren(...letters);

  const state = letters.map(() => ({ w: 300, d: 100, r: 0 }));
  let lastDim = '';

  const touch = { x: 0, y: 0, on: false };
  const onTouch = e => { const t = e.touches[0]; if (t) { touch.x = t.clientX; touch.y = t.clientY; touch.on = true; } };
  addEventListener('touchstart', onTouch, { passive: true });
  addEventListener('touchmove', onTouch, { passive: true });
  addEventListener('touchend', e => { if (!e.touches.length) touch.on = false; }, { passive: true });
  addEventListener('touchcancel', () => { touch.on = false; }, { passive: true });

  Site.nameStep = () => {
    letters.forEach((el, i) => {
      let t = 0, px = null, py = null;
      if (mouse.on && !coarse) { px = mouse.sx; py = mouse.sy; }
      else if (touch.on) { px = touch.x; py = touch.y; }
      if (px !== null) {
        const r = el.getBoundingClientRect();
        const dist = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        t = Math.max(0, 1 - dist / 340);
        t = t * t * (3 - 2 * t);
      }
      const s = state[i];
      s.w += (300 + t * 520 - s.w) * .12;
      s.d += (100 + t * 18 - s.d) * .12;
      s.r += (t * 100 - s.r) * .12;
      el.style.fontVariationSettings = `"wght" ${s.w.toFixed(1)},"wdth" ${s.d.toFixed(1)},"ROND" ${s.r.toFixed(0)},"opsz" 144`;
    });

    const mm = (nameEl.getBoundingClientRect().width * PX2MM).toFixed(1) + ' mm';
    if (mm !== lastDim) { $('#dimTxt').textContent = mm; lastDim = mm; }
  };
})();
