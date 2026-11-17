(() => {
  const { $, coarse, reduce } = Site;

  Site.mobileStep = () => {};
  if (!coarse || reduce) return;

  const root = document.documentElement;
  const sheet = $('#sheet');
  const ring = $('.av .ring');

  const targets = document.querySelectorAll('.facts, .side > section:first-child, .side > section:last-child > .blk-h, .parts li, .strip.bot');
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      io.unobserve(el);
      if (root.classList.contains('ready')) el.classList.add('late');
      el.classList.remove('wait');
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  const fold = innerHeight * .92;
  targets.forEach(el => {
    if (el.getBoundingClientRect().top > fold) { el.classList.add('wait'); io.observe(el); }
  });

  let lastY = scrollY, lastT = 0, vel = 0, spin = 0, sweep = 0;

  Site.mobileStep = now => {
    const dt = lastT ? Math.min(.05, (now - lastT) / 1000) : 0;
    lastT = now;
    const y = scrollY;
    if (dt > 0) vel += ((y - lastY) / dt - vel) * .2;
    lastY = y;

    const speed = Math.min(Math.abs(vel), 4000);
    spin = (spin + dt * (12 + speed * .12)) % 360;
    if (ring) ring.style.transform = `rotate(${spin.toFixed(2)}deg)`;

    sweep = (sweep + dt * (24 + speed * .05)) % 360;
    sheet.style.setProperty('--sa', `${(sweep + y * .3).toFixed(2)}deg`);
    sheet.style.setProperty('--sg', Math.min(1, .45 + speed / 2500).toFixed(3));
  };
})();
