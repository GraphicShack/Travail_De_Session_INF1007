// ==========================
// Constantes et configurations
// ==========================
const BASE_URL = "http://localhost:3000/api/decoder";
const API_URL = "http://localhost:3000/api";
const DECODER_ADDRESSES = Array.from({ length: 12 }, (_, i) => `127.0.10.${i + 1}`);
const ACTIONS = ["info", "reset", "reinit", "shutdown"];

// ==========================
// Gestion utilisateur
// ==========================

// Fonctions de gestion de l'utilisateur dans le localStorage
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

// Fonction pour stocker l'utilisateur dans le localStorage
function setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}
function setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem("user");
    window.location.href = "/pages/signin.html";
}
function logout() {
    localStorage.removeItem("user");
    window.location.href = "/pages/signin.html";
}

// ==========================
// Bouton de déconnexion
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const user = getUser();
    const path = window.location.pathname;
    const user = getUser();
    const path = window.location.pathname;

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée, rediriger vers signin
    if (!user && !path.endsWith("/signin.html") && !path.endsWith("/signup.html")) {
        alert("Accès refusé : veuillez vous connecter.");
        window.location.href = "/pages/signin.html";
        // Si l'utilisateur est connecté et essaie d'accéder à signin ou signup, rediriger vers dashboard
    } else if (user && (path.endsWith("/signin.html") || path.endsWith("/signup.html"))) {
        window.location.href = "/pages/dashboard.html";
        // Si l'utilisateur est connecté mais n'est pas admin et essaie d'accéder à admin.html, rediriger vers signin
    } else if (user && path.endsWith("/admin.html") && user.role !== "admin") {
        alert("Accès refusé : page réservée aux administrateurs.");
        window.location.href = "/pages/signin.html";
    }
    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée, rediriger vers signin
    if (!user && !path.endsWith("/signin.html") && !path.endsWith("/signup.html")) {
        alert("Accès refusé : veuillez vous connecter.");
        window.location.href = "/pages/signin.html";
        // Si l'utilisateur est connecté et essaie d'accéder à signin ou signup, rediriger vers dashboard
    } else if (user && (path.endsWith("/signin.html") || path.endsWith("/signup.html"))) {
        window.location.href = "/pages/dashboard.html";
        // Si l'utilisateur est connecté mais n'est pas admin et essaie d'accéder à admin.html, rediriger vers signin
    } else if (user && path.endsWith("/admin.html") && user.role !== "admin") {
        alert("Accès refusé : page réservée aux administrateurs.");
        window.location.href = "/pages/signin.html";
    }
});

// ==========================
// API Décodeur : appels via backend (vérifier si notre server node run avant)
// ==========================

// Validation de l'adresse IP du décodeur 
function isValidDecoderIp(ip) {
    return DECODER_ADDRESSES.includes(ip);
}

// Validation de l'action
function isValidAction(action) {
    return ACTIONS.includes(action);
}
function isValidAction(action) {
    return ACTIONS.includes(action);
}

// Fonction générique qui envoie une action (info / reset / reinit / shutdown)
async function decoderRequest(id, address, action) {
    // Validation des entrées
    if (!id) throw new Error("Code permanent manquant.");
    if (!isValidDecoderIp(address)) throw new Error("Adresse IP invalide.");
    if (!isValidAction(action)) throw new Error("Action invalide.");
    // Validation des entrées
    if (!id) throw new Error("Code permanent manquant.");
    if (!isValidDecoderIp(address)) throw new Error("Adresse IP invalide.");
    if (!isValidAction(action)) throw new Error("Action invalide.");

    // Requête vers le serveur
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, address, action }),
    });
    // Requête vers le serveur
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, address, action }),
    });

    // Gestion des erreurs
    const text = await response.text();
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status} - ${text}`);

    // Parsing de la réponse JSON et gestion des erreurs métier
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Réponse du serveur invalide.");
    }
    if (data.response !== "OK") throw new Error(data.message || "Erreur serveur");

    // Retour des données
    return data;
    // Retour des données
    return data;
}

// Fonctions spécifiques pour chaque action (qui appellent la fonction générique)
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

// Fonction infos
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
// Fonctions d'interface 
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
    const zone = document.getElementById("etat-content");
    if (!zone) return;
    const lignes = zone.querySelectorAll("p");
    if (lignes.length < 4) return;
    lignes[0].innerHTML = `<strong>Adresse :</strong> ${adresse || ""}`;
    lignes[1].innerHTML = `<strong>Statut :</strong> ${info?.state || ""}`;
    lignes[2].innerHTML = `<strong>Actif depuis :</strong> ${info?.lastRestart || ""}`;
    lignes[3].innerHTML = `<strong>Réinitialisé :</strong> ${info?.lastReinit || ""}`;
}

// Fonction pour lire le code permanent et l'adresse depuis la page
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

// ==========================
// Boutons page Décodeurs 
// ==========================
// Bouton "Afficher" 
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

// Fonction avec polling
async function boutonResetClique() {
    const { id, address } = lireCodeEtAdresseDepuisPage();
    if (!id || !address) return msg("Code permanent ou adresse manquant", "error");
    msg(`Reset du décodeur ${address}`, "warning");
    try {
        // Afficher les infos dans la page 
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
                // on vérifie si le décodeur est rendu actif ou nope
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

// Bouton "Réinitialiser" le décodeur
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

// Bouton "Éteindre" le décodeur
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
// Fonction pour mettre les messages des logs des decodeurs en couleur
function msg(texte, type = "info") {
    const cont = document.getElementById("messages-content");
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}/${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}/`;
    const contenu = typeof texte === "string" ? texte : JSON.stringify(texte);
    const cont = document.getElementById("messages-content");
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}/${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}/`;
    const contenu = typeof texte === "string" ? texte : JSON.stringify(texte);

    // Définir la couleur selon le type
    let color;
    switch (type) {
        // Les types possibles sont : success, error, warning, debug, info
        // Cas Vert : succès de l'action
        case "success":
            color = "green";
            break;
        // Cas Rouge : erreur lors de l'action
        case "error":
            color = "red";
            break;
        // Cas Orange : action en cours ou avertissement
        case "warning":
            color = "orange";
            break;
        // Cas Bleu : messages de debug ou d'information détaillée
        case "debug":
            color = "blue";
            break;
        // Cas Noir : messages d'information généraux ou autres
        default:
            color = "black"; // info ou autres
    }
    // Définir la couleur selon le type
    let color;
    switch (type) {
        // Les types possibles sont : success, error, warning, debug, info
        // Cas Vert : succès de l'action
        case "success":
            color = "green";
            break;
        // Cas Rouge : erreur lors de l'action
        case "error":
            color = "red";
            break;
        // Cas Orange : action en cours ou avertissement
        case "warning":
            color = "orange";
            break;
        // Cas Bleu : messages de debug ou d'information détaillée
        case "debug":
            color = "blue";
            break;
        // Cas Noir : messages d'information généraux ou autres
        default:
            color = "black"; // info ou autres
    }

    const ligne = document.createElement("p");
    ligne.textContent = `${ts} ${contenu}`;
    ligne.style.color = color;
    const ligne = document.createElement("p");
    ligne.textContent = `${ts} ${contenu}`;
    ligne.style.color = color;

    if (cont) cont.appendChild(ligne);
    else console.log(`${ts} ${contenu}`);
    if (cont) cont.appendChild(ligne);
    else console.log(`${ts} ${contenu}`);
}

// ==========================
// Signin / Signup
// ==========================

//Validation des champs de formulaire

// Validation de l'email avec une regex simple
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Vérification auprès du serveur si l'email existe déjà
function validateEmailAlreadyExists(email) {
    return fetch(`${API_URL}/check-email?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => data.exists)
        .then((res) => res.json())
        .then((data) => data.exists)
        .catch(() => false);
}

// Validation du mot de passe (au moins 8 caractères et une majuscule)
function validatePassword(pwd) {
    return /^(?=.*[A-Z]).{8,}$/.test(pwd);
}

function hachageMotDePasse(motDePasse) {
    // Implémentation d'un hachage simple (à ne pas utiliser en production)
    let hash = 0;
    for (let i = 0; i < motDePasse.length; i++) {
        const char = motDePasse.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// Fonction d'inscription
async function signup() {
    // Récupération des valeurs des champs et validation
    // Récupération des valeurs des champs et validation
    const nom = document.getElementById("nom")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const motDePasse = document.getElementById("motdepasse")?.value.trim();
    const confirmPwd = document.getElementById("confirm-motdepasse")?.value.trim();
    const messageEl = document.getElementById("signup-message");

    // Réinitialisation du message d'erreur
    messageEl.textContent = "";
    messageEl.className = "";

    // Validation des champs
    if (!nom || !email || !motDePasse || !confirmPwd) {
        messageEl.textContent = "Remplis tous les champs";
        messageEl.className = "error";
        return;
    }
    // Validation de l'email
    if (!validateEmail(email)) {
        messageEl.textContent = "Email invalide";
        messageEl.className = "error";
        return;
    }
    // Vérification si l'email existe déjà
    if (await validateEmailAlreadyExists(email)) {
        messageEl.textContent = "Email déjà utilisé";
        messageEl.className = "error";
        return;
    }
    // Validation du mot de passe
    if (!validatePassword(motDePasse)) {
        messageEl.textContent = "Mot de passe doit avoir au moins 8 caractères et une majuscule";
        messageEl.className = "error";
        return;
    }
    // Validation de la confirmation du mot de passe
    if (motDePasse !== confirmPwd) {
        messageEl.textContent = "Les mots de passe ne correspondent pas";
        messageEl.className = "error";
        return;
    }
    }
    // Hachage du mot de passe avant l'envoi
    const hashedPwd = hachageMotDePasse(motDePasse);
    // Envoi de la requête d'inscription au serveur
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom, email, motDePasse: hashedPwd }),
            body: JSON.stringify({ nom, email, motDePasse: hashedPwd }),
        });
        const data = await res.json();
        if (!res.ok) {
            messageEl.textContent = data.message || "Erreur serveur";
            messageEl.className = "error";
            return;
        }
        // Stockage de l'utilisateur et redirection vers le dashboard
        setUser(data.user);
        messageEl.textContent = "Inscription réussie, redirection...";
        messageEl.className = "success";
        setTimeout(() => (window.location.href = "/pages/dashboard.html"), 1000);
        setTimeout(() => (window.location.href = "/pages/dashboard.html"), 1000);
    } catch (err) {
        messageEl.textContent = "Erreur serveur";
        messageEl.className = "error";
    }
}

// Login
// Login
async function signin() {
    const email = document.getElementById("email")?.value.trim();
    const motDePasse = document.getElementById("motdepasse")?.value.trim();
    const messageEl = document.getElementById("login-message");

    // Réinitialisation du message d'erreur
    messageEl.textContent = "";
    messageEl.className = "";
    if (!email || !motDePasse) {
        messageEl.textContent = "Remplis tous les champs";
        messageEl.className = "error";
        return;
    }
    // Hachage du mot de passe avant l'envoi (pour correspondre à ce qui est stocké côté serveur)
    const hashedPwd = hachageMotDePasse(motDePasse);

    // Envoi de la requête de connexion au serveur
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, motDePasse: hashedPwd }),
            body: JSON.stringify({ email, motDePasse: hashedPwd }),
        });
        const data = await res.json();
        if (!res.ok) {
            messageEl.textContent = data.message || "Erreur serveur";
            messageEl.className = "error";
            return;
        }
        // Stockage de l'utilisateur et redirection vers le dashboard
        setUser(data.user);
        messageEl.textContent = "Connexion réussie, redirection...";
        messageEl.className = "success";
        setTimeout(() => (window.location.href = "/pages/dashboard.html"), 1000);
        setTimeout(() => (window.location.href = "/pages/dashboard.html"), 1000);
    } catch (err) {
        messageEl.textContent = "Erreur serveur";
        messageEl.className = "error";
    }
}

// ==========================
// Admin
// ==========================

// Affichage des clients
async function displayClients() {
    const div = document.getElementById("listeUtilisateurs");
    const messageEl = document.getElementById("admin-message");
    if (!div) return;
    try {
        const clients = await getClients();
        for (const client of clients) {
            div.append(createClientLine(client));
            div.append(document.createElement("hr"));
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage des clients:", error);
        messageEl.textContent = "Erreur serveur";
        messageEl.className = "error";
    }
}

// Récupération de la liste des utilisateurs (pour la page admin)
async function getClients() {
    try {
        const res = await fetch(`${API_URL}/clients`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        return data || null;
    } catch (error) {
        console.error("Erreur lors de la récupération des clients:", error);
        return null;
    }
}

//Affichage des données d'un client
function createClientLine(client) {
    const line = document.createElement("div");
    line.className = "client-line";

		const buttonEdit = document.createElement("button");
		buttonEdit.textContent = "Modifier";
		buttonEdit.onclick = () => editClient(client.id);

		const buttonDelete = document.createElement("button");
    buttonDelete.textContent = "Supprimer";
    buttonDelete.onclick = () => deleteClient(client.id);

    line.innerHTML = `<div>ID: ${client.id}</div><div>Nom: ${client.nom}</div><div>Email: ${client.email}</div>`;
    line.appendChild(buttonEdit);
    line.appendChild(buttonDelete);
    return line;
}

//Suppresion d'un client
async function deleteClient(id) {
    try {
        const messageEl = document.getElementById("admin-message");
				const confirmation = confirm("Êtes-vous sûr de vouloir supprimer ce client ?");
				if (!confirmation) return;
				const res = await fetch(`${API_URL}/clients/${id}`, {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
				});
				const data = await res.json();
        if (!res.ok) {
            messageEl.textContent = data.message || "Erreur serveur";
            messageEl.className = "error";
            return;
        }
				messageEl.textContent = "Client supprimé avec succès";
        messageEl.className = "success";
    } catch (error) {
        messageEl.textContent = "Erreur serveur";
        messageEl.className = "error";
    }
}

//Modification d'un client
async function editClient(id) {}

// ==========================
// Dashboard / UI 
// ==========================

// Affiche "Connecté en tant que ..." dans le header du dashboard
function displayUserInfo() {
    const user = getUser();
    const el = document.getElementById("user-info");
    if (!el) return;
    el.innerHTML = user ? `Connecté en tant que <strong>${user.nom}</strong>` : "Non connecté";
    const user = getUser();
    const el = document.getElementById("user-info");
    if (!el) return;
    el.innerHTML = user ? `Connecté en tant que <strong>${user.nom}</strong>` : "Non connecté";
}

// Affiche un petit résumé sous le nom d'utilisateur (fac nbr de décodeur/actifs/inactifs)
async function displayUserSummary() {
    const user = getUser();
    const el = document.getElementById("user-info");
    if (!el || !user) return;

    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        const fullUser = users.find((u) => u.email === user.email);
        const codePermanent = fullUser?.codePermanent || user.codePermanent || null;
        const decoders = fullUser?.decodeurs || [];

        if (!codePermanent || !decoders.length) {
            el.innerHTML = `Connecté en tant que <strong>${user.nom}</strong><br><small>Aucun décodeur associé à votre compte.</small>`;
            return;
        }

        // Récupérer l'état de chaque décodeur (peux être optimisé maybe, actuellement en parallèle)
        const infoList = await Promise.all(
            decoders.map(async (address) => {
                try {
                    const info = await getDecoderInfo(codePermanent, address);
                    return info;
                } catch {
                    return null;
                }
            })
        );

        const total = decoders.length;
        const actifs = infoList.filter(
            (info) => info && info.state && ["actif", "active"].includes(String(info.state).toLowerCase())
        ).length;
        const inactifs = total - actifs;

        el.innerHTML = `Connecté en tant que <strong>${user.nom}</strong><br>` +
            `<small>${total} décodeur${total > 1 ? "s" : ""} associé${total > 1 ? "s" : ""} — ` +
            `${actifs} actif${actifs > 1 ? "s" : ""}, ${inactifs} inactif${inactifs > 1 ? "s" : ""}</small>`;
    } catch (e) {
        console.error("Erreur lors de l'affichage du résumé utilisateur:", e);
        el.innerHTML = `Connecté en tant que <strong>${user.nom}</strong>`;
    }
}

// Affiche une carte par décodeur associé à l'utilisateur connecté
async function displayUserDecoders() {
    const container = document.getElementById("user-decoders");
    if (!container) return;

    container.innerHTML = "";

    const current = getUser();
    if (!current) {
        container.innerHTML = "<p>Utilisateur non connecté.</p>";
        return;
    }

    try {
    // 1) Récupérer les utilisateurs depuis le backend (users.json)
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();

        // 2) Trouver l'utilisateur complet pour avoir codePermanent + decodeurs
        const fullUser = users.find((u) => u.email === current.email);
        const codePermanent = fullUser?.codePermanent || current.codePermanent || null;
        const decoders = fullUser?.decodeurs || [];

        if (!codePermanent || !decoders.length) {
            container.innerHTML = "<p>Aucun décodeur associé à votre compte.</p>";
            return;
        }
        for (let i = 0; i < decoders.length; i++) {
            const address = decoders[i];

            const card = document.createElement("div");
            card.className = "decoder-card";
            container.appendChild(card);

            // Même validation que dans boutonAfficherClique
            if (!codePermanent || !address) {
                msg("Code permanent ou adresse manquant", "error");
                card.innerHTML = `
                    <h3>Décodeur ${i + 1}</h3>
                    <p><strong>Adresse :</strong> ${address}</p>
                    <p><strong>Statut :</strong> Erreur: code permanent ou adresse manquant</p>
                `;
                continue;
            }

            // Fonction interne pour refresh
            const refreshCard = async () => {
                msg(`Demande d'information pour ${address} (id=${codePermanent})`, "info");
                try {
                    const info = await getDecoderInfo(codePermanent, address);
                    msg(info, "success");

                    const status = info?.state || "Inconnu";
                    const isActive = status && ["actif", "active"].includes(status.toLowerCase());
                    const statusClass = isActive ? "status-active" : "status-inactive";

                    // Carte simplifiée
                    card.innerHTML = `
                        <div class="decoder-card-layout">
                            <div class="decoder-status-bar ${statusClass}"></div>
                            <div class="decoder-card-content">
                                <div class="decoder-info">
                                    <h3>Décodeur ${i + 1}</h3>
                                    <p><strong>Adresse :</strong> ${address}</p>
                                    <p class="decoder-status-text"><strong>Statut :</strong> ${status}</p>
                                </div>
                            </div>
                        </div>
                    `;

                    // Carte cliquable
                    card.style.cursor = "pointer";
                    card.onclick = () => {
                        const params = new URLSearchParams({
                            codePermanent,
                            address,
                        });
                        window.location.href = `/pages/decodeur.html?${params.toString()}`;
                    };

                    // Plus de boutons 
                    const btnReset = null;
                    const btnReinit = null;
                    const btnShutdown = null;

                    if (btnReset) {
                        btnReset.addEventListener("click", async () => {
                            msg(`Reset du décodeur ${address}`, "warning");
                            try {
                                // Désactive et grise le bouton Reset
                                btnReset.disabled = true;
                                btnReset.classList.add("btn-reset-disabled");

                                // met a jour le statut visuel 
                                const statusTextEl = card.querySelector(".decoder-status-text");
                                if (statusTextEl) {
                                    statusTextEl.innerHTML = `<strong>Statut :</strong> Reset en cours`;
                                }

                                const res = await resetDecoder(codePermanent, address);
                                msg(res, "success");

                                // Après un reset, on redemande l'état toutes les 5 secondes
                                const intervalId = setInterval(async () => {
                                    try {
                                        const infoPoll = await getDecoderInfo(codePermanent, address);
                                        const statusPoll = infoPoll?.state || "Inconnu";
                                        msg(infoPoll, "info");
                                        // On rafraîchit la carte avec le nouvel état
                                        const lastRestartPoll = infoPoll?.lastRestart || "N/A";
                                        const lastReinitPoll = infoPoll?.lastReinit || "N/A";

                                        const isActivePoll = statusPoll && ["actif", "active"].includes(statusPoll.toLowerCase());
                                        const statusBar = card.querySelector(".decoder-status-bar");
                                        if (statusBar) {
                                            statusBar.classList.toggle("status-active", isActivePoll);
                                            statusBar.classList.toggle("status-inactive", !isActivePoll);
                                        }

                                        const statusTextEl = card.querySelector(".decoder-status-text");
                                        const lastRestartEl = card.querySelector(".decoder-last-restart");
                                        const lastReinitEl = card.querySelector(".decoder-last-reinit");
                                        // Tant que le décodeur n'est pas revenu actif, on garde "Reset en cours"
                                        if (statusTextEl) {
                                            if (isActivePoll) {
                                                statusTextEl.innerHTML = `<strong>Statut :</strong> ${statusPoll}`;
                                            } else {
                                                statusTextEl.innerHTML = `<strong>Statut :</strong> Reset en cours`;
                                            }
                                        }
                                        if (lastRestartEl) lastRestartEl.innerHTML = `<strong>Actif depuis :</strong> ${lastRestartPoll}`;
                                        if (lastReinitEl) lastReinitEl.innerHTML = `<strong>Dernière réinit :</strong> ${lastReinitPoll}`;

                                        // Si l'état redevient actif, on arrête le polling et on réactive le bouton Reset
                                        if (statusPoll && ["actif", "active"].includes(statusPoll.toLowerCase())) {
                                            clearInterval(intervalId);
                                            btnReset.disabled = false;
                                            btnReset.classList.remove("btn-reset-disabled");
                                        }
                                    } catch (pollErr) {
                                        msg("Erreur lors du polling de l'état: " + pollErr.message, "error");
                                        clearInterval(intervalId);
                                    }
                                }, 5000);
                            } catch (e) {
                                msg("Erreur reset: " + e.message, "error");
                            }
                        });
                    }

                    if (btnReinit) {
                        btnReinit.addEventListener("click", async () => {
                            msg(`Réinitialisation du décodeur ${address}`, "warning");
                            try {
                                const res = await reinitDecoder(codePermanent, address);
                                msg(res, "success");
                                // Après réinit, on rafraîchit une fois l'état
                                await refreshCard();
                            } catch (e) {
                                msg("Erreur reinit: " + e.message, "error");
                            }
                        });
                    }

                    if (btnShutdown) {
                        btnShutdown.addEventListener("click", async () => {
                            msg(`Fermeture du décodeur ${address}`, "warning");
                            try {
                                const res = await shutdownDecoder(codePermanent, address);
                                msg(res, "success");
                                // Après le shutdown, on rafraîchit une fois l'état
                                await refreshCard();
                            } catch (e) {
                                msg("Erreur fermeture: " + e.message, "error");
                            }
                        });
                    }
                } catch (e) {
                    msg("Erreur info: " + e.message, "error");
                    card.innerHTML = `
                        <h3>Décodeur ${i + 1}</h3>
                        <p><strong>Adresse :</strong> ${address}</p>
                        <p><strong>Statut :</strong> Erreur: ${e.message}</p>
                    `;
                }
            };

            // Premier remplissage de la carte
            await refreshCard();
        }
        // Met à jour le timestamp de dernière mise à jour si tout s'est bien passé
        const lastUpdateEl = document.getElementById("last-update");
        if (lastUpdateEl) {
            const now = new Date();
            const heures = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const secondes = String(now.getSeconds()).padStart(2, "0");
            lastUpdateEl.textContent = `Dernière mise à jour : ${heures}:${minutes}:${secondes}`;
        }
        // Met aussi à jour le résumé utilisateur (nombre de décodeurs actifs/inactifs)
        await displayUserSummary();
    } catch (e) {
        console.error("Erreur lors du chargement des décodeurs:", e);
        container.innerHTML = "<p>Erreur lors du chargement de vos décodeurs.</p>";
    }
}

// Affichage du lien admin dans la nav si l'utilisateur est admin
function displayNav() {
    const user = getUser();
    const adminLink = document.getElementById("nav-admin-link");
    if (adminLink) adminLink.style.display = user && user.role === "admin" ? "inline" : "none";
    const user = getUser();
    const adminLink = document.getElementById("nav-admin-link");
    if (adminLink) adminLink.style.display = user && user.role === "admin" ? "inline" : "none";
}

// Mise en surbrillance du lien actif dans la nav
function highlightActiveLink() {
    const links = document.querySelectorAll(".nav-links a");
    const currentPath = window.location.pathname.split("/").pop();
    links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === currentPath);
    });
    const links = document.querySelectorAll(".nav-links a");
    const currentPath = window.location.pathname.split("/").pop();
    links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === currentPath);
    });
}

// ==========================
// Initialisation DOM (tous les écrans)
// ==========================

// Branche tous les listenenrs sur les boutons 
function initialiserUI() {
    const btnAfficher = document.getElementById("btn-afficher-decodeur");
    const btnRefreshDecoders = document.getElementById("btn-refresh-decoders");
    const actions = document.querySelector("#etat #actions-content");
    const [btnReset, btnReinit, btnShutdown] = actions?.querySelectorAll("button") || [];

    // Sélection par utilisateur (page GestionDecodeur)
    const selectUserAdmin = document.getElementById("select-user-admin");
    const selectUserDecoder = document.getElementById("select-user-decoder");
    const btnChargerDepuisUser = document.getElementById("btn-charger-depuis-user");

    // Ajout des eventlisteners pour les boutons
    if (btnAfficher) btnAfficher.addEventListener("click", boutonAfficherClique);
    if (btnRefreshDecoders) btnRefreshDecoders.addEventListener("click", displayUserDecoders);
    if (btnReset) btnReset.addEventListener("click", boutonResetClique);
    if (btnReinit) btnReinit.addEventListener("click", boutonReinitClique);
    if (btnShutdown) btnShutdown.addEventListener("click", boutonShutdownClique);

    // Initialisation de la sélection par utilisateur 
    if (selectUserAdmin && selectUserDecoder) {
        initialiserSelectionParUtilisateur(selectUserAdmin, selectUserDecoder);
    }
    if (btnChargerDepuisUser) {
        btnChargerDepuisUser.addEventListener("click", chargerDecodeurDepuisSelectionUser);
    }
}

// Remplir la liste des utilisateurs et de leurs décodeurs pour la page admin
async function initialiserSelectionParUtilisateur(selectUserAdmin, selectUserDecoder) {
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();

        // Stocker les utilisateurs pour réutilisation lors du changement de sélection
        window.__adminUsers = users;

        // Remplir la liste des utilisateurs
        users.forEach((u, index) => {
            const opt = document.createElement("option");
            opt.value = String(index); // on stocke l'index dans le tableau
            opt.textContent = `${u.nom} — ${u.email}`;
            selectUserAdmin.appendChild(opt);
        });

        // Quand on change d'utilisateur, on remplit sa liste de décodeurs
        selectUserAdmin.addEventListener("change", () => {
            const idx = selectUserAdmin.value;
            selectUserDecoder.innerHTML = '<option value="">-- choisir un décodeur --</option>';
            if (!idx) return;
            const user = window.__adminUsers?.[Number(idx)];
            const decoders = user?.decodeurs || [];
            decoders.forEach((addr) => {
                const opt = document.createElement("option");
                opt.value = addr;
                opt.textContent = addr;
                selectUserDecoder.appendChild(opt);
            });
        });
    } catch (e) {
        console.error("Erreur lors de l'initialisation de la sélection utilisateur (admin):", e);
    }
}
// on charge un décodeur depuis un code permanent
function chargerDecodeurDepuisSelectionUser() {
    const selectUserAdmin = document.getElementById("select-user-admin");
    const selectUserDecoder = document.getElementById("select-user-decoder");
    const idx = selectUserAdmin?.value;
    const address = selectUserDecoder?.value;
    if (!idx || !address) {
        msg("Sélectionnez un utilisateur et un décodeur", "error");
        return;
    }

    const user = window.__adminUsers?.[Number(idx)];
    const codePermanent = user?.codePermanent;
    if (!codePermanent) {
        msg("Code permanent introuvable pour cet utilisateur", "error");
        return;
    }

    const idInput = document.getElementById("input-code-permanent-top");
    const selectAdresse = document.getElementById("select-adresse-decodeur");
    if (idInput) idInput.value = codePermanent;
    if (selectAdresse) selectAdresse.value = address;

    // Réutiliser la logique existante
    boutonAfficherClique();
}

// Initialisation au chargement de la page 
document.addEventListener("DOMContentLoaded", async () => {
    initialiserUI();
    displayUserInfo();
    await displayUserSummary();
    displayUserDecoders();
    displayNav();
    highlightActiveLink();
    await displayClients();

    // Rafraîchissement automatique de l'état des décodeurs toutes les 30 secondes sur le dashboard
    const currentPath = window.location.pathname.split("/").pop();
    if (currentPath === "dashboard.html") {
        setInterval(() => {
            displayUserDecoders();
        }, 30000); // 30 000 ms = 30 secondes
    }
});

// Exposition des fonctions API pour les boutons de la page
window.DecodeurAPI = { getDecoderInfo, resetDecoder, reinitDecoder, shutdownDecoder, getAllDecodersInfo, signin, signup, logout };

