// Shared garden drag/pinch controls. Static taps and crystal holds stay separate.
export function installCameraDrag(surface,{enabled,onChange,onFirstDrag}){
 const points=new Map(),current={x:0,y:0,zoom:1};let last=null,moved=false,suppressClick=false,hintShown=false,released=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const measure=()=>{const p=[...points.values()];return {x:p.reduce((s,p)=>s+p.x,0)/p.length,y:p.reduce((s,p)=>s+p.y,0)/p.length,gap:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};};
 const changed=()=>onChange({...current});surface.style.touchAction='none';
 surface.addEventListener('pointerdown',e=>{if(!enabled()||(e.pointerType==='mouse'&&e.button!==0))return;if(!points.size){moved=false;suppressClick=false;}points.set(e.pointerId,{x:e.clientX,y:e.clientY});last=measure();});
 surface.addEventListener('pointermove',e=>{if(!enabled()||!points.has(e.pointerId))return;const old=points.get(e.pointerId);if(!moved&&Math.hypot(e.clientX-old.x,e.clientY-old.y)<6)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=measure();moved=true;suppressClick=true;surface.setPointerCapture(e.pointerId);e.preventDefault();if(last){current.x=clamp(current.x-(next.x-last.x)/Math.max(280,surface.clientWidth)*.7,-.24,.24);if(next.gap&&last.gap)current.zoom=clamp(current.zoom*last.gap/next.gap,.72,1.3);}last=next;changed();if(!hintShown){hintShown=true;onFirstDrag?.();}},{passive:false});
 function end(e){if(!points.has(e.pointerId))return;points.delete(e.pointerId);last=points.size?measure():null;released=performance.now();if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(event,end);
 surface.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
 surface.addEventListener('wheel',e=>{if(!enabled())return;e.preventDefault();current.zoom=clamp(current.zoom*Math.exp(e.deltaY*.001),.72,1.3);released=performance.now();changed();},{passive:false});
 const read=()=>({...current});read.isGesture=()=>moved&&points.size>0;
 read.update=dt=>{if(!enabled()){points.clear();last=null;current.x=0;current.y=0;current.zoom=1;changed();return;}if(!points.size&&performance.now()-released>700){const a=1-Math.exp(-dt*.45);current.x+=(0-current.x)*a;current.y+=(0-current.y)*a;current.zoom+=(1-current.zoom)*a;changed();}};
 return read;
}
