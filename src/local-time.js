// Local wall clock only: no save, simulated clock, UTC schedule or randomness.
export const LIGHTING_SCHEDULE=Object.freeze([
 {from:0,period:'night'},
 {from:360,period:'morning'},
 {from:540,period:'day'},
 {from:960,period:'golden-hour'},
 {from:1080,period:'sunset'},
 {from:1125,period:'blue-hour'},
 {from:1170,period:'night'}
]);
export function localLightingTime(date=new Date()){
 const hour=date.getHours(),minute=date.getMinutes(),minutes=hour*60+minute;
 const period=LIGHTING_SCHEDULE.findLast(p=>minutes>=p.from).period;
 return {period,hour,minute,key:[date.getFullYear(),date.getMonth(),date.getDate(),hour,minute,date.getTimezoneOffset()].join(':')};
}
