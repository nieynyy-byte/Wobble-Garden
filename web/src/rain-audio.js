// Original synthesized ambience: periodic noise buffers have no splice/click.
export function createRainAudio(){
 let ctx,gain,sources=[],layers=[],amount=0,muted=false,hidden=false;
 function update(){if(!ctx)return;gain.gain.setTargetAtTime(muted||hidden?0:amount*.13,ctx.currentTime,.7);layers.forEach((g,i)=>g.gain.setTargetAtTime(i?(.05+amount*.25):.65,ctx.currentTime,.7));}
 async function unlock(){
  if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ctx=new C();gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);
   for(const [cutoff,weight] of [[650,.65],[3200,.22]]){
    const size=ctx.sampleRate*12,buffer=ctx.createBuffer(1,size,ctx.sampleRate),a=buffer.getChannelData(0),edge=512,raw=new Float32Array(size+edge);let seed=cutoff,brown=0;
    for(let i=0;i<size+edge;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;brown=(brown+(seed/4294967296*2-1)*.08)/1.025;raw[i]=brown*3;}
    a.set(raw.subarray(0,size));for(let i=0;i<edge;i++){const k=i/edge;a[i]=raw[i]*k+raw[size+i]*(1-k);}
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=weight;src.connect(filter).connect(g).connect(gain);src.start();sources.push(src);layers.push(g);
   }
  }
  try{await ctx.resume();}catch{}update();
 }
 return {unlock,set(value,mute=false,hide=false){amount=value;muted=mute;hidden=hide;update();},getState:()=>({unlocked:!!ctx,running:ctx?.state==='running',amount,muted,hidden}),dispose(){sources.forEach(s=>s.stop());ctx?.close();}};
}
