(() => {
  const { $, UID } = Site;
  const STATUS = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' };

  function render(d){
    const u = d.discord_user || {};
    const anim = u.avatar && u.avatar.startsWith('a_');
    $('#avatar').src = u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${anim ? 'gif' : 'png'}?size=160`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';
    $('#dn').textContent = u.global_name || u.display_name || u.username || 'Boris';
    $('#un').textContent = u.username ? '@' + u.username : '';

    const st = d.discord_status || 'offline';
    $('#dot').className = 'dot ' + st;
    $('#stTxt').textContent = STATUS[st] || st;
    $('#statusFact').textContent = STATUS[st] || st;

    const plats = ['desktop', 'web', 'mobile'].filter(p => d['active_on_discord_' + p]);
    $('#plat').textContent = plats.length ? plats.map(p => p[0].toUpperCase() + p.slice(1)).join(', ') : 'Nowhere';
  }
  const setLink = s => { $('#link').textContent = s; };

  fetch(`https://api.lanyard.rest/v1/users/${UID}`)
    .then(r => r.json())
    .then(j => { if (j.success) { render(j.data); setLink('snapshot'); } })
    .catch(() => setLink('no signal'));

  let ws, hb, retry = 1000;
  function connect(){
    try { ws = new WebSocket('wss://api.lanyard.rest/socket'); } catch { return; }
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.op === 1) {
        clearInterval(hb);
        hb = setInterval(() => ws.readyState === 1 && ws.send('{"op":3}'), m.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: UID } }));
      } else if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) {
        render(m.d); setLink('live'); retry = 1000;
      }
    };
    ws.onclose = () => {
      clearInterval(hb); setLink('reconnecting');
      setTimeout(connect, retry); retry = Math.min(retry * 2, 30000);
    };
  }
  connect();
})();
