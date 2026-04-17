import {
  createClient,
  deleteClient,
  getClients,
  validateEmail,
  validateEmailAlreadyExists,
} from '../services/userService.js';
import { API_URL, DECODER_ADDRESSES } from '../utils/config.js';
import { displayClientDecoders } from './decoderController.js';

// Affichage des clients
async function displayClients() {
  const div = document.getElementById('listeUtilisateurs');
  const messageEl = document.getElementById('admin-message');
  if (!div) return;
  try {
    const clients = await getClients();
    for (const client of clients) {
      div.append(createClientLine(client));
      div.append(document.createElement('hr'));
    }
  } catch (error) {
    console.error("Erreur lors de l'affichage des clients:", error);
    messageEl.textContent = 'Erreur serveur';
    messageEl.className = 'error';
  }
}

//Affichage des données d'un client
function createClientLine(client) {
  const line = document.createElement('div');
  line.className = 'client-line';

  const buttonEdit = document.createElement('button');
  buttonEdit.textContent = 'Voir';
  buttonEdit.onclick = () => (window.location.href = '/pages/client.html?id=' + client.id);

  const buttonDelete = document.createElement('button');
  buttonDelete.textContent = 'Supprimer';
  buttonDelete.onclick = () => deleteClient(client.id);

  line.innerHTML = `<div>ID: ${client.id}</div><div>Nom: ${client.nom}</div><div>Email: ${client.email}</div>`;
  line.appendChild(buttonEdit);
  line.appendChild(buttonDelete);
  return line;
}

// Récupération d'un client spécifique
async function getClient(id) {
  try {
    const messageEl = document.getElementById('client-page-message');
    const res = await fetch(`${API_URL}/client/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      messageEl.textContent = data.message || 'Erreur serveur';
      messageEl.className = 'error';
      return;
    }
    return data || null;
  } catch (error) {
    messageEl.textContent = 'Erreur serveur';
    messageEl.className = 'error';
  }
}

// Affichage des informations détaillées d'un client
export async function displayClientInfo() {
  const container = document.getElementById('client-detailed-infos');
  const messageEl = document.getElementById('client-page-message');

  // Réinitialisation du message d'erreur
  messageEl.textContent = '';
  messageEl.className = '';

  const params = new URLSearchParams(window.location.search);
  const userId = parseInt(params.get('id').trim());
  const user = await getClient(userId);
  if (!user) {
    messageEl.textContent = 'Client non trouvé';
    messageEl.className = 'error';
    return;
  }
  container.innerHTML = fillClientInfos(user);
}

// Création du code HTML pour afficher les informations d'un client
function fillClientInfos(user) {
  return (
    `<p><strong>ID :</strong> ${user.id}</p>` +
    `<p><strong>Nom :</strong> ${user.nom}</p>` +
    `<p><strong>Code Permanent :</strong> ${user.codePermanent}</p>` +
    `<p><strong>Email :</strong> ${user.email}</p>` +
    `<br>` +
    `<button onclick="displayClientEditForm(${user.id})">Modifier les informations du client</button>`
  );
}

// Création du code HTML pour afficher les inputs de modification des informations d'un client
function fillClientInfosInputs(user) {
  return (
    `<div class="edit-client-form"><label for="client-name">Nom </label><input type="text" id="client-name" value="${user.nom}" /><br>` +
    `<label for="client-code-permanent">Code Permanent </label><input type="text" id="client-code-permanent" value="${user.codePermanent}" /><br>` +
    `<label for="client-email">Email </label><input type="email" id="client-email" value="${user.email}" /><br>` +
    `<button onclick="editClient(${user.id})">Enregistrer les modifications</button><button onclick="displayClientInfo()">Annuler</button></div>`
  );
}

// Affichage du formulaire de modification des informations d'un client
async function displayClientEditForm(userId) {
  const messageEl = document.getElementById('client-page-message');
  const container = document.getElementById('client-detailed-infos');

  // Réinitialisation du message d'erreur
  messageEl.textContent = '';
  messageEl.className = '';

  const user = await getClient(userId);
  if (!user) {
    messageEl.textContent = 'Client non trouvé';
    messageEl.className = 'error';
    return;
  }
  container.innerHTML = fillClientInfosInputs(user);
}

// Enregistrement des modifications des informations d'un client
async function editClient(userId) {
  const messageEl = document.getElementById('client-page-message');
  const nom = document.getElementById('client-name')?.value.trim();
  const codePermanent = document.getElementById('client-code-permanent')?.value.trim();
  const email = document.getElementById('client-email')?.value.trim();

  // Réinitialisation du message d'erreur
  messageEl.textContent = '';
  messageEl.className = '';

  // Récupération du client pour comparaison des données avant modification
  const user = await getClient(userId);

  // Validation des champs
  if (!nom || !email || !codePermanent) {
    messageEl.textContent = 'Veuillez remplir tous les champs';
    messageEl.className = 'error';
    return;
  }

  // Validation de l'email
  if (!validateEmail(email)) {
    messageEl.textContent = 'Email invalide';
    messageEl.className = 'error';
    return;
  }

  // Validation du code permanent (format AAAA00000000)
  if (!/^[A-Z]{4}\d{8}$/.test(codePermanent)) {
    messageEl.textContent = 'Code permanent invalide (format AAAA00000000)';
    messageEl.className = 'error';
    return;
  }

  if (email !== user.email) {
    // Vérification si l'email existe déjà
    if (await validateEmailAlreadyExists(email)) {
      messageEl.textContent = 'Email déjà utilisé';
      messageEl.className = 'error';
      return;
    }
  }

  // Si aucune donnée n'a changé, on affiche un message d'erreur pour éviter une requête inutile au serveur
  if (nom === user.nom && email === user.email && codePermanent === user.codePermanent) {
    messageEl.textContent = 'Aucune modification détectée';
    messageEl.className = 'error';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/client/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nom, email, codePermanent }),
    });
    const data = await res.json();
    if (!res.ok) {
      messageEl.textContent = data.message || 'Erreur serveur';
      messageEl.className = 'error';
      return;
    }
    messageEl.textContent = 'Client modifié avec succès';
    messageEl.className = 'success';
    window.alert('Client modifié avec succès');
    displayClientInfo();
  } catch (err) {
    messageEl.textContent = 'Erreur serveur';
    messageEl.className = 'error';
  }
}

// Pour basculer entre l'affichage des décodeurs et l'assignation de décodeurs sur la page client.html
async function switchDisplay(modeAjout) {
  const sectionDecoders = document.getElementById('section-liste-decodeurs');
  const sectionAssign = document.getElementById('section-assign-decodeurs');

  if (modeAjout) {
    sectionDecoders.style.display = 'none';
    sectionAssign.style.display = 'block';
    fillSelectDecoder();
  } else {
    sectionDecoders.style.display = 'block';
    sectionAssign.style.display = 'none';
  }
}

// Association d'un décodeur un client
async function assignDecoderToClient(codePermanent, address) {
  try {
    const res = await fetch(`${API_URL}/users/assign-decoder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codePermanent, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur lors de l'assignation");
    return data;
  } catch (error) {
    console.error("Erreur lors de l'assignation du décodeur:", error);
    throw error;
  }
}

// Dissociation d'un décodeur d'un client
export async function unassignDecoderFromClient(codePermanent, address) {
  try {
    const res = await fetch(`${API_URL}/users/unassign-decoder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codePermanent, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la dissociation');
    return data;
  } catch (error) {
    console.error('Erreur lors de la dissociation du décodeur:', error);
    throw error;
  }
}

// Remplissage dynamique de la liste des décodeurs disponible à l'assignation
async function fillSelectDecoder() {
  const select = document.getElementById('select-decoder-to-assign');
  if (!select) return;

  select.innerHTML = '<option value = "">Chargement des décodeurs...</option>';

  try {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
    const users = await res.json();

    const assignments = {};
    users.forEach((user) => {
      if (user.decodeurs) {
        user.decodeurs.forEach((address) => {
          assignments[address] = user.nom;
          assignments[user] = user.id;
        });
      }
    });

    select.innerHTML = '<option value="">Sélectionnez un décodeur</option>';

    DECODER_ADDRESSES.forEach((address) => {
      const option = document.createElement('option');
      option.value = address;

      if (assignments[address]) {
        option.textContent = `${address} (Assigné à ${assignments[address]})`;
        option.disabled = true;
        option.style.color = 'gray';
      } else {
        option.textContent = address;
      }

      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erreur lors du remplissage de la liste des décodeurs:', error);
    select.innerHTML = '<option value="">Erreur de chargement</option>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const currentPath = window.location.pathname.split('/').pop();

  if (currentPath === 'client.html') {
    await displayClientDecoders();

    const btnOpen = document.getElementById('btn-assign-decoder');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => switchDisplay(true));
    }

    const btnCancel = document.getElementById('btn-cancel-assignation');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => switchDisplay(false));
    }

    const btnConfirm = document.getElementById('btn-confirm-assignation');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', async () => {
        const select = document.getElementById('select-decoder-to-assign');
        const address = select.value;
        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('id');

        if (!address) {
          alert('Sélectionnez un décodeur à assigner');
          return;
        }

        try {
          const resUser = await fetch(`${API_URL}/users`);
          const users = await resUser.json();
          const client = users.find((u) => String(u.id) === String(clientId));
          if (!client || !client.codePermanent) {
            throw new Error('Client ou code permanent introuvable');
          }

          await assignDecoderToClient(client.codePermanent, address);
          alert('Décodeur assigné avec succès');
          window.location.reload();
        } catch (error) {
          alert(error.message || "Erreur lors de l'assignation du décodeur");
        }
      });
    }
  }

  if (document.getElementById('listeUtilisateurs')) {
    await displayClients();
  }

  const btnCreateClient = document.getElementById('btn-create-client');
  if (btnCreateClient) {
    btnCreateClient.addEventListener('click', async (e) => {
      e.preventDefault();
      await createClient();
    });
  }
});
