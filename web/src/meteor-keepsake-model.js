import * as T from 'three';
export function createMeteorKeepsakes(actor){
 const root=new T.Group();root.name='Meteor keepsakes';const necklace=new T.Group(),bandana=new T.Group();root.add(necklace,bandana);
 // Sample the approved pot surface in actor coordinates, not a cylindrical proxy.
 actor.updateWorldMatrix(true,true);
 const pot=actor.getObjectByName('Pot'), geo=pot.geometry.clone();
 geo.applyMatrix4(new T.Matrix4().copy(actor.matrixWorld).invert().multiply(pot.matrixWorld));
 const probe=new T.Mesh(geo,new T.MeshBasicMaterial({side:T.DoubleSide}));probe.updateMatrixWorld();
 const ray=new T.Raycaster(),cache=new Map();
 function sampleSurface(ai,yi){
  ai=(ai%48+48)%48;const key=ai+':'+yi;if(cache.has(key))return cache.get(key);
  const angle=ai/48*Math.PI*2,y=.05+yi*.02,d=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
  ray.set(d.clone().multiplyScalar(2).setY(y),d.clone().negate());const hit=ray.intersectObject(probe)[0];const r=hit?Math.hypot(hit.point.x,hit.point.z):.9;cache.set(key,r);return r;
 }
 function surface(a,y){const x=((a/(Math.PI*2))%1+1)%1*48,z=(y-.05)/.02,ix=Math.floor(x),iz=Math.floor(z);return T.MathUtils.lerp(T.MathUtils.lerp(sampleSurface(ix,iz),sampleSurface(ix+1,iz),x-ix),T.MathUtils.lerp(sampleSurface(ix,iz+1),sampleSurface(ix+1,iz+1),x-ix),z-iz);}

 const glows=[],fires=[],flames=[];let seed=73;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function mesh(g,m,parent,p){const o=new T.Mesh(g,m);if(p)o.position.copy(p);parent.add(o);o.receiveShadow=true;o.castShadow=true;return o;}
 const mat=(color,roughness=.55)=>new T.MeshStandardMaterial({color,roughness});
 const palette=['#88bba2','#bda1df','#ed9d91','#77b9d2','#edcf78','#e5b6d2'];
 function point(a){const y=1.08-.28*Math.max(0,Math.cos(a)),r=surface(a,y)+.133;return new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);}
 const cordCurve=new T.CatmullRomCurve3(Array.from({length:96},(_,i)=>point(i/96*Math.PI*2)),true);
 mesh(new T.TubeGeometry(cordCurve,128,.018,6,true),mat('#a88050'),necklace);
 for(let i=0;i<18;i++){
  const fire=i===1||i===16||i===7,r=.125+rand()*.039,g=new T.SphereGeometry(r,64,40),a=g.attributes.position;
  const shapePhase=rand()*Math.PI*2,stretch=new T.Vector3(.86+rand()*.24,.88+rand()*.24,.91+rand()*.16);
  const colors=[],baseColor=new T.Color(fire?'#ffb43e':palette[(i*5)%6]);
  const craters=Array.from({length:11},(_,k)=>{const y=1-2*(k+.5)/11,a=k*2.39996+rand()*.18,r=Math.sqrt(1-y*y);return Object.assign(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),{craterRadius:.22+rand()*.15});});
  for(let j=0;j<a.count;j++){const v=new T.Vector3().fromBufferAttribute(a,j),n=v.clone().normalize();let dent=0;for(const c of craters){const d=Math.acos(T.MathUtils.clamp(n.dot(c),-1,1));const size=c.craterRadius,bowl=d<size?.34*Math.pow(1-(d/size)**2,1.2):0;const rim=.028*Math.exp(-(((d-size-.01)/.047)**2));dent+=bowl-rim;}const lump=1+.085*Math.sin(n.x*4.1+shapePhase)*Math.cos(n.y*3.7-shapePhase)+.055*Math.sin(n.z*5.2+n.x*2.4+shapePhase);v.multiplyScalar((1-dent)*lump).multiply(stretch);a.setXYZ(j,v.x,v.y,v.z);const color=baseColor.clone().multiplyScalar(1-Math.max(0,dent)*1.55);colors.push(color.r,color.g,color.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const material=mat('#ffffff',.32);material.vertexColors=true;if(fire){material.emissive.set('#ff5408');material.emissiveIntensity=.35;fires.push(material);}
  const bead=mesh(g,material,necklace,point(i/18*Math.PI*2));bead.rotation.set(rand(),rand(),rand());mesh(new T.SphereGeometry(.052,16,12),mat(palette[(i+2)%6],.4),necklace,point((i+.5)/18*Math.PI*2));
  if(fire){const p=bead.position.clone();
   const flameMat=mat('#ff8628',.4);flameMat.emissive.set('#ff4905');flameMat.emissiveIntensity=.55;
   for(let k=0;k<3;k++){
    const length=[.25,.33,.21][k],offset=(k-1)*.047;const curve=new T.CubicBezierCurve3(new T.Vector3(offset,.035,.008),new T.Vector3(offset+.20,length*.25,.025),new T.Vector3(offset+.015,length*.83,-.012),new T.Vector3(offset+.15,length,.005));
    const g=new T.TubeGeometry(curve,28,.059,9,false),pos=g.attributes.position;
    for(let j=0;j<pos.count;j++){const t=Math.floor(j/10)/28,center=curve.getPointAt(t),v=new T.Vector3().fromBufferAttribute(pos,j);v.sub(center).multiplyScalar(Math.pow(1-t,.58)).add(center);pos.setXYZ(j,v.x,v.y,v.z);}g.computeVertexNormals();const tongue=mesh(g,flameMat,necklace,p);flames.push({geometry:g,base:new Float32Array(pos.array),phase:i*.8+k*1.9});
   }
   const glowMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{strength:{value:.28}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float strength;void main(){float r=length(v-.5)*2.;gl_FragColor=vec4(1.,.38,.055,pow(max(0.,1.-r),3.)*strength);}'});
   const glow=mesh(new T.PlaneGeometry(.55,.55),glowMaterial,necklace,p);glows.push(glow);
  }
 }
 const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#f4eedb';ctx.fillRect(0,0,c.width,c.height);
 for(let row=0;row<14;row++)for(let col=0;col<15;col++){
  const x=col*70+(row%2)*35,y=row*38+17;ctx.save();ctx.translate(x,y);ctx.rotate(-.55+(rand()-.5)*.6);ctx.fillStyle='#aec19a';ctx.strokeStyle='#64814e';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.stroke();for(const [dx,dy,r]of [[-4,-5,2.8],[5,-3,2.2],[-6,3,1.8],[2,6,2.5],[1,0,1.6]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fillStyle='#64814e';ctx.fill();}for(let t=-1;t<=1;t++){ctx.beginPath();ctx.moveTo(-10,-8+t*5);ctx.lineTo(-22-t*2,-15+t*5);ctx.stroke();}ctx.restore();ctx.fillStyle='#99ae82';ctx.beginPath();ctx.arc(x+32,y+34,2+rand()*1.2,0,Math.PI*2);ctx.fill();}
 const pattern=new T.CanvasTexture(c);pattern.colorSpace=T.SRGBColorSpace;pattern.anisotropy=4;pattern.wrapT=T.RepeatWrapping;
 const cloth=new T.MeshStandardMaterial({map:pattern,roughness:.96,side:T.DoubleSide,color:'#fffdf6'});
 const nx=128,ny=48,positions=[],uv=[],indices=[];
 // One triangular folded sheet: its two sloping hems continue all the way
 // around the sides to the rear tips. No rectangular neck strip or side cut.
 const drapeCache=new Map();
 function drapeRadius(a,top,depth){const key=a.toFixed(5);if(drapeCache.has(key))return drapeCache.get(key);let r=0;for(let k=0;k<=12;k++)r=Math.max(r,surface(a,top-depth*k/12));drapeCache.set(key,r);return r;}
 function clothPoint(a,v){
  const along=Math.abs(a)/Math.PI,depth=.89*Math.pow(1-along*.55,5)+.18*Math.pow(along,2),top=1.075+.075*Math.pow(Math.sin(a),2)-.012*Math.sin(along*Math.PI);
  const distance=v*depth;
  // The folded top belongs to the same sheet: a soft turn-over and a shallow
  // crease underneath, fading into the cloth rather than a separate collar.
  const foldWidth=.085-.020*along,fold=Math.exp(-Math.pow((distance-.026)/.030,2))*.033;
  const crease=-.008*Math.exp(-Math.pow((distance-foldWidth)/.018,2));
  const y=top-distance+.010*Math.exp(-distance/.025),radius=Math.max(surface(a,y),(surface(a,y-.065)+surface(a,y)+surface(a,y+.065))/3)+.018+fold*.12+.006*Math.sin(a*4+v*2)*Math.sin(v*Math.PI)+.013*T.MathUtils.smoothstep(along,.6,1)*Math.pow(Math.sin(v*Math.PI*2),2);
  return new T.Vector3(Math.sin(a)*radius,y,Math.cos(a)*radius);
 }

 for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){const a=-Math.PI+i/nx*Math.PI*2,p=clothPoint(a,j/ny);positions.push(...p.toArray());uv.push(i/nx,(1.10-p.y)/3.0);if(i<nx&&j<ny){const k=i*(ny+1)+j;indices.push(k,k+ny+1,k+1,k+1,k+ny+1,k+ny+2);}}
 for(let i=0;i<indices.length;i+=3){const tmp=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=tmp;}
 const clothGeometry=new T.BufferGeometry();clothGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));clothGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));clothGeometry.setIndex(indices);clothGeometry.computeVertexNormals();
 // A real back surface and joined edges give heavy fabric visible thickness.
 const count=positions.length/3,normals=clothGeometry.attributes.normal;
 const outer=positions.slice(),outerUv=uv.slice();
 for(let i=0;i<count;i++){positions.push(outer[i*3]-normals.getX(i)*.014,outer[i*3+1]-normals.getY(i)*.014,outer[i*3+2]-normals.getZ(i)*.014);uv.push(outerUv[i*2],outerUv[i*2+1]);}
 const frontIndices=indices.slice();for(let i=0;i<frontIndices.length;i+=3)indices.push(frontIndices[i]+count,frontIndices[i+2]+count,frontIndices[i+1]+count);
 const join=(a,b)=>indices.push(a,b,a+count,b,b+count,a+count);
 for(let i=0;i<nx;i++){join(i*(ny+1),(i+1)*(ny+1));join(i*(ny+1)+ny,(i+1)*(ny+1)+ny);}
 for(let j=0;j<ny;j++){join(j,j+1);join(nx*(ny+1)+j,nx*(ny+1)+j+1);}
 clothGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));clothGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));clothGeometry.setIndex(indices);clothGeometry.deleteAttribute('normal');clothGeometry.computeVertexNormals();mesh(clothGeometry,cloth,bandana);
 const seam=mat('#eee5cf',.95);for(const v of [.99]){const curve=new T.CatmullRomCurve3(Array.from({length:129},(_,i)=>clothPoint(-Math.PI+i/128*Math.PI*2,v)),true);mesh(new T.TubeGeometry(curve,192,.018,8,true),seam,bandana);}
 // Two padded fabric turns cross over/under instead of a spherical knot.
 const rearContact=clothPoint(Math.PI,.5),knotY=rearContact.y,knotZ=rearContact.z-.030;
 for(const side of [-1,1]){
  const entry=clothPoint(side*(Math.PI-.18),.5);
  const path=new T.CatmullRomCurve3([entry,new T.Vector3(side*.09,knotY+.065,knotZ-.012),new T.Vector3(-side*.055,knotY+.015,knotZ-(side===1?.062:.020)),new T.Vector3(-side*.025,knotY-.065,knotZ-.028),new T.Vector3(side*.06,knotY-.090,knotZ)]);
  const p=[],u=[],ids=[],segments=48,rings=16;
  for(let i=0;i<=segments;i++){const t=i/segments,c=path.getPointAt(t),tangent=path.getTangentAt(t),across=new T.Vector3(-tangent.y,tangent.x,0).normalize(),depth=new T.Vector3().crossVectors(tangent,across).normalize();for(let j=0;j<=rings;j++){const a=j/rings*Math.PI*2,v=c.clone().addScaledVector(across,Math.cos(a)*(.056+.010*Math.sin(t*Math.PI))).addScaledVector(depth,Math.sin(a)*.025);p.push(...v.toArray());u.push(.46+t*.065,.05+j/rings*.023);if(i<segments&&j<rings){const n=i*(rings+1)+j;ids.push(n,n+rings+1,n+1,n+1,n+rings+1,n+rings+2);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setIndex(ids);g.computeVertexNormals();mesh(g,cloth,bandana);
 }
 for(const side of [-1,1]){
  const positions=[],uvs=[],ids=[],steps=20;
  for(let j=0;j<=steps;j++){const t=j/steps,y=knotY-.055-.31*t,cx=side*(.04+.19*t),width=.10*Math.sin(Math.PI*(.15+.85*t));for(let k=0;k<=8;k++){const u=k/8,x=cx+(u-.5)*width*2,z=-Math.sqrt(Math.max(.1,surface(Math.PI,y)**2-x*x))-.068-.044*Math.sin(t*Math.PI)-.016*Math.cos(u*Math.PI*2);positions.push(x,y,z);uvs.push(.4+x/6,(1.10-y)/3);if(j<steps&&k<8){const n=j*9+k;ids.push(n,n+9,n+1,n+1,n+9,n+10);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(ids);g.computeVertexNormals();
  const n=positions.length/3,normal=g.attributes.normal,base=positions.slice(),baseUv=uvs.slice(),front=ids.slice();
  for(let i=0;i<n;i++){positions.push(base[i*3]-normal.getX(i)*.024,base[i*3+1]-normal.getY(i)*.024,base[i*3+2]-normal.getZ(i)*.024);uvs.push(baseUv[i*2],baseUv[i*2+1]);}
  for(let i=0;i<front.length;i+=3)ids.push(front[i]+n,front[i+2]+n,front[i+1]+n);
  const edge=(a,b)=>ids.push(a,b,a+n,b,b+n,a+n);
  for(let j=0;j<steps;j++){edge(j*9,(j+1)*9);edge(j*9+8,(j+1)*9+8);}for(let k=0;k<8;k++){edge(k,k+1);edge(steps*9+k,steps*9+k+1);}
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(ids);g.deleteAttribute('normal');g.computeVertexNormals();mesh(g,cloth,bandana);
 }
 geo.dispose();probe.material.dispose();let current=null;
 return {root,set(kind){current=kind;necklace.visible=kind==='necklace';bandana.visible=kind==='bandana';},update(time,camera,darkness=0){for(const f of flames){const a=f.geometry.attributes.position;for(let j=0;j<a.count;j++){const x=f.base[j*3],y=f.base[j*3+1],z=f.base[j*3+2],w=Math.max(0,y-.06);a.setXYZ(j,x+Math.sin(time*2.4+y*15+f.phase)*w*.09,y,z+Math.sin(time*1.8+y*11+f.phase)*w*.05);}a.needsUpdate=true;}for(const m of fires)m.emissiveIntensity=(.12+darkness*.8)*(1+Math.sin(time*1.2)*.08);for(const g of glows){g.quaternion.copy(root.getWorldQuaternion(new T.Quaternion()).invert()).multiply(camera.quaternion);g.material.uniforms.strength.value=.25+darkness*.65;}},getState:()=>({revision:'FIT-30',kind:current,beads:18,fireBeads:3,knot:'back',neckY:1.085}),dispose(){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());pattern.dispose();root.removeFromParent();}};
}
