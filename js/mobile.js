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

  const rim = document.createElement('span');
  rim.className = 'rim';
  rim.setAttribute('aria-hidden', 'true');
  const rimK = document.createElement('span');
  rimK.className = 'rim-k';
  const sparks = [0, 1, 2, 3].map(n => {
    const e = document.createElement('i');
    e.className = 'e' + n;
    const b = document.createElement('b');
    e.append(b);
    rimK.append(e);
    return b;
  });
  rim.append(rimK);
  sheet.append(rim);

  const S = 140, SPEED = 260;
  let rimAnims = [], rimW = 0, rimH = 0;

  function buildRim(){
    const w = sheet.offsetWidth, h = sheet.offsetHeight;
    if (!w || !h || (w === rimW && h === rimH)) return;
    rimW = w; rimH = h;
    const total = 2 * (w + h) + S;
    const prev = rimAnims[0];
    const at = prev && prev.effect ? (prev.currentTime % prev.effect.getTiming().duration) / prev.effect.getTiming().duration : 0;
    const rate = prev ? prev.playbackRate : 1;
    rimAnims.forEach(a => a.cancel());
    const lens = [w, h, w, h];
    const path = [
      [`translateX(${-S}px)`, `translateX(${w}px)`],
      [`translateY(${-S}px)`, `translateY(${h}px)`],
      [`translateX(${w}px)`, `translateX(${-S}px)`],
      [`translateY(${h}px)`, `translateY(${-S}px)`],
    ];
    const duration = total / SPEED * 1000;
    let cum = 0;
    rimAnims = sparks.map((b, n) => {
      const s = cum / total, e = (cum + lens[n] + S) / total;
      cum += lens[n];
      const [from, to] = path[n];
      const a = b.animate([
        { transform: from, offset: 0 },
        { transform: from, offset: s },
        { transform: to, offset: e },
        { transform: to, offset: 1 },
      ], { duration, iterations: Infinity, easing: 'linear' });
      a.currentTime = at * duration;
      a.playbackRate = rate;
      return a;
    });
  }
  buildRim();
  new ResizeObserver(buildRim).observe(sheet);

  let lastY = scrollY, lastT = 0, vel = 0, rate = 1, glow = .45;

  Site.mobileStep = now => {
    const dt = lastT ? Math.min(.05, (now - lastT) / 1000) : 0;
    lastT = now;
    const y = scrollY;
    if (dt > 0) vel += ((y - lastY) / dt - vel) * .2;
    lastY = y;

    const speed = Math.min(Math.abs(vel), 4000);
    const r = Math.round((1 + speed / 500) * 10) / 10;
    if (r !== rate) {
      rate = r;
      rimAnims.forEach(a => a.updatePlaybackRate(rate));
      const ra = ring && ring.getAnimations().find(a => a.animationName === 'spin');
      if (ra) ra.updatePlaybackRate(rate * 1.5 - .5);
    }

    const g = Math.round(Math.min(1, .45 + speed / 2500) * 20) / 20;
    if (g !== glow) { glow = g; rimK.style.opacity = g; }
  };
})();
