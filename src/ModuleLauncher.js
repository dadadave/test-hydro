// Page d'accueil : lanceur qui liste les modules du registre.
// Sélectionner un module appelle onSelect(id) ; App monte alors le module.
export default function ModuleLauncher({ modules, onSelect }) {
  return (
    <div className="fs">
      <div className="fs-grid" />
      <div className="fs-badge">⚙ WONDERFUL METAL · QC</div>
      <div className="fs-title">CONTRÔLE <span>QUALITÉ</span></div>
      <div className="fs-sub">SÉLECTIONNEZ UN MODULE</div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-lbl">Modules disponibles</div>
        <div className="mods-grid">
          {modules.map((m) => {
            const available = m.available !== false;
            return (
              <button
                key={m.id}
                className={`mod-card${available ? "" : " soon"}`}
                style={{ "--accent": m.accent || "var(--amber)" }}
                onClick={() => available && onSelect(m.id)}
                disabled={!available}
              >
                <div className="mod-ic">{m.icon}</div>
                <div className="mod-body">
                  <div className="mod-name">{m.name}</div>
                  <div className="mod-desc">{m.description}</div>
                  {!available && <span className="mod-tag">Bientôt</span>}
                </div>
                <div className="mod-arrow">{available ? "→" : ""}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
