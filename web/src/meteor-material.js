import * as T from 'three';
// Shared procedural stone textures: grains and recessed craters, no bitmap edits.
export function createMeteorMaterial(){
 let seed=7429;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d'),pixels=ctx.createImageData(c.width,c.height);
 for(let y=0;y<256;y++)for(let x=0;x<512;x++){let n=0;for(let f=1;f<=16;f*=2)n+=Math.sin(x*f*.073+Math.sin(y*f*.059)*2)*Math.cos(y*f*.043+x*f*.011)/Math.sqrt(f);const v=124+n*21+(random()-.5)*35,i=(y*512+x)*4;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
 for(let i=0;i<130;i++){const x=random()*512,y=random()*256,r=2+random()**2*20;for(const dx of [-512,0,512]){const g=ctx.createRadialGradient(x+dx-r*.2,y-r*.2,0,x+dx,y,r);g.addColorStop(0,'#171717c0');g.addColorStop(.65,'#41414185');g.addColorStop(.82,'#d0d0d080');g.addColorStop(1,'#88888800');ctx.fillStyle=g;ctx.fillRect(x+dx-r,y-r,r*2,r*2);}}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=T.RepeatWrapping;map.anisotropy=4;
 const bump=new T.CanvasTexture(c);bump.wrapS=T.RepeatWrapping;bump.anisotropy=4;
 return {map,bump,dispose(){map.dispose();bump.dispose();}};
}
