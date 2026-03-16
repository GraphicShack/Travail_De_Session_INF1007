import Utilisateur from "./Utilisateur.js"

export default class Administrateur extends Utilisateur {

    // Constructeur pour initialiser les propriétés de l'administrateur
    constructor(id, nom, email, motDePasse){

        super(id, nom, email, motDePasse)

    }

    // Méthode pour consulter les utilisateurs
    consulterUtilisateurs(utilisateurs){

        return utilisateurs

    }

    // Méthode pour créer un nouveau décodeur
    creerDecodeur(numeroSerie){

        return {
            numeroSerie: numeroSerie
        }

    }

    // Méthode pour modifier un décodeur existant
    modifierDecodeur(decodeur){

        console.log("Decodeur modifié")

    }

    // Méthode pour supprimer un décodeur
    supprimerDecodeur(decodeur){

        console.log("Decodeur supprimé")

    }

}