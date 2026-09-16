import * as T from 'three';
// Deterministic micro relief; kept small so it does not shimmer on a phone.
function surfaceTexture(){const n=128,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const h=Math.sin(x*127.1+y*311.7)*43758.5453;const v=90+(h-Math.floor(h))*100,i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}const texture=new T.DataTexture(data,n,n);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(5,5);texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;}
export function refineMaterials(actor){
 const grain=surfaceTexture();actor.traverse(o=>{if(!o.isMesh)return;
 if(['Pot','Saucer'].includes(o.name)){o.material=o.material.clone();const old=o.material;
 if(!o.geometry.attributes.uv){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),p=g.attributes.position,uv=[];for(let i=0;i<p.count;i+=3){const angles=[0,1,2].map(k=>Math.atan2(p.getZ(i+k),p.getX(i+k))/(Math.PI*2)+.5);if(Math.max(...angles)-Math.min(...angles)>.5)for(let k=0;k<3;k++)if(angles[k]<.5)angles[k]+=1;for(let k=0;k<3;k++)uv.push(angles[k],p.getY(i+k)/1.7);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));o.geometry=g;}
 o.material=new T.MeshPhysicalMaterial({color:old.color,roughness:.4,clearcoat:.16,clearcoatRoughness:.32,bumpMap:grain,bumpScale:.0014,envMapIntensity:.85});}
 if(o.name.startsWith('Eye')||o.name.startsWith('Pupil')){o.material=o.material.clone();o.material.roughness=o.name.startsWith('Pupil')?.32:.48;}
 if(o.name==='Soil')o.visible=false;
 if(o.name.startsWith('Leaf_')){o.material=o.material.clone();o.material.roughness=.56;o.material.bumpMap=grain;o.material.bumpScale=.0015;}
 });
 const hash=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
 const soilTexture=surfaceTexture();soilTexture.repeat.set(2.5,2.5);
 const soilMat=new T.MeshStandardMaterial({color:'#3c2a1f',roughness:1,bumpMap:soilTexture,bumpScale:.016,envMapIntensity:.25});
 const vertices=[0,1.546,0],uv=[.5,.5],faces=[],rings=12,segments=96;
 for(let ring=1;ring<=rings;ring++)for(let i=0;i<segments;i++){const r=ring/rings*.803,a=i/segments*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r,y=1.546+.008*Math.sin(x*37)*Math.sin(z*29)+.004*(hash(i+ring*segments)-.5);vertices.push(x,y,z);uv.push(x/1.606+.5,z/1.606+.5);const curr=1+(ring-1)*segments+i,next=1+(ring-1)*segments+(i+1)%segments;if(ring===1)faces.push(0,next,curr);else{const prev=curr-segments,prevNext=next-segments;faces.push(prev,next,curr,prev,prevNext,next);}}
 const surface=new T.BufferGeometry();surface.setAttribute('position',new T.Float32BufferAttribute(vertices,3));surface.setAttribute('uv',new T.Float32BufferAttribute(uv,2));surface.setIndex(faces);surface.computeVertexNormals();const bed=new T.Mesh(surface,soilMat);bed.name='Earth surface';bed.receiveShadow=true;actor.add(bed);
 const soil=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({roughness:1,envMapIntensity:.3}),260);soil.name='Soil granules';soil.receiveShadow=true;const dummy=new T.Object3D(),color=new T.Color();
 for(let i=0;i<260;i++){const angle=hash(i*3+2)*Math.PI*2,r=.775*Math.sqrt(hash(i*3+7)),size=.009+hash(i+100)*.019;dummy.position.set(Math.cos(angle)*r,1.55+size*.16,Math.sin(angle)*r);dummy.scale.set(size*1.4,size*.65,size);dummy.rotation.set(i*.7,i*1.1,i*.3);dummy.updateMatrix();soil.setMatrixAt(i,dummy.matrix);color.set(i%19===0?'#a2997e':i%3===0?'#503725':'#302116');soil.setColorAt(i,color);}
 soil.instanceMatrix.needsUpdate=true;actor.add(soil);
}
