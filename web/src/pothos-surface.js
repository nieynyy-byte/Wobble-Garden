import * as T from 'three';
import {POTHOS_ATLAS as atlas} from './pothos-atlas.js';
const materials=new Map(),geometries=new Map(),tiles=new Map(atlas.records.map(r=>[r.id,r]));
let started=false;
function start(){
 if(started)return;started=true;
 for(const young of [false,true])materials.set(young,new T.MeshStandardMaterial({color:young?'#75994b':'#416c37',roughness:.63,side:T.DoubleSide,emissive:'#16200a',emissiveIntensity:.13}));
 const loader=new T.TextureLoader(),url=name=>new URL('../public/assets/textures/pothos-v02/'+name+'.png',import.meta.url).href;
 for(const young of [false,true])loader.load(url(young?'young':'mature'),texture=>{texture.flipY=false;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;const m=materials.get(young);m.color.set('#ffffff');m.map=texture;m.needsUpdate=true;},undefined,()=>{});
 loader.load(url('roughness'),texture=>{texture.flipY=false;texture.needsUpdate=true;for(const m of materials.values()){m.roughness=1;m.roughnessMap=texture;m.needsUpdate=true;}},undefined,()=>{});
}
export function pothosSurface(leaf,stage,original){
 start();if(!geometries.has(leaf.id)){
  const g=original.clone(),uv=g.attributes.uv,tile=tiles.get(leaf.id);
  const x=(tile.slot%atlas.cols)*(atlas.width+2*atlas.pad)+atlas.pad,y=Math.floor(tile.slot/atlas.cols)*(atlas.height+2*atlas.pad)+atlas.pad;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(x+.5+uv.getX(i)*(atlas.width-1))/atlas.atlasWidth,(y+.5+uv.getY(i)*(atlas.height-1))/atlas.atlasHeight);
  uv.needsUpdate=true;geometries.set(leaf.id,g);
 }
 return {geometry:geometries.get(leaf.id),material:materials.get(leaf.born===stage)};
}
