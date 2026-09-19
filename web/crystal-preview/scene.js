export async function createLightingPreview(canvas, presets){
 const T=await import('three');
 const {createCrystal}=await import('/src/crystal.js');
 const {dayKey}=await import('/src/state.js');
 const {growthStage}=await import('/src/growth.js');
 const reviewDay=Number(new URL(location.href).searchParams.get('day')||45);
 const crystal=createCrystal();crystal.setDays(reviewDay);
 const reviewSave={selectedPlant:'pothos',wateringCount:reviewDay,lastWateringDate:dayKey()};
 const {makeRoom,makePlant}=await import('/src/scenery.js');
 const {setupDaylight,loadEnvironmentTextures}=await import('/src/daylight.js');
 const {GLTFLoader}=await import('/vendor/GLTFLoader.js');
 const {refineMaterials}=await import('/src/materials.js');
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;
 const scene=new T.Scene();setupDaylight(scene,renderer);
 const room=makeRoom(await loadEnvironmentTextures());scene.add(room);
 const actor=(await new GLTFLoader().loadAsync('/public/assets/models/wobble-pothos-v03.glb')).scene;
 actor.getObjectByName('PothosSeedling').visible=false;
 actor.add(makePlant('pothos',growthStage(reviewDay)));actor.rotation.y=-.08;refineMaterials(actor);scene.add(actor);scene.add(crystal.root);
 scene.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=!o.userData.noShadow;});
 const camera=new T.PerspectiveCamera(34,430/932,.1,40),distance=11.8,yaw=.021,pitch=.106;
 camera.position.set(Math.sin(yaw)*distance*Math.cos(pitch),2.15+Math.sin(pitch)*distance,Math.cos(yaw)*distance*Math.cos(pitch));camera.lookAt(0,2.15,0);
 const sun=scene.getObjectByName('Morning sun from garden'),bounce=scene.getObjectByName('Warm room bounce'),hemi=scene.children.find(o=>o.isHemisphereLight);
 // Outside-only indirect city light, no interior source at night.
 const city=new T.DirectionalLight('#f1d3a8',0);city.position.set(4,3,-8);scene.add(city);
 const plate=room.getObjectByName('Distant garden photographic plate');
 const U={outdoorGain:{value:1},gradeTop:{value:new T.Color()},gradeBottom:{value:new T.Color()},contrast:{value:1},desaturate:{value:0},nightLevel:{value:0}};
 plate.material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,U);
  shader.fragmentShader='uniform float outdoorGain; uniform vec3 gradeTop; uniform vec3 gradeBottom; uniform float contrast; uniform float desaturate; uniform float nightLevel;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 original=diffuseColor.rgb;
   float lum=dot(original,vec3(.2126,.7152,.0722));
   // Continuous exposure/color grading preserves cloud and tree edges exactly.
   vec3 atmosphere=mix(gradeBottom,gradeTop,smoothstep(.35,.95,vMapUv.y));
   vec3 graded=mix(original,vec3(lum),desaturate);
   vec3 exterior=pow(max(graded,vec3(0.)),vec3(contrast))*outdoorGain*atmosphere;
   // Same existing buildings: only a sparse subset of windows emit faint light.
   vec2 uv=vMapUv;
   float cityMask=0.;
   cityMask+=step(.420,uv.x)*step(uv.x,.450)*step(.441,uv.y)*step(uv.y,.495);
   cityMask+=step(.492,uv.x)*step(uv.x,.527)*step(.426,uv.y)*step(uv.y,.526);
   cityMask+=step(.624,uv.x)*step(uv.x,.641)*step(.430,uv.y)*step(uv.y,.551);
   cityMask+=step(.663,uv.x)*step(uv.x,.688)*step(.420,uv.y)*step(uv.y,.497);
   vec2 grid=uv*vec2(480.,300.);vec2 cell=fract(grid);
   float rnd=fract(sin(dot(floor(grid),vec2(12.9898,78.233)))*43758.5453);
   float windows=step(.57,rnd)*exp(-dot((cell-vec2(.43))*vec2(5.,4.),(cell-vec2(.43))*vec2(5.,4.)));
   float notFoliage=1.-smoothstep(.02,.075,original.g-max(original.r,original.b));
   exterior+=cityMask*notFoliage*windows*vec3(.22,.15,.078)*nightLevel;
   diffuseColor.rgb=exterior;
  `);
 };
 // Existing leaves use emissive fill as an artistic daylight approximation.
 // Attenuate that lighting contribution only in this isolated preview.
 const fill={value:1};const patched=new Set();actor.traverse(o=>{
  if(!o.isMesh)return;const m=o.material;
  if(m.emissiveIntensity>0&&!patched.has(m)){
   patched.add(m);const previous=m.onBeforeCompile;
   m.onBeforeCompile=shader=>{previous.call(m,shader);shader.uniforms.studyFill=fill;shader.fragmentShader='uniform float studyFill;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance *= studyFill;');};
  }
 });
 const contact=room.getObjectByName('Tabletop contact shadow');
 contact.material.uniforms.studyFill=fill;contact.material.fragmentShader='uniform float studyFill;\n'+contact.material.fragmentShader.replace('vec4(.10,.065,.025,a)','vec4(vec3(.10,.065,.025)*studyFill,a)');
 scene.updateMatrixWorld(true);
 let current,animation=0,until=0;
 function animate(){const time=performance.now()/1000;crystal.update(time,{eligible:true,darkness:current?.night||0});renderer.render(scene,camera);if(time<until)animation=requestAnimationFrame(animate);else animation=0;}
 function pulse(){const time=performance.now()/1000;if(crystal.tap(reviewSave,time)){until=time+5.7;if(!animation)animate();}}
 canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect();if(crystal.getTapPositions().some(point=>{const p=point.project(camera);return Math.hypot(e.clientX-r.left-(p.x*.5+.5)*r.width,e.clientY-r.top-(-p.y*.5+.5)*r.height)<48;}))pulse();});

 function apply(p){
  current=p;
  sun.position.fromArray(p.sun);sun.color.set(p.sunColor);sun.intensity=p.sunPower;sun.castShadow=p.sunPower>.15;
  hemi.color.set(p.skyLight);hemi.intensity=p.ambient;bounce.intensity=p.bounce;
  scene.environmentIntensity=p.environment;city.color.set(p.id==='night'?'#f1d3a8':'#b8c8dd');city.position.set(...(p.id==='night'?[4,3,-8]:[3,4,-12]));city.intensity=p.id==='night'?.52:p.id==='blue-hour'?.020:0;
  scene.background.set(p.skyBottom);renderer.toneMappingExposure=1.08;
  U.outdoorGain.value=p.outdoor;U.gradeTop.value.set(p.gradeTop);U.gradeBottom.value.set(p.gradeBottom);U.contrast.value=p.contrast;U.desaturate.value=p.desaturate;U.nightLevel.value=p.night;fill.value=p.emissive;
  crystal.update(performance.now()/1000,{eligible:true,darkness:p.night});renderer.render(scene,camera);if(new URL(location.href).searchParams.has('glow'))pulse();
 }
 function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);if(current)renderer.render(scene,camera);}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {select:id=>{const p=presets.find(x=>x.id===id);if(p)apply(p);},getState:()=>({crystal:crystal.getState(),time:current?.id,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),dispose:()=>{observer.disconnect();cancelAnimationFrame(animation);crystal.dispose();renderer.dispose();}};
}
