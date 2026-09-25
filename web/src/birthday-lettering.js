import * as T from 'three';
import {mergeVertices} from '../vendor/BufferGeometryUtils.js';
// Original rounded contours inspired by the supplied bubble-alphabet reference.
// Real bevelled meshes: no text sprite, image cutout or screen overlay.
const outlines={
 H:[[.04,.03],[.25,0],[.31,.36],[.53,.36],[.57,.03],[.79,.02],[.82,.95],[.61,1],[.55,.65],[.31,.65],[.26,.99],[.04,.98]],
 A:[[0,.04],[.24,.02],[.32,.25],[.53,.25],[.57,.03],[.82,.06],[.74,.64],[.56,.98],[.31,1],[.10,.73]],
 P:[[.05,.01],[.29,.01],[.32,.35],[.66,.41],[.81,.63],[.76,.91],[.49,1.03],[.12,.95]],
 Y:[[.32,.01],[.56,.02],[.59,.39],[.82,.81],[.72,1],[.54,.96],[.44,.66],[.25,.98],[.05,.93],[.05,.74],[.31,.38]],
 B:[[.05,.04],[.39,0],[.73,.11],[.83,.34],[.65,.52],[.78,.75],[.66,.98],[.31,1.03],[.06,.91]],
 I:[[.09,.06],[.28,0],[.35,.22],[.37,.84],[.26,1.01],[.09,.96],[.02,.7],[.03,.24]],
 R:[[.05,.02],[.29,.01],[.33,.33],[.56,.02],[.80,.06],[.76,.28],[.57,.47],[.79,.65],[.73,.92],[.46,1.03],[.12,.96]],
 T:[[.29,.02],[.53,.02],[.56,.73],[.79,.75],[.82,.95],[.49,1.03],[.06,.97],[.04,.77],[.29,.70]],
 D:[[.05,.03],[.42,.02],[.73,.17],[.83,.49],[.75,.82],[.48,1.01],[.10,.97]]
};
const holes={A:[[.39,.55,.055,.085]],P:[[.47,.70,.10,.075]],B:[[.42,.75,.07,.055],[.44,.28,.085,.065]],R:[[.47,.72,.09,.065]],D:[[.42,.51,.095,.22]]};
const palette={H:'#91b4fa',A:'#ffcf57',P:'#ff889e',Y:'#a7dfaa',B:'#f78ead',I:'#fa8383',R:'#9ce5c0',T:'#fb8582',D:'#a6dda5'};
// A pressure-smoothed double membrane makes a continuous balloon surface.
// Both faces curve into the silhouette; there is no extruded flat cap.
function balloonGeometry(shape){
 const rings=[shape.getPoints(8),...shape.holes.map(h=>h.getPoints(24))],outer=rings[0];
 const step=.022,minX=Math.min(...outer.map(p=>p.x))-step*2,minY=Math.min(...outer.map(p=>p.y))-step*2;
 const nx=Math.ceil((Math.max(...outer.map(p=>p.x))-minX)/step)+3,ny=Math.ceil((Math.max(...outer.map(p=>p.y))-minY)/step)+3;
 const distances=new Float64Array(nx*ny),pressure=new Float64Array(nx*ny),segments=[];
 for(const ring of rings)for(let i=0;i<ring.length;i++)segments.push([ring[i],ring[(i+1)%ring.length]]);
 function inside(x,y,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const px=minX+x*step,py=minY+y*step;let d=Infinity;for(const [a,b]of segments){const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?T.MathUtils.clamp(((px-a.x)*dx+(py-a.y)*dy)/len,0,1):0;d=Math.min(d,(px-a.x-t*dx)**2+(py-a.y-t*dy)**2);}distances[y*nx+x]=Math.sqrt(d)*(inside(px,py,outer)&&!rings.slice(1).some(r=>inside(px,py,r))?1:-1)+.032;}
 for(let pass=0;pass<220;pass++)for(let y=1;y<ny-1;y++)for(let x=1;x<nx-1;x++){const i=y*nx+x;if(distances[i]>0){const target=(pressure[i-1]+pressure[i+1]+pressure[i-nx]+pressure[i+nx]+step*step)/4;pressure[i]=Math.max(0,pressure[i]+1.5*(target-pressure[i]));}}
 let max=0;for(const v of pressure)max=Math.max(max,v);const vertices=[];
 function vertex(x,y){const i=y*nx+x;return {x:minX+x*step,y:minY+y*step,z:.49*Math.sqrt(pressure[i]/max),d:distances[i]};}
 function triangle(points){const clipped=[];for(let i=0;i<3;i++){const a=points[i],b=points[(i+1)%3];if(a.d>0)clipped.push(a);if((a.d>0)!==(b.d>0)){const t=a.d/(a.d-b.d);clipped.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:0});}}for(let i=1;i<clipped.length-1;i++){for(const side of [1,-1])for(const v of side===1?[clipped[0],clipped[i],clipped[i+1]]:[clipped[0],clipped[i+1],clipped[i]])vertices.push(v.x,v.y,v.z*side);}}
 for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){const a=vertex(x,y),b=vertex(x+1,y),c=vertex(x+1,y+1),d=vertex(x,y+1);triangle([a,b,c]);triangle([a,c,d]);}
 const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const result=mergeVertices(raw,1e-5);result.computeVertexNormals();raw.dispose();result.userData.inflated=true;return result;
}
export function createBirthdayLettering(){
 const root=new T.Group(),letters=[],materials=[],halos=[];const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,4,32,32,32);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.45,'#ffffff70');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const glowMap=new T.CanvasTexture(canvas);root.name='3D bubble Happy Birthday';root.rotation.x=.08;root.rotation.y=-.09;
 const geometries=new Map();
 function geometry(char){if(geometries.has(char))return geometries.get(char);const points=outlines[char].map(p=>new T.Vector2(...p));points.push(points[0].clone());const shape=new T.Shape(new T.SplineCurve(points).getPoints(72));for(const [x,y,rx,ry]of holes[char]||[]){const h=new T.Path();h.absellipse(x,y,rx,ry,0,Math.PI*2,true);shape.holes.push(h);}const g=balloonGeometry(shape);g.computeVertexNormals();geometries.set(char,g);return g;}
 for(const [line,word]of ['HAPPY','BIRTHDAY'].entries()){let x=0;const row=[];for(let i=0;i<word.length;i++){const char=word[i],g=geometry(char);g.computeBoundingBox();const w=g.boundingBox.max.x-g.boundingBox.min.x;const color=char==='P'&&i%2?'#c5a0e6':palette[char];const m=new T.MeshPhysicalMaterial({color,roughness:.25,metalness:0,clearcoat:.5,clearcoatRoughness:.2,emissive:color,emissiveIntensity:.25});materials.push(m);const mesh=new T.Mesh(g,m);mesh.position.set(x,line===0?1.3:0,0);mesh.rotation.z=Math.sin(i*2.7+line)*.035;root.add(mesh);const halo=new T.Sprite(new T.SpriteMaterial({map:glowMap,color,transparent:true,opacity:.15,depthWrite:false,blending:T.AdditiveBlending}));halo.scale.set(w+1,1.9,1);halo.position.set(w*.45,.5,-.56);mesh.add(halo);halos.push(halo);row.push(mesh);x+=w+.13;}for(const mesh of row){mesh.position.x-=x/2;letters.push({mesh,base:mesh.position.clone(),roll:mesh.rotation.z,phase:letters.length*1.7});}}
 root.updateMatrixWorld(true);const box=new T.Box3();for(const l of letters)box.union(l.mesh.geometry.boundingBox.clone().applyMatrix4(l.mesh.matrixWorld));const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());for(const letter of letters){letter.mesh.position.sub(center);letter.base.copy(letter.mesh.position);}return {root,width:size.x,height:size.y,update(time,darkness,reducedMotion){for(const l of letters){l.mesh.position.copy(l.base);if(!reducedMotion){l.mesh.position.y+=Math.sin(time*.55+l.phase)*.045;l.mesh.rotation.y=Math.sin(time*.35+l.phase)*.12;l.mesh.rotation.z=l.roll+Math.sin(time*.43+l.phase)*.022;}}for(const m of materials)m.emissiveIntensity=.3+darkness*.8;for(const h of halos)h.material.opacity=.12+darkness*.22;}};
}
