import * as THREE from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {SAVE_KEY,dayKey,loadStorage,persist,isLocked,eyeSequence} from './state.js';
import {createLocalLighting} from './local-lighting.js';
import {createCrystal} from './crystal.js';
import {canGlow,nightAmount} from './crystal-state.js';
import {commitWater,commitChoice,GARDEN_LOCK} from './garden-store.js';
import {PLANTS,plantById} from './plants.js';
import {makeRoom,makePlant} from './scenery.js';
import {refineMaterials} from './materials.js';
import {setupDaylight,loadEnvironmentTextures} from './daylight.js';
import {installCameraDrag} from './camera-control.js';
import {growthForDays,growthStage,PREVIEW_DAYS,normalizeGrowthDays} from './growth.js';
const $=id=>document.getElementById(id),canvas=$('scene'),wrap=canvas.parentElement;
let storage;try{storage=window.localStorage;}catch{}
let loaded=loadStorage(storage),save=loaded.save,blocked=loaded.status==='future';
let crystal,localLighting;
let ready=false,actor,eyes=[],leaves=[],stems=[],mini,scene,renderer,camera,env;
let tap={side:null,at:-100},waterAt=-100,waterRepeat=0,shakeAt=-100,easterAt=-100,easterVariant=0,sequence={n:0,last:0},lastShake=-100;
let now=0,nextBlink=3.8,blinkAt=-100,motionOn=false,visibilityPaused=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const base=new Map();function remember(o){base.set(o,{p:o.position.clone(),r:o.rotation.clone(),s:o.scale.clone()});return o;}
let messageTimer;function message(text){$('message').textContent=text;$('message').style.opacity=1;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('message').style.opacity=0,4500);}
function storageStatus(ok){$('save-note').textContent=ok?'':'Your garden could not be saved. Progress has not advanced. Please try again.';}
if(loaded.status==='unavailable')storageStatus(false);
if(loaded.status==='corrupt'){$('save-note').textContent='Your old save could not be read. You can begin a new garden.';try{storage.setItem(SAVE_KEY+'.backup',storage.getItem(SAVE_KEY));}catch{}}
if(blocked){$('loading').textContent='Please open the latest version to load this garden.';}
const launchPreview=new URLSearchParams(location.search).get('preview')==='growth';
let previewSpecies=new URLSearchParams(location.search).get('species')||'pothos';
let previewDay=null,selected=save?.selectedPlant||'pothos',plantRoot;const plants=new Map();
function updateCare(){if(!save)return;if(previewDay!==null){$('garden-name').textContent=plantById(previewSpecies).name+' · growth preview';return;}$('water').querySelector('span').textContent=save.lastWateringDate===dayKey()?'A little more water?':'Water your plant';$('garden-name').textContent=save.plantName||plantById(save.selectedPlant).name;}
function persistSave(){const ok=persist(storage,save);storageStatus(ok);return ok;}
function swapPlant(id,days){if(!actor)return;crystal?.setDays(days??(id===save?.selectedPlant?save.wateringCount:0));const stage=growthStage(days??(id===save?.selectedPlant?save.wateringCount:0)),key=id+':'+stage;const original=actor.getObjectByName('SourcePothosSeedling');if(original)original.visible=false;for(const [k,p]of plants)p.visible=k===key;if(!plants.has(key)){const p=makePlant(id,stage);actor.add(p);localLighting?.register(p);plants.set(key,p);}plantRoot=plants.get(key);leaves=[];stems=[];plantRoot.traverse(o=>{if(o.name.startsWith('LeafPivot_'))leaves.push(base.has(o)?o:remember(o));});}
function previewGrowth(day=0,species=previewSpecies){previewSpecies=plantById(species).id;speciesPreview.value=previewSpecies;if(!ready||blocked)return;previewDay=normalizeGrowthDays(Number(day));$('details').close();$('welcome').hidden=true;wrap.inert=false;document.body.classList.add('previewing');$('growth-preview').hidden=false;$('water').disabled=true;swapPlant(previewSpecies,previewDay);const g=growthForDays(previewDay);$('preview-title').textContent=g.name;$('preview-day-label').textContent=previewDay+' watering days';$('preview-description').textContent=g.description;$('preview-range').value=previewDay;document.querySelectorAll('[data-preview-day]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.previewDay)===previewDay)));updateCare();}
function closePreview(){previewDay=null;$('growth-preview').hidden=true;document.body.classList.remove('previewing');const url=new URL(location.href);url.searchParams.delete('preview');url.searchParams.delete('day');history.replaceState(null,'',url);if(save?.selectedPlant)enterGarden();else home();}
const speciesPreview=document.createElement('select');speciesPreview.setAttribute('aria-label','Preview plant species');speciesPreview.style.cssText='max-width:100%;padding:8px;margin-bottom:6px;border:1px solid #bac7aa;border-radius:8px;background:#f5f5ec;color:#314b31';for(const p of PLANTS){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;speciesPreview.append(o);}speciesPreview.value=plantById(previewSpecies).id;speciesPreview.onchange=()=>previewGrowth(previewDay||0,speciesPreview.value);$('preview-title').before(speciesPreview);
PREVIEW_DAYS.forEach(day=>{const b=document.createElement('button');b.type='button';b.dataset.previewDay=day;b.textContent=day;b.setAttribute('aria-label','Preview '+day+' watering days');b.onclick=()=>previewGrowth(day);$('preview-days').append(b);});
$('preview-range').oninput=e=>previewGrowth(e.target.value);$('exit-preview').onclick=closePreview;$('open-growth-preview').onclick=()=>previewGrowth(save?.wateringCount||0,save?.selectedPlant||selected);

function showChoice(id){selected=id;const p=plantById(id);document.querySelectorAll('#species button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));$('species-name').textContent=p.name+' ('+p.thai+')';$('latin').textContent=p.latin;$('plant-detail').textContent=p.detail;swapPlant(id);}
const leafIcons=['M22 43C3 30 5 10 18 17Q23 5 32 13C46 24 32 39 22 43','M22 45C0 28 8 9 22 9C37 9 44 30 22 45','M22 44C3 40 3 11 21 10C40 9 43 40 22 44','M22 5 40 40 24 34 6 42Z','M22 46 16 3 25 8 27 42 33 13 38 19 30 47Z'];
PLANTS.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.dataset.id=p.id;b.setAttribute('aria-label',p.name);b.innerHTML=`<svg viewBox="0 0 46 54" aria-hidden="true"><path d="${leafIcons[i]}" fill="${p.color}"/><path d="M22 46 22 20" stroke="#c4cdb0" fill="none"/></svg><span>${p.name.replace('Mini ','')}</span>`;b.onclick=()=>showChoice(p.id);$('species').append(b);});
function home(){if(blocked)return;if(previewDay!==null){closePreview();return home();}wrap.inert=true;const locked=isLocked(save);$('welcome').hidden=false;$('return').hidden=!save.selectedPlant;$('choose-form').hidden=locked&&!!save.plantName;$('home-title').textContent=locked?'A little life, together.':'Someone green. Something yours.';$('home-intro').textContent=locked?`${save.plantName||'Your plant'} · ${save.wateringCount} of 45 watering days. Your plant stays with you until this journey is complete.`:'Pick a little plant to share your days with.';document.querySelectorAll('#species button').forEach(b=>b.disabled=locked&&b.dataset.id!==save.selectedPlant);$('plant-name').value=save.plantName||'';showChoice(save.selectedPlant||selected);$('begin').textContent=locked?'Save its name':save.selectedPlant?'Begin a new journey':'Let’s grow together';}
function enterGarden(){if(!save.selectedPlant)return;wrap.inert=false;$('welcome').hidden=true;swapPlant(save.selectedPlant);$('water').disabled=false;eyes.forEach((_,i)=>$(i?'eye-right':'eye-left').disabled=false);updateCare();}
function acceptCommit(outcome){
 if(outcome.status==='future'){blocked=true;$('water').disabled=true;message('Please open the latest version to continue.');return false;}
 if(outcome.status==='unavailable'||outcome.status==='write-failed'){storageStatus(false);message('Could not save. Your progress has not advanced. Please try again.');return false;}
 if(outcome.status==='corrupt'){message('Your saved garden could not be read. Please reload to recover it.');return false;}
 if(outcome.save)save=outcome.save;
 if(outcome.persisted)storageStatus(true);
 return outcome.persisted;
}
async function start(e){
 e?.preventDefault();if(blocked||!ready)return;
 const commit=()=>{if(previewDay!==null)return;const outcome=commitChoice(storage,selected,$('plant-name').value);
  if(!acceptCommit(outcome)){if(outcome.status==='rejected'){if(outcome.result.reason==='locked'){home();message('Your plant stays with you for 45 watering days.');}else $('plant-name').reportValidity();}return;}
  enterGarden();message('Hello, '+save.plantName+'. Make yourself at home.');
 };
 if(navigator.locks)await navigator.locks.request(GARDEN_LOCK,commit);else commit();
}
$('choose-form').addEventListener('submit',start);$('home').onclick=home;$('return').onclick=enterGarden;
$('info').onclick=()=>{if(!save?.selectedPlant)return home();const p=plantById(save.selectedPlant);$('detail-name').textContent=save.plantName||p.name;$('detail-species').textContent=p.name+' · '+p.latin;$('detail-copy').textContent=p.detail;$('detail-progress').textContent=save.wateringCount+' / 45 watering days together'+(' · '+growthForDays(save.wateringCount).name);$('details').showModal();};$('close-details').onclick=()=>$('details').close();
async function doWater(){
 if(previewDay!==null||!ready||blocked||!save?.selectedPlant)return;
 const commit=()=>{
  if(previewDay!==null)return;
  const outcome=commitWater(storage);
  if(!acceptCommit(outcome)){if(outcome.status==='unchanged'&&!save?.selectedPlant)home();return;}
  const result=outcome.result;waterAt=now;waterRepeat=result.repeats;swapPlant(save.selectedPlant);updateCare();
  message(result.advanced?(outcome.transition.completedNow?'Forty-five little visits. Look how you have grown.':'A little drink. Thank you.'):waterRepeat===2?'Oh… another little drink?':waterRepeat===3?'I think my eyes are floating.':'A plant, or a tiny pond?');
 };
 if(navigator.locks)await navigator.locks.request(GARDEN_LOCK,commit);else commit();
}
$('water').addEventListener('click',doWater);
function tapEye(side){if(!ready||blocked||!save?.selectedPlant)return;tap={side,at:now};sequence=eyeSequence(sequence,side,performance.now());if(sequence.triggered&&now-easterAt>5){easterAt=now;easterVariant=Math.random()<.5?0:1;}}
$('eye-left').addEventListener('click',()=>tapEye('Left'));$('eye-right').addEventListener('click',()=>tapEye('Right'));
function shake(){if(!ready||!save?.selectedPlant||now-lastShake<1.4)return;shakeAt=now;lastShake=now;message('Oh. A little dizzy.');}
async function enableMotion(){
 if(!window.isSecureContext){message('Shake needs HTTPS on your phone. You can still touch Wobble’s eyes.');return;}
 if(!('DeviceMotionEvent' in window)){message('Shake is unavailable here. Try touching Wobble’s eyes.');return;}
 try{if(typeof DeviceMotionEvent.requestPermission==='function'){const p=await DeviceMotionEvent.requestPermission();if(p!=='granted'){message('Shake is off. You can still touch Wobble’s eyes.');return;}}
 if(!motionOn){window.addEventListener('devicemotion',motion,{passive:true});motionOn=true;}
 $('motion').setAttribute('aria-label','Shake enabled');message('Give your phone a gentle shake.');
 }catch{message('Shake is unavailable right now. Try touching Wobble’s eyes.');}
}
let gravityPrev=null;
function motion(e){if(document.hidden)return;const a=e.acceleration;let magnitude=0;if(a&&[a.x,a.y,a.z].every(Number.isFinite)){magnitude=Math.hypot(a.x,a.y,a.z);}else{const g=e.accelerationIncludingGravity;if(!g||![g.x,g.y,g.z].every(Number.isFinite))return;const current=[g.x,g.y,g.z];if(gravityPrev)magnitude=Math.hypot(...current.map((n,i)=>n-gravityPrev[i]));gravityPrev=current;}
 if(magnitude>11)shake();}
$('motion').addEventListener('click',enableMotion);
window.addEventListener('storage',e=>{
 if(e.key!==SAVE_KEY&&e.key!==null)return;
 const r=loadStorage(storage);
 if(r.status==='future'){blocked=true;$('water').disabled=true;message('Please open the latest version of this garden.');return;}
 if(['new','loaded','migrated'].includes(r.status)){
  save=r.save;updateCare();if(previewDay!==null)return;
  if(!save.selectedPlant||!$('welcome').hidden)home();else enterGarden();
 }
});
setInterval(updateCare,15000);
const drops=[],ripples=[];
async function boot(){
 if(blocked)return;
 try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
 scene=new THREE.Scene();setupDaylight(scene,renderer);
 camera=new THREE.PerspectiveCamera(34,1,.1,40);camera.position.set(.25,3.4,8.8);camera.lookAt(0,1.8,0);

 const loader=new GLTFLoader();const g=await loader.loadAsync('./public/assets/models/wobble-pothos-v03.glb');
 actor=g.scene;env=makeRoom(await loadEnvironmentTextures());scene.add(actor,env);crystal=createCrystal({reducedMotion:reduced});scene.add(crystal.root);
 // Ignore any non-game source objects; export verification also checks the inventory.
 for(const root of [actor,env]){const discard=[];root.traverse(o=>{if(o.name==='Cube'||o.isCamera||o.isLight)discard.push(o);if(o.isMesh){o.castShadow=!o.userData.noShadow;o.receiveShadow=!o.userData.noShadow;if(o.name.startsWith('Leaf'))o.material.side=THREE.DoubleSide;}});discard.forEach(o=>o.removeFromParent());}
 actor.rotation.y=-.08;refineMaterials(actor);localLighting=createLocalLighting(scene,renderer,env);localLighting.register(actor);const sourcePlant=actor.getObjectByName('PothosSeedling');sourcePlant.name='SourcePothosSeedling';sourcePlant.visible=false;
 eyes=['Left','Right'].map(side=>({side,rig:remember(actor.getObjectByName('EyeRig'+side)),pupil:remember(actor.getObjectByName('Pupil'+side)),white:actor.getObjectByName('Eye'+side)}));
 actor.traverse(o=>{if(o.name.startsWith('LeafPivot_'))leaves.push(remember(o));if(o.name.startsWith('Stem_'))stems.push(remember(o));});
 // A small, original Wobble guest, made from the same approved pot silhouette.
 mini=new THREE.Group();for(const name of ['Pot','EyeRigLeft','EyeRigRight'])mini.add(actor.getObjectByName(name).clone(true));mini.scale.setScalar(.24);mini.visible=false;scene.add(mini);
 const waterMat=new THREE.MeshPhysicalMaterial({color:'#97bfd0',transparent:true,opacity:.72,roughness:.2});
 for(let i=0;i<20;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),waterMat);d.scale.y=1.7;d.visible=false;scene.add(d);drops.push(d);}
 for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.1,.009,5,32),new THREE.MeshBasicMaterial({color:'#9cbcd0',transparent:true,opacity:.5}));r.rotation.x=-Math.PI/2;r.position.y=1.58;r.visible=false;scene.add(r);ripples.push(r);}
 new ResizeObserver(resize).observe(wrap);resize();ready=true;$('loading').hidden=true;$('loading').style.display='none';$('water').disabled=!save.selectedPlant;eyes.forEach((_,i)=>$(i?'eye-right':'eye-left').disabled=!save.selectedPlant);if(launchPreview)previewGrowth(new URLSearchParams(location.search).get('day')||0);else if(save.selectedPlant&&save.plantName)enterGarden();else home();if(loaded.status==='migrated'&&!launchPreview)persistSave();updateCare();if(save.selectedPlant&&$('welcome').hidden&&previewDay===null)message('Drag gently to look around.');
 requestAnimationFrame(frame);
 }catch(err){console.error(err);$('loading').innerHTML='Could not open your garden. <button id="retry">Try again</button>';$('retry').onclick=()=>location.reload();}
}
function resize(){if(!renderer)return;const r=wrap.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
function targets(){if(!actor)return;eyes.forEach(({rig},i)=>{const p=rig.getWorldPosition(new THREE.Vector3()).project(camera);const b=$(i?'eye-right':'eye-left');b.style.left=`${(p.x*.5+.5)*wrap.clientWidth}px`;b.style.top=`${(-p.y*.5+.5)*wrap.clientHeight}px`;});}
let pan={x:0,y:0},smoothPan={x:0,y:0};
installCameraDrag(wrap,{enabled:()=>ready&&!blocked&&$('welcome').hidden&&!$('details').open,onChange:p=>{pan=p;},onFirstDrag:()=>message('A little look around.')});
let crystalPointer=null;
wrap.addEventListener('pointerdown',e=>{if(e.target!==canvas||!e.isPrimary)return;crystalPointer={x:e.clientX,y:e.clientY,id:e.pointerId};});
wrap.addEventListener('pointerup',e=>{
 const start=crystalPointer;crystalPointer=null;
 if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>6||previewDay!==null||blocked||!ready||!$('welcome').hidden||$('details').open||!crystal.root.visible)return;
 const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
 const nearCrystal=crystal.getTapPositions().some(position=>{const p=position.project(camera);return Math.hypot(e.clientX-rect.left-(p.x*.5+.5)*rect.width,e.clientY-rect.top-(-p.y*.5+.5)*rect.height)<=22;});
 if(!ray.intersectObjects(crystal.targets(),false).length&&!nearCrystal)return;
 const latest=loadStorage(storage);if(!['loaded','migrated'].includes(latest.status))return;
 crystal.tap(latest.save,now);
});
wrap.addEventListener('pointercancel',()=>{crystalPointer=null;});
window.addEventListener('focus',()=>localLighting?.update(new Date(),true));
window.addEventListener('pageshow',()=>localLighting?.update(new Date(),true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)localLighting?.update(new Date(),true);});
let lastFrame=0,lastTime=0;
function frame(ms){requestAnimationFrame(frame);if(document.hidden){lastTime=ms;return;}if(ms-lastFrame<1000/30)return;const dt=Math.min(.08,(ms-lastTime)/1000||0);lastTime=ms;lastFrame=ms;now+=dt;
 localLighting?.update();
 crystal?.update(now,{eligible:previewDay===null&&canGlow(save),darkness:nightAmount()});
 const wt=now-waterAt,st=now-shakeAt,et=now-easterAt,freeze=et>=0&&et<.5;
 if(now>nextBlink){blinkAt=now;nextBlink=now+4+Math.random()*5;}
 const bt=now-blinkAt;let blink=bt<.2?1-.94*Math.sin(Math.PI*bt/.2):1;
 if(freeze)blink=1;
 for(const {side,rig,pupil} of eyes){const b=base.get(rig),p=base.get(pupil);rig.scale.copy(b.s);rig.scale.y*=blink;pupil.position.copy(p.p);rig.rotation.copy(b.r);
 if(!freeze){
  const idle=reduced?0:Math.sin(now*.37)*.014;pupil.position.x+=idle;
  if(wt<2.2){pupil.position.y+=.045;if(waterRepeat>=3){pupil.position.x+=(side==='Left'?.065:-.065);rig.rotation.z=(side==='Left'?1:-1)*.1*Math.sin(wt*7);}else if(waterRepeat===2)pupil.position.x+=.035;}
  if(now-tap.at<.55&&tap.side===side){const a=Math.sin((now-tap.at)/.55*Math.PI);rig.scale.multiplyScalar(1+a*.1);pupil.position.x+=a*.045;}
  if(st<1.5){const a=(1-st/1.5)*.065;pupil.position.x+=Math.cos(st*19)*a;pupil.position.y+=Math.sin(st*19)*a;}
 }
 }
 leaves.forEach((o,i)=>{const b=base.get(o);o.rotation.copy(b.r);if(!freeze){const wind=reduced?0:.021*(o.userData.stiffness??1)*(.55+.45*Math.sin(now*.17)**2);o.rotation.x+=wind*Math.sin(now*(.63+i*.07)+i*1.9)+wind*.35*Math.sin(now*.29+i);o.rotation.z+=wind*.5*Math.sin(now*.55+i*.8);if(wt<2.2)o.rotation.x+=.045*(o.userData.stiffness??1)*Math.sin(wt*11+i)*Math.exp(-wt*2);if(st<1.5)o.rotation.x+=.05*(o.userData.stiffness??1)*Math.sin(st*9+i)*(1-st/1.5);}});
 stems.forEach((o,i)=>{o.rotation.z=base.get(o).r.z+(reduced?0:.004*Math.sin(now*.7+i));});
 drops.forEach((d,i)=>{d.visible=wt>=0&&wt<2.2;if(d.visible){const t=(wt*1.2+i/20)%1;d.position.set(Math.sin(i*7.7)*.35,3.4-t*1.8,Math.cos(i*4.1)*.3);}});
 ripples.forEach((r,i)=>{r.visible=wt>=.4&&wt<2.5;if(r.visible){const t=(wt+i*.3)%1;r.scale.setScalar(1+t*3);r.material.opacity=(1-t)*.4;}});
 mini.visible=et>=.5&&et<3.9;if(mini.visible){const t=(et-.5)/3.4;mini.position.set(easterVariant===0?-1.65+t*3.3:1.12,-.06+Math.abs(Math.sin(t*Math.PI*4))*.12,-.35);mini.rotation.y=Math.sin(t*8)*.2;if(easterVariant===1)mini.scale.setScalar(.24*Math.sin(Math.PI*t)**.25);else mini.scale.setScalar(.24);}
 const cameraEase=1-Math.exp(-18*dt);smoothPan.x+=(pan.x-smoothPan.x)*cameraEase;smoothPan.y+=(pan.y-smoothPan.y)*cameraEase;const distance=Math.max(11.8,5.2/camera.aspect),yaw=.021+smoothPan.x,pitch=.106+smoothPan.y;camera.position.set(Math.sin(yaw)*distance*Math.cos(pitch),2.15+Math.sin(pitch)*distance,Math.cos(yaw)*distance*Math.cos(pitch));camera.lookAt(0,2.15,0);renderer.render(scene,camera);targets();
}
if(new URLSearchParams(location.search).has('test'))window.__wobble={getState:()=>structuredClone(save),getLighting:()=>localLighting?.getState(),getCrystal:()=>crystal?.getState(),getCrystalScreen:(index=0)=>{const p=(crystal.getTapPositions()[index]||crystal.getTapPosition()).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};},getPlant:()=>plantRoot?.name,getGrowth:()=>({stage:plantRoot?.userData.growthStage,leafCount:plantRoot?.userData.leafCount,previewDay}),previewGrowth,closePreview,exportArtwork:()=>{const current=save.selectedPlant||selected;for(const p of PLANTS)swapPlant(p.id);swapPlant(current);scene.updateMatrixWorld(true);const meshes=[];for(const root of [actor,env])root.traverse(o=>{if(!o.isMesh||o.material.isShaderMaterial)return;let group='Room',parent=o;if(root===actor){group='Wobble';while(parent&&parent!==actor){if(parent.name==='PothosSeedling')group='pothos';if(parent.name.startsWith('Plant_'))group=parent.name.slice(6);parent=parent.parent;}}const g=o.geometry,m=o.material;meshes.push({name:o.name||'Mesh',group,vertices:Array.from(g.attributes.position.array),indices:g.index?Array.from(g.index.array):null,matrix:o.matrixWorld.toArray(),color:m.color?.toArray()||[.5,.5,.5],roughness:m.roughness??.8});});return {selected:current,meshes};},getCamera:()=>camera?.position.toArray(),getOrbit:()=>({...smoothPan}),getTap:()=>({...tap}),tapEye,water:doWater,shake,getReady:()=>ready,getEffects:()=>({waterRepeat,easterActive:now-easterAt<4,shakeActive:now-shakeAt<1.5}),getPerformance:()=>({drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles}),motion};
boot();
