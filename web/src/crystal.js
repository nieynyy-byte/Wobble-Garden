import * as T from 'three';
import {crystalGrowth,glowEnvelope,canGlow,nightAmount,GLOW_SECONDS} from './crystal-state.js';
// Original faceted quartz cluster inspired by the supplied reference. No bloom pass.
const specs=[
 [0,0,0,.105,.64,0,0,17],[-.13,0,.035,.07,.35,-.32,-.22,22],[.14,0,-.015,.075,.43,.24,.36,25],
 [-.035,0,.14,.065,.28,.2,-.15,28],[.09,0,.12,.047,.21,.28,.2,31],[-.19,0,-.04,.05,.23,-.36,.13,34],[.2,0,.07,.047,.25,.1,.38,37],[.01,0,-.12,.055,.32,-.13,.1,39]
];
function quartz(radius,height,seed){
 const points=[];for(let ring=0;ring<2;ring++)for(let i=0;i<6;i++){const a=i*Math.PI/3+.12;points.push(new T.Vector3(Math.cos(a)*radius*(ring?.92:1),ring?height*.72:0,Math.sin(a)*radius));}
 points.push(new T.Vector3(radius*.13,height,-radius*.12));const vertices=[],colors=[],palette=['#d7e5ed','#cbd9e8','#e8e1ed','#e4ece6','#d8e6e9','#ece6d9'];
 const tri=(a,b,c,face)=>{const color=new T.Color(palette[(face+seed)%6]);for(const n of [a,c,b]){vertices.push(...points[n].toArray());colors.push(...color.toArray());}};
 for(let i=0;i<6;i++){let j=(i+1)%6;tri(i,j,i+6,i);tri(j,j+6,i+6,i);tri(i+6,j+6,12,i);}for(let i=1;i<5;i++)tri(0,i+1,i,0);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
function glowTexture(){const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),a=Math.max(0,1-r);const i=(y*size+x)*4;data[i]=220;data[i+1]=236;data[i+2]=255;data[i+3]=Math.round(a*a*a*255);}const t=new T.DataTexture(data,size,size);t.needsUpdate=true;t.magFilter=T.LinearFilter;return t;}
function createCluster({reducedMotion=false,matureScale=1,position=[0,0,0]}={}){
 const root=new T.Group();root.name='CrystalCluster';root.position.set(...position);
 const material=new T.MeshPhysicalMaterial({color:'#f2f6ff',vertexColors:true,roughness:.065,metalness:0,envMapIntensity:1.7,iridescence:.22,iridescenceIOR:1.3,clearcoat:1,clearcoatRoughness:.1,transparent:true,opacity:.60,emissive:'#b7dfff',emissiveIntensity:0,depthWrite:true});
 const shards=specs.map((s,i)=>{const pivot=new T.Group();pivot.position.set(s[0],s[1],s[2]);pivot.rotation.set(s[5],0,s[6]);const mesh=new T.Mesh(quartz(s[3],s[4],i),material);mesh.name='Quartz_'+i;mesh.castShadow=mesh.receiveShadow=true;pivot.add(mesh);root.add(pivot);return {pivot,mesh,born:s[7]};});
 const texture=glowTexture(),halo=new T.Sprite(new T.SpriteMaterial({map:texture,color:'#c1ddff',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));halo.position.set(0,.3,0);halo.scale.set(.9,1.15,1);root.add(halo);
 const particleGeo=new T.BufferGeometry(),coords=new Float32Array(9*3);particleGeo.setAttribute('position',new T.BufferAttribute(coords,3));const particles=new T.Points(particleGeo,new T.PointsMaterial({map:texture,color:'#e5edff',size:.026,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));root.add(particles);
 const light=new T.PointLight('#c1dcff',0,1.5,2);light.position.set(0,.23,.03);root.add(light);
 let days=-1,triggerAt=-Infinity,level=0,night=0;
 function setDays(value){if(value===days)return;days=value;const growth=crystalGrowth(days);root.visible=growth.visible;const size=1+(matureScale-1)*growth.progress**2;root.scale.set(size*.62,size,size*.62);for(const s of shards){s.pivot.visible=growth.visible&&days>=s.born;const p=Math.min(1,Math.max(0,(days-s.born)/(45-s.born)));s.pivot.scale.set(.52+.48*p,.17+.83*p,.52+.48*p);}if(!root.visible)triggerAt=-Infinity;}
 function tap(save,time,date=new Date()){if(!root.visible||!canGlow(save,date)||time-triggerAt<GLOW_SECONDS)return false;triggerAt=time;return true;}
 function update(time,{eligible=true,darkness=nightAmount()}={}){if(!eligible)triggerAt=-Infinity;night=darkness;level=glowEnvelope(time-triggerAt);material.emissiveIntensity=level*(.65+night*1.25);halo.material.opacity=level*(.16+night*.27);halo.visible=level>0;particles.visible=level>0&&!reducedMotion;particles.material.opacity=level*(.28+night*.32);light.intensity=level*(.08+night*.2);for(let i=0;i<9;i++){const phase=(time*.12+i*.618)%1,angle=i*2.4;coords[i*3]=Math.sin(angle)*(.16+phase*.15);coords[i*3+1]=.1+phase*.68;coords[i*3+2]=Math.cos(angle)*.17;}particleGeo.attributes.position.needsUpdate=true;}
 const targets=()=>shards.filter(s=>s.pivot.visible).map(s=>s.mesh);
 return {root,setDays,tap,update,targets,getState:()=>({days,visible:root.visible,shards:targets().length,glow:level,night,emissiveIntensity:material.emissiveIntensity,haloOpacity:halo.material.opacity}),getTapPosition:()=>root.localToWorld(new T.Vector3(0,.055+.245*crystalGrowth(days).progress,0)),dispose:()=>{shards.forEach(s=>s.mesh.geometry.dispose());material.dispose();texture.dispose();halo.material.dispose();particleGeo.dispose();particles.material.dispose();}};
}

export function createCrystal({reducedMotion=false}={}){
 const root=new T.Group();root.name='CrystalGarden';
 const primary=createCluster({reducedMotion,matureScale:2.4,position:[1.08,-.045,1.35]});
 const companion=createCluster({reducedMotion,matureScale:1.95,position:[-1.08,-.045,1.30]});
 companion.root.rotation.y=.65;root.add(primary.root,companion.root);let days=0;
 const clusters=[primary,companion];
 return {root,setDays(value){days=value;primary.setDays(value);companion.setDays(value<25?0:Math.min(45,17+(value-25)*28/20));root.visible=primary.root.visible;},
 tap(save,time,date=new Date()){if(!canGlow(save,date))return false;const a=primary.tap(save,time,date),b=companion.tap(save,time,date);return a||b;},
 update(time,options){clusters.forEach(c=>c.update(time,options));},targets:()=>clusters.flatMap(c=>c.targets()),
 getTapPosition:()=>primary.getTapPosition(),getTapPositions:()=>clusters.filter(c=>c.root.visible).map(c=>c.getTapPosition()),
 getState:()=>({...primary.getState(),days,shards:clusters.reduce((n,c)=>n+c.getState().shards,0),clusters:clusters.filter(c=>c.root.visible).length,primaryHeight:.64*primary.root.scale.y,companionHeight:.64*companion.root.scale.y}),
 dispose:()=>clusters.forEach(c=>c.dispose())};
}
