import hydroModule from "./hydro";
import fuiteModule from "./fuite";

// Registre central des modules de l'application (affichés sur la page d'accueil).
// Pour ajouter un module : créer src/modules/<nom>/ avec un descripteur
// (id, name, icon, accent, description, Component) puis l'ajouter à ce tableau.
// Un module avec `available: false` s'affiche grisé (« Bientôt »).
export const MODULES = [
  hydroModule,
  fuiteModule,
];
