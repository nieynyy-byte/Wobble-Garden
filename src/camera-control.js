// Capture drags across the scene, including over the eyes. Ordinary eye taps still click.
export function installCameraDrag(surface,{enabled,onChange,onFirstDrag}){
 let drag=null,suppressClick=false,current={x:0,y:0},hintShown=false;
 surface.style.touchAction='none';
 surface.addEventListener('pointerdown',e=>{
  if(!enabled()||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
  suppressClick=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...current},moved:false};
 });
 surface.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  if(!drag.moved){drag.moved=true;surface.setPointerCapture(e.pointerId);}
  e.preventDefault();const w=Math.max(280,surface.clientWidth),h=Math.max(400,surface.clientHeight);
  current={x:Math.max(-.24,Math.min(.24,drag.start.x-dx/w*.7)),y:Math.max(-.055,Math.min(.12,drag.start.y+dy/h*.42))};onChange(current);
  if(!hintShown){hintShown=true;onFirstDrag?.();}
 },{passive:false});
 function end(e){if(!drag||drag.id!==e.pointerId)return;suppressClick=drag.moved;drag=null;if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);}
 surface.addEventListener('pointerup',end);surface.addEventListener('pointercancel',end);surface.addEventListener('lostpointercapture',e=>{if(e.target===surface&&drag?.id===e.pointerId)end(e);});
 surface.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
 return ()=>({...current});
}
