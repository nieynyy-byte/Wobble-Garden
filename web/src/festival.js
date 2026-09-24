import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
export async function createFestival({scene,renderer,reducedMotion=false,tier='owner'}){
 const root=new T.Group();root.name='Day45 festival review';scene.add(root);const loader=new GLTFLoader(),friends=[],drones=[];
 async function character(path,x,y,z,width){const m=(await loader.loadAsync(new URL('../public/assets/models/characters/'+path,import.meta.url).href)).scene;let b=new T.Box3().setFromObject(m),s=b.getSize(new T.Vector3());m.scale.setScalar(Math.min(width/s.x,1.3/s.y));b=new T.Box3().setFromObject(m);const center=b.getCenter(new T.Vector3());m.position.set(-center.x,-b.min.y,-center.z);const g=new T.Group();g.add(m);g.position.set(x,y,z);root.add(g);m.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});return g;}
 const seats=scene.getObjectByName('Day45 crystal seating');if(seats){for(const seat of seats.children){if(Math.abs(seat.position.x-2.7)<.1){seat.position.x=4.0;seat.position.z=1.0;}}seats.updateMatrixWorld(true);}
 const dj=await character('wobble-dj-v01.glb',2.1,2.7,-1.15,1.8);dj.scale.setScalar(1.4);
 const boothLight=new T.PointLight('#ff36b5',5,6,2);boothLight.position.set(0,.22,.35);dj.add(boothLight);
 const strip=new T.Mesh(new T.TorusGeometry(.52,.035,6,40),new T.MeshBasicMaterial({color:'#ff36b5'}));strip.rotation.x=Math.PI/2;strip.scale.x=1.45;strip.position.y=.05;dj.add(strip);
 if(seats)seats.traverse(o=>{if(!o.isMesh)return;const m=o.material.clone();o.material=m;m.emissive.copy(m.color).lerp(new T.Color('#a67aff'),.20);m.emissiveIntensity=.28;m.roughness=.12;if(m.vertexColors){m.color.set('white');m.emissive.set('white');m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor.rgb;\n#endif');};m.needsUpdate=true;}});
 const saturn=await character('logo-friends-v02/img-9978.glb',.8,4.5,1,1.2);

 const places=[['v04','9941',-3.8,0,1.8],['v05','9960',-.95,0,2.0],['v04','9990',.7,0,2.3],['v04','9944',-4.6,.85,-.6],['v04','9952',4.8,.85,-.6],['v04','9955',-2.8,1.15,2.1],['v04','9988',6.5,.65,1.3],['v04','9945',-5.8,0,1.8],['v04','9947',-1.9,0,2.1],['v04','9953',4.6,0,2.1],['v04','9959',7.6,0,1.8],['v04','9962',-4.5,0,2.5],['v04','9950',-5.6,1.6,-.3],['v04','9970',5.8,1.7,-.2],['v04','9983',7.7,1.4,1.1],['v04','9986',-3.3,2.8,.7]];
 const occupiedSeats=new Set();const activePlaces=tier==='free'?places.slice(0,8):places;
 for(const [v,id,x,y,z] of activePlaces){const g=await character(`logo-friends-${v}/img-${id}.glb`,x,y,z,1.0);if(y>0&&y<1.3&&seats){const nearby=seats.children.filter(o=>o.userData.seat_id&&o.visible&&!occupiedSeats.has(o)).sort((a,b)=>Math.abs(a.position.x-x)-Math.abs(b.position.x-x))[0];if(nearby){occupiedSeats.add(nearby);const box=new T.Box3().setFromObject(nearby);g.position.y=box.max.y+.03;g.position.x=nearby.position.x;g.position.z=nearby.position.z;}}if(friends.length===7)g.position.y+=1.0;friends.push({g,base:g.position.clone(),hover:y>=1.3||friends.length===7,phase:friends.length*1.7});}
 // Remaining guests are preloaded, then enter/leave visibly rather than popping in.
 const reserve=[];for(const id of (tier==='free'?['9950','9970','9983','9986']:['9972'])){const g=await character(`logo-friends-v04/img-${id}.glb`,0,0,0,1);g.visible=false;reserve.push(g);}
 const all=[...friends.map(f=>f.g),saturn,dj],greetings=new Map();let lastTap=null,clock=0,last=0,nextMove=25,nextVisitor=110,travel=null,exchange=null,reserveIndex=0,turn=0;
 const spare=new T.Vector3(5.7,1.0,2.3);
 // Pivot a complete authored arm and hand about the shoulder.
 let arm,hand,wave;dj.traverse(o=>{if(/Right[ _]curved[ _]arm/.test(o.name))arm=o;if(/Right[ _]rounded[ _]hand/.test(o.name))hand=o;});
 if(arm&&hand){const parent=arm.parent;parent.updateWorldMatrix(true,true);arm.geometry.computeBoundingBox();const bb=arm.geometry.boundingBox;const shoulder=new T.Vector3((bb.min.x+bb.max.x)/2,bb.max.y, (bb.min.z+bb.max.z)/2).applyMatrix4(arm.matrixWorld);parent.worldToLocal(shoulder);wave=new T.Group();wave.position.copy(shoulder);parent.add(wave);parent.updateWorldMatrix(true,true);wave.attach(arm);wave.attach(hand);}
 function angleToward(g,target,dt){const desired=Math.atan2(target.x-g.position.x,target.z-g.position.z);let delta=T.MathUtils.euclideanModulo(desired-g.rotation.y+Math.PI,Math.PI*2)-Math.PI;g.rotation.y+=delta*(1-Math.exp(-dt*2.2));}
 function flight(a,b,u){const h=Math.max(a.y,b.y)+.6;const path=new T.CatmullRomCurve3([a,new T.Vector3(a.x*.92,h,3.5),new T.Vector3(b.x*.92,h+.15,3.5),b],false,'centripetal');return path.getPoint(T.MathUtils.smootherstep(u,0,1));}

 const bodyMat=new T.MeshStandardMaterial({color:'#b9cec7',metalness:.4,roughness:.3});
 const colors=['#ff259f','#26cfff','#8549ff'];
 for(let i=0;i<3;i++){const d=new T.Group(),body=new T.Mesh(new T.SphereGeometry(.38,24,16),bodyMat);body.scale.set(1.45,.85,1);d.add(body);const ring=new T.Mesh(new T.TorusGeometry(.40,.045,6,24),new T.MeshBasicMaterial({color:colors[i]}));ring.rotation.x=Math.PI/2;ring.scale.x=1.4;d.add(ring);
 for(const x of [-.09,.09]){const eye=new T.Mesh(new T.SphereGeometry(.065,10,8),new T.MeshBasicMaterial({color:'white'}));eye.position.set(x,.08,.34);d.add(eye);const pupil=new T.Mesh(new T.SphereGeometry(.032,8,6),new T.MeshBasicMaterial({color:'#17252c'}));pupil.position.set(x,.08,.40);d.add(pupil);}
 const fill=null;
 const light=new T.SpotLight(colors[i],14,13,.40,.85,1.5);light.castShadow=false;light.position.y=-.08;d.add(light);const target=new T.Object3D();target.position.set((i-1)*3,0,1);root.add(target);light.target=target;
 const beam=new T.Mesh(new T.ConeGeometry(1.15,4.2,20,1,true),new T.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.035,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));beam.position.y=-2.1;root.add(beam);d.position.set((i-1)*3.4,5.5+(i%2)*.5,.6);root.add(d);drones.push({d,target,beam,light,fill,ring,body,base:d.position.clone(),i});}
 // No second scene render: the event runs entirely in the main camera pass.
 const color=new T.Color(),beamDirection=new T.Vector3(),up=new T.Vector3(0,1,0);
 return {root,
 tap(ray,camera){const hits=ray.intersectObjects(all.filter(g=>g.visible),true);if(!hits.length){lastTap=null;return false;}let object=hits[0].object;while(object.parent&&!all.includes(object))object=object.parent;const now=performance.now();if(lastTap?.object===object&&now-lastTap.at<450){greetings.set(object,{until:clock+5,camera:camera.position.clone()});lastTap=null;return true;}lastTap={object,at:now};return false;},
 update(time,camera){clock=time;const dt=Math.min(.1,Math.max(.001,time-last));last=time;const t=reducedMotion?0:time;
 dj.position.y=2.7+Math.sin(t*.6)*.12;dj.rotation.z=Math.sin(t*1.4)*.015;boothLight.color.setHSL((t*.025+.85)%1,.9,.5);strip.material.color.copy(boothLight.color);
 const djHello=greetings.get(dj);angleToward(dj,djHello?.until>time?camera.position:new T.Vector3(0,1.5,1.8),dt);
 if(wave){const active=djHello?.until>time;const target=active?1.65+Math.sin(t*5)*.18:0;wave.rotation.z+=(target-wave.rotation.z)*(1-Math.exp(-dt*5));}
 saturn.position.set(.8+Math.sin(t*.18)*1.5,4.5+Math.sin(t*.4)*.22,.5+Math.cos(t*.18)*.35);angleToward(saturn,greetings.get(saturn)?.until>time?camera.position:dj.position,dt);
 if(!reducedMotion&&!travel&&!exchange&&time>nextMove){const f=friends[turn++%friends.length];if(!(greetings.get(f.g)?.until>time)){travel={f,from:f.base.clone(),to:spare.clone(),at:time};spare.copy(f.base);nextMove=time+32;}}
 if(travel){const u=Math.min(1,(time-travel.at)/12);travel.f.g.position.copy(flight(travel.from,travel.to,u));if(u===1){travel.f.base.copy(travel.to);travel=null;}}
 if(!reducedMotion&&!travel&&!exchange&&time>nextVisitor){const f=friends[(turn+3)%friends.length],incoming=reserve[reserveIndex%reserve.length];exchange={f,incoming,at:time,from:f.base.clone()};incoming.visible=false;incoming.position.set(1.1,6.5,-12);incoming.scale.setScalar(.2);all.push(incoming);nextVisitor=time+125;}
 if(exchange){const elapsed=time-exchange.at,u=Math.min(1,elapsed/14),arrival=T.MathUtils.clamp((elapsed-14)/14,0,1),{f,incoming,from}=exchange;f.g.visible=elapsed<14;incoming.visible=elapsed>=14;
 f.g.position.copy(flight(from,new T.Vector3(-1,6,-12),u));f.g.scale.setScalar(1-.8*u);
 incoming.position.copy(flight(new T.Vector3(1.1,6.5,-12),from,arrival));incoming.position.x+=Math.sin(Math.PI*arrival)*1.4;incoming.scale.setScalar(.2+.8*arrival);
 if(arrival===1){const old=f.g;old.visible=false;old.scale.setScalar(1);all.splice(all.indexOf(old),1);reserve[reserveIndex%reserve.length]=old;reserveIndex++;f.g=incoming;exchange=null;}}
 for(let i=0;i<friends.length;i++){const f=friends[i],hello=greetings.get(f.g),moving=travel?.f===f||exchange?.f===f;
 if(!moving)f.g.position.copy(f.base).add(f.hover?new T.Vector3(Math.sin(t*.18+f.phase)*.22,Math.sin(t*.24+f.phase)*.14,Math.cos(t*.16+f.phase)*.16):new T.Vector3(0,(.5+.5*Math.sin(t*.8+f.phase))*.06,0));
 const partner=friends.filter(other=>other!==f).reduce((best,other)=>other.g.position.distanceToSquared(f.g.position)<best.g.position.distanceToSquared(f.g.position)?other:best).g;
 const watchingDJ=Math.sin(t*.055+f.phase)>.72;angleToward(f.g,hello?.until>time?camera.position:watchingDJ?dj.position:partner.position,dt);
 f.g.rotation.z=Math.sin(t*.8+f.phase)*.025;
 }
 for(const {d,target,beam,light,ring,i}of drones){const angle=t*.07+i*Math.PI*2/3;d.position.set(.8+Math.cos(angle)*4.1,6.2+Math.sin(angle)*.4,Math.sin(angle)*1.7);color.setHSL((t*.018+i/3)%1,.95,.48);light.color.copy(color);ring.material.color.copy(color);beam.material.color.copy(color);
 // Outer audience and perches receive alternating coverage, including the darker edges.
 target.position.set([-4.9,1.1,6.2][i]+Math.sin(t*.17+i)*1.0,.65+Math.sin(t*.13+i)*.35,1.2);
 beamDirection.subVectors(d.position,target.position);const length=beamDirection.length();beam.position.copy(d.position).add(target.position).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(up,beamDirection.normalize());beam.scale.set(1,length/4.2,1);d.rotation.z=Math.sin(t*.3+i)*.035;
 }
 },getPositions:()=>all.filter(g=>g.visible).map(g=>({name:g===dj?'DJ':g===saturn?'Saturn':g.uuid,position:g.position.clone().add(new T.Vector3(0,.5,0))})),
 getState:()=>({tier,friends:friends.length,drones:drones.length,saturn:true,liveScreen:false,reserve:reserve.length,rotationCount:reserveIndex,seatMoves:turn,travel:!!travel,exchange:!!exchange,greetings:[...greetings.values()].filter(g=>g.until>clock).length,djGreeting:(greetings.get(dj)?.until||0)>clock,wave:wave?.rotation.z||0,dj:dj.position.toArray()})};
}
