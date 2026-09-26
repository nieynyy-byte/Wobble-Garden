export const METEOR_TRIAL_KEY='wobble-garden.meteor-trials.v1';
export function createMeteorTrials(storage,{preview=false}={}){
 const key=METEOR_TRIAL_KEY+(preview?'.preview':'');
 const read=()=>{try{const s=JSON.parse(storage?.getItem(key)||'null');if(s?.version===2&&typeof s.completedRun==='string'&&s.completedRun)return {version:2,completedRun:s.completedRun};if(s?.version===1&&Array.isArray(s.passedRuns)){const first=s.passedRuns.find(x=>typeof x==='string'&&x);if(first)return {version:2,completedRun:first};}}catch{}return {version:2,completedRun:null};};
 let state=read();
 const status=()=>({passed:state.completedRun?1:0,meteorMarks:state.completedRun?1:0,tieUnlocked:false,preview});
 return {getState:status,complete(runId,passed){if(!passed)return {saved:true,...status()};state=read();if(state.completedRun)return {saved:true,...status()};if(typeof runId!=='string'||!runId)return {saved:false,...status()};const next={version:2,completedRun:runId};try{if(!storage)throw Error('No storage');storage.setItem(key,JSON.stringify(next));state=next;return {saved:true,...status()};}catch{return {saved:false,...status()};}}};
}
