// Version simplifiée: client API minimal + branchement UI
(function () {
  const SIMU = 'https://wflageol-uqtr.net';

  // fetch POST court avec timeout
  async function post(body, timeout = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(`${SIMU}/decoder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      clearTimeout(t);
      const txt = await r.text();
      try { return JSON.parse(txt); } catch { return { raw: txt, status: r.status }; }
    } catch (e) { clearTimeout(t); throw e; }
  }

  // API exposée (noms courts)
  window.ApiDecodeur = {
    info: ({ id, address }) => post({ id, address, action: 'info' }),
    reset: ({ id, address }) => post({ id, address, action: 'reset' }),
    reinit: ({ id, address }) => post({ id, address, action: 'reinit' }),
    shutdown: ({ id, address }) => post({ id, address, action: 'shutdown' }),
  };

  // UI helpers
  function msg(text) {
    const c = document.getElementById('messages-content');
    if (!c) { console.log(text); return; }
    const p = document.createElement('p'); p.textContent = typeof text === 'string' ? text : JSON.stringify(text); c.appendChild(p);
  }

  function majEtat(info, adresse) {
    const e = document.getElementById('etat-content'); if (!e) return;
    const p = e.querySelectorAll('p'); if (p.length < 4) return;
    p[0].innerHTML = `<strong>Adresse :</strong> ${adresse || ''}`;
    p[1].innerHTML = `<strong>Statut :</strong> ${info && info.state ? info.state : ''}`;
    p[2].innerHTML = `<strong>Actif depuis :</strong> ${info && info.lastRestart ? info.lastRestart : ''}`;
    p[3].innerHTML = `<strong>Réinitialisé :</strong> ${info && info.lastReinit ? info.lastReinit : ''}`;
  }

  // Récupère id/adresse depuis la page
  function recupIdentifiants() {
    const idEl = document.getElementById('input-code-permanent-top');
    const sel = document.getElementById('select-adresse-decodeur');
    const id = idEl && idEl.value ? idEl.value.trim() : null;
    const address = sel && sel.value ? sel.value : null;
    return { id, address };
  }

  // Branche les boutons
  function init() {
    const actions = document.querySelector('#etat #actions-content'); if (!actions) return;
    const [btnReset, btnReinit, btnShutdown] = actions.querySelectorAll('button');
    const btnAfficher = document.getElementById('btn-afficher-decodeur');

    if (btnAfficher) btnAfficher.addEventListener('click', async () => {
      const { id, address } = recupIdentifiants(); if (!id || !address) { msg('Code ou adresse manquant'); return; }
      msg(`Demande info pour ${address} (id=${id})`);
      try { const r = await window.ApiDecodeur.info({ id, address }); msg(r); majEtat(r, address); } catch (e) { msg('Erreur: ' + e.message); }
    });

    if (btnReset) btnReset.addEventListener('click', async () => {
      const { id, address } = recupIdentifiants(); if (!id || !address) { msg('Code ou adresse manquant'); return; }
      msg(`Redémarrage ${address}`);
      try { const r = await window.ApiDecodeur.reset({ id, address }); msg(r); } catch (e) { msg('Erreur: ' + e.message); }
    });

    if (btnReinit) btnReinit.addEventListener('click', async () => {
      const { id, address } = recupIdentifiants(); if (!id || !address) { msg('Code ou adresse manquant'); return; }
      msg(`Réinitialisation ${address}`);
      try { const r = await window.ApiDecodeur.reinit({ id, address }); msg(r); } catch (e) { msg('Erreur: ' + e.message); }
    });

    if (btnShutdown) btnShutdown.addEventListener('click', async () => {
      const { id, address } = recupIdentifiants(); if (!id || !address) { msg('Code ou adresse manquant'); return; }
      msg(`Éteindre ${address}`);
      try { const r = await window.ApiDecodeur.shutdown({ id, address }); msg(r); } catch (e) { msg('Erreur: ' + e.message); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
