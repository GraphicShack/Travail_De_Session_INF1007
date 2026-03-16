import { StatutOperation } from "./StatutOperation.js"

export default class Operation {

    // Constructeur pour initialiser les propriétés de l'opération
    constructor(id, type){

        this.id = id
        this.type = type
        this.statut = StatutOperation.EN_COURS
        this.dateDebut = new Date()
        this.dateFin = null

    }

    // Méthode pour démarrer l'opération
    demarrer(){

        this.statut = StatutOperation.EN_COURS
        this.dateDebut = new Date()

    }

    // Méthode pour terminer l'opération
    terminer(){

        this.statut = StatutOperation.COMPLETEE
        this.dateFin = new Date()

    }

    notifierUtilisateur(){

        alert("L'opération est terminée")

    }

}