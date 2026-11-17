(() => {
  const { $, mouse, touch, coarse, reduce, PX2MM } = Site;

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

  const ready = () => document.documentElement.classList.contains('ready');

  Site.nameStep = () => {
    let px = null, py = null, reach = 340;
    if (mouse.on && !coarse) { px = mouse.sx; py = mouse.sy; }
    else if (coarse) {
      reach = 170;
      if (touch.on) { px = touch.sx; py = touch.sy; }
      else if (!reduce && ready()) {
        const r = nameEl.getBoundingClientRect();
        const ph = (1 - Math.cos(performance.now() / 1000 * 1.1)) / 2;
        px = r.left - 60 + (r.width + 120) * ph; py = r.top + r.height / 2;
      }
    }
    letters.forEach((el, i) => {
      let t = 0;
      if (px !== null) {
        const r = el.getBoundingClientRect();
        const dist = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        t = Math.max(0, 1 - dist / reach);
        t = t * t * (3 - 2 * t);
        if (coarse) t *= .6;
      }
      const s = state[i];
      s.w += (300 + t * 520 - s.w) * .12;
      s.d += (100 + (coarse ? 0 : t * 18) - s.d) * .12;
      s.r += (t * 100 - s.r) * .12;
      el.style.fontVariationSettings = `"wght" ${s.w.toFixed(1)},"wdth" ${s.d.toFixed(1)},"ROND" ${s.r.toFixed(0)},"opsz" 144`;
    });

    const mm = (nameEl.getBoundingClientRect().width * PX2MM).toFixed(1) + ' mm';
    if (mm !== lastDim) { $('#dimTxt').textContent = mm; lastDim = mm; }
  };
})();
