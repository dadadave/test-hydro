import { useState, useRef, useCallback, useEffect } from "react";

/* ── Supabase ────────────────────────────────────────────────── */
const SUPABASE_URL = "https://pupoeypotvaquxjnjqxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_P5tQac6QdLPLWkoye4MK8g_GiLogkJU";

function useSupabase() {
  const [sb, setSb] = useState(null);
  useEffect(() => {
    if (window.supabase) { setSb(window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    s.onload = () => setSb(window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY));
    document.head.appendChild(s);
  }, []);
  return sb;
}

/* ── SheetJS ─────────────────────────────────────────────────── */
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

/* ── Constantes ──────────────────────────────────────────────── */
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
  { id: "COL",  label: "Col",  full: "Collerette",     color: "#ef4444", col: "zone_col"  },
  { id: "MED",  label: "Med",  full: "Corps médian",   color: "#fb923c", col: "zone_med"  },
  { id: "GAL",  label: "Gal",  full: "Galbe (épaule)", color: "#a78bfa", col: "zone_gal"  },
  { id: "PIED", label: "Pied", full: "Fond / Pied",    color: "#60a5fa", col: "zone_pied" },
];
const BATCH_SIZE = 10;

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("fr-FR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

/* ── CSS ─────────────────────────────────────────────────────── */
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

/* ── FULLSCREEN ── */
.fs-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:32px 24px;background:radial-gradient(ellipse 80% 70% at 50% 40%,#1a2a3a 0%,#0e1015 100%);
  position:relative;overflow:hidden;}
.fs-grid{position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px),
             repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px);}
.fs-badge{font-family:var(--mono);font-size:10px;letter-spacing:3px;color:var(--amber);
  border:1px solid rgba(245,158,11,.35);padding:5px 18px;border-radius:2px;
  background:rgba(245,158,11,.06);margin-bottom:24px;text-transform:uppercase;}
.fs-title{font-family:var(--disp);font-size:clamp(38px,6vw,72px);color:var(--text);
  letter-spacing:4px;text-align:center;line-height:1;margin-bottom:8px;}
.fs-title span{color:var(--amber);}
.fs-sub{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:2px;text-align:center;margin-bottom:36px;}

/* ── MACHINE ── */
.sel-card{background:rgba(22,27,36,.97);border:1px solid var(--border);border-radius:4px;
  padding:32px 40px;width:100%;max-width:700px;
  box-shadow:0 24px 48px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.08);}
.sel-lbl{font-family:var(--mono);font-size:10px;color:var(--amber);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:18px;display:block;}
.machine-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;}
.machine-btn{background:var(--bg3);border:2px solid var(--border);border-radius:4px;
  padding:28px 16px;cursor:pointer;transition:all .18s;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:relative;}
.machine-btn:hover{border-color:rgba(245,158,11,.5);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.4);}
.machine-btn.selected{border-color:var(--amber);background:rgba(245,158,11,.08);
  box-shadow:0 0 0 3px rgba(245,158,11,.18);}
.machine-name{font-family:var(--disp);font-size:clamp(22px,3.5vw,32px);letter-spacing:3px;color:var(--amber2);}
.machine-check{position:absolute;top:8px;right:10px;font-size:16px;color:var(--amber);}
.machine-tag{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 8px;border-radius:2px;background:rgba(245,158,11,.06);}

/* ── BOTTLE TYPE ── */
.btype-card{background:rgba(22,27,36,.97);border:1px solid var(--border);border-radius:4px;
  padding:40px 52px;width:100%;max-width:640px;
  box-shadow:0 24px 48px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.08);}
.btype-context{font-family:var(--disp);font-size:14px;letter-spacing:4px;color:var(--amber);text-align:center;margin-bottom:6px;}
.btype-title{font-family:var(--disp);font-size:clamp(26px,4vw,38px);color:var(--text);letter-spacing:3px;text-align:center;margin-bottom:6px;}
.btype-sub{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:2px;text-align:center;margin-bottom:36px;}
.btype-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px;}
.btype-btn{background:var(--bg3);border:2px solid var(--border);border-radius:6px;
  padding:40px 16px 28px;cursor:pointer;transition:all .2s;
  display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;}
.btype-btn:hover{border-color:var(--amber);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4);}
.btype-btn.selected{border-color:var(--amber);background:rgba(245,158,11,.1);
  box-shadow:0 0 0 3px rgba(245,158,11,.2);}
.btype-kg{font-family:var(--disp);font-size:clamp(56px,10vw,92px);letter-spacing:2px;color:var(--amber2);line-height:1;}
.btype-unit{font-family:var(--mono);font-size:12px;color:var(--amber);letter-spacing:4px;margin-top:-2px;}
.btype-desc{font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:10px;}
.btype-check{position:absolute;top:10px;right:12px;font-size:18px;color:var(--amber);}

/* ── SHARED ── */
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
.chip.sync-ok{border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.07);}
.chip.sync-ok span{color:#10b981;}
.chip.sync-err{border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.07);}
.chip.sync-err span{color:#ef4444;}
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
.bottle-row.is-ok{border-color:rgba(16,185,129,.45);}
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
.btn-blue{background:rgba(96,165,250,.12);color:#60a5fa;border:1px solid #60a5fa;}
.btn-blue:hover{background:rgba(96,165,250,.22);}

/* ── HISTORIQUE ── */
.hist-body{flex:1;overflow:auto;padding:20px 28px;}
.hist-loading{display:flex;align-items:center;justify-content:center;height:200px;
  font-family:var(--mono);font-size:12px;color:var(--muted);letter-spacing:2px;}
.hist-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;gap:12px;}
.hist-empty-icon{font-size:48px;opacity:.3;}
.hist-empty-txt{font-family:var(--mono);font-size:12px;color:var(--muted);letter-spacing:1px;}

.day-block{margin-bottom:32px;}
.day-header{
  display:flex;align-items:center;gap:16px;margin-bottom:14px;
  padding-bottom:10px;border-bottom:1px solid var(--border);
}
.day-label{font-family:var(--disp);font-size:22px;letter-spacing:2px;color:var(--text);}
.day-label span{color:var(--amber);}
.day-stats{display:flex;gap:10px;flex-wrap:wrap;margin-left:auto;}
.day-stat{font-family:var(--mono);font-size:10px;padding:3px 10px;border-radius:2px;border:1px solid;}
.day-stat.ds-total{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.day-stat.ds-ok   {color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.day-stat.ds-nok  {color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.day-stat.ds-taux {color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}

.session-card{
  background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  margin-bottom:12px;overflow:hidden;transition:border-color .15s;
}
.session-card:hover{border-color:rgba(245,158,11,.25);}
.session-header{
  display:flex;align-items:center;gap:14px;padding:12px 18px;
  cursor:pointer;user-select:none;flex-wrap:wrap;
}
.session-header:hover{background:rgba(245,158,11,.03);}
.sh-machine{font-family:var(--disp);font-size:18px;letter-spacing:2px;color:var(--amber);}
.sh-type{font-family:var(--mono);font-size:9px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 7px;border-radius:2px;background:rgba(245,158,11,.06);}
.sh-op{font-family:var(--mono);font-size:10px;color:var(--light);}
.sh-time{font-family:var(--mono);font-size:10px;color:var(--muted);}
.sh-pills{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;}
.sh-pill{font-family:var(--mono);font-size:10px;font-weight:700;padding:3px 10px;border-radius:2px;border:1px solid;}
.sh-pill.p-tot  {color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.sh-pill.p-ok   {color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.sh-pill.p-nok  {color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.sh-pill.p-taux {color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.sh-chevron{font-size:12px;color:var(--muted);margin-left:8px;transition:transform .2s;}
.sh-chevron.open{transform:rotate(90deg);}

.session-detail{border-top:1px solid var(--border);padding:16px 18px;}
.lot-mini{margin-bottom:14px;}
.lot-mini-header{font-family:var(--mono);font-size:9px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:5px 10px;background:var(--bg3);border:1px solid var(--border);
  border-radius:2px 2px 0 0;display:flex;align-items:center;gap:10px;}
.lmh-num{color:var(--amber);font-weight:700;}
.lmh-ok{color:#10b981;}
.lmh-nok{color:#ef4444;}
.lot-mini-table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:11px;}
.lot-mini-table th{background:rgba(30,37,48,.9);border:1px solid var(--border);padding:5px 8px;
  text-align:center;font-size:8px;letter-spacing:1px;text-transform:uppercase;}
.lot-mini-table th.tm-num{text-align:left;color:var(--light);}
.lot-mini-table th.tm-ok{color:#10b981;}
.lot-mini-table th.tm-err{color:#ef4444;background:rgba(239,68,68,.04);}
.lot-mini-table td{padding:5px 8px;border:1px solid rgba(42,52,68,.5);text-align:center;}
.lot-mini-table tr:hover td{background:rgba(245,158,11,.02);}
.lot-mini-table tr:nth-child(even) td{background:rgba(255,255,255,.01);}

/* Saving */
.saving-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;
  justify-content:center;z-index:9999;backdrop-filter:blur(4px);}
.saving-box{background:var(--bg2);border:1px solid var(--amber);border-radius:4px;
  padding:32px 48px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.6);}
.saving-spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--amber);
  border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
@keyframes spin{to{transform:rotate(360deg);}}
.saving-text{font-family:var(--mono);font-size:12px;color:var(--amber);letter-spacing:2px;}

.toast-wrap{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;gap:6px;pointer-events:none;}
.toast{background:var(--bg2);border:1px solid #10b981;border-left:4px solid #10b981;
  color:var(--text);padding:10px 18px;border-radius:3px;font-family:var(--mono);font-size:12px;
  min-width:240px;animation:toastIn .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.5);}
.toast.err{border-color:#ef4444;border-left-color:#ef4444;}
@keyframes toastIn{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}

@media(max-width:640px){
  .machine-grid,.btype-grid{grid-template-columns:1fr 1fr;}
  .params-grid,.serial-grid{grid-template-columns:repeat(2,1fr);}
  .stats-row{flex-wrap:wrap;}
  .stat-cell{min-width:50%;}
  .b-num{width:100px;font-size:12px;}
  .b-status{display:none;}
  .sel-card,.btype-card{padding:24px 20px;}
  .hist-body{padding:12px;}
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return; cssInjected = true;
  const s = document.createElement("style");
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════════ */
export default function App() {
  injectCSS();
  const sb   = useSupabase();
  const XLSX = useXLSX();

  const [screen,     setScreen]     = useState("machine");
  const [machine,    setMachine]    = useState(null);
  const [bottleType, setBottleType] = useState(null);
  const [params,     setParams]     = useState({
    date: new Date().toISOString().split("T")[0],
    operateur: "",
    pression: "30",
  });

  const [sessionId, setSessionId] = useState(null);
  const [serials,   setSerials]   = useState(Array(BATCH_SIZE).fill(""));
  const [checks,    setChecks]    = useState({});
  const [lots,      setLots]      = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [syncState, setSyncState] = useState("idle");

  // Historique
  const [histData,    setHistData]    = useState(null); // null = pas encore chargé
  const [histLoading, setHistLoading] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const [toasts, setToasts] = useState([]);
  const inputRefs = useRef([]);

  const toast = useCallback((msg, err = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, err }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  /* ── Charger l'historique depuis Supabase ── */
  const loadHistory = useCallback(async () => {
    if (!sb) return;
    setHistLoading(true);
    try {
      // Charger sessions
      const { data: sessions, error: sErr } = await sb
        .from("sessions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;

      // Charger tous les lots
      const { data: lots, error: lErr } = await sb
        .from("lots")
        .select("*")
        .order("lot_num", { ascending: true });
      if (lErr) throw lErr;

      // Charger toutes les bouteilles
      const { data: bouteilles, error: bErr } = await sb
        .from("bouteilles")
        .select("*");
      if (bErr) throw bErr;

      // Assembler
      const assembled = sessions.map(s => {
        const sLots = lots
          .filter(l => l.session_id === s.id)
          .map(l => {
            const bots = bouteilles.filter(b => b.lot_id === l.id);
            return { ...l, bouteilles: bots };
          });
        const allBots = sLots.flatMap(l => l.bouteilles);
        const nbOk  = allBots.filter(b => b.succes).length;
        const nbNok = allBots.filter(b => !b.succes && (b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
        return { ...s, lots: sLots, nb_ok: nbOk, nb_nok: nbNok, total: allBots.length };
      });

      setHistData(assembled);
    } catch (err) {
      console.error(err);
      toast("Erreur chargement historique : " + err.message, true);
      setHistData([]);
    } finally {
      setHistLoading(false);
    }
  }, [sb, toast, sessions, bouteilles]);

  // Charger automatiquement dès que Supabase est prêt et qu'on est sur l'écran historique
  useEffect(() => {
    if (screen === "history" && sb && histData === null) loadHistory();
  }, [screen, sb, histData, loadHistory]);

  /* ── Grouper par jour ── */
  const histByDay = histData ? histData.reduce((acc, s) => {
    const day = s.date;
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {}) : {};

  const toggleSession = (id) => {
    setExpandedSessions(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  /* ── Créer session Supabase ── */
  const createSession = async (p, m, bt) => {
    if (!sb) return null;
    const { data, error } = await sb.from("sessions").insert({
      machine:     m.label,
      bottle_type: bt,
      operateur:   p.operateur,
      date:        p.date,
      pression:    p.pression,
    }).select("id").single();
    if (error) { console.error(error); return null; }
    return data.id;
  };

  /* ── Toggle zone ── */
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

  /* ── Valider lot → Supabase ── */
  const validateLot = async () => {
    if (!allChecked) { toast("Cochez toutes les bouteilles avant de valider.", true); return; }
    setSaving(true);
    try {
      let sid = sessionId;
      if (!sid) {
        sid = await createSession(params, machine, bottleType);
        if (!sid) throw new Error("Impossible de créer la session");
        setSessionId(sid);
      }
      const { data: lotData, error: lotErr } = await sb.from("lots").insert({
        session_id: sid, lot_num: lots.length + 1,
      }).select("id").single();
      if (lotErr) throw lotErr;

      const rows = filled.map(i => {
        const zones = checks[i] || new Set();
        return {
          lot_id:    lotData.id,
          num_serie: serials[i].trim().toUpperCase(),
          succes:    zones.has("S"),
          zone_col:  zones.has("COL"),
          zone_med:  zones.has("MED"),
          zone_gal:  zones.has("GAL"),
          zone_pied: zones.has("PIED"),
        };
      });
      const { error: bErr } = await sb.from("bouteilles").insert(rows);
      if (bErr) throw bErr;

      const lotSerials = filled.map(i => ({
        num:   serials[i].trim().toUpperCase(),
        zones: [...(checks[i] || [])],
      }));
      setLots(prev => [...prev, { lotNum: prev.length + 1, serials: lotSerials }]);
      setSerials(Array(BATCH_SIZE).fill(""));
      setChecks({});
      setSyncState("ok");
      setHistData(null); // reset pour recharger à la prochaine visite
      setScreen("recap");
      toast(`✅ Lot ${lots.length + 1} sauvegardé !`);
    } catch (err) {
      console.error(err);
      setSyncState("err");
      toast(`⚠️ Erreur : ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const startNewLot = () => {
    setSerials(Array(BATCH_SIZE).fill(""));
    setChecks({});
    setScreen("serials");
  };

  /* ── Export Excel (session courante) ── */
  const exportExcel = () => {
    if (!XLSX) { toast("SheetJS chargement…", true); return; }
    if (!gtTotal) { toast("Aucune donnée à exporter.", true); return; }
    const machineName = machine?.label || "";
    const typeLabel   = bottleType || "";
    const wsData = [
      ["FICHE DE SUIVI TEST HYDROSTATIQUE"],[], 
      ["Machine :", machineName, "Type :", typeLabel, "Date :", params.date, "Opérateur :", params.operateur],
      ["Pression (bars):", params.pression],[],
    ];
    let rowNum = 1;
    lots.forEach(lot => {
      wsData.push([`LOT ${lot.lotNum}`, "", "", "", "", "", ""]);
      wsData.push(["#", "N° Série", "SUCCÈS", "Col", "Med", "Gal", "Pied"]);
      lot.serials.forEach(e => wsData.push([
        rowNum++, e.num,
        e.zones.includes("S")?"✓":"", e.zones.includes("COL")?"X":"",
        e.zones.includes("MED")?"X":"", e.zones.includes("GAL")?"X":"",
        e.zones.includes("PIED")?"X":"",
      ]));
      const lOk  = lot.serials.filter(e => e.zones.includes("S")).length;
      const lNok = lot.serials.filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
      wsData.push(["", `Lot ${lot.lotNum} — OK: ${lOk}  NOK: ${lNok}`, "", "", "", "", ""]);
      wsData.push([]);
    });
    wsData.push(
      ["TOTAL", gtTotal,"","","","",""],["SUCCÈS",gtOk,"","","","",""],
      ["ÉCHECS",gtNok,"","","","",""],
      ["TAUX",gtTaux!==null?gtTaux+"%":"—","","","","",""],
    );
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{wch:8},{wch:22},{wch:12},{wch:12},{wch:12},{wch:8},{wch:8}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Session");
    XLSX.writeFile(wb, `hydro_${machineName.replace(/\s+/g,"_")}_${params.date}.xlsx`);
    toast("✅ Excel exporté !");
  };

  /* ── Export Excel historique (un jour) ── */
  const exportDayExcel = (dayStr, sessions) => {
    if (!XLSX) { toast("SheetJS chargement…", true); return; }
    const wsData = [
      [`HISTORIQUE TEST HYDROSTATIQUE — ${fmtDate(dayStr)}`], [],
      ["Machine", "Type", "Opérateur", "Pression", "Lot", "N° Série", "Succès", "Col", "Med", "Gal", "Pied"],
    ];
    sessions.forEach(s => {
      s.lots.forEach(l => {
        l.bouteilles.forEach(b => {
          wsData.push([
            s.machine, s.bottle_type, s.operateur || "—", s.pression + " bars",
            `Lot ${l.lot_num}`, b.num_serie,
            b.succes?"✓":"", b.zone_col?"X":"", b.zone_med?"X":"",
            b.zone_gal?"X":"", b.zone_pied?"X":"",
          ]);
        });
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{wch:14},{wch:8},{wch:16},{wch:10},{wch:6},{wch:16},{wch:8},{wch:6},{wch:6},{wch:6},{wch:6}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, dayStr);
    XLSX.writeFile(wb, `historique_${dayStr}.xlsx`);
    toast(`✅ Export ${dayStr} téléchargé !`);
  };

  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const Toasts = () => (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className={`toast${t.err?" err":""}`}>{t.msg}</div>)}
    </div>
  );
  const SavingOverlay = () => saving ? (
    <div className="saving-overlay">
      <div className="saving-box">
        <div className="saving-spinner" />
        <div className="saving-text">SAUVEGARDE EN COURS…</div>
      </div>
    </div>
  ) : null;

  const TopBar = ({ showExport = false, extra = null }) => (
    <div className="top-bar">
      <div className="top-machine">{machine?.label || "HISTORIQUE"}</div>
      <div className="chips">
        {params.date && <div className="chip">📅 <span>{params.date}</span></div>}
        {params.operateur && <div className="chip">👤 <span>{params.operateur}</span></div>}
        {params.pression  && <div className="chip">⚙ <span>{params.pression} bars</span></div>}
        {bottleType && <div className="chip type-chip">🫙 <span>{bottleType}</span></div>}
        {lots.length > 0 && <div className="chip">📦 <span>{lots.length} lot{lots.length>1?"s":""}</span></div>}
        {syncState==="ok"  && <div className="chip sync-ok">☁ <span>Supabase ✓</span></div>}
        {syncState==="err" && <div className="chip sync-err">☁ <span>Erreur sync</span></div>}
      </div>
      <div className="top-right">
        {extra}
        <button className="btn btn-blue" style={{ fontSize:13 }}
          onClick={() => { setHistData(null); setScreen("history"); }}>
          📋 Historique
        </button>
        {showExport && gtTotal > 0 && (
          <button className="btn btn-green" onClick={exportExcel}>📊 Exporter Excel</button>
        )}
      </div>
    </div>
  );

  /* ══════════ ÉCRAN 1 — MACHINE ══════════ */
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
            <button key={m.id}
              className={`machine-btn${machine?.id === m.id ? " selected" : ""}`}
              onClick={() => setMachine(m)}>
              {machine?.id === m.id && <span className="machine-check">✓</span>}
              <div className="machine-name">{m.label}</div>
              <div className="machine-tag">6 KG · 12.5 KG</div>
            </button>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button className="btn btn-blue" style={{ fontSize:13 }}
            onClick={() => { setHistData(null); setScreen("history"); }}>
            📋 Voir l'historique
          </button>
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

  /* ══════════ ÉCRAN 2 — TYPE BOUTEILLE ══════════ */
  if (screen === "bottletype") return (
    <div className="fs-screen">
      <div className="fs-grid" />
      <div className="btype-card">
        <div className="btype-context">⚙ {machine?.label}</div>
        <div className="btype-title">TYPE DE BOUTEILLE</div>
        <div className="btype-sub">SÉLECTIONNEZ LE FORMAT À TESTER</div>
        <div className="btype-grid">
          {BOTTLE_TYPES.map(bt => (
            <button key={bt.id}
              className={`btype-btn${bottleType === bt.id ? " selected" : ""}`}
              onClick={() => setBottleType(bt.id)}>
              {bottleType === bt.id && <span className="btype-check">✓</span>}
              <div className="btype-kg">{bt.label}</div>
              <div className="btype-unit">{bt.unit}</div>
              <div className="btype-desc">{bt.sub}</div>
            </button>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <button className="btn btn-ghost"
            onClick={() => { setBottleType(null); setScreen("machine"); }}>← Retour</button>
          <button className="btn btn-amber"
            style={{ fontSize:18, padding:"13px 44px", opacity: bottleType ? 1 : 0.35 }}
            onClick={() => { if (bottleType) setScreen("params"); }}>SUIVANT →</button>
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

  /* ══════════ ÉCRAN 4 — SAISIE N° SÉRIE ══════════ */
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

  /* ══════════ ÉCRAN 5 — CONTRÔLE ══════════ */
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
            <span className="f-op">[</span><span style={{color:"#60a5fa"}}>{curOk+curNok}</span>
            <span className="f-op">−</span><span style={{color:"#ef4444"}}>{curNok}</span>
            <span className="f-op">=</span><span style={{color:"#10b981"}}>{curOk}</span>
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
          ⚠ PLUSIEURS ZONES POSSIBLES
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
            style={{ fontSize:17, padding:"11px 36px", opacity: allChecked && !saving ? 1 : 0.4 }}
            onClick={validateLot}>
            {saving ? "SAUVEGARDE…" : "VALIDER LE LOT ✓"}
          </button>
        </div>
      </div>
      <SavingOverlay />
      <Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 6 — RÉCAP SESSION COURANTE ══════════ */
  if (screen === "recap") return (
    <div className="page">
      <TopBar showExport />
      <div className="stats-row">
        <div className="stat-cell"><div className="sv blue">{gtTotal}</div><div className="sl">Total</div></div>
        <div className="stat-cell"><div className="sv" style={{color:"var(--amber)"}}>{lots.length}</div><div className="sl">Lots</div></div>
        <div className="stat-cell"><div className="sv green">{gtOk}</div><div className="sl">✓ Succès</div></div>
        <div className="stat-cell"><div className="sv red">{gtNok}</div><div className="sl">✗ Échecs</div></div>
        <div className="stat-cell"><div className="sv amber">{gtTaux!==null?gtTaux+"%":"—"}</div><div className="sl">Conformité</div></div>
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
            <div className="ldot" style={{background:z.color}} /><span><b>{z.id}</b> — {z.full}</span>
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
            <div className="zs-zone" style={{color:"#ef4444"}}>TOTAL NOK</div>
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
                <span>LOT</span><span className="lh-num">{lot.lotNum}</span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span>{lot.serials.length} bouteilles</span>
                <span style={{color:"var(--amber)",fontSize:9,border:"1px solid rgba(245,158,11,.3)",
                  padding:"1px 6px",borderRadius:2,background:"rgba(245,158,11,.06)"}}>{bottleType}</span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span className="lh-ok">✓ {lOk} OK</span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span className="lh-nok">✗ {lNok} NOK</span>
                <span style={{marginLeft:"auto",color:"#10b981",fontFamily:"var(--mono)",fontSize:9}}>☁ sauvegardé</span>
              </div>
              <table className="recap-table">
                <thead>
                  <tr>
                    <th className="td-i">#</th><th className="th-num">N° Série</th>
                    <th className="th-ok">Succès</th>
                    <th className="th-err" colSpan={4}>— Zones défaillantes —</th>
                  </tr>
                  <tr><th /><th /><th className="th-ok" />
                    <th className="th-err" style={{color:"#ef4444",fontSize:9}}>Col</th>
                    <th className="th-err" style={{color:"#fb923c",fontSize:9}}>Med</th>
                    <th className="th-err" style={{color:"#a78bfa",fontSize:9}}>Gal</th>
                    <th className="th-err" style={{color:"#60a5fa",fontSize:9}}>Pied</th>
                  </tr>
                </thead>
                <tbody>
                  {lot.serials.map((e, i) => (
                    <tr key={i}>
                      <td className="td-i">{i+1}</td><td className="td-num">{e.num}</td>
                      <td>{e.zones.includes("S")   && <span className="mk-s">✓</span>}</td>
                      <td>{e.zones.includes("COL") && <span className="mk-x mk-col">✗</span>}</td>
                      <td>{e.zones.includes("MED") && <span className="mk-x mk-med">✗</span>}</td>
                      <td>{e.zones.includes("GAL") && <span className="mk-x mk-gal">✗</span>}</td>
                      <td>{e.zones.includes("PIED")&& <span className="mk-x mk-pied">✗</span>}</td>
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
          <button className="btn btn-amber" style={{ fontSize:17 }} onClick={startNewLot}>+ NOUVEAU LOT</button>
          <button className="btn btn-green" style={{ fontSize:17 }} onClick={exportExcel}>📊 Excel</button>
        </div>
      </div>
      <SavingOverlay /><Toasts />
    </div>
  );

  /* ══════════ ÉCRAN 7 — HISTORIQUE ══════════ */
  return (
    <div className="page">
      {/* Top bar historique */}
      <div className="top-bar">
        <div className="top-machine">HISTORIQUE</div>
        <div className="chips">
          {!sb && <div className="chip sync-err">☁ <span>Connexion…</span></div>}
          {sb  && <div className="chip sync-ok">☁ <span>Supabase ✓</span></div>}
        </div>
        <div className="top-right">
          <button className="btn btn-ghost" style={{ fontSize:13 }}
            onClick={() => loadHistory()}>
            ↺ Actualiser
          </button>
          <button className="btn btn-amber" style={{ fontSize:13 }}
            onClick={() => setScreen("machine")}>
            + Nouveau test
          </button>
        </div>
      </div>

      <div className="hist-body">
        {histLoading && (
          <div className="hist-loading">
            <span style={{ marginRight:12 }}>⏳</span> CHARGEMENT DES DONNÉES…
          </div>
        )}

        {!histLoading && histData !== null && histData.length === 0 && (
          <div className="hist-empty">
            <div className="hist-empty-icon">📋</div>
            <div className="hist-empty-txt">AUCUNE DONNÉE ENREGISTRÉE</div>
            <button className="btn btn-amber" onClick={() => setScreen("machine")}>
              + Commencer un test
            </button>
          </div>
        )}

        {!histLoading && Object.keys(histByDay).map(day => {
          const sessions = histByDay[day];
          const dayTotal = sessions.reduce((a, s) => a + s.total, 0);
          const dayOk    = sessions.reduce((a, s) => a + s.nb_ok, 0);
          const dayNok   = sessions.reduce((a, s) => a + s.nb_nok, 0);
          const dayTaux  = (dayOk + dayNok) > 0 ? Math.round(dayOk / (dayOk + dayNok) * 100) : null;

          return (
            <div className="day-block" key={day}>
              {/* En-tête du jour */}
              <div className="day-header">
                <div className="day-label">{fmtDate(day).split(" ").slice(0,1)[0].toUpperCase()} <span>{fmtDate(day).split(" ").slice(1).join(" ")}</span></div>
                <div className="day-stats">
                  <div className="day-stat ds-total">{dayTotal} bouteilles</div>
                  <div className="day-stat ds-ok">✓ {dayOk} OK</div>
                  <div className="day-stat ds-nok">✗ {dayNok} NOK</div>
                  {dayTaux !== null && <div className="day-stat ds-taux">{dayTaux}% conformité</div>}
                  <button className="btn btn-green" style={{ fontSize:11, padding:"4px 12px" }}
                    onClick={() => exportDayExcel(day, sessions)}>
                    📊 Export jour
                  </button>
                </div>
              </div>

              {/* Sessions du jour */}
              {sessions.map(s => {
                const isOpen = expandedSessions.has(s.id);
                const taux = (s.nb_ok + s.nb_nok) > 0
                  ? Math.round(s.nb_ok / (s.nb_ok + s.nb_nok) * 100) : null;

                return (
                  <div className="session-card" key={s.id}>
                    {/* En-tête session cliquable */}
                    <div className="session-header" onClick={() => toggleSession(s.id)}>
                      <div className="sh-machine">{s.machine}</div>
                      <div className="sh-type">{s.bottle_type}</div>
                      {s.operateur && <div className="sh-op">👤 {s.operateur}</div>}
                      <div className="sh-time">🕐 {fmtTime(s.created_at)}</div>
                      <div className="sh-pills">
                        <div className="sh-pill p-tot">{s.total} bts</div>
                        <div className="sh-pill p-ok">✓ {s.nb_ok}</div>
                        <div className="sh-pill p-nok">✗ {s.nb_nok}</div>
                        {taux !== null && <div className="sh-pill p-taux">{taux}%</div>}
                      </div>
                      <span className={`sh-chevron${isOpen ? " open" : ""}`}>▶</span>
                    </div>

                    {/* Détail dépliable */}
                    {isOpen && (
                      <div className="session-detail">
                        {s.lots.length === 0 && (
                          <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)", padding:"8px 0" }}>
                            Aucun lot enregistré
                          </div>
                        )}
                        {s.lots.map(lot => {
                          const lOk  = lot.bouteilles.filter(b => b.succes).length;
                          const lNok = lot.bouteilles.filter(b => !b.succes && (b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
                          return (
                            <div className="lot-mini" key={lot.id}>
                              <div className="lot-mini-header">
                                <span>LOT</span>
                                <span className="lmh-num">{lot.lot_num}</span>
                                <span style={{color:"var(--muted)"}}>·</span>
                                <span>{lot.bouteilles.length} bouteilles</span>
                                <span style={{color:"var(--muted)"}}>·</span>
                                <span className="lmh-ok">✓ {lOk} OK</span>
                                <span style={{color:"var(--muted)"}}>·</span>
                                <span className="lmh-nok">✗ {lNok} NOK</span>
                              </div>
                              <table className="lot-mini-table">
                                <thead>
                                  <tr>
                                    <th style={{width:28}}>#</th>
                                    <th className="tm-num">N° Série</th>
                                    <th className="tm-ok">Succès</th>
                                    <th className="tm-err" colSpan={4}>Zones défaillantes</th>
                                  </tr>
                                  <tr>
                                    <th/><th/>
                                    <th className="tm-ok"/>
                                    <th className="tm-err" style={{color:"#ef4444",fontSize:8}}>Col</th>
                                    <th className="tm-err" style={{color:"#fb923c",fontSize:8}}>Med</th>
                                    <th className="tm-err" style={{color:"#a78bfa",fontSize:8}}>Gal</th>
                                    <th className="tm-err" style={{color:"#60a5fa",fontSize:8}}>Pied</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lot.bouteilles.map((b, bi) => (
                                    <tr key={b.id}>
                                      <td style={{color:"var(--muted)",fontSize:10}}>{bi+1}</td>
                                      <td className="td-num">{b.num_serie}</td>
                                      <td>{b.succes     && <span className="mk-s">✓</span>}</td>
                                      <td>{b.zone_col   && <span className="mk-x mk-col">✗</span>}</td>
                                      <td>{b.zone_med   && <span className="mk-x mk-med">✗</span>}</td>
                                      <td>{b.zone_gal   && <span className="mk-x mk-gal">✗</span>}</td>
                                      <td>{b.zone_pied  && <span className="mk-x mk-pied">✗</span>}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <Toasts />
    </div>
  );
}