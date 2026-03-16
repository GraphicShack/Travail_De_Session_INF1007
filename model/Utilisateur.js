export default class Utilisateur {

    // Constructeur pour initialiser les propriétés de l'utilisateur
    constructor(id, nom, email, motDePasse){

        this.id = id
        this.nom = nom
        this.email = email
        this.motDePasse = motDePasse
        this.decodeurs = []

    }

    // Méthode pour authentifier l'utilisateur
    authentifier(motDePasse){

        return this.motDePasse === motDePasse

    }

    // Méthode pour consulter les décodeurs associés à l'utilisateur
    consulterDecodeurs(){

        return this.decodeurs

    }

    // Méthodes pour gérer les décodeurs associés à l'utilisateur
    ajouterDecodeur(decodeur){

        this.decodeurs.push(decodeur)

    }

}