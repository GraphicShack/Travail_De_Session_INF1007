export default class Contenu {

    // Constructeur pour initialiser les propriétés du contenu
    constructor(id, nom, description){
        this.id = id
        this.nom = nom
        this.description = description
    }

    // Méthode pour modifier les propriétés du contenu
    modifier(nom, description){
        this.nom = nom
        this.description = description
    }

}