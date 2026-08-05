import { useState } from "react";
import { FUITE_MACHINES, FUITE_BOTTLE_TYPES, DETECTION_METHODS, FUITE_BATCH_SIZE } from "./constants";

// Module Test Fuite (étanchéité). Front-end autonome : sélection machine → options →
// contrôle (étanche / fuite). Données en mémoire pour l'instant (prêt à connecter à Supabase).
export default function FuiteModule({ onExit }) {
  const [screen, setScreen] = useState("machine"); // machine | options | control
  const [machine, setMachine] = useState(null);
  const [bottleType, setBottleType] = useState(null);
  const [method, setMethod] = useState("IMMERSION");
  const [params, setParams] = useState({
    date: new Date().toISOString().split("T")[0], pression: "10", duree: "60", op1: "", op2: "",
  });
  const [serials, setSerials] = useState(Array(FUITE_BATCH_SIZE).fill(""));
  const [checks, setChecks] = useState({}); // idx -> "etanche" | "fuite"

  const setP = (k, v) => setParams((p) => ({ ...p, [k]: v }));
  const setSerial = (i, raw) => {
    const val = raw.replace(/\D/g, "");
    setSerials((prev) => { const next = [...prev]; next[i] = val; return next; });
  };
  const mark = (i, val) =>
    setChecks((prev) => ({ ...prev, [i]: prev[i] === val ? undefined : val }));

  const filled = serials.map((s, i) => (s.trim() ? i : null)).filter((i) => i !== null);
  const nEtanche = filled.filter((i) => checks[i] === "etanche").length;
  const nFuite = filled.filter((i) => checks[i] === "fuite").length;
  const taux = nEtanche + nFuite > 0 ? Math.round((nEtanche / (nEtanche + nFuite)) * 100) : null;
  const methodLabel = DETECTION_METHODS.find((m) => m.id === method)?.label || method;

  /* ── Écran 1 : sélection de la machine ── */
  if (screen === "machine") return (
    <div className="fs">
      <div className="fs-grid" />
      <button className="btn btn-gh btn-sm mod-back" onClick={onExit}>◀ Modules</button>
      <div className="fs-badge">💧 TEST D'ÉTANCHÉITÉ</div>
      <div className="fs-title">TEST <span>FUITE</span></div>
      <div className="fs-sub">DÉTECTION DES FUITES — CONTRÔLE QUALITÉ</div>
      <div className="card">
        <div className="card-lbl">Sélectionnez le poste de contrôle</div>
        <div className="machine-grid">
          {FUITE_MACHINES.map((m) => (
            <button key={m.id} className={`m-btn${machine?.id === m.id ? " sel" : ""}`} onClick={() => setMachine(m)}>
              {machine?.id === m.id && <span className="m-check">✓</span>}
              <div className="m-name">{m.label}</div>
              <div className="m-tag">ÉTANCHÉITÉ</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn-a" style={{ opacity: machine ? 1 : 0.35 }}
            onClick={() => { if (machine) setScreen("options"); }}>OPTIONS →</button>
        </div>
      </div>
    </div>
  );

  /* ── Écran 2 : options du test fuite ── */
  if (screen === "options") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">💧 {machine?.label}</div>
        <div className="chip tc">🫙 <span>{bottleType || "type ?"}</span></div>
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={() => setScreen("machine")}>← Poste</button>
          <button className="btn btn-gh btn-sm" onClick={onExit}>◀ Modules</button>
        </div>
      </div>
      <div className="center-body">
        <div className="form-card" style={{ maxWidth: 720 }}>
          <div className="form-title">Options du test fuite</div>
          <div className="form-sub">TYPE, MÉTHODE DE DÉTECTION, PARAMÈTRES & OPÉRATEURS</div>

          <div className="op-section-title" style={{ marginBottom: 8 }}>🫙 Type de bouteille</div>
          <div className="btype-grid">
            {FUITE_BOTTLE_TYPES.map((bt) => (
              <button key={bt.id} className={`bt-btn${bottleType === bt.id ? " sel" : ""}`} onClick={() => setBottleType(bt.id)}>
                {bottleType === bt.id && <span className="bt-check">✓</span>}
                <div className="bt-kg">{bt.label}</div>
                <div className="bt-unit">{bt.unit}</div>
                <div className="bt-desc">{bt.sub}</div>
              </button>
            ))}
          </div>

          <div className="op-section-title" style={{ marginBottom: 8 }}>🔎 Méthode de détection</div>
          <div className="machine-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {DETECTION_METHODS.map((m) => (
              <button key={m.id} className={`m-btn${method === m.id ? " sel" : ""}`} onClick={() => setMethod(m.id)}>
                {method === m.id && <span className="m-check">✓</span>}
                <div className="m-name" style={{ fontSize: 18 }}>{m.label}</div>
                <div className="m-tag">{m.sub}</div>
              </button>
            ))}
          </div>

          <div className="op-section">
            <div className="op-section-title">👥 Opérateurs</div>
            <div className="op-row">
              <div className="op-field"><label className="op-lbl">Opérateur 1</label>
                <input className="op-inp" placeholder="Nom opérateur 1" value={params.op1} onChange={(e) => setP("op1", e.target.value)} /></div>
              <div className="op-field"><label className="op-lbl">Opérateur 2</label>
                <input className="op-inp" placeholder="Nom opérateur 2" value={params.op2} onChange={(e) => setP("op2", e.target.value)} /></div>
            </div>
          </div>

          <div className="pg" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="pf"><label className="pf-lbl">📅 Date</label>
              <input type="date" className="pf-inp" value={params.date} onChange={(e) => setP("date", e.target.value)} /></div>
            <div className="pf"><label className="pf-lbl">⚙ Pression (bars)</label>
              <input className="pf-inp" value={params.pression} onChange={(e) => setP("pression", e.target.value)} /></div>
            <div className="pf"><label className="pf-lbl">⏱ Observation (s)</label>
              <input className="pf-inp" value={params.duree} onChange={(e) => setP("duree", e.target.value)} /></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <button className="btn btn-gh" onClick={() => setScreen("machine")}>← Retour</button>
            <button className="btn btn-a" style={{ opacity: bottleType ? 1 : 0.35 }}
              onClick={() => { if (bottleType) setScreen("control"); }}>COMMENCER →</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Écran 3 : contrôle étanche / fuite ── */
  return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">💧 {machine?.label}</div>
        <div className="chip tc">🫙 <span>{bottleType}</span></div>
        <div className="chips">
          <div className="chip">🔎 <span>{methodLabel}</span></div>
          <div className="chip">⚙ <span>{params.pression} bar</span></div>
          <div className="chip">⏱ <span>{params.duree}s</span></div>
        </div>
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={() => setScreen("options")}>← Options</button>
          <button className="btn btn-gh btn-sm" onClick={onExit}>◀ Modules</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="sc2"><div className="sv bl">{filled.length}</div><div className="sl">Saisies</div></div>
        <div className="sc2"><div className="sv gr">{nEtanche}</div><div className="sl">✓ Étanches</div></div>
        <div className="sc2"><div className="sv re">{nFuite}</div><div className="sl">✗ Fuites</div></div>
        <div className="sc2"><div className="sv am">{taux !== null ? taux + "%" : "—"}</div><div className="sl">Étanchéité</div></div>
        <div className="sc2" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="formula">
            <span className="fop">[</span><span style={{ color: "#60a5fa" }}>{nEtanche + nFuite}</span>
            <span className="fop">−</span><span style={{ color: "#ef4444" }}>{nFuite}</span>
            <span className="fop">=</span><span style={{ color: "#10b981" }}>{nEtanche}</span>
            <span className="fop">]</span>
          </div>
        </div>
      </div>

      <div className="ctrl-body">
        {serials.map((val, i) => {
          const st = checks[i];
          return (
            <div className={`b-row${st === "etanche" ? " bok" : st === "fuite" ? " bnok" : ""}`} key={i}>
              <div className="b-i">{i + 1}</div>
              <div className="b-n" style={{ minWidth: 90 }}>
                <input type="text" inputMode="numeric" pattern="[0-9]*" className="sc-inp" placeholder="N° série"
                  value={val} maxLength={10} onChange={(e) => setSerial(i, e.target.value)}
                  style={{ background: "transparent", border: "none", padding: 0, textAlign: "left" }} />
              </div>
              <div className="b-ctrl">
                <button className={`z-btn${st === "etanche" ? " aS" : ""}`} onClick={() => mark(i, "etanche")}>✓ Étanche</button>
                <button className={`z-btn${st === "fuite" ? " aCOL" : ""}`} onClick={() => mark(i, "fuite")}>✗ Fuite</button>
              </div>
              <div className={`b-st${st === "etanche" ? " bok" : st === "fuite" ? " bnok" : " none"}`}>
                {st === "etanche" ? "✓ ÉTANCHE" : st === "fuite" ? "✗ FUITE" : "— attente"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bot-bar">
        <div className="fpill">
          <span style={{ color: "#5a6a82" }}>ÉTANCHÉITÉ : </span>
          <span style={{ color: "#10b981" }}>{nEtanche}</span>
          <span style={{ color: "#5a6a82" }}> / </span>
          <span style={{ color: "#60a5fa" }}>{nEtanche + nFuite}</span>
          {taux !== null && <span style={{ color: "var(--amber)", marginLeft: 6 }}>{taux}%</span>}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button className="btn btn-gh btn-sm"
            onClick={() => { setSerials(Array(FUITE_BATCH_SIZE).fill("")); setChecks({}); }}>↺ Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}
