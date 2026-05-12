import { useState, useRef, useCallback, useEffect } from "react";

function useXLSX() {
  const [xlsx, setXlsx] = useState(null);
  useEffect(() => {
    if (window.XLSX) { setXlsx(window.XLSX); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setXlsx(window.XLSX);
    document.head.appendChild(s);
  }, []);
  return xlsx;
}

const MACHINES = [
  { id: "M1", label: "MEDIANNE 1" },
  { id: "M2", label: "MEDIANNE 2" },
  { id: "M3", label: "MEDIANNE 3" },
  { id: "M4", label: "MEDIANNE 4" },
];

const BOTTLE_TYPES = [
  { id: "6KG",    label: "6",    unit: "KG", sub: "Bouteille 6 kilogrammes"    },
  { id: "12.5KG", label: "12.5", unit: "KG", sub: "Bouteille 12.5 kilogrammes" },
];

const ZONES = [
  { id: "COL",  label: "Col",  full: "Collerette",     color: "#ef4444" },
  { id: "MED",  label: "Med",  full: "Corps médian",   color: "#fb923c" },
  { id: "GAL",  label: "Gal",  full: "Galbe (épaule)", color: "#a78bfa" },
  { id: "PIED", label: "Pied", full: "Fond / Pied",    color: "#60a5fa" },
];

const BATCH_SIZE = 10;

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root {
  --bg:#0e1015;--bg2:#161b24;--bg3:#1e2530;--border:#2a3444;
  --amber:#f59e0b;--amber2:#fcd34d;--green:#10b981;--red:#ef4444;
  --blue:#60a5fa;--purple:#a78bfa;--orange:#fb923c;
  --text:#e8edf5;--muted:#5a6a82;--light:#8fa0ba;
  --mono:'IBM Plex Mono',monospace;--disp:'Bebas Neue',sans-serif;--body:'DM Sans',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;}
body{font-family:var(--body);background:var(--bg);color:var(--text);overflow-x:hidden;}

.fs-screen{
  min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:32px 24px;
  background:radial-gradient(ellipse 80% 70% at 50% 40%,#1a2a3a 0%,#0e1015 100%);
  position:relative;overflow:hidden;
}
.fs-grid{position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px),
             repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px);}
.fs-badge{font-family:var(--mono);font-size:10px;letter-spacing:3px;color:var(--amber);
  border:1px solid rgba(245,158,11,.35);padding:5px 18px;border-radius:2px;
  background:rgba(245,158,11,.06);margin-bottom:24px;text-transform:uppercase;}
.fs-title{font-family:var(--disp);font-size:clamp(38px,6vw,72px);color:var(--text);
  letter-spacing:4px;text-align:center;line-height:1;margin-bottom:8px;}
.fs-title span{color:var(--amber);}
.fs-sub{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:2px;
  text-align:center;margin-bottom:36px;}

/* ── MACHINE SELECTION ── */
.sel-card{background:rgba(22,27,36,.97);border:1px solid var(--border);border-radius:4px;
  padding:32px 40px;width:100%;max-width:700px;
  box-shadow:0 24px 48px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.08);}
.sel-lbl{font-family:var(--mono);font-size:10px;color:var(--amber);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:18px;display:block;}

.machine-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;}
.machine-btn{
  background:var(--bg3);border:2px solid var(--border);border-radius:4px;
  padding:28px 16px;cursor:pointer;transition:all .18s;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  position:relative;overflow:hidden;
}
.machine-btn:hover{border-color:rgba(245,158,11,.5);transform:translateY(-2px);
  box-shadow:0 6px 20px rgba(0,0,0,.4);}
.machine-btn.selected{
  border-color:var(--amber);background:rgba(245,158,11,.08);
  box-shadow:0 0 0 3px rgba(245,158,11,.18),0 6px 20px rgba(0,0,0,.4);
}
.machine-name{font-family:var(--disp);font-size:clamp(24px,3.5vw,34px);letter-spacing:3px;color:var(--amber2);}
.machine-check{position:absolute;top:8px;right:10px;font-size:16px;color:var(--amber);}
.machine-tag{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 8px;border-radius:2px;background:rgba(245,158,11,.06);}

/* ── BOTTLE TYPE ── */
.btype-card{background:rgba(22,27,36,.97);border:1px solid var(--border);border-radius:4px;
  padding:40px 52px;width:100%;max-width:640px;
  box-shadow:0 24px 48px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.08);}
.btype-context{font-family:var(--disp);font-size:14px;letter-spacing:4px;color:var(--amber);
  text-align:center;margin-bottom:6px;}
.btype-title{font-family:var(--disp);font-size:clamp(26px,4vw,38px);color:var(--text);
  letter-spacing:3px;text-align:center;margin-bottom:6px;}
.btype-sub{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:2px;
  text-align:center;margin-bottom:36px;}
.btype-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px;}
.btype-btn{
  background:var(--bg3);border:2px solid var(--border);border-radius:6px;
  padding:40px 16px 28px;cursor:pointer;transition:all .2s;
  display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;overflow:hidden;
}
.btype-btn:hover{border-color:var(--amber);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4);}
.btype-btn.selected{border-color:var(--amber);background:rgba(245,158,11,.1);
  box-shadow:0 0 0 3px rgba(245,158,11,.2),0 8px 24px rgba(0,0,0,.4);}
.btype-kg{font-family:var(--disp);font-size:clamp(56px,10vw,92px);letter-spacing:2px;color:var(--amber2);line-height:1;}
.btype-unit{font-family:var(--mono);font-size:12px;color:var(--amber);letter-spacing:4px;margin-top:-2px;}
.btype-desc{font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:10px;}
.btype-check{position:absolute;top:10px;right:12px;font-size:18px;color:var(--amber);}

/* ── SHARED LAYOUT ── */
.page{min-height:100vh;display:flex;flex-direction:column;}
.top-bar{background:var(--bg2);border-bottom:2px solid var(--amber);
  padding:12px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex-shrink:0;}
.top-machine{font-family:var(--disp);font-size:22px;letter-spacing:3px;color:var(--amber);}
.chips{display:flex;gap:8px;flex-wrap:wrap;}
.chip{font-family:var(--mono);font-size:10px;color:var(--light);
  background:rgba(255,255,255,.04);border:1px solid var(--border);padding:3px 9px;border-radius:2px;}
.chip span{color:var(--amber2);font-weight:700;}
.chip.type-chip{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.07);}
.chip.type-chip span{color:var(--amber);}
.top-right{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}

.center-body{flex:1;display:flex;align-items:center;justify-content:center;padding:32px 20px;}
.form-card{background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  padding:36px;width:100%;max-width:700px;box-shadow:0 8px 32px rgba(0,0,0,.3);}
.form-title{font-family:var(--disp);font-size:28px;letter-spacing:2px;color:var(--text);margin-bottom:4px;}
.form-sub{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;margin-bottom:24px;}
.params-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;}
.pf{display:flex;flex-direction:column;gap:5px;}
.pf-lbl{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.pf-inp{background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);
  font-family:var(--mono);font-size:14px;font-weight:600;padding:9px 12px;outline:none;
  transition:border .15s,box-shadow .15s;width:100%;}
.pf-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.12);}
.divider{grid-column:1/-1;height:1px;background:rgba(42,52,68,.9);margin:4px 0;}

.serial-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;}
.serial-cell{display:flex;flex-direction:column;gap:5px;}
.serial-num{font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;}
.serial-inp{background:var(--bg3);border:2px solid var(--border);border-radius:3px;
  color:var(--amber2);font-family:var(--mono);font-size:15px;font-weight:700;
  padding:9px 10px;outline:none;text-align:center;letter-spacing:1px;
  transition:border .15s,box-shadow .15s;width:100%;}
.serial-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.15);}
.serial-inp::placeholder{color:var(--border);font-size:11px;font-weight:400;}
.serial-inp.filled{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.04);}
.progress-wrap{height:3px;background:var(--bg3);border-radius:2px;margin-bottom:20px;}
.progress-bar{height:3px;background:var(--amber);border-radius:2px;transition:width .3s;}

.ctrl-body{flex:1;overflow:auto;padding:16px 24px;display:flex;flex-direction:column;gap:7px;}
.bottle-row{background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  display:flex;align-items:center;overflow:hidden;transition:border-color .15s;}
.bottle-row.is-ok {border-color:rgba(16,185,129,.45);}
.bottle-row.is-nok{border-color:rgba(239,68,68,.4);}
.b-idx{font-family:var(--mono);font-size:11px;color:var(--muted);width:34px;text-align:center;flex-shrink:0;}
.b-num{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--amber2);
  width:150px;flex-shrink:0;padding:12px 14px;letter-spacing:1px;border-right:1px solid var(--border);}
.b-controls{display:flex;align-items:center;gap:7px;padding:8px 14px;flex:1;flex-wrap:wrap;}
.b-sep{color:var(--border);font-family:var(--mono);font-size:14px;user-select:none;}
.zone-btn{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:1px;
  padding:7px 12px;border:2px solid var(--border);border-radius:3px;
  cursor:pointer;background:var(--bg3);color:var(--muted);
  transition:all .15s;text-transform:uppercase;white-space:nowrap;user-select:none;}
.zone-btn:hover{border-color:var(--light);color:var(--text);}
.zone-btn.active-S   {background:rgba(16,185,129,.18);border-color:#10b981;color:#10b981;}
.zone-btn.active-COL {background:rgba(239,68,68,.18);border-color:#ef4444;color:#ef4444;}
.zone-btn.active-MED {background:rgba(251,146,60,.18);border-color:#fb923c;color:#fb923c;}
.zone-btn.active-GAL {background:rgba(167,139,250,.18);border-color:#a78bfa;color:#a78bfa;}
.zone-btn.active-PIED{background:rgba(96,165,250,.18);border-color:#60a5fa;color:#60a5fa;}
.b-status{padding:0 14px;flex-shrink:0;font-family:var(--mono);font-size:10px;font-weight:700;
  letter-spacing:1px;min-width:120px;text-align:right;}
.b-status.ok  {color:#10b981;}
.b-status.nok {color:#ef4444;}
.b-status.none{color:var(--muted);}

.validate-bar{background:var(--bg2);border-top:1px solid var(--border);
  padding:12px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex-shrink:0;}
.val-info{font-family:var(--mono);font-size:11px;color:var(--muted);}
.val-info span{color:var(--amber2);font-weight:700;}
.val-warning{font-family:var(--mono);font-size:10px;color:#fb923c;margin-left:6px;}

.recap-wrap{flex:1;overflow:auto;padding:16px 24px;}
.recap-section{margin-bottom:24px;}
.recap-lot-header{font-family:var(--mono);font-size:10px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:7px 12px;background:var(--bg3);border:1px solid var(--border);
  border-radius:3px 3px 0 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.lh-num{color:var(--amber);font-weight:700;}
.lh-ok{color:#10b981;}
.lh-nok{color:#ef4444;}
.recap-table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:12px;}
.recap-table thead th{background:rgba(30,37,48,.9);border:1px solid var(--border);padding:6px 10px;
  text-align:center;font-size:9px;letter-spacing:1px;text-transform:uppercase;}
.recap-table thead th.th-num{text-align:left;color:var(--light);}
.recap-table thead th.th-ok{color:#10b981;}
.recap-table thead th.th-err{color:#ef4444;background:rgba(239,68,68,.05);}
.recap-table tbody td{padding:6px 10px;border:1px solid rgba(42,52,68,.5);text-align:center;}
.recap-table tbody tr:hover td{background:rgba(245,158,11,.03);}
.recap-table tbody tr:nth-child(even) td{background:rgba(255,255,255,.012);}
.td-i{color:var(--muted);font-size:10px;width:30px;}
.td-num{text-align:left!important;color:var(--amber2);font-weight:700;font-size:13px;letter-spacing:1px;}
.mk-s{color:#10b981;font-size:16px;font-weight:900;}
.mk-x{font-size:13px;font-weight:900;}
.mk-col{color:#ef4444;}.mk-med{color:#fb923c;}.mk-gal{color:#a78bfa;}.mk-pied{color:#60a5fa;}

.stats-row{display:flex;background:var(--bg3);border-bottom:1px solid var(--border);flex-shrink:0;}
.stat-cell{flex:1;padding:10px 18px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:2px;}
.stat-cell:last-child{border-right:none;flex:2;flex-direction:row;align-items:center;justify-content:center;gap:8px;}
.sv{font-family:var(--disp);font-size:30px;letter-spacing:1px;line-height:1;}
.sv.blue{color:var(--blue);}.sv.green{color:var(--green);}.sv.red{color:var(--red);}.sv.amber{color:var(--amber);}
.sl{font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.formula{font-family:var(--mono);font-size:15px;font-weight:700;display:flex;gap:5px;align-items:center;}
.f-op{color:var(--muted);}

.legend{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-family:var(--mono);font-size:10px;
  color:var(--muted);padding:7px 24px;background:rgba(0,0,0,.2);border-bottom:1px solid var(--border);flex-shrink:0;}
.legend-item{display:flex;align-items:center;gap:5px;}
.ldot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}

.zone-stats{display:flex;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;overflow:hidden;}
.zone-stat-card{flex:1;padding:10px 14px;border-right:1px solid var(--border);position:relative;overflow:hidden;}
.zone-stat-card:last-child{border-right:none;}
.zs-bar{position:absolute;bottom:0;left:0;height:3px;transition:width .5s ease;}
.zs-zone{font-family:var(--mono);font-size:8px;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px;font-weight:700;}
.zs-count{font-family:var(--disp);font-size:28px;letter-spacing:1px;line-height:1;margin-bottom:1px;}
.zs-full{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.zs-pcts{display:flex;gap:8px;flex-wrap:wrap;}
.zs-pct{font-family:var(--mono);font-size:10px;font-weight:700;padding:2px 7px;border-radius:2px;border:1px solid;}
.zs-pct.of-nok{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);color:#f87171;}
.zs-pct.of-total{background:rgba(90,106,130,.08);border-color:rgba(90,106,130,.3);color:var(--light);}
.zs-label{font-family:var(--mono);font-size:8px;color:var(--muted);}

.bottom-bar{background:var(--bg2);border-top:1px solid var(--border);
  padding:12px 24px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0;}
.formula-pill{font-family:var(--mono);font-size:14px;font-weight:700;
  background:var(--bg3);border:1px solid var(--border);padding:7px 16px;border-radius:3px;letter-spacing:1px;}

.btn{font-family:var(--disp);font-size:16px;letter-spacing:2px;padding:10px 22px;border-radius:3px;cursor:pointer;border:none;transition:all .15s;}
.btn-amber{background:var(--amber);color:#0e1015;}
.btn-amber:hover{background:var(--amber2);}
.btn-amber:disabled{opacity:.35;cursor:not-allowed;}
.btn-green{background:rgba(16,185,129,.12);color:#10b981;border:1px solid #10b981;}
.btn-green:hover{background:rgba(16,185,129,.22);}
.btn-ghost{background:none;color:var(--muted);border:1px solid var(--border);font-size:13px;}
.btn-ghost:hover{border-color:var(--light);color:var(--text);}

.toast-wrap{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;gap:6px;pointer-events:none;}
.toast{background:var(--bg2);border:1px solid #10b981;border-left:4px solid #10b981;
  color:var(--text);padding:10px 18px;border-radius:3px;font-family:var(--mono);font-size:12px;
  min-width:240px;animation:toastIn .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.5);}
.toast.err{border-color:#ef4444;border-left-color:#ef4444;}
@keyframes toastIn{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}

@media(max-width:640px){
  .machine-grid{grid-template-columns:1fr 1fr;}
  .btype-grid{grid-template-columns:1fr 1fr;}
  .params-grid,.serial-grid{grid-template-columns:repeat(2,1fr);}
  .stats-row{flex-wrap:wrap;}
  .stat-cell{min-width:50%;}
  .b-num{width:100px;font-size:12px;}
  .b-status{display:none;}
  .sel-card,.btype-card{padding:24px 20px;}
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return; cssInjected = true;
  const s = document.createElement("style");
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

export default function App() {
  injectCSS();
  const XLSX = useXLSX();

  // screens: machine | bottletype | params | serials | control | recap
  const [screen,     setScreen]     = useState("machine");
  const [machine,    setMachine]    = useState(null);
  const [bottleType, setBottleType] = useState(null);
  const [params,     setParams]     = useState({
    date: new Date().toISOString().split("T")[0],
    operateur: "",
    pression: "30",
  });

  const [serials, setSerials] = useState(Array(BATCH_SIZE).fill(""));
  const [checks,  setChecks]  = useState({});
  const [lots,    setLots]    = useState([]);
  const [toasts,  setToasts]  = useState([]);
  const inputRefs = useRef([]);

  const toast = useCallback((msg, err = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, err }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const toggleZone = (idx, zoneId) => {
    setChecks(prev => {
      const set = new Set(prev[idx] || []);
      if (zoneId === "S") {
        if (set.has("S")) set.delete("S");
        else { set.clear(); set.add("S"); }
      } else {
        set.delete("S");
        set.has(zoneId) ? set.delete(zoneId) : set.add(zoneId);
      }
      return { ...prev, [idx]: set };
    });
  };

  const filled     = serials.map((s, i) => s.trim() ? i : null).filter(i => i !== null);
  const curOk      = filled.filter(i => checks[i]?.has("S")).length;
  const curNok     = filled.filter(i => checks[i]?.size > 0 && !checks[i]?.has("S")).length;
  const curCocked  = filled.filter(i => checks[i]?.size > 0).length;
  const allChecked = curCocked === filled.length && filled.length > 0;

  const allEntries = lots.flatMap(l => l.serials);
  const gtTotal = allEntries.length;
  const gtOk    = allEntries.filter(e => e.zones.includes("S")).length;
  const gtNok   = allEntries.filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
  const gtTaux  = (gtOk + gtNok) > 0 ? Math.round(gtOk / (gtOk + gtNok) * 100) : null;

  const zoneStats = ZONES.map(z => {
    const count  = allEntries.filter(e => e.zones.includes(z.id)).length;
    const pctNok = gtNok   > 0 ? Math.round(count / gtNok   * 100) : 0;
    const pctTot = gtTotal > 0 ? Math.round(count / gtTotal * 100) : 0;
    return { ...z, count, pctNok, pctTot };
  });

  const validateLot = () => {
    if (!allChecked) { toast("Cochez toutes les bouteilles avant de valider.", true); return; }
    const lotSerials = filled.map(i => ({
      num:   serials[i].trim().toUpperCase(),
      zones: [...(checks[i] || [])],
    }));
    const newLot = { lotNum: lots.length + 1, serials: lotSerials };
    setLots(prev => [...prev, newLot]);
    setSerials(Array(BATCH_SIZE).fill(""));
    setChecks({});
    setScreen("recap");
    toast(`✅ Lot ${newLot.lotNum} validé — ${lotSerials.length} bouteilles enregistrées.`);
  };

  const startNewLot = () => {
    setSerials(Array(BATCH_SIZE).fill(""));
    setChecks({});
    setScreen("serials");
  };

  const exportExcel = () => {
    if (!XLSX)    { toast("SheetJS chargement…", true); return; }
    if (!gtTotal) { toast("Aucune donnée à exporter.", true); return; }

    const machineName = machine?.label || "";
    const typeLabel   = bottleType || "";

    const wsData = [
      ["FICHE DE SUIVI TEST HYDROSTATIQUE"],
      [],
      ["Machine :", machineName, "Type bouteille :", typeLabel, "Date :", params.date, "Opérateur :", params.operateur],
      ["Pression (bars):", params.pression],
      [],
    ];

    let rowNum = 1;
    lots.forEach(lot => {
      wsData.push([`LOT ${lot.lotNum}`, "", "", "", "", "", ""]);
      wsData.push(["#", "N° Série", "SUCCÈS", "Col", "Med", "Gal", "Pied"]);
      lot.serials.forEach(e => {
        wsData.push([
          rowNum++, e.num,
          e.zones.includes("S")    ? "✓" : "",
          e.zones.includes("COL")  ? "X" : "",
          e.zones.includes("MED")  ? "X" : "",
          e.zones.includes("GAL")  ? "X" : "",
          e.zones.includes("PIED") ? "X" : "",
        ]);
      });
      const lOk  = lot.serials.filter(e => e.zones.includes("S")).length;
      const lNok = lot.serials.filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
      wsData.push(["", `Lot ${lot.lotNum} — OK: ${lOk}  NOK: ${lNok}`, "", "", "", "", ""]);
      wsData.push([]);
    });

    wsData.push(
      ["TOTAL GLOBAL", gtTotal, "", "", "", "", ""],
      ["SUCCÈS",       gtOk,    "", "", "", "", ""],
      ["ÉCHECS",       gtNok,   "", "", "", "", ""],
      ["TAUX",         gtTaux !== null ? gtTaux + "%" : "—", "", "", "", "", ""],
      [`FORMULE : ${gtOk+gtNok} − ${gtNok} = ${gtOk}`, "", "", "", "", "", ""],
      [],
      ["DÉFAUTS PAR ZONE", "", "", "", "", "", ""],
      ["Zone", "Nom complet", "Nb défauts", "% des NOK", "% du total", "", ""],
    );
    ZONES.forEach(z => {
      const count  = allEntries.filter(e => e.zones.includes(z.id)).length;
      const pctNok = gtNok   > 0 ? Math.round(count / gtNok   * 100) : 0;
      const pctTot = gtTotal > 0 ? Math.round(count / gtTotal * 100) : 0;
      wsData.push([z.id, z.full, count, pctNok + "%", pctTot + "%", "", ""]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch:8 },{ wch:22 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:8 },{ wch:8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test Hydrostatique");
    const typeSlug = typeLabel ? `_${typeLabel.replace(".","p")}` : "";
    const fname = `hydrostatique_${machineName.replace(/\s+/g,"_")}${typeSlug}_${params.date}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast(`✅  "${fname}" exporté !`);
  };

  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const Toasts = () => (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className={`toast${t.err?" err":""}`}>{t.msg}</div>)}
    </div>
  );

  const TopBar = ({ showExport = false }) => (
    <div className="top-bar">
      <div className="top-machine">{machine?.label}</div>
      <div className="chips">
        <div className="chip">📅 <span>{params.date}</span></div>
        {params.operateur && <div className="chip">👤 <span>{params.operateur}</span></div>}
        <div className="chip">⚙ <span>{params.pression} bars</span></div>
        {bottleType && <div className="chip type-chip">🫙 <span>{bottleType}</span></div>}
        {lots.length > 0 && <div className="chip">📦 <span>{lots.length} lot{lots.length>1?"s":""}</span></div>}
      </div>
      <div className="top-right">
        {showExport && gtTotal > 0 && (
          <button className="btn btn-green" onClick={exportExcel}>📊 Exporter Excel</button>
        )}
      </div>
    </div>
  );

  /* ══════════ ÉCRAN 1 — SÉLECTION MACHINE ══════════ */
  if (screen === "machine") return (
    <div className="fs-screen">
      <div className="fs-grid" />
      <div className="fs-badge">⚙ WONDERFUL METAL · CONTRÔLE QUALITÉ</div>
      <div className="fs-title">TEST <span>HYDRO</span>STATIQUE</div>
      <div className="fs-sub">SÉLECTIONNEZ LA MACHINE · PRESSION 30 BARS</div>

      <div className="sel-card">
        <span className="sel-lbl">Sélectionnez la machine</span>
        <div className="machine-grid">
          {MACHINES.map(m => (
            <button
              key={m.id}
              className={`machine-btn${machine?.id === m.id ? " selected" : ""}`}
              onClick={() => setMachine(m)}
            >
              {machine?.id === m.id && <span className="machine-check">✓</span>}
              <div className="machine-name">{m.label}</div>
              <div className="machine-tag">6 KG · 12.5 KG</div>
            </button>
          ))}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button className="btn btn-amber"
            style={{ fontSize:18, padding:"13px 44px", opacity: machine ? 1 : 0.35 }}
            onClick={() => { if (machine) setScreen("bottletype"); }}>
            SUIVANT →
          </button>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 2 — TYPE DE BOUTEILLE ══════════ */
  if (screen === "bottletype") return (
    <div className="fs-screen">
      <div className="fs-grid" />
      <div className="btype-card">
        <div className="btype-context">⚙ {machine?.label}</div>
        <div className="btype-title">TYPE DE BOUTEILLE</div>
        <div className="btype-sub">SÉLECTIONNEZ LE FORMAT À TESTER</div>

        <div className="btype-grid">
          {BOTTLE_TYPES.map(bt => (
            <button
              key={bt.id}
              className={`btype-btn${bottleType === bt.id ? " selected" : ""}`}
              onClick={() => setBottleType(bt.id)}
            >
              {bottleType === bt.id && <span className="btype-check">✓</span>}
              <div className="btype-kg">{bt.label}</div>
              <div className="btype-unit">{bt.unit}</div>
              <div className="btype-desc">{bt.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button className="btn btn-ghost"
            onClick={() => { setBottleType(null); setScreen("machine"); }}>
            ← Retour
          </button>
          <button className="btn btn-amber"
            style={{ fontSize:18, padding:"13px 44px", opacity: bottleType ? 1 : 0.35 }}
            onClick={() => { if (bottleType) setScreen("params"); }}>
            SUIVANT →
          </button>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 3 — PARAMÈTRES ══════════ */
  if (screen === "params") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">{machine?.label}</div>
        <div className="chip type-chip">🫙 <span>{bottleType}</span></div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--muted)", marginLeft:"auto" }}>
          PARAMÈTRES DE SESSION
        </div>
      </div>
      <div className="center-body">
        <div className="form-card">
          <div className="form-title">Paramètres de session</div>
          <div className="form-sub">REMPLISSEZ AVANT DE COMMENCER</div>
          <div className="params-grid">
            <div className="pf">
              <label className="pf-lbl">📅 Date</label>
              <input type="date" className="pf-inp"
                value={params.date} onChange={e => setP("date", e.target.value)} />
            </div>
            <div className="pf">
              <label className="pf-lbl">👤 Opérateur</label>
              <input className="pf-inp" placeholder="Nom et prénom"
                value={params.operateur} onChange={e => setP("operateur", e.target.value)} />
            </div>
            <div className="pf">
              <label className="pf-lbl">⚙ Pression (bars)</label>
              <input className="pf-inp"
                value={params.pression} onChange={e => setP("pression", e.target.value)} />
            </div>
            <div className="divider" />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button className="btn btn-ghost" onClick={() => setScreen("bottletype")}>← Retour</button>
            <button className="btn btn-amber" style={{ fontSize:18, padding:"13px 44px" }}
              onClick={() => setScreen("serials")}>COMMENCER →</button>
          </div>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 4 — SAISIE N° DE SÉRIE ══════════ */
  if (screen === "serials") return (
    <div className="page">
      <TopBar />
      <div className="center-body" style={{ alignItems:"flex-start" }}>
        <div className="form-card" style={{ maxWidth:860 }}>
          <div className="form-title">
            Lot {lots.length + 1} — {BATCH_SIZE} bouteilles
            <span style={{ fontSize:16, color:"var(--amber)", marginLeft:12,
              fontFamily:"var(--mono)", letterSpacing:2 }}>[{bottleType}]</span>
          </div>
          <div className="form-sub">TAB OU ENTRÉE POUR PASSER AU SUIVANT</div>

          <div className="serial-grid">
            {serials.map((val, i) => (
              <div className="serial-cell" key={i}>
                <span className="serial-num">BOUTEILLE {i + 1}</span>
                <input
                  ref={el => (inputRefs.current[i] = el)}
                  className={`serial-inp${val.trim() ? " filled" : ""}`}
                  placeholder="N° série" value={val} maxLength={20}
                  autoFocus={i === 0}
                  onChange={e => {
                    const next = [...serials]; next[i] = e.target.value; setSerials(next);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault(); inputRefs.current[i + 1]?.focus();
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <div className="progress-wrap">
            <div className="progress-bar"
              style={{ width:`${serials.filter(s=>s.trim()).length / BATCH_SIZE * 100}%` }} />
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", gap:8 }}>
              {lots.length > 0 && (
                <button className="btn btn-ghost" onClick={() => setScreen("recap")}>← Récap</button>
              )}
              <button className="btn btn-ghost" onClick={() => setScreen("params")}>← Paramètres</button>
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)" }}>
                {serials.filter(s=>s.trim()).length} / {BATCH_SIZE}
              </span>
              <button className="btn btn-amber"
                style={{ fontSize:18, padding:"13px 44px",
                  opacity: serials.some(s=>s.trim()) ? 1 : 0.35 }}
                onClick={() => { if (serials.some(s=>s.trim())) setScreen("control"); }}>
                CONTRÔLER →
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 5 — CONTRÔLE PAR BOUTEILLE ══════════ */
  if (screen === "control") return (
    <div className="page">
      <TopBar />

      <div className="stats-row">
        <div className="stat-cell"><div className="sv blue">{filled.length}</div><div className="sl">Ce lot</div></div>
        <div className="stat-cell"><div className="sv" style={{color:"var(--amber)"}}>{curCocked}</div><div className="sl">Cochées</div></div>
        <div className="stat-cell"><div className="sv green">{curOk}</div><div className="sl">✓ Succès</div></div>
        <div className="stat-cell"><div className="sv red">{curNok}</div><div className="sl">✗ Échecs</div></div>
        <div className="stat-cell">
          <div className="formula">
            <span className="f-op">[</span>
            <span style={{color:"#60a5fa"}}>{curOk+curNok}</span>
            <span className="f-op">−</span>
            <span style={{color:"#ef4444"}}>{curNok}</span>
            <span className="f-op">=</span>
            <span style={{color:"#10b981"}}>{curOk}</span>
            <span className="f-op">]</span>
          </div>
        </div>
      </div>

      <div className="legend">
        <span style={{ fontWeight:700, marginRight:4 }}>ZONES D'ÉCHEC :</span>
        {ZONES.map(z => (
          <div className="legend-item" key={z.id}>
            <div className="ldot" style={{background:z.color}} />
            <span><b>{z.id}</b> — {z.full}</span>
          </div>
        ))}
        <span style={{ marginLeft:"auto", color:"var(--amber)", fontWeight:700, fontSize:9 }}>
          ⚠ PLUSIEURS ZONES POSSIBLES PAR BOUTEILLE
        </span>
      </div>

      <div className="ctrl-body">
        {serials.map((num, i) => {
          if (!num.trim()) return null;
          const set  = checks[i] || new Set();
          const isOk = set.has("S");
          const isNok= set.size > 0 && !isOk;
          return (
            <div className={`bottle-row${isOk?" is-ok":isNok?" is-nok":""}`} key={i}>
              <div className="b-idx">{i + 1}</div>
              <div className="b-num">{num.trim().toUpperCase()}</div>
              <div className="b-controls">
                <button className={`zone-btn${set.has("S")?" active-S":""}`}
                  onClick={() => toggleZone(i, "S")}>✓ SUCCÈS</button>
                <span className="b-sep">|</span>
                {ZONES.map(z => (
                  <button key={z.id}
                    className={`zone-btn${set.has(z.id)?` active-${z.id}`:""}`}
                    onClick={() => toggleZone(i, z.id)}>{z.label}</button>
                ))}
              </div>
              <div className={`b-status${isOk?" ok":isNok?" nok":" none"}`}>
                {isOk?"✓ OK":isNok?`✗ ${[...set].join("+")}` :"— en attente"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="validate-bar">
        <div className="val-info">
          Lot <span>{lots.length + 1}</span> · <span>{curCocked}</span> / {filled.length} cochées
          {!allChecked && curCocked > 0 &&
            <span className="val-warning">— cochez toutes les bouteilles pour valider</span>}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button className="btn btn-ghost" onClick={() => setScreen("serials")}>← Modifier N°</button>
          <button className="btn btn-amber"
            style={{ fontSize:17, padding:"11px 36px", opacity: allChecked ? 1 : 0.4 }}
            onClick={validateLot}>
            VALIDER LE LOT ✓
          </button>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 6 — RÉCAP TOUS LES LOTS ══════════ */
  return (
    <div className="page">
      <TopBar showExport />

      <div className="stats-row">
        <div className="stat-cell"><div className="sv blue">{gtTotal}</div><div className="sl">Total général</div></div>
        <div className="stat-cell"><div className="sv" style={{color:"var(--amber)"}}>{lots.length}</div><div className="sl">Lots validés</div></div>
        <div className="stat-cell"><div className="sv green">{gtOk}</div><div className="sl">✓ Succès</div></div>
        <div className="stat-cell"><div className="sv red">{gtNok}</div><div className="sl">✗ Échecs</div></div>
        <div className="stat-cell"><div className="sv amber">{gtTaux !== null ? gtTaux+"%" : "—"}</div><div className="sl">Conformité</div></div>
        <div className="stat-cell">
          <div className="formula">
            <span className="f-op">[</span><span style={{color:"#60a5fa"}}>{gtOk+gtNok}</span>
            <span className="f-op">−</span><span style={{color:"#ef4444"}}>{gtNok}</span>
            <span className="f-op">=</span><span style={{color:"#10b981"}}>{gtOk}</span>
            <span className="f-op">]</span>
          </div>
        </div>
      </div>

      <div className="legend">
        {ZONES.map(z => (
          <div className="legend-item" key={z.id}>
            <div className="ldot" style={{background:z.color}} />
            <span><b>{z.id}</b> — {z.full}</span>
          </div>
        ))}
      </div>

      {gtNok > 0 && (
        <div className="zone-stats">
          {zoneStats.map(z => (
            <div className="zone-stat-card" key={z.id}>
              <div className="zs-zone" style={{color:z.color}}>{z.id}</div>
              <div className="zs-count" style={{color:z.count>0?z.color:"var(--muted)"}}>{z.count}</div>
              <div className="zs-full">{z.full}</div>
              <div className="zs-pcts">
                <div><div className="zs-pct of-nok">{z.pctNok}%</div><div className="zs-label">des NOK</div></div>
                <div><div className="zs-pct of-total">{z.pctTot}%</div><div className="zs-label">du total</div></div>
              </div>
              <div className="zs-bar" style={{background:z.color,width:`${z.pctNok}%`,opacity:z.count>0?.7:0}} />
            </div>
          ))}
          <div className="zone-stat-card" style={{borderLeft:"2px solid rgba(239,68,68,.3)"}}>
            <div className="zs-zone" style={{color:"#ef4444"}}>TOTAL</div>
            <div className="zs-count" style={{color:"#ef4444"}}>{gtNok}</div>
            <div className="zs-full">Bouteilles NOK</div>
            <div className="zs-pcts">
              <div><div className="zs-pct of-nok">100%</div><div className="zs-label">des NOK</div></div>
              <div><div className="zs-pct of-total">{gtTotal>0?Math.round(gtNok/gtTotal*100):0}%</div><div className="zs-label">du total</div></div>
            </div>
            <div className="zs-bar" style={{background:"#ef4444",width:"100%",opacity:.5}} />
          </div>
        </div>
      )}

      <div className="recap-wrap">
        {lots.map(lot => {
          const lOk  = lot.serials.filter(e => e.zones.includes("S")).length;
          const lNok = lot.serials.filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
          return (
            <div className="recap-section" key={lot.lotNum}>
              <div className="recap-lot-header">
                <span>LOT</span>
                <span className="lh-num">{lot.lotNum}</span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span>{lot.serials.length} bouteilles</span>
                <span style={{color:"var(--amber)",fontSize:9,
                  border:"1px solid rgba(245,158,11,.3)",padding:"1px 6px",borderRadius:2,
                  background:"rgba(245,158,11,.06)"}}>
                  {bottleType}
                </span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span className="lh-ok">✓ {lOk} OK</span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span className="lh-nok">✗ {lNok} NOK</span>
              </div>
              <table className="recap-table">
                <thead>
                  <tr>
                    <th className="td-i">#</th>
                    <th className="th-num">N° Série</th>
                    <th className="th-ok">Succès</th>
                    <th className="th-err" colSpan={4}>— Zones défaillantes —</th>
                  </tr>
                  <tr>
                    <th /><th /><th className="th-ok" />
                    <th className="th-err" style={{color:"#ef4444",fontSize:9}}>Col</th>
                    <th className="th-err" style={{color:"#fb923c",fontSize:9}}>Med</th>
                    <th className="th-err" style={{color:"#a78bfa",fontSize:9}}>Gal</th>
                    <th className="th-err" style={{color:"#60a5fa",fontSize:9}}>Pied</th>
                  </tr>
                </thead>
                <tbody>
                  {lot.serials.map((e, i) => (
                    <tr key={i}>
                      <td className="td-i">{i+1}</td>
                      <td className="td-num">{e.num}</td>
                      <td>{e.zones.includes("S")    && <span className="mk-s">✓</span>}</td>
                      <td>{e.zones.includes("COL")  && <span className="mk-x mk-col">✗</span>}</td>
                      <td>{e.zones.includes("MED")  && <span className="mk-x mk-med">✗</span>}</td>
                      <td>{e.zones.includes("GAL")  && <span className="mk-x mk-gal">✗</span>}</td>
                      <td>{e.zones.includes("PIED") && <span className="mk-x mk-pied">✗</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="bottom-bar">
        <div className="formula-pill">
          <span style={{color:"#5a6a82"}}>TOTAL : </span>
          <span style={{color:"#60a5fa"}}>{gtOk+gtNok}</span>
          <span style={{color:"#5a6a82"}}> − </span>
          <span style={{color:"#ef4444"}}>{gtNok}</span>
          <span style={{color:"#5a6a82"}}> = </span>
          <span style={{color:"#10b981"}}>{gtOk}</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button className="btn btn-amber" style={{ fontSize:17 }} onClick={startNewLot}>
            + NOUVEAU LOT
          </button>
          <button className="btn btn-green" style={{ fontSize:17 }} onClick={exportExcel}>
            📊 Exporter Excel
          </button>
        </div>
      </div>
      <Toasts />
    </div>
  );
}