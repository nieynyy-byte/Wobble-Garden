import {createLightingPreview} from './scene.js';
const loading=document.querySelector('#loading'),nav=document.querySelector('.controls');
try{
 const response=await fetch('./presets.json');if(!response.ok)throw Error('Could not load lighting presets');const presets=await response.json();
 const preview=await createLightingPreview(document.querySelector('#scene'),presets);
 const select=id=>{preview.select(id);const p=presets.find(p=>p.id===id);document.querySelector('#time').textContent=p.label;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));const url=new URL(location.href);url.searchParams.set('time',id);history.replaceState(null,'',url);};
 for(const p of presets){const b=document.createElement('button');b.type='button';b.dataset.id=p.id;b.textContent=p.label;b.onclick=()=>select(p.id);nav.append(b);}
 const requested=new URL(location.href).searchParams.get('time');select(presets.some(p=>p.id===requested)?requested:'night');loading.hidden=true;
 if(new URL(location.href).searchParams.has('test'))window.__lightingPreview=preview;
}catch(error){console.error(error);loading.textContent='Could not load the preview. Please reload this page.';}
