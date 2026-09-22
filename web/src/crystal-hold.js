export const HOLD_MS=3500,BRIGHT_SECONDS=15,FADE_SECONDS=5;
export function crystalPulse(age){if(age<0||age>=BRIGHT_SECONDS+FADE_SECONDS)return 0;if(age<.7)return age/.7;if(age<=BRIGHT_SECONDS)return 1;const x=(age-BRIGHT_SECONDS)/FADE_SECONDS;return 1-x*x*(3-2*x);}
export function createCrystalHolds({eligible,trigger,clock=()=>performance.now()}){
 const holds=new Map();
 return {begin(id,cluster,x,y){holds.set(id,{cluster,x,y,at:clock(),fired:false});},move(id,x,y){const h=holds.get(id);if(h&&Math.hypot(x-h.x,y-h.y)>14)holds.delete(id);},end:id=>holds.delete(id),has:id=>holds.has(id),clear:()=>holds.clear(),update(){if(!eligible()){holds.clear();return;}for(const h of holds.values())if(!h.fired&&clock()-h.at>=HOLD_MS){h.fired=true;trigger(h.cluster);}},getState:()=>Array.from(holds.values()).map(h=>({cluster:h.cluster,fired:h.fired}))};
}
