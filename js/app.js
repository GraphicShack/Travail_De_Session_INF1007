(function () {
  const BASE = 'https://wflageol-uqtr.net';

  async function envoyer({ id, address, action }) {
    try {
      const rep = await fetch(`${BASE}/decoder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id, address, action })
      });

      const txt = await rep.text();

      if (!rep.ok) {
        throw new Error(`HTTP ${rep.status} ${rep.statusText} - ${txt}`);
      }

      try {
        return JSON.parse(txt);
      } catch {
        return { raw: txt, status: rep.status };
      }
    } catch (err) {
      return {
        response: 'Error',
        message: err.message
      };
    }
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
    try {
      const url = `${BASE}/list?id=${encodeURIComponent(id)}`;
      const rep = await fetch(url);
      const html = await rep.text();

      if (!rep.ok) {
        throw new Error(`HTTP ${rep.status} ${rep.statusText}`);
      }

      return { url, html };
    } catch (err) {
      return {
        response: 'Error',
        message: err.message
      };
    }
  }

  window.ApiDecodeur = { info, reset, reinit, shutdown, list };
})();