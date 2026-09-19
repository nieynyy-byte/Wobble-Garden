import {normalizeGrowthDays,COMPLETION_DAY} from './growth.js';
import {dayKey} from './state.js';
export const CRYSTAL_FIRST_DAY=17;
export const GLOW_SECONDS=5.6;
export function crystalGrowth(days){const d=normalizeGrowthDays(days);return {visible:d>=CRYSTAL_FIRST_DAY,progress:d<CRYSTAL_FIRST_DAY?0:(d-CRYSTAL_FIRST_DAY)/(COMPLETION_DAY-CRYSTAL_FIRST_DAY),mature:d===COMPLETION_DAY};}
export const canGlow=(save,date=new Date())=>!!save?.selectedPlant&&crystalGrowth(save.wateringCount).visible&&save.lastWateringDate===dayKey(date);
export function nightAmount(date=new Date()){const hour=date.getHours()+date.getMinutes()/60;return hour<6||hour>=20?1:hour<8?(8-hour)/2:hour>=18?(hour-18)/2:0;}
export function glowEnvelope(age){if(age<0||age>=GLOW_SECONDS)return 0;const smooth=x=>x*x*(3-2*x);return age<1.7?smooth(age/1.7):age<2.5?1:1-smooth((age-2.5)/(GLOW_SECONDS-2.5));}
