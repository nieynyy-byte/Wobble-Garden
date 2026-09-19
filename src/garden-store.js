import {loadStorage,persist,freshSave,water,choosePlant} from './state.js';
import {growthStage} from './growth.js';

// Call within the same Web Lock for selection and watering. No completion signal
// is exposed until the whole next save has been persisted successfully.
export const GARDEN_LOCK='wobble-water';
function commit(storage,mutate,{allowCorruptReset=false}={}){
 const loaded=loadStorage(storage);
 if(loaded.status==='future'||loaded.status==='unavailable'||(loaded.status==='corrupt'&&!allowCorruptReset))return {status:loaded.status,persisted:false,transition:null};
 const before=loaded.status==='corrupt'?freshSave():loaded.save;
 const result=mutate(before);
 if(result.accepted===false)return {status:'rejected',persisted:false,save:before,result,transition:null};
 if(result.save===before)return {status:'unchanged',persisted:false,save:before,result,transition:null};
 if(!persist(storage,result.save))return {status:'write-failed',persisted:false,save:before,transition:null};
 const after=result.save;
 return {status:'committed',persisted:true,save:after,result,transition:{
  previousDays:before.wateringCount,days:after.wateringCount,
  previousStage:growthStage(before.wateringCount),stage:growthStage(after.wateringCount),
  progressed:result.progressed===true,stageChanged:result.progressed===true&&growthStage(before.wateringCount)!==growthStage(after.wateringCount),
  completedNow:result.completedNow===true
 }};
}
export const commitWater=(storage,date=new Date())=>commit(storage,s=>water(s,date));
// Starting again from a corrupt save is an explicit Begin action after the UI
// has offered a fresh garden and preserved a backup where storage permits.
export const commitChoice=(storage,species,name,date=new Date())=>commit(storage,s=>choosePlant(s,species,name,date),{allowCorruptReset:true});
