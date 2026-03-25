// ==========================
// API Décodeur + Interface décodeur
// ==========================
// Constantes API
const BASE_URL = "http://localhost:3000/api/decoder";
const API_URL = "http://localhost:3000/api";
const DECODER_ADDRESSES = Array.from({ length: 12 }, (_, i) => `127.0.10.${i + 1}`);
const ACTIONS = ["info", "reset", "reinit", "shutdown"];

// API bas niveau
function isValidDecoderIp(ip) {
    return DECODER_ADDRESSES.includes(ip);
}

function isValidAction(action) {
    return ACTIONS.includes(action);
}

async function decoderRequest(id, address, action) {
    if (!id) throw new Error("Code permanent manquant.");
    if (!isValidDecoderIp(address)) throw new Error("Adresse IP invalide.");
    if (!isValidAction(action)) throw new Error("Action invalide.");

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, address, action }),
    });

    const text = await response.text();
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status} - ${text}`);

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Réponse du serveur invalide.");
    }
    if (data.response !== "OK") throw new Error(data.message || "Erreur serveur");

    return data;
}

async function getDecoderInfo(id, address) {
    return decoderRequest(id, address, "info");
}
async function resetDecoder(id, address) {
    return decoderRequest(id, address, "reset");
}
async function reinitDecoder(id, address) {
    return decoderRequest(id, address, "reinit");
}
async function shutdownDecoder(id, address) {
    return decoderRequest(id, address, "shutdown");
}

async function getAllDecodersInfo(id) {
    const results = [];
    for (const address of DECODER_ADDRESSES) {
        try {
            results.push({ address, ...(await getDecoderInfo(id, address)) });
        } catch (e) {
            results.push({ address, response: "Error", message: e.message });
        }
    }
    return results;
}
// ==========================
// Interface décodeur (GestionDecodeur + decodeur.html)
// ==========================
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
    const idFromGlobal = window.currentDecoderId;
    const addrFromGlobal = window.currentDecoderAddress;
    if (idFromGlobal && addrFromGlobal) {
        return { id: idFromGlobal, address: addrFromGlobal };
    }
    const idInput = document.getElementById("input-code-permanent-top");
    const selectAdresse = document.getElementById("select-adresse-decodeur");
    return { id: idInput?.value?.trim() || "", address: selectAdresse?.value || "" };
}

async function boutonAfficherClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant", "error");
    msg(`Demande d'information pour ${address} (id=${id})`, "info");
    try {
        const info = await getDecoderInfo(id, address);
        msg(info, "success");
        majEtatDepuisInfo(info, address);
    } catch (e) {
        msg("Erreur info: " + e.message, "error");
    }
}

async function boutonResetClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant", "error");
    msg(`Reset du décodeur ${address}`, "warning");
    try {
        try {
            const info = await getDecoderInfo(id, address);
            msg(info, "success");
            majEtatDepuisInfo(info, address);
        } catch (err) {
            msg("Erreur info initiale: " + err.message, "debug");
        }
        const res = await resetDecoder(id, address);
        msg(res, "success");
        msg("Attente que le décodeur redevienne actif...", "debug");
        const intervalMs = 5000,
            timeoutMs = 60000,
            debut = Date.now();
        while (true) {
            if (Date.now() - debut > timeoutMs) {
                msg("Timeout: le décodeur n'est pas redevenu actif.", "error");
                break;
            }
            await new Promise((r) => setTimeout(r, intervalMs));
            try {
                const info = await getDecoderInfo(id, address);
                if (info.state === "active") {
                    msg("Le décodeur est redevenu actif !", "success");
                    msg(info, "success");
                    majEtatDepuisInfo(info, address);
                    break;
                }
            } catch (err) {
                msg("Erreur polling info: " + err.message, "debug");
            }
        }
    } catch (e) {
        msg("Erreur reset: " + e.message, "error");
    }
}

async function boutonReinitClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant", "error");
    msg(`Réinitialisation du décodeur ${address}`, "warning");
    try {
        const res = await reinitDecoder(id, address);
        msg(res, "success");
        const info = await getDecoderInfo(id, address);
        msg(info, "success");
        majEtatDepuisInfo(info, address);
    } catch (e) {
        msg("Erreur reinit: " + e.message, "error");
    }
}

async function boutonShutdownClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant", "error");
    msg(`Extinction du décodeur ${address}`, "warning");
    try {
        const res = await shutdownDecoder(id, address);
        msg(res, "success");
        const info = await getDecoderInfo(id, address);
        msg(info, "success");
        majEtatDepuisInfo(info, address);
    } catch (e) {
        msg("Erreur shutdown: " + e.message, "error");
    }
}

// ==========================
// Gestion des chaînes par décodeur (stockage côté serveur, partagé)
// ==========================

// Facultatif: garder une copie locale pour éviter un flash si l'API est lente
function getDecoderKeyForChains(id, address) {
    return `chains_${id}_${address}`;
}

function lireChainesLocales(id, address) {
    const key = getDecoderKeyForChains(id, address);
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function sauvegarderChainesLocales(id, address, chaines) {
    const key = getDecoderKeyForChains(id, address);
    try {
        localStorage.setItem(key, JSON.stringify(chaines));
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des chaînes dans localStorage", e);
    }
}

// Lecture / écriture des chaînes via l'API serveur (chaines.json partagé)
async function lireChainesServeur(id, address) {
    const url = new URL(`${API_URL}/chaines`);
    url.searchParams.set("id", id);
    url.searchParams.set("address", address);
    const resp = await fetch(url.toString());
    if (!resp.ok) {
        throw new Error("Erreur de lecture des chaînes sur le serveur");
    }
    const data = await resp.json();
    return Array.isArray(data.chaines) ? data.chaines : [];
}

async function sauvegarderChainesServeur(id, address, chaines) {
    const resp = await fetch(`${API_URL}/chaines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, address, chaines })
    });
    const data = await resp.json();
    if (!resp.ok) {
        throw new Error(data.message || "Erreur de sauvegarde des chaînes sur le serveur");
    }
    return Array.isArray(data.chaines) ? data.chaines : chaines;
}

async function rafraichirAffichageChaines(id, address) {
    const cont = document.getElementById("chaines-list");
    if (!cont) return;
    cont.innerHTML = "";
    // On essaie d'abord de lire depuis le serveur
    let chaines;
    try {
        chaines = await lireChainesServeur(id, address);
        sauvegarderChainesLocales(id, address, chaines);
    } catch (e) {
        console.error(e);
        // fallback sur la copie locale si le serveur ne répond pas
        chaines = lireChainesLocales(id, address);
    }
    if (!chaines.length) {
        const empty = document.createElement("p");
        empty.textContent = "Aucune chaîne configurée pour ce décodeur.";
        cont.appendChild(empty);
        return;
    }
    const btnRemove = document.getElementById("btn-supprimer-chaine");
    if (btnRemove) {
        btnRemove.disabled = true;
        // tableau de chaînes sélectionnées
        window.__chainesSelectionnees = [];
    }

    chaines.forEach((ch) => {
        const row = document.createElement("div");
        row.className = "chaine-row";

        const label = document.createElement("span");
        label.textContent = ch;

        row.addEventListener("click", () => {
            const list = window.__chainesSelectionnees || [];
            const currentlySelected = row.classList.contains("selected");

            if (currentlySelected) {
                // On désélectionne cette carte uniquement
                row.classList.remove("selected");
                const idx = list.indexOf(ch);
                if (idx !== -1) list.splice(idx, 1);
            } else {
                // On ajoute cette carte à la sélection
                row.classList.add("selected");
                if (!list.includes(ch)) list.push(ch);
            }

            window.__chainesSelectionnees = list;

            if (btnRemove) {
                btnRemove.disabled = list.length === 0;
            }
        });

        row.appendChild(label);
        cont.appendChild(row);
    });
}

async function ajouterChainePourDecodeur(chaine) {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant pour gérer les chaînes", "error");
    if (!chaine) return msg("Nom de chaîne manquant", "error");

    let chaines = lireChainesLocales(id, address);
    if (chaines.includes(chaine)) {
        msg(`La chaîne "${chaine}" est déjà associée au décodeur ${address}`, "warning");
        return;
    }
    chaines.push(chaine);
    // Sauvegarde d'abord sur le serveur (source de vérité partagée)
    try {
        chaines = await sauvegarderChainesServeur(id, address, chaines);
    } catch (e) {
        msg("Erreur lors de la sauvegarde des chaînes sur le serveur: " + e.message, "error");
    }
    sauvegarderChainesLocales(id, address, chaines);
    await rafraichirAffichageChaines(id, address);
    msg(`Chaîne "${chaine}" ajoutée au décodeur ${address}`, "success");
}

async function supprimerChainePourDecodeur(chaine) {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant pour gérer les chaînes", "error");
    if (!chaine) return msg("Nom de chaîne manquant", "error");

    let chaines = lireChainesLocales(id, address);
    const idx = chaines.indexOf(chaine);
    if (idx === -1) {
        msg(`La chaîne "${chaine}" n'est pas associée au décodeur ${address}`, "warning");
        return;
    }
    chaines.splice(idx, 1);
    try {
        chaines = await sauvegarderChainesServeur(id, address, chaines);
    } catch (e) {
        msg("Erreur lors de la sauvegarde des chaînes sur le serveur: " + e.message, "error");
    }
    sauvegarderChainesLocales(id, address, chaines);
    await rafraichirAffichageChaines(id, address);
    msg(`Chaîne "${chaine}" supprimée du décodeur ${address}`, "success");
}

async function supprimerChaineSelectionnee() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    const list = window.__chainesSelectionnees || [];
    if (!id || !address) return msg("Code permanent ou adresse manquant pour gérer les chaînes", "error");
    if (!list.length) return; // Rien de sélectionné

    for (const ch of list) {
        await supprimerChainePourDecodeur(ch);
    }

    window.__chainesSelectionnees = [];
}

function msg(texte, type = "info") {
    const cont = document.getElementById("messages-content");
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}/${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}/`;
    const contenu = typeof texte === "string" ? texte : JSON.stringify(texte);

    let color;
    switch (type) {
        case "success":
            color = "green";
            break;
        case "error":
            color = "red";
            break;
        case "warning":
            color = "orange";
            break;
        case "debug":
            color = "blue";
            break;
        default:
            color = "black";
    }

    const ligne = document.createElement("p");
    ligne.textContent = `${ts} ${contenu}`;
    ligne.style.color = color;

    if (cont) cont.appendChild(ligne);
    else console.log(`${ts} ${contenu}`);
}

// Exposition globale pour les autres scripts
window.DecodeurAPI = { getDecoderInfo, resetDecoder, reinitDecoder, shutdownDecoder, getAllDecodersInfo };
window.DecodeurUI = { boutonAfficherClique, boutonResetClique, boutonReinitClique, boutonShutdownClique, ajouterChainePourDecodeur, supprimerChainePourDecodeur, supprimerChaineSelectionnee };
