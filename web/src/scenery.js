import * as T from 'three';
import {outdoorGarden} from './daylight.js';
const mat=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
// Small procedural oak texture: repeatable, local, and inexpensive on mobile.
function woodMaterial(){
 const width=1024,height=512,pixels=new Uint8Array(width*height*4);
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let a=x-ix,b=y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),a),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),a),b);};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height;
  const knot=Math.exp(-((u-.61)**2*65+(v-.38)**2*50));
  const warp=13*Math.sin(u*Math.PI*2)+6*Math.sin(u*Math.PI*4+v*4)+knot*27*Math.sin((v-.38)*15);
  const grain=y+warp+noise(u*3,v*9)*12;
  const fine=Math.sin(grain*1.75+noise(u*18,v*90)*1.4);
  const broad=noise(u*4,grain/19),fiber=Math.pow(Math.max(0,fine),13);
  const annual=Math.sin(grain*.16+noise(u*2,v*6)*3);
  const tone=(broad-.5)*17-fiber*9+annual*3.3+(hash(x,y)-.5)*2.5-knot*5;
  const i=(y*width+x)*4;pixels[i]=178+tone;pixels[i+1]=143+tone;pixels[i+2]=102+tone;pixels[i+3]=255;
 }
 const texture=new T.DataTexture(pixels,width,height);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1.4,1);texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
 const material=new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.004,roughness:.53,color:'#ffffff'});
 return material;
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
export function makeRoom(){
 const room=new T.Group(),wall=mat('#b7b9a3'),wood=woodMaterial(),frame=mat('#e3dfce');
 function box(name,x,y,z,w,h,d,m){const o=new T.Mesh((name.startsWith('Wall')?new T.BoxGeometry(w,h,d):softBox(w,h,d,Math.min(w,h,d)*.14)),m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;room.add(o);return o;}
 // The 11 cm pot is two world units wide; the window opening is 88 cm × 99 cm.
 box('Wall left',-6.8,8,-2.4,10,24,.55,wall);box('Wall right',19.2,8,-2.4,10,24,.55,wall);
 box('Wall below',6.2,-3,-2.4,16,6,.55,wall);box('Wall above',6.2,21,-2.4,16,6,.55,wall);
 box('Window sill',4,-.17,-.35,20,.24,5.2,wood);
 box('Window jamb left',-1.8,9,-2.12,.18,18,.4,frame);box('Window jamb right',14.2,9,-2.12,.18,18,.4,frame);
 box('Window bottom',6.2,.13,-2.12,16,.23,.4,frame);box('Window top',6.2,18,-2.12,16,.23,.4,frame);
 box('Window mullion',6.2,9,-2.12,.16,18,.3,frame);box('Window crossbar',6.2,5.4,-2.12,16,.16,.3,frame);
 room.add(outdoorGarden());
 const glass=new T.Mesh(new T.PlaneGeometry(15.8,17.8),new T.MeshPhysicalMaterial({color:'#e1ece7',transparent:true,opacity:.11,roughness:.09,metalness:.16,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:.8,depthWrite:false}));glass.position.set(6.2,9,-2.2);glass.name='Window glass';glass.userData.noShadow=true;room.add(glass);

 return room;
}
export {makePlant} from "./foliage.js";
