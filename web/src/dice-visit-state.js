export const DICE_VISIT_DATE='2026-09-26';
export const DICE_VISIT_END='2026-09-30';
export function diceVisitEligible(save,date=new Date()){
 const key=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 return key>=DICE_VISIT_DATE&&key<DICE_VISIT_END&&!!save?.selectedPlant&&save.lastWateringDate>=DICE_VISIT_DATE&&save.lastWateringDate<=key;
}
