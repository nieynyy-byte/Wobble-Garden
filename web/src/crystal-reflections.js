import * as T from 'three';
// High-contrast window/room reflection probe, used only by the jewel material.
// Static PMREM is generated once; no extra scene lights or per-frame cube renders.
export function crystalReflections(renderer){
 const s=new T.Scene();s.background=new T.Color(.025,.035,.04);
 const box=new T.Mesh(new T.BoxGeometry(12,9,12),new T.MeshBasicMaterial({color:new T.Color(.065,.07,.065),side:T.BackSide}));s.add(box);
 for(const x of [-2.4,0,2.4]){const p=new T.Mesh(new T.PlaneGeometry(2.15,6.5),new T.MeshBasicMaterial({color:new T.Color(3.5,3.9,4.2)}));p.position.set(x,1,-5.9);s.add(p);}
 const bounce=new T.Mesh(new T.PlaneGeometry(2,5),new T.MeshBasicMaterial({color:new T.Color(.45,.43,.36)}));bounce.position.set(-4,0,5.9);bounce.rotation.y=Math.PI;s.add(bounce);
 for(const [x,y,w,h] of [[-3,1,1.1,5.5],[2.7,2,.7,4],[.4,3.4,3,.45]]){const card=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(2.8,3.1,3.4)}));card.position.set(x,y,5.7);card.lookAt(0,0,0);s.add(card);}
 const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshBasicMaterial({color:new T.Color(.23,.16,.085)}));floor.rotation.x=-Math.PI/2;floor.position.y=-4.4;s.add(floor);
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(s,.015,.1,30);pmrem.dispose();s.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});return target;
}
