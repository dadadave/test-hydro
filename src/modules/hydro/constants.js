// Données métier partagées : machines, types de bouteilles, zones de défaut.
export const MACHINES = [
  { id:"M1", label:"MEDIANNE 1" }, { id:"M2", label:"MEDIANNE 2" },
  { id:"M3", label:"MEDIANNE 3" }, { id:"M4", label:"MEDIANNE 4" },
];
export const BOTTLE_TYPES = [
  { id:"6KG",    label:"6",    unit:"KG", sub:"6 kilogrammes"    },
  { id:"12.5KG", label:"12.5", unit:"KG", sub:"12.5 kilogrammes" },
];
export const ZONES = [
  { id:"COL",  label:"Col",  full:"Collerette",   color:"#ef4444", col:"zone_col"  },
  { id:"MED",  label:"Med",  full:"Corps médian",  color:"#fb923c", col:"zone_med"  },
  { id:"GAL",  label:"Gal",  full:"Galbe",         color:"#a78bfa", col:"zone_gal"  },
  { id:"PIED", label:"Pied", full:"Fond / Pied",   color:"#60a5fa", col:"zone_pied" },
];
export const BATCH_SIZE = 10;
