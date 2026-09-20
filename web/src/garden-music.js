import {MUSIC_TRACKS} from './music-tracks.js';
export function musicPeriod(date=new Date()){const minute=date.getHours()*60+date.getMinutes();return minute>=360&&minute<1081?'morning':'evening';}
export function createGardenMusic({storage,audio=new Audio(),clock=()=>new Date(),onChange=()=>{}}={}){
 const key='wobble-garden.music-muted.v1';let muted=false,unlocked=false,hidden=false,period=null,index=0,playing=false,fade=null,failures=0,request=0;
 try{muted=storage?.getItem(key)==='true';}catch{}
 audio.preload='none';audio.volume=0;audio.loop=false;
 function state(){return {period,index,title:period?MUSIC_TRACKS[period][index].title:null,muted,unlocked,playing,paused:audio.paused};}
 function notify(){onChange(state());}
 function source(next){period=next;index=0;audio.src=MUSIC_TRACKS[period][index].url;audio.volume=0;}
 async function play(){if(!unlocked||muted||hidden)return;const id=++request;try{await audio.play();if(id!==request)return;playing=true;failures=0;notify();}catch{if(id!==request)return;playing=false;notify();}}
 function update(){const next=musicPeriod(clock());if(next===period&&fade)fade=null;if(next!==period){if(!period||!playing){source(next);play();}else if(fade!==next)fade=next;}if(!muted&&!hidden&&unlocked){if(fade){audio.volume=Math.max(0,audio.volume-.045);if(audio.volume<=.001){audio.pause();source(fade);fade=null;play();}}else if(playing)audio.volume=Math.min(.28,audio.volume+.025);}notify();}
 function unlock(){unlocked=true;if(musicPeriod(clock())!==period)source(musicPeriod(clock()));if(!playing)play();notify();}
 function setMuted(value){muted=value;try{storage?.setItem(key,String(value));}catch{}if(muted){request++;audio.pause();playing=false;audio.volume=0;}else unlock();notify();}
 function setHidden(value){hidden=value;if(value){request++;audio.pause();playing=false;audio.volume=0;}else {update();play();}notify();}
 function next(){if(!period)return;index=(index+1)%MUSIC_TRACKS[period].length;audio.src=MUSIC_TRACKS[period][index].url;audio.volume=0;play();notify();}
 audio.addEventListener('ended',next);
 audio.addEventListener('error',()=>{playing=false;if(++failures<MUSIC_TRACKS[period]?.length)next();notify();});
 notify();return {unlock,update,setMuted,setHidden,getState:state,dispose(){request++;audio.pause();audio.removeAttribute('src');audio.load();}};
}
