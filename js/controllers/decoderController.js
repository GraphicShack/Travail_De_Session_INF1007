import { getDecoderInfo, reinitDecoder, resetDecoder, shutdownDecoder } from '../services/decoderService.js';
import { API_URL } from '../utils/config.js';
import { getUser } from './authController.js';
import { unassignDecoderFromClient } from './clientController.js';
import { displayUserSummary } from './dashboardController.js';
/*import { getUser } from './AuthController.js';
import { getUser } from '/authController.js';
import { getUser } from '/AuthController.js';
*/
export function majEtatDepuisInfo(info, adresse) {
  const zone = document.getElementById('etat-content');
  if (!zone) return;
  const lignes = zone.querySelectorAll('p');
  if (lignes.length < 4) return;
  lignes[0].innerHTML = `<strong>Adresse :</strong> ${adresse || ''}`;
  lignes[1].innerHTML = `<strong>Statut :</strong> ${info?.state || ''}`;
  lignes[2].innerHTML = `<strong>Actif depuis :</strong> ${info?.lastRestart || ''}`;
  lignes[3].innerHTML = `<strong>Réinitialisé :</strong> ${info?.lastReinit || ''}`;
}

// Affichage de la liste des décodeurs avec un bouton pour les supprimer
export async function displayClientDecoders() {
  const container = document.getElementById('liste-decodeurs');
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('id');

  if (!clientId) {
    console.error("Aucun ID de client trouvé dans l'URL.");
    return;
  }
  try {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
    const users = await res.json();
    const client = users.find((u) => String(u.id) === String(clientId));

    if (client) {
      const decoders = client.decodeurs || [];
      const decoderList = decoders.length
        ? `
            <div class="client-decoder-list">
              ${decoders
                .map(
                  (address, index) => `
                    <p class="client-decoder-item">
                      <span>Décodeur ${index + 1} — ${address}</span>
                      <button type="button" class="btn-unassign-decoder" data-address="${address}">Dissocier le décodeur</button>
                      <hr />
                    </p>
                  `
                )
                .join('')}
            </div>
          `
        : '<p>Aucun décodeur associé à ce client.</p>';

      container.innerHTML = `
        <div class="client-card">
          <div class="client-decoders">
            <br />
            <h2>Décodeurs associés :</h2>
            ${decoderList}
          </div>
          <br />
        </div>
      `;

      container.querySelectorAll('.btn-unassign-decoder').forEach((button) => {
        button.addEventListener('click', async () => {
          const address = button.dataset.address;
          if (!client.codePermanent || !address) {
            console.error('Code permanent ou adresse de décodeur manquante.');
            return;
          }
          // Action du bouton de la dissociation
          const confirmation = confirm(
            `Êtes-vous sûr de vouloir dissocier le décodeurs ${address} ?`
          );
          if (!confirmation) return;
          try {
            await unassignDecoderFromClient(client.codePermanent, address);
            alert(`Décodeur ${address} dissocié avec succès.`);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (error) {
            alert('Erreur: ' + error.message);
          }
        });
      });
    } else {
      console.warn(`Aucun client trouvé avec l'ID : ${clientId}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations du client:', error);
  }
}

// Affiche une carte par décodeur associé à l'utilisateur connecté
export async function displayUserDecoders() {
  const container = document.getElementById('user-decoders');
  if (!container) return;

  container.innerHTML = '';

  const current = getUser();
  if (!current) {
    container.innerHTML = '<p>Utilisateur non connecté.</p>';
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
      container.innerHTML = '<p>Aucun décodeur associé à votre compte.</p>';
      return;
    }
    for (let i = 0; i < decoders.length; i++) {
      const address = decoders[i];

      const card = document.createElement('div');
      card.className = 'decoder-card';
      container.appendChild(card);

      // Même validation que dans boutonAfficherClique
      if (!codePermanent || !address) {
        msg('Code permanent ou adresse manquant', 'error');
        card.innerHTML = `
                    <h3>Décodeur ${i + 1}</h3>
                    <p><strong>Adresse :</strong> ${address}</p>
                    <p><strong>Statut :</strong> Erreur: code permanent ou adresse manquant</p>
                `;
        continue;
      }

      // Fonction interne pour refresh
      const refreshCard = async () => {
        msg(`Demande d'information pour ${address} (id=${codePermanent})`, 'info');
        try {
          const info = await getDecoderInfo(codePermanent, address);
          msg(info, 'success');

          const status = info?.state || 'Inconnu';
          const isActive = status && ['actif', 'active'].includes(status.toLowerCase());
          const statusClass = isActive ? 'status-active' : 'status-inactive';

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
          card.style.cursor = 'pointer';
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
            btnReset.addEventListener('click', async () => {
              msg(`Reset du décodeur ${address}`, 'warning');
              try {
                // Désactive et grise le bouton Reset
                btnReset.disabled = true;
                btnReset.classList.add('btn-reset-disabled');

                // met a jour le statut visuel
                const statusTextEl = card.querySelector('.decoder-status-text');
                if (statusTextEl) {
                  statusTextEl.innerHTML = `<strong>Statut :</strong> Reset en cours`;
                }

                const res = await resetDecoder(codePermanent, address);
                msg(res, 'success');

                // Après un reset, on redemande l'état toutes les 5 secondes
                const intervalId = setInterval(async () => {
                  try {
                    const infoPoll = await getDecoderInfo(codePermanent, address);
                    const statusPoll = infoPoll?.state || 'Inconnu';
                    msg(infoPoll, 'info');
                    // On rafraîchit la carte avec le nouvel état
                    const lastRestartPoll = infoPoll?.lastRestart || 'N/A';
                    const lastReinitPoll = infoPoll?.lastReinit || 'N/A';

                    const isActivePoll =
                      statusPoll && ['actif', 'active'].includes(statusPoll.toLowerCase());
                    const statusBar = card.querySelector('.decoder-status-bar');
                    if (statusBar) {
                      statusBar.classList.toggle('status-active', isActivePoll);
                      statusBar.classList.toggle('status-inactive', !isActivePoll);
                    }

                    const statusTextEl = card.querySelector('.decoder-status-text');
                    const lastRestartEl = card.querySelector('.decoder-last-restart');
                    const lastReinitEl = card.querySelector('.decoder-last-reinit');
                    // Tant que le décodeur n'est pas revenu actif, on garde "Reset en cours"
                    if (statusTextEl) {
                      if (isActivePoll) {
                        statusTextEl.innerHTML = `<strong>Statut :</strong> ${statusPoll}`;
                      } else {
                        statusTextEl.innerHTML = `<strong>Statut :</strong> Reset en cours`;
                      }
                    }
                    if (lastRestartEl)
                      lastRestartEl.innerHTML = `<strong>Actif depuis :</strong> ${lastRestartPoll}`;
                    if (lastReinitEl)
                      lastReinitEl.innerHTML = `<strong>Dernière réinit :</strong> ${lastReinitPoll}`;

                    // Si l'état redevient actif, on arrête le polling et on réactive le bouton Reset
                    if (statusPoll && ['actif', 'active'].includes(statusPoll.toLowerCase())) {
                      clearInterval(intervalId);
                      btnReset.disabled = false;
                      btnReset.classList.remove('btn-reset-disabled');
                    }
                  } catch (pollErr) {
                    msg("Erreur lors du polling de l'état: " + pollErr.message, 'error');
                    clearInterval(intervalId);
                  }
                }, 5000);
              } catch (e) {
                msg('Erreur reset: ' + e.message, 'error');
              }
            });
          }

          if (btnReinit) {
            btnReinit.addEventListener('click', async () => {
              msg(`Réinitialisation du décodeur ${address}`, 'warning');
              try {
                const res = await reinitDecoder(codePermanent, address);
                msg(res, 'success');
                // Après réinit, on rafraîchit une fois l'état
                await refreshCard();
              } catch (e) {
                msg('Erreur reinit: ' + e.message, 'error');
              }
            });
          }

          if (btnShutdown) {
            btnShutdown.addEventListener('click', async () => {
              msg(`Fermeture du décodeur ${address}`, 'warning');
              try {
                const res = await shutdownDecoder(codePermanent, address);
                msg(res, 'success');
                // Après le shutdown, on rafraîchit une fois l'état
                await refreshCard();
              } catch (e) {
                msg('Erreur fermeture: ' + e.message, 'error');
              }
            });
          }
        } catch (e) {
          msg('Erreur info: ' + e.message, 'error');
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
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) {
      const now = new Date();
      const heures = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const secondes = String(now.getSeconds()).padStart(2, '0');
      lastUpdateEl.textContent = `Dernière mise à jour : ${heures}:${minutes}:${secondes}`;
    }
    // Met aussi à jour le résumé utilisateur (nombre de décodeurs actifs/inactifs)
    await displayUserSummary();
  } catch (e) {
    console.error('Erreur lors du chargement des décodeurs:', e);
    container.innerHTML = '<p>Erreur lors du chargement de vos décodeurs.</p>';
  }
}

// Fonction pour lire le code permanent et l'adresse depuis la page
function lireCodeEtAdresseDepuisPage() {
  const idFromGlobal = window.currentDecoderId;
  const addrFromGlobal = window.currentDecoderAddress;
  if (idFromGlobal && addrFromGlobal) {
    return { id: idFromGlobal, address: addrFromGlobal };
  }
  const idInput = document.getElementById('input-code-permanent-top');
  const selectAdresse = document.getElementById('select-adresse-decodeur');
  if (idInput?.value && /^[A-Z]{4}\d{8}$/.test(idInput.value.trim())) {
    return { id: idInput?.value?.trim() || '', address: selectAdresse?.value || '' };
  }
  return { id: '', address: '' };
}

// Bouton "Afficher"
async function boutonAfficherClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg('Code permanent ou adresse manquant', 'error');
  msg(`Demande d'information pour ${address} (id=${id})`, 'info');
  try {
    const info = await getDecoderInfo(id, address);
    msg(info, 'success');
    majEtatDepuisInfo(info, address);
  } catch (e) {
    msg('Erreur info: ' + e.message, 'error');
  }
}

// Fonction avec polling
async function boutonResetClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg('Code permanent ou adresse manquant', 'error');
  msg(`Reset du décodeur ${address}`, 'warning');
  try {
    // Afficher les infos dans la page
    try {
      const info = await getDecoderInfo(id, address);
      msg(info, 'success');
      majEtatDepuisInfo(info, address);
    } catch (err) {
      msg('Erreur info initiale: ' + err.message, 'debug');
    }
    const res = await resetDecoder(id, address);
    msg(res, 'success');
    msg('Attente que le décodeur redevienne actif...', 'debug');
    const intervalMs = 5000,
      timeoutMs = 60000,
      debut = Date.now();
    while (true) {
      if (Date.now() - debut > timeoutMs) {
        msg("Timeout: le décodeur n'est pas redevenu actif.", 'error');
        break;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        // on vérifie si le décodeur est rendu actif ou nope
        const info = await getDecoderInfo(id, address);
        if (info.state === 'active') {
          msg('Le décodeur est redevenu actif !', 'success');
          msg(info, 'success');
          majEtatDepuisInfo(info, address);
          break;
        }
      } catch (err) {
        msg('Erreur polling info: ' + err.message, 'debug');
      }
    }
  } catch (e) {
    msg('Erreur reset: ' + e.message, 'error');
  }
}

// Bouton "Réinitialiser" le décodeur
async function boutonReinitClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg('Code permanent ou adresse manquant', 'error');
  msg(`Réinitialisation du décodeur ${address}`, 'warning');
  try {
    const res = await reinitDecoder(id, address);
    msg(res, 'success');
    const info = await getDecoderInfo(id, address);
    msg(info, 'success');
    majEtatDepuisInfo(info, address);
  } catch (e) {
    msg('Erreur reinit: ' + e.message, 'error');
  }
}

// Bouton "Éteindre" le décodeur
async function boutonShutdownClique() {
  const { id, address } = lireCodeEtAdresseDepuisPage();
  if (!id || !address) return msg('Code permanent ou adresse manquant', 'error');
  msg(`Extinction du décodeur ${address}`, 'warning');
  try {
    const res = await shutdownDecoder(id, address);
    msg(res, 'success');
    const info = await getDecoderInfo(id, address);
    msg(info, 'success');
    majEtatDepuisInfo(info, address);
  } catch (e) {
    msg('Erreur shutdown: ' + e.message, 'error');
  }
}

// Fonction pour mettre les messages des logs des decodeurs en couleur
export function msg(texte, type = 'info') {
  const cont = document.getElementById('messages-content');
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}/${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}/`;
  const contenu = typeof texte === 'string' ? texte : JSON.stringify(texte);

  // Définir la couleur selon le type
  let color;
  switch (type) {
    // Les types possibles sont : success, error, warning, debug, info
    // Cas Vert : succès de l'action
    case 'success':
      color = 'green';
      break;
    // Cas Rouge : erreur lors de l'action
    case 'error':
      color = 'red';
      break;
    // Cas Orange : action en cours ou avertissement
    case 'warning':
      color = 'orange';
      break;
    // Cas Bleu : messages de debug ou d'information détaillée
    case 'debug':
      color = 'blue';
      break;
    // Cas Noir : messages d'information généraux ou autres
    default:
      color = 'black'; // info ou autres
  }

  const ligne = document.createElement('p');
  ligne.textContent = `${ts} ${contenu}`;
  ligne.style.color = color;

  if (cont) cont.appendChild(ligne);
  else console.log(`${ts} ${contenu}`);
}

// Branche tous les listenenrs sur les boutons
function initialiserUI() {
  const btnAfficher = document.getElementById('btn-afficher-decodeur');
  const btnRefreshDecoders = document.getElementById('btn-refresh-decoders');
  const actions = document.querySelector('#etat #actions-content');
  const [btnReset, btnReinit, btnShutdown] = actions?.querySelectorAll('button') || [];

  // Sélection par utilisateur (page GestionDecodeur)
  const selectUserAdmin = document.getElementById('select-user-admin');
  const selectUserDecoder = document.getElementById('select-user-decoder');
  const btnChargerDepuisUser = document.getElementById('btn-charger-depuis-user');

  // Ajout des eventlisteners pour les boutons
  if (btnAfficher) btnAfficher.addEventListener('click', boutonAfficherClique);
  if (btnRefreshDecoders) btnRefreshDecoders.addEventListener('click', displayUserDecoders);
  if (btnReset) btnReset.addEventListener('click', boutonResetClique);
  if (btnReinit) btnReinit.addEventListener('click', boutonReinitClique);
  if (btnShutdown) btnShutdown.addEventListener('click', boutonShutdownClique);

  // Initialisation de la sélection par utilisateur
  if (selectUserAdmin && selectUserDecoder) {
    initialiserSelectionParUtilisateur(selectUserAdmin, selectUserDecoder);
  }
  if (btnChargerDepuisUser) {
    btnChargerDepuisUser.addEventListener('click', chargerDecodeurDepuisSelectionUser);
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
      const opt = document.createElement('option');
      opt.value = String(index); // on stocke l'index dans le tableau
      opt.textContent = `${u.nom} — ${u.email}`;
      selectUserAdmin.appendChild(opt);
    });

    // Quand on change d'utilisateur, on remplit sa liste de décodeurs
    selectUserAdmin.addEventListener('change', () => {
      const idx = selectUserAdmin.value;
      selectUserDecoder.innerHTML = '<option value="">-- choisir un décodeur --</option>';
      if (!idx) return;
      const user = window.__adminUsers?.[Number(idx)];
      const decoders = user?.decodeurs || [];
      decoders.forEach((addr) => {
        const opt = document.createElement('option');
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
  const selectUserAdmin = document.getElementById('select-user-admin');
  const selectUserDecoder = document.getElementById('select-user-decoder');
  const idx = selectUserAdmin?.value;
  const address = selectUserDecoder?.value;
  if (!idx || !address) {
    msg('Sélectionnez un utilisateur et un décodeur', 'error');
    return;
  }

  const user = window.__adminUsers?.[Number(idx)];
  const codePermanent = user?.codePermanent;
  if (!codePermanent) {
    msg('Code permanent introuvable pour cet utilisateur', 'error');
    return;
  }

  const idInput = document.getElementById('input-code-permanent-top');
  const selectAdresse = document.getElementById('select-adresse-decodeur');
  if (idInput) idInput.value = codePermanent;
  if (selectAdresse) selectAdresse.value = address;

  // Réutiliser la logique existante
  boutonAfficherClique();
}

// Rafraîchissement automatique de l'état des décodeurs toutes les 30 secondes sur le dashboard
document.addEventListener('DOMContentLoaded', async () => {
  initialiserUI();

  const currentPath = window.location.pathname.split('/').pop();
  if (currentPath === 'dashboard.html') {
    await displayUserDecoders();
    setInterval(() => {
      displayUserDecoders();
    }, 30000); // 30 000 ms = 30 secondes
  }
});
