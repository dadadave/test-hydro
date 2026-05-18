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

/* ── Constants ── */
const MACHINES = [
  { id: "M1", label: "MEDIANNE 1" },
  { id: "M2", label: "MEDIANNE 2" },
  { id: "M3", label: "MEDIANNE 3" },
  { id: "M4", label: "MEDIANNE 4" },
];
const BOTTLE_TYPES = [
  { id: "6KG",    label: "6",    unit: "KG", sub: "6 kilogrammes"    },
  { id: "12.5KG", label: "12.5", unit: "KG", sub: "12.5 kilogrammes" },
];
const ZONES = [
  { id: "COL",  label: "Col",  full: "Collerette",     color: "#ef4444", col: "zone_col"  },
  { id: "MED",  label: "Med",  full: "Corps médian",   color: "#fb923c", col: "zone_med"  },
  { id: "GAL",  label: "Gal",  full: "Galbe",          color: "#a78bfa", col: "zone_gal"  },
  { id: "PIED", label: "Pied", full: "Fond / Pied",    color: "#60a5fa", col: "zone_pied" },
];
const BATCH_SIZE = 10;

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(+y, +m - 1, +day).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/* ── CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{
  --bg:#0e1015;--bg2:#161b24;--bg3:#1e2530;--border:#2a3444;
  --amber:#f59e0b;--amber2:#fcd34d;--green:#10b981;--red:#ef4444;
  --blue:#60a5fa;--purple:#a78bfa;--orange:#fb923c;
  --text:#e8edf5;--muted:#5a6a82;--light:#8fa0ba;
  --mono:'IBM Plex Mono',monospace;--disp:'Bebas Neue',sans-serif;--body:'DM Sans',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;}
body{font-family:var(--body);background:var(--bg);color:var(--text);overflow-x:hidden;-webkit-text-size-adjust:100%;}

/* FULLSCREEN */
.fs{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:20px 14px;
  background:radial-gradient(ellipse 80% 70% at 50% 40%,#1a2a3a 0%,#0e1015 100%);
  position:relative;overflow:hidden;}
.fs-grid{position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px),
  repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px);}
.fs-badge{font-family:var(--mono);font-size:9px;letter-spacing:3px;color:var(--amber);
  border:1px solid rgba(245,158,11,.35);padding:4px 14px;border-radius:2px;
  background:rgba(245,158,11,.06);margin-bottom:18px;text-transform:uppercase;}
.fs-title{font-family:var(--disp);font-size:clamp(30px,9vw,72px);color:var(--text);
  letter-spacing:4px;text-align:center;line-height:1;margin-bottom:6px;}
.fs-title span{color:var(--amber);}
.fs-sub{font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:2px;
  text-align:center;margin-bottom:24px;}

/* CARD */
.card{background:rgba(22,27,36,.97);border:1px solid var(--border);border-radius:4px;
  width:100%;max-width:660px;padding:22px 16px;
  box-shadow:0 20px 48px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.07);}
@media(min-width:500px){.card{padding:28px 32px;}}
.card-lbl{font-family:var(--mono);font-size:9px;color:var(--amber);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:14px;display:block;}

/* MACHINE */
.machine-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px;}
.m-btn{background:var(--bg3);border:2px solid var(--border);border-radius:4px;
  padding:18px 10px;cursor:pointer;transition:all .17s;
  display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;}
.m-btn:hover{border-color:rgba(245,158,11,.5);transform:translateY(-2px);}
.m-btn.sel{border-color:var(--amber);background:rgba(245,158,11,.08);
  box-shadow:0 0 0 3px rgba(245,158,11,.15);}
.m-name{font-family:var(--disp);font-size:clamp(18px,5vw,28px);letter-spacing:3px;color:var(--amber2);}
.m-check{position:absolute;top:6px;right:8px;font-size:13px;color:var(--amber);}
.m-tag{font-family:var(--mono);font-size:7px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 6px;border-radius:2px;background:rgba(245,158,11,.06);}

/* BOTTLE TYPE */
.btype-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;}
.bt-btn{background:var(--bg3);border:2px solid var(--border);border-radius:6px;
  padding:26px 12px 18px;cursor:pointer;transition:all .2s;
  display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;}
.bt-btn:hover{border-color:var(--amber);transform:translateY(-2px);}
.bt-btn.sel{border-color:var(--amber);background:rgba(245,158,11,.1);
  box-shadow:0 0 0 3px rgba(245,158,11,.18);}
.bt-kg{font-family:var(--disp);font-size:clamp(44px,13vw,84px);letter-spacing:2px;color:var(--amber2);line-height:1;}
.bt-unit{font-family:var(--mono);font-size:11px;color:var(--amber);letter-spacing:4px;margin-top:-2px;}
.bt-desc{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-top:8px;}
.bt-check{position:absolute;top:8px;right:10px;font-size:16px;color:var(--amber);}

/* PAGE */
.page{min-height:100vh;display:flex;flex-direction:column;}
.top-bar{background:var(--bg2);border-bottom:2px solid var(--amber);
  padding:9px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex-shrink:0;}
.top-machine{font-family:var(--disp);font-size:clamp(14px,4vw,20px);letter-spacing:3px;
  color:var(--amber);white-space:nowrap;}
.chips{display:flex;gap:5px;flex-wrap:wrap;flex:1;}
.chip{font-family:var(--mono);font-size:8px;color:var(--light);
  background:rgba(255,255,255,.04);border:1px solid var(--border);
  padding:2px 6px;border-radius:2px;white-space:nowrap;}
.chip span{color:var(--amber2);font-weight:700;}
.chip.tc{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.07);}
.chip.tc span{color:var(--amber);}
.chip.ok{border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.07);}
.chip.ok span{color:#10b981;}
.chip.err{border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.07);}
.chip.err span{color:#ef4444;}
.top-right{margin-left:auto;display:flex;gap:6px;align-items:center;flex-shrink:0;}

/* PARAMS FORM */
.center-body{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:14px;}
.form-card{background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  padding:18px 14px;width:100%;max-width:800px;box-shadow:0 8px 32px rgba(0,0,0,.3);}
@media(min-width:560px){.form-card{padding:26px 28px;}}
.form-title{font-family:var(--disp);font-size:clamp(18px,5vw,26px);letter-spacing:2px;
  color:var(--text);margin-bottom:4px;}
.form-sub{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:16px;}
.pg{display:grid;gap:12px;margin-bottom:16px;}
.pg-2{grid-template-columns:1fr;}
@media(min-width:480px){.pg-2{grid-template-columns:1fr 1fr;}}
.pg-3{grid-template-columns:1fr;}
@media(min-width:560px){.pg-3{grid-template-columns:1fr 1fr 1fr;}}
.pf{display:flex;flex-direction:column;gap:4px;}
.pf-lbl{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.pf-inp{background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);
  font-family:var(--mono);font-size:13px;font-weight:600;padding:8px 10px;outline:none;
  transition:border .15s,box-shadow .15s;width:100%;}
.pf-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.12);}
.op-section{background:var(--bg3);border:1px solid var(--border);border-radius:4px;
  padding:12px 14px;margin-bottom:14px;}
.op-section-title{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:10px;}
.op-row{display:grid;grid-template-columns:1fr;gap:10px;}
@media(min-width:480px){.op-row{grid-template-columns:1fr 1fr;}}
.op-field{display:flex;flex-direction:column;gap:4px;}
.op-lbl{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.op-inp{background:var(--bg);border:2px solid var(--border);border-radius:3px;color:var(--amber2);
  font-family:var(--mono);font-size:14px;font-weight:700;padding:9px 12px;outline:none;
  transition:border .15s,box-shadow .15s;width:100%;letter-spacing:1px;}
.op-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.15);}
.op-inp::placeholder{color:var(--muted);font-size:11px;font-weight:400;}

/* SERIAL */
.serial-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;}
@media(min-width:480px){.serial-grid{grid-template-columns:repeat(5,1fr);}}
.sc{display:flex;flex-direction:column;gap:4px;}
.sc-lbl{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;}
.sc-inp{background:var(--bg3);border:2px solid var(--border);border-radius:3px;
  color:var(--amber2);font-family:var(--mono);font-size:14px;font-weight:700;
  padding:8px 6px;outline:none;text-align:center;letter-spacing:1px;
  transition:border .15s,box-shadow .15s;width:100%;-moz-appearance:textfield;}
.sc-inp::-webkit-inner-spin-button,.sc-inp::-webkit-outer-spin-button{-webkit-appearance:none;}
.sc-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.15);}
.sc-inp::placeholder{color:var(--border);font-size:10px;font-weight:400;}
.sc-inp.filled{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.04);}
.sc-inp.dup{border-color:#ef4444;background:rgba(239,68,68,.06);}
.sc-err{font-family:var(--mono);font-size:8px;color:#ef4444;margin-top:2px;}
.prog-wrap{height:3px;background:var(--bg3);border-radius:2px;margin-bottom:14px;}
.prog-bar{height:3px;background:var(--amber);border-radius:2px;transition:width .3s;}

/* CONTROL */
.ctrl-body{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:6px;}
@media(min-width:600px){.ctrl-body{padding:12px 20px;}}
.b-row{background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  display:flex;flex-wrap:wrap;align-items:stretch;overflow:hidden;transition:border-color .15s;}
.b-row.bok{border-color:rgba(16,185,129,.45);}
.b-row.bnok{border-color:rgba(239,68,68,.4);}
.b-i{font-family:var(--mono);font-size:10px;color:var(--muted);width:26px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;border-right:1px solid var(--border);}
.b-n{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--amber2);
  padding:10px 10px;letter-spacing:1px;border-right:1px solid var(--border);
  display:flex;align-items:center;flex-shrink:0;min-width:80px;}
@media(min-width:480px){.b-n{min-width:120px;font-size:14px;}}
.b-ctrl{display:flex;align-items:center;gap:5px;padding:7px 8px;flex:1;flex-wrap:wrap;}
.z-btn{font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:1px;
  padding:6px 8px;border:2px solid var(--border);border-radius:3px;
  cursor:pointer;background:var(--bg3);color:var(--muted);
  transition:all .15s;text-transform:uppercase;white-space:nowrap;user-select:none;
  -webkit-tap-highlight-color:transparent;}
@media(min-width:480px){.z-btn{padding:7px 10px;font-size:10px;}}
.z-btn:hover,.z-btn:active{border-color:var(--light);color:var(--text);}
.z-btn.aS  {background:rgba(16,185,129,.18);border-color:#10b981;color:#10b981;}
.z-btn.aCOL{background:rgba(239,68,68,.18);border-color:#ef4444;color:#ef4444;}
.z-btn.aMED{background:rgba(251,146,60,.18);border-color:#fb923c;color:#fb923c;}
.z-btn.aGAL{background:rgba(167,139,250,.18);border-color:#a78bfa;color:#a78bfa;}
.z-btn.aPIED{background:rgba(96,165,250,.18);border-color:#60a5fa;color:#60a5fa;}
.b-sep{color:rgba(42,52,68,.8);font-size:14px;user-select:none;}
.b-st{padding:6px 10px;font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:1px;
  flex-shrink:0;white-space:nowrap;}
.b-st.bok{color:#10b981;}
.b-st.bnok{color:#ef4444;}
.b-st.none{color:var(--muted);}
@media(max-width:479px){.b-st{width:100%;text-align:right;border-top:1px solid rgba(42,52,68,.3);padding:4px 8px;}}

/* VAL BAR */
.val-bar{background:var(--bg2);border-top:1px solid var(--border);
  padding:9px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0;}
.val-info{font-family:var(--mono);font-size:10px;color:var(--muted);}
.val-info b{color:var(--amber2);}
.val-warn{font-family:var(--mono);font-size:8px;color:#fb923c;display:block;margin-top:2px;}

/* STATS */
.stats-row{display:flex;flex-wrap:wrap;background:var(--bg3);border-bottom:1px solid var(--border);flex-shrink:0;}
.sc2{flex:1;min-width:70px;padding:8px 10px;border-right:1px solid var(--border);
  display:flex;flex-direction:column;gap:1px;}
.sc2:last-child{border-right:none;}
.sv{font-family:var(--disp);font-size:clamp(20px,5vw,28px);letter-spacing:1px;line-height:1;}
.sv.bl{color:var(--blue);}.sv.gr{color:var(--green);}.sv.re{color:var(--red);}.sv.am{color:var(--amber);}
.sl{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.formula{font-family:var(--mono);font-size:12px;font-weight:700;display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
.fop{color:var(--muted);}

/* LEGEND */
.legend{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-family:var(--mono);font-size:8px;
  color:var(--muted);padding:5px 12px;background:rgba(0,0,0,.2);
  border-bottom:1px solid var(--border);flex-shrink:0;}
.li{display:flex;align-items:center;gap:3px;}
.ldot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}

/* ZONE STATS */
.zstats{display:flex;flex-wrap:wrap;background:var(--bg2);
  border-bottom:1px solid var(--border);flex-shrink:0;}
.zsc{flex:1;min-width:80px;padding:8px 10px;border-right:1px solid var(--border);
  position:relative;overflow:hidden;}
.zsc:last-child{border-right:none;}
.zs-bar2{position:absolute;bottom:0;left:0;height:2px;transition:width .5s;}
.zs-id{font-family:var(--mono);font-size:7px;letter-spacing:2px;text-transform:uppercase;margin-bottom:1px;font-weight:700;}
.zs-n{font-family:var(--disp);font-size:22px;letter-spacing:1px;line-height:1;margin-bottom:1px;}
.zs-f{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;margin-bottom:3px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.zs-p{display:flex;gap:4px;flex-wrap:wrap;}
.zs-pp{font-family:var(--mono);font-size:8px;font-weight:700;padding:1px 5px;border-radius:2px;border:1px solid;}
.zs-pp.nk{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);color:#f87171;}
.zs-pp.tt{background:rgba(90,106,130,.08);border-color:rgba(90,106,130,.3);color:var(--light);}
.zs-l{font-family:var(--mono);font-size:7px;color:var(--muted);}

/* RECAP TABLE */
.recap-wrap{flex:1;overflow:auto;padding:10px 12px;}
@media(min-width:600px){.recap-wrap{padding:12px 20px;}}
.recap-sec{margin-bottom:14px;}
.rlh{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:5px 8px;background:var(--bg3);border:1px solid var(--border);
  border-radius:3px 3px 0 0;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.rlh-n{color:var(--amber);font-weight:700;}
.rlh-ok{color:#10b981;}
.rlh-nok{color:#ef4444;}
.rt{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:10px;}
.rt thead th{background:rgba(30,37,48,.9);border:1px solid var(--border);padding:4px 7px;
  text-align:center;font-size:7px;letter-spacing:1px;text-transform:uppercase;}
.rt thead th.thn{text-align:left;color:var(--light);}
.rt thead th.thok{color:#10b981;}
.rt thead th.therr{color:#ef4444;background:rgba(239,68,68,.04);}
.rt tbody td{padding:4px 7px;border:1px solid rgba(42,52,68,.5);text-align:center;}
.rt tbody tr:hover td{background:rgba(245,158,11,.02);}
.rt tbody tr:nth-child(even) td{background:rgba(255,255,255,.01);}
.tdi{color:var(--muted);font-size:8px;width:22px;}
.tdn{text-align:left!important;color:var(--amber2);font-weight:700;font-size:11px;letter-spacing:1px;}
.mks{color:#10b981;font-size:13px;font-weight:900;}
.mkx{font-size:11px;font-weight:900;}
.col{color:#ef4444;}.med{color:#fb923c;}.gal{color:#a78bfa;}.pid{color:#60a5fa;}

/* BOTTOM BAR */
.bot-bar{background:var(--bg2);border-top:1px solid var(--border);
  padding:9px 12px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;flex-shrink:0;}
.fpill{font-family:var(--mono);font-size:12px;font-weight:700;
  background:var(--bg3);border:1px solid var(--border);padding:5px 10px;border-radius:3px;letter-spacing:1px;}

/* BUTTONS */
.btn{font-family:var(--disp);font-size:14px;letter-spacing:2px;padding:8px 16px;border-radius:3px;
  cursor:pointer;border:none;transition:all .15s;white-space:nowrap;
  -webkit-tap-highlight-color:transparent;}
.btn-a{background:var(--amber);color:#0e1015;}
.btn-a:hover,.btn-a:active{background:var(--amber2);}
.btn-a:disabled{opacity:.35;cursor:not-allowed;}
.btn-g{background:rgba(16,185,129,.12);color:#10b981;border:1px solid #10b981;}
.btn-g:hover,.btn-g:active{background:rgba(16,185,129,.22);}
.btn-gh{background:none;color:var(--muted);border:1px solid var(--border);font-size:11px;}
.btn-gh:hover,.btn-gh:active{border-color:var(--light);color:var(--text);}
.btn-b{background:rgba(96,165,250,.12);color:#60a5fa;border:1px solid #60a5fa;font-size:11px;}
.btn-b:hover,.btn-b:active{background:rgba(96,165,250,.22);}
.btn-sm{padding:5px 10px;font-size:11px;letter-spacing:1px;}

/* HISTORY */
.hist-body{flex:1;overflow:auto;padding:12px;}
@media(min-width:600px){.hist-body{padding:16px 22px;}}
.hist-search{display:flex;gap:7px;align-items:center;margin-bottom:16px;flex-wrap:wrap;}
.hs-inp{background:var(--bg3);border:2px solid var(--border);border-radius:3px;
  color:var(--text);font-family:var(--mono);font-size:13px;padding:8px 10px;outline:none;
  transition:border .15s;flex:1;min-width:140px;}
.hs-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.12);}
.hs-clear{background:none;border:1px solid var(--border);color:var(--muted);
  font-family:var(--mono);font-size:10px;padding:7px 10px;border-radius:3px;cursor:pointer;}
.hs-clear:hover{border-color:var(--red);color:var(--red);}
.hload{display:flex;align-items:center;justify-content:center;height:180px;
  font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:2px;gap:10px;}
.hspinner{width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--amber);
  border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.hempty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;gap:12px;}
.hempty-icon{font-size:38px;opacity:.3;}
.hempty-txt{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;}

/* DAY BLOCK */
.day-block{margin-bottom:24px;}
.day-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;
  padding-bottom:8px;border-bottom:2px solid var(--border);flex-wrap:wrap;}
.day-lbl{font-family:var(--disp);font-size:clamp(14px,4vw,20px);letter-spacing:2px;color:var(--text);}
.day-lbl span{color:var(--amber);}
.day-stats{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
.ds{font-family:var(--mono);font-size:8px;padding:2px 7px;border-radius:2px;border:1px solid;}
.ds.dtot{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.ds.dok {color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.ds.dnok{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.ds.dtaux{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}

/* MEDIANNE BLOCK inside a day */
.med-block{margin-bottom:12px;border:1px solid var(--border);border-radius:4px;overflow:hidden;}
.med-hdr{display:flex;align-items:center;gap:8px;padding:8px 12px;
  background:var(--bg3);flex-wrap:wrap;}
.med-name{font-family:var(--disp);font-size:clamp(14px,4vw,18px);letter-spacing:3px;color:var(--amber);}
.med-pills{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
.mpill{font-family:var(--mono);font-size:8px;font-weight:700;padding:2px 7px;border-radius:2px;border:1px solid;}
.mpill.mt{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.mpill.mo{color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.mpill.mn{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.mpill.mx{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.med-dl{margin-left:auto;}

/* SESSION inside medianne */
.sess-card{border-top:1px solid var(--border);background:var(--bg2);}
.sess-hdr{display:flex;align-items:center;gap:8px;padding:8px 12px;
  cursor:pointer;user-select:none;flex-wrap:wrap;
  -webkit-tap-highlight-color:transparent;}
.sess-hdr:hover{background:rgba(245,158,11,.03);}
.sh-type{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 5px;border-radius:2px;background:rgba(245,158,11,.06);}
.sh-op{font-family:var(--mono);font-size:9px;color:var(--light);}
.sh-time{font-family:var(--mono);font-size:8px;color:var(--muted);}
.sh-pills{display:flex;gap:4px;flex-wrap:wrap;}
.shp{font-family:var(--mono);font-size:8px;font-weight:700;padding:2px 6px;border-radius:2px;border:1px solid;}
.shp.st{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.shp.so{color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.shp.sn{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.shp.sx{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.sh-chev{font-size:10px;color:var(--muted);transition:transform .2s;margin-left:auto;flex-shrink:0;}
.sh-chev.open{transform:rotate(90deg);}
.sess-detail{border-top:1px solid var(--border);padding:10px 12px;}

/* LOT MINI */
.lot-mini{margin-bottom:10px;}
.lmh{font-family:var(--mono);font-size:7px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:4px 7px;background:var(--bg3);border:1px solid var(--border);
  border-radius:2px 2px 0 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.lmh-n{color:var(--amber);font-weight:700;}
.lmh-ok{color:#10b981;}
.lmh-nok{color:#ef4444;}
.lmt{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:9px;}
.lmt thead th{background:rgba(30,37,48,.9);border:1px solid var(--border);padding:3px 6px;
  text-align:center;font-size:7px;letter-spacing:1px;text-transform:uppercase;}
.lmt thead th.ltn{text-align:left;color:var(--light);}
.lmt thead th.ltok{color:#10b981;}
.lmt thead th.lterr{color:#ef4444;background:rgba(239,68,68,.04);}
.lmt tbody td{padding:3px 6px;border:1px solid rgba(42,52,68,.5);text-align:center;}

/* SAVING */
.sav-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;
  justify-content:center;z-index:9999;backdrop-filter:blur(4px);}
.sav-box{background:var(--bg2);border:1px solid var(--amber);border-radius:4px;
  padding:26px 36px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.6);}
.sav-sp{width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--amber);
  border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;}
.sav-txt{font-family:var(--mono);font-size:10px;color:var(--amber);letter-spacing:2px;}

/* TOAST */
.tw{position:fixed;bottom:14px;right:10px;z-index:999;display:flex;flex-direction:column;
  gap:5px;pointer-events:none;max-width:calc(100vw - 20px);}
.toast{background:var(--bg2);border:1px solid #10b981;border-left:4px solid #10b981;
  color:var(--text);padding:8px 12px;border-radius:3px;font-family:var(--mono);font-size:10px;
  animation:toastIn .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.5);}
.toast.e{border-color:#ef4444;border-left-color:#ef4444;}
@keyframes toastIn{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}
`;

let cssInj = false;
function injectCSS() {
  if (cssInj) return; cssInj = true;
  const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
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
    date:      new Date().toISOString().split("T")[0],
    pression:  "30",
    op1:       "",
    op2:       "",
  });

  const [sessionId, setSessionId] = useState(null);
  const [serials,   setSerials]   = useState(Array(BATCH_SIZE).fill(""));
  const [dupErrors, setDupErrors] = useState({});
  const [checks,    setChecks]    = useState({});
  const [lots,      setLots]      = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [syncState, setSyncState] = useState("idle");

  // History
  const [histData,    setHistData]    = useState(null);
  const [histLoading, setHistLoading] = useState(false);
  const [searchDate,  setSearchDate]  = useState("");
  const [expanded,    setExpanded]    = useState(new Set());

  const [toasts, setToasts] = useState([]);
  const inputRefs = useRef([]);

  const toast = useCallback((msg, err = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, err }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  /* ── Load history ── */
  const loadHistory = useCallback(async () => {
    if (!sb) return;
    setHistLoading(true);
    try {
      const { data: sessions, error: sErr } = await sb
        .from("sessions").select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;

      const { data: lotsData, error: lErr } = await sb
        .from("lots").select("*").order("lot_num", { ascending: true });
      if (lErr) throw lErr;

      const { data: bots, error: bErr } = await sb.from("bouteilles").select("*");
      if (bErr) throw bErr;

      const assembled = sessions.map(s => {
        const sLots = lotsData.filter(l => l.session_id === s.id).map(l => ({
          ...l, bouteilles: bots.filter(b => b.lot_id === l.id),
        }));
        const allB  = sLots.flatMap(l => l.bouteilles);
        const nb_ok  = allB.filter(b => b.succes).length;
        const nb_nok = allB.filter(b => !b.succes && (b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
        return { ...s, lots: sLots, nb_ok, nb_nok, total: allB.length };
      });
      setHistData(assembled);
    } catch (err) {
      toast("Erreur chargement : " + err.message, true);
      setHistData([]);
    } finally {
      setHistLoading(false);
    }
  }, [sb]);

  useEffect(() => {
    if (screen === "history" && sb && histData === null) loadHistory();
  }, [screen, sb, histData, loadHistory]);

  /* ── Build history structure: day → machine → sessions ── */
  const histByDayMachine = (histData || []).reduce((acc, s) => {
    const day = s.date;
    if (!acc[day]) acc[day] = {};
    const mac = s.machine;
    if (!acc[day][mac]) acc[day][mac] = [];
    acc[day][mac].push(s);
    return acc;
  }, {});

  const allDays = Object.keys(histByDayMachine);
  const filteredDays = searchDate
    ? allDays.filter(d => d === searchDate)
    : allDays;

  /* ── Serial validation ── */
  const handleSerial = (i, raw) => {
    const val = raw.replace(/\D/g, "");
    const next = [...serials]; next[i] = val; setSerials(next);
    const errs = {};
    next.forEach((s, j) => {
      if (!s) return;
      const dups = next.filter((x, k) => k !== j && x === s);
      if (dups.length > 0) errs[j] = true;
    });
    setDupErrors(errs);
  };

  /* ── Toggle zone ── */
  const toggleZone = (idx, zoneId) => {
    setChecks(prev => {
      const set = new Set(prev[idx] || []);
      if (zoneId === "S") {
        if (set.has("S")) set.delete("S"); else { set.clear(); set.add("S"); }
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
  const hasDups    = Object.keys(dupErrors).length > 0;

  const allEntries = lots.flatMap(l => l.serials);
  const gtTotal    = allEntries.length;
  const gtOk       = allEntries.filter(e => e.zones.includes("S")).length;
  const gtNok      = allEntries.filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
  const gtTaux     = (gtOk + gtNok) > 0 ? Math.round(gtOk / (gtOk + gtNok) * 100) : null;
  const zoneStats  = ZONES.map(z => {
    const count  = allEntries.filter(e => e.zones.includes(z.id)).length;
    const pctNok = gtNok   > 0 ? Math.round(count / gtNok   * 100) : 0;
    const pctTot = gtTotal > 0 ? Math.round(count / gtTotal * 100) : 0;
    return { ...z, count, pctNok, pctTot };
  });

  /* ── Validate lot ── */
  const validateLot = async () => {
    if (!allChecked) { toast("Cochez toutes les bouteilles.", true); return; }
    setSaving(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const ops = [params.op1, params.op2].filter(Boolean).join(" / ");
        const { data, error } = await sb.from("sessions").insert({
          machine:     machine.label,
          bottle_type: bottleType,
          operateur:   ops || null,
          date:        params.date,
          pression:    params.pression,
        }).select("id").single();
        if (error) throw error;
        sid = data.id;
        setSessionId(sid);
      }
      const { data: lotData, error: lErr } = await sb.from("lots")
        .insert({ session_id: sid, lot_num: lots.length + 1 })
        .select("id").single();
      if (lErr) throw lErr;

      const rows = filled.map(i => {
        const z = checks[i] || new Set();
        return { lot_id: lotData.id, num_serie: serials[i].trim(),
          succes: z.has("S"), zone_col: z.has("COL"), zone_med: z.has("MED"),
          zone_gal: z.has("GAL"), zone_pied: z.has("PIED") };
      });
      const { error: bErr } = await sb.from("bouteilles").insert(rows);
      if (bErr) throw bErr;

      setLots(prev => [...prev, {
        lotNum: prev.length + 1,
        serials: filled.map(i => ({ num: serials[i].trim(), zones: [...(checks[i] || [])] })),
      }]);
      setSerials(Array(BATCH_SIZE).fill(""));
      setDupErrors({});
      setChecks({});
      setSyncState("ok");
      setHistData(null);
      setScreen("recap");
      toast(`✅ Lot ${lots.length + 1} sauvegardé !`);
    } catch (err) {
      setSyncState("err");
      toast(`⚠️ ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  /* ── Export: current session ── */
  const exportSession = () => {
    if (!XLSX || !gtTotal) return;
    const ops = [params.op1, params.op2].filter(Boolean).join(" / ") || "—";
    const ws = buildSessionSheet(machine?.label, bottleType, ops, params.date, params.pression, lots);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Session");
    XLSX.writeFile(wb, `hydro_${machine?.label.replace(/\s+/g,"_")}_${params.date}.xlsx`);
    toast("✅ Excel exporté !");
  };

  /* ── Export: one MEDIANNE on a given day ── */
  const exportMachineDay = (day, machineName, sessions) => {
    if (!XLSX) return;
    const wb = XLSX.utils.book_new();
    const ws = buildDayMachineSheet(day, machineName, sessions);
    XLSX.utils.book_append_sheet(wb, ws, machineName.replace(/\s+/g,"_"));
    XLSX.writeFile(wb, `hydro_${machineName.replace(/\s+/g,"_")}_${day}.xlsx`);
    toast(`✅ ${machineName} — ${day} exporté !`);
  };

  /* ── Export: full day (all machines) ── */
  const exportFullDay = (day) => {
    if (!XLSX) return;
    const dayMachines = histByDayMachine[day] || {};
    const wb = XLSX.utils.book_new();
    Object.entries(dayMachines).forEach(([mac, sessions]) => {
      const ws = buildDayMachineSheet(day, mac, sessions);
      XLSX.utils.book_append_sheet(wb, ws, mac.replace(/\s+/g,"_").slice(0,31));
    });
    // Summary sheet
    const sumWs = buildDaySummarySheet(day, dayMachines);
    XLSX.utils.book_append_sheet(wb, sumWs, "RÉSUMÉ");
    XLSX.writeFile(wb, `historique_complet_${day}.xlsx`);
    toast(`✅ Historique complet du ${day} exporté !`);
  };

  /* ── Sheet builders ── */
  function buildSessionSheet(mac, type, ops, date, pression, sessionLots) {
    const wsData = [
      ["FICHE DE SUIVI TEST HYDROSTATIQUE"], [],
      ["Machine:", mac, "Type:", type, "Opérateurs:", ops, "Date:", date, "Pression:", pression + " bars"], [],
    ];
    let n = 1;
    sessionLots.forEach(lot => {
      wsData.push([`LOT ${lot.lotNum}`, "", "", "", "", "", ""]);
      wsData.push(["#", "N° Série", "SUCCÈS", "Col", "Med", "Gal", "Pied"]);
      lot.serials.forEach(e => wsData.push([
        n++, e.num,
        e.zones.includes("S")?"✓":"", e.zones.includes("COL")?"X":"",
        e.zones.includes("MED")?"X":"", e.zones.includes("GAL")?"X":"", e.zones.includes("PIED")?"X":"",
      ]));
      const lOk  = lot.serials.filter(e => e.zones.includes("S")).length;
      const lNok = lot.serials.filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
      wsData.push(["", `OK: ${lOk}  NOK: ${lNok}`, "", "", "", "", ""]); wsData.push([]);
    });
    const total = sessionLots.flatMap(l => l.serials).length;
    const ok    = sessionLots.flatMap(l => l.serials).filter(e => e.zones.includes("S")).length;
    const nok   = sessionLots.flatMap(l => l.serials).filter(e => e.zones.length > 0 && !e.zones.includes("S")).length;
    wsData.push(["TOTAL", total,"","","","",""], ["SUCCÈS", ok,"","","","",""],
      ["ÉCHECS", nok,"","","","",""],
      ["TAUX", (ok+nok)>0?Math.round(ok/(ok+nok)*100)+"%":"—","","","","",""]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{wch:6},{wch:16},{wch:10},{wch:6},{wch:6},{wch:6},{wch:6}];
    return ws;
  }

  function buildDayMachineSheet(day, machineName, sessions) {
    const wsData = [
      [`TEST HYDROSTATIQUE — ${machineName}`],
      [`Date : ${fmtDate(day)}`], [],
      ["Opérateurs", "Type", "Heure", "Lot", "N° Série", "Succès", "Col", "Med", "Gal", "Pied"],
    ];
    sessions.forEach(s => {
      s.lots.forEach(l => {
        l.bouteilles.forEach(b => {
          wsData.push([
            s.operateur||"—", s.bottle_type, fmtTime(s.created_at),
            `Lot ${l.lot_num}`, b.num_serie,
            b.succes?"✓":"", b.zone_col?"X":"", b.zone_med?"X":"", b.zone_gal?"X":"", b.zone_pied?"X":"",
          ]);
        });
      });
    });
    wsData.push([], ["RÉSUMÉ PAR SESSION", "", "", "", "", "", "", "", "", ""]);
    wsData.push(["Opérateurs", "Type", "Total", "OK", "NOK", "Taux", "", "", "", ""]);
    let dayTot = 0, dayOk = 0, dayNok = 0;
    sessions.forEach(s => {
      const taux = (s.nb_ok+s.nb_nok)>0?Math.round(s.nb_ok/(s.nb_ok+s.nb_nok)*100):0;
      wsData.push([s.operateur||"—", s.bottle_type, s.total, s.nb_ok, s.nb_nok, taux+"%","","","",""]);
      dayTot += s.total; dayOk += s.nb_ok; dayNok += s.nb_nok;
    });
    const dayTaux = (dayOk+dayNok)>0?Math.round(dayOk/(dayOk+dayNok)*100):0;
    wsData.push(["TOTAL "+machineName,"",dayTot,dayOk,dayNok,dayTaux+"%","","","",""]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{wch:18},{wch:8},{wch:8},{wch:7},{wch:14},{wch:7},{wch:5},{wch:5},{wch:5},{wch:5}];
    return ws;
  }

  function buildDaySummarySheet(day, dayMachines) {
    const wsData = [
      [`RÉSUMÉ JOURNÉE — ${fmtDate(day)}`], [],
      ["Machine", "Sessions", "Total bouteilles", "OK", "NOK", "Taux conformité"],
    ];
    let gt = 0, gok = 0, gnok = 0;
    Object.entries(dayMachines).forEach(([mac, sessions]) => {
      const tot = sessions.reduce((a,s)=>a+s.total,0);
      const ok  = sessions.reduce((a,s)=>a+s.nb_ok,0);
      const nok = sessions.reduce((a,s)=>a+s.nb_nok,0);
      const tx  = (ok+nok)>0?Math.round(ok/(ok+nok)*100):0;
      wsData.push([mac, sessions.length, tot, ok, nok, tx+"%"]);
      gt+=tot; gok+=ok; gnok+=nok;
    });
    const gtx = (gok+gnok)>0?Math.round(gok/(gok+gnok)*100):0;
    wsData.push([], ["TOTAL JOURNÉE", "", gt, gok, gnok, gtx+"%"]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{wch:14},{wch:10},{wch:18},{wch:8},{wch:8},{wch:16}];
    return ws;
  }

  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const Toasts = () => (
    <div className="tw">
      {toasts.map(t => <div key={t.id} className={`toast${t.err?" e":""}`}>{t.msg}</div>)}
    </div>
  );
  const Saving = () => saving ? (
    <div className="sav-ov"><div className="sav-box">
      <div className="sav-sp" /><div className="sav-txt">SAUVEGARDE…</div>
    </div></div>
  ) : null;

  const TopBar = ({ showExport = false }) => (
    <div className="top-bar">
      <div className="top-machine">{machine?.label}</div>
      <div className="chips">
        <div className="chip">📅 <span>{params.date}</span></div>
        {(params.op1||params.op2) && (
          <div className="chip">👥 <span>{[params.op1,params.op2].filter(Boolean).join(" & ")}</span></div>
        )}
        <div className="chip">⚙ <span>{params.pression}b</span></div>
        {bottleType && <div className="chip tc">🫙 <span>{bottleType}</span></div>}
        {lots.length > 0 && <div className="chip">📦 <span>{lots.length}lot</span></div>}
        {syncState==="ok"  && <div className="chip ok">☁ <span>OK</span></div>}
        {syncState==="err" && <div className="chip err">☁ <span>ERR</span></div>}
      </div>
      <div className="top-right">
        <button className="btn btn-b btn-sm"
          onClick={() => { setHistData(null); setScreen("history"); }}>📋</button>
        {showExport && gtTotal > 0 && (
          <button className="btn btn-g btn-sm" onClick={exportSession}>📊</button>
        )}
      </div>
    </div>
  );

  /* ══════════ SCREEN: MACHINE ══════════ */
  if (screen === "machine") return (
    <div className="fs">
      <div className="fs-grid" />
      <div className="fs-badge">⚙ WONDERFUL METAL · QC</div>
      <div className="fs-title">TEST <span>HYDRO</span>STATIQUE</div>
      <div className="fs-sub">PRESSION 30 BARS</div>
      <div className="card">
        <div className="card-lbl">Sélectionnez la machine</div>
        <div className="machine-grid">
          {MACHINES.map(m => (
            <button key={m.id} className={`m-btn${machine?.id===m.id?" sel":""}`}
              onClick={() => setMachine(m)}>
              {machine?.id===m.id && <span className="m-check">✓</span>}
              <div className="m-name">{m.label}</div>
              <div className="m-tag">6 KG · 12.5 KG</div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button className="btn btn-b btn-sm"
            onClick={() => { setHistData(null); setScreen("history"); }}>
            📋 Historique
          </button>
          <button className="btn btn-a"
            style={{opacity: machine ? 1 : 0.35}}
            onClick={() => { if (machine) setScreen("bottletype"); }}>
            SUIVANT →
          </button>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ SCREEN: BOTTLE TYPE ══════════ */
  if (screen === "bottletype") return (
    <div className="fs">
      <div className="fs-grid" />
      <div className="fs-badge">⚙ {machine?.label}</div>
      <div className="fs-title">TYPE <span>BOUTEILLE</span></div>
      <div className="fs-sub">SÉLECTIONNEZ LE FORMAT</div>
      <div className="card">
        <div className="btype-grid">
          {BOTTLE_TYPES.map(bt => (
            <button key={bt.id} className={`bt-btn${bottleType===bt.id?" sel":""}`}
              onClick={() => setBottleType(bt.id)}>
              {bottleType===bt.id && <span className="bt-check">✓</span>}
              <div className="bt-kg">{bt.label}</div>
              <div className="bt-unit">{bt.unit}</div>
              <div className="bt-desc">{bt.sub}</div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button className="btn btn-gh" onClick={() => { setBottleType(null); setScreen("machine"); }}>← Retour</button>
          <button className="btn btn-a" style={{opacity: bottleType ? 1 : 0.35}}
            onClick={() => { if (bottleType) setScreen("params"); }}>SUIVANT →</button>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ SCREEN: PARAMS ══════════ */
  if (screen === "params") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">{machine?.label}</div>
        <div className="chip tc">🫙 <span>{bottleType}</span></div>
      </div>
      <div className="center-body">
        <div className="form-card" style={{maxWidth:640}}>
          <div className="form-title">Paramètres de session</div>
          <div className="form-sub">DATE, OPÉRATEURS ET PRESSION</div>

          {/* Operators section */}
          <div className="op-section">
            <div className="op-section-title">👥 Opérateurs</div>
            <div className="op-row">
              <div className="op-field">
                <label className="op-lbl">Opérateur 1</label>
                <input className="op-inp" placeholder="Nom de l'opérateur 1"
                  value={params.op1}
                  onChange={e => setP("op1", e.target.value)} />
              </div>
              <div className="op-field">
                <label className="op-lbl">Opérateur 2</label>
                <input className="op-inp" placeholder="Nom de l'opérateur 2"
                  value={params.op2}
                  onChange={e => setP("op2", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pg pg-2">
            <div className="pf">
              <label className="pf-lbl">📅 Date</label>
              <input type="date" className="pf-inp"
                value={params.date} onChange={e => setP("date", e.target.value)} />
            </div>
            <div className="pf">
              <label className="pf-lbl">⚙ Pression (bars)</label>
              <input className="pf-inp" value={params.pression}
                onChange={e => setP("pression", e.target.value)} />
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <button className="btn btn-gh" onClick={() => setScreen("bottletype")}>← Retour</button>
            <button className="btn btn-a" onClick={() => setScreen("serials")}>COMMENCER →</button>
          </div>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ SCREEN: SERIALS ══════════ */
  if (screen === "serials") return (
    <div className="page">
      <TopBar />
      <div className="center-body">
        <div className="form-card">
          <div className="form-title">
            Lot {lots.length + 1}
            <span style={{fontSize:12,color:"var(--amber)",marginLeft:10,
              fontFamily:"var(--mono)",letterSpacing:2}}>[{bottleType}]</span>
          </div>
          <div className="form-sub">N° DE SÉRIE — CHIFFRES UNIQUEMENT, TOUS DIFFÉRENTS</div>
          <div className="serial-grid">
            {serials.map((val, i) => (
              <div className="sc" key={i}>
                <span className="sc-lbl">BTL {i + 1}</span>
                <input
                  ref={el => (inputRefs.current[i] = el)}
                  type="text" inputMode="numeric" pattern="[0-9]*"
                  className={`sc-inp${val?" filled":""}${dupErrors[i]?" dup":""}`}
                  placeholder="00000" value={val} maxLength={10}
                  autoFocus={i === 0}
                  onChange={e => handleSerial(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault(); inputRefs.current[i + 1]?.focus();
                    }
                  }}
                />
                {dupErrors[i] && <div className="sc-err">Doublon !</div>}
              </div>
            ))}
          </div>
          <div className="prog-wrap">
            <div className="prog-bar"
              style={{width:`${serials.filter(s=>s.trim()).length/BATCH_SIZE*100}%`}} />
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6}}>
              {lots.length > 0 && <button className="btn btn-gh" onClick={() => setScreen("recap")}>← Récap</button>}
              <button className="btn btn-gh" onClick={() => setScreen("params")}>← Params</button>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>
                {serials.filter(s=>s.trim()).length}/{BATCH_SIZE}
              </span>
              {hasDups && <span style={{fontFamily:"var(--mono)",fontSize:8,color:"#ef4444"}}>⚠ Doublons</span>}
              <button className="btn btn-a"
                style={{opacity: serials.some(s=>s.trim()) && !hasDups ? 1 : 0.35}}
                onClick={() => { if (serials.some(s=>s.trim()) && !hasDups) setScreen("control"); }}>
                CONTRÔLER →
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toasts />
    </div>
  );

  /* ══════════ SCREEN: CONTROL ══════════ */
  if (screen === "control") return (
    <div className="page">
      <TopBar />
      <div className="stats-row">
        <div className="sc2"><div className="sv bl">{filled.length}</div><div className="sl">Lot</div></div>
        <div className="sc2"><div className="sv am">{curCocked}</div><div className="sl">Cochées</div></div>
        <div className="sc2"><div className="sv gr">{curOk}</div><div className="sl">✓ OK</div></div>
        <div className="sc2"><div className="sv re">{curNok}</div><div className="sl">✗ NOK</div></div>
        <div className="sc2" style={{flex:2,justifyContent:"center",display:"flex",alignItems:"center"}}>
          <div className="formula">
            <span className="fop">[</span><span style={{color:"#60a5fa"}}>{curOk+curNok}</span>
            <span className="fop">−</span><span style={{color:"#ef4444"}}>{curNok}</span>
            <span className="fop">=</span><span style={{color:"#10b981"}}>{curOk}</span>
            <span className="fop">]</span>
          </div>
        </div>
      </div>
      <div className="legend">
        <span style={{fontWeight:700,marginRight:4}}>ZONES :</span>
        {ZONES.map(z => (
          <div className="li" key={z.id}>
            <div className="ldot" style={{background:z.color}} />
            <span><b>{z.id}</b> {z.full}</span>
          </div>
        ))}
      </div>
      <div className="ctrl-body">
        {serials.map((num, i) => {
          if (!num.trim()) return null;
          const set  = checks[i] || new Set();
          const isOk = set.has("S");
          const isNok= set.size > 0 && !isOk;
          return (
            <div className={`b-row${isOk?" bok":isNok?" bnok":""}`} key={i}>
              <div className="b-i">{i+1}</div>
              <div className="b-n">{num.trim()}</div>
              <div className="b-ctrl">
                <button className={`z-btn${set.has("S")?" aS":""}`}
                  onClick={() => toggleZone(i,"S")}>✓ OK</button>
                <span className="b-sep">|</span>
                {ZONES.map(z => (
                  <button key={z.id} className={`z-btn${set.has(z.id)?` a${z.id}`:""}`}
                    onClick={() => toggleZone(i,z.id)}>{z.label}</button>
                ))}
              </div>
              <div className={`b-st${isOk?" bok":isNok?" bnok":" none"}`}>
                {isOk?"✓ OK":isNok?`✗ ${[...set].join("+")}` :"— attente"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="val-bar">
        <div className="val-info">
          Lot <b>{lots.length+1}</b> · <b>{curCocked}</b>/{filled.length}
          {!allChecked && curCocked > 0 &&
            <span className="val-warn">Cochez toutes les bouteilles pour valider</span>}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <button className="btn btn-gh" onClick={() => setScreen("serials")}>← N°</button>
          <button className="btn btn-a"
            style={{opacity: allChecked && !saving ? 1 : 0.35}}
            onClick={validateLot}>
            {saving ? "…" : "VALIDER ✓"}
          </button>
        </div>
      </div>
      <Saving /><Toasts />
    </div>
  );

  /* ══════════ SCREEN: RECAP ══════════ */
  if (screen === "recap") return (
    <div className="page">
      <TopBar showExport />
      <div className="stats-row">
        <div className="sc2"><div className="sv bl">{gtTotal}</div><div className="sl">Total</div></div>
        <div className="sc2"><div className="sv am">{lots.length}</div><div className="sl">Lots</div></div>
        <div className="sc2"><div className="sv gr">{gtOk}</div><div className="sl">✓ OK</div></div>
        <div className="sc2"><div className="sv re">{gtNok}</div><div className="sl">✗ NOK</div></div>
        <div className="sc2"><div className="sv am">{gtTaux!==null?gtTaux+"%":"—"}</div><div className="sl">Conform.</div></div>
        <div className="sc2" style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="formula">
            <span className="fop">[</span><span style={{color:"#60a5fa"}}>{gtOk+gtNok}</span>
            <span className="fop">−</span><span style={{color:"#ef4444"}}>{gtNok}</span>
            <span className="fop">=</span><span style={{color:"#10b981"}}>{gtOk}</span>
            <span className="fop">]</span>
          </div>
        </div>
      </div>
      <div className="legend">
        {ZONES.map(z=>(
          <div className="li" key={z.id}>
            <div className="ldot" style={{background:z.color}}/><span><b>{z.id}</b> {z.full}</span>
          </div>
        ))}
      </div>
      {gtNok > 0 && (
        <div className="zstats">
          {zoneStats.map(z=>(
            <div className="zsc" key={z.id}>
              <div className="zs-id" style={{color:z.color}}>{z.id}</div>
              <div className="zs-n" style={{color:z.count>0?z.color:"var(--muted)"}}>{z.count}</div>
              <div className="zs-f">{z.full}</div>
              <div className="zs-p">
                <div><div className="zs-pp nk">{z.pctNok}%</div><div className="zs-l">NOK</div></div>
                <div><div className="zs-pp tt">{z.pctTot}%</div><div className="zs-l">tot</div></div>
              </div>
              <div className="zs-bar2" style={{background:z.color,width:`${z.pctNok}%`,opacity:z.count>0?.7:0}}/>
            </div>
          ))}
          <div className="zsc" style={{borderLeft:"2px solid rgba(239,68,68,.3)"}}>
            <div className="zs-id" style={{color:"#ef4444"}}>TOTAL</div>
            <div className="zs-n" style={{color:"#ef4444"}}>{gtNok}</div>
            <div className="zs-f">NOK</div>
            <div className="zs-p">
              <div><div className="zs-pp nk">100%</div><div className="zs-l">NOK</div></div>
              <div><div className="zs-pp tt">{gtTotal>0?Math.round(gtNok/gtTotal*100):0}%</div><div className="zs-l">tot</div></div>
            </div>
            <div className="zs-bar2" style={{background:"#ef4444",width:"100%",opacity:.5}}/>
          </div>
        </div>
      )}
      <div className="recap-wrap">
        {lots.map(lot => {
          const lOk  = lot.serials.filter(e=>e.zones.includes("S")).length;
          const lNok = lot.serials.filter(e=>e.zones.length>0&&!e.zones.includes("S")).length;
          return (
            <div className="recap-sec" key={lot.lotNum}>
              <div className="rlh">
                <span>LOT</span><span className="rlh-n">{lot.lotNum}</span>
                <span style={{color:"var(--muted)"}}>·</span>
                <span>{lot.serials.length} bts</span>
                <span style={{color:"var(--amber)",fontSize:7,border:"1px solid rgba(245,158,11,.3)",
                  padding:"1px 5px",borderRadius:2,background:"rgba(245,158,11,.06)"}}>{bottleType}</span>
                <span className="rlh-ok">✓{lOk}</span>
                <span className="rlh-nok">✗{lNok}</span>
                <span style={{marginLeft:"auto",color:"#10b981",fontSize:8}}>☁ ok</span>
              </div>
              <table className="rt">
                <thead>
                  <tr>
                    <th className="tdi">#</th><th className="thn">N° Série</th>
                    <th className="thok">✓</th>
                    <th className="therr" colSpan={4}>Zones défaillantes</th>
                  </tr>
                  <tr><th/><th/><th/>
                    <th className="therr" style={{color:"#ef4444"}}>Col</th>
                    <th className="therr" style={{color:"#fb923c"}}>Med</th>
                    <th className="therr" style={{color:"#a78bfa"}}>Gal</th>
                    <th className="therr" style={{color:"#60a5fa"}}>Pied</th>
                  </tr>
                </thead>
                <tbody>
                  {lot.serials.map((e,i)=>(
                    <tr key={i}>
                      <td className="tdi">{i+1}</td><td className="tdn">{e.num}</td>
                      <td>{e.zones.includes("S")   &&<span className="mks">✓</span>}</td>
                      <td>{e.zones.includes("COL") &&<span className="mkx col">✗</span>}</td>
                      <td>{e.zones.includes("MED") &&<span className="mkx med">✗</span>}</td>
                      <td>{e.zones.includes("GAL") &&<span className="mkx gal">✗</span>}</td>
                      <td>{e.zones.includes("PIED")&&<span className="mkx pid">✗</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <div className="bot-bar">
        <div className="fpill">
          <span style={{color:"#5a6a82"}}>TOTAL: </span>
          <span style={{color:"#60a5fa"}}>{gtOk+gtNok}</span>
          <span style={{color:"#5a6a82"}}> − </span>
          <span style={{color:"#ef4444"}}>{gtNok}</span>
          <span style={{color:"#5a6a82"}}> = </span>
          <span style={{color:"#10b981"}}>{gtOk}</span>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <button className="btn btn-a btn-sm" onClick={() => {
            setSerials(Array(BATCH_SIZE).fill(""));
            setDupErrors({});
            setChecks({});
            setScreen("serials");
          }}>+ LOT</button>
          <button className="btn btn-g btn-sm" onClick={exportSession}>📊 Excel</button>
        </div>
      </div>
      <Saving /><Toasts />
    </div>
  );

  /* ══════════ SCREEN: HISTORY ══════════ */
  return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">HISTORIQUE</div>
        <div className="chips">
          {sb ? <div className="chip ok">☁ <span>Supabase</span></div>
               :<div className="chip err">☁ <span>Connexion…</span></div>}
          {histData && <div className="chip">📊 <span>{histData.length} sessions</span></div>}
        </div>
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={loadHistory}>↺ Actualiser</button>
          <button className="btn btn-a btn-sm" onClick={() => setScreen("machine")}>+ Nouveau</button>
        </div>
      </div>

      <div className="hist-body">
        {/* Search bar */}
        <div className="hist-search">
          <input type="date" className="hs-inp"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)} />
          {searchDate && (
            <>
              <button className="hs-clear" onClick={() => setSearchDate("")}>✕</button>
              {histByDayMachine[searchDate] && (
                <button className="btn btn-g btn-sm"
                  onClick={() => exportFullDay(searchDate)}>
                  📊 Tout télécharger ({searchDate})
                </button>
              )}
            </>
          )}
          {!searchDate && (
            <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>
              Sélectionnez un jour pour filtrer
            </span>
          )}
        </div>

        {histLoading && (
          <div className="hload"><div className="hspinner"/> CHARGEMENT…</div>
        )}

        {!histLoading && histData !== null && filteredDays.length === 0 && (
          <div className="hempty">
            <div className="hempty-icon">{searchDate ? "🔍" : "📋"}</div>
            <div className="hempty-txt">
              {searchDate ? `Aucune donnée pour le ${searchDate}` : "AUCUNE DONNÉE"}
            </div>
            {!searchDate && (
              <button className="btn btn-a" onClick={() => setScreen("machine")}>+ Commencer</button>
            )}
          </div>
        )}

        {/* Days */}
        {!histLoading && filteredDays.map(day => {
          const dayMachines = histByDayMachine[day];
          const allS  = Object.values(dayMachines).flat();
          const dayTot  = allS.reduce((a,s)=>a+s.total,0);
          const dayOk   = allS.reduce((a,s)=>a+s.nb_ok,0);
          const dayNok  = allS.reduce((a,s)=>a+s.nb_nok,0);
          const dayTaux = (dayOk+dayNok)>0?Math.round(dayOk/(dayOk+dayNok)*100):null;

          return (
            <div className="day-block" key={day}>
              {/* Day header */}
              <div className="day-hdr">
                <div className="day-lbl">{fmtDate(day)}</div>
                <div className="day-stats">
                  <div className="ds dtot">{dayTot} bts</div>
                  <div className="ds dok">✓ {dayOk}</div>
                  <div className="ds dnok">✗ {dayNok}</div>
                  {dayTaux!==null && <div className="ds dtaux">{dayTaux}%</div>}
                  <button className="btn btn-g btn-sm"
                    onClick={() => exportFullDay(day)}>
                    📊 Tout le jour
                  </button>
                </div>
              </div>

              {/* Machines of the day */}
              {Object.entries(dayMachines).map(([macName, sessions]) => {
                const mTot  = sessions.reduce((a,s)=>a+s.total,0);
                const mOk   = sessions.reduce((a,s)=>a+s.nb_ok,0);
                const mNok  = sessions.reduce((a,s)=>a+s.nb_nok,0);
                const mTaux = (mOk+mNok)>0?Math.round(mOk/(mOk+mNok)*100):null;

                return (
                  <div className="med-block" key={macName}>
                    {/* Machine header */}
                    <div className="med-hdr">
                      <div className="med-name">{macName}</div>
                      <div className="med-pills">
                        <div className="mpill mt">{mTot} bts</div>
                        <div className="mpill mo">✓ {mOk}</div>
                        <div className="mpill mn">✗ {mNok}</div>
                        {mTaux!==null && <div className="mpill mx">{mTaux}%</div>}
                      </div>
                      <div className="med-dl">
                        <button className="btn btn-g btn-sm"
                          onClick={() => exportMachineDay(day, macName, sessions)}>
                          📊 {macName}
                        </button>
                      </div>
                    </div>

                    {/* Sessions of this machine */}
                    {sessions.map(s => {
                      const isOpen = expanded.has(s.id);
                      const sTaux  = (s.nb_ok+s.nb_nok)>0?Math.round(s.nb_ok/(s.nb_ok+s.nb_nok)*100):null;
                      return (
                        <div className="sess-card" key={s.id}>
                          <div className="sess-hdr" onClick={() => {
                            setExpanded(prev => {
                              const n = new Set(prev);
                              n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                              return n;
                            });
                          }}>
                            <div className="sh-type">{s.bottle_type}</div>
                            {s.operateur && <div className="sh-op">👥 {s.operateur}</div>}
                            <div className="sh-time">🕐 {fmtTime(s.created_at)}</div>
                            <div className="sh-pills">
                              <div className="shp st">{s.total}</div>
                              <div className="shp so">✓{s.nb_ok}</div>
                              <div className="shp sn">✗{s.nb_nok}</div>
                              {sTaux!==null && <div className="shp sx">{sTaux}%</div>}
                            </div>
                            <span className={`sh-chev${isOpen?" open":""}`}>▶</span>
                          </div>

                          {isOpen && (
                            <div className="sess-detail">
                              {s.lots.map(lot => {
                                const lOk  = lot.bouteilles.filter(b=>b.succes).length;
                                const lNok = lot.bouteilles.filter(b=>!b.succes&&(b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
                                return (
                                  <div className="lot-mini" key={lot.id}>
                                    <div className="lmh">
                                      <span>LOT</span><span className="lmh-n">{lot.lot_num}</span>
                                      <span style={{color:"var(--muted)"}}>·</span>
                                      <span>{lot.bouteilles.length} bts</span>
                                      <span className="lmh-ok">✓{lOk}</span>
                                      <span className="lmh-nok">✗{lNok}</span>
                                    </div>
                                    <table className="lmt">
                                      <thead>
                                        <tr>
                                          <th style={{width:20}}>#</th>
                                          <th className="ltn">N° Série</th>
                                          <th className="ltok">✓</th>
                                          <th className="lterr" colSpan={4}>Zones</th>
                                        </tr>
                                        <tr><th/><th/><th/>
                                          <th className="lterr" style={{color:"#ef4444"}}>Col</th>
                                          <th className="lterr" style={{color:"#fb923c"}}>Med</th>
                                          <th className="lterr" style={{color:"#a78bfa"}}>Gal</th>
                                          <th className="lterr" style={{color:"#60a5fa"}}>Pied</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {lot.bouteilles.map((b,bi)=>(
                                          <tr key={b.id}>
                                            <td style={{color:"var(--muted)",fontSize:8}}>{bi+1}</td>
                                            <td className="tdn">{b.num_serie}</td>
                                            <td>{b.succes    &&<span className="mks">✓</span>}</td>
                                            <td>{b.zone_col  &&<span className="mkx col">✗</span>}</td>
                                            <td>{b.zone_med  &&<span className="mkx med">✗</span>}</td>
                                            <td>{b.zone_gal  &&<span className="mkx gal">✗</span>}</td>
                                            <td>{b.zone_pied &&<span className="mkx pid">✗</span>}</td>
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
          );
        })}
      </div>
      <Toasts />
    </div>
  );
}