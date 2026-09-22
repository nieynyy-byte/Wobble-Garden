import * as T from 'three';
// Three true world-space depth bands, all behind the physical wall/glass.
export function createRainLayer(scene,{reducedMotion=false}={}){
 const root=new T.Group();root.name='Outdoor weather only';scene.add(root);
 const U={clock:{value:0},amount:{value:0},night:{value:0}},meshes=[];
 let seed=381;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [layer,z,count,width,length]of [[0,-15,2600,.014,.20],[1,-9,2000,.021,.30],[2,-3.7,900,.027,.43]]){
  const base=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();g.index=base.index;g.attributes=base.attributes;g.instanceCount=count;
  const seeds=new Float32Array(count*4);for(let i=0;i<seeds.length;i++)seeds[i]=rand();g.setAttribute('seed',new T.InstancedBufferAttribute(seeds,4));
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...U,depth:{value:z},width:{value:width},length:{value:length},layer:{value:layer}},vertexShader:`
   attribute vec4 seed;uniform float clock,amount,depth,width,length,layer;varying vec2 uvRain;varying float alpha;
   void main(){uvRain=uv;float enabledDrop=1.-smoothstep(amount*amount*.98,amount*amount*.98+.02,seed.w);
    float speed=5.+seed.z*5.;float y=mod(seed.y*36.-clock*speed,36.)-5.;
    float x=-21.+seed.x*49.+sin(seed.z*24.)*.3+(y-12.)*(.025+seed.z*.025);
    vec3 p=vec3(x,y,depth-seed.z*1.8);p.x+=position.x*width*(.55+seed.y);p.y+=position.y*length*(.5+seed.z*1.5);p.x+=position.y*length*.06;
    alpha=enabledDrop*(.25+seed.x*.35)*(1.-layer*.10);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
   }`,fragmentShader:`uniform float night;varying vec2 uvRain;varying float alpha;void main(){float edge=pow(max(0.,1.-abs(uvRain.x*2.-1.)),.7);float ends=sin(uvRain.y*3.14159);vec3 c=mix(vec3(.67,.75,.79),vec3(.12,.17,.24),night);gl_FragColor=vec4(c,alpha*edge*ends);}`});
  const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.name='Rain depth '+layer;mesh.userData.noShadow=true;root.add(mesh);meshes.push(mesh);
 }
 // Sparse beads sit on the outer glass face, behind the room's depth mask.
 const dg=new T.InstancedBufferGeometry(),quad=new T.PlaneGeometry(1,1);dg.index=quad.index;dg.attributes=quad.attributes;dg.instanceCount=42;
 const ds=new Float32Array(42*4);for(let i=0;i<ds.length;i++)ds[i]=rand();dg.setAttribute('seed',new T.InstancedBufferAttribute(ds,4));
 const dm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:U,vertexShader:`attribute vec4 seed;uniform float clock,amount;varying vec2 beadUV;varying float beadAlpha;
 void main(){beadUV=uv;float cycle=fract(clock*(.019+seed.w*.015)+seed.z);beadAlpha=smoothstep(0.,.12,cycle)*(1.-smoothstep(.73,1.,cycle))*amount;
 vec3 p=vec3(-1.38+seed.x*12.8,.45+seed.y*16.8,-2.72);p.y-=smoothstep(.58,.96,cycle)*(.03+seed.w*.10);p.xy+=position.xy*vec2(.035+seed.z*.048,.05+seed.z*.058);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float night;varying vec2 beadUV;varying float beadAlpha;void main(){vec2 q=(beadUV-.5)*2.;float r=length(q);float edge=smoothstep(.66,.91,r)*(1.-smoothstep(.91,1.,r));float glint=exp(-dot(q-vec2(-.28,.32),q-vec2(-.28,.32))*35.);float a=(edge*.13+glint*.32)*beadAlpha;gl_FragColor=vec4(mix(vec3(.72,.81,.83),vec3(.19,.26,.33),night),a);}`});
 const beads=new T.Mesh(dg,dm);beads.name='Sparse beads on outer window glass';beads.frustumCulled=false;root.add(beads);meshes.push(beads);
 let current=0,previous=null;
 return {update(seconds,target,night){const dt=previous===null?0:Math.min(.1,Math.max(0,seconds-previous));previous=seconds;current+=(target-current)*(1-Math.exp(-dt/2));U.clock.value=reducedMotion?0:seconds;U.amount.value=current;U.night.value=night;root.visible=current>.001;return current;},getState:()=>({amount:current,bands:3,outsideZ:[-3.7,-17],instances:5500,glassBeads:42,reducedMotion}),dispose(){root.removeFromParent();meshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});}};
}
