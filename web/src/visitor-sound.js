// Soft wordless FM glides; original synthesis, no speech or external samples.
export function createVisitorSound({muted=()=>false}={}){
 let ctx,master,last=-Infinity;
 async function unlock(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!ctx){ctx=new C();master=ctx.createGain();master.connect(ctx.destination);}try{await ctx.resume();}catch{}}
 function glide(strength=.5,index=0){if(!ctx||ctx.state!=='running'||muted()||document.hidden||ctx.currentTime-last<.6)return;last=ctx.currentTime;
  const t=ctx.currentTime,d=.7+strength*.45,osc=ctx.createOscillator(),mod=ctx.createOscillator(),depth=ctx.createGain(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  osc.type='sine';mod.type='sine';const pitch=190+index*65;osc.frequency.setValueAtTime(pitch*.8,t);osc.frequency.exponentialRampToValueAtTime(pitch*1.65,t+d*.35);osc.frequency.exponentialRampToValueAtTime(pitch*.67,t+d);
  mod.frequency.setValueAtTime(7+index*2,t);depth.gain.value=18+strength*20;mod.connect(depth).connect(osc.frequency);filter.type='lowpass';filter.frequency.value=1500;
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.025+strength*.025,t+.12);gain.gain.exponentialRampToValueAtTime(.0001,t+d);osc.connect(filter).connect(gain).connect(master);osc.start(t);mod.start(t);osc.stop(t+d+.03);mod.stop(t+d+.03);osc.onended=()=>{osc.disconnect();mod.disconnect();depth.disconnect();filter.disconnect();gain.disconnect();};
 }
 function update(){if(ctx)master.gain.setTargetAtTime(muted()||document.hidden?0:1,ctx.currentTime,.06);}
 document.addEventListener('visibilitychange',update);
 return {unlock,glide,update,getState:()=>({unlocked:!!ctx,running:ctx?.state==='running'}),dispose:()=>ctx?.close()};
}
