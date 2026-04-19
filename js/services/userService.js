//import { validateEmail } from '../services/userService.js';
import { API_URL } from '../utils/config.js';

// Récupération de la liste des utilisateurs (pour la page admin)
export async function getClients() {
  try {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data || null;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return null;
  }
}

// Login
export async function signin(email, password) {
  const hashedPwd = hachageMotDePasse(password);

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse: hashedPwd }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }

    return data.user || data;
  } catch (error) {
    throw error;
  }
}

// Signup
export async function signup(nom, email, codePermanent, password) {
  const pwdHache = hachageMotDePasse(password);

  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom, email, codePermanent, motDePasse: pwdHache }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Erreur lors de l'inscription");
  }

  return data;
}

//Suppresion d'un client
export async function deleteClient(id) {
  try {
    const messageEl = document.getElementById('admin-message');
    const confirmation = confirm('Êtes-vous sûr de vouloir supprimer ce client ?');
    if (!confirmation) return;
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      messageEl.textContent = data.message || 'Erreur serveur';
      messageEl.className = 'error';
      return;
    }
    messageEl.textContent = 'Client supprimé avec succès';
    messageEl.className = 'success';
  } catch (error) {
    messageEl.textContent = 'Erreur serveur';
    messageEl.className = 'error';
  }
}

//Création d'un client
export async function createClient() {
  // Récupération des valeurs des champs et validation
  const nom = document.getElementById('client-name')?.value.trim();
  const email = document.getElementById('client-email')?.value.trim();
  const codePermanent = document.getElementById('client-code')?.value.trim();
  const motDePasse = document.getElementById('client-password')?.value.trim();
  const confirmPwd = document.getElementById('client-confirm-password')?.value.trim();
  const messageEl = document.getElementById('client-creation-message');

  // Réinitialisation du message d'erreur
  messageEl.textContent = '';
  messageEl.className = '';

  // Validation des champs
  if (!nom || !email || !codePermanent || !motDePasse || !confirmPwd) {
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

  // Vérification si l'email existe déjà
  if (await validateEmailAlreadyExists(email)) {
    messageEl.textContent = 'Email déjà utilisé';
    messageEl.className = 'error';
    return;
  }

  // Validation du mot de passe
  if (!validatePassword(motDePasse)) {
    messageEl.textContent = 'Mot de passe doit avoir au moins 8 caractères et une majuscule';
    messageEl.className = 'error';
    return;
  }

  // Validation de la confirmation du mot de passe
  if (motDePasse !== confirmPwd) {
    messageEl.textContent = 'Les mots de passe ne correspondent pas';
    messageEl.className = 'error';
    return;
  }

  // Hachage du mot de passe avant l'envoi
  const hashedPwd = hachageMotDePasse(motDePasse);

  // Envoi de la requête d'inscription au serveur
  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, motDePasse: hashedPwd, codePermanent }),
    });
    const data = await res.json();
    if (!res.ok) {
      messageEl.textContent = data.message || 'Erreur serveur';
      messageEl.className = 'error';
      return;
    }
    messageEl.textContent = 'Client créé avec succès';
    messageEl.className = 'success';
  } catch (err) {
    messageEl.textContent = 'Erreur serveur';
    messageEl.className = 'error';
  }
}

// Hachage du mot de passe
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

// Validation du mot de passe (au moins 8 caractères et une majuscule)
export function validatePassword(pwd) {
  return /^(?=.*[A-Z]).{8,}$/.test(pwd);
}

// Vérification auprès du serveur si l'email existe déjà
export function validateEmailAlreadyExists(email) {
  return fetch(`${API_URL}/check-email?email=${encodeURIComponent(email)}`)
    .then((res) => res.json())
    .then((data) => data.exists)
    .catch(() => false);
}

// Validation de l'email avec une regex simple
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/*
export async function signin(email, password) {
  const pwdHache = hachageMotDePasse(password);

  const res = await fetch(`${API_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pwdHache }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors de la connexion');
  }

  return data.user;
}
*/
