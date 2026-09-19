import * as T from 'three';
// Exterior is a local photographic plate well behind the physical window.
// It is deliberately separate from glass/frame, allowing natural orbit parallax.
export function outdoorGarden(texture){
 const plane=new T.Mesh(new T.PlaneGeometry(42,28),new T.MeshBasicMaterial({map:texture,toneMapped:false,color:'#e4e5d9'}));
 plane.position.set(4,7,-18);plane.name='Distant garden photographic plate';plane.userData.noShadow=true;return plane;
}
export async function loadEnvironmentTextures(){
 const loader=new T.TextureLoader();
 const [garden,oak]=await Promise.all(['garden-exterior-v07.jpg','oak-v07.jpg'].map(name=>loader.loadAsync(new URL('../public/assets/textures/'+name,import.meta.url).href)));
 for(const t of [garden,oak]){t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;}
 oak.wrapS=oak.wrapT=T.RepeatWrapping;
 return {garden,oak};
}
export function setupDaylight(scene,renderer){
 renderer.toneMappingExposure=1.08;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 scene.background=new T.Color('#c7c6b7');
 const reflections=roomReflections(renderer);scene.environment=reflections.texture;scene.environmentIntensity=.42;
 scene.add(new T.HemisphereLight('#e1ecf3','#b7a080',.65));
 const sun=new T.DirectionalLight('#fff0d5',3.1);sun.name='Morning sun from garden';sun.position.set(8,12,-8);sun.target.position.set(0,0,0);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:15,bottom:-16,near:.5,far:60});
 sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=3;sun.shadow.blurSamples=8;
 scene.add(sun,sun.target);
 const bounce=new T.DirectionalLight('#ffe7cb',.7);bounce.name='Warm room bounce';bounce.position.set(-3,4,7);scene.add(bounce);
 return reflections;
}
export function roomReflections(renderer){
 const room=new T.Scene();room.background=new T.Color('#aaa394');
 const shell=new T.Mesh(new T.BoxGeometry(12,8,12),new T.MeshBasicMaterial({color:'#b4aa96',side:T.BackSide}));room.add(shell);
 const window=new T.Mesh(new T.PlaneGeometry(6,5.5),new T.MeshBasicMaterial({color:new T.Color(2.6,2.7,2.6)}));window.position.set(1,1,-5.9);room.add(window);
 const warm=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshBasicMaterial({color:'#b1956f'}));warm.rotation.x=-Math.PI/2;warm.position.y=-3.8;room.add(warm);
 const generator=new T.PMREMGenerator(renderer),target=generator.fromScene(room,.08,.1,30);generator.dispose();room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});return target;
}
