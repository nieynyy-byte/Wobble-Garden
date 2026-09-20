export const GUEST_KEY='wobble-garden.guest-9978.v1';
export const ARRIVAL_MS=3000,STAY_MS=30000,DEPARTURE_MS=3000,COOLDOWN_MS=300000;
export const VISIT_MS=ARRIVAL_MS+STAY_MS+DEPARTURE_MS;
export function createGuestState(storage){
 let taps=0,started=null,until=0;
 function read(){try{const n=Number(storage?.getItem(GUEST_KEY));if(Number.isFinite(n)&&n>until)until=n;}catch{} }
 read();
 function state(time){read();const age=started===null?Infinity:Math.max(0,time-started);let phase=age<ARRIVAL_MS?'arriving':age<ARRIVAL_MS+STAY_MS?'visiting':age<VISIT_MS?'leaving':'idle';return {taps,phase,age,active:phase!=='idle',cooldownUntil:until,remaining:Math.max(0,until-time)};}
 return {state,resetTaps(){taps=0;},tap(time){const s=state(time);if(s.active||time<until)return false;taps++;return taps>=10;},start(time){const s=state(time);if(s.active||time<until){taps=0;return false;}started=time;until=time+VISIT_MS+COOLDOWN_MS;taps=0;try{storage?.setItem(GUEST_KEY,String(until));}catch{}return true;}};
}
