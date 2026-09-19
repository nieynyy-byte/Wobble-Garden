import * as T from 'three';
const ray=new T.Ray(),hit=new T.Vector3(),delta=new T.Vector3();
function edgeHit(a,b,t){delta.subVectors(b,a);const len=delta.length();if(len<1e-8)return false;ray.set(a,delta.multiplyScalar(1/len));const p=ray.intersectTriangle(t[0],t[1],t[2],false,hit);return p&&p.distanceToSquared(a)<len*len-1e-10&&p.distanceToSquared(a)>1e-10;}
function triangleHit(a,b){for(let i=0;i<3;i++)if(edgeHit(a[i],a[(i+1)%3],b)||edgeHit(b[i],b[(i+1)%3],a))return true;return false;}
function tree(triangles){const box=new T.Box3();for(const t of triangles)box.union(t.box);if(triangles.length<=8)return {box,triangles};const size=box.getSize(new T.Vector3()),axis=size.x>size.y?(size.x>size.z?'x':'z'):(size.y>size.z?'y':'z');triangles.sort((a,b)=>a.box.min[axis]+a.box.max[axis]-b.box.min[axis]-b.box.max[axis]);const mid=triangles.length>>1;return {box,left:tree(triangles.slice(0,mid)),right:tree(triangles.slice(mid))};}
export function collisionMesh(geometry,position,rotation,id,clearance=.04){
 const a=geometry.attributes.position,sideSize=a.count/2,points=[],q=new T.Quaternion().setFromEuler(new T.Euler(...rotation)),p=new T.Vector3(...position);
 for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i);v[id==='sansevieria'?'z':'y']+=(i<sideSize?1:-1)*clearance;points.push(v.applyQuaternion(q).add(p));}
 const triangles=[],idx=geometry.index.array;for(let i=0;i<idx.length;i+=3){const t=[points[idx[i]],points[idx[i+1]],points[idx[i+2]]];t.box=new T.Box3().setFromPoints(t);triangles.push(t);}return tree(triangles);
}
export function intersects(a,b){
 if(!a.box.intersectsBox(b.box))return false;
 if(a.triangles&&b.triangles){for(const x of a.triangles)for(const y of b.triangles)if(x.box.intersectsBox(y.box)&&triangleHit(x,y))return true;return false;}
 if(a.triangles)return intersects(a,b.left)||intersects(a,b.right);
 return intersects(a.left,b)||intersects(a.right,b);
}
