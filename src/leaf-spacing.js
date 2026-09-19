import * as T from 'three';
import {collisionMesh,intersects} from './leaf-collision.js';
// Conservative oriented boxes include leaf thickness and a movement envelope.
export function leafBox(geometry,position,rotation,padding=.035){
 geometry.computeBoundingBox();const bounds=geometry.boundingBox,q=new T.Quaternion().setFromEuler(new T.Euler(...rotation));
 return {center:bounds.getCenter(new T.Vector3()).applyQuaternion(q).add(new T.Vector3(...position)),half:bounds.getSize(new T.Vector3()).multiplyScalar(.5).addScalar(padding),axes:[new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1)].map(a=>a.applyQuaternion(q))};
}
export function overlaps(a,b){
 const delta=b.center.clone().sub(a.center),axes=[...a.axes,...b.axes];for(const x of a.axes)for(const y of b.axes){const c=x.clone().cross(y);if(c.lengthSq()>1e-10)axes.push(c.normalize());}
 for(const axis of axes){let r=0;for(let k=0;k<3;k++)r+=a.half.getComponent(k)*Math.abs(axis.dot(a.axes[k]))+b.half.getComponent(k)*Math.abs(axis.dot(b.axes[k]));if(Math.abs(delta.dot(axis))>=r)return false;}return true;
}
export function arrange(leaves,geometryFor,species){
 const boxes=[],result=[];
 for(const leaf of leaves){
  const geometry=geometryFor(leaf),base=leaf.position,angle=leaf.rotation[1];let found;
  if(leaf.locked){boxes.push(collisionMesh(geometry,leaf.position,leaf.rotation,species));result.push({...leaf});continue;}
  // Search nearby petiole directions and tiers. Never remove a leaf or shrink a whole plant.
  for(let attempt=0;attempt<1000;attempt++){
   const ring=Math.floor(attempt/20),phase=attempt%20,a=angle+(phase%2?1:-1)*Math.ceil(phase/2)*(species==='fittonia'?.035:.21);
   const radius=ring*.035,p=[base[0]+Math.sin(a)*radius,base[1]+ring*.016,base[2]+Math.cos(a)*radius];
   const rot=[leaf.rotation[0]+(phase%3-1)*.035,a,leaf.rotation[2]];
   const box=collisionMesh(geometry,p,rot,species);
   if(!boxes.some(b=>intersects(box,b))){found={...leaf,position:p,rotation:rot,spacingAttempt:attempt};boxes.push(box);break;}
  }
  if(!found)throw Error('Cannot safely place '+leaf.id);
  result.push(found);
 }
 return result;
}
