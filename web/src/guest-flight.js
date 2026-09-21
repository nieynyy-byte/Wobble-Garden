import * as T from 'three';
const clamp=T.MathUtils.clamp;
const smooth=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
const curve=points=>new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
export function createTraveler(model,{index=0,count=1,potHeight=2,potWidth=2,reducedMotion=false,entry=0}={}){
 const root=new T.Group();root.add(model);
 const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
 model.scale.setScalar(Math.min(potHeight*(count===1?.5:.33)/size.y,potWidth*(count===1?.60:.40)/size.x));
 const center=new T.Box3().setFromObject(model).getCenter(new T.Vector3());model.position.sub(center);
 const anchor=new T.Vector3(count===1?.58:(index-1)*.72,potHeight+1.0+(index===1&&count>1?.63:0),1.8);
 const approach=[[5+entry+index*.7,7+index*.8,-16],[3+entry,6.2+index*.5,-10],[1.4+index*.2,4.8+index*.4,-4.7],[.25+index*.3,anchor.y+.5,-.3]];
 if(count>1&&!reducedMotion)for(let j=0;j<5;j++){const a=-.8+j*Math.PI/2+index*Math.PI*2/3;approach.push([.72*Math.cos(a),potHeight+1.6+.38*Math.sin(a),1.5+.28*Math.sin(a)]);}
 approach.push(anchor.toArray());const arrival=curve(approach);
 let departure,departFrom,detour=null,detourAt=0,detourDuration=3,interactions=0,lastTap=-Infinity,kick=0;
 const eyes=[],rings=[];model.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=true;if(/Pupil|EyeWhite/.test(o.name))eyes.push({o,p:o.position.clone(),s:o.scale.clone(),pupil:/Pupil/.test(o.name)});if(/ring|orbital/i.test(o.name))rings.push({o,r:o.rotation.clone()});});
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
  if(interactions%3===0&&!reducedMotion){
   detour=curve([start.toArray(),[side*.70,anchor.y+.35,2.0],[0,anchor.y+1,1.7],[-side*.70,anchor.y+.25,2.0],idle(t+detourDuration).toArray()]);
  }else detour=curve([start.toArray(),[clamp(start.x+side*.35,-.75,.75),start.y+.24,2.05],[clamp(anchor.x+side*.45,-.75,.75),anchor.y+.14,2.0],idle(t+detourDuration).toArray()]);
 }
 function update(s,config,dt,player,camera){
  const t=s.age/1000,visit=(s.age-config.arrival)/1000;
  if(s.phase==='arriving'){
   const u=smooth(s.age/config.arrival);root.position.copy(arrival.getPoint(u));root.scale.setScalar(.06+.94*smooth(s.age/config.arrival));
  }else if(s.phase==='visiting'){
   root.scale.setScalar(1);
   if(detour&&visit-detourAt<detourDuration)root.position.copy(detour.getPoint(smooth((visit-detourAt)/detourDuration)));
   else {detour=null;root.position.copy(idle(visit));}
  }else if(s.phase==='leaving'){
   if(!departure){departFrom=root.position.clone();departure=curve([departFrom.toArray(),[departFrom.x-.3,departFrom.y+.48,1.65],[.5,anchor.y+.8,-.1],[2.5,5.5,-5],[6+entry+index*.6,8+index*.4,-16]]);}
   const u=smooth((s.age-config.arrival-config.stay)/config.departure);root.position.copy(departure.getPoint(u));root.scale.setScalar(1-.9995*u);
  }
  const velocity=initialized?root.position.clone().sub(previous).divideScalar(Math.max(.016,dt)):new T.Vector3();previous.copy(root.position);initialized=true;
  kick*=Math.exp(-dt*2.8);const reaction=reducedMotion?0:kick;
  const bank=reducedMotion?0:clamp(-velocity.x*.09,-.16,.16)+Math.sin(t*2)*reaction*.08;
  root.rotation.z=T.MathUtils.lerp(root.rotation.z,bank,1-Math.exp(-dt*4));
  root.rotation.y=T.MathUtils.lerp(root.rotation.y,clamp(velocity.x*.1,-.28,.28)+(reducedMotion?0:Math.sin(t*.35+index)*.06),1-Math.exp(-dt*3));
  for(const ring of rings){ring.o.rotation.copy(ring.r);ring.o.rotation.x+=reaction*Math.sin(t*9)*.07;}
  lookAtPlayer=player||(s.phase==='visiting'&&visit<2.8)||(s.phase==='leaving'&&s.age-config.arrival-config.stay<2200);
  root.updateMatrixWorld(true);look.copy(lookAtPlayer?camera.position:new T.Vector3(0,potHeight*(Math.floor(t/9+index)%3===1?1.4:.8),0));model.worldToLocal(look);
  for(const e of eyes){e.o.position.copy(e.p);e.o.scale.copy(e.s);if(e.pupil){const dx=clamp(look.x-e.p.x,-1,1),dy=clamp(look.y-e.p.y,-1,1);e.o.position.x+=dx*.014;e.o.position.y+=dy*.014;}const blink=(t+index*.9)%7.4;if(!reducedMotion&&blink>6.8&&blink<7)e.o.scale.y*=1-.8*Math.sin((blink-6.8)*Math.PI/.2);}
 }
 return {root,update,dodge,getState:()=>({position:root.position.toArray(),scale:root.scale.x,interactions,lookAtPlayer,reacting:kick>.1})};
}
