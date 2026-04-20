import { getDecoderInfo } from '../services/decoderService.js';
import { API_URL } from '../utils/config.js';
import { getUser } from './authController.js';

// Affiche "Connecté en tant que ..." dans le header du dashboard
export function displayUserInfo() {
  const user = getUser();
  const el = document.getElementById('user-info');
  if (!el) return;
  el.innerHTML = user ? `Connecté en tant que <strong>${user.nom}</strong>` : 'Non connecté';
}

// Affiche un petit résumé sous le nom d'utilisateur (nombre de décodeur/actifs/inactifs)
export async function displayUserSummary() {
  const user = getUser();
  const el = document.getElementById('user-info');
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
      (info) => info && info.state && ['actif', 'active'].includes(String(info.state).toLowerCase())
    ).length;
    const inactifs = total - actifs;

    el.innerHTML =
      `Connecté en tant que <strong>${user.nom}</strong><br>` +
      `<small>${total} décodeur${total > 1 ? 's' : ''} associé${total > 1 ? 's' : ''} — ` +
      `${actifs} actif${actifs > 1 ? 's' : ''}, ${inactifs} inactif${inactifs > 1 ? 's' : ''}</small>`;
  } catch (e) {
    console.error("Erreur lors de l'affichage du résumé utilisateur:", e);
    el.innerHTML = `Connecté en tant que <strong>${user.nom}</strong>`;
  }
}

if (typeof window !== 'undefined') {
  window.displayUserSummary = displayUserSummary;
}

// Affichage du lien admin dans la nav si l'utilisateur est admin
export function displayNav() {
  const user = getUser();
  const adminLink = document.getElementsByClassName('nav-admin-link');
  if (adminLink) {
    for (let i = 0; i < adminLink.length; i++) {
      adminLink[i].style.display = user && user.role === 'admin' ? 'inline' : 'none';
    }
  }
}

// Mise en surbrillance du lien actif dans la nav
export function highlightActiveLink() {
  const links = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname.split('/').pop();
  links.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === currentPath);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  displayUserInfo();
  await displayUserSummary();
  displayNav();
  highlightActiveLink();
});
