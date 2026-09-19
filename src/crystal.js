import * as T from 'three';
import {crystalGrowth,glowEnvelope,canGlow,nightAmount,GLOW_SECONDS,crystalLight} from './crystal-state.js';
// Original faceted quartz cluster inspired by the supplied reference. No bloom pass.
const specs=[
 [0,0,0,.105,.64,0,0,10],[-.13,0,.035,.07,.35,-.32,-.22,14],[.14,0,-.015,.075,.43,.24,.36,17],
 [-.035,0,.14,.065,.28,.2,-.15,22],[.09,0,.12,.047,.21,.28,.2,25],[-.19,0,-.04,.05,.23,-.36,.13,29],[.2,0,.07,.047,.25,.1,.38,32],[.01,0,-.12,.055,.32,-.13,.1,34]
];
function quartz(radius,height,seed){
 const points=[],vertices=[],colors=[],palette=['#badbd7','#c0cde9','#dfcfe9','#d7e8db','#c1e3e5','#ece0c5'];
 // Four cut rings soften the pointed-quartz silhouette into an asymmetric jewel.
 for(let ring=0;ring<4;ring++)for(let i=0;i<6;i++){
  const a=i*Math.PI/3+.12, width=[.84,1.12,.96,.22][ring],y=[0,.16,.72,1][ring];
  points.push(new T.Vector3(Math.cos(a)*radius*width*(1+.045*Math.sin(i*2.3+seed))+radius*.13*y,height*y+(ring===2?height*.025*Math.sin(i+seed):0),Math.sin(a)*radius*width-radius*.12*y));
 }
 const tri=(a,b,c,face)=>{const color=new T.Color(palette[(face+seed)%6]);for(const n of [a,c,b]){vertices.push(...points[n].toArray());colors.push(...color.toArray());}};
 for(let ring=0;ring<3;ring++)for(let i=0;i<6;i++){const j=(i+1)%6,a=ring*6,b=a+6;tri(a+i,a+j,b+i,i);tri(a+j,b+j,b+i,i);}
 for(let i=1;i<5;i++){tri(0,i+1,i,0);tri(18,18+i,19+i,2);}

 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('jewelLocal',new T.Float32BufferAttribute(vertices.map((v,i)=>v/(i%3===1?height:radius)),3));g.computeVertexNormals();return g;
}
function glowTexture(){const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),a=Math.max(0,1-r);const i=(y*size+x)*4;data[i]=220;data[i+1]=236;data[i+2]=255;data[i+3]=Math.round(a*a*a*255);}const t=new T.DataTexture(data,size,size);t.needsUpdate=true;t.magFilter=T.LinearFilter;return t;}
function createCluster({reducedMotion=false,matureScale=1,position=[0,0,0]}={}){
 const root=new T.Group();root.name='CrystalCluster';root.position.set(...position);
 const material=new T.MeshPhysicalMaterial({color:'#f1f8f4',vertexColors:true,roughness:.065,metalness:0,envMapIntensity:1.7,iridescence:.12,iridescenceIOR:1.3,clearcoat:1,clearcoatRoughness:.1,transmission:.38,thickness:.16,ior:1.46,attenuationColor:'#92c8bf',attenuationDistance:.9,transparent:true,opacity:.92,emissive:'#b7dfff',emissiveIntensity:0,depthWrite:true});
 // A localized core gives depth instead of making every facet uniformly emissive.
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec3 jewelLocal; varying vec3 vJewelLocal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvJewelLocal=jewelLocal;');
  shader.fragmentShader='varying vec3 vJewelLocal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat core=exp(-dot(vJewelLocal.xz,vJewelLocal.xz)*2.4)*sin(clamp(vJewelLocal.y,0.0,1.0)*3.14159);\ntotalEmissiveRadiance *= 0.28+core*1.9;');
 };
 material.customProgramCacheKey=()=> 'wobble-jewel-core-v03';
 const shards=specs.map((s,i)=>{const pivot=new T.Group();pivot.position.set(s[0],s[1],s[2]);pivot.rotation.set(s[5],0,s[6]);const mesh=new T.Mesh(quartz(s[3],s[4],i),material);mesh.name='Quartz_'+i;mesh.castShadow=mesh.receiveShadow=true;pivot.add(mesh);root.add(pivot);return {pivot,mesh,born:s[7]};});
 const texture=glowTexture(),halo=new T.Sprite(new T.SpriteMaterial({map:texture,color:'#c1ddff',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));halo.position.set(0,.3,0);halo.scale.set(.9,1.15,1);root.add(halo);
 const cores=shards.map((s,i)=>{const core=new T.Sprite(new T.SpriteMaterial({map:texture,color:i%3===0?'#e6f5dc':'#c9e9ef',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));core.position.y=specs[i][4]*.43;core.scale.set(specs[i][3]*1.15,specs[i][4]*.58,1);s.pivot.add(core);return core;});
 const particleGeo=new T.BufferGeometry(),coords=new Float32Array(9*3);particleGeo.setAttribute('position',new T.BufferAttribute(coords,3));const particles=new T.Points(particleGeo,new T.PointsMaterial({map:texture,color:'#e5edff',size:.026,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));root.add(particles);
 const light=new T.PointLight('#c1dcff',0,1.5,2);light.position.set(0,.23,.03);root.add(light);
 let days=-1,triggerAt=-Infinity,level=0,night=0,idle=0;
 function setDays(value){if(value===days)return;days=value;const growth=crystalGrowth(days);root.visible=growth.visible;const size=1+(matureScale-1)*growth.progress**2;root.scale.set(size*.62,size,size*.62);for(const s of shards){s.pivot.visible=growth.visible&&days>=s.born;const p=Math.min(1,Math.max(0,(days-s.born)/(45-s.born)));s.pivot.scale.set(.57+.43*p,.29+.71*p,.57+.43*p);}if(!root.visible)triggerAt=-Infinity;}
 function tap(save,time,date=new Date()){if(!root.visible||!canGlow(save,date)||time-triggerAt<GLOW_SECONDS)return false;triggerAt=time;return true;}
 function update(time,{eligible=true,darkness=nightAmount()}={}){if(!eligible)triggerAt=-Infinity;night=darkness;level=glowEnvelope(time-triggerAt);const response=crystalLight(days,night,level);idle=response.idle;cores.forEach(c=>c.material.opacity=idle*.65+level*(.32+night*.18));material.emissiveIntensity=response.emission;halo.material.opacity=response.halo;halo.visible=root.visible;particles.visible=level>0&&!reducedMotion;particles.material.opacity=level*(.28+night*.32);light.intensity=response.spill;for(let i=0;i<9;i++){const phase=(time*.12+i*.618)%1,angle=i*2.4;coords[i*3]=Math.sin(angle)*(.16+phase*.15);coords[i*3+1]=.1+phase*.68;coords[i*3+2]=Math.cos(angle)*.17;}particleGeo.attributes.position.needsUpdate=true;}
 const targets=()=>shards.filter(s=>s.pivot.visible).map(s=>s.mesh);
 return {root,setDays,tap,update,targets,getState:()=>({days,visible:root.visible,shards:targets().length,glow:level,night,idleIntensity:idle,emissiveIntensity:material.emissiveIntensity,haloOpacity:halo.material.opacity}),getTapPosition:()=>root.localToWorld(new T.Vector3(0,.055+.245*crystalGrowth(days).progress,0)),dispose:()=>{shards.forEach(s=>s.mesh.geometry.dispose());material.dispose();cores.forEach(c=>c.material.dispose());texture.dispose();halo.material.dispose();particleGeo.dispose();particles.material.dispose();}};
}

export function createCrystal({reducedMotion=false}={}){
 const root=new T.Group();root.name='CrystalGarden';
 const primary=createCluster({reducedMotion,matureScale:2.4,position:[1.08,-.045,1.35]});
 const companion=createCluster({reducedMotion,matureScale:1.95,position:[-1.08,-.045,1.30]});
 companion.root.rotation.y=.65;root.add(primary.root,companion.root);let days=0;
 const clusters=[primary,companion];
 return {root,setDays(value){days=value;primary.setDays(value);companion.setDays(value<25?0:Math.min(45,10+(value-25)*35/20));root.visible=primary.root.visible;},
 tap(save,time,date=new Date()){if(!canGlow(save,date))return false;const a=primary.tap(save,time,date),b=companion.tap(save,time,date);return a||b;},
 update(time,options){clusters.forEach(c=>c.update(time,options));},targets:()=>clusters.flatMap(c=>c.targets()),
 getTapPosition:()=>primary.getTapPosition(),getTapPositions:()=>clusters.filter(c=>c.root.visible).map(c=>c.getTapPosition()),
 getState:()=>({...primary.getState(),days,shards:clusters.reduce((n,c)=>n+c.getState().shards,0),clusters:clusters.filter(c=>c.root.visible).length,primaryHeight:.64*primary.root.scale.y,companionHeight:.64*companion.root.scale.y}),
 dispose:()=>clusters.forEach(c=>c.dispose())};
}
