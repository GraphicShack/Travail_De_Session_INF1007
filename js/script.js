(function () {
const BASE_URL = "http://localhost:3000/api/decoder";
  const DECODER_ADDRESSES = Array.from({ length: 12 }, (_, i) => `127.0.10.${i + 1}`);
  const ACTIONS = ["info", "reset", "reinit", "shutdown"];

  // Cette fonction vérifie que l'adresse IP du décodeur est valide en la comparant à une liste d'adresses autorisées. Cela permet d'éviter des appels à l'API avec des adresses non reconnues qui pourraient entraîner des erreurs côté serveur.
  function isValidDecoderIp(ip) {
    return DECODER_ADDRESSES.includes(ip);
  }

  // Cette fonction vérifie que l'action demandée est valide en la comparant à une liste d'actions autorisées. Cela permet d'éviter des appels à l'API avec des actions non reconnues qui pourraient entraîner des erreurs côté serveur.
  function isValidAction(action) {
    return ACTIONS.includes(action);
  }

  // Cette fonction envoie une requête à l'API pour effectuer une action sur un décodeur spécifique. Elle prend en paramètre le code permanent de l'utilisateur, l'adresse du décodeur et l'action à effectuer. Elle vérifie d'abord que les paramètres sont valides avant de faire la requête pour éviter des appels inutiles à l'API et des erreurs côté serveur. Ensuite, elle traite la réponse de l'API et gère les erreurs éventuelles.
  async function decoderRequest(id, address, action) {
    if (!id) {
      throw new Error("Code permanent manquant.");
    }

    // On vérifie que l'adresse IP du décodeur est valide avant de faire la requête pour éviter de faire des appels inutiles à l'API et d'avoir des erreurs côté serveur
    if (!isValidDecoderIp(address)) {
      throw new Error("Adresse IP invalide. Utilise une adresse entre 127.0.10.1 et 127.0.10.12.");
    }

    // On vérifie que l'action est valide avant de faire la requête pour éviter de faire des appels inutiles à l'API et d'avoir des erreurs côté serveur
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

  // Cette fonction envoie une requête pour récupérer les informations du décodeur à l'adresse spécifiée. Elle utilise la fonction decoderRequest avec l'action "info" pour effectuer cette opération.
  async function getDecoderInfo(id, address) {
    return await decoderRequest(id, address, "info");
  }

  // Cette fonction envoie une requête pour réinitialiser le décodeur à l'adresse spécifiée. Elle utilise la fonction decoderRequest avec l'action "reset" pour effectuer cette opération.
  async function resetDecoder(id, address) {
    return await decoderRequest(id, address, "reset");
  }

  // Cette fonction envoie une requête pour réinitialiser le décodeur à l'adresse spécifiée. Elle utilise la fonction decoderRequest avec l'action "reinit" pour effectuer cette opération.
  async function reinitDecoder(id, address) {
    return await decoderRequest(id, address, "reinit");
  }

  // Cette fonction envoie une requête pour éteindre le décodeur à l'adresse spécifiée. Elle utilise la fonction decoderRequest avec l'action "shutdown" pour effectuer cette opération.
  async function shutdownDecoder(id, address) {
    return await decoderRequest(id, address, "shutdown");
  }

  // Cette fonction permet de récupérer les informations de tous les décodeurs en faisant une requête pour chaque adresse. Elle utilise la fonction getDecoderInfo pour chaque adresse et collecte les résultats dans un tableau. Si une requête échoue, elle ajoute une entrée avec l'erreur correspondante pour ne pas perdre les informations sur les autres décodeurs.
  async function getAllDecodersInfo(id) {
    const results = [];

    // On fait une requête pour chaque adresse de décodeur et on collecte les résultats dans un tableau. Si une requête échoue, on ajoute une entrée avec l'erreur correspondante pour ne pas perdre les informations sur les autres décodeurs.
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

  // Cette fonction affiche un message dans la section "Messages" de la page. Elle ajoute un timestamp à chaque message pour faciliter le suivi des événements. Si le conteneur n'existe pas, elle log le message dans la console pour éviter de perdre les informations.
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

    // Si le conteneur n'existe pas, on log dans la console pour éviter de perdre les messages
    if (!cont) {
      console.log(ligne);
      return;
    }

    const p = document.createElement("p");
    p.textContent = ligne;
    cont.appendChild(p);
  }

  // Cette fonction met à jour la section "État du décodeur" avec les informations récupérées depuis l'API. Elle prend en paramètre l'objet info retourné par l'API et l'adresse du décodeur pour afficher les informations de manière claire.
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

  // Cette fonction lit le code permanent et l'adresse du décodeur depuis les éléments de la page. Elle est utilisée par les différents boutons pour récupérer les informations nécessaires avant de faire les appels à l'API.
  function lireCodeEtAdresseDepuisPage() {
    const idInput = document.getElementById("input-code-permanent-top");
    const selectAdresse = document.getElementById("select-adresse-decodeur");

    const id = idInput?.value?.trim() || "";
    const address = selectAdresse?.value || "";

    return { id, address };
  }

  // Le bouton d'affichage est celui qui est présent dans le dashboard, il permet d'afficher les informations du décodeur sélectionné. Il lit le code permanent et l'adresse du décodeur depuis la page, puis fait un appel à l'API pour récupérer les informations et les afficher dans la section "État du décodeur".
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

  // Le bouton de reset est similaire au bouton d'affichage, mais après le reset, on attend que le décodeur redevienne "Active" avant de faire un nouvel appel info pour rafraîchir l'état
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

  // Le bouton de réinitialisation est similaire au reset, mais on attend que le décodeur redevienne "Active" après la réinitialisation
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

      // Après reinit, on attend que le décodeur redevienne "Active"
      msg("Attente que le décodeur redevienne actif...");

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

  // Le bouton shutdown est similaire au reset, mais on attend que le décodeur devienne "Inactive" après l'appel shutdown
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

  // Fonction d'initialisation pour attacher les événements aux boutons
  function initialiserUI() {
    const btnAfficher = document.getElementById("btn-afficher-decodeur");
    const actions = document.querySelector("#etat #actions-content");
    if (!actions) return;

    // On suppose que les boutons reset, reinit et shutdown sont dans le même conteneur, donc on les sélectionne tous en même temps
    const [btnReset, btnReinit, btnShutdown] = actions.querySelectorAll("button");

    // On attache les événements aux boutons
    //Bouton afficher est dans le dashboard, les autres sont dans la page de gestion des décodeurs, donc on vérifie leur existence avant d'attacher les événements
    if (btnAfficher) btnAfficher.addEventListener("click", boutonAfficherClique);
    // Bouton reset, reinit et shutdown sont dans la page de gestion des décodeurs, donc on vérifie leur existence avant d'attacher les événements
    if (btnReset) btnReset.addEventListener("click", boutonResetClique);
    // Bouton reinit et shutdown sont dans la page de gestion des décodeurs, donc on vérifie leur existence avant d'attacher les événements
    if (btnReinit) btnReinit.addEventListener("click", boutonReinitClique);
    // Bouton shutdown est dans la page de gestion des décodeurs, donc on vérifie son existence avant d'attacher l'événement
    if (btnShutdown) btnShutdown.addEventListener("click", boutonShutdownClique);
  }

  // On attend que le DOM soit prêt avant d'initialiser les éléments de l'interface
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserUI);
  } else {
    // Le DOM est déjà prêt
    initialiserUI();
  }

  // Differentes fonctions sont exposées globalement pour pouvoir être utilisées dans la console du navigateur
  window.DecodeurAPI = {
    getDecoderInfo,
    resetDecoder,
    reinitDecoder,
    shutdownDecoder,
    getAllDecodersInfo
  };
})();