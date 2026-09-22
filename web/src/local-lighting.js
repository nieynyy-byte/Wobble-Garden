import * as T from 'three';
import {LIGHTING_PRESETS} from './lighting-presets.js';
import {localLightingTime,localLightingBlend} from './local-time.js';
import {moonPhase} from './moon-phase.js';
import {createLeafShadows,installExteriorAtmosphere} from './window-atmosphere.js';

export function createLocalLighting(scene,renderer,room,{reducedMotion=false}={}){
 const sun=scene.getObjectByName('Morning sun from garden'),bounce=scene.getObjectByName('Warm room bounce'),hemi=scene.children.find(o=>o.isHemisphereLight);
 const moon=new T.DirectionalLight('#c0d0e6',0);moon.name='Moonlight through window';moon.position.set(3,9,-12);scene.add(moon);
 const plate=room.getObjectByName('Distant garden photographic plate');
 const U=installExteriorAtmosphere(plate),leaves=createLeafShadows(scene,{reducedMotion});
 const presets=Object.fromEntries(LIGHTING_PRESETS.map(p=>[p.id,p]));
 const c1=new T.Color(),c2=new T.Color();
 const fill={value:1},patched=new WeakSet();
 function register(root){root.traverse(o=>{if(!o.isMesh)return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){
  if(!m?.emissiveIntensity||patched.has(m))continue;patched.add(m);
  const previous=m.onBeforeCompile;
  m.onBeforeCompile=shader=>{previous.call(m,shader);shader.uniforms.localTimeFill=fill;shader.fragmentShader='uniform float localTimeFill;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance *= localTimeFill;');};m.needsUpdate=true;
 }});}
 const contact=room.getObjectByName('Tabletop contact shadow');
 contact.material.uniforms.localTimeFill=fill;contact.material.fragmentShader='uniform float localTimeFill;\n'+contact.material.fragmentShader.replace('vec4(.10,.065,.025,a)','vec4(vec3(.10,.065,.025)*localTimeFill,a)');contact.material.needsUpdate=true;
 let lastKey='',current,weather=0;
 function update(date=new Date(),force=false){
  const time=localLightingTime(date),key=time.key+':'+date.getSeconds()+':'+weather.toFixed(2);
  if(!force&&lastKey===key)return;lastKey=key;
  const blend=localLightingBlend(date),a=presets[blend.from],b=presets[blend.to],x=blend.mix;
  const scalar=k=>T.MathUtils.lerp(a[k],b[k],x);
  const color=(target,k)=>target.copy(c1.set(a[k])).lerp(c2.set(b[k]),x);
  sun.position.fromArray(a.sun).lerp(new T.Vector3().fromArray(b.sun),x);
  color(sun.color,'sunColor');sun.intensity=scalar('sunPower');sun.castShadow=sun.intensity>.15;
  color(hemi.color,'skyLight');hemi.intensity=scalar('ambient');bounce.intensity=scalar('bounce');
  scene.environmentIntensity=scalar('environment');
  const lunar=moonPhase(date),darkness=scalar('night');
  // Exterior lunar fill only; no lit buildings or interior lamp.
  moon.intensity=darkness*(.055+.24*lunar.illumination);
  color(scene.background,'skyBottom');renderer.toneMappingExposure=1.08;
  U.outdoorGain.value=scalar('outdoor');color(U.gradeTop.value,'gradeTop');color(U.gradeBottom.value,'gradeBottom');
  color(U.skyTop.value,'skyTop');color(U.skyBottom.value,'skyBottom');
  U.contrast.value=scalar('contrast');U.desaturate.value=scalar('desaturate');U.nightLevel.value=darkness;fill.value=scalar('emissive');
  U.moonLight.value.fromArray(lunar.light);U.moonIllumination.value=lunar.illumination;
  sun.intensity*=Math.exp(-weather*7);sun.castShadow=sun.intensity>.15;sun.shadow.radius=3+weather*5;
  hemi.intensity*=1-weather*.12;bounce.intensity*=1-weather*.25;moon.intensity*=1-weather*.7;
  U.weatherAmount.value=weather;U.outdoorGain.value*=1-weather*.32;U.desaturate.value=Math.min(.75,U.desaturate.value+weather*.12);
  current={...time,blend,weather,moonPhase:lunar.phase,moonIllumination:lunar.illumination};
 }
 update();
 return {register,update,setWeather:value=>{weather=T.MathUtils.clamp(value,0,1);},animate:seconds=>leaves.update(seconds,sun.intensity),getState:()=>({...current,sunPower:sun.intensity,ambient:hemi.intensity,night:U.nightLevel.value,moonPower:moon.intensity,leafShadows:leaves.getState()})};
}
