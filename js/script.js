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
function getUser() { return JSON.parse(localStorage.getItem("user")); }

// Fonction pour stocker l'utilisateur dans le localStorage
function setUser(user) { localStorage.setItem("user", JSON.stringify(user)); }

// Fonction de déconnexion
function logout() { localStorage.removeItem("user"); window.location.href = "/pages/signin.html"; }

// ==========================
// Bouton de déconnexion
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

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
});

// ==========================
// Fonctions de log
// ==========================
function msg(texte) {
  const cont = document.getElementById("messages-content");
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}/${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}/`;
  const contenu = typeof texte === "string" ? texte : JSON.stringify(texte);
  const ligne = `${ts} ${contenu}`;
  if (!cont) return console.log(ligne);
  const p = document.createElement("p"); p.textContent = ligne; cont.appendChild(p);
}

// ==========================
// API Decodeur
// ==========================

// Validation des entrées
function isValidDecoderIp(ip) { return DECODER_ADDRESSES.includes(ip); }

// Validation de l'action
function isValidAction(action) { return ACTIONS.includes(action); }

// Fonction générique pour faire une requête au serveur pour une action donnée
async function decoderRequest(id, address, action) {
  // Validation des entrées
  if (!id) throw new Error("Code permanent manquant.");
  if (!isValidDecoderIp(address)) throw new Error("Adresse IP invalide.");
  if (!isValidAction(action)) throw new Error("Action invalide.");

  // Requête vers le serveur
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ id, address, action })
  });

  // Gestion des erreurs HTTP et parsing de la réponse
  const text = await response.text();
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status} - ${text}`);

  // Parsing de la réponse JSON et gestion des erreurs métier
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Réponse du serveur invalide."); }
  if (data.response !== "OK") throw new Error(data.message || "Erreur serveur");

  // Retour des données
  return data;
}

// Fonctions spécifiques pour chaque action (qui appellent la fonction générique)
async function getDecoderInfo(id, address) { return decoderRequest(id, address, "info"); }
async function resetDecoder(id, address) { return decoderRequest(id, address, "reset"); }
async function reinitDecoder(id, address) { return decoderRequest(id, address, "reinit"); }
async function shutdownDecoder(id, address) { return decoderRequest(id, address, "shutdown"); }

// Fonction pour obtenir les infos de tous les décodeurs (utile pour admin)
async function getAllDecodersInfo(id) {
  const results = [];
  for (const address of DECODER_ADDRESSES) {
    try { results.push({ address, ...(await getDecoderInfo(id, address)) }); }
    catch (e) { results.push({ address, response: "Error", message: e.message }); }
  }
  return results;
}

// ==========================
// Fonctions d'interface utilisateur
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

// Fonction pour lire le code permanent et l'adresse depuis les champs de la page
function lireCodeEtAdresseDepuisPage() {
  const idInput = document.getElementById("input-code-permanent-top");
  const selectAdresse = document.getElementById("select-adresse-decodeur");
  return { id: idInput?.value?.trim() || "", address: selectAdresse?.value || "" };
}

// ==========================
// Boutons Décodeurs
// ==========================
// bouton Afficher les infos du décodeur
async function boutonAfficherClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg("Code permanent ou adresse manquant");
  msg(`Demande d'information pour ${address} (id=${id})`);
  try { const info = await getDecoderInfo(id, address); msg(info); majEtatDepuisInfo(info, address); }
  catch (e) { msg("Erreur info: " + e.message); }
}

// Fonction générique pour les actions qui nécessitent du polling (reset, reinit, shutdown)
async function boutonResetClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg("Code permanent ou adresse manquant");
  msg(`Reset du décodeur ${address}`);
  try {
    const res = await resetDecoder(id, address); msg(res); msg("Attente que le décodeur redevienne actif...");
    const intervalMs = 5000, timeoutMs = 60000, debut = Date.now();
    while (true) {
      if (Date.now() - debut > timeoutMs) { msg("Timeout: le décodeur n'est pas redevenu actif."); break; }
      await new Promise(r => setTimeout(r, intervalMs));
      try { const info = await getDecoderInfo(id, address); msg(info); majEtatDepuisInfo(info, address); if (info.state?.toLowerCase() === "active") { msg("Le décodeur est maintenant actif."); break; } }
      catch (err) { msg("Erreur polling info: " + err.message); }
    }
  } catch (e) { msg("Erreur reset: " + e.message); }
}

// bouton Réinitialiser le décodeur
async function boutonReinitClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg("Code permanent ou adresse manquant");
  msg(`Réinitialisation du décodeur ${address}`);
  try { const res = await reinitDecoder(id, address); msg(res); const info = await getDecoderInfo(id, address); msg(info); majEtatDepuisInfo(info, address); }
  catch (e) { msg("Erreur reinit: " + e.message); }
}

// bouton Éteindre le décodeur
async function boutonShutdownClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg("Code permanent ou adresse manquant");
  msg(`Extinction du décodeur ${address}`);
  try { const res = await shutdownDecoder(id, address); msg(res); const info = await getDecoderInfo(id, address); msg(info); majEtatDepuisInfo(info, address); }
  catch (e) { msg("Erreur shutdown: " + e.message); }
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
        .then(res => res.json())
        .then(data => data.exists)
        .catch(() => false);
}

// Validation du mot de passe (au moins 8 caractères et une majuscule)
function validatePassword(pwd) {
    return /^(?=.*[A-Z]).{8,}$/.test(pwd);
}

// Fonction d'inscription
async function signup() {
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
    // Envoi de la requête d'inscription au serveur
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom, email, motDePasse })
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
        setTimeout(() => window.location.href = "/pages/dashboard.html", 1000);
    } catch (err) {
        messageEl.textContent = "Erreur serveur";
        messageEl.className = "error";
    }
}

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

    // Envoi de la requête de connexion au serveur
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, motDePasse })
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
        setTimeout(() => window.location.href = "/pages/dashboard.html", 1000);
    } catch (err) {
        messageEl.textContent = "Erreur serveur";
        messageEl.className = "error";
    }
}

// ==========================
// Dashboard / UI
// ==========================

// Affichage des infos de l'utilisateur dans le header et gestion de la visibilité du lien admin
function displayUserInfo() {
  const user = getUser();
  const el = document.getElementById("user-info");
  if (!el) return;
  el.innerHTML = user ? `Connecté en tant que <strong>${user.nom}</strong>` : "Non connecté";
}

// Affichage du lien admin dans la nav si l'utilisateur est admin
function displayNav() {
  const user = getUser();
  const adminLink = document.getElementById("nav-admin-link");
  if (adminLink) adminLink.style.display = (user && user.role === "admin") ? "inline" : "none";
}

// Mise en surbrillance du lien actif dans la nav
function highlightActiveLink() {
  const links = document.querySelectorAll(".nav-links a");
  const currentPath = window.location.pathname.split("/").pop();
  links.forEach(link => { link.classList.toggle("active", link.getAttribute("href") === currentPath); });
}

// ==========================
// Initialisation DOM
// ==========================

// Fonction pour initialiser les événements du DOM
function initialiserUI() {
  const btnAfficher = document.getElementById("btn-afficher-decodeur");
  const actions = document.querySelector("#etat #actions-content");
  const [btnReset, btnReinit, btnShutdown] = actions?.querySelectorAll("button") || [];

  // Ajout des écouteurs d'événements pour les boutons
  if (btnAfficher) btnAfficher.addEventListener("click", boutonAfficherClique);
  if (btnReset) btnReset.addEventListener("click", boutonResetClique);
  if (btnReinit) btnReinit.addEventListener("click", boutonReinitClique);
  if (btnShutdown) btnShutdown.addEventListener("click", boutonShutdownClique);
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  initialiserUI();
  displayUserInfo();
  displayNav();
  highlightActiveLink();
});

// Exposition des fonctions API pour les boutons de la page
window.DecodeurAPI = { getDecoderInfo, resetDecoder, reinitDecoder, shutdownDecoder, getAllDecodersInfo, signin, signup, logout };