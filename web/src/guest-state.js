export const GUEST_KEY='wobble-garden.guest-9978.v1';
export const FRIENDS_KEY='wobble-garden.visiting-friends.v1';
export const ARRIVAL_MS=7000,STAY_MS=45000,DEPARTURE_MS=8000,COOLDOWN_MS=300000;
export const VISIT_MS=ARRIVAL_MS+STAY_MS+DEPARTURE_MS;
export const ENCOUNTERS={
 saturn:{key:GUEST_KEY,arrival:ARRIVAL_MS,stay:STAY_MS,departure:DEPARTURE_MS,cooldown:COOLDOWN_MS},
 friends:{key:FRIENDS_KEY,arrival:8500,stay:60000,departure:9000,cooldown:7200000}
};
export function createGuestState(storage,config=ENCOUNTERS.saturn){
 let taps=0,started=null,until=0,lastTap=-Infinity;
 const total=config.arrival+config.stay+config.departure;
 function read(){try{const n=Number(storage?.getItem(config.key));if(Number.isFinite(n)&&n>until)until=n;}catch{} }
 function state(time){read();const age=started===null?Infinity:Math.max(0,time-started);const phase=age<config.arrival?'arriving':age<config.arrival+config.stay?'visiting':age<total?'leaving':'idle';return {taps,phase,age,active:phase!=='idle',cooldownUntil:until,remaining:Math.max(0,until-time)};}
 read();
 return {state,resetTaps(){taps=0;lastTap=-Infinity;},tap(time){const s=state(time);if(s.active||time<until)return false;if(time-lastTap>650)taps=0;lastTap=time;return ++taps>=8;},start(time){const s=state(time);if(s.active||time<until){taps=0;return false;}started=time;until=time+total+config.cooldown;taps=0;try{storage?.setItem(config.key,String(until));}catch{}return true;}};
}
// A pause resolves the 8-tap burst so the first eight of twenty do not summon Saturn.
export function createEyeGesture(){
 let rapid=0,alternating=0,last=-Infinity,due=Infinity,pending=null;
 function reset(){rapid=alternating=0;last=-Infinity;due=Infinity;pending=null;}
 return {reset,tap(side,time){
  const gap=time-last;if(gap>1200)alternating=0;if(gap>650)rapid=0;
  rapid++;const expected=alternating%2===0?'Left':'Right';alternating=side===expected?alternating+1:side==='Left'?1:0;
  last=time;
  if(alternating===20){reset();return 'friends';}
  if(rapid>=8){pending='saturn';due=time+(alternating>=8?1200:700);}
  else if(pending){due=time+1200;}
  return null;
 },poll(time){if(pending&&time>=due){const result=pending;reset();return result;}if(time-last>1200)reset();return null;},getState:()=>({rapid,alternating})};
}
