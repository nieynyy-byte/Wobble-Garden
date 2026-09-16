import * as T from 'three';
// Pre-blurred garden, generated once; no per-frame depth-of-field pass on phones.
export function outdoorGarden(){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;const c=canvas.getContext('2d');
 const sky=c.createLinearGradient(0,0,0,1024);sky.addColorStop(0,'#dbe4df');sky.addColorStop(.6,'#cad7c5');sky.addColorStop(1,'#9eb094');c.fillStyle=sky;c.fillRect(0,0,1536,1024);
 let seed=7423;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let layer=0;layer<3;layer++){
  c.filter=`blur(${14-layer*3}px)`;
  for(let tree=0;tree<7;tree++){
   const x=tree*280-70+random()*110,y=380+random()*310+layer*75,scale=.65+random()*.65;
   c.strokeStyle=['#a2b49e','#8ca287','#81977b'][layer];c.lineWidth=(6+layer*3)*scale;c.beginPath();c.moveTo(x+12,1024);c.bezierCurveTo(x-15,y+210,x+20,y+130,x,y);c.stroke();
   for(let j=0;j<30;j++){
    const angle=random()*Math.PI*2,r=Math.sqrt(random())*150*scale,lx=x+Math.cos(angle)*r,ly=y+Math.sin(angle)*r*.75;
    const tones=layer===0?['#b4c4a8','#aabda1','#bdc9b2']:layer===1?['#98af8c','#a4b695','#a8bb99']:['#91a77f','#a2b18b','#879f7c'];
    c.fillStyle=tones[Math.floor(random()*tones.length)];c.beginPath();c.ellipse(lx,ly,(20+random()*43)*scale,(13+random()*29)*scale,random()*3,0,Math.PI*2);c.fill();
   }
  }
 }
 c.filter='none';const haze=c.createLinearGradient(0,0,1536,900);haze.addColorStop(0,'rgba(255,249,225,.48)');haze.addColorStop(1,'rgba(224,236,225,.16)');c.fillStyle=haze;c.fillRect(0,0,1536,1024);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const plane=new T.Mesh(new T.PlaneGeometry(28,18.67),new T.MeshBasicMaterial({map:texture,toneMapped:false}));plane.position.set(1,6,-9);plane.name='Distant soft garden';plane.userData.noShadow=true;return plane;
}
export function roomReflections(renderer){
 const room=new T.Scene();room.background=new T.Color('#8b9081');
 const shell=new T.Mesh(new T.BoxGeometry(12,8,12),new T.MeshBasicMaterial({color:'#a39d8e',side:T.BackSide}));room.add(shell);
 const window=new T.Mesh(new T.PlaneGeometry(5,5),new T.MeshBasicMaterial({color:new T.Color(2.4,2.5,2.3)}));window.position.set(-2,1,-5.9);room.add(window);
 const warm=new T.Mesh(new T.PlaneGeometry(7,3),new T.MeshBasicMaterial({color:'#c1ad8f'}));warm.rotation.x=-Math.PI/2;warm.position.y=-3.8;room.add(warm);
 const generator=new T.PMREMGenerator(renderer),target=generator.fromScene(room,.06,.1,30);generator.dispose();room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});return target;
}
