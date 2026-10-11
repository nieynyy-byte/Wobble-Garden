import * as T from 'three';
export function keepsakesAvailable(date=new Date()){
 return date.getFullYear()>2026||(date.getFullYear()===2026&&(date.getMonth()>9||(date.getMonth()===9&&date.getDate()>=11)));
}
export function createGardenLamp({scene,storage,button}){
 const key='wobble-garden.lamp.v1';let enabled=false;try{enabled=storage?.getItem(key)==='on';}catch{}
 // A warm shaded lamp just outside the view; no changes to outdoor/time lighting.
 const light=new T.PointLight('#ffd4a0',0,10,2);light.name='Optional warm garden lamp';light.position.set(-2.3,3.4,3);scene.add(light);
 const fill=new T.PointLight('#ffe0b5',0,5,2);fill.position.set(.5,1.8,2.6);scene.add(fill);
 function sync(){button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Turn warm lamp off':'Turn warm lamp on');button.style.background=enabled?'#b88243aa':'';}
 button.onclick=()=>{enabled=!enabled;try{storage?.setItem(key,enabled?'on':'off');}catch{}sync();};sync();
 return {update(dt,darkness,visible=true){const target=enabled&&visible?T.MathUtils.smoothstep(darkness,.05,.8):0;light.intensity=T.MathUtils.damp(light.intensity,target*12,4,dt);fill.intensity=T.MathUtils.damp(fill.intensity,target*1.2,4,dt);button.style.display=darkness>.05?'':'none';},getState:()=>({enabled,intensity:light.intensity}),dispose(){light.removeFromParent();fill.removeFromParent();}};
}
