(() => {
  const $ = s => document.querySelector(s);

  const Site = window.Site = {
    $,
    UID: '204625571865427968',
    PX2MM: 25.4 / 96,
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarse: matchMedia('(pointer: coarse)').matches,
    fine: matchMedia('(pointer: fine)').matches,
    mouse: { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, on: false },
    touch: { x: 0, y: 0, sx: 0, sy: 0, on: false, k: 0 },
  };

  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', '#060606');

  const { mouse, PX2MM } = Site;
  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = e.pointerType !== 'touch';
    if (mouse.sx < -1e3) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
    $('#coords').textContent = `X ${(e.clientX * PX2MM).toFixed(1).padStart(5, '0')} · Y ${(e.clientY * PX2MM).toFixed(1).padStart(5, '0')} mm`;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mouse.on = false; });

  const { touch } = Site;
  const onTouch = e => {
    const t = e.touches[0];
    if (!t) return;
    if (touch.k < .05) { touch.sx = t.clientX; touch.sy = t.clientY; }
    touch.x = t.clientX; touch.y = t.clientY; touch.on = true;
  };
  addEventListener('touchstart', onTouch, { passive: true });
  addEventListener('touchmove', onTouch, { passive: true });
  addEventListener('touchend', e => { if (!e.touches.length) touch.on = false; }, { passive: true });
  addEventListener('touchcancel', () => { touch.on = false; }, { passive: true });
})();
