import { useState, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import { beautifyWorkbook } from "./utils/excelStyle";
import { supabase } from "../../shared/lib/supabase";
import { MACHINES, BOTTLE_TYPES, ZONES, BATCH_SIZE } from "./constants";
import { fmtDate, fmtTime, fmtMonth, pct } from "../../shared/utils/format";
import { calcBotsStats, computeStats } from "./utils/stats";
import { injectCSS } from "../../shared/styles";

export default function HydroModule({ onExit }) {
  useEffect(() => { injectCSS(); }, []);
  const sb = supabase;

  // ── Navigation ──
  const [screen,     setScreen]     = useState("home");
  const [machine,    setMachine]    = useState(null);
  const [bottleType, setBottleType] = useState(null);
  const [params,     setParams]     = useState({
    date: new Date().toISOString().split("T")[0], pression:"30", op1:"", op2:"",
  });

  // ── Test session ──
  const [sessionId, setSessionId] = useState(null);
  const [serials,   setSerials]   = useState(Array(BATCH_SIZE).fill(""));
  const [dupErrors, setDupErrors] = useState({});
  const [checks,    setChecks]    = useState({});
  const [lots,      setLots]      = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [syncState, setSyncState] = useState("idle");
  const inputRefs = useRef([]);

  // ── CORRIGER session ──
  const [corrStep,    setCorrStep]    = useState("home"); // home|params|serials|control|recap
  const [corrParams,  setCorrParams]  = useState({
    date: new Date().toISOString().split("T")[0], op1:"", op2:"",
  });
  const [corrSerials,   setCorrSerials]   = useState(Array(BATCH_SIZE).fill(""));
  const [corrDupErrors, setCorrDupErrors] = useState({});
  const [corrLookup,    setCorrLookup]    = useState({}); // numSerie → botData
  const [corrChecks,    setCorrChecks]    = useState({}); // idx → {zonesFixed, statut, note, existCorrId}
  const [corrLots,      setCorrLots]      = useState([]); // validated correction lots
  const [corrSaving,    setCorrSaving]    = useState(false);
  const [corrLoading,   setCorrLoading]   = useState(false);
  const corrInputRefs = useRef([]);

  // ── History ──
  const [histData,    setHistData]    = useState(null);
  const [histLoading, setHistLoading] = useState(false);
  const [searchDate,  setSearchDate]  = useState("");
  const [expanded,    setExpanded]    = useState(new Set());
  const [deleting,    setDeleting]    = useState(new Set());

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, err=false) => {
    const id = Date.now();
    setToasts(t => [...t, {id,msg,err}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id!==id)), 3500);
  }, []);

  /* ════════════════════════════════════════════════════════════
     CORRIGER — chargement des données pour un lot de N° série
  ════════════════════════════════════════════════════════════ */
  const loadCorrectionData = async () => {
    if (!sb) return;
    const nums = corrSerials.map(s => s.trim()).filter(Boolean);
    if (!nums.length) return;
    setCorrLoading(true);
    try {
      // Cherche les bouteilles NOK par numéro de série
      const { data: bots, error: bErr } = await sb
        .from("bouteilles")
        .select("*, lots(lot_num, session_id, sessions(id, machine, bottle_type, date, operateur, pression))")
        .in("num_serie", nums)
        .eq("succes", false)
        .order("created_at", { ascending: false });
      if (bErr) throw bErr;

      // Cherche les corrections existantes
      const { data: existCorrs } = await sb
        .from("corrections")
        .select("*")
        .in("num_serie", nums);

      // Construit le lookup : prend la bouteille la plus récente par numéro
      const lookup = {};
      (bots || []).forEach(b => { if (!lookup[b.num_serie]) lookup[b.num_serie] = b; });

      const existCorrMap = (existCorrs || []).reduce((acc, c) => {
        if (!acc[c.num_serie]) acc[c.num_serie] = c;
        return acc;
      }, {});

      setCorrLookup(lookup);

      // Pré-initialise les cases avec les corrections existantes
      const initChecks = {};
      corrSerials.forEach((s, i) => {
        const num = s.trim();
        if (!num) return;
        const ex = existCorrMap[num];
        initChecks[i] = {
          zonesFixed:   new Set(ex?.zones_corrigees || []),
          statut:       ex?.statut || "en_attente",
          note:         ex?.note || "",
          existCorrId:  ex?.id || null,
        };
      });
      setCorrChecks(initChecks);
      setCorrStep("control");
    } catch (err) { toast("Erreur : " + err.message, true); }
    finally { setCorrLoading(false); }
  };

  /* ════════════════════════════════════════════════════════════
     CORRIGER — validation d'un lot de corrections
  ════════════════════════════════════════════════════════════ */
  const validateCorrLot = async () => {
    if (!sb) return;
    setCorrSaving(true);
    const ops = [corrParams.op1, corrParams.op2].filter(Boolean).join(" / ");
    const lotNum = corrLots.length + 1;
    const savedEntries = [];

    try {
      for (let i = 0; i < BATCH_SIZE; i++) {
        const num = corrSerials[i]?.trim();
        if (!num) continue;

        const bot = corrLookup[num];
        const chk = corrChecks[i] || { zonesFixed: new Set(), statut: "en_attente", note: "" };

        if (!bot) continue; // non trouvé dans la DB → ignoré

        const sess = bot.lots?.sessions || {};
        const payload = {
          bouteille_id:    bot.id,
          lot_id:          bot.lot_id,
          session_id:      bot.lots?.session_id || sess.id,
          num_serie:       num,
          machine:         machine?.label || sess.machine || "",
          bottle_type:     sess.bottle_type || "",
          operateur:       sess.operateur || null,
          date_test:       sess.date || corrParams.date,
          zone_col:        bot.zone_col,
          zone_med:        bot.zone_med,
          zone_gal:        bot.zone_gal,
          zone_pied:       bot.zone_pied,
          zones_corrigees: [...chk.zonesFixed],
          note:            chk.note || null,
          corrigee_par:    ops || null,
          statut:          chk.statut,
        };

        if (chk.existCorrId) {
          const { error } = await sb.from("corrections").update(payload).eq("id", chk.existCorrId);
          if (error) throw error;
        } else {
          const { error } = await sb.from("corrections").insert(payload);
          if (error) throw error;
        }

        await sb.from("bouteilles").update({
          corrigee:        chk.statut === "corrigee",
          note_correction: chk.note || null,
        }).eq("id", bot.id);

        savedEntries.push({
          num, bot,
          zonesFixed: [...chk.zonesFixed],
          statut: chk.statut,
          note: chk.note || "",
        });
      }

      setCorrLots(prev => [...prev, { lotNum, entries: savedEntries, date: corrParams.date, ops }]);
      setCorrSerials(Array(BATCH_SIZE).fill(""));
      setCorrDupErrors({}); setCorrChecks({}); setCorrLookup({});
      setHistData(null);
      setCorrStep("recap");
      toast(`✅ Lot correction ${lotNum} sauvegardé — ${savedEntries.length} bouteille(s) !`);
    } catch (err) { toast("Erreur : " + err.message, true); }
    finally { setCorrSaving(false); }
  };

  /* ── helpers corriger ── */
  const toggleCorrZone = (idx, zoneId) => {
    setCorrChecks(prev => {
      const cur = prev[idx] || { zonesFixed: new Set(), statut:"en_attente", note:"" };
      const set = new Set(cur.zonesFixed);
      set.has(zoneId) ? set.delete(zoneId) : set.add(zoneId);
      // Si au moins une zone corrigée, forcer statut "corrigee" si encore en attente
      const statut = set.size > 0 && cur.statut === "en_attente" ? "corrigee" : cur.statut;
      return { ...prev, [idx]: { ...cur, zonesFixed: set, statut } };
    });
  };
  const setCorrStatus = (idx, statut) =>
    setCorrChecks(prev => ({ ...prev, [idx]: { ...(prev[idx]||{zonesFixed:new Set(),note:""}), statut } }));
  const setCorrNote = (idx, note) =>
    setCorrChecks(prev => ({ ...prev, [idx]: { ...(prev[idx]||{zonesFixed:new Set(),statut:"en_attente"}), note } }));

  const handleCorrSerial = (i, raw) => {
    const val = raw.replace(/\D/g, "");
    const next = [...corrSerials]; next[i] = val; setCorrSerials(next);
    const errs = {};
    next.forEach((s,j) => { if(!s) return; if(next.filter((x,k)=>k!==j&&x===s).length>0) errs[j]=true; });
    setCorrDupErrors(errs);
  };

  const corrHasDups = Object.keys(corrDupErrors).length > 0;

  // Stats du lot corriger courant (recap)
  const corrLotAll = corrLots.flatMap(l => l.entries);
  const corrTotal    = corrLotAll.length;
  const corrCorrigee = corrLotAll.filter(e => e.statut==="corrigee").length;
  const corrRejetee  = corrLotAll.filter(e => e.statut==="rejetee").length;
  const corrEnAttente= corrLotAll.filter(e => e.statut==="en_attente").length;

  /* ════════════════════════════════════════════════════════════
     CORRIGER — Excel détaillé
  ════════════════════════════════════════════════════════════ */
  const buildCorrectionExcel = () => {
    if (!XLSX || !corrLots.length) return;
    const ops = [corrParams.op1, corrParams.op2].filter(Boolean).join(" / ") || "—";
    const allEntries = corrLots.flatMap(l => l.entries);
    const total      = allEntries.length;
    const corrigees  = allEntries.filter(e => e.statut==="corrigee").length;
    const rejetees   = allEntries.filter(e => e.statut==="rejetee").length;
    const enAttente  = allEntries.filter(e => e.statut==="en_attente").length;

    // Stats par zone
    const zSt = ZONES.map(z => {
      const avecDefaut  = allEntries.filter(e => e.bot[z.col]).length;
      const zoneCorrOK  = allEntries.filter(e => e.statut==="corrigee" && e.zonesFixed.includes(z.id)).length;
      const zonePresent = allEntries.filter(e => e.zonesFixed.includes(z.id)).length;
      return { ...z, avecDefaut, zoneCorrOK, zonePresent };
    });

    /* ── Feuille 1 : Résumé ── */
    const resume = [
      ["RAPPORT CORRECTIONS — TEST HYDROSTATIQUE"], [],
      [`Machine        : ${machine?.label || "—"}`],
      [`Date correction: ${corrParams.date}`],
      [`Opérateurs     : ${ops}`],
      [`Lots traités   : ${corrLots.length}`],
      [],
      ["═══════════════════════════════════════════════════════"],
      ["FORMULES UTILISÉES :"],
      ["  Taux correction %  =  ✓ Corrigées  ÷  Total traités  × 100"],
      ["  % Zone corrigée    =  Bouteilles zone corrigée  ÷  Bouteilles avec défaut zone  × 100"],
      ["  % du total         =  Bouteilles zone corrigée  ÷  Total traités  × 100"],
      [],
      ["═══════════════════════════════════════════════════════"],
      ["RÉSUMÉ GLOBAL"],
      [],
      ["", "Nombre", "% du total traité"],
      ["Total bouteilles traitées", total, "100%"],
      ["✓ Corrigées", corrigees, pct(corrigees, total)+"%"],
      ["↩ Rejetées",  rejetees,  pct(rejetees,  total)+"%"],
      ["⏳ En attente",enAttente, pct(enAttente, total)+"%"],
      [],
      ["═══════════════════════════════════════════════════════"],
      ["ANALYSE PAR ZONE DE DÉFAUT"],
      [],
      ["Zone","Nom complet",
       "Nb avec défaut original",
       "Nb zones corrigées (statut=corrigée)",
       "% correction zone  [= Corrigées zone ÷ Défauts zone × 100]",
       "% du total traité  [= Corrigées zone ÷ Total × 100]"],
    ];
    zSt.forEach(z => {
      resume.push([
        z.id, z.full,
        z.avecDefaut,
        z.zoneCorrOK,
        z.avecDefaut>0 ? pct(z.zoneCorrOK, z.avecDefaut)+"%" : "—",
        total>0 ? pct(z.zoneCorrOK, total)+"%" : "—",
      ]);
    });

    /* Stats par lot */
    resume.push([], ["═══════════════════════════════════════════════════════"]);
    resume.push(["STATISTIQUES PAR LOT DE CORRECTION"],[]);
    resume.push(["Lot","Date","Opérateurs","Total","✓ Corrigées","↩ Rejetées","⏳ En attente","Taux %"]);
    corrLots.forEach(l => {
      const lCorr = l.entries.filter(e=>e.statut==="corrigee").length;
      const lRej  = l.entries.filter(e=>e.statut==="rejetee").length;
      const lPend = l.entries.filter(e=>e.statut==="en_attente").length;
      resume.push([`Lot ${l.lotNum}`, l.date, l.ops||"—", l.entries.length,
        lCorr, lRej, lPend, pct(lCorr, l.entries.length)+"%"]);
    });
    // Ligne TOTAL
    resume.push(["TOTAL","","", total, corrigees, rejetees, enAttente, pct(corrigees,total)+"%"]);

    const ws1 = XLSX.utils.aoa_to_sheet(resume);
    ws1["!cols"]=[{wch:28},{wch:35},{wch:12},{wch:38},{wch:50},{wch:42}];

    /* ── Feuille 2 : Détail bouteilles ── */
    const detail = [[
      "Lot correction","N° Série","Machine","Type","Date originale","Lot original",
      "Opérateur test",
      "Zone Col  défaut","Zone Med  défaut","Zone Gal  défaut","Zone Pied  défaut",
      "Col  corrigé","Med  corrigé","Gal  corrigé","Pied corrigé",
      "Statut","Opérateur correction","Note",
    ]];
    corrLots.forEach(l => {
      l.entries.forEach(e => {
        const b    = e.bot;
        const sess = b.lots?.sessions || {};
        detail.push([
          `Lot ${l.lotNum}`, e.num,
          machine?.label || sess.machine || "—",
          sess.bottle_type || "—",
          sess.date || "—",
          b.lots?.lot_num ? `Lot ${b.lots.lot_num}` : "—",
          sess.operateur || "—",
          b.zone_col  ?"X":"", b.zone_med  ?"X":"", b.zone_gal  ?"X":"", b.zone_pied ?"X":"",
          e.zonesFixed.includes("COL") ?"✓":"",
          e.zonesFixed.includes("MED") ?"✓":"",
          e.zonesFixed.includes("GAL") ?"✓":"",
          e.zonesFixed.includes("PIED")?"✓":"",
          e.statut==="corrigee"?"✓ CORRIGÉE":e.statut==="rejetee"?"↩ REJETÉE":"⏳ EN ATTENTE",
          l.ops||"—",
          e.note||"—",
        ]);
      });
    });
    const ws2 = XLSX.utils.aoa_to_sheet(detail);
    ws2["!cols"]=[{wch:12},{wch:14},{wch:14},{wch:8},{wch:10},{wch:10},{wch:16},
      {wch:7},{wch:7},{wch:7},{wch:7},{wch:10},{wch:10},{wch:10},{wch:10},
      {wch:14},{wch:18},{wch:20}];

    /* ── Feuille 3 : Analyse zones croisée ── */
    const croix = [
      ["ANALYSE CROISÉE : DÉFAUTS ORIGINAUX vs ZONES CORRIGÉES"],
      [`Taux global correction : ${pct(corrigees,total)}%`], [],
      ["Zone","Bouteilles avec défaut","Zones corrigées",
       "% corrigé / défauts","Bouteilles rejetées pour cette zone"],
    ];
    zSt.forEach(z => {
      const rejZone = allEntries.filter(e => e.statut==="rejetee" && e.bot[z.col]).length;
      croix.push([z.id+" — "+z.full, z.avecDefaut, z.zoneCorrOK,
        z.avecDefaut>0?pct(z.zoneCorrOK,z.avecDefaut)+"%":"—", rejZone]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(croix);
    ws3["!cols"]=[{wch:22},{wch:24},{wch:18},{wch:24},{wch:30}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Résumé");
    XLSX.utils.book_append_sheet(wb, ws2, "Détail Bouteilles");
    XLSX.utils.book_append_sheet(wb, ws3, "Analyse Zones");
    beautifyWorkbook(XLSX, wb);
    XLSX.writeFile(wb, `corrections_${corrParams.date}.xlsx`);
    toast("✅ Rapport corrections exporté !");
  };

  /* ════════════════════════════════════════════════════════════
     TEST — helpers
  ════════════════════════════════════════════════════════════ */
  const handleSerial = (i, raw) => {
    const val = raw.replace(/\D/g,"");
    const next = [...serials]; next[i]=val; setSerials(next);
    const errs = {};
    next.forEach((s,j)=>{ if(!s) return; if(next.filter((x,k)=>k!==j&&x===s).length>0) errs[j]=true; });
    setDupErrors(errs);
  };
  const toggleZone = (idx, zoneId) => {
    setChecks(prev => {
      const set = new Set(prev[idx]||[]);
      if (zoneId==="S") { if(set.has("S")) set.delete("S"); else { set.clear(); set.add("S"); } }
      else { set.delete("S"); set.has(zoneId)?set.delete(zoneId):set.add(zoneId); }
      return {...prev,[idx]:set};
    });
  };
  const filled     = serials.map((s,i)=>s.trim()?i:null).filter(i=>i!==null);
  const curOk      = filled.filter(i=>checks[i]?.has("S")).length;
  const curNok     = filled.filter(i=>checks[i]?.size>0&&!checks[i]?.has("S")).length;
  const curCocked  = filled.filter(i=>checks[i]?.size>0).length;
  const allChecked = curCocked===filled.length&&filled.length>0;
  const hasDups    = Object.keys(dupErrors).length>0;
  const allEntries = lots.flatMap(l=>l.serials);
  const gtTotal = allEntries.length;
  const gtOk    = allEntries.filter(e=>e.zones.includes("S")).length;
  const gtNok   = allEntries.filter(e=>e.zones.length>0&&!e.zones.includes("S")).length;
  const gtTaux  = (gtOk+gtNok)>0?Math.round(gtOk/(gtOk+gtNok)*100):null;
  const zoneStats = ZONES.map(z=>{
    const count=allEntries.filter(e=>e.zones.includes(z.id)).length;
    return {...z,count,pctNok:gtNok>0?Math.round(count/gtNok*100):0,pctTot:gtTotal>0?Math.round(count/gtTotal*100):0};
  });

  const validateLot = async () => {
    if (!allChecked) { toast("Cochez toutes les bouteilles.",true); return; }
    setSaving(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const ops=[params.op1,params.op2].filter(Boolean).join(" / ");
        const {data,error} = await sb.from("sessions").insert({
          machine:machine.label, bottle_type:bottleType,
          operateur:ops||null, date:params.date, pression:params.pression,
        }).select("id").single();
        if (error) throw error;
        sid=data.id; setSessionId(sid);
      }
      const {data:lotData,error:lErr} = await sb.from("lots")
        .insert({session_id:sid,lot_num:lots.length+1}).select("id").single();
      if (lErr) throw lErr;
      const rows = filled.map(i=>{
        const z=checks[i]||new Set();
        return {lot_id:lotData.id,num_serie:serials[i].trim(),
          succes:z.has("S"),zone_col:z.has("COL"),zone_med:z.has("MED"),
          zone_gal:z.has("GAL"),zone_pied:z.has("PIED")};
      });
      const {error:bErr} = await sb.from("bouteilles").insert(rows);
      if (bErr) throw bErr;
      setLots(prev=>[...prev,{lotNum:prev.length+1,serials:filled.map(i=>({num:serials[i].trim(),zones:[...(checks[i]||[])]}))}]);
      setSerials(Array(BATCH_SIZE).fill(""));
      setDupErrors({}); setChecks({});
      setSyncState("ok"); setHistData(null);
      setScreen("recap");
      toast(`✅ Lot ${lots.length+1} sauvegardé !`);
    } catch(err){ setSyncState("err"); toast(`⚠️ ${err.message}`,true); }
    finally { setSaving(false); }
  };

  /* ════════════════════════════════════════════════════════════
     HISTORY
  ════════════════════════════════════════════════════════════ */
  const loadHistory = useCallback(async () => {
    if (!sb) return;
    setHistLoading(true);
    try {
      const {data:sessions,error:sErr} = await sb.from("sessions").select("*")
        .order("date",{ascending:false}).order("created_at",{ascending:false});
      if (sErr) throw sErr;
      const {data:lotsData,error:lErr} = await sb.from("lots").select("*").order("lot_num");
      if (lErr) throw lErr;
      const {data:bots,error:bErr} = await sb.from("bouteilles").select("*");
      if (bErr) throw bErr;
      const {data:corrData,error:cErr} = await sb.from("corrections").select("*")
        .order("created_at",{ascending:false});
      if (cErr) throw cErr;

      const assembled = sessions.map(s=>{
        const sLots=lotsData.filter(l=>l.session_id===s.id).map(l=>({...l,bouteilles:bots.filter(b=>b.lot_id===l.id)}));
        const allB=sLots.flatMap(l=>l.bouteilles);
        return {...s,lots:sLots,
          nb_ok:allB.filter(b=>b.succes).length,
          nb_nok:allB.filter(b=>!b.succes&&(b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length,
          nb_fix:allB.filter(b=>b.corrigee).length,
          total:allB.length,type:"test"};
      });

      const corrByDateMachine=(corrData||[]).reduce((acc,c)=>{
        const key=`${c.date_test}||${c.machine}`;
        if(!acc[key]) acc[key]=[];
        acc[key].push(c); return acc;
      },{});

      const corrSessions=Object.entries(corrByDateMachine).map(([key,corrs])=>{
        const [date,machine]=key.split("||");
        return {id:`corr_${key}`,date,machine,
          bottle_type:corrs[0]?.bottle_type||"—",
          operateur:corrs.map(c=>c.corrigee_par).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||null,
          created_at:corrs[0]?.created_at,type:"corrections",corrections:corrs,
          nb_corrigees:corrs.filter(c=>c.statut==="corrigee").length,
          nb_pending:corrs.filter(c=>c.statut==="en_attente").length,
          nb_rejected:corrs.filter(c=>c.statut==="rejetee").length,
          total:corrs.length};
      });

      setHistData([...assembled,...corrSessions]);
    } catch(err){ toast("Erreur : "+err.message,true); setHistData([]); }
    finally { setHistLoading(false); }
  },[sb,toast]);

  useEffect(()=>{
    if (screen==="history"&&sb&&histData===null) loadHistory();
  },[screen,sb,histData,loadHistory]);

  const histByDay=(histData||[]).reduce((acc,s)=>{
    const day=s.date;
    if(!acc[day]) acc[day]={tests:{},corrections:{}};
    if(s.type==="test"){
      if(!acc[day].tests[s.machine]) acc[day].tests[s.machine]=[];
      acc[day].tests[s.machine].push(s);
    } else {
      if(!acc[day].corrections[s.machine]) acc[day].corrections[s.machine]=[];
      acc[day].corrections[s.machine].push(s);
    }
    return acc;
  },{});

  const allDays=Object.keys(histByDay).sort((a,b)=>b.localeCompare(a));
  const filteredDays=searchDate?allDays.filter(d=>d===searchDate):allDays;

  /* ════════════════════════════════════════════════════════════
     EXCEL TEST — stats + résumé
  ════════════════════════════════════════════════════════════ */

  const HDR_TEST = [
    "Machine", "Opérateurs", "Sessions", "Total testé",
    "✓ % Réussite  [= OK ÷ Total]",
    "✗ Nb NOK",
    "✗ % Échec     [= NOK ÷ Total]",
    "Col — Nb", "Col %  [= Col ÷ Total]",
    "Med — Nb", "Med %  [= Med ÷ Total]",
    "Gal — Nb", "Gal %  [= Gal ÷ Total]",
    "Pied — Nb", "Pied % [= Pied ÷ Total]",
  ];

  function machineRow(mac,ops,nb,s){
    return [
      mac, ops||"—", nb, s.tot,
      s.tot>0 ? pct(s.ok,  s.tot)+"%" : "—",
      s.nok,
      s.tot>0 ? pct(s.nok, s.tot)+"%" : "—",
      s.col, s.tot>0 ? pct(s.col, s.tot)+"%" : "—",
      s.med, s.tot>0 ? pct(s.med, s.tot)+"%" : "—",
      s.gal, s.tot>0 ? pct(s.gal, s.tot)+"%" : "—",
      s.pid, s.tot>0 ? pct(s.pid, s.tot)+"%" : "—",
    ];
  }

  function buildTypeSection(rows,label,sessions){
    if(!sessions.length) return;
    const bots=sessions.flatMap(s=>s.lots.flatMap(l=>l.bouteilles));
    const s=calcBotsStats(bots);
    if(!s.tot) return;
    rows.push([label]);
    rows.push(HDR_TEST);
    const macs=[...new Set(sessions.map(s=>s.machine))];
    macs.forEach(mac=>{
      const ms=sessions.filter(s=>s.machine===mac);
      const mb=ms.flatMap(s=>s.lots.flatMap(l=>l.bouteilles));
      const ops=ms.map(s=>s.operateur).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"—";
      rows.push(machineRow(mac,ops,ms.length,calcBotsStats(mb)));
    });
    if(macs.length>1){
      const ops=[...new Set(sessions.map(s=>s.operateur).filter(Boolean))].join(", ")||"—";
      rows.push(machineRow("TOTAL",ops,sessions.length,s));
    }
    // Ligne récap explicite : nombre de bouteilles ayant échoué et détail par zone affectée
    rows.push([]);
    rows.push(["RÉSUMÉ DES ÉCHECS (NOK)"]);
    rows.push(["Bouteilles testées", s.tot]);
    rows.push(["Bouteilles ayant échoué le test (NOK)", s.nok]);
    rows.push(["  dont zone Col (Collerette) affectée",   s.col]);
    rows.push(["  dont zone Med (Corps médian) affectée", s.med]);
    rows.push(["  dont zone Gal (Galbe) affectée",        s.gal]);
    rows.push(["  dont zone Pied (Fond / Pied) affectée", s.pid]);
    rows.push([]);
  }

  function buildStatsSheet(title,o6,o125,oAll,labelFn){
    const hdr=["Période","Total testé",
      "✓ % Réussite  [= OK÷Total]",
      "✗ Nb NOK",
      "✗ % Échec     [= NOK÷Total]",
      "Col — Nb","Col %  [= Col÷Total]",
      "Med — Nb","Med %  [= Med÷Total]",
      "Gal — Nb","Gal %  [= Gal÷Total]",
      "Pied — Nb","Pied % [= Pied÷Total]"];
    const dataRow=(lbl,s)=>[
      lbl, s.total,
      s.total>0 ? pct(s.ok,  s.total)+"%" : "—",
      s.nok,
      s.total>0 ? pct(s.nok, s.total)+"%" : "—",
      s.col, s.total>0 ? pct(s.col, s.total)+"%" : "—",
      s.med, s.total>0 ? pct(s.med, s.total)+"%" : "—",
      s.gal, s.total>0 ? pct(s.gal, s.total)+"%" : "—",
      s.pid, s.total>0 ? pct(s.pid, s.total)+"%" : "—",
    ];
    const buildSec=(lbl,obj)=>{
      const entries=Object.entries(obj).sort(([a],[b])=>b.localeCompare(a));
      if(!entries.length) return [];
      const r=[[lbl],hdr];
      entries.forEach(([k,s])=>r.push(dataRow(labelFn(k),s)));
      const tot=Object.values(obj).reduce((a,s)=>({total:a.total+s.total,ok:a.ok+s.ok,nok:a.nok+s.nok,
        col:a.col+(s.col||0),med:a.med+(s.med||0),gal:a.gal+(s.gal||0),pid:a.pid+(s.pid||0)}),{total:0,ok:0,nok:0,col:0,med:0,gal:0,pid:0});
      r.push(dataRow("TOTAL",tot));r.push([]);return r;
    };
    const rows=[[`📊 STATISTIQUES ${title}`],[],
      ["FORMULES : Taux = OK÷(OK+NOK) | % du total = Défauts÷Total × 100"],[],
      ...buildSec("🫙 BOUTEILLES 6 KG",o6),
      ...buildSec("🫙 BOUTEILLES 12.5 KG",o125),
      ...buildSec("📊 TOTAL — 6 KG + 12.5 KG",oAll)];
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:30},{wch:10},{wch:22},{wch:9},{wch:22},{wch:9},{wch:18},{wch:9},{wch:18},{wch:9},{wch:18},{wch:9},{wch:18}];
    return ws;
  }

  const buildDayExcel=(day)=>{
    if(!XLSX) return;
    const dayData=histByDay[day]||{tests:{},corrections:{}};
    const allTests=Object.values(dayData.tests||{}).flat();
    const t6=allTests.filter(s=>s.bottle_type==="6KG");
    const t125=allTests.filter(s=>s.bottle_type==="12.5KG");
    const {byDay6,byDay125,byDayAll,byWeek6,byWeek125,byWeekAll,byMonth6,byMonth125,byMonthAll}=computeStats(histData||[]);

    const resRows=[
      [`RÉSUMÉ — ${fmtDate(day)}`],
      [`Exporté le : ${new Date().toLocaleString("fr-FR")}`],
      [],
      ["FORMULE : % Réussite = OK÷Total | % Échec = NOK÷Total | % Zone = Défauts zone÷Total"],
      [],
    ];
    const hasBoth = t6.length>0 && t125.length>0;
    if(hasBoth){
      buildTypeSection(resRows,"🫙 6 KG",t6);
      buildTypeSection(resRows,"🫙 12.5 KG",t125);
      buildTypeSection(resRows,"📊 TOTAL — 6 KG + 12.5 KG",allTests);
    } else {
      buildTypeSection(resRows, t6.length>0?"🫙 6 KG":"🫙 12.5 KG", allTests);
    }

    const ws1=XLSX.utils.aoa_to_sheet(resRows);
    ws1["!cols"]=[{wch:32},{wch:22},{wch:9},{wch:22},{wch:9},{wch:18},{wch:9},{wch:18},{wch:9},{wch:18},{wch:9},{wch:18},{wch:14}];

    const det6=[["Machine","Type","Opérateurs","Date","Heure","Lot","N° Série","Succès","Col","Med","Gal","Pied","Corrigée"]];
    t6.forEach(s=>s.lots.forEach(l=>l.bouteilles.forEach(b=>{
      det6.push([s.machine,s.bottle_type,s.operateur||"—",s.date,fmtTime(s.created_at),`Lot ${l.lot_num}`,b.num_serie,b.succes?"✓":"",b.zone_col?"X":"",b.zone_med?"X":"",b.zone_gal?"X":"",b.zone_pied?"X":"",b.corrigee?"✓":""]);
    })));
    const ws2=XLSX.utils.aoa_to_sheet(det6);

    const det125=[["Machine","Type","Opérateurs","Date","Heure","Lot","N° Série","Succès","Col","Med","Gal","Pied","Corrigée"]];
    t125.forEach(s=>s.lots.forEach(l=>l.bouteilles.forEach(b=>{
      det125.push([s.machine,s.bottle_type,s.operateur||"—",s.date,fmtTime(s.created_at),`Lot ${l.lot_num}`,b.num_serie,b.succes?"✓":"",b.zone_col?"X":"",b.zone_med?"X":"",b.zone_gal?"X":"",b.zone_pied?"X":"",b.corrigee?"✓":""]);
    })));
    const ws3=XLSX.utils.aoa_to_sheet(det125);

    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws1,"Résumé Jour");
    if(det6.length>1)   XLSX.utils.book_append_sheet(wb,ws2,"Détail 6KG");
    if(det125.length>1) XLSX.utils.book_append_sheet(wb,ws3,"Détail 12.5KG");
    XLSX.utils.book_append_sheet(wb,buildStatsSheet("PAR JOUR",byDay6,byDay125,byDayAll,fmtDate),"Stats Jours");
    XLSX.utils.book_append_sheet(wb,buildStatsSheet("PAR SEMAINE",byWeek6,byWeek125,byWeekAll,k=>`Semaine ${k}`),"Stats Semaines");
    XLSX.utils.book_append_sheet(wb,buildStatsSheet("PAR MOIS",byMonth6,byMonth125,byMonthAll,fmtMonth),"Stats Mois");
    beautifyWorkbook(XLSX, wb);
    XLSX.writeFile(wb,`qualite_${day}.xlsx`);
    toast(`✅ Rapport ${day} téléchargé !`);
  };

  const buildMachineExcel=(day,macName,sessions)=>{
    if(!XLSX) return;
    const s6=sessions.filter(s=>s.bottle_type==="6KG"), s125=sessions.filter(s=>s.bottle_type==="12.5KG");
    const {byDay6,byDay125,byDayAll,byWeek6,byWeek125,byWeekAll,byMonth6,byMonth125,byMonthAll}=computeStats(histData||[]);
    const typeLabel = s6.length>0 && s125.length>0 ? "6 KG + 12.5 KG" : s6.length>0 ? "6 KG" : "12.5 KG";
    const hasBoth = s6.length>0 && s125.length>0;
    const rows=[
      [`📊 ${macName} — ${fmtDate(day)}`],
      [`Type : ${typeLabel}  |  Exporté le : ${new Date().toLocaleString("fr-FR")}`],
      [],
      ["FORMULE : % Réussite = OK÷Total | % Échec = NOK÷Total | % Zone = Défauts zone÷Total"],
      [],
    ];
    if(hasBoth){
      buildTypeSection(rows,"🫙 6 KG",s6);
      buildTypeSection(rows,"🫙 12.5 KG",s125);
      buildTypeSection(rows,"📊 TOTAL — 6 KG + 12.5 KG",sessions);
    } else {
      buildTypeSection(rows, s6.length>0?"🫙 6 KG":"🫙 12.5 KG", sessions);
    }
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:32},{wch:22},{wch:9},{wch:22},{wch:9},{wch:18},{wch:9},{wch:18},{wch:9},{wch:18},{wch:9},{wch:18},{wch:14}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Résumé");
    XLSX.utils.book_append_sheet(wb,buildStatsSheet("PAR JOUR",byDay6,byDay125,byDayAll,fmtDate),"Stats Jours");
    XLSX.utils.book_append_sheet(wb,buildStatsSheet("PAR SEMAINE",byWeek6,byWeek125,byWeekAll,k=>`Semaine ${k}`),"Stats Semaines");
    XLSX.utils.book_append_sheet(wb,buildStatsSheet("PAR MOIS",byMonth6,byMonth125,byMonthAll,fmtMonth),"Stats Mois");
    beautifyWorkbook(XLSX, wb);
    XLSX.writeFile(wb,`hydro_${macName.replace(/\s+/g,"_")}_${day}.xlsx`);
    toast(`✅ ${macName} exporté !`);
  };

  /* ─── Delete ─── */
  const deleteMachineDay=async(day,macName,sessions)=>{
    if(!sb||!window.confirm(`⚠️ Supprimer ${macName} du ${day} ?\nIrréversible.`)) return;
    const key=`${day}_${macName}`; setDeleting(p=>new Set([...p,key]));
    try {
      const botIds=sessions.flatMap(s=>s.lots.flatMap(l=>l.bouteilles.map(b=>b.id)));
      const lotIds=sessions.flatMap(s=>s.lots.map(l=>l.id)), sessIds=sessions.map(s=>s.id);
      if(botIds.length){ await sb.from("corrections").delete().in("bouteille_id",botIds); await sb.from("bouteilles").delete().in("id",botIds); }
      if(lotIds.length) await sb.from("lots").delete().in("id",lotIds);
      if(sessIds.length) await sb.from("sessions").delete().in("id",sessIds);
      setHistData(null); toast(`✅ Supprimé !`);
    } catch(err){ toast(`⚠️ ${err.message}`,true); }
    finally { setDeleting(p=>{const n=new Set(p);n.delete(key);return n;}); }
  };
  const deleteSession=async(s)=>{
    if(!sb||!window.confirm(`⚠️ Supprimer session ${fmtTime(s.created_at)} — ${s.machine} ?\nIrréversible.`)) return;
    setDeleting(p=>new Set([...p,s.id]));
    try {
      const botIds=s.lots.flatMap(l=>l.bouteilles.map(b=>b.id)), lotIds=s.lots.map(l=>l.id);
      if(botIds.length){ await sb.from("corrections").delete().in("bouteille_id",botIds); await sb.from("bouteilles").delete().in("id",botIds); }
      if(lotIds.length) await sb.from("lots").delete().in("id",lotIds);
      await sb.from("sessions").delete().eq("id",s.id);
      setHistData(null); toast("✅ Session supprimée !");
    } catch(err){ toast(`⚠️ ${err.message}`,true); }
    finally { setDeleting(p=>{const n=new Set(p);n.delete(s.id);return n;}); }
  };
  const deleteLot=async(lot)=>{
    if(!sb||!window.confirm(`⚠️ Supprimer Lot ${lot.lot_num} (${lot.bouteilles.length} bts) ?\nIrréversible.`)) return;
    setDeleting(p=>new Set([...p,lot.id]));
    try {
      const botIds=lot.bouteilles.map(b=>b.id);
      if(botIds.length){ await sb.from("corrections").delete().in("bouteille_id",botIds); await sb.from("bouteilles").delete().in("id",botIds); }
      await sb.from("lots").delete().eq("id",lot.id);
      setHistData(null); toast(`✅ Lot ${lot.lot_num} supprimé !`);
    } catch(err){ toast(`⚠️ ${err.message}`,true); }
    finally { setDeleting(p=>{const n=new Set(p);n.delete(lot.id);return n;}); }
  };

  /* ─── UI helpers ─── */
  const setP=(k,v)=>setParams(p=>({...p,[k]:v}));
  const Toasts=()=>(
    <div className="tw">
      {toasts.map(t=><div key={t.id} className={`toast${t.err?" e":""}`}>{t.msg}</div>)}
    </div>
  );
  const Saving=()=>saving||corrSaving?(
    <div className="sav-ov"><div className="sav-box">
      <div className="sav-sp"/><div className="sav-txt">SAUVEGARDE…</div>
    </div></div>
  ):null;

  /* ══════════════════════════════════════════════════════════
     SCREEN: MACHINE (accueil)
  ══════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════
     SCREEN: HOME (accueil du module — actions)
  ══════════════════════════════════════════════════════════ */
  if (screen==="home") return (
    <div className="fs"><div className="fs-grid"/>
      {onExit&&<button className="btn btn-gh btn-sm mod-back" onClick={onExit}>◀ Modules</button>}
      <div className="fs-badge">⚙ WONDERFUL METAL · QC</div>
      <div className="fs-title">TEST <span>HYDRO</span>STATIQUE</div>
      <div className="fs-sub">PRESSION 30 BARS</div>
      <div className="card">
        <div className="card-lbl">Que voulez-vous faire ?</div>
        <div className="home-actions">
          <button className="action-btn ab-new" onClick={()=>setScreen("params")}>
            <div className="ab-icon">🧪</div>
            <div className="ab-label" style={{color:"var(--amber)"}}>NOUVEAU TEST</div>
            <div className="ab-sub">Opérateurs → Type → N° série → Médianne</div>
          </button>
          <div className="home-action-row">
            <button className="action-btn ab-fix"
              onClick={()=>{ setCorrStep("params"); setScreen("corriger"); }}>
              <div className="ab-icon">🔧</div>
              <div className="ab-label" style={{color:"var(--red)"}}>CORRIGER</div>
              <div className="ab-sub">Saisir lot de corrections</div>
            </button>
            <button className="action-btn ab-hist"
              onClick={()=>{setHistData(null);setScreen("history");}}>
              <div className="ab-icon">📋</div>
              <div className="ab-label" style={{color:"var(--blue)"}}>HISTORIQUE</div>
              <div className="ab-sub">Tests & corrections</div>
            </button>
          </div>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: MACHINE (choix de la médianne — avant-dernière étape)
  ══════════════════════════════════════════════════════════ */
  if (screen==="machine") return (
    <div className="fs"><div className="fs-grid"/>
      <div className="fs-badge">🫙 {bottleType} · 👥 {[params.op1,params.op2].filter(Boolean).join(" & ")||"—"}</div>
      <div className="fs-title">CHOISIR LA <span>MÉDIANNE</span></div>
      <div className="fs-sub">SUR QUELLE MACHINE ?</div>
      <div className="card">
        <div className="card-lbl">Sélectionnez la médianne</div>
        <div className="machine-grid">
          {MACHINES.map(m=>(
            <button key={m.id} className={`m-btn${machine?.id===m.id?" sel":""}`} onClick={()=>setMachine(m)}>
              {machine?.id===m.id&&<span className="m-check">✓</span>}
              <div className="m-name">{m.label}</div><div className="m-tag">6 KG · 12.5 KG</div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button className="btn btn-gh" onClick={()=>setScreen("serials")}>← N°</button>
          <button className="btn btn-a" style={{opacity:machine?1:0.35}}
            onClick={()=>{if(machine)setScreen("control");}}>CONTRÔLER →</button>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: BOTTLE TYPE
  ══════════════════════════════════════════════════════════ */
  if (screen==="bottletype") return (
    <div className="fs"><div className="fs-grid"/>
      <div className="fs-badge">👥 {[params.op1,params.op2].filter(Boolean).join(" & ")||"TEST HYDRO"}</div>
      <div className="fs-title">TYPE <span>BOUTEILLE</span></div>
      <div className="card">
        <div className="btype-grid">
          {BOTTLE_TYPES.map(bt=>(
            <button key={bt.id} className={`bt-btn${bottleType===bt.id?" sel":""}`} onClick={()=>setBottleType(bt.id)}>
              {bottleType===bt.id&&<span className="bt-check">✓</span>}
              <div className="bt-kg">{bt.label}</div><div className="bt-unit">{bt.unit}</div><div className="bt-desc">{bt.sub}</div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button className="btn btn-gh" onClick={()=>setScreen("params")}>← Retour</button>
          <button className="btn btn-a" style={{opacity:bottleType?1:0.35}}
            onClick={()=>{if(bottleType)setScreen("serials");}}>SUIVANT →</button>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: PARAMS (test)
  ══════════════════════════════════════════════════════════ */
  if (screen==="params") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">🧪 TEST HYDRO</div>
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={()=>setScreen("home")}>← Accueil</button>
        </div>
      </div>
      <div className="center-body">
        <div className="form-card" style={{maxWidth:620}}>
          <div className="form-title">Paramètres de session</div>
          <div className="form-sub">ÉTAPE 1 — OPÉRATEURS, DATE ET PRESSION</div>
          <div className="op-section">
            <div className="op-section-title">👥 Opérateurs</div>
            <div className="op-row">
              <div className="op-field"><label className="op-lbl">Opérateur 1</label>
                <input className="op-inp" placeholder="Nom opérateur 1" value={params.op1} onChange={e=>setP("op1",e.target.value)}/></div>
              <div className="op-field"><label className="op-lbl">Opérateur 2</label>
                <input className="op-inp" placeholder="Nom opérateur 2" value={params.op2} onChange={e=>setP("op2",e.target.value)}/></div>
            </div>
          </div>
          <div className="pg pg2">
            <div className="pf"><label className="pf-lbl">📅 Date</label>
              <input type="date" className="pf-inp" value={params.date} onChange={e=>setP("date",e.target.value)}/></div>
            <div className="pf"><label className="pf-lbl">⚙ Pression (bars)</label>
              <input className="pf-inp" value={params.pression} onChange={e=>setP("pression",e.target.value)}/></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <button className="btn btn-gh" onClick={()=>setScreen("home")}>← Accueil</button>
            <button className="btn btn-a" onClick={()=>setScreen("bottletype")}>SUIVANT →</button>
          </div>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: SERIALS (test)
  ══════════════════════════════════════════════════════════ */
  if (screen==="serials") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">🧪 TEST HYDRO</div>
        <div className="chip tc">🫙 <span>{bottleType}</span></div>
        <div className="chips">
          <div className="chip">📅 <span>{params.date}</span></div>
          {(params.op1||params.op2)&&<div className="chip">👥 <span>{[params.op1,params.op2].filter(Boolean).join(" & ")}</span></div>}
        </div>
      </div>
      <div className="center-body">
        <div className="form-card">
          <div className="form-title">Lot {lots.length+1} <span style={{fontSize:11,color:"var(--amber)",marginLeft:10,fontFamily:"var(--mono)",letterSpacing:2}}>[{bottleType}]</span></div>
          <div className="form-sub">N° DE SÉRIE — CHIFFRES UNIQUEMENT, TOUS DIFFÉRENTS</div>
          <div className="serial-grid">
            {serials.map((val,i)=>(
              <div className="sc" key={i}>
                <span className="sc-lbl">BTL {i+1}</span>
                <input ref={el=>(inputRefs.current[i]=el)} type="text" inputMode="numeric" pattern="[0-9]*"
                  className={`sc-inp${val?" fi":""}${dupErrors[i]?" dp":""}`}
                  placeholder="00000" value={val} maxLength={10} autoFocus={i===0}
                  onChange={e=>handleSerial(i,e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();inputRefs.current[i+1]?.focus();}}}/>
                {dupErrors[i]&&<div className="sc-err">Doublon!</div>}
              </div>
            ))}
          </div>
          <div className="prog-wrap"><div className="prog-bar" style={{width:`${serials.filter(s=>s.trim()).length/BATCH_SIZE*100}%`}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6}}>
              {lots.length>0&&<button className="btn btn-gh" onClick={()=>setScreen("recap")}>← Récap</button>}
              <button className="btn btn-gh" onClick={()=>setScreen("bottletype")}>← Type</button>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>{serials.filter(s=>s.trim()).length}/{BATCH_SIZE}</span>
              {hasDups&&<span style={{fontFamily:"var(--mono)",fontSize:8,color:"#ef4444"}}>⚠ Doublons</span>}
              <button className="btn btn-a" style={{opacity:serials.some(s=>s.trim())&&!hasDups?1:0.35}}
                onClick={()=>{if(serials.some(s=>s.trim())&&!hasDups)setScreen("machine");}}>MÉDIANNE →</button>
            </div>
          </div>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: CONTROL (test)
  ══════════════════════════════════════════════════════════ */
  if (screen==="control") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">{machine?.label}</div>
        <div className="chip tc">🫙 <span>{bottleType}</span></div>
        <div className="chips"><div className="chip">📅 <span>{params.date}</span></div></div>
      </div>
      <div className="stats-row">
        <div className="sc2"><div className="sv bl">{filled.length}</div><div className="sl">Lot</div></div>
        <div className="sc2"><div className="sv am">{curCocked}</div><div className="sl">Cochées</div></div>
        <div className="sc2"><div className="sv gr">{curOk}</div><div className="sl">✓ OK</div></div>
        <div className="sc2"><div className="sv re">{curNok}</div><div className="sl">✗ NOK</div></div>
        <div className="sc2" style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
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
        {ZONES.map(z=>(
          <div className="li" key={z.id}><div className="ldot" style={{background:z.color}}/><span><b>{z.id}</b> {z.full}</span></div>
        ))}
      </div>
      <div className="ctrl-body">
        {serials.map((num,i)=>{
          if(!num.trim()) return null;
          const set=checks[i]||new Set(), isOk=set.has("S"), isNok=set.size>0&&!isOk;
          return (
            <div className={`b-row${isOk?" bok":isNok?" bnok":""}`} key={i}>
              <div className="b-i">{i+1}</div>
              <div className="b-n">{num.trim()}</div>
              <div className="b-ctrl">
                <button className={`z-btn${set.has("S")?" aS":""}`} onClick={()=>toggleZone(i,"S")}>✓ OK</button>
                <span className="b-sep">|</span>
                {ZONES.map(z=>(
                  <button key={z.id} className={`z-btn${set.has(z.id)?` a${z.id}`:""}`}
                    onClick={()=>toggleZone(i,z.id)}>{z.label}</button>
                ))}
              </div>
              <div className={`b-st${isOk?" bok":isNok?" bnok":" none"}`}>
                {isOk?"✓ OK":isNok?`✗ ${[...set].join("+")}`:"— attente"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="val-bar">
        <div className="val-info">Lot <b>{lots.length+1}</b> · <b>{curCocked}</b>/{filled.length}
          {!allChecked&&curCocked>0&&<span className="val-warn">Cochez toutes les bouteilles pour valider</span>}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <button className="btn btn-gh" onClick={()=>setScreen("machine")}>← Médianne</button>
          <button className="btn btn-a" style={{opacity:allChecked&&!saving?1:0.35}} onClick={validateLot}>
            {saving?"…":"VALIDER ✓"}
          </button>
        </div>
      </div>
      <Saving/><Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: RECAP (test)
  ══════════════════════════════════════════════════════════ */
  if (screen==="recap") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">{machine?.label}</div>
        <div className="chip tc">🫙 <span>{bottleType}</span></div>
        <div className="chips">
          <div className="chip">📅 <span>{params.date}</span></div>
          {lots.length>0&&<div className="chip">📦 <span>{lots.length} lot(s)</span></div>}
          {syncState==="ok"&&<div className="chip ok">☁ <span>OK</span></div>}
        </div>
        <div className="top-right">
          <button className="btn btn-b btn-sm" onClick={()=>{setHistData(null);setScreen("history");}}>📋</button>
        </div>
      </div>
      <div className="stats-row">
        <div className="sc2"><div className="sv bl">{gtTotal}</div><div className="sl">Total</div></div>
        <div className="sc2"><div className="sv am">{lots.length}</div><div className="sl">Lots</div></div>
        <div className="sc2"><div className="sv gr">{gtOk}</div><div className="sl">✓ OK</div></div>
        <div className="sc2"><div className="sv re">{gtNok}</div><div className="sl">✗ NOK</div></div>
        <div className="sc2"><div className="sv am">{gtTaux!==null?gtTaux+"%":"—"}</div><div className="sl">Conform.</div></div>
      </div>
      <div className="legend">
        {ZONES.map(z=>(
          <div className="li" key={z.id}><div className="ldot" style={{background:z.color}}/><span><b>{z.id}</b> {z.full}</span></div>
        ))}
      </div>
      {gtNok>0&&(
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
        </div>
      )}
      <div className="recap-wrap">
        {lots.map(lot=>{
          const lOk=lot.serials.filter(e=>e.zones.includes("S")).length;
          const lNok=lot.serials.filter(e=>e.zones.length>0&&!e.zones.includes("S")).length;
          return (
            <div className="recap-sec" key={lot.lotNum}>
              <div className="rlh">
                <span>LOT</span><span className="rlh-n">{lot.lotNum}</span>
                <span style={{color:"var(--muted)"}}>·</span><span>{lot.serials.length} bts</span>
                <span style={{color:"var(--amber)",fontSize:7,border:"1px solid rgba(245,158,11,.3)",padding:"1px 4px",borderRadius:2}}>{bottleType}</span>
                <span className="rlh-ok">✓{lOk}</span><span className="rlh-nok">✗{lNok}</span>
                <span style={{marginLeft:"auto",color:"#10b981",fontSize:8}}>☁ ok</span>
              </div>
              <table className="rt">
                <thead>
                  <tr><th className="tdi">#</th><th className="thn">N° Série</th><th className="thok">✓</th><th className="therr" colSpan={4}>Zones</th></tr>
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
                      <td>{e.zones.includes("S")&&<span className="mks">✓</span>}</td>
                      <td>{e.zones.includes("COL")&&<span className="mkx col">✗</span>}</td>
                      <td>{e.zones.includes("MED")&&<span className="mkx med">✗</span>}</td>
                      <td>{e.zones.includes("GAL")&&<span className="mkx gal">✗</span>}</td>
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
          <button className="btn btn-r btn-sm" onClick={()=>{setCorrStep("params");setScreen("corriger");}}>🔧 Corriger</button>
          <button className="btn btn-a btn-sm" onClick={()=>{
            setSerials(Array(BATCH_SIZE).fill(""));setDupErrors({});setChecks({});setScreen("serials");
          }}>+ LOT</button>
        </div>
      </div>
      <Saving/><Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: CORRIGER — params
  ══════════════════════════════════════════════════════════ */
  if (screen==="corriger" && corrStep==="params") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine" style={{color:"#ef4444"}}>🔧 CORRIGER</div>
        {machine&&<div className="chip">⚙ <span>{machine.label}</span></div>}
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={()=>setScreen("home")}>← Accueil</button>
        </div>
      </div>
      <div className="center-body">
        <div className="form-card" style={{maxWidth:560}}>
          <div className="form-title" style={{color:"#ef4444"}}>🔧 Session de correction</div>
          <div className="form-sub">SAISIE PAR LOTS DE {BATCH_SIZE} BOUTEILLES</div>
          <div style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.2)",borderRadius:4,padding:"10px 14px",marginBottom:14,fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",lineHeight:1.8}}>
            <div style={{color:"#ef4444",fontWeight:700,marginBottom:4}}>PROCÉDURE :</div>
            <div>1. Renseignez la date et les opérateurs de correction</div>
            <div>2. Saisissez les N° de série des bouteilles à corriger (lot de {BATCH_SIZE})</div>
            <div>3. L'app retrouve les défauts originaux dans la base</div>
            <div>4. Indiquez les zones corrigées pour chaque bouteille</div>
            <div>5. Validez — l'enregistrement est automatique</div>
          </div>
          <div className="op-section">
            <div className="op-section-title">👥 Opérateurs de correction</div>
            <div className="op-row">
              <div className="op-field"><label className="op-lbl">Opérateur 1</label>
                <input className="op-inp" placeholder="Nom opérateur" value={corrParams.op1}
                  onChange={e=>setCorrParams(p=>({...p,op1:e.target.value}))}/></div>
              <div className="op-field"><label className="op-lbl">Opérateur 2</label>
                <input className="op-inp" placeholder="Nom opérateur" value={corrParams.op2}
                  onChange={e=>setCorrParams(p=>({...p,op2:e.target.value}))}/></div>
            </div>
          </div>
          <div className="pf" style={{marginBottom:14}}>
            <label className="pf-lbl">📅 Date de correction</label>
            <input type="date" className="pf-inp" value={corrParams.date}
              onChange={e=>setCorrParams(p=>({...p,date:e.target.value}))}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button className="btn btn-gh" onClick={()=>setScreen("home")}>← Annuler</button>
            <button className="btn btn-a" onClick={()=>setCorrStep("serials")}>SAISIR LES N° →</button>
          </div>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: CORRIGER — saisie des N° de série
  ══════════════════════════════════════════════════════════ */
  if (screen==="corriger" && corrStep==="serials") return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine" style={{color:"#ef4444"}}>🔧 CORRIGER</div>
        <div className="chips">
          <div className="chip">📅 <span>{corrParams.date}</span></div>
          {(corrParams.op1||corrParams.op2)&&
            <div className="chip">👥 <span>{[corrParams.op1,corrParams.op2].filter(Boolean).join(" & ")}</span></div>}
          {corrLots.length>0&&<div className="chip ok">✓ <span>{corrLots.length} lot(s) sauvegardé(s)</span></div>}
        </div>
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={()=>setCorrStep("params")}>← Params</button>
        </div>
      </div>
      <div className="center-body">
        <div className="form-card">
          <div className="form-title" style={{color:"#ef4444"}}>
            Lot correction {corrLots.length+1}
            <span style={{fontSize:10,color:"var(--muted)",marginLeft:10,fontFamily:"var(--mono)"}}>
              [{corrParams.date}]
            </span>
          </div>
          <div className="form-sub">N° DE SÉRIE DES BOUTEILLES À CORRIGER — CHIFFRES UNIQUEMENT</div>
          <div className="serial-grid">
            {corrSerials.map((val,i)=>(
              <div className="sc" key={i}>
                <span className="sc-lbl">BTL {i+1}</span>
                <input ref={el=>(corrInputRefs.current[i]=el)} type="text" inputMode="numeric" pattern="[0-9]*"
                  className={`sc-inp${val?" fi":""}${corrDupErrors[i]?" dp":""}`}
                  placeholder="00000" value={val} maxLength={10} autoFocus={i===0}
                  onChange={e=>handleCorrSerial(i,e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();corrInputRefs.current[i+1]?.focus();}}}/>
                {corrDupErrors[i]&&<div className="sc-err">Doublon!</div>}
              </div>
            ))}
          </div>
          <div className="prog-wrap">
            <div className="prog-bar" style={{width:`${corrSerials.filter(s=>s.trim()).length/BATCH_SIZE*100}%`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6}}>
              {corrLots.length>0&&<button className="btn btn-gh" onClick={()=>setCorrStep("recap")}>← Récap</button>}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>{corrSerials.filter(s=>s.trim()).length}/{BATCH_SIZE}</span>
              {corrHasDups&&<span style={{fontFamily:"var(--mono)",fontSize:8,color:"#ef4444"}}>⚠ Doublons</span>}
              {corrLoading&&<span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--amber)"}}>⏳ Recherche…</span>}
              <button className="btn btn-a" style={{background:"#ef4444",opacity:corrSerials.some(s=>s.trim())&&!corrHasDups&&!corrLoading?1:0.35}}
                onClick={()=>{if(corrSerials.some(s=>s.trim())&&!corrHasDups)loadCorrectionData();}}>
                CONTRÔLER →
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: CORRIGER — contrôle (marquer les zones corrigées)
  ══════════════════════════════════════════════════════════ */
  if (screen==="corriger" && corrStep==="control") {
    const filledCorr = corrSerials.map((s,i)=>s.trim()?i:null).filter(i=>i!==null);
    const nbFound    = filledCorr.filter(i=>!!corrLookup[corrSerials[i].trim()]).length;
    const nbMarked   = filledCorr.filter(i=>(corrChecks[i]?.statut||"en_attente")!=="en_attente").length;
    const nbCorr     = filledCorr.filter(i=>corrChecks[i]?.statut==="corrigee").length;
    const nbRej      = filledCorr.filter(i=>corrChecks[i]?.statut==="rejetee").length;

    return (
      <div className="page">
        <div className="top-bar">
          <div className="top-machine" style={{color:"#ef4444"}}>🔧 CONTRÔLE CORRECTION</div>
          <div className="chips">
            <div className="chip">📅 <span>{corrParams.date}</span></div>
            {(corrParams.op1||corrParams.op2)&&
              <div className="chip">👥 <span>{[corrParams.op1,corrParams.op2].filter(Boolean).join(" & ")}</span></div>}
          </div>
          <div className="top-right">
            <button className="btn btn-gh btn-sm" onClick={()=>setCorrStep("serials")}>← N°</button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-row">
          <div className="sc2"><div className="sv bl">{filledCorr.length}</div><div className="sl">Saisies</div></div>
          <div className="sc2"><div className="sv am">{nbFound}</div><div className="sl">Trouvées</div></div>
          <div className="sc2"><div className="sv gr">{nbCorr}</div><div className="sl">✓ Corrigées</div></div>
          <div className="sc2"><div className="sv mu">{nbRej}</div><div className="sl">↩ Rejetées</div></div>
          <div className="sc2" style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="formula">
              <span className="fop">[</span><span style={{color:"#60a5fa"}}>{nbFound}</span>
              <span className="fop"> → </span><span style={{color:"#10b981"}}>{nbCorr}</span>
              <span className="fop">+</span><span style={{color:"var(--muted)"}}>{nbRej}</span>
              <span className="fop">]</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="legend">
          <span style={{fontWeight:700,marginRight:4}}>ZONES À CORRIGER :</span>
          {ZONES.map(z=>(
            <div className="li" key={z.id}><div className="ldot" style={{background:z.color}}/><span><b>{z.id}</b> {z.full}</span></div>
          ))}
        </div>

        {/* Rows */}
        <div className="ctrl-body">
          {corrSerials.map((num,i)=>{
            if(!num.trim()) return null;
            const numStr  = num.trim();
            const bot     = corrLookup[numStr];
            const chk     = corrChecks[i]||{zonesFixed:new Set(),statut:"en_attente",note:""};
            const origZ   = bot ? ZONES.filter(z=>bot[z.col]) : [];
            const isCorr  = chk.statut==="corrigee";
            const isRej   = chk.statut==="rejetee";

            return (
              <div className={`b-row${isCorr?" bok":isRej?" brej":""}`} key={i}>
                {/* Index + serial */}
                <div className="b-i">{i+1}</div>
                <div className="b-n">
                  {numStr}
                  {!bot&&<div className="b-notfound">⚠ non trouvé</div>}
                  {bot&&(
                    <div style={{fontFamily:"var(--mono)",fontSize:7,color:"var(--amber)",marginTop:2}}>
                      {bot.lots?.sessions?.bottle_type||"—"} · {bot.lots?.sessions?.machine||"—"}
                    </div>
                  )}
                </div>

                {/* Zone correction buttons */}
                <div className="b-ctrl">
                  {ZONES.map(z=>(
                    <button key={z.id}
                      className={`z-btn${chk.zonesFixed.has(z.id)?` a${z.id}`:""}`}
                      style={{opacity:bot&&!bot[z.col]?0.35:1}}
                      onClick={()=>toggleCorrZone(i,z.id)}>
                      {chk.zonesFixed.has(z.id)?"✓":""} {z.label}
                    </button>
                  ))}
                  <span className="b-sep">|</span>
                  <button className={`z-btn${isCorr?" aS":""}`} onClick={()=>setCorrStatus(i,"corrigee")}>✓ OK</button>
                  <button className={`z-btn${isRej?" aREJ":""}`} onClick={()=>setCorrStatus(i,"rejetee")}>↩ Rej</button>
                  <input className="corr-note-inp" placeholder="Note…" value={chk.note||""}
                    onChange={e=>setCorrNote(i,e.target.value)} style={{marginLeft:4}}/>
                </div>

                {/* Status indicator */}
                <div className={`b-st${isCorr?" bok":isRej?" brej":" none"}`}>
                  {isCorr?"✓ CORRIGÉE":isRej?"↩ REJETÉE":"— attente"}
                </div>

                {/* Original defects row */}
                {origZ.length>0&&(
                  <div className="b-orig">
                    <span className="b-orig-lbl">Défauts originaux :</span>
                    {origZ.map(z=>(
                      <span key={z.id} className="orig-tag"
                        style={{color:z.color,borderColor:z.color,background:z.color+"20"}}>
                        ✗{z.label}
                      </span>
                    ))}
                    {chk.zonesFixed.size>0&&(
                      <>
                        <span style={{color:"var(--muted)",fontSize:10,margin:"0 3px"}}>→</span>
                        {ZONES.filter(z=>chk.zonesFixed.has(z.id)).map(z=>(
                          <span key={z.id} className="orig-tag"
                            style={{color:"#10b981",borderColor:"rgba(16,185,129,.4)",background:"rgba(16,185,129,.12)"}}>
                            ✓{z.label}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="val-bar">
          <div className="val-info">
            Lot correction <b>{corrLots.length+1}</b> · <b>{nbFound}</b>/{filledCorr.length} bouteilles trouvées
            {nbMarked<nbFound&&<span className="val-warn">Marquez chaque bouteille trouvée (✓ OK ou ↩ Rejeter)</span>}
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <button className="btn btn-gh" onClick={()=>setCorrStep("serials")}>← N°</button>
            <button className="btn btn-a" style={{background:"#ef4444",opacity:!corrSaving?1:0.4}}
              onClick={validateCorrLot} disabled={corrSaving}>
              {corrSaving?"…":"VALIDER ✓"}
            </button>
          </div>
        </div>
        <Saving/><Toasts/>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     SCREEN: CORRIGER — récap de session
  ══════════════════════════════════════════════════════════ */
  if (screen==="corriger" && (corrStep==="recap"||corrStep==="home")) return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine" style={{color:"#ef4444"}}>🔧 CORRECTIONS</div>
        <div className="chips">
          <div className="chip">📅 <span>{corrParams.date}</span></div>
          {corrLots.length>0&&<div className="chip ok">☁ <span>{corrLots.length} lot(s)</span></div>}
        </div>
        <div className="top-right">
          {corrLots.length>0&&<button className="btn btn-g btn-sm" onClick={buildCorrectionExcel}>📊 Excel</button>}
          <button className="btn btn-gh btn-sm" onClick={()=>setScreen("home")}>← Accueil</button>
        </div>
      </div>

      {/* Stats globales session */}
      <div className="stats-row">
        <div className="sc2"><div className="sv bl">{corrTotal}</div><div className="sl">Traitées</div></div>
        <div className="sc2"><div className="sv gr">{corrCorrigee}</div><div className="sl">✓ Corrigées</div></div>
        <div className="sc2"><div className="sv mu">{corrRejetee}</div><div className="sl">↩ Rejetées</div></div>
        <div className="sc2"><div className="sv am">{corrEnAttente}</div><div className="sl">⏳ En attente</div></div>
        <div className="sc2"><div className="sv am">{corrTotal>0?pct(corrCorrigee,corrTotal)+"%":"—"}</div><div className="sl">Taux corr.</div></div>
        <div className="sc2" style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="formula">
            <span className="fop">Taux = </span>
            <span style={{color:"#10b981"}}>{corrCorrigee}</span>
            <span className="fop"> ÷ </span>
            <span style={{color:"#60a5fa"}}>{corrTotal}</span>
            <span className="fop"> = </span>
            <span style={{color:"var(--amber)"}}>{corrTotal>0?pct(corrCorrigee,corrTotal)+"%":"—"}</span>
          </div>
        </div>
      </div>

      <div className="corr-home">
        {corrLots.length===0&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            height:180,gap:12,opacity:.5}}>
            <div style={{fontSize:36}}>🔧</div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>Aucun lot encore sauvegardé</div>
          </div>
        )}

        {/* Liste des lots */}
        {corrLots.length>0&&(
          <div className="corr-lots-list">
            {corrLots.map(lot=>{
              const lCorr=lot.entries.filter(e=>e.statut==="corrigee").length;
              const lRej =lot.entries.filter(e=>e.statut==="rejetee").length;
              const lPend=lot.entries.filter(e=>e.statut==="en_attente").length;
              return (
                <div className="corr-lot-card" key={lot.lotNum}>
                  <div className="clc-hdr">
                    <span className="clc-num">LOT {lot.lotNum}</span>
                    <span className="clc-pill b">{lot.entries.length} bts</span>
                    <span className="clc-pill g">✓{lCorr}</span>
                    {lRej>0&&<span className="clc-pill m">↩{lRej}</span>}
                    {lPend>0&&<span className="clc-pill r">⏳{lPend}</span>}
                    <span className="clc-pill g">{pct(lCorr,lot.entries.length)}%</span>
                    {lot.ops&&<span style={{fontFamily:"var(--mono)",fontSize:7,color:"var(--muted)",marginLeft:4}}>👥 {lot.ops}</span>}
                  </div>
                  {/* Zone stats du lot */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
                    {ZONES.map(z=>{
                      const avecDef=lot.entries.filter(e=>e.bot[z.col]).length;
                      const corr=lot.entries.filter(e=>e.statut==="corrigee"&&e.zonesFixed.includes(z.id)).length;
                      if(!avecDef) return null;
                      return (
                        <div key={z.id} style={{fontFamily:"var(--mono)",fontSize:7,display:"flex",gap:3,alignItems:"center"}}>
                          <span style={{color:z.color,fontWeight:700}}>{z.label}</span>
                          <span style={{color:"var(--muted)"}}>{avecDef} défauts →</span>
                          <span style={{color:"#10b981",fontWeight:700}}>{corr} corrigé(s)</span>
                          <span style={{color:"var(--amber)"}}>({avecDef>0?pct(corr,avecDef)+"%":"—"})</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="clc-entries">
                    {lot.entries.map(e=>(
                      <span key={e.num} className={`clc-entry${e.statut==="corrigee"?" ok-e":e.statut==="rejetee"?" rej-e":" pend-e"}`}>
                        {e.num}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bot-bar">
        {corrTotal>0&&(
          <div className="fpill">
            <span style={{color:"#5a6a82"}}>Corrigées : </span>
            <span style={{color:"#10b981"}}>{corrCorrigee}</span>
            <span style={{color:"#5a6a82"}}> / </span>
            <span style={{color:"#60a5fa"}}>{corrTotal}</span>
            <span style={{color:"var(--amber)",marginLeft:6}}>{pct(corrCorrigee,corrTotal)}%</span>
          </div>
        )}
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {corrLots.length>0&&<button className="btn btn-g btn-sm" onClick={buildCorrectionExcel}>📊 Rapport Excel</button>}
          <button className="btn btn-a btn-sm" style={{background:"#ef4444"}}
            onClick={()=>{setCorrSerials(Array(BATCH_SIZE).fill(""));setCorrDupErrors({});setCorrChecks({});setCorrLookup({});setCorrStep("serials");}}>
            + AUTRE LOT
          </button>
        </div>
      </div>
      <Toasts/>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: HISTORY
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="page">
      <div className="top-bar">
        <div className="top-machine">HISTORIQUE</div>
        <div className="chips">
          {sb?<div className="chip ok">☁ <span>Supabase</span></div>:<div className="chip er">☁ <span>…</span></div>}
          {histData&&<div className="chip">📊 <span>{histData.filter(s=>s.type==="test").length} sessions</span></div>}
        </div>
        <div className="top-right">
          <button className="btn btn-gh btn-sm" onClick={loadHistory}>↺</button>
          <button className="btn btn-a btn-sm" onClick={()=>setScreen("home")}>← Accueil</button>
        </div>
      </div>
      <div className="hist-body">
        <div className="hist-search">
          <input type="date" className="hs-inp" value={searchDate} onChange={e=>setSearchDate(e.target.value)}/>
          {searchDate&&<button className="hs-clear" onClick={()=>setSearchDate("")}>✕</button>}
          {searchDate&&histByDay[searchDate]&&(
            <button className="btn btn-g btn-sm" onClick={()=>buildDayExcel(searchDate)}>📊 Télécharger</button>
          )}
        </div>

        {histLoading&&<div className="hload"><div className="hspinner"/>CHARGEMENT…</div>}
        {!histLoading&&histData!==null&&filteredDays.length===0&&(
          <div className="hempty">
            <div className="hempty-icon">{searchDate?"🔍":"📋"}</div>
            <div className="hempty-txt">{searchDate?`Aucune donnée pour le ${searchDate}`:"AUCUNE DONNÉE"}</div>
          </div>
        )}

        {!histLoading&&filteredDays.map(day=>{
          const dayData=histByDay[day];
          const allTests=Object.values(dayData.tests||{}).flat();
          const allCorrS=Object.values(dayData.corrections||{}).flat();
          const allBots=allTests.flatMap(s=>s.lots.flatMap(l=>l.bouteilles));
          const dayTot=allBots.length, dayOk=allBots.filter(b=>b.succes).length;
          const dayNok=allBots.filter(b=>!b.succes&&(b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
          const dayTx=(dayOk+dayNok)>0?Math.round(dayOk/(dayOk+dayNok)*100):null;
          const dayFix=allCorrS.flatMap(s=>s.corrections||[]).filter(c=>c.statut==="corrigee").length;

          return (
            <div className="day-block" key={day}>
              <div className="day-hdr">
                <div className="day-lbl">{fmtDate(day)}</div>
                <div className="day-stats">
                  <div className="ds dtot">{dayTot} bts</div>
                  <div className="ds dok">✓{dayOk}</div>
                  <div className="ds dnok">✗{dayNok}</div>
                  {dayTx!==null&&<div className="ds dtx">{dayTx}%</div>}
                  {dayFix>0&&<div className="ds" style={{color:"var(--amber)",borderColor:"rgba(245,158,11,.3)",background:"rgba(245,158,11,.06)"}}>🔧{dayFix}</div>}
                  <button className="btn btn-g btn-sm" onClick={()=>buildDayExcel(day)}>📊 Rapport</button>
                </div>
              </div>

              {/* TESTS */}
              {Object.keys(dayData.tests||{}).length>0&&(
                <>
                  <div className="day-sub-title"><span style={{color:"var(--blue)"}}>🧪</span> TESTS</div>
                  {Object.entries(dayData.tests).map(([macName,sessions])=>{
                    const mb=sessions.flatMap(s=>s.lots.flatMap(l=>l.bouteilles));
                    const mTot=mb.length, mOk=mb.filter(b=>b.succes).length;
                    const mNok=mb.filter(b=>!b.succes&&(b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
                    const mTx=(mOk+mNok)>0?Math.round(mOk/(mOk+mNok)*100):null;
                    return (
                      <div className="med-block" key={macName}>
                        <div className="med-hdr">
                          <div className="med-name">{macName}</div>
                          <div className="med-pills">
                            <div className="mpill mt">{mTot}</div>
                            <div className="mpill mo">✓{mOk}</div>
                            <div className="mpill mn">✗{mNok}</div>
                            {mTx!==null&&<div className="mpill mx">{mTx}%</div>}
                          </div>
                          <div className="med-dl">
                            <button className="btn btn-g btn-sm" onClick={()=>buildMachineExcel(day,macName,sessions)}>📊</button>
                            <button className="btn btn-r btn-sm" disabled={deleting.has(`${day}_${macName}`)}
                              onClick={()=>deleteMachineDay(day,macName,sessions)}>
                              {deleting.has(`${day}_${macName}`)?"…":"🗑"}
                            </button>
                          </div>
                        </div>
                        {sessions.map(s=>{
                          const isOpen=expanded.has(s.id);
                          const sTx=(s.nb_ok+s.nb_nok)>0?Math.round(s.nb_ok/(s.nb_ok+s.nb_nok)*100):null;
                          return (
                            <div className="sess-card" key={s.id}>
                              <div className="sess-hdr" onClick={()=>{
                                setExpanded(p=>{const n=new Set(p);n.has(s.id)?n.delete(s.id):n.add(s.id);return n;});
                              }}>
                                <div className="sh-type">{s.bottle_type}</div>
                                {s.operateur&&<div className="sh-op">👥 {s.operateur}</div>}
                                <div className="sh-time">🕐 {fmtTime(s.created_at)}</div>
                                <div className="sh-pills">
                                  <div className="shp st">{s.total}</div>
                                  <div className="shp so">✓{s.nb_ok}</div>
                                  <div className="shp sn">✗{s.nb_nok}</div>
                                  {sTx!==null&&<div className="shp sx">{sTx}%</div>}
                                  {s.nb_fix>0&&<div className="shp sx">🔧{s.nb_fix}</div>}
                                </div>
                                <button className="btn btn-r btn-sm" style={{padding:"2px 7px",fontSize:10}}
                                  disabled={deleting.has(s.id)}
                                  onClick={e=>{e.stopPropagation();deleteSession(s);}}>
                                  {deleting.has(s.id)?"…":"🗑"}
                                </button>
                                <span className={`sh-chev${isOpen?" open":""}`}>▶</span>
                              </div>
                              {isOpen&&(
                                <div className="sess-detail">
                                  {s.lots.map(lot=>{
                                    const lOk=lot.bouteilles.filter(b=>b.succes).length;
                                    const lNok=lot.bouteilles.filter(b=>!b.succes&&(b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
                                    return (
                                      <div className="lot-mini" key={lot.id}>
                                        <div className="lmh">
                                          <span>LOT</span><span className="lmh-n">{lot.lot_num}</span>
                                          <span style={{color:"var(--muted)"}}>·</span>
                                          <span>{lot.bouteilles.length} bts</span>
                                          <span className="lmh-ok">✓{lOk}</span>
                                          <span className="lmh-nok">✗{lNok}</span>
                                          <button style={{marginLeft:"auto",background:"rgba(239,68,68,.12)",
                                            border:"1px solid #ef4444",color:"#ef4444",
                                            fontFamily:"var(--mono)",fontSize:8,padding:"1px 7px",
                                            borderRadius:2,cursor:"pointer",opacity:deleting.has(lot.id)?0.5:1}}
                                            disabled={deleting.has(lot.id)}
                                            onClick={e=>{e.stopPropagation();deleteLot(lot);}}>
                                            {deleting.has(lot.id)?"…":"🗑 Supprimer"}
                                          </button>
                                        </div>
                                        <table className="lmt">
                                          <thead>
                                            <tr><th style={{width:18}}>#</th><th className="ltn">N° Série</th>
                                              <th className="ltok">✓</th><th className="lterr" colSpan={4}>Zones</th></tr>
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
                                                <td style={{color:"var(--muted)",fontSize:7}}>{bi+1}</td>
                                                <td className="tdn">{b.num_serie}</td>
                                                <td>{b.succes&&<span className="mks">✓</span>}</td>
                                                <td>{b.zone_col&&<span className="mkx col">✗</span>}</td>
                                                <td>{b.zone_med&&<span className="mkx med">✗</span>}</td>
                                                <td>{b.zone_gal&&<span className="mkx gal">✗</span>}</td>
                                                <td>{b.zone_pied&&<span className="mkx pid">✗</span>}</td>
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
                </>
              )}

              {/* CORRECTIONS */}
              {Object.keys(dayData.corrections||{}).length>0&&(
                <>
                  <div className="day-sub-title"><span style={{color:"var(--amber)"}}>🔧</span> CORRECTIONS</div>
                  {Object.entries(dayData.corrections).map(([macName,corrSessions])=>{
                    const allCorrs=corrSessions.flatMap(s=>s.corrections||[]);
                    const nbDone=allCorrs.filter(c=>c.statut==="corrigee").length;
                    const nbPend=allCorrs.filter(c=>c.statut==="en_attente").length;
                    return (
                      <div className="med-block" key={`c_${macName}`} style={{borderColor:"rgba(245,158,11,.3)"}}>
                        <div className="med-hdr" style={{background:"rgba(245,158,11,.04)"}}>
                          <div className="med-name" style={{color:"var(--amber)"}}>{macName}</div>
                          <div className="med-pills">
                            <div className="mpill mt">{allCorrs.length}</div>
                            <div className="mpill mo">✓{nbDone}</div>
                            {nbPend>0&&<div className="mpill mn">⏳{nbPend}</div>}
                            <div className="mpill mfix">{pct(nbDone,allCorrs.length)}%</div>
                          </div>
                        </div>
                        {corrSessions.map(s=>{
                          const isOpen=expanded.has(s.id);
                          const corrs=s.corrections||[];
                          return (
                            <div className="sess-card corr-sess" key={s.id}>
                              <div className="sess-hdr" onClick={()=>{
                                setExpanded(p=>{const n=new Set(p);n.has(s.id)?n.delete(s.id):n.add(s.id);return n;});
                              }}>
                                <div className="sh-tag-corr">🔧 CORRECTIONS</div>
                                {s.operateur&&<div className="sh-op">👥 {s.operateur}</div>}
                                <div className="sh-time">🕐 {fmtTime(s.created_at)}</div>
                                <div className="sh-pills">
                                  <div className="shp st">{corrs.length}</div>
                                  <div className="shp so">✓{corrs.filter(c=>c.statut==="corrigee").length}</div>
                                  <div className="shp sn">⏳{corrs.filter(c=>c.statut==="en_attente").length}</div>
                                </div>
                                <span className={`sh-chev${isOpen?" open":""}`}>▶</span>
                              </div>
                              {isOpen&&(
                                <div className="sess-detail">
                                  {corrs.map(c=>{
                                    const origZ=ZONES.filter(z=>c[z.col]);
                                    const fixZ=ZONES.filter(z=>(c.zones_corrigees||[]).includes(z.id));
                                    return (
                                      <div className="corr-row" key={c.id}>
                                        <div className="cr-serial">{c.num_serie}</div>
                                        <div className="cr-zones">
                                          {origZ.map(z=><span key={z.id} className="cr-ztag orig">✗{z.label}</span>)}
                                        </div>
                                        {fixZ.length>0&&<span className="cr-arrow">→</span>}
                                        <div className="cr-zones">
                                          {c.statut==="rejetee"?<span className="cr-ztag rj">rejetée</span>
                                            :fixZ.map(z=><span key={z.id} className="cr-ztag fixed">✓{z.label}</span>)}
                                        </div>
                                        <span className={`cr-statut ${c.statut==="corrigee"?"ok":c.statut==="rejetee"?"rj":"at"}`}>
                                          {c.statut==="corrigee"?"✓ CORRIGÉE":c.statut==="rejetee"?"↩ REJETÉE":"⏳ EN ATTENTE"}
                                        </span>
                                        <div className="cr-meta">{c.corrigee_par&&`👤 ${c.corrigee_par}  `}{c.created_at&&fmtTime(c.created_at)}</div>
                                        {c.note&&<div className="cr-note">📝 {c.note}</div>}
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
                </>
              )}
            </div>
          );
        })}
      </div>
      <Toasts/>
    </div>
  );
}