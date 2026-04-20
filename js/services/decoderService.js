import { ACTIONS, API_URL, BASE_URL, DECODER_ADDRESSES } from '../utils/config.js';

// Validation de l'adresse IP du décodeur
export function isValidDecoderIp(ip) {
  return DECODER_ADDRESSES.includes(ip);
}

// Validation de l'action
function isValidAction(action) {
  return ACTIONS.includes(action);
}

// Fonction générique qui envoie une action (info / reset / reinit / shutdown)
async function decoderRequest(id, address, action) {
  // Validation des entrées
  if (!id) throw new Error('Code permanent manquant.');
  if (!isValidDecoderIp(address)) throw new Error('Adresse IP invalide.');
  if (!isValidAction(action)) throw new Error('Action invalide.');

  // Requête vers le serveur
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
    throw new Error('Réponse du serveur invalide.');
  }
  if (data.response !== 'OK') throw new Error(data.message || 'Erreur serveur');

  // Retour des données
  return data;
}

// Fonctions spécifiques pour chaque action (qui appellent la fonction générique)
export async function getDecoderInfo(id, address) {
  return decoderRequest(id, address, 'info');
}
export async function resetDecoder(id, address) {
  return decoderRequest(id, address, 'reset');
}
export async function reinitDecoder(id, address) {
  return decoderRequest(id, address, 'reinit');
}
export async function shutdownDecoder(id, address) {
  return decoderRequest(id, address, 'shutdown');
}

// Fonction infos
export async function getAllDecodersInfo(id) {
  const results = [];
  for (const address of DECODER_ADDRESSES) {
    try {
      results.push({ address, ...(await getDecoderInfo(id, address)) });
    } catch (e) {
      results.push({ address, response: 'Error', message: e.message });
    }
  }
  return results;
}

export async function assignChannelToDecoder(codePermanent, address, chaine) {
  try {
    const response = await fetch(`${API_URL}/decoder/assign-channel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codePermanent, address, chaine }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'assignation de la chaîne");
    }
    return data;
  } catch (error) {
    console.error('Erreur decoderService.assignChannelToDecoder:', error);
    throw error;
  }
}

export async function removeChannelFromDecoder(codePermanent, address, chaine) {
  try {
    const response = await fetch(`${API_URL}/decoder/remove-channel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codePermanent, address, chaine }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur lors du retrait de la chaîne');
    return data;
  } catch (error) {
    console.error('Erreur decoderService.removeChannelFromDecoder:', error);
    throw error;
  }
}
