// ==========================
// Constantes et configurations
// ==========================
/* Déplacés dans config.js
const BASE_URL = 'http://localhost:3000/api/decoder';
const API_URL = 'http://localhost:3000/api';
const DECODER_ADDRESSES = Array.from({ length: 12 }, (_, i) => `127.0.10.${i + 1}`);
const ACTIONS = ['info', 'reset', 'reinit', 'shutdown'];
*/

// ==========================
// Gestion utilisateur
// ==========================

// getUser dans authController.js

// setUser dans authController.js

// logout dans autController.js

// Bouton de déconnexion dans authController.js

// ==========================
// API Décodeur : appels via backend (vérifier si notre server node run avant)
// ==========================

// isValideDecoderIp dans decoderService.js

// isValidAction dans decoderSerice.js

// decoderRequest dans decoderService.js

// getDecoderInfo, resetDecoder, reinitDecoder, shutdownDecoder dans decoderService.js

// getAllDecodersInfo dans decoderService.js

// ==========================
// Fonctions d'interface
// ==========================
// majEtatDepuisInfo dans decoderController.js

// lireCodeEtAdresseDepuisPage dans decoderController.js

// ==========================
// Boutons page Décodeurs
// ==========================

// boutonAfficherClique dans decoderController.js

// boutonResetClique dans decoderController.js

// boutonReinitClique dans decoderController.js

// boutonShutdownClique dans decoderController.js

// msg(texte, type = 'info') dans decoderController.js

// ==========================
// Signin / Signup
// ==========================

//Validation des champs de formulaire

// validateEmail dans userService.js

// validateEmailAldreadyExists dans userService.js

// validatePassword dans userService.js

// hachageMotDePasse dans userService.js

// signup dans userService.js

// signin dans userService.js

// ==========================
// Admin
// ==========================

// displayClients dans clientController.js

// getClients dans userService.js

// createClientLine dans clientController.js

// createClient dans userService.js

// deleteClient dans userService.js

// ==========================
// Page client
// ==========================

// getClient(id) dans clientController.js

// displayClientInfo dans clientController.js

// fillClientInfos(user) dans clientController.js

// fillClientInfosInputs(user) dans clientController.js

// displayeCLientEditForm(userId) dans clientController.js

// editClient(userId) dans clientController.js

// displayClientDecoders dans decoderController.js

// switchDisplay dans clientController.js

// assignDecoderToClient dans clientController.js

// unassignDecoderFromClient dans clientController.js

// fillSelectDecoder dans clientController.js

// ==========================
// Dashboard / UI
// ==========================

// displayUserInfo dans dashboardController.js

// displayUserSummary dans dashbordController.js

// displayUserDecoders dans decoderController.js

// displayNav dans dashboardController.js

// highlightActiveLink dans dashboardController.js

// ==========================
// Initialisation DOM (tous les écrans)
// ==========================

// initialiserUI dans decoderController.js

// initialiserSelectionParUtilisateur dans decoderController.js

// chargerDecodeurDepuisSelectionUser dans decoderController.js

// Initialisation au chargement de la page
/*document.addEventListener('DOMContentLoaded', async () => {
  // initialiserUI(); // dans decoderController.js
  // displayUserInfo(); // dans dashboardController.js
  // await displayUserSummary(); // dans dashboardController.js
  displayUserDecoders();
  // displayNav(); // dans dashboardController.js
  // highlightActiveLink();  // dans dashboardController.js
  //await displayClients(); // dans clientController.js
});*/

// Exposition des fonctions API pour les boutons de la page
/*window.DecodeurAPI = {
  getDecoderInfo,
  resetDecoder,
  reinitDecoder,
  shutdownDecoder,
  getAllDecodersInfo,
  signin,
  signup,
  logout,
};*/
