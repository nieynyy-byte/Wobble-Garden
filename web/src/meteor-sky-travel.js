import * as T from 'three';
const smooth=x=>T.MathUtils.smootherstep(x,0,1);
export const PORTAL_DURATION=8;
export function createSkyTravel(){
 const overlay=new T.Scene();overlay.add(new T.HemisphereLight('#ccefff','#615184',2.5));
 const light=new T.DirectionalLight('#e1eaff',3);light.position.set(-3,6,10);overlay.add(light);
 let travelers=[],sources=[],mode=null;
 function clear(){for(const t of travelers)overlay.remove(t.copy);travelers=[];sources=[];}
 function configure(objects,key){if(mode===key)return;clear();mode=key;sources=objects;for(const source of objects){const copy=source.clone(true);copy.visible=true;overlay.add(copy);const box=new T.Box3().setFromObject(copy);travelers.push({copy,p:copy.position.clone(),s:copy.scale.clone(),q:copy.quaternion.clone(),center:box.getCenter(new T.Vector3()).sub(copy.position)});}}
 function render({renderer,garden,actor,gardenSaturn,space,pot,saturn,gardenCamera,spaceCamera,phase,u,time,reducedMotion}){
  const first=u<.5,out=phase==='warp-out',gardenSide=out?!first:first;
  const objects=gardenSide?[actor,gardenSaturn]:[pot,saturn],scene=gardenSide?garden:space,camera=gardenSide?gardenCamera:spaceCamera;
  configure(objects,phase+(gardenSide?'-garden':'-space'));
  const progress=smooth(first?u*2:(u-.5)*2),inward=first?progress:1-progress;
  const height=camera.isPerspectiveCamera?2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*Math.max(8,camera.position.z):14;
  travelers.forEach((t,i)=>{
   if(!first){t.p.copy(objects[i].position);t.q.copy(objects[i].quaternion);}
   const departure=first?progress:1-progress;
   t.copy.position.copy(t.p);t.copy.position.y+=departure*(height*.65+8);
   t.copy.position.x+=Math.sin(departure*Math.PI)*(.7+i*.25);
   t.copy.position.z-=departure*(gardenSide?5:2);
   t.copy.scale.copy(t.s).multiplyScalar(1-departure*.22);
   t.copy.quaternion.copy(t.q);
   if(!reducedMotion){t.copy.rotateZ(Math.sin(departure*Math.PI)*(.12-i*.07));t.copy.position.y+=Math.sin(time*1.1+i)*.07*Math.sin(departure*Math.PI);}
   t.copy.visible=true;
  });
  const visibility=objects.map(o=>o.visible),auto=renderer.autoClear;
  try{objects.forEach(o=>o.visible=false);renderer.render(scene,camera);renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,camera);}finally{objects.forEach((o,i)=>o.visible=visibility[i]);renderer.autoClear=auto;}
 }
 return {render,reset(){clear();mode=null;},dispose(){clear();},getState:()=>({active:travelers.length>0,side:mode,travelers:travelers.map(t=>({position:t.copy.position.toArray(),scale:t.copy.scale.x,visible:t.copy.visible}))})};
}
