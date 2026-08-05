import { MODULES } from "./modules/registry";

// Coquille applicative. Un seul module actif pour l'instant (Test Hydrostatique),
// mais l'architecture (voir src/modules/registry.js) est prête à en accueillir d'autres.
export default function App() {
  const active = MODULES[0];
  const ModuleComponent = active.Component;
  return <ModuleComponent />;
}
