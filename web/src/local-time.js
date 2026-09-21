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

// Stable local-wall-clock keyframes. No simulated clock or save dependency.
// Dawn starts at 06:00; daylight fades completely by 19:30.
export const LIGHTING_KEYFRAMES=Object.freeze([
 {at:0,period:'night'}, {at:360,period:'night'},
 {at:405,period:'morning'}, {at:570,period:'day'},
 {at:945,period:'day'}, {at:1020,period:'golden-hour'},
 {at:1100,period:'sunset'}, {at:1145,period:'blue-hour'},
 {at:1170,period:'night'}, {at:1440,period:'night'}
]);
export function localLightingBlend(date=new Date()){
 const minutes=date.getHours()*60+date.getMinutes()+date.getSeconds()/60+date.getMilliseconds()/60000;
 const index=LIGHTING_KEYFRAMES.findLastIndex(k=>minutes>=k.at);
 const from=LIGHTING_KEYFRAMES[index],to=LIGHTING_KEYFRAMES[index+1];
 const x=(minutes-from.at)/(to.at-from.at);
 return {from:from.period,to:to.period,mix:x*x*(3-2*x)};
}
