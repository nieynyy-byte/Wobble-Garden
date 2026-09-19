import {normalizeGrowthDays,COMPLETION_DAY} from './growth.js';
import {dayKey} from './state.js';
export const CRYSTAL_FIRST_DAY=10;
export const GLOW_SECONDS=5.6;
export function crystalGrowth(days){const d=normalizeGrowthDays(days);return {visible:d>=CRYSTAL_FIRST_DAY,progress:d<CRYSTAL_FIRST_DAY?0:(d-CRYSTAL_FIRST_DAY)/(COMPLETION_DAY-CRYSTAL_FIRST_DAY),mature:d===COMPLETION_DAY};}
export const canGlow=(save,date=new Date())=>!!save?.selectedPlant&&crystalGrowth(save.wateringCount).visible&&save.lastWateringDate===dayKey(date);
export function nightAmount(date=new Date()){const hour=date.getHours()+date.getMinutes()/60;return hour<6||hour>=20?1:hour<8?(8-hour)/2:hour>=18?(hour-18)/2:0;}
export function glowEnvelope(age){if(age<0||age>=GLOW_SECONDS)return 0;const smooth=x=>x*x*(3-2*x);return age<1.7?smooth(age/1.7):age<2.5?1:1-smooth((age-2.5)/(GLOW_SECONDS-2.5));}

// Idle light is visual only: watering gates the pulse, never this baseline.
export function crystalLight(days,darkness=0,pulse=0){
 const growth=crystalGrowth(days), night=Math.max(0,Math.min(1,darkness));
 const idle=growth.visible?(.065+.115*growth.progress)*(1+night*.8):0;
 const bright=growth.visible?Math.max(0,Math.min(1,pulse)):0;
 return {idle,emission:idle+bright*(.65+night*1.25),halo:growth.visible?(.012+.02*growth.progress)*(1+night)+bright*(.16+night*.27):0,spill:idle*.07+bright*(.08+night*.2)};
}
