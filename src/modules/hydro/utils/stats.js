// Agrégations statistiques pures utilisées pour les rapports Excel.
import { pct, getWeekKey, getMonthKey } from "../../../shared/utils/format";

export function calcBotsStats(bots){
  const tot=bots.length,ok=bots.filter(b=>b.succes).length;
  const nok=bots.filter(b=>!b.succes&&(b.zone_col||b.zone_med||b.zone_gal||b.zone_pied)).length;
  const col=bots.filter(b=>b.zone_col).length,med=bots.filter(b=>b.zone_med).length;
  const gal=bots.filter(b=>b.zone_gal).length,pid=bots.filter(b=>b.zone_pied).length;
  return {tot,ok,nok,col,med,gal,pid,taux:pct(ok,ok+nok)};
}
export function computeStats(data){
  const mk=()=>({total:0,ok:0,nok:0,col:0,med:0,gal:0,pid:0});
  const byDay6={},byDay125={},byDayAll={};
  const byWeek6={},byWeek125={},byWeekAll={};
  const byMonth6={},byMonth125={},byMonthAll={};
  (data||[]).filter(s=>s.type==="test").forEach(s=>{
    const day=s.date,week=getWeekKey(day),month=getMonthKey(day);
    const bots=(s.lots||[]).flatMap(l=>l.bouteilles||[]);
    const col=bots.filter(b=>b.zone_col).length,med=bots.filter(b=>b.zone_med).length;
    const gal=bots.filter(b=>b.zone_gal).length,pid=bots.filter(b=>b.zone_pied).length;
    const add=(obj,key)=>{
      if(!obj[key]) obj[key]=mk();
      obj[key].total+=s.total;obj[key].ok+=s.nb_ok;obj[key].nok+=s.nb_nok;
      obj[key].col+=col;obj[key].med+=med;obj[key].gal+=gal;obj[key].pid+=pid;
    };
    add(byDayAll,day);add(byWeekAll,week);add(byMonthAll,month);
    if(s.bottle_type==="6KG"){add(byDay6,day);add(byWeek6,week);add(byMonth6,month);}
    if(s.bottle_type==="12.5KG"){add(byDay125,day);add(byWeek125,week);add(byMonth125,month);}
  });
  return {byDay6,byDay125,byDayAll,byWeek6,byWeek125,byWeekAll,byMonth6,byMonth125,byMonthAll};
}
