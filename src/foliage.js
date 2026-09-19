import * as T from 'three';
import {pothosSurface} from './pothos-surface.js';
import {COUNTS} from './plant-architecture.js';
import {PLANT_LAYOUTS} from './plant-layouts.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
const settings={
 pothos:{color:'#578636',width:.29,length:.79,count:5,roughness:.5},
 fittonia:{color:'#517847',width:.19,length:.43,count:10,roughness:.72},
 peperomia:{color:'#497948',width:.25,length:.6,count:6,roughness:.4},
 syngonium:{color:'#7b9b53',width:.27,length:.76,count:5,roughness:.61},
 sansevieria:{color:'#476d45',width:.14,length:1,count:8,roughness:.56}
};
const cache=new Map();
function leafMaterial(id){
 if(cache.has(id))return cache.get(id);
 const width=128,height=256,data=new Uint8Array(width*height*4),cfg=settings[id];
 const base=new T.Color(cfg.color),pale=new T.Color(id==='fittonia'?'#d3c4b4':id==='pothos'?'#c9bd57':'#a3b775');
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const t=y/(height-1),u=x/(width-1)*2-1;
  const center=Math.exp(-Math.pow(u/ .021,2));
  const branch=(t-Math.abs(u)*(.16+.04*Math.sin(t*8)))*8;
  const distance=Math.abs(branch-Math.round(branch));
  const vein=Math.exp(-Math.pow(distance/.036,2))*(1-Math.abs(u)*.75);
  const speck=Math.sin(x*127.1+y*311.7)*43758.5453%1;
  let amount=id==='fittonia'?Math.max(center*.8,vein*.66):Math.max(center*.33,vein*.13);
  if(id==='pothos')amount+=Math.max(0,Math.sin(t*8+u*4)+Math.sin(t*13-u*6)-.45)*.55;
  if(id==='syngonium')amount+=.62*Math.exp(-Math.pow(u/.67,4))*(.6+.4*Math.sin(t*13+u*5));
  if(id==='sansevieria')amount=.12+.23*(.5+.5*Math.sin(t*83+u*4+Math.sin(u*12)*.7))**5+Math.max(0,Math.abs(u)-.86)*1.5;
  const c=base.clone().lerp(pale,Math.min(.85,amount)).multiplyScalar(.88+.11*Math.sin(t*Math.PI)+(speck*.022));
  c.convertLinearToSRGB();const i=(y*width+x)*4;data[i]=c.r*255;data[i+1]=c.g*255;data[i+2]=c.b*255;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,width,height);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
 const material=new T.MeshStandardMaterial({map:texture,roughness:cfg.roughness,side:T.DoubleSide,emissive:'#16200a',emissiveIntensity:.13});cache.set(id,material);return material;
}
function widthAt(id,t){
 if(id==='pothos')return Math.sin(Math.PI*Math.pow(t,.65))**.85;
 if(id==='syngonium')return (t<.22?.65+t*1.6:Math.max(0,(1-t)/.78)**1.35)*Math.sin(Math.min(1,t*16)*Math.PI/2);
 if(id==='peperomia')return Math.sin(Math.PI*Math.pow(t,.68))**.55;
 return Math.sin(Math.PI*t)**(id==='sansevieria'?.72:.85);
}
function blade(id,len,width,seed){
 const rows=16,cols=8,stride=cols+1,sideSize=(rows+1)*stride,verts=[],uv=[],indices=[];
 const thickness=id==='peperomia'?.012:id==='sansevieria'?.014:.004;
 for(let side=0;side<2;side++)for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
  const t=r/rows,u=c/cols*2-1,w=widthAt(id,t)*width;
  const upright=id==='sansevieria';
  const x=u*w*(1+.045*Math.sin(t*9+seed)*u);
  const fold=(1-u*u)*.034*Math.sin(Math.PI*t);
  const y=upright?t*len:Math.sin(Math.PI*t)*len*.14-t*t*len*.18+fold+u*Math.sin(t*5+seed)*.022;
  const basalLobes=(id==='pothos'||id==='syngonium')?.19*len*u*u*Math.exp(-t*7)*Math.sin(Math.PI*t)**.3:0;
  const z=upright?t*t*.21+u*u*.05:t*len-basalLobes;
  verts.push(x,y+(upright?0:(side?-.5:.5)*thickness),z+(upright?(side?-.5:.5)*thickness:0));uv.push((u+1)/2,t);
  if(r<rows&&c<cols){const a=side*sideSize+r*stride+c;indices.push(...(side?[a,a+1,a+stride,a+1,a+stride+1,a+stride]:[a,a+stride,a+1,a+1,a+stride,a+stride+1]));}
 }
 const rim=[];for(let c=0;c<=cols;c++)rim.push(c);for(let r=1;r<=rows;r++)rim.push(r*stride+cols);for(let c=cols-1;c>=0;c--)rim.push(rows*stride+c);for(let r=rows-1;r>0;r--)rim.push(r*stride);
 for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];indices.push(a,b,a+sideSize,b,b+sideSize,a+sideSize);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

const layouts=new Map();
export function plantLayout(id){
 if(!settings[id])id='pothos';
 if(!layouts.has(id)){
  const graph=PLANT_LAYOUTS[id],geometries=new Map();
  for(const l of graph.leaves)geometries.set(l.id,blade(id,l.length,l.width,l.id));
  const leaves=graph.leaves;
  layouts.set(id,{leaves,branches:graph.branches,geometries});
 }
 return layouts.get(id);
}
export function makePlant(id,stage=1){
 if(!settings[id])id='pothos';stage=Math.max(1,Math.min(7,Math.floor(stage)||1));
 const root=new T.Group();root.name=id==='pothos'?'PothosSeedling':'Plant_'+id;
 root.userData={species:id,growthStage:stage,leafCount:COUNTS[id][stage-1]};
 const layout=plantLayout(id),stemMat=new T.MeshStandardMaterial({color:id==='fittonia'?'#737d4c':'#66834a',roughness:.73});
 function stem(points,radius,name){
  const pts=points.map(p=>new T.Vector3(...p));if(pts[0].distanceTo(pts.at(-1))<.001)return;
  const curve=new T.CatmullRomCurve3(pts),mesh=new T.Mesh(new T.TubeGeometry(curve,8,radius,5,false),stemMat);mesh.name=name;mesh.castShadow=true;root.add(mesh);
 }
 for(const b of layout.branches)if(b.born<=stage)stem(b.points,id==='peperomia'?.025:.012,'Stem_'+b.id);
 for(const l of layout.leaves)if(l.born<=stage){
  const pivot=new T.Group();pivot.name='LeafPivot_'+l.id;pivot.position.fromArray(l.position);pivot.rotation.set(...l.rotation);
  pivot.userData={stiffness:id==='sansevieria'?.12:id==='peperomia'?.35:.55,bornStage:l.born,branch:l.branch};root.add(pivot);
  const surface=id==='pothos'?pothosSurface(l,stage,layout.geometries.get(l.id)):null;
  const leaf=new T.Mesh(surface?.geometry||layout.geometries.get(l.id),surface?.material||leafMaterial(id));leaf.name='Leaf_'+l.id;leaf.castShadow=leaf.receiveShadow=true;pivot.add(leaf);
  if(id!=='sansevieria')stem([l.start,[(l.start[0]+l.position[0])*.5,(l.start[1]+l.position[1])*.5+.025,(l.start[2]+l.position[2])*.5],l.position],id==='peperomia'?.018:.009,'Petiole_'+l.id);
  else if(l.spacingAttempt>20)stem([l.start,l.position],.025,'LeafBase_'+l.id);
 }
 const stems=root.children.filter(o=>o.isMesh);if(stems.length){const merged=new T.Mesh(mergeGeometries(stems.map(o=>o.geometry)),stemMat);merged.name='PlantBranches';merged.castShadow=true;for(const o of stems){root.remove(o);o.geometry.dispose();}root.add(merged);}
 return root;
}
