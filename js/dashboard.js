// ==========================
// Dashboard API + UI 
// ==========================
async function displayUserInfo() {
    const user = getUser();
    const el = document.getElementById("user-info");
    if (!el) return;
    el.innerHTML = user ? `Connecté en tant que <strong>${user.nom}</strong>` : "Non connecté";
}

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
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
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

            if (!codePermanent || !address) {
                msg("Code permanent ou adresse manquant", "error");
                card.innerHTML = `
                    <h3>Décodeur ${i + 1}</h3>
                    <p><strong>Adresse :</strong> ${address}</p>
                    <p><strong>Statut :</strong> Erreur: code permanent ou adresse manquant</p>
                `;
                continue;
            }

            const refreshCard = async () => {
                msg(`Demande d'information pour ${address} (id=${codePermanent})`, "info");
                try {
                    const info = await getDecoderInfo(codePermanent, address);
                    msg(info, "success");

                    const status = info?.state || "Inconnu";
                    const isActive = status && ["actif", "active"].includes(status.toLowerCase());
                    const statusClass = isActive ? "status-active" : "status-inactive";

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

                    card.style.cursor = "pointer";
                    card.onclick = () => {
                        const params = new URLSearchParams({ codePermanent, address });
                        window.location.href = `/pages/decodeur.html?${params.toString()}`;
                    };
                } catch (e) {
                    msg("Erreur info: " + e.message, "error");
                    card.innerHTML = `
                        <h3>Décodeur ${i + 1}</h3>
                        <p><strong>Adresse :</strong> ${address}</p>
                        <p><strong>Statut :</strong> Erreur: ${e.message}</p>
                    `;
                }
            };

            await refreshCard();
        }

        const lastUpdateEl = document.getElementById("last-update");
        if (lastUpdateEl) {
            const now = new Date();
            const heures = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const secondes = String(now.getSeconds()).padStart(2, "0");
            lastUpdateEl.textContent = `Dernière mise à jour : ${heures}:${minutes}:${secondes}`;
        }

        await displayUserSummary();
    } catch (e) {
        console.error("Erreur lors du chargement des décodeurs:", e);
        container.innerHTML = "<p>Erreur lors du chargement de vos décodeurs.</p>";
    }
}

function displayNav() {
    const user = getUser();
    const adminLink = document.getElementById("nav-admin-link");
    if (adminLink) adminLink.style.display = user && user.role === "admin" ? "inline" : "none";
}

function highlightActiveLink() {
    const links = document.querySelectorAll(".nav-links a");
    const currentPath = window.location.pathname.split("/").pop();
    links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === currentPath);
    });
}

window.DashboardUI = { displayUserInfo, displayUserSummary, displayUserDecoders, displayNav, highlightActiveLink };
