export function installFestivalCamera(surface){
 const points=new Map(),state={x:0,zoom:1},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let last=null,released=0,moved=false;
 const measure=()=>{const p=[...points.values()];return {x:p.reduce((a,b)=>a+b.x,0)/p.length,gap:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};};
 surface.addEventListener('pointerdown',e=>{points.set(e.pointerId,{x:e.clientX,y:e.clientY});surface.setPointerCapture(e.pointerId);last=measure();moved=false;},true);
 surface.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=measure();if(last){const dx=next.x-last.x;state.x=clamp(state.x-dx/surface.clientWidth*10,-5,6);if(next.gap&&last.gap)state.zoom=clamp(state.zoom*last.gap/next.gap,.65,1.5);moved||=Math.abs(dx)>2||!!next.gap;}last=next;e.preventDefault();}, {passive:false});
 const end=e=>{points.delete(e.pointerId);last=points.size?measure():null;released=performance.now();};for(const e of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(e,end);
 surface.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();}},true);
 surface.addEventListener('wheel',e=>{e.preventDefault();state.zoom=clamp(state.zoom*Math.exp(e.deltaY*.001),.65,1.5);released=performance.now();},{passive:false});
 return {update(dt){if(!points.size&&performance.now()-released>700){const a=1-Math.exp(-dt*.45);state.x+=(0-state.x)*a;state.zoom+=(1-state.zoom)*a;}return state;},getState:()=>({...state,active:points.size})};
}
