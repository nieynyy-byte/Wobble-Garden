import * as T from 'three';
import {outdoorGarden} from './daylight.js';
const mat=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
function plasterMaterial(){
 const size=512,data=new Uint8Array(size*size*4),bump=new Uint8Array(size*size*4);let seed=193;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=seed/4294967296-.5;
  const cloud=Math.sin(x*.061+Math.sin(y*.034))*Math.cos(y*.047+Math.sin(x*.012));
  const v=245+cloud*1.5+grain*3,i=(y*size+x)*4;data.set([v,v,v,255],i);const b=128+grain*70;bump.set([b,b,b,255],i);
 }
 const make=(d,repeat)=>{const t=new T.DataTexture(d,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 const albedo=make(data,3);albedo.colorSpace=T.SRGBColorSpace;
 return new T.MeshStandardMaterial({color:'#ded2bb',map:albedo,roughness:.94,bumpMap:make(bump,12),bumpScale:.003});
}
// Narrow bevels catch window light without changing the room proportions.
function softBox(w,h,d,radius){
 const size=[w,h,d],g=new T.BoxGeometry(w,h,d,3,3,3),p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3(),core=new T.Vector3();
  for(let k=0;k<3;k++){const half=size[k]/2,q=p.array[i*3+k],value=Math.abs(q)>half*.8?Math.sign(q)*half:Math.sign(q)*(half-radius);v.setComponent(k,value);core.setComponent(k,T.MathUtils.clamp(value,-half+radius,half-radius));}
  const direction=v.clone().sub(core).normalize();v.copy(core).addScaledVector(direction,radius);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,direction.x,direction.y,direction.z);
 }
 p.needsUpdate=n.needsUpdate=true;return g;
}
export function makeRoom(textures){
 const room=new T.Group();room.name='Window room V07';
 const wall=plasterMaterial(),wood=new T.MeshPhysicalMaterial({map:textures.oak,bumpMap:textures.oak,bumpScale:.007,roughness:.48,clearcoat:.28,clearcoatRoughness:.25});
 const frame=new T.MeshStandardMaterial({color:'#656255',roughness:.36,metalness:.42});
 const gasket=mat('#373c35',.9),sill=mat('#d9d0bd',.63);
 function box(name,x,y,z,w,h,d,m){const o=new T.Mesh(name.startsWith('Wall')?new T.BoxGeometry(w,h,d):softBox(w,h,d,Math.min(w,h,d)*.12),m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;room.add(o);return o;}
 // Scale: two world units are approximately 11 cm. Freestanding console,
 // a physical plaster reveal, and a 74 x 99 cm window opening.
 box('Wall left',-8.65,4,-2.35,14,42,1.64,wall);
 box('Wall right',18.75,4,-2.35,14,42,1.64,wall);
 box('Wall below',5.05,-7,-2.35,13.4,14,1.64,wall);
 box('Wall above',5.05,23,-2.35,13.4,10,1.64,wall);
 box('Window stone sill',5.05,-.045,-2.03,13.85,.18,1.44,sill);
 const top=box('Oak table top',2,-.28,.65,16,.46,4.35,wood);
 const uv=top.geometry.attributes.uv,p=top.geometry.attributes.position,n=top.geometry.attributes.normal;
 for(let i=0;i<p.count;i++)if(Math.abs(n.getY(i))>.5)uv.setXY(i,(p.getX(i)+8)/16,(p.getZ(i)+2.175)/4.35);
 uv.needsUpdate=true;
 box('Oak front apron',2,-.94,2.25,14.2,.92,.24,wood);
 box('Oak rear apron',2,-.94,-1.05,14.2,.92,.24,wood);
 for(const x of [-5.0,9.0]){
  box('Oak side apron',x,-.94,.6,.24,.92,3.55,wood);
  for(const z of [-1.05,2.25]){
   const leg=box('Oak table leg',x,-6.42,z,.55,11.84,.55,wood);
   // Thin tapered hardwood legs; top meets underside with no visible gap.
   const p=leg.geometry.attributes.position;
   for(let i=0;i<p.count;i++){const a=.72+.28*(p.getY(i)/11.84+.5);p.setX(i,p.getX(i)*a);p.setZ(i,p.getZ(i)*a);}
   p.needsUpdate=true;leg.geometry.computeVertexNormals();
  }
 }
 box('Warm matte floor',0,-12.43,6,50,.18,30,mat('#c5baa4',.92));
 box('Wall skirting',0,-11.95,-2.17,40,.74,.12,sill);
 for(const x of [-1.65,11.75]){
  box('Window outer vertical frame',x,9,-2.55,.24,18,.48,frame);
  box('Window recessed seal',x+(x<0?.15:-.15),9,-2.69,.042,17.7,.08,gasket);
 }
 for(const y of [.13,17.9])box('Window horizontal frame',5.05,y,-2.55,13.4,.24,.48,frame);
 box('Window central mullion',5.8,9,-2.55,.19,17.6,.4,frame);
 box('Window upper transom',5.05,5.5,-2.55,13.4,.13,.3,frame);
 box('Window sill inner lip',5.05,.21,-2.29,13.4,.065,.065,frame);
 const contact=new T.Mesh(new T.PlaneGeometry(2.65,2.4),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; void main(){float r=length((vUv-.5)*2.);float a=(1.-smoothstep(.57,1.,r))*.22;gl_FragColor=vec4(.10,.065,.025,a);}'}));
 contact.name='Tabletop contact shadow';contact.rotation.x=-Math.PI/2;contact.position.set(0,-.047,0);contact.userData.noShadow=true;room.add(contact);
 room.add(outdoorGarden(textures.garden));
 const glass=new T.Mesh(new T.PlaneGeometry(13.16,17.54),new T.MeshPhysicalMaterial({color:'#edf5ef',transparent:true,opacity:.055,roughness:.07,metalness:0,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:.65,depthWrite:false}));
 glass.position.set(5.05,9,-2.66);glass.name='Thin clear window glazing';glass.userData.noShadow=true;room.add(glass);
 return room;
}
export {makePlant} from './foliage.js';
