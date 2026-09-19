import * as T from 'three';
import {LIGHTING_PRESETS} from './lighting-presets.js';
import {localLightingTime} from './local-time.js';

export function createLocalLighting(scene,renderer,room){
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

 const fill={value:1},patched=new WeakSet();
 function register(root){root.traverse(o=>{if(!o.isMesh)return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){
  if(!m?.emissiveIntensity||patched.has(m))continue;patched.add(m);
  const previous=m.onBeforeCompile;
  m.onBeforeCompile=shader=>{previous.call(m,shader);shader.uniforms.localTimeFill=fill;shader.fragmentShader='uniform float localTimeFill;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance *= localTimeFill;');};m.needsUpdate=true;
 }});}
 const contact=room.getObjectByName('Tabletop contact shadow');
 contact.material.uniforms.localTimeFill=fill;contact.material.fragmentShader='uniform float localTimeFill;\n'+contact.material.fragmentShader.replace('vec4(.10,.065,.025,a)','vec4(vec3(.10,.065,.025)*localTimeFill,a)');contact.material.needsUpdate=true;
 let lastKey='',current;
 function update(date=new Date(),force=false){
  const time=localLightingTime(date);if(!force&&lastKey===time.key)return;lastKey=time.key;current=time;
  const p=LIGHTING_PRESETS.find(p=>p.id===time.period);
  sun.position.fromArray(p.sun);sun.color.set(p.sunColor);sun.intensity=p.sunPower;sun.castShadow=p.sunPower>.15;
  hemi.color.set(p.skyLight);hemi.intensity=p.ambient;bounce.intensity=p.bounce;
  scene.environmentIntensity=p.environment;city.color.set(p.id==='night'?'#f1d3a8':'#b8c8dd');city.position.set(...(p.id==='night'?[4,3,-8]:[3,4,-12]));city.intensity=p.id==='night'?.52:p.id==='blue-hour'?.020:0;
  scene.background.set(p.skyBottom);renderer.toneMappingExposure=1.08;
  U.outdoorGain.value=p.outdoor;U.gradeTop.value.set(p.gradeTop);U.gradeBottom.value.set(p.gradeBottom);U.contrast.value=p.contrast;U.desaturate.value=p.desaturate;U.nightLevel.value=p.night;fill.value=p.emissive;

 }
 update();
 return {register,update,getState:()=>({...current,sunPower:sun.intensity,ambient:hemi.intensity,night:U.nightLevel.value})};
}
