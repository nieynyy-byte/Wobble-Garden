import {growthStage,COMPLETION_DAY,normalizeGrowthDays} from './growth.js';
export const SAVE_KEY='wobble-garden.save';export const SAVE_VERSION=2;
const SPECIES=['pothos','fittonia','peperomia','syngonium','sansevieria'];
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
const validDay=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;const time=Date.parse(x+'T12:00:00Z');return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===x;};
export const cleanName=n=>typeof n==='string'?Array.from(n.trim().replace(/[\u0000-\u001f\u007f]/g,'')).slice(0,24).join(''):'';
export function freshSave(){return {saveVersion:SAVE_VERSION,selectedPlant:null,plantName:'',startDate:null,wateringCount:0,lastWateringDate:null,currentGrowthStage:1,partyDayTriggered:false,partyDate:null,completedDay45:false,repeatWaterCount:0};}
export function parseSave(raw){if(!raw)return {save:freshSave(),status:'new'};try{const s=JSON.parse(raw);if(!s||typeof s!=='object'||Array.isArray(s))throw Error('Invalid save');if(Number.isInteger(s.saveVersion)&&s.saveVersion>SAVE_VERSION)return {save:null,status:'future'};
 if(![1,SAVE_VERSION].includes(s.saveVersion)||!(s.selectedPlant===null||SPECIES.includes(s.selectedPlant))||!Number.isInteger(s.wateringCount)||s.wateringCount<0||s.wateringCount>100000||!(s.lastWateringDate===null||validDay(s.lastWateringDate))||!(s.startDate===null||validDay(s.startDate)))throw Error('Invalid save');
 // Earned days are authoritative; repair derived fields without inventing a completion date.
 const count=normalizeGrowthDays(s.wateringCount),completed=count===COMPLETION_DAY;
 const partyDate=completed&&validDay(s.partyDate)?s.partyDate:null;
 return {save:{...freshSave(),...s,saveVersion:SAVE_VERSION,plantName:cleanName(s.plantName),wateringCount:count,currentGrowthStage:growthStage(count),completedDay45:completed,partyDayTriggered:completed&&(s.partyDayTriggered===true||partyDate!==null),partyDate,repeatWaterCount:Number.isInteger(s.repeatWaterCount)&&s.repeatWaterCount>=0?s.repeatWaterCount:0},status:s.saveVersion===1?'migrated':'loaded'};
 }catch{return {save:freshSave(),status:'corrupt'};}}
export const isLocked=s=>!!s.selectedPlant&&s.wateringCount<COMPLETION_DAY;
export function choosePlant(save,species,name,date=new Date()){
 if(!SPECIES.includes(species)||!cleanName(name))return {save,accepted:false,reason:'invalid'};
 if(isLocked(save)){
  if(species===save.selectedPlant&&!save.plantName)return {save:{...save,plantName:cleanName(name)},accepted:true};
  return {save,accepted:false,reason:'locked'};
 }
 // Starting a new journey is an explicit Home action; no automatic reset at day 45.
 return {save:{...freshSave(),selectedPlant:species,plantName:cleanName(name),startDate:dayKey(date)},accepted:true};
}
export function selectSeedling(save,date=new Date()){return choosePlant(save,'pothos',save.plantName||'Wobble',date).save;}
export function water(save,date=new Date()){
 if(!save.selectedPlant)return {save,advanced:false,progressed:false,completedNow:false,repeats:0};
 const today=dayKey(date),advanced=!save.lastWateringDate||today>save.lastWateringDate;
 const count=normalizeGrowthDays(save.wateringCount+(advanced?1:0)),firstCompletion=advanced&&save.wateringCount<COMPLETION_DAY&&count===COMPLETION_DAY;
 // advanced retains its original meaning: first eligible watering of this local day.
 // Consumers of growth/completion must use the explicit one-shot signals below.
 return {advanced,progressed:count>save.wateringCount,completedNow:firstCompletion,repeats:advanced?1:save.repeatWaterCount+1,save:{...save,wateringCount:count,currentGrowthStage:growthStage(count),lastWateringDate:advanced?today:save.lastWateringDate,repeatWaterCount:advanced?1:save.repeatWaterCount+1,completedDay45:count>=COMPLETION_DAY,partyDayTriggered:save.partyDayTriggered||firstCompletion,partyDate:firstCompletion?today:save.partyDate}};
}
export function eyeSequence(state,side,time){const seq=['Left','Right','Left','Right'];let n=time-state.last>2500?0:state.n;n=side===seq[n]?n+1:side==='Left'?1:0;return {n:n===4?0:n,last:time,triggered:n===4};}
export function loadStorage(storage){try{return parseSave(storage.getItem(SAVE_KEY));}catch{return {save:freshSave(),status:'unavailable'};}}
export function persist(storage,save){try{storage.setItem(SAVE_KEY,JSON.stringify(save));return true;}catch{return false;}}
