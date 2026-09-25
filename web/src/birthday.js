import * as T from 'three';
import {createBirthdayLettering} from './birthday-lettering.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createTraveler,separateTravelers} from './guest-flight.js';
import {createBirthdayState,BIRTHDAY_VISIT_MS} from './birthday-state.js';
export function createBirthday({scene,actor,storage,reducedMotion=false}){
 const root=new T.Group();root.name='Wobble birthday';root.visible=false;scene.add(root);
 const state=createBirthdayState(storage),travelers=[];let clock=0,lastCamera=null,loading=null,view={active:false,visiting:false},error=false;
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.38});
 function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 const cream=mat('#fff0cc'),pink=mat('#ed9caf'),green=mat('#72a963'),dark=mat('#24382d');
 function eyes(parent,y,z){for(const x of [-.10,.10]){mesh(new T.SphereGeometry(.066,12,8),cream,parent,x,y,z);mesh(new T.SphereGeometry(.03,10,8),dark,parent,x,y,z+.055);}}
 function cake(){const g=new T.Group();mesh(new T.CylinderGeometry(.42,.42,.07,32),cream,g);mesh(new T.CylinderGeometry(.33,.35,.3,32),pink,g,0,.18);mesh(new T.TorusGeometry(.31,.07,10,32),cream,g,0,.34).rotation.x=Math.PI/2;
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2;mesh(new T.SphereGeometry(.065,12,8),cream,g,Math.cos(a)*.3,.28,Math.sin(a)*.3);}eyes(g,.19,.34);
 mesh(new T.CylinderGeometry(.032,.032,.23,10),mat('#a8bde8'),g,0,.47);const flame=mesh(new T.SphereGeometry(.052,10,8),new T.MeshBasicMaterial({color:'#ffcd70'}),g,0,.62);flame.scale.y=1.6;return g;}
 function flowers(){const g=new T.Group();for(let i=0;i<3;i++){const x=(i-1)*.19,y=.25+(i===1?.16:0);mesh(new T.CylinderGeometry(.023,.023,y+.15,8),green,g,x,y/2-.05);const f=new T.Group();g.add(f);f.position.set(x,y,0);for(let j=0;j<6;j++){const a=j/6*Math.PI*2;const petal=mesh(new T.SphereGeometry(.105,12,8),[pink,mat('#e9c86c'),mat('#bdade1')][i],f,Math.cos(a)*.13,Math.sin(a)*.13);petal.scale.set(1,1,.5);}mesh(new T.SphereGeometry(.1,12,8),cream,f,0,0,.035);for(const ex of [-.035,.035])mesh(new T.SphereGeometry(.018,8,6),dark,f,ex,.018,.13);}mesh(new T.ConeGeometry(.22,.4,16),mat('#d2c3e1'),g,0,-.08).rotation.z=Math.PI;return g;}
 const lettering=createBirthdayLettering(),title=lettering.root;title.position.set(0,5.2,1.5);root.add(title);
 const light=new T.PointLight('#ffd0dd',0,8,2);light.position.set(-1.8,6.6,5.2);root.add(light);
 let obstacle=new T.Box3();
 function bounds(){obstacle.makeEmpty();actor.updateMatrixWorld(true);actor.traverse(o=>{if(!o.isMesh)return;let a=o;while(a){if(!a.visible)return;a=a.parent;}o.geometry.computeBoundingBox();obstacle.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));});}
 async function load(){if(loading)return loading;loading=(async()=>{bounds();const pot=new T.Box3().setFromObject(actor.getObjectByName('Pot')).getSize(new T.Vector3());const loader=new GLTFLoader();const models=await Promise.all(['9944','9952'].map(id=>loader.loadAsync(new URL('../public/assets/models/characters/logo-friends-v04/img-'+id+'.glb',import.meta.url).href)));models.forEach((g,index)=>{const t=createTraveler(g.scene,{index,count:1,sizeFactor:1.64,potHeight:pot.y,potWidth:pot.x,reducedMotion,obstacle,anchorPosition:new T.Vector3(index?1.05:-1.05,2.9,1.9)});const gift=index?flowers():cake();gift.scale.setScalar(1.05);gift.position.set(0,-.20,.75);t.root.add(gift);t.gift=gift;t.presentation=null;root.add(t.root);travelers.push(t);});})().catch(()=>{error=true;});return loading;}
 const config={arrival:12000,stay:BIRTHDAY_VISIT_MS-24000,departure:12000};
 return {root,update({owner,date=new Date(),time,dt,camera,visible,darkness=0,preview=false}){
  clock=time;lastCamera=camera;view=preview?{active:true,visiting:true,age:Math.max(0,time*1000),remaining:BIRTHDAY_VISIT_MS-time*1000}:state.get(owner,date,visible);
  root.visible=visible&&view.active;if(!root.visible)return;
  title.position.y=5.2+(reducedMotion?0:Math.sin(time*.45)*.06);const width=Math.min(4.1,2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*Math.max(1,camera.position.z-title.position.z)*camera.aspect*.82);title.scale.setScalar(width/lettering.width);lettering.update(time,darkness,reducedMotion);light.intensity=8-darkness*3;
  if(view.visiting&&!loading)void load();
  const age=view.age||0,phase=age<config.arrival?'arriving':age<config.arrival+config.stay?'visiting':'leaving';
  for(const t of travelers){t.root.visible=view.visiting;if(view.visiting)t.update({age,phase},config,dt,true,camera,false);}
  if(view.visiting&&travelers.length){
   separateTravelers(travelers,obstacle);
   for(const t of travelers){
    const idle=t.root.position.clone(),presentation=t.presentation;
    if(presentation){const elapsed=time-presentation.at,forward=new T.Vector3();camera.getWorldDirection(forward);const right=new T.Vector3().crossVectors(forward,camera.up).normalize();const size=new T.Box3().setFromObject(t.root).getSize(new T.Vector3()),halfFov=Math.tan(T.MathUtils.degToRad(camera.fov/2));const distance=Math.max(3.7,size.y/(2*halfFov*.72),size.x/(2*halfFov*camera.aspect*.84));const near=camera.position.clone().addScaledVector(forward,distance).addScaledVector(right,travelers.indexOf(t)===0?-.12:.12);
     const blend=T.MathUtils.smootherstep(elapsed,0,3.8)*(1-T.MathUtils.smootherstep(elapsed,7,11.5));
     t.root.position.lerpVectors(idle,near,blend);t.root.position.y+=Math.sin(Math.PI*blend)*.10;t.gift.position.z=.75+blend*.3;
     if(elapsed>=11.5){t.presentation=null;t.gift.position.z=.75;}
    }
    const desired=Math.atan2(camera.position.x-t.root.position.x,camera.position.z-t.root.position.z);t.root.rotation.y+=T.MathUtils.euclideanModulo(desired-t.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   }
  }
 },interact(ray){
  if(!root.visible||!view.visiting||!lastCamera)return false;
  root.updateMatrixWorld(true);const hits=ray.intersectObjects(travelers.map(t=>t.root),true);if(!hits.length)return false;
  let selected=hits[0].object;while(selected.parent&&selected.parent!==root)selected=selected.parent;const t=travelers.find(t=>t.root===selected);if(!t)return false;
  // One gift is offered at a time, keeping the other friend at its own perch.
  if(travelers.some(t=>t.presentation))return true;t.presentation={at:clock};return true;
 },getPositions:()=>travelers.map(t=>t.root.position.clone()),getState:()=>({...view,loaded:travelers.length,error,presenting:travelers.map(t=>!!t.presentation),text3D:true}),gaze(){if(!root.visible||!view.visiting||!travelers.length)return null;const p=travelers[0].root.position;return {player:false,x:T.MathUtils.clamp(p.x*.045,-.06,.06),y:T.MathUtils.clamp((p.y-1.35)*.035,-.04,.06)};}};
}
