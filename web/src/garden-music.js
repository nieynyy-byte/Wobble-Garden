import {MUSIC_TRACKS,NIGHT_BUGS,MORNING_BED} from './music-tracks.js';
export function musicPeriod(date=new Date()){const minute=date.getHours()*60+date.getMinutes();return minute>=360&&minute<1080?'morning':minute>=1080&&minute<1200?'evening':'night';}
export function createGardenMusic({storage,audio=new Audio(),ambience=new Audio(),clock=()=>new Date(),onChange=()=>{}}={}){
 const key='wobble-garden.music-muted.v1';let muted=false,unlocked=false,hidden=false,period=null,index=0,playing=false,fade=null,failures=0,request=0;
 try{muted=storage?.getItem(key)==='true';}catch{}
 audio.preload='none';audio.volume=0;audio.loop=true;
 ambience.preload='none';ambience.src=NIGHT_BUGS;ambience.loop=true;ambience.volume=0;
 let layerPlaying=false,layerPeriod=null,layerRequest=0;
 function syncLayer(){const wanted=period==='night'?'night':period==='morning'?'morning':null;
  if(wanted!==layerPeriod){layerRequest++;ambience.pause();ambience.volume=0;layerPlaying=false;layerPeriod=wanted;if(wanted)ambience.src=wanted==='night'?NIGHT_BUGS:MORNING_BED;}
  if(!wanted||!unlocked||muted||hidden){layerRequest++;ambience.pause();ambience.volume=0;layerPlaying=false;return;}
  ambience.volume=Math.min(wanted==='morning'?.045:.10,ambience.volume+.005);
  if(!layerPlaying){layerPlaying=true;const id=++layerRequest;Promise.resolve(ambience.play()).catch(()=>{if(id===layerRequest)layerPlaying=false;});}
 }
 function state(){return {period,index,title:period?MUSIC_TRACKS[period][index].title:null,muted,unlocked,playing,paused:audio.paused,bugsPlaying:layerPeriod==='night'&&layerPlaying,bugsVolume:layerPeriod==='night'?ambience.volume:0,morningMusicPlaying:layerPeriod==='morning'&&layerPlaying,morningMusicVolume:layerPeriod==='morning'?ambience.volume:0};}

 function notify(){syncLayer();onChange(state());}
 function source(next){request++;playing=false;period=next;index=0;audio.src=MUSIC_TRACKS[period][index].url;audio.volume=0;}
 async function play(){if(!unlocked||muted||hidden)return;const id=++request;try{await audio.play();if(id!==request)return;playing=true;failures=0;notify();}catch{if(id!==request)return;playing=false;notify();}}
 function update(){const next=musicPeriod(clock());if(next===period&&fade)fade=null;if(next!==period){if(!period||!playing){source(next);play();}else if(fade!==next)fade=next;}if(!muted&&!hidden&&unlocked){if(fade){audio.volume=Math.max(0,audio.volume-.045);if(audio.volume<=.001){audio.pause();source(fade);fade=null;play();}}else if(playing)audio.volume=Math.min(.28,audio.volume+.025);}notify();}
 function unlock(){unlocked=true;if(musicPeriod(clock())!==period)source(musicPeriod(clock()));if(!playing)play();notify();}
 function setMuted(value){muted=value;try{storage?.setItem(key,String(value));}catch{}if(muted){request++;audio.pause();playing=false;audio.volume=0;}else unlock();notify();}
 function setHidden(value){hidden=value;if(value){request++;audio.pause();playing=false;audio.volume=0;}else {update();play();}notify();}
 function next(){if(!period)return;index=(index+1)%MUSIC_TRACKS[period].length;audio.src=MUSIC_TRACKS[period][index].url;audio.volume=0;play();notify();}
 audio.addEventListener('ended',next);
 audio.addEventListener('error',()=>{playing=false;if(++failures<MUSIC_TRACKS[period]?.length)next();notify();});
 notify();return {unlock,update,setMuted,setHidden,getState:state,dispose(){request++;audio.pause();audio.removeAttribute('src');audio.load();ambience.pause();ambience.removeAttribute('src');ambience.load();}};
}
