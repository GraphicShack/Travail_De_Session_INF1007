import { EtatDecodeur } from "./EtatDecodeur.js"
import Operation from "./Operation.js"

export default class Decodeur {

    // Constructeur pour initialiser les propriétés du décodeur
    constructor(id, numeroSerie, address){

        this.id = id
        this.numeroSerie = numeroSerie
        this.etat = EtatDecodeur.ETEINT
        this.operations = []
        this.contenus = []
        // Pour l'api du prof, exemple : adresse : 127.0.10.X, X étant le numéro de série du décodeur
        this.adresse = address

    }

    // Méthode pour obtenir l'état actuel du décodeur
    obtenirEtat(){

        return this.etat

    }

    // Méthode pour redémarrer le décodeur
    redemarrer(){

        let op = new Operation(this.operations.length + 1, "REDEMARRAGE")

        this.operations.push(op)

        this.etat = EtatDecodeur.EN_REDEMARRAGE

        return op

    }

    // Méthode pour réinitialiser le décodeur
    reinitialiser(){

        let op = new Operation(this.operations.length + 1, "REINITIALISATION")

        this.operations.push(op)

        return op

    }

    // Méthode pour éteindre le décodeur
    eteindre(){

        let op = new Operation(this.operations.length + 1, "EXTINCTION")

        this.operations.push(op)

        this.etat = EtatDecodeur.ETEINT

        return op

    }

}