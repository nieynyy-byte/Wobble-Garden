import {rainFromCurrent} from './weather-state.js';
const REFRESH=15*60e3,STALE=45*60e3,KEY='wobble-garden.local-weather.v1';
// Location stays in memory, rounded to ~1 km for the weather provider.
export function createLiveWeather({storage,geo=navigator.geolocation,fetcher=fetch,clock=()=>Date.now(),onChange=()=>{}}={}){
 let enabled=false,busy=false,next=0,last=0,level='clear',status='off',generation=0,controller;
 try{enabled=storage?.getItem(KEY)==='true';}catch{}
 const state=()=>({enabled,status,level,updatedAt:last||null,source:'Open-Meteo'});
 const notify=()=>onChange(state());
 async function refresh(){
  if(!enabled||busy||clock()<next)return;
  busy=true;status='locating';notify();const token=++generation;next=clock()+REFRESH;
  try{
   if(!geo)throw new Error('Location unavailable');
   const pos=await new Promise((resolve,reject)=>geo.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:10000,maximumAge:REFRESH}));
   if(token!==generation)return;
   const lat=Number(pos.coords.latitude.toFixed(2)),lon=Number(pos.coords.longitude.toFixed(2));
   const endpoint=globalThis.WOBBLE_WEATHER_ENDPOINT||'https://api.open-meteo.com/v1/forecast';
   const url=new URL(endpoint,location.href);url.search=new URLSearchParams({latitude:lat,longitude:lon,current:'weather_code,rain,showers',timezone:'auto'});
   controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
   let data;try{const response=await fetcher(url,{signal:controller.signal});if(!response.ok)throw new Error('Weather unavailable');data=await response.json();}finally{clearTimeout(timer);}
   if(token!==generation)return;
   level=rainFromCurrent(data.current);last=clock();status='live';
  }catch(error){if(token!==generation)return;status=error?.code===1?'denied':'unavailable';if(!last||clock()-last>=STALE)level='clear';}
  finally{if(token===generation){busy=false;notify();}}
 }
 function setEnabled(value){enabled=!!value;generation++;controller?.abort();busy=false;next=0;
  try{storage?.setItem(KEY,String(enabled));}catch{}
  if(enabled)refresh();else{level='clear';last=0;status='off';notify();}
 }
 function tick(){if(last&&clock()-last>=STALE){last=0;level='clear';status='stale';notify();}if(enabled&&!document.hidden)refresh();}
 return {setEnabled,tick,getState:state,start(){if(enabled)refresh();else notify();},dispose(){generation++;controller?.abort();enabled=false;}};
}
