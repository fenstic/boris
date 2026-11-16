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

  const toastEl = $('#toast');
  let toastT;
  Site.toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 1600);
  };
  Site.copy = async text => {
    try { await navigator.clipboard.writeText(text); Site.toast('Copied ' + text); }
    catch {
      const a = document.createElement('textarea');
      a.value = text; document.body.appendChild(a); a.select();
      try { document.execCommand('copy'); Site.toast('Copied ' + text); } catch { Site.toast(text); }
      a.remove();
    }
  };
  $('#copyHandle').addEventListener('click', () => Site.copy('@fenstic'));
})();
