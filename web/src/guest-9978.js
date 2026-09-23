import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createGuestState,createEyeGesture,ENCOUNTERS} from './guest-state.js';
import {createTraveler,separateTravelers} from './guest-flight.js';
import {createVisitorSound} from './visitor-sound.js';
export const VISITOR_ASSETS={saturn:['logo-friends-v02/img-9978.glb'],friends:['logo-friends-v04/img-9941.glb','logo-friends-v05/img-9960.glb','logo-friends-v04/img-9990.glb']};
export function createGuest9978({scene,actor,camera,storage,reducedMotion=false,eligible=()=>true,onStart=()=>{},muted=()=>false}){
 const sound=createVisitorSound({muted});let priorPhase='',lastSound=0,obstacleBox=null;
 const states=Object.fromEntries(Object.entries(ENCOUNTERS).map(([k,v])=>[k,createGuestState(storage,v)]));
 const gesture=createEyeGesture(),cache=new Map(),loader=new GLTFLoader();
 const root=new T.Group();root.name='Traveling Wobble visitors';root.visible=false;scene.add(root);
 let kind='saturn',travelers=[],pending=false,token=0,playerUntil=0,lastUpdate=performance.now(),loadingError=false;
 const state=()=>states[kind].state(Date.now());
 const busy=()=>pending||state().active;
 function load(which){
  if(!cache.has(which))cache.set(which,Promise.all(VISITOR_ASSETS[which].map(path=>loader.loadAsync(new URL('../public/assets/models/characters/'+path,import.meta.url).href).then(g=>g.scene))).catch(e=>{cache.delete(which);throw e;}));
  return cache.get(which);
 }
 async function start(which){
  if(!eligible()||busy())return false;
  const s=states[which].state(Date.now());if(s.remaining>0)return false;
  pending=true;const request=++token;
  try{
   const models=await load(which);if(request!==token||!eligible())return false;
   const pot=new T.Box3().setFromObject(actor.getObjectByName('Pot')),height=pot.getSize(new T.Vector3()).y;
   const obstacle=new T.Box3();actor.updateMatrixWorld(true);actor.traverse(o=>{if(!o.isMesh)return;let p=o;while(p){if(!p.visible)return;p=p.parent;}o.geometry.computeBoundingBox();obstacle.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));});
   obstacleBox=obstacle.clone();const entry=(Math.random()-.5)*1.2;
   const next=models.map((m,index)=>createTraveler(m.clone(true),{index,count:models.length,potHeight:height,potWidth:pot.getSize(new T.Vector3()).x,reducedMotion,entry,obstacle}));
   if(!states[which].start(Date.now()))return false;
   root.clear();travelers=next;kind=which;travelers.forEach(t=>root.add(t.root));gesture.reset();playerUntil=0;loadingError=false;priorPhase='';onStart();return true;
  }catch{loadingError=true;return false;}finally{if(request===token)pending=false;}
 }
 function resetTaps(){gesture.reset();token++;pending=false;}
 async function tap(side='Left'){
  if(!eligible())return false;
  playerUntil=Date.now()+1100;
  if(busy())return false;
  const result=gesture.tap(side,performance.now());
  const input=gesture.getState();
  if(input.rapid===1&&states.saturn.state(Date.now()).remaining===0)load('saturn').catch(()=>{});
  if(input.alternating===4&&states.friends.state(Date.now()).remaining===0)load('friends').catch(()=>{});
  return result?start(result):false;
 }
 function update(time=Date.now()){
  sound.update();
  if(!eligible()){gesture.reset();root.visible=false;return;}
  const trigger=gesture.poll(performance.now());if(trigger)void start(trigger);
  const s=states[kind].state(time),stamp=performance.now(),dt=Math.min(.08,Math.max(.001,(stamp-lastUpdate)/1000));lastUpdate=stamp;
  root.visible=travelers.length>0&&s.active;if(!root.visible)return;
  for(const [i,traveler] of travelers.entries())traveler.update(s,ENCOUNTERS[kind],dt,time<playerUntil,camera,Math.floor(s.age/8000)%travelers.length===i);
  separateTravelers(travelers,obstacleBox);
  if(s.phase!==priorPhase){sound.glide(s.phase==='visiting'?.3:.7);priorPhase=s.phase;lastSound=time;}
  else if(time-lastSound>10000&&s.phase==='visiting'){sound.glide(.18,Math.floor(s.age/10000)%travelers.length);lastSound=time;}
 }
 function interact(ray){
  const s=state();if(!eligible()||!root.visible||s.phase!=='visiting')return false;
  root.updateMatrixWorld(true);const hits=ray.intersectObject(root,true);if(!hits.length)return false;
  const blocker=ray.intersectObject(actor,true).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});
  if(blocker&&blocker.distance<hits[0].distance-.02)return false;
  let selected=hits[0].object;while(selected.parent&&selected.parent!==root)selected=selected.parent;
  const traveler=travelers.find(t=>t.root===selected);traveler?.dodge((s.age-ENCOUNTERS[kind].arrival)/1000);if(traveler)sound.glide(.55,travelers.indexOf(traveler));return !!traveler;
 }
 function gaze(){
  if(!root.visible)return null;
  if(Date.now()<playerUntil)return {player:true,x:0,y:0};
  const p=travelers[Math.floor(state().age/8000)%travelers.length].root.position;return {player:false,x:T.MathUtils.clamp(p.x*.045,-.065,.065),y:T.MathUtils.clamp((p.y-1.35)*.035,-.04,.065)};
 }
 return {root,tap,update,interact,gaze,resetTaps,unlockSound:sound.unlock,getPositions:()=>travelers.map(t=>t.root.position.clone()),getState:()=>({...state(),kind,loaded:travelers.length>0,pending,visible:root.visible,loadingError,taps:gesture.getState().rapid,alternating:gesture.getState().alternating,travelers:travelers.map(t=>t.getState()),cooldowns:Object.fromEntries(Object.entries(states).map(([k,v])=>[k,v.state(Date.now()).cooldownUntil]))})};
}
