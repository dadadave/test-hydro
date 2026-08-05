import { useState, useEffect } from "react";
import { MODULES } from "./modules/registry";
import ModuleLauncher from "./ModuleLauncher";
import { injectCSS } from "./shared/styles";

// Coquille applicative.
// - Aucune sélection : affiche le lanceur qui liste les modules (Test Hydro, Test Fuite, …).
// - Un module sélectionné : monte son composant, avec onExit pour revenir au lanceur.
export default function App() {
  useEffect(() => { injectCSS(); }, []);
  const [activeId, setActiveId] = useState(null);

  const active = MODULES.find((m) => m.id === activeId);
  if (!active) {
    return <ModuleLauncher modules={MODULES} onSelect={setActiveId} />;
  }

  const ModuleComponent = active.Component;
  return <ModuleComponent onExit={() => setActiveId(null)} />;
}
