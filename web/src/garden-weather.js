import * as T from 'three';
import {thaiSeason,RAIN_LEVELS} from './weather-state.js';
import {createRainLayer} from './rain-layer.js';
import {createRainAudio} from './rain-audio.js';
import {createLiveWeather} from './live-weather.js';
export function createGardenWeather({scene,room,lighting,storage,music,reducedMotion=false,onChange=()=>{}}){
 const plate=room.getObjectByName('Distant garden photographic plate'),hot=plate.material.map;
 const textures=new Map([['hot',hot]]),rain=createRainLayer(scene,{reducedMotion}),audio=createRainAudio();
 let season='hot',wanted='',loading='',retryAt=0,override=null;
 const live=createLiveWeather({storage,onChange});
 async function seasonUpdate(date){
  const id=override?.season||thaiSeason(date);wanted=id;
  if(id===season||loading||Date.now()<retryAt)return;
  if(textures.has(id)){plate.material.map=textures.get(id);season=id;return;}
  loading=id;
  try{const t=await new T.TextureLoader().loadAsync(new URL('../public/assets/textures/seasons/'+id+'.png',import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.set(id,t);if(wanted===id){plate.material.map=t;season=id;}}
  catch{retryAt=Date.now()+60000; /* Keep the last readable view if offline. */ }
  finally{loading='';}
 }
 const silence=()=>audio.set(rain.getState().amount,music.getState().muted,document.hidden);
 document.addEventListener('visibilitychange',silence);window.addEventListener('pagehide',()=>audio.set(0,true,true));
 live.start();
 const ready=seasonUpdate(new Date());
 return {ready,
  update(seconds,date=new Date()){
   seasonUpdate(date);live.tick();const state=live.getState(),level=override?.rain||state.level;
   const amount=rain.update(seconds,RAIN_LEVELS[level]??0,lighting.getState()?.night||0);
   lighting.setWeather(amount);audio.set(amount,music.getState().muted,document.hidden);
  },unlock:()=>audio.unlock(),setEnabled:live.setEnabled,
  setPreview(value){override=value&&{season:['hot','rainy','cool'].includes(value.season)?value.season:thaiSeason(),rain:value.rain in RAIN_LEVELS?value.rain:'clear'};},
  getState:()=>({season,wanted,...live.getState(),preview:override,rain:rain.getState(),audio:audio.getState()}),
  dispose(){live.dispose();rain.dispose();audio.dispose();for(const [id,t]of textures)if(id!=='hot')t.dispose();}
 };
}
