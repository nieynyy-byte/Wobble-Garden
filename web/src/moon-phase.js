// Mean lunar cycle, for atmosphere rather than an astronomical ephemeris.
// NASA mean synodic month; reference new moon 2000-01-06 18:14 UTC.
// https://eclipse.gsfc.nasa.gov/phase/phase2001gmt.html
export const LUNAR_MONTH_DAYS=29.530588;
const epoch=Date.UTC(2000,0,6,18,14),cycle=LUNAR_MONTH_DAYS*86400000;
export function moonPhase(date=new Date()){
 const phase=((date.getTime()-epoch)%cycle+cycle)%cycle/cycle;
 const angle=phase*Math.PI*2;
 return {phase,illumination:(1-Math.cos(angle))/2,light:[Math.sin(angle),0,-Math.cos(angle)]};
}
