(function () {
  const BASE = 'https://wflageol-uqtr.net';

  // Envoie un objet JSON {id,address,action} au point d'accès /decoder
  async function envoyer({ id, address, action }) {
    const rep = await fetch(`${BASE}/decoder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, address, action })
    });
    const txt = await rep.text();
    try { return JSON.parse(txt); } catch { return { raw: txt, status: rep.status }; }
  }

  async function info(id, address) {
    return envoyer({ id, address, action: 'info' });
  }

  async function reset(id, address) {
    return envoyer({ id, address, action: 'reset' });
  }

  async function reinit(id, address) {
    return envoyer({ id, address, action: 'reinit' });
  }

  async function shutdown(id, address) {
    return envoyer({ id, address, action: 'shutdown' });
  }

  async function list(id) {
    const url = `${BASE}/list?id=${encodeURIComponent(id)}`;
    const rep = await fetch(url);
    const html = await rep.text();
    return { url, html };
  }

  // Expose une petite API simple
  window.ApiDecodeur = { info, reset, reinit, shutdown, list };

})();

