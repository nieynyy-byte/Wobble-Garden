import * as T from '../vendor/three.module.js';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function noise(x,y,seed){const hash=(a,b)=>{let h=Math.imul(a,374761393)^Math.imul(b,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};const ix=Math.floor(x),iy=Math.floor(y),u=smooth(0,1,x-ix),v=smooth(0,1,y-iy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;}
function fbm(x,y,s){return noise(x,y,s)*.56+noise(x*2.07,y*2.07,s+17)*.28+noise(x*4.13,y*4.13,s+41)*.16;}
export function makePothosMaterial({seed,coverage,young=false}){
 const rng=random(seed),W=256,H=512,pixels=new Uint8Array(W*H*4),rough=new Uint8Array(W*H*4);
 const patches=Array.from({length:coverage<.15?2:4},()=>({x:rng()*1.8-.9,y:rng()*.95,rx:.12+rng()*.40,ry:.12+rng()*.30,angle:rng()*2.4-1.2,strength:.75+rng()*.6}));
 const green=new T.Color(young?'#75994b':'#416c37'),lightGreen=new T.Color(young?'#99ad63':'#729247'),cream=new T.Color(young?'#d7d299':'#c6bd79'),deep=new T.Color('#31582f'),veinColor=new T.Color('#afbc78');
 const offset=rng()*100,shift=rng()*100;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const u=x/(W-1)*2-1,t=y/(H-1),n=fbm(u*3+offset,t*5+shift,seed);
  const wx=u+(fbm(u*4+offset,t*6,seed+8)-.5)*.22,wy=t+(fbm(u*3,t*8+shift,seed+19)-.5)*.1;
  let field=0;for(const p of patches){const dx=wx-p.x,dy=wy-p.y,c=Math.cos(p.angle),s=Math.sin(p.angle);const a=(dx*c-dy*s)/p.rx,b=(dx*s+dy*c)/p.ry;field=Math.max(field,Math.exp(-1.3*(a*a+b*b))*p.strength);}
  const flecks=fbm(u*17+offset,t*31+shift,seed+63),marble=field+(n-.5)*.32+(flecks-.5)*.075;
  const threshold=coverage<.1?1.10:coverage<.25?.88:coverage<.5?.63:.38;
  const streak=fbm(u*29+offset+(n-.5)*3,t*12+shift,seed+123);
  const edge=smooth(threshold-.24,threshold+.27,marble+(streak-.5)*.17);
  const pigment=.58+.40*smooth(.22,.72,fbm(u*11+offset,t*19+shift,seed+85));
  const amount=edge*pigment;
  const c=green.clone().lerp(lightGreen,.13+n*.36).lerp(deep,.07*(1-n)).lerp(cream,amount);
  const mid=.012*Math.sin(t*4.8+seed),vein=Math.exp(-(((u-mid)/.012)**2))*.13;
  // Faint curved, offset veins on each side; never mirror the secondary network.
  let secondary=0;for(let k=1;k<=6;k++){const base=k*.133+(u<0?.026:0);const path=base+Math.abs(u)*(.105+.032*Math.sin(k*1.7+seed));secondary=Math.max(secondary,Math.exp(-(((t-path)/.0045)**2))*(1-Math.abs(u))*.025);}
  c.lerp(veinColor,Math.max(vein,secondary)*(1-.45*amount));c.multiplyScalar(.985+.025*flecks);c.convertLinearToSRGB();const i=(y*W+x)*4;pixels[i]=Math.min(255,c.r*255);pixels[i+1]=Math.min(255,c.g*255);pixels[i+2]=Math.min(255,c.b*255);pixels[i+3]=255;
  const r=Math.round(255*(.58+.07*n+.025*amount));rough[i]=rough[i+1]=rough[i+2]=r;rough[i+3]=255;
 }
 const tex=new T.DataTexture(pixels,W,H);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;
 const rtex=new T.DataTexture(rough,W,H);rtex.minFilter=T.LinearFilter;rtex.magFilter=T.LinearFilter;rtex.needsUpdate=true;
 return new T.MeshStandardMaterial({map:tex,roughness:1,roughnessMap:rtex,metalness:0,side:T.DoubleSide});
}
