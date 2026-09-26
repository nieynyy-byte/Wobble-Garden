import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {diceVisitEligible} from './dice-visit-state.js';
const ease=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const path=points=>new T.CatmullRomCurve3(points,false,'centripetal');
export function createDiceVisitor({scene,actor,camera,getSave,eligible,reducedMotion=false,register=()=>{}}){
 const root=new T.Group();root.name='September 26 dice visitor 9947';root.visible=false;scene.add(root);
 const spinner=new T.Group();root.add(spinner);
 const pupils=[],spinStep=new T.Quaternion(),rollBase=new T.Quaternion(),spinAxis=new T.Vector3();
 let loaded=false,pending=false,error=null,retryAt=0,age=0,rollAge=null,rolls=0,arrival,rolling,anchor,radius=.6;
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
    pupils.push({o,base:o.position.clone(),center,normal,offset:new T.Vector3(),range:o.geometry.boundingSphere.radius*Math.max(o.scale.x,o.scale.y,o.scale.z)*.32});
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
  else if(rollAge!==null){
   rollAge+=dt;const u=ease(rollAge/8);root.position.copy(rolling.getPointAt(u));spinStep.setFromEuler(new T.Euler(reducedMotion?0:Math.PI*2*u,0,reducedMotion?0:Math.PI*4*u*(rolls%2?1:-1)));spinner.quaternion.copy(rollBase).multiply(spinStep);
   if(rollAge>=8){rollAge=null;spinner.quaternion.copy(rollBase);}
  }else{
   root.scale.setScalar(1);root.position.copy(anchor);if(!reducedMotion){root.position.y+=Math.sin(age*.65)*.075;root.position.x+=Math.sin(age*.3)*.05;spinAxis.set(Math.sin(age*.071+.4),Math.cos(age*.053),Math.sin(age*.089+1.7)).normalize();spinStep.setFromAxisAngle(spinAxis,dt*.16);spinner.quaternion.multiply(spinStep).normalize();}
  }
  root.rotation.y=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z);
  root.updateWorldMatrix(true,true);
  const lookingAt=new T.Vector3(Math.sin(age*.23)*1.5,1.8+Math.sin(age*.19)*.6,.8);
  if(Math.sin(age*.17)>.2)lookingAt.copy(camera.position);
  for(const eye of pupils){
   const direction=eye.o.parent.worldToLocal(lookingAt.clone()).sub(eye.center);
   direction.addScaledVector(eye.normal,-direction.dot(eye.normal));
   if(direction.lengthSq()>1e-10)direction.normalize().multiplyScalar(eye.range);
   eye.offset.lerp(direction,1-Math.exp(-dt*2));eye.o.position.copy(eye.base).add(eye.offset);
  }
 }
 function interact(ray){
  if(!root.visible||age<16||rollAge!==null)return false;
  root.updateMatrixWorld(true);const hit=ray.intersectObject(root,true)[0];if(!hit)return false;
  const blocker=ray.intersectObject(actor,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});if(blocker&&blocker.distance<hit.distance)return false;
  rolls++;rollAge=0;rollBase.copy(spinner.quaternion);
  // Stay on the pot's right side; roll on the tabletop, then buoyantly return.
  const outer=anchor.x-.15-(rolls%3)*.10,ground=radius+.05;
  rolling=path([root.position.clone(),new T.Vector3(outer,ground,anchor.z+.25),new T.Vector3(outer+.12,ground,anchor.z+.65),new T.Vector3(anchor.x,1.5,anchor.z+.4),anchor.clone()]);
  return true;
 }
 return {root,update,interact,getPosition:()=>root.position.clone(),getState:()=>({visible:root.visible,loaded,pending,error,age,rolls,rolling:rollAge!==null,position:root.position.toArray(),rotation:spinner.quaternion.toArray(),movingEyes:pupils.length})};
}
