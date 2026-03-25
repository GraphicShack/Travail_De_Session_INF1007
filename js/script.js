// ==========================
// Gestion utilisateur / Auth / Admin communs
// ==========================
// Fonctions de gestion de l'utilisateur dans le localStorage
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

// Fonction pour stocker l'utilisateur dans le localStorage
function setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

// Fonction de déconnexion
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

    const user = getUser();
    const path = window.location.pathname;

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée, rediriger vers signin
    const pagesProtegees = ["/pages/dashboard.html", "/pages/GestionDecodeur.html", "/pages/admin.html", "/pages/decodeur.html"];
    const estPageProtegee = pagesProtegees.includes(path);

    if (!user && estPageProtegee) {
        window.location.href = "/pages/signin.html";
        return;
    }

    // Protection spécifique pour la page admin : nécessite un rôle admin
    if (path === "/pages/admin.html" && (!user || user.role !== "admin")) {
        window.location.href = "/pages/dashboard.html";
        return;
    }
});

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
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
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
    // Hachage du mot de passe avant l'envoi
    const hashedPwd = hachageMotDePasse(motDePasse);
    // Envoi de la requête d'inscription au serveur
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
    // Hachage du mot de passe avant l'envoi (pour correspondre à ce qui est stocké côté serveur)
    const hashedPwd = hachageMotDePasse(motDePasse);

    // Envoi de la requête de connexion au serveur
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
    if (!div) return;
    try {
        const clients = await getClients();
				for (const client of clients) {
					div.append(createClientLine(client));
					div.append(document.createElement("hr"));
				}
    } catch (error) {
        console.error("Erreur lors de l'affichage des clients:", error);
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
	line.innerHTML = `<div>ID: ${client.id}</div><div>Nom: ${client.nom}</div><div>Email: ${client.email}</div>`;
	return line;
}

// ==========================
// Fonctions Dashboard (définies dans dashboard.js)
// ==========================

// ==========================
// Initialisation DOM
// ==========================

// Fonction pour initialiser les événements du DOM
function initialiserUI() {
    const btnAfficher = document.getElementById("btn-afficher-decodeur");
    const btnRefreshDecoders = document.getElementById("btn-refresh-decoders");
    const actions = document.querySelector("#etat #actions-content");
    const [btnReset, btnReinit, btnShutdown] = actions?.querySelectorAll("button") || [];

    // Sélection par utilisateur (page GestionDecodeur)
    const selectUserAdmin = document.getElementById("select-user-admin");
    const selectUserDecoder = document.getElementById("select-user-decoder");
    const btnChargerDepuisUser = document.getElementById("btn-charger-depuis-user");

    // Ajout des écouteurs d'événements pour les boutons
    if (btnAfficher) {
        btnAfficher.addEventListener("click", async () => {
            await boutonAfficherClique();
            const { id, address } = lireCodeEtAdresseDepuisPage();
            if (id && address && typeof rafraichirAffichageChaines === "function") {
                rafraichirAffichageChaines(id, address);
            }
        });
    }
    if (btnRefreshDecoders) btnRefreshDecoders.addEventListener("click", displayUserDecoders);
    if (btnReset) btnReset.addEventListener("click", boutonResetClique);
    if (btnReinit) btnReinit.addEventListener("click", boutonReinitClique);
    if (btnShutdown) btnShutdown.addEventListener("click", boutonShutdownClique);

    // Initialisation de la sélection par utilisateur (admin)
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

// Quand on clique sur "Charger", on copie le code permanent + adresse dans les champs existants
// puis on réutilise la logique du bouton Afficher
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

    // Charger aussi les chaînes associées à ce décodeur, si la fonction existe
    if (typeof rafraichirAffichageChaines === "function") {
        rafraichirAffichageChaines(codePermanent, address);
    }
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

    // Rafraîchissement automatique de l'état des décodeurs toutes les 10 secondes sur le dashboard
    const currentPath = window.location.pathname.split("/").pop();
    if (currentPath === "dashboard.html") {
        setInterval(() => {
            displayUserDecoders();
        }, 10000); // 10 000 ms = 10 secondes
    }
});

// Exposer seulement les fonctions d'authentification si besoin en global
window.AppAuth = { signin, signup, logout };
