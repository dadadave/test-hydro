// Données métier du module Test Fuite (étanchéité).
export const FUITE_MACHINES = [
  { id: "F1", label: "BAC 1" }, { id: "F2", label: "BAC 2" },
  { id: "F3", label: "BAC 3" }, { id: "F4", label: "BAC 4" },
];
export const FUITE_BOTTLE_TYPES = [
  { id: "6KG",    label: "6",    unit: "KG", sub: "6 kilogrammes" },
  { id: "12.5KG", label: "12.5", unit: "KG", sub: "12.5 kilogrammes" },
];
export const DETECTION_METHODS = [
  { id: "IMMERSION", label: "Immersion", sub: "Bain d'eau — bulles" },
  { id: "MOUSSE",    label: "Mousse",    sub: "Solution moussante" },
  { id: "CAPTEUR",   label: "Capteur",   sub: "Détecteur de gaz" },
];
export const FUITE_BATCH_SIZE = 10;
