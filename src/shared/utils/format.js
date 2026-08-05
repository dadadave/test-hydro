// Fonctions pures de formatage / calcul de clés (dates, semaines, mois, pourcentages).
export function fmtDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return new Date(+y,+m-1,+day).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
}
export function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}
export function getWeekKey(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  const date = new Date(y,m-1,d), jan1 = new Date(y,0,1);
  return `${y}-S${String(Math.ceil(((date-jan1)/86400000+jan1.getDay()+1)/7)).padStart(2,"0")}`;
}
export function getMonthKey(dateStr) { const [y,m]=dateStr.split("-"); return `${y}-${m}`; }
export function fmtMonth(mk) { const [y,m]=mk.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"}); }
export function pct(a,b) { return b>0?Math.round(a/b*100):0; }
