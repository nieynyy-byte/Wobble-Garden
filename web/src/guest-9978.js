import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createGuestState,ARRIVAL_MS,STAY_MS,DEPARTURE_MS} from './guest-state.js';
const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
export function createGuest9978({scene,actor,storage,reducedMotion=false,eligible=()=>true}){
 const state=createGuestState(storage);let model,loading,pending=false,guestEyes=[];const root=new T.Group();root.name='Guest9978';root.visible=false;scene.add(root);
 function load(){if(model)return Promise.resolve(model);if(loading)return loading;loading=new GLTFLoader().loadAsync('./public/assets/models/characters/logo-friends-v02/img-9978.glb').then(g=>{model=g.scene;const pot=new T.Box3().setFromObject(actor.getObjectByName('Pot')),box=new T.Box3().setFromObject(model);const h=pot.getSize(new T.Vector3()).y||1.6;model.scale.setScalar(h*.5/box.getSize(new T.Vector3()).y);model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});root.add(model);guestEyes=[];model.traverse(o=>{if(o.isMesh&&/Pupil|EyeWhite/.test(o.name))guestEyes.push({o,p:o.position.clone(),s:o.scale.clone(),pupil:o.name.includes('Pupil')});});return model;}).catch(e=>{loading=null;throw e;});return loading;}
 async function tap(){if(!eligible()||pending)return false;const trigger=state.tap(Date.now());if(!trigger){if(state.state(Date.now()).taps===1)load().catch(()=>{});return false;}pending=true;try{await load();if(!eligible()){state.resetTaps();return false;}const started=state.start(Date.now());return started;}catch{state.resetTaps();return false;}finally{pending=false;}}
 function update(time=Date.now()){
  const s=state.state(time);root.visible=!!model&&s.active&&eligible();if(!root.visible)return;
  let y=2.15;if(s.phase==='arriving')y=8+(2.15-8)*ease(s.age/ARRIVAL_MS);else if(s.phase==='leaving')y=2.15+(8-2.15)*ease((s.age-ARRIVAL_MS-STAY_MS)/DEPARTURE_MS);
  const t=s.age/1000;root.position.set(.30+(reducedMotion?0:Math.sin(t*.65)*.035),y+(reducedMotion?0:Math.sin(t*1.3)*.055),1.45);root.rotation.set(0,-.20+(reducedMotion?0:Math.sin(t*.7)*.09),reducedMotion?0:Math.sin(t*.9)*.035);
  const blink=t%6.8;for(const e of guestEyes){e.o.position.copy(e.p);e.o.scale.copy(e.s);if(e.pupil){e.o.position.x-=.015;e.o.position.y-=.010;}if(!reducedMotion&&blink>5.9&&blink<6.1)e.o.scale.y*=1-.85*Math.sin((blink-5.9)/.2*Math.PI);}

 }
 return {root,tap,update,resetTaps:()=>state.resetTaps(),getState:()=>({...state.state(Date.now()),loaded:!!model,pending,visible:root.visible,height:model?new T.Box3().setFromObject(model).getSize(new T.Vector3()).y:0})};
}
