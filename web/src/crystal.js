import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {canGlow,nightAmount} from './crystal-state.js';
import {crystalPulse} from './crystal-hold.js';
import {crystalReflections} from './crystal-reflections.js';
const COLORS={Lagoon:'#009fc7',Amethyst:'#8229e6',Rose:'#f28eaf',Honey:'#efb353',Jade:'#63d7a0',Ruby:'#ff494b',Citrine:'#f3dc56',Quartz:'#e3f3ff'};
export const FREE_CRYSTALS=['Lagoon','Amethyst','Ruby'];
const BIRTH=[10,17,25,34];
function glowMap(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'white');g.addColorStop(.25,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
export function createCrystal({reducedMotion=false,renderer}={}){
 const root=new T.Group();root.name='CrystalGarden';let days=0,mode='full',seats=null;const clusters=[],map=glowMap(),reflections=crystalReflections(renderer);
 function setDays(value){days=Math.max(0,Math.min(45,Math.floor(Number(value)||0)));root.visible=days>=10;
  for(const c of clusters){c.root.visible=days>=10&&(mode==='full'||FREE_CRYSTALS.includes(c.id));
   const p=Math.max(0,(days-10)/35),size=.20+.80*p;c.root.scale.setScalar(size);
   c.root.position.copy(c.position);if(mode==='free'){const i=FREE_CRYSTALS.indexOf(c.id);if(i>=0)c.root.position.set([-1.75,1.8,3.3][i],-.045,[.5,.35,.15][i]);}
   c.meshes.forEach((m,i)=>{m.visible=days>=BIRTH[i];m.scale.setScalar(.55+.45*Math.max(0,(days-BIRTH[i])/(45-BIRTH[i])));});
   if(!c.root.visible)c.at=-Infinity;
  }if(seats)seats.visible=mode==='full'&&days===45;
 }
 const ready=(async()=>{
  const loader=new GLTFLoader(),g=await loader.loadAsync(new URL('../public/assets/models/crystal-garden-v08/garden.glb',import.meta.url).href);g.scene.updateMatrixWorld(true);
  for(const id of Object.keys(COLORS)){
   const crown=g.scene.getObjectByName(id+'_Crown'),origin=crown.getWorldPosition(new T.Vector3()),group=new T.Group();group.name='Crystal_'+id;root.add(group);
   const buckets=[[],[],[],[]];g.scene.traverse(o=>{if(!o.isMesh)return;let named=o;while(named.parent&&named.userData.cluster!==id)named=named.parent;if(named.userData.cluster!==id||named.name.includes('_Core'))return;
    const name=named.name,index=Number(name.match(/(\d+)$/)?.[1]||0),stage=name.includes('Crown')?0:name.includes('Satellite')?Math.min(3,1+Math.floor(index/3)):Math.min(3,Math.floor(index/5));
    const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);geo.translate(-origin.x,-origin.y,-origin.z);const color=o.material.color.clone().lerp(new T.Color(1,1,1),.07);geo.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:geo.attributes.position.count},()=>color.toArray()).flat(),3));for(const key of Object.keys(geo.attributes))if(!['position','normal','color'].includes(key))geo.deleteAttribute(key);buckets[stage].push(geo);
   });
   const material=new T.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,flatShading:true,roughness:.13,metalness:0,transmission:.38,thickness:1.15,ior:1.5,clearcoat:1,clearcoatRoughness:.055,envMap:reflections.texture,envMapIntensity:1.7,attenuationColor:new T.Color(COLORS[id]).lerp(new T.Color(1,1,1),.28),attenuationDistance:1.1,emissive:COLORS[id],emissiveIntensity:.008});
   const meshes=buckets.map((list,i)=>{const geometry=mergeGeometries(list);list.forEach(g=>g.dispose());const m=new T.Mesh(geometry,material);m.name=id+'_growth_'+i;m.userData.crystalId=id;m.castShadow=false;m.receiveShadow=true;group.add(m);return m;});
   const sourceCore=g.scene.getObjectByName(id+'_Core'),coreGeometry=sourceCore.geometry.clone();coreGeometry.applyMatrix4(sourceCore.matrixWorld);coreGeometry.translate(-origin.x,-origin.y,-origin.z);coreGeometry.scale(.62,.78,.62);
   const coreMaterial=new T.MeshPhysicalMaterial({color:COLORS[id],roughness:.28,emissive:COLORS[id],emissiveIntensity:.45,envMap:reflections.texture,envMapIntensity:.2});
   const core=new T.Mesh(coreGeometry,coreMaterial);core.name=id+'_LuminousHeart';group.add(core);
   const halo=new T.Sprite(new T.SpriteMaterial({map,color:COLORS[id],transparent:true,opacity:.07,depthWrite:false,blending:T.AdditiveBlending}));halo.position.y=.5;halo.scale.set(1.4,1.8,1);group.add(halo);
   clusters.push({id,root:group,position:new T.Vector3(origin.x,-.045,origin.z),meshes,material,core,halo,at:-Infinity,pulse:0});
  }
  g.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
  // Seats are a separate Day-45 layer. Fit their depth to the actual tabletop;
  // Blender's review floor extends beyond the game's physical wall/table.
  const sg=await loader.loadAsync(new URL('../public/assets/models/crystal-garden-v08/day45-seats.glb',import.meta.url).href);seats=sg.scene;seats.name='Day45 crystal seating';
  const positions={1:[-5.4,1.6],2:[-4.6,-.6],3:[-2.8,2.1],4:[2.7,2.1],5:[4.8,-.6],6:[6.5,1.3],7:[7.8,-.6]};
  for(const o of seats.children){const id=o.userData.seat_id;if(!id)continue;o.position.x=positions[id][0];o.position.z=positions[id][1];}
  seats.updateMatrixWorld(true);
  for(const node of seats.children){if(!node.isGroup||!node.userData.seat_id)continue;const pieces=[],inverse=node.matrixWorld.clone().invert();let first;
   node.traverse(o=>{if(!o.isMesh)return;first??=o.material;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld).applyMatrix4(inverse);geo.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:geo.attributes.position.count},()=>o.material.color.toArray()).flat(),3));for(const key of Object.keys(geo.attributes))if(!['position','normal','color'].includes(key))geo.deleteAttribute(key);pieces.push(geo);});
   if(!pieces.length)continue;const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());const material=first.clone();material.color.set(0xffffff);material.vertexColors=true;node.traverse(o=>{if(o.isMesh){o.geometry.dispose();}});node.clear();node.add(new T.Mesh(geometry,material));
  }
  seats.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.emissiveIntensity>.5)m.emissiveIntensity=.18;}});root.add(seats);setDays(days);
 })();
 function trigger(id,save,time,date=new Date()){if(!canGlow(save,date))return false;const c=clusters.find(c=>c.id===id&&c.root.visible);if(!c)return false;c.at=time;return true;}
 function update(time,{eligible=true,darkness=nightAmount()}={}){for(const c of clusters){if(!eligible)c.at=-Infinity;c.pulse=crystalPulse(time-c.at);c.material.emissiveIntensity=.006+darkness*.009+c.pulse*.255;c.material.envMapIntensity=1.7*(1-darkness)+.045*darkness;c.core.material.emissiveIntensity=.45+darkness*.4+c.pulse*12;c.core.material.envMapIntensity=.2*(1-darkness);c.halo.material.opacity=.012+darkness*.023+c.pulse*.72;}}
 const visible=()=>clusters.filter(c=>c.root.visible);
 return {root,ready,setDays,setMode(value){mode=value==='free'?'free':'full';setDays(days);},trigger,update,
  targets:()=>visible().flatMap(c=>c.meshes.filter(m=>m.visible)),getTapPositions:()=>visible().map(c=>c.root.localToWorld(new T.Vector3(0,.55,0))),getTapPosition:()=>visible()[0]?.root.localToWorld(new T.Vector3(0,.55,0))||new T.Vector3(),
  getIds:()=>visible().map(c=>c.id),getState:()=>({days,mode,visible:root.visible,clusters:visible().length,seats:!!seats?.visible,glow:Math.max(0,...clusters.map(c=>c.pulse)),details:visible().map(c=>({id:c.id,pulse:c.pulse,stages:c.meshes.filter(m=>m.visible).length,scale:c.root.scale.x})),shards:visible().reduce((n,c)=>n+c.meshes.filter(m=>m.visible).length,0)}),
  dispose(){reflections.dispose();map.dispose();root.traverse(o=>{if(o.isMesh||o.isSprite){o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
 };
}
