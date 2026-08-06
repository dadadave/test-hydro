// Feuille de styles de l'application, injectée une seule fois dans le <head>.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{
  --bg:#0e1015;--bg2:#161b24;--bg3:#1e2530;--border:#2a3444;
  --amber:#f59e0b;--amber2:#fcd34d;--green:#10b981;--red:#ef4444;
  --blue:#60a5fa;--purple:#a78bfa;--orange:#fb923c;
  --text:#e8edf5;--muted:#5a6a82;--light:#8fa0ba;
  --mono:'IBM Plex Mono',monospace;--disp:'Bebas Neue',sans-serif;--body:'DM Sans',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;}
body{font-family:var(--body);background:var(--bg);color:var(--text);overflow-x:hidden;-webkit-text-size-adjust:100%;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
/* Scrollbars discrètes et cohérentes avec le thème */
*{scrollbar-width:thin;scrollbar-color:var(--border) transparent;}
*::-webkit-scrollbar{width:9px;height:9px;}
*::-webkit-scrollbar-track{background:transparent;}
*::-webkit-scrollbar-thumb{background:var(--bg3);border:2px solid transparent;background-clip:padding-box;border-radius:20px;}
*::-webkit-scrollbar-thumb:hover{background:#33405480;background-clip:padding-box;}
.fs{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:20px 14px;position:relative;overflow:hidden;
  background:
    radial-gradient(120% 90% at 50% -10%,rgba(245,158,11,.10) 0%,transparent 45%),
    radial-gradient(ellipse 80% 70% at 50% 40%,#1a2a3a 0%,#0e1015 70%),
    radial-gradient(100% 120% at 50% 120%,rgba(96,165,250,.06) 0%,transparent 50%);}
.fs::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 120% at 50% 50%,transparent 55%,rgba(0,0,0,.45) 100%);}
.fs-grid{position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px),
  repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(245,158,11,.04) 40px);}
.fs-badge{font-family:var(--mono);font-size:9px;letter-spacing:3px;color:var(--amber);
  border:1px solid rgba(245,158,11,.35);padding:4px 14px;border-radius:2px;position:relative;
  background:rgba(245,158,11,.06);margin-bottom:18px;text-transform:uppercase;
  box-shadow:0 0 24px rgba(245,158,11,.12);animation:fadeDown .6s ease both;}
.fs-title{font-family:var(--disp);font-size:clamp(28px,9vw,72px);color:var(--text);
  letter-spacing:4px;text-align:center;line-height:1;margin-bottom:6px;
  text-shadow:0 2px 30px rgba(0,0,0,.5);animation:fadeDown .6s ease .05s both;}
.fs-title span{background:linear-gradient(180deg,var(--amber2),var(--amber));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 18px rgba(245,158,11,.35));}
.fs-sub{font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:2px;text-align:center;margin-bottom:24px;
  animation:fadeDown .6s ease .1s both;}
.card{background:linear-gradient(180deg,rgba(26,32,43,.97),rgba(19,24,32,.97));
  border:1px solid var(--border);border-radius:10px;
  width:100%;max-width:660px;padding:20px 14px;position:relative;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 1px rgba(245,158,11,.08),inset 0 1px 0 rgba(255,255,255,.04);
  animation:cardIn .5s cubic-bezier(.2,.7,.3,1) both;}
@media(min-width:500px){.card{padding:26px 30px;}}
.card-lbl{font-family:var(--mono);font-size:9px;color:var(--amber);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:14px;display:block;}
.machine-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
.m-btn{background:linear-gradient(180deg,var(--bg3),rgba(22,27,36,.9));border:2px solid var(--border);border-radius:8px;
  padding:18px 10px;cursor:pointer;transition:all .2s cubic-bezier(.2,.7,.3,1);
  display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;overflow:hidden;}
.m-btn:hover{border-color:rgba(245,158,11,.5);transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,0,0,.4),0 0 22px rgba(245,158,11,.12);}
.m-btn:active{transform:translateY(-1px);}
.m-btn.sel{border-color:var(--amber);background:rgba(245,158,11,.1);box-shadow:0 0 0 3px rgba(245,158,11,.18),0 0 26px rgba(245,158,11,.15);}
.m-name{font-family:var(--disp);font-size:clamp(16px,5vw,26px);letter-spacing:3px;color:var(--amber2);}
.m-check{position:absolute;top:6px;right:8px;font-size:13px;color:var(--amber);}
.m-tag{font-family:var(--mono);font-size:7px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 6px;border-radius:2px;background:rgba(245,158,11,.06);}
.home-actions{display:flex;flex-direction:column;gap:8px;}
.home-action-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.action-btn{background:linear-gradient(180deg,var(--bg3),rgba(22,27,36,.9));border:2px solid var(--border);border-radius:8px;
  padding:14px 12px;cursor:pointer;transition:all .2s cubic-bezier(.2,.7,.3,1);
  display:flex;flex-direction:column;align-items:center;gap:5px;}
.action-btn:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(0,0,0,.35);}
.action-btn:active{transform:translateY(-1px);}
.action-btn.ab-new:hover{box-shadow:0 10px 24px rgba(0,0,0,.35),0 0 22px rgba(245,158,11,.16);}
.action-btn.ab-fix:hover{box-shadow:0 10px 24px rgba(0,0,0,.35),0 0 22px rgba(239,68,68,.16);}
.action-btn.ab-hist:hover{box-shadow:0 10px 24px rgba(0,0,0,.35),0 0 22px rgba(96,165,250,.16);}
.action-btn.ab-new{border-color:rgba(245,158,11,.4);}
.action-btn.ab-fix{border-color:rgba(239,68,68,.35);}
.action-btn.ab-hist{border-color:rgba(96,165,250,.3);}
.ab-icon{font-size:22px;}
.ab-label{font-family:var(--disp);font-size:clamp(13px,3.5vw,17px);letter-spacing:2px;}
.ab-sub{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;text-align:center;}
.btype-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
.bt-btn{background:var(--bg3);border:2px solid var(--border);border-radius:6px;
  padding:22px 12px 16px;cursor:pointer;transition:all .2s;
  display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;}
.bt-btn:hover{border-color:var(--amber);transform:translateY(-2px);}
.bt-btn.sel{border-color:var(--amber);background:rgba(245,158,11,.1);box-shadow:0 0 0 3px rgba(245,158,11,.18);}
.bt-kg{font-family:var(--disp);font-size:clamp(40px,12vw,80px);letter-spacing:2px;color:var(--amber2);line-height:1;}
.bt-unit{font-family:var(--mono);font-size:10px;color:var(--amber);letter-spacing:4px;margin-top:-2px;}
.bt-desc{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-top:8px;}
.bt-check{position:absolute;top:8px;right:10px;font-size:14px;color:var(--amber);}
.page{min-height:100vh;display:flex;flex-direction:column;}
.top-bar{background:linear-gradient(180deg,rgba(26,32,43,.96),rgba(19,24,32,.92));
  border-bottom:2px solid var(--amber);box-shadow:0 4px 18px rgba(0,0,0,.35),0 1px 0 rgba(245,158,11,.15) inset;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);position:sticky;top:0;z-index:50;
  padding:9px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex-shrink:0;}
.top-machine{font-family:var(--disp);font-size:clamp(13px,4vw,20px);letter-spacing:3px;color:var(--amber);white-space:nowrap;}
.chips{display:flex;gap:5px;flex-wrap:wrap;flex:1;}
.chip{font-family:var(--mono);font-size:8px;color:var(--light);
  background:rgba(255,255,255,.04);border:1px solid var(--border);padding:2px 6px;border-radius:2px;white-space:nowrap;}
.chip span{color:var(--amber2);font-weight:700;}
.chip.tc{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.07);}
.chip.tc span{color:var(--amber);}
.chip.ok{border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.07);}
.chip.ok span{color:#10b981;}
.chip.er{border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.07);}
.chip.er span{color:#ef4444;}
.top-right{margin-left:auto;display:flex;gap:6px;align-items:center;flex-shrink:0;}
.center-body{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:12px;}
.form-card{background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  padding:16px 14px;width:100%;max-width:800px;box-shadow:0 8px 32px rgba(0,0,0,.3);}
@media(min-width:560px){.form-card{padding:22px 26px;}}
.form-title{font-family:var(--disp);font-size:clamp(16px,5vw,24px);letter-spacing:2px;color:var(--text);margin-bottom:3px;}
.form-sub{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:14px;}
.op-section{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:12px 14px;margin-bottom:12px;}
.op-section-title{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
.op-row{display:grid;grid-template-columns:1fr;gap:8px;}
@media(min-width:480px){.op-row{grid-template-columns:1fr 1fr;}}
.op-field{display:flex;flex-direction:column;gap:4px;}
.op-lbl{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.op-inp{background:var(--bg);border:2px solid var(--border);border-radius:3px;color:var(--amber2);
  font-family:var(--mono);font-size:13px;font-weight:700;padding:8px 10px;outline:none;
  transition:border .15s;width:100%;letter-spacing:1px;}
.op-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.15);}
.op-inp::placeholder{color:var(--muted);font-size:10px;font-weight:400;}
.pg{display:grid;gap:10px;margin-bottom:12px;}
.pg2{grid-template-columns:1fr;}
@media(min-width:480px){.pg2{grid-template-columns:1fr 1fr;}}
.pf{display:flex;flex-direction:column;gap:4px;}
.pf-lbl{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.pf-inp{background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);
  font-family:var(--mono);font-size:13px;font-weight:600;padding:8px 10px;outline:none;transition:border .15s;width:100%;}
.pf-inp:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(245,158,11,.12);}
.serial-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-bottom:12px;}
@media(min-width:480px){.serial-grid{grid-template-columns:repeat(5,1fr);}}
.sc{display:flex;flex-direction:column;gap:3px;}
.sc-lbl{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;}
.sc-inp{background:var(--bg3);border:2px solid var(--border);border-radius:3px;
  color:var(--amber2);font-family:var(--mono);font-size:13px;font-weight:700;
  padding:7px 5px;outline:none;text-align:center;letter-spacing:1px;
  transition:border .15s;width:100%;-moz-appearance:textfield;}
.sc-inp::-webkit-inner-spin-button,.sc-inp::-webkit-outer-spin-button{-webkit-appearance:none;}
.sc-inp:focus{border-color:var(--amber);}
.sc-inp::placeholder{color:var(--border);font-size:9px;font-weight:400;}
.sc-inp.fi{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.04);}
.sc-inp.dp{border-color:#ef4444;background:rgba(239,68,68,.06);}
.sc-err{font-family:var(--mono);font-size:7px;color:#ef4444;margin-top:1px;}
.prog-wrap{height:3px;background:var(--bg3);border-radius:2px;margin-bottom:12px;}
.prog-bar{height:3px;background:var(--amber);border-radius:2px;transition:width .3s;}
.ctrl-body{flex:1;overflow:auto;padding:8px 10px;display:flex;flex-direction:column;gap:5px;}
@media(min-width:600px){.ctrl-body{padding:10px 18px;}}
.b-row{background:var(--bg2);border:1px solid var(--border);border-radius:4px;
  display:flex;flex-wrap:wrap;align-items:stretch;overflow:hidden;transition:border-color .15s;}
.b-row.bok{border-color:rgba(16,185,129,.45);}
.b-row.bnok{border-color:rgba(239,68,68,.4);}
.b-row.brej{border-color:rgba(90,106,130,.4);}
.b-i{font-family:var(--mono);font-size:9px;color:var(--muted);width:24px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;border-right:1px solid var(--border);}
.b-n{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--amber2);
  padding:9px 10px;letter-spacing:1px;border-right:1px solid var(--border);
  display:flex;flex-direction:column;justify-content:center;flex-shrink:0;min-width:75px;}
@media(min-width:480px){.b-n{min-width:115px;font-size:14px;}}
.b-notfound{font-family:var(--mono);font-size:7px;color:#fb923c;letter-spacing:1px;margin-top:2px;}
.b-ctrl{display:flex;align-items:center;gap:4px;padding:6px 8px;flex:1;flex-wrap:wrap;}
.z-btn{font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:1px;
  padding:5px 7px;border:2px solid var(--border);border-radius:3px;
  cursor:pointer;background:var(--bg3);color:var(--muted);
  transition:all .15s;text-transform:uppercase;white-space:nowrap;user-select:none;
  -webkit-tap-highlight-color:transparent;}
@media(min-width:480px){.z-btn{padding:6px 10px;font-size:9px;}}
.z-btn:hover{border-color:var(--light);color:var(--text);}
.z-btn.aS   {background:rgba(16,185,129,.18);border-color:#10b981;color:#10b981;}
.z-btn.aCOL {background:rgba(239,68,68,.18);border-color:#ef4444;color:#ef4444;}
.z-btn.aMED {background:rgba(251,146,60,.18);border-color:#fb923c;color:#fb923c;}
.z-btn.aGAL {background:rgba(167,139,250,.18);border-color:#a78bfa;color:#a78bfa;}
.z-btn.aPIED{background:rgba(96,165,250,.18);border-color:#60a5fa;color:#60a5fa;}
.z-btn.aREJ {background:rgba(90,106,130,.15);border-color:#5a6a82;color:#8fa0ba;}
.b-sep{color:rgba(42,52,68,.8);font-size:12px;user-select:none;}
.b-st{padding:5px 8px;font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:1px;flex-shrink:0;white-space:nowrap;}
.b-st.bok{color:#10b981;}.b-st.bnok{color:#ef4444;}.b-st.brej{color:var(--muted);}.b-st.none{color:var(--muted);}
@media(max-width:479px){.b-st{width:100%;text-align:right;border-top:1px solid rgba(42,52,68,.3);padding:3px 8px;}}
/* ORIG DEFECTS ROW */
.b-orig{width:100%;padding:4px 8px;border-top:1px solid rgba(42,52,68,.4);
  display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
.b-orig-lbl{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;flex-shrink:0;}
.orig-tag{font-family:var(--mono);font-size:7px;font-weight:700;padding:1px 6px;border-radius:2px;border:1px solid;}
.val-bar{background:var(--bg2);border-top:1px solid var(--border);
  padding:9px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0;}
.val-info{font-family:var(--mono);font-size:10px;color:var(--muted);}
.val-info b{color:var(--amber2);}
.val-warn{font-family:var(--mono);font-size:8px;color:#fb923c;display:block;margin-top:2px;}
.stats-row{display:flex;flex-wrap:wrap;background:var(--bg3);border-bottom:1px solid var(--border);flex-shrink:0;}
.sc2{flex:1;min-width:65px;padding:7px 8px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:1px;}
.sc2:last-child{border-right:none;}
.sv{font-family:var(--disp);font-size:clamp(18px,5vw,26px);letter-spacing:1px;line-height:1;}
.sv.bl{color:var(--blue);}.sv.gr{color:var(--green);}.sv.re{color:var(--red);}.sv.am{color:var(--amber);}.sv.mu{color:var(--muted);}
.sl{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.formula{font-family:var(--mono);font-size:11px;font-weight:700;display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
.fop{color:var(--muted);}
.legend{display:flex;gap:7px;flex-wrap:wrap;align-items:center;font-family:var(--mono);font-size:8px;
  color:var(--muted);padding:5px 10px;background:rgba(0,0,0,.2);border-bottom:1px solid var(--border);flex-shrink:0;}
.li{display:flex;align-items:center;gap:3px;}
.ldot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.zstats{display:flex;flex-wrap:wrap;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;}
.zsc{flex:1;min-width:75px;padding:7px 10px;border-right:1px solid var(--border);position:relative;overflow:hidden;}
.zsc:last-child{border-right:none;}
.zs-bar2{position:absolute;bottom:0;left:0;height:2px;transition:width .5s;}
.zs-id{font-family:var(--mono);font-size:7px;letter-spacing:2px;text-transform:uppercase;margin-bottom:1px;font-weight:700;}
.zs-n{font-family:var(--disp);font-size:20px;letter-spacing:1px;line-height:1;margin-bottom:1px;}
.zs-f{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.zs-p{display:flex;gap:4px;flex-wrap:wrap;}
.zs-pp{font-family:var(--mono);font-size:8px;font-weight:700;padding:1px 4px;border-radius:2px;border:1px solid;}
.zs-pp.nk{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);color:#f87171;}
.zs-pp.tt{background:rgba(90,106,130,.08);border-color:rgba(90,106,130,.3);color:var(--light);}
.zs-l{font-family:var(--mono);font-size:7px;color:var(--muted);}
.recap-wrap{flex:1;overflow:auto;padding:10px;}
@media(min-width:600px){.recap-wrap{padding:12px 18px;}}
.recap-sec{margin-bottom:12px;}
.rlh{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:5px 8px;background:var(--bg3);border:1px solid var(--border);
  border-radius:3px 3px 0 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.rlh-n{color:var(--amber);font-weight:700;}
.rlh-ok{color:#10b981;}.rlh-nok{color:#ef4444;}
.rt{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:10px;}
.rt thead th{background:rgba(30,37,48,.9);border:1px solid var(--border);padding:4px 6px;
  text-align:center;font-size:7px;letter-spacing:1px;text-transform:uppercase;}
.rt thead th.thn{text-align:left;color:var(--light);}
.rt thead th.thok{color:#10b981;}
.rt thead th.therr{color:#ef4444;background:rgba(239,68,68,.04);}
.rt tbody td{padding:4px 6px;border:1px solid rgba(42,52,68,.5);text-align:center;}
.rt tbody tr:hover td{background:rgba(245,158,11,.02);}
.tdi{color:var(--muted);font-size:8px;width:20px;}
.tdn{text-align:left!important;color:var(--amber2);font-weight:700;font-size:11px;letter-spacing:1px;}
.mks{color:#10b981;font-size:12px;font-weight:900;}
.mkx{font-size:10px;font-weight:900;}
.col{color:#ef4444;}.med{color:#fb923c;}.gal{color:#a78bfa;}.pid{color:#60a5fa;}
.bot-bar{background:var(--bg2);border-top:1px solid var(--border);
  padding:9px 12px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;flex-shrink:0;}
.fpill{font-family:var(--mono);font-size:11px;font-weight:700;
  background:var(--bg3);border:1px solid var(--border);padding:5px 10px;border-radius:3px;letter-spacing:1px;}
.btn{font-family:var(--disp);font-size:13px;letter-spacing:2px;padding:8px 14px;border-radius:5px;
  cursor:pointer;border:none;transition:all .16s cubic-bezier(.2,.7,.3,1);white-space:nowrap;-webkit-tap-highlight-color:transparent;}
.btn:active{transform:translateY(1px);}
.btn-a{background:linear-gradient(180deg,var(--amber2),var(--amber));color:#0e1015;
  box-shadow:0 4px 14px rgba(245,158,11,.28),inset 0 1px 0 rgba(255,255,255,.35);}
.btn-a:hover{filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 8px 20px rgba(245,158,11,.36),inset 0 1px 0 rgba(255,255,255,.35);}
.btn-a:disabled{opacity:.35;cursor:not-allowed;transform:none;filter:none;box-shadow:none;}
.btn-g{background:rgba(16,185,129,.12);color:#10b981;border:1px solid #10b981;}
.btn-g:hover{background:rgba(16,185,129,.22);}
.btn-gh{background:none;color:var(--muted);border:1px solid var(--border);font-size:11px;}
.btn-gh:hover{border-color:var(--light);color:var(--text);}
.btn-b{background:rgba(96,165,250,.12);color:#60a5fa;border:1px solid #60a5fa;font-size:11px;}
.btn-b:hover{background:rgba(96,165,250,.22);}
.btn-r{background:rgba(239,68,68,.12);color:#ef4444;border:1px solid #ef4444;font-size:11px;}
.btn-r:hover{background:rgba(239,68,68,.22);}
.btn-sm{padding:5px 10px;font-size:10px;letter-spacing:1px;}

/* CORRIGER */
.corr-home{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:10px;}
@media(min-width:600px){.corr-home{padding:14px 20px;}}
.corr-banner{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.25);border-radius:4px;
  padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.corr-banner-icon{font-size:26px;}
.corr-banner-txt{flex:1;}
.corr-banner-title{font-family:var(--disp);font-size:18px;letter-spacing:2px;color:#ef4444;}
.corr-banner-sub{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-top:2px;}
.corr-stats-bar{display:flex;flex-wrap:wrap;background:var(--bg3);border:1px solid var(--border);border-radius:4px;overflow:hidden;}
.css2{flex:1;min-width:60px;padding:8px 10px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:2px;}
.css2:last-child{border-right:none;}
.css2-v{font-family:var(--disp);font-size:clamp(18px,5vw,26px);letter-spacing:1px;line-height:1;}
.css2-l{font-family:var(--mono);font-size:7px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.corr-lots-list{display:flex;flex-direction:column;gap:6px;}
.corr-lot-card{background:var(--bg2);border:1px solid rgba(16,185,129,.25);border-radius:4px;padding:10px 12px;}
.clc-hdr{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:6px;}
.clc-num{font-family:var(--disp);font-size:15px;letter-spacing:2px;color:var(--amber);}
.clc-pill{font-family:var(--mono);font-size:7px;font-weight:700;padding:2px 6px;border-radius:2px;border:1px solid;}
.clc-pill.g{color:#10b981;border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.08);}
.clc-pill.r{color:#ef4444;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.08);}
.clc-pill.b{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.clc-pill.m{color:var(--muted);border-color:var(--border);}
.clc-entries{font-family:var(--mono);font-size:8px;color:var(--muted);display:flex;gap:5px;flex-wrap:wrap;}
.clc-entry{padding:2px 5px;border-radius:2px;background:var(--bg3);border:1px solid var(--border);}
.clc-entry.ok-e{border-color:rgba(16,185,129,.3);color:#10b981;}
.clc-entry.rej-e{border-color:rgba(90,106,130,.3);color:var(--muted);text-decoration:line-through;}
.clc-entry.pend-e{border-color:rgba(245,158,11,.3);color:var(--amber);}
.zone-filter-bar{display:flex;gap:5px;flex-wrap:wrap;padding:5px 0;}
.corr-note-inp{background:var(--bg3);border:1px solid var(--border);border-radius:3px;
  color:var(--text);font-family:var(--mono);font-size:10px;padding:5px 8px;
  outline:none;transition:border .15s;flex:1;min-width:100px;min-height:0;height:28px;}
.corr-note-inp:focus{border-color:var(--amber);}
.corr-note-inp::placeholder{color:var(--muted);}

/* HISTORY */
.hist-body{flex:1;overflow:auto;padding:10px;}
@media(min-width:600px){.hist-body{padding:14px 20px;}}
.hist-search{display:flex;gap:7px;align-items:center;margin-bottom:14px;flex-wrap:wrap;}
.hs-inp{background:var(--bg3);border:2px solid var(--border);border-radius:3px;
  color:var(--text);font-family:var(--mono);font-size:12px;padding:7px 10px;outline:none;
  transition:border .15s;flex:1;min-width:130px;}
.hs-inp:focus{border-color:var(--amber);}
.hs-clear{background:none;border:1px solid var(--border);color:var(--muted);
  font-family:var(--mono);font-size:10px;padding:6px 10px;border-radius:3px;cursor:pointer;}
.hs-clear:hover{border-color:var(--red);color:var(--red);}
.hload{display:flex;align-items:center;justify-content:center;height:160px;
  font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:2px;gap:10px;}
.hspinner{width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--amber);
  border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.hempty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:220px;gap:12px;}
.hempty-icon{font-size:36px;opacity:.3;}
.hempty-txt{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;}
.day-block{margin-bottom:20px;}
.day-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;
  padding-bottom:7px;border-bottom:2px solid var(--border);flex-wrap:wrap;}
.day-lbl{font-family:var(--disp);font-size:clamp(13px,4vw,19px);letter-spacing:2px;color:var(--text);}
.day-stats{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
.ds{font-family:var(--mono);font-size:8px;padding:2px 6px;border-radius:2px;border:1px solid;}
.ds.dtot{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.ds.dok{color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.ds.dnok{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.ds.dtx{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.day-sub-title{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:6px 4px;margin-top:6px;margin-bottom:4px;
  border-bottom:1px solid rgba(42,52,68,.6);display:flex;align-items:center;gap:6px;}
.med-block{margin-bottom:10px;border:1px solid var(--border);border-radius:4px;overflow:hidden;}
.med-hdr{display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--bg3);flex-wrap:wrap;}
.med-name{font-family:var(--disp);font-size:clamp(13px,4vw,17px);letter-spacing:3px;color:var(--amber);}
.med-pills{display:flex;gap:4px;flex-wrap:wrap;align-items:center;}
.mpill{font-family:var(--mono);font-size:7px;font-weight:700;padding:2px 6px;border-radius:2px;border:1px solid;}
.mpill.mt{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.mpill.mo{color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.mpill.mn{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.mpill.mx{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.mpill.mfix{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.med-dl{margin-left:auto;display:flex;gap:5px;}
.sess-card{border-top:1px solid var(--border);background:var(--bg2);}
.sess-card.corr-sess{border-top:1px solid rgba(245,158,11,.2);background:rgba(245,158,11,.02);}
.sess-hdr{display:flex;align-items:center;gap:7px;padding:7px 10px;
  cursor:pointer;user-select:none;flex-wrap:wrap;-webkit-tap-highlight-color:transparent;}
.sess-hdr:hover{background:rgba(245,158,11,.03);}
.sh-type{font-family:var(--mono);font-size:7px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.3);padding:2px 5px;border-radius:2px;background:rgba(245,158,11,.06);}
.sh-tag-corr{font-family:var(--mono);font-size:7px;color:var(--amber);letter-spacing:1px;
  border:1px solid rgba(245,158,11,.4);padding:2px 6px;border-radius:2px;
  background:rgba(245,158,11,.1);font-weight:700;}
.sh-op{font-family:var(--mono);font-size:8px;color:var(--light);}
.sh-time{font-family:var(--mono);font-size:8px;color:var(--muted);}
.sh-pills{display:flex;gap:4px;flex-wrap:wrap;}
.shp{font-family:var(--mono);font-size:7px;font-weight:700;padding:2px 5px;border-radius:2px;border:1px solid;}
.shp.st{color:var(--blue);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.06);}
.shp.so{color:#10b981;border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06);}
.shp.sn{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);}
.shp.sx{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);}
.sh-chev{font-size:10px;color:var(--muted);transition:transform .2s;margin-left:auto;flex-shrink:0;}
.sh-chev.open{transform:rotate(90deg);}
.sess-detail{border-top:1px solid var(--border);padding:8px 10px;}
.lot-mini{margin-bottom:8px;}
.lmh{font-family:var(--mono);font-size:7px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:4px 6px;background:var(--bg3);border:1px solid var(--border);
  border-radius:2px 2px 0 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.lmh-n{color:var(--amber);font-weight:700;}
.lmh-ok{color:#10b981;}.lmh-nok{color:#ef4444;}
.lmt{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:9px;}
.lmt thead th{background:rgba(30,37,48,.9);border:1px solid var(--border);padding:3px 5px;
  text-align:center;font-size:7px;letter-spacing:1px;text-transform:uppercase;}
.lmt thead th.ltn{text-align:left;color:var(--light);}
.lmt thead th.ltok{color:#10b981;}
.lmt thead th.lterr{color:#ef4444;background:rgba(239,68,68,.04);}
.lmt tbody td{padding:3px 5px;border:1px solid rgba(42,52,68,.5);text-align:center;}
.corr-row{display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:6px 10px;
  border-bottom:1px solid rgba(42,52,68,.3);}
.corr-row:last-child{border-bottom:none;}
.cr-serial{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--amber2);letter-spacing:1px;min-width:70px;}
.cr-zones{display:flex;gap:3px;flex-wrap:wrap;}
.cr-arrow{font-size:10px;color:var(--muted);}
.cr-ztag{font-family:var(--mono);font-size:7px;font-weight:700;padding:1px 5px;border-radius:2px;border:1px solid;}
.cr-ztag.orig{color:#ef4444;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.1);}
.cr-ztag.fixed{color:#10b981;border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.1);}
.cr-ztag.rj{color:var(--muted);border-color:var(--border);text-decoration:line-through;}
.cr-statut{font-family:var(--mono);font-size:7px;font-weight:700;padding:1px 6px;border-radius:2px;border:1px solid;white-space:nowrap;}
.cr-statut.ok{color:#10b981;border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.08);}
.cr-statut.at{color:#ef4444;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.08);}
.cr-statut.rj{color:var(--muted);border-color:var(--border);}
.cr-meta{font-family:var(--mono);font-size:7px;color:var(--muted);margin-left:auto;}
.cr-note{font-family:var(--mono);font-size:7px;color:var(--amber);width:100%;padding-left:2px;}
.sav-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;
  justify-content:center;z-index:9999;backdrop-filter:blur(4px);}
.sav-box{background:var(--bg2);border:1px solid var(--amber);border-radius:4px;
  padding:24px 36px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.6);}
.sav-sp{width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--amber);
  border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;}
.sav-txt{font-family:var(--mono);font-size:10px;color:var(--amber);letter-spacing:2px;}
.tw{position:fixed;bottom:14px;right:10px;z-index:999;display:flex;flex-direction:column;
  gap:4px;pointer-events:none;max-width:calc(100vw - 20px);}
.toast{background:var(--bg2);border:1px solid #10b981;border-left:4px solid #10b981;
  color:var(--text);padding:8px 12px;border-radius:3px;font-family:var(--mono);font-size:10px;
  animation:toastIn .25s ease;box-shadow:0 4px 20px rgba(0,0,0,.5);}
.toast.e{border-color:#ef4444;border-left-color:#ef4444;}
@keyframes toastIn{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes cardIn{from{opacity:0;transform:translateY(14px) scale(.985);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes fadeDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
.form-card{animation:cardIn .45s cubic-bezier(.2,.7,.3,1) both;}
.bt-btn:active{transform:translateY(-1px);}
.b-row{animation:fadeDown .3s ease both;}
/* ═══════════════════════ MODULE LAUNCHER ═══════════════════════ */
.mods-grid{display:grid;grid-template-columns:1fr;gap:12px;}
@media(min-width:560px){.mods-grid{grid-template-columns:1fr 1fr;}}
.mod-card{background:linear-gradient(180deg,var(--bg3),rgba(22,27,36,.9));
  border:2px solid var(--border);border-radius:10px;padding:20px 18px;cursor:pointer;
  transition:all .2s cubic-bezier(.2,.7,.3,1);position:relative;overflow:hidden;
  display:flex;align-items:center;gap:16px;text-align:left;width:100%;
  animation:cardIn .5s cubic-bezier(.2,.7,.3,1) both;}
.mod-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:var(--accent,var(--amber));opacity:.65;transition:opacity .2s,width .2s;}
.mod-card:hover{transform:translateY(-3px);border-color:var(--accent,var(--amber));
  box-shadow:0 14px 32px rgba(0,0,0,.45),0 0 26px color-mix(in srgb,var(--accent,var(--amber)) 20%,transparent);}
.mod-card:hover::before{width:5px;opacity:1;}
.mod-card:active{transform:translateY(-1px);}
.mod-card.soon{cursor:not-allowed;opacity:.5;}
.mod-card.soon:hover{transform:none;box-shadow:none;border-color:var(--border);}
.mod-ic{font-size:34px;line-height:1;flex-shrink:0;filter:drop-shadow(0 4px 10px rgba(0,0,0,.4));}
.mod-body{flex:1;min-width:0;}
.mod-name{font-family:var(--disp);font-size:clamp(17px,4.5vw,23px);letter-spacing:2px;
  color:var(--accent,var(--amber2));line-height:1.05;margin-bottom:4px;}
.mod-desc{font-family:var(--mono);font-size:8.5px;color:var(--light);letter-spacing:.5px;line-height:1.5;}
.mod-tag{display:inline-block;margin-top:6px;font-family:var(--mono);font-size:7px;letter-spacing:1px;
  text-transform:uppercase;color:var(--muted);border:1px solid var(--border);border-radius:2px;padding:1px 6px;}
.mod-arrow{font-family:var(--disp);font-size:20px;color:var(--accent,var(--amber));
  flex-shrink:0;transition:transform .2s;}
.mod-card:hover .mod-arrow{transform:translateX(4px);}
.mod-back{position:absolute;top:14px;left:14px;z-index:2;}
/* ═══════════════════════ PREMIUM GLASS THEME v2 ═══════════════════════ */
:root{
  --bg:#080b14;--bg2:#0f1626;--bg3:#18212f;
  --border:rgba(255,255,255,.10);
  --text:#eef2fb;--muted:#828fa8;--light:#aeb9cf;
  --glass:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
  --glass-brd:1px solid rgba(255,255,255,.10);
  --radius:16px;--radius-sm:10px;
  --shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);
  --accent-grad:linear-gradient(135deg,#ffd97a 0%,#f59e0b 55%,#fb8a3c 100%);
}
/* Fond premium unifié pour tous les écrans */
.fs,.page{background:
  radial-gradient(120% 85% at 50% -12%,rgba(245,158,11,.13),transparent 46%),
  radial-gradient(85% 75% at 100% 0%,rgba(96,165,250,.10),transparent 52%),
  radial-gradient(85% 85% at 0% 100%,rgba(167,139,250,.09),transparent 52%),
  linear-gradient(180deg,#0b1020,#080b14) fixed;}

/* Cartes & panneaux en verre */
.card,.form-card{background:var(--glass);border:var(--glass-brd);border-radius:var(--radius);
  box-shadow:var(--shadow);-webkit-backdrop-filter:blur(18px) saturate(1.15);backdrop-filter:blur(18px) saturate(1.15);}
.op-section{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;}
.med-block,.sess-card,.corr-lot-card,.lot-mini,.corr-banner,.corr-stats-bar{border-radius:12px;}
.med-block{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);}

/* Barres translucides */
.top-bar{background:linear-gradient(180deg,rgba(17,24,40,.74),rgba(11,16,28,.6));
  border-bottom:1px solid rgba(255,255,255,.08);
  box-shadow:0 10px 34px rgba(0,0,0,.4),0 1px 0 rgba(245,158,11,.22) inset;
  -webkit-backdrop-filter:blur(16px) saturate(1.2);backdrop-filter:blur(16px) saturate(1.2);}
.val-bar,.bot-bar,.stats-row,.legend,.zstats{background:rgba(255,255,255,.03);
  border-color:rgba(255,255,255,.07);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
.sc2,.zsc{border-right:1px solid rgba(255,255,255,.06);}

/* Champs de saisie */
.op-inp,.pf-inp,.sc-inp,.hs-inp,.corr-note-inp{background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.12);border-radius:10px;transition:border .15s,box-shadow .15s,background .15s;}
.op-inp:focus,.pf-inp:focus,.sc-inp:focus,.hs-inp:focus,.corr-note-inp:focus{
  border-color:rgba(245,158,11,.7);box-shadow:0 0 0 3px rgba(245,158,11,.16);background:rgba(255,255,255,.07);}

/* Boutons */
.btn{border-radius:10px;}
.btn-a{background:var(--accent-grad);color:#0a0e17;
  box-shadow:0 6px 18px rgba(245,158,11,.32),inset 0 1px 0 rgba(255,255,255,.4);}
.btn-a:hover{filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 10px 24px rgba(245,158,11,.4),inset 0 1px 0 rgba(255,255,255,.4);}
.btn-gh{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.13);}
.btn-gh:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.24);color:var(--text);}
.fpill{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;}

/* Chips en pilule */
.chip{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;}

/* Lignes de contrôle & zones */
.b-row{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:12px;}
.z-btn{background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.1);border-radius:9px;}
.z-btn:hover{border-color:rgba(255,255,255,.28);color:var(--text);}

/* Tableaux */
.rt thead th,.lmt thead th{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);}
.rt tbody td,.lmt tbody td{border-color:rgba(255,255,255,.06);}
.rt tbody tr:hover td{background:rgba(245,158,11,.05);}

/* Overlay & toasts */
.sav-box{background:rgba(17,24,40,.85);border:1px solid rgba(245,158,11,.5);border-radius:16px;
  -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);}
.toast{background:rgba(17,24,40,.92);border-radius:12px;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}

/* Cartes de module (lanceur) */
.mod-card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);}

/* ═══════════════════ THEME v3 — typographie & finitions ═══════════════════ */
:root{
  --disp:'Space Grotesk',sans-serif;
  --body:'Inter',sans-serif;
  --accent-grad:linear-gradient(135deg,#ffd27a 0%,#f59e0b 45%,#fb7a3c 100%);
}
body{letter-spacing:.1px;}

/* Titres modernes (géométriques, plus gras, moins d'interlettrage) */
.fs-title{font-weight:700;letter-spacing:-1.5px;}
.form-title,.top-machine,.m-name,.bt-kg,.sv,.zs-n,.ab-label,.clc-num,.day-lbl,
.med-name,.rlh-n,.lmh-n,.css2-v,.mod-name,.corr-banner-title,.sav-txt{font-weight:600;}
.fs-badge,.card-lbl,.op-section-title{letter-spacing:2.5px;}

/* Fond « aurore » animé (respecte prefers-reduced-motion plus bas) */
.fs,.page{position:relative;overflow:hidden;isolation:isolate;}
.fs::before,.page::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(40% 46% at 20% 26%,rgba(245,158,11,.18),transparent 60%),
    radial-gradient(38% 42% at 84% 18%,rgba(96,165,250,.15),transparent 60%),
    radial-gradient(46% 48% at 62% 94%,rgba(167,139,250,.14),transparent 60%);
  filter:blur(26px);animation:aurora 20s ease-in-out infinite alternate;}
@keyframes aurora{
  0%{transform:translate3d(-2%,-1%,0) scale(1.05) rotate(0deg);}
  100%{transform:translate3d(3%,2%,0) scale(1.12) rotate(6deg);}
}

/* Cartes à bord dégradé (verre + liseré lumineux) */
.card,.form-card,.mod-card{border:1px solid transparent;
  background:
    linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02)) padding-box,
    linear-gradient(140deg,rgba(255,255,255,.22),rgba(255,255,255,.04) 42%,rgba(245,158,11,.38)) border-box;}

/* ═══════════════════ THEME v4 — coquille « appli mobile » ═══════════════════ */
/* Sur écran large : l'app s'affiche dans un vrai châssis de téléphone.
   Sur mobile : plein écran natif (aucune de ces règles ne s'applique). */
@media(min-width:540px){
  body{background:radial-gradient(120% 120% at 50% -10%,#101a2e,#05070d 68%);}
  #root{
    width:432px;max-width:432px;margin:22px auto;
    height:calc(100vh - 44px);overflow:hidden;position:relative;
    border-radius:46px;
    box-shadow:
      0 50px 120px rgba(0,0,0,.7),
      0 0 0 11px #04060c,0 0 0 12px rgba(255,255,255,.08),
      inset 0 0 0 1px rgba(255,255,255,.05);
  }
  /* Encoche + barre gestuelle du téléphone */
  #root::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);
    width:148px;height:27px;background:#04060c;border-radius:0 0 18px 18px;z-index:2000;pointer-events:none;}
  #root::after{content:"";position:absolute;bottom:9px;left:50%;transform:translateX(-50%);
    width:118px;height:5px;border-radius:3px;background:rgba(255,255,255,.4);z-index:2000;pointer-events:none;}
  .fs,.page{min-height:100%;height:100%;}
  /* Zones sûres (statut/encoche en haut, barre gestuelle en bas) */
  .top-bar{padding-top:36px;}
  .fs{padding-top:52px;padding-bottom:38px;}
  .bot-bar,.val-bar{padding-bottom:24px;}
  .mod-back{top:40px;left:16px;}
  /* Le châssis fait 432px : on force les dispositions « mobile » (les media
     queries se basent sinon sur la largeur réelle du navigateur, pas du cadre). */
  .mods-grid{grid-template-columns:1fr;}
  .serial-grid{grid-template-columns:repeat(2,1fr);}
  .fs-title{font-size:52px;}
}

/* Composants plus « natifs » (touch-friendly) */
.btn{padding:11px 18px;}
.btn-a{border-radius:12px;}
.op-inp,.pf-inp,.hs-inp,.corr-note-inp{padding:11px 13px;font-size:14px;}
.card,.form-card{border-radius:24px;}
.m-btn,.action-btn,.bt-btn,.mod-card{border-radius:18px;}
.chip{padding:4px 10px;}

@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
`;

let cssInj = false;
export function injectCSS() {
  if (cssInj) return; cssInj = true;
  const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
}
