import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {diceVisitEligible} from './dice-visit-state.js?v=30';
const ease=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const path=points=>new T.CatmullRomCurve3(points,false,'centripetal');
export function createDiceVisitor({scene,actor,camera,getSave,eligible,reducedMotion=false,register=()=>{}}){
 const root=new T.Group();root.name='September 26–29 dice visitor 9947';root.visible=false;scene.add(root);
 const spinner=new T.Group();root.add(spinner);
 const pupils=[],spinStep=new T.Quaternion(),spinAxis=new T.Vector3();
 const offset=new T.Vector3(),velocity=new T.Vector3(),dodgeTarget=new T.Vector3();let spinBoost=0;
 let loaded=false,pending=false,error=null,retryAt=0,age=0,rollAge=null,rolls=0,arrival,anchor,radius=.6;
 async function load(){
  pending=true;
  try{
   const gltf=await new GLTFLoader().loadAsync(new URL('../public/assets/models/characters/logo-friends-v04/img-9947.glb',import.meta.url).href);
   const model=gltf.scene,bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
   model.scale.setScalar(.82/Math.max(size.x,size.y,size.z));
   const box=new T.Box3().setFromObject(model);model.position.sub(box.getCenter(new T.Vector3()));
   radius=box.getSize(new T.Vector3()).length()/2;
   spinner.add(model);model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});register(model);
   model.updateWorldMatrix(true,true);
   model.traverse(o=>{if(!o.isMesh||!o.name.includes('Pupil'))return;
    const white=model.getObjectByName(o.name.replace('Pupil','Eye'));if(!white)return;
    o.geometry.computeBoundingSphere();o.geometry.computeBoundingBox();white.geometry.computeBoundingBox();
    const center=o.parent.worldToLocal(o.localToWorld(o.geometry.boundingBox.getCenter(new T.Vector3())));
    const whiteCenter=o.parent.worldToLocal(white.localToWorld(white.geometry.boundingBox.getCenter(new T.Vector3())));
    const normal=center.clone().sub(whiteCenter).normalize();
    const whiteSize=white.geometry.boundingBox.getSize(new T.Vector3()).multiply(white.scale).toArray().sort((a,b)=>a-b);
    const pupilSize=o.geometry.boundingBox.getSize(new T.Vector3()).multiply(o.scale).toArray().sort((a,b)=>a-b);
    const range=Math.max(0,(whiteSize[1]-pupilSize[1])*.5*.85);
    const up=Math.abs(normal.y)>.9?new T.Vector3(0,0,1):new T.Vector3(0,1,0);
    const right=new T.Vector3().crossVectors(up,normal).normalize();up.crossVectors(normal,right).normalize();
    pupils.push({o,base:o.position.clone(),center,normal,right,up,offset:new T.Vector3(),range});
   });
   const pot=new T.Box3().setFromObject(actor.getObjectByName('Pot'));
   anchor=new T.Vector3(.8,1.05,Math.max(1.5,pot.max.z+radius+.22));
   arrival=path([new T.Vector3(3.9,9.4,-15),new T.Vector3(4.4,7,-6),new T.Vector3(anchor.x+1,4.7,1),anchor.clone().add(new T.Vector3(.2,.8,.2)),anchor]);
   loaded=true;error=null;
  }catch(e){error=String(e);retryAt=performance.now()+30000;}finally{pending=false;}
 }
 function update(dt,date=new Date()){
  const allowed=diceVisitEligible(getSave(),date)&&eligible();root.visible=allowed&&loaded;
  if(!allowed)return;
  if(!loaded){if(!pending&&performance.now()>=retryAt)void load();return;}
  age+=dt;
  if(age<16){const u=ease(age/16);root.position.copy(arrival.getPointAt(u));root.scale.setScalar(.18+.82*u);spinner.rotation.set(reducedMotion?0:(1-u)*Math.PI*2,reducedMotion?0:(1-u)*Math.PI*4,reducedMotion?0:(1-u)*Math.PI*2);}
  else{
   root.scale.setScalar(1);
   if(rollAge!==null){rollAge+=dt;if(rollAge>1.1)dodgeTarget.multiplyScalar(Math.exp(-dt*1.1));if(rollAge>9&&offset.length()<.005&&velocity.length()<.01)rollAge=null;}
   // Critically damped motion keeps position and velocity continuous on repeated taps.
   const omega=3.1,decay=Math.exp(-omega*dt),error=offset.clone().sub(dodgeTarget),term=velocity.clone().addScaledVector(error,omega);
   offset.copy(dodgeTarget).add(error.addScaledVector(term,dt).multiplyScalar(decay));
   velocity.addScaledVector(term,-omega*dt).multiplyScalar(decay);
   root.position.copy(anchor).add(offset);
   const settle=ease((age-16)/3);
   if(!reducedMotion){root.position.y+=Math.sin(age*.65)*.075*settle;root.position.x+=Math.sin(age*.3)*.05*settle;spinBoost+=( (rollAge!==null&&rollAge<1.1?.65:0)-spinBoost)*(1-Math.exp(-dt*2));spinAxis.set(Math.sin(age*.071+.4),Math.cos(age*.053),Math.sin(age*.089+1.7)).normalize();spinStep.setFromAxisAngle(spinAxis,dt*(.16+spinBoost)*settle);spinner.quaternion.multiply(spinStep).normalize();}
  }
  root.rotation.y=T.MathUtils.lerp(root.rotation.y,Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z),1-Math.exp(-dt*5));
  root.updateWorldMatrix(true,true);
  const lookingAt=new T.Vector3(Math.sin(age*.23)*1.5,1.8+Math.sin(age*.19)*.6,.8);
  if(Math.sin(age*.17)>.2)lookingAt.copy(camera.position);
  for(const eye of pupils){
   const direction=eye.o.parent.worldToLocal(lookingAt.clone()).sub(eye.center);
   direction.addScaledVector(eye.normal,-direction.dot(eye.normal));
   if(direction.lengthSq()>1e-10)direction.normalize().multiplyScalar(.2);
   // Give the small dice pips a readable glance, rather than an almost static camera lock.
   direction.addScaledVector(eye.right,Math.sin(age*.85)*.85).addScaledVector(eye.up,Math.sin(age*.57+1)*.6);
   if(direction.length()>1)direction.normalize();direction.multiplyScalar(eye.range);
   eye.offset.lerp(direction,1-Math.exp(-dt*2));eye.o.position.copy(eye.base).add(eye.offset);
  }
 }
 function interact(ray){
  if(!root.visible||age<16)return false;
  root.updateMatrixWorld(true);const hit=ray.intersectObject(root,true)[0];if(!hit)return false;
  const blocker=ray.intersectObject(actor,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});if(blocker&&blocker.distance<hit.distance)return false;
  rolls++;rollAge=0;
  const away=root.position.clone().sub(hit.point);away.z=0;
  if(away.length()<.03)away.set(rolls%2?-.7:.4,.6,0);away.normalize();
  const strength=reducedMotion?.12:.48;
  dodgeTarget.set(T.MathUtils.clamp(offset.x+away.x*strength,-.55,.20),T.MathUtils.clamp(offset.y+away.y*strength,-.12,.48),.12);
  return true;
 }
 return {root,update,interact,getPosition:()=>root.position.clone(),getState:()=>({visible:root.visible,loaded,pending,error,age,rolls,rolling:rollAge!==null,position:root.position.toArray(),rotation:spinner.quaternion.toArray(),movingEyes:pupils.length,eyeOffsets:pupils.map(e=>e.offset.toArray())})};
}
