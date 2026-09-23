import * as T from 'three';
const clamp=T.MathUtils.clamp;
const smooth=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
const curve=points=>new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
export function createTraveler(model,{index=0,count=1,potHeight=2,potWidth=2,reducedMotion=false,entry=0,obstacle=null}={}){
 const root=new T.Group();root.add(model);
 const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
 model.scale.setScalar(Math.min(potHeight*(count===1?.43:.53)/size.y,potWidth*(count===1?.48:.58)/size.x));
 const center=new T.Box3().setFromObject(model).getCenter(new T.Vector3());model.position.sub(center);
 const scaledBox=new T.Box3().setFromObject(model),extent=scaledBox.getSize(new T.Vector3());
 const radius=extent.length()*.5+.08;
 const front=Math.max(2.0,(obstacle?.max.z||1)+radius+.38);
 const anchor=new T.Vector3(count===1?.65:[-.62,.62,0][index],count===1?2.25:[extent.y*.5+.10,extent.y*.5+.15,Math.max(3.2,(obstacle?.max.y||2.5)+extent.y*.5+.45)][index],front+index*.10);
 const safeY=Math.max(4.6,(obstacle?.max.y||3)+radius+.55);
 const laneX=2.0+index*1.25;
 const arrival=count===1?curve([[1.25+entry*.15,4.7,-15],[1.0,4.5,-10],[.45,Math.max(3.7,(obstacle?.max.y||3)+radius+.35),-3.6],[.25,Math.max(3.7,(obstacle?.max.y||3)+radius+.35),front],[anchor.x+.2,anchor.y+.5,front+.12],anchor.toArray()]):curve([[anchor.x+entry*.3,12+index*1.2,-10],[anchor.x+.5,9+index*.7,-5],[anchor.x+.35,safeY+2+index*.5,front],[anchor.x+.18,anchor.y+1.0,front+.2],anchor.toArray()]);
 let departure,departFrom,detour=null,detourAt=0,detourDuration=3,interactions=0,lastTap=-Infinity,kick=0;
 const eyes=[],rings=[];model.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=true;if(/Pupil|EyeWhite/.test(o.name))eyes.push({o,p:o.position.clone(),s:o.scale.clone(),pupil:/Pupil/.test(o.name),radius:(o.geometry.boundingSphere||(o.geometry.computeBoundingSphere(),o.geometry.boundingSphere)).radius});if(/ring|orbital/i.test(o.name))rings.push({o,r:o.rotation.clone()});});
 const previous=new T.Vector3(),look=new T.Vector3();let initialized=false,lookAtPlayer=false;
 function idle(t){
  if(reducedMotion)return anchor.clone();
  // Settling pause, then curious slow drift around the pot's front perimeter.
  const settle=smooth((t-2)/4),a=t*.27+index*2.1;
  return anchor.clone().add(new T.Vector3(Math.sin(a)*.09*settle,Math.sin(t*.7+index)*.065*settle,Math.sin(a*.7)*.10*settle));
 }
 function dodge(t){
  interactions++;const rapid=t-lastTap<.42;lastTap=t;kick=Math.min(1,kick+(rapid?.6:.3));
  const start=root.position.clone();detourDuration=reducedMotion?3.5:interactions%3===0?5:2.8;detourAt=t;
  const side=interactions%2? -1:1;
  const swing=reducedMotion?.10:.23;
  detour=curve([start.toArray(),[anchor.x+side*swing,anchor.y+.20,front+.18],[anchor.x-side*swing*.5,anchor.y+.32,front+.28],idle(t+detourDuration).toArray()]);

 }
 function update(s,config,dt,player,camera,attention=false){
  const t=s.age/1000,visit=(s.age-config.arrival)/1000;
  if(s.phase==='arriving'){
   const u=smooth(s.age/config.arrival);root.position.copy(arrival.getPoint(u));root.scale.setScalar(count===1?.24+.76*u:.06+.94*u);
  }else if(s.phase==='visiting'){
   root.scale.setScalar(1);
   if(detour&&visit-detourAt<detourDuration)root.position.copy(detour.getPoint(smooth((visit-detourAt)/detourDuration)));
   else {detour=null;root.position.copy(idle(visit));}
  }else if(s.phase==='leaving'){
   if(!departure){departFrom=root.position.clone();departure=curve([departFrom.toArray(),[departFrom.x+.2,departFrom.y+.4,front+.2],[laneX,safeY+.8+index*.6,front],[laneX+1,safeY+1+index*.6,-5],[6+entry+index*1.4,8+index*.8,-16]]);}
   const u=smooth((s.age-config.arrival-config.stay)/config.departure);root.position.copy(departure.getPoint(u));root.scale.setScalar(1-.9995*u);
  }
  const velocity=initialized?root.position.clone().sub(previous).divideScalar(Math.max(.016,dt)):new T.Vector3();previous.copy(root.position);initialized=true;
  kick*=Math.exp(-dt*2.8);const reaction=reducedMotion?0:kick;
  const bank=reducedMotion?0:clamp(-velocity.x*.09,-.16,.16)+Math.sin(t*2)*reaction*.08;
  root.rotation.z=T.MathUtils.lerp(root.rotation.z,bank,1-Math.exp(-dt*4));
  const turn=s.phase==='visiting'&&!player?clamp(-root.position.x*.34,-.40,.40):0;
  root.rotation.y=T.MathUtils.lerp(root.rotation.y,turn+clamp(velocity.x*.1,-.20,.20)+(reducedMotion?0:Math.sin(t*.35+index)*.04),1-Math.exp(-dt*3));
  root.rotation.x=T.MathUtils.lerp(root.rotation.x,attention&&!player&&!reducedMotion?Math.sin(t*1.1)*.055:0,1-Math.exp(-dt*3));
  for(const ring of rings){ring.o.rotation.copy(ring.r);ring.o.rotation.x+=reaction*Math.sin(t*9)*.07;}
  lookAtPlayer=player||(s.phase==='visiting'&&visit<2.8)||(s.phase==='leaving'&&s.age-config.arrival-config.stay<2200);
  root.updateMatrixWorld(true);look.copy(lookAtPlayer?camera.position:new T.Vector3(0,potHeight*.78,.8));
  for(const e of eyes){e.o.position.copy(e.p);e.o.scale.copy(e.s);if(e.pupil){const target=e.o.parent.worldToLocal(look.clone()),delta=target.sub(e.p);const norm=Math.max(.4,Math.abs(delta.z));const amplitude=Math.max(.012,e.radius*.42);e.o.position.x+=clamp(delta.x/norm,-1,1)*amplitude;e.o.position.y+=clamp(delta.y/norm,-1,1)*amplitude;}
   const blink=(t+index*.9)%7.4;if(!reducedMotion&&blink>6.8&&blink<7)e.o.scale.y*=1-.8*Math.sin((blink-6.8)*Math.PI/.2);}

 }
 return {root,radius,update,dodge,getState:()=>({position:root.position.toArray(),radius,scale:root.scale.x,interactions,lookAtPlayer,reacting:kick>.1})};
}

export function separateTravelers(travelers,obstacle){
  // Separate conservative body spheres, including rings, after path evaluation.
  for(let pass=0;pass<4;pass++)for(let i=0;i<travelers.length;i++)for(let j=i+1;j<travelers.length;j++){
   const a=travelers[i],b=travelers[j],d=b.root.position.clone().sub(a.root.position),dist=d.length(),minimum=(a.radius*a.root.scale.x+b.radius*b.root.scale.x)+.12;
   if(dist<minimum){d.normalize();if(!dist)d.set(1,0,0);const push=(minimum-dist)/2;a.root.position.addScaledVector(d,-push);b.root.position.addScaledVector(d,push);}
  }
  for(const t of travelers){const box=obstacle.clone().expandByScalar(t.radius*t.root.scale.x+.12);if(box.containsPoint(t.root.position))t.root.position.z=box.max.z;}
}
