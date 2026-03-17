(function () {
const BASE_URL = "http://localhost:3000/api/decoder";
  const DECODER_ADDRESSES = Array.from({ length: 12 }, (_, i) => `127.0.10.${i + 1}`);
  const ACTIONS = ["info", "reset", "reinit", "shutdown"];

  function isValidDecoderIp(ip) {
    return DECODER_ADDRESSES.includes(ip);
  }

  function isValidAction(action) {
    return ACTIONS.includes(action);
  }

  async function decoderRequest(id, address, action) {
    if (!id) {
      throw new Error("Code permanent manquant.");
    }

    if (!isValidDecoderIp(address)) {
      throw new Error("Adresse IP invalide. Utilise une adresse entre 127.0.10.1 et 127.0.10.12.");
    }

    if (!isValidAction(action)) {
      throw new Error("Action invalide.");
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        id,
        address,
        action
      })
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} ${response.statusText} - ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Réponse du serveur invalide.");
    }

    if (data.response !== "OK") {
      throw new Error(data.message || "Erreur inconnue du serveur");
    }

    return data;
  }

  async function getDecoderInfo(id, address) {
    return await decoderRequest(id, address, "info");
  }

  async function resetDecoder(id, address) {
    return await decoderRequest(id, address, "reset");
  }

  async function reinitDecoder(id, address) {
    return await decoderRequest(id, address, "reinit");
  }

  async function shutdownDecoder(id, address) {
    return await decoderRequest(id, address, "shutdown");
  }

  async function getAllDecodersInfo(id) {
    const results = [];

    for (const address of DECODER_ADDRESSES) {
      try {
        const info = await getDecoderInfo(id, address);
        results.push({ address, ...info });
      } catch (error) {
        results.push({ address, response: "Error", message: error.message });
      }
    }

    return results;
  }

  function msg(texte) {
    const cont = document.getElementById("messages-content");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const ts = `${year}-${month}-${day}/${hours}:${minutes}:${seconds}/`;

    const contenu = typeof texte === "string" ? texte : JSON.stringify(texte);
    const ligne = `${ts} ${contenu}`;

    if (!cont) {
      console.log(ligne);
      return;
    }

    const p = document.createElement("p");
    p.textContent = ligne;
    cont.appendChild(p);
  }

  function majEtatDepuisInfo(info, adresse) {
    const zone = document.getElementById("etat-content");
    if (!zone) return;

    const lignes = zone.querySelectorAll("p");
    if (lignes.length < 4) return;

    lignes[0].innerHTML = `<strong>Adresse :</strong> ${adresse || ""}`;
    lignes[1].innerHTML = `<strong>Statut :</strong> ${info?.state || ""}`;
    lignes[2].innerHTML = `<strong>Actif depuis :</strong> ${info?.lastRestart || ""}`;
    lignes[3].innerHTML = `<strong>Réinitialisé :</strong> ${info?.lastReinit || ""}`;
  }

  function lireCodeEtAdresseDepuisPage() {
    const idInput = document.getElementById("input-code-permanent-top");
    const selectAdresse = document.getElementById("select-adresse-decodeur");

    const id = idInput?.value?.trim() || "";
    const address = selectAdresse?.value || "";

    return { id, address };
  }

  async function boutonAfficherClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) {
      msg("Code permanent ou adresse manquant");
      return;
    }

    msg(`Demande d'information pour ${address} (id=${id})`);

    try {
      const info = await getDecoderInfo(id, address);
      msg(info);
      majEtatDepuisInfo(info, address);
    } catch (e) {
      msg("Erreur info: " + e.message);
    }
  }

  async function boutonResetClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) {
      msg("Code permanent ou adresse manquant");
      return;
    }

    msg(`Reset du décodeur ${address}`);

    try {
      const res = await resetDecoder(id, address);
      msg(res);

      // Après un reset, on attend que le décodeur redevienne "Active"
      msg("Attente que le décodeur redevienne actif...");
      const intervalMs = 5000; // 5 secondes
      const timeoutMs = 60000; // 60 secondes max
      const debut = Date.now();

      while (true) {
        if (Date.now() - debut > timeoutMs) {
          msg("Timeout: le décodeur n'est pas redevenu actif dans le délai prévu.");
          break;
        }

        await new Promise(r => setTimeout(r, intervalMs));

        try {
          const info = await getDecoderInfo(id, address);
          msg(info);
          majEtatDepuisInfo(info, address);

          if (info.state && info.state.toLowerCase() === "active") {
            msg("Le décodeur est maintenant actif.");
            break;
          }
        } catch (err) {
          msg("Erreur lors du polling info: " + err.message);
        }
      }
    } catch (e) {
      msg("Erreur reset: " + e.message);
    }
  }

  async function boutonReinitClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) {
      msg("Code permanent ou adresse manquant");
      return;
    }

    msg(`Réinitialisation du décodeur ${address}`);

    try {
      const res = await reinitDecoder(id, address);
      msg(res);

      // Après reinit, on refait un appel info pour rafraîchir l'état
      try {
        const info = await getDecoderInfo(id, address);
        msg(info);
        majEtatDepuisInfo(info, address);
      } catch (err) {
        msg("Erreur info après reinit: " + err.message);
      }
    } catch (e) {
      msg("Erreur reinit: " + e.message);
    }
  }

  async function boutonShutdownClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) {
      msg("Code permanent ou adresse manquant");
      return;
    }

    msg(`Extinction du décodeur ${address}`);

    try {
      const res = await shutdownDecoder(id, address);
      msg(res);

      // Après extinction, on refait un appel info pour afficher le nouvel état
      try {
        const info = await getDecoderInfo(id, address);
        msg(info);
        majEtatDepuisInfo(info, address);
      } catch (err) {
        msg("Erreur info après extinction: " + err.message);
      }
    } catch (e) {
      msg("Erreur shutdown: " + e.message);
    }
  }

  function initialiserUI() {
    const btnAfficher = document.getElementById("btn-afficher-decodeur");
    const actions = document.querySelector("#etat #actions-content");
    if (!actions) return;

    const [btnReset, btnReinit, btnShutdown] = actions.querySelectorAll("button");

    if (btnAfficher) btnAfficher.addEventListener("click", boutonAfficherClique);
    if (btnReset) btnReset.addEventListener("click", boutonResetClique);
    if (btnReinit) btnReinit.addEventListener("click", boutonReinitClique);
    if (btnShutdown) btnShutdown.addEventListener("click", boutonShutdownClique);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserUI);
  } else {
    initialiserUI();
  }

  window.DecodeurAPI = {
    getDecoderInfo,
    resetDecoder,
    reinitDecoder,
    shutdownDecoder,
    getAllDecodersInfo
  };
})();