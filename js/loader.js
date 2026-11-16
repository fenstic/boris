(() => {
  const loader = document.getElementById('loader');
  const ld = document.getElementById('ld');
  if (!loader) { document.documentElement.classList.add('ready'); return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 0 : 1100;
  const MAX = 4000;
  const t0 = performance.now();
  let finished = false;

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const loaded = new Promise(r => {
    if (document.readyState === 'complete') r();
    else addEventListener('load', r, { once: true });
  });
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();

  function remove(){
    document.documentElement.classList.add('ready');
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 600);
  }

  function finish(){
    if (finished) return;
    finished = true;
    if (reduce) { remove(); return; }

    const sheet = document.getElementById('sheet');
    const r = sheet.getBoundingClientRect();
    const dx = r.left + r.width / 2 - innerWidth / 2;
    const dy = r.top + r.height / 2 - innerHeight / 2;

    ld.classList.add('morph');
    void ld.offsetWidth;
    ld.style.width = r.width + 'px';
    ld.style.height = r.height + 'px';
    ld.style.borderRadius = '0px';
    ld.style.backgroundColor = 'transparent';
    ld.style.borderColor = 'var(--line)';
    ld.style.transform = `translate(${dx}px,${dy}px)`;

    setTimeout(remove, 800);
  }

  Promise.all([loaded, fonts.catch(() => {})])
    .then(() => wait(Math.max(0, MIN - (performance.now() - t0))))
    .then(finish);
  setTimeout(finish, MAX);
})();
