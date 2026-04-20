import { EtatDecodeur } from './EtatDecodeur.js';
import Operation from './Operation.js';

export default class Decodeur {
  // Constructeur pour initialiser les propriétés du décodeur
  constructor(id, numeroSerie, address) {
    this.id = id;
    this.numeroSerie = numeroSerie;
    this.etat = EtatDecodeur.ETEINT;
    this.operations = [];
    this.contenus = [];
    // Pour l'api du prof, exemple : adresse : 127.0.10.X, X étant le numéro de série du décodeur
    this.adresse = address;
    this.observateurs = [];
  }

  // Méthode pour obtenir l'état actuel du décodeur
  obtenirEtat() {
    return this.etat;
  }

  // Permet à un observateur de s'abonner aux changements d'état
  ajouterObservateur(callback) {
    if (typeof callback === 'function' && !this.observateurs.includes(callback)) {
      this.observateurs.push(callback);
    }
  }

  // Permet de se désabonner
  retirerObservateur(callback) {
    this.observateurs = this.observateurs.filter((obs) => obs !== callback);
  }

  // Notifie les observateurs + émet un événement global navigateur
  notifierChangementEtat(ancienEtat, nouvelEtat) {
    const payload = {
      decodeurId: this.id,
      numeroSerie: this.numeroSerie,
      adresse: this.adresse,
      ancienEtat,
      nouvelEtat,
      date: new Date().toISOString(),
    };

    this.observateurs.forEach((obs) => {
      try {
        obs(payload);
      } catch (error) {
        console.error('Erreur observateur décodeur:', error);
      }
    });
  }

  // Méthode générique pour changer l'état et notifier les observateurs
  changerEtat(nouvelEtat) {
    if (!nouvelEtat || this.etat === nouvelEtat) return false;

    const ancienEtat = this.etat;
    this.etat = nouvelEtat;
    this.notifierChangementEtat(ancienEtat, this.etat);

    return true;
  }

  // Méthode pour redémarrer le décodeur
  redemarrer() {
    let op = new Operation(this.operations.length + 1, 'REDEMARRAGE');

    this.operations.push(op);

    this.changerEtat(EtatDecodeur.EN_REDEMARRAGE);

    return op;
  }

  // Méthode pour réinitialiser le décodeur
  reinitialiser() {
    let op = new Operation(this.operations.length + 1, 'REINITIALISATION');

    this.operations.push(op);

    return op;
  }

  // Méthode pour éteindre le décodeur
  eteindre() {
    let op = new Operation(this.operations.length + 1, 'EXTINCTION');

    this.operations.push(op);

    this.changerEtat(EtatDecodeur.ETEINT);

    return op;
  }
}
