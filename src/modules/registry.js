import hydroModule from "./hydro";

// Registre central des modules de l'application.
// Pour ajouter un module : créer src/modules/<nom>/ avec un descripteur
// (id, name, icon, description, Component) puis l'ajouter à ce tableau.
export const MODULES = [
  hydroModule,
];
