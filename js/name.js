(() => {
  const { $, mouse, coarse, PX2MM } = Site;

  const nameEl = $('#name');
  const letters = [...'Boris'].map(c => {
    const s = document.createElement('span');
    s.textContent = c;
    s.setAttribute('aria-hidden', 'true');
    return s;
  });
  nameEl.replaceChildren(...letters);

  const state = letters.map(() => ({ w: 300, d: 100, r: 0 }));
  let lastDim = '';

  Site.nameStep = () => {
    letters.forEach((el, i) => {
      let t = 0;
      if (mouse.on && !coarse) {
        const r = el.getBoundingClientRect();
        const dist = Math.hypot(mouse.sx - (r.left + r.width / 2), mouse.sy - (r.top + r.height / 2));
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
