(() => {
  const { $ } = Site;

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Etc/GMT-2', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  const TARGET = Date.parse('2027-01-20T00:00:00+02:00');
  const pad2 = n => String(n).padStart(2, '0');

  function countdown(){
    const ms = TARGET - Date.now();
    if (ms <= 0) { $('#countdown').textContent = '00:00:00:00'; return; }
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    $('#countdown').textContent = `${pad2(d)}:${pad2(h)}:${pad2(m)}:${pad2(s % 60)}`;
  }

  function tick(){
    $('#clock').textContent = fmt.format(new Date());
    countdown();
  }

  setInterval(tick, 1000);
  tick();
})();
