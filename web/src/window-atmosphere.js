import * as T from 'three';

// Sparse branching silhouettes at different outdoor depths, sharing the real sun.
export function createLeafShadows(scene,{reducedMotion=false}={}){
 let seed=173;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const cards=[];
 for(let layer=0;layer<3;layer++){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.fillStyle='black';ctx.fillRect(0,0,1024,1024);
  ctx.fillStyle='white';ctx.strokeStyle='white';ctx.lineCap='round';
  function leaf(x,y,angle,length,width){
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);
   const bend=(random()-.5)*length*.22;
   ctx.beginPath();ctx.moveTo(0,0);
   ctx.bezierCurveTo(length*.22,-width*(.65+random()*.5),length*.72,-width*.7,length,bend);
   ctx.bezierCurveTo(length*.68,width*(.45+random()*.6),length*.18,width*.8,0,0);
   ctx.fill();ctx.restore();
  }
  function twig(x,y,angle,length,width,depth){
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);
   const bend=(random()-.5)*length*.4;
   ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(length*.5,bend,length,bend*.6);ctx.stroke();
   let along=.12+random()*.12;
   while(along<.96){
    const side=random()<.5?-1:1,xx=along*length,yy=bend*(2*along-1.4*along*along);
    const direction=side*(.35+random()*1.05),size=(22+random()*45)*(1-along*.35);
    if(depth>0&&random()<.46)twig(xx,yy,direction,length*(.27+random()*.2),Math.max(.8,width*.48),depth-1);
    else if(random()>.12)leaf(xx,yy,direction,size,size*(.16+random()*.25));
    along+=.10+random()*.17;
   }
   leaf(length,bend*.6,(random()-.5)*.4,22+random()*25,7+random()*7);ctx.restore();
  }
  for(let branch=0;branch<3;branch++)twig(60+random()*800,80+random()*750,random()*Math.PI*2,180+random()*210,2+random()*2,2);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.NoColorSpace;
  const material=new T.MeshBasicMaterial({alphaMap:map,alphaTest:.45,side:T.DoubleSide,colorWrite:false,depthWrite:false});
  const card=new T.Mesh(new T.PlaneGeometry(10,10),material);
  card.name='Outside foliage shadow caster '+layer;card.position.set(2.4,5.7,-3.6-layer*.8);card.castShadow=true;
  card.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,alphaMap:map,alphaTest:.45,side:T.DoubleSide});
  scene.add(card);cards.push(card);
 }
 return {
  update(seconds,sunPower){
   const t=reducedMotion?0:seconds;
   cards.forEach((card,i)=>{card.visible=sunPower>.15;const phase=i*2.3;
    card.position.x=2.4+Math.sin(t*(.21+i*.035)+phase)*(.035+i*.014);
    card.position.y=5.7+Math.sin(t*.17+phase)*.025;
    card.rotation.z=Math.sin(t*.13+phase)*.006;
   });
  },
  getState:()=>({enabled:cards[0].visible,offset:cards[0].position.toArray(),layers:cards.length,reducedMotion})
 };
}

// Stars and a sphere-lit lunar disc are composited on the photographic plate.
// Color-keyed sky occlusion keeps every star behind the existing leaves.
export function installExteriorAtmosphere(plate){
 const U={weatherAmount:{value:0},outdoorGain:{value:1},gradeTop:{value:new T.Color()},gradeBottom:{value:new T.Color()},contrast:{value:1},desaturate:{value:0},nightLevel:{value:0},skyTop:{value:new T.Color()},skyBottom:{value:new T.Color()},moonLight:{value:new T.Vector3()},moonIllumination:{value:0}};
 plate.material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,U);
  shader.fragmentShader=`uniform float weatherAmount, outdoorGain, contrast, desaturate, nightLevel, moonIllumination;
   uniform vec3 gradeTop, gradeBottom, skyTop, skyBottom, moonLight;
   float skyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float starLayer(vec2 uv,float scale){
    vec2 grid=uv*vec2(1.777,1.)*scale,cell=floor(grid),f=fract(grid);
    vec2 center=vec2(.2)+.6*vec2(skyHash(cell),skyHash(cell+17.));
    float d=length(f-center),aa=max(length(fwidth(grid))*.55,.025);
    float radius=.024+.024*skyHash(cell+9.);
    return (1.-smoothstep(radius,radius+aa,d))*step(.91,skyHash(cell+33.))*(.22+.45*skyHash(cell+3.));
   }
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 uv=vMapUv;vec3 original=diffuseColor.rgb;
   float lum=dot(original,vec3(.2126,.7152,.0722));
   vec3 atmosphere=mix(gradeBottom,gradeTop,smoothstep(.35,.95,uv.y));
   vec3 graded=mix(original,vec3(lum),desaturate);
   vec3 exterior=pow(max(graded,vec3(0.)),vec3(contrast))*outdoorGain*atmosphere;
   float blueSky=smoothstep(-.02,.02,original.b-original.r)*smoothstep(-.045,-.005,original.b-original.g);
   float clouds=smoothstep(.18,.34,min(original.r,min(original.g,original.b)))*smoothstep(-.015,.02,original.b-original.r);
   float green=max(original.g-original.b,original.g-original.r);
   float skyMask=(1.-smoothstep(.012,.10,green))*smoothstep(.05,.22,lum)*smoothstep(.46,.58,uv.y);
   vec3 nightSky=mix(skyBottom,skyTop,smoothstep(.4,.94,uv.y));
   float dark=smoothstep(0.,.85,nightLevel);
   // Preserve soft cloud texture without hard color-key islands.
   vec3 softSky=nightSky*(.88+.12*smoothstep(.12,.8,lum));
   exterior=mix(exterior,softSky,skyMask*dark);
   vec2 q=(uv-vec2(.555,.61))*vec2(1.777,1.)/.018;
   float r=length(q),edge=max(fwidth(r),.015);
   float disc=1.-smoothstep(1.-edge,1.+edge,r);
   float stars=(starLayer(uv,58.)+starLayer(uv+vec2(.137,.271),93.)*.45)*smoothstep(.35,1.,nightLevel)*(1.-weatherAmount*.98);
   exterior+=vec3(.72,.80,1.)*stars*skyMask*(1.-clouds*.85)*(1.-disc);
   // True circular disc in the image's aspect ratio, never an oval texture.
   vec3 normal=vec3(q,sqrt(max(0.,1.-dot(q,q))));
   float light=dot(normal,moonLight);
   float lit=smoothstep(-.025,.035,light);
   float textureShade=.94+.025*sin(q.x*19.+sin(q.y*14.))+.035*sin(q.y*7.+q.x*5.);
   vec3 moon=vec3(.83,.85,.79)*textureShade*(.45+.55*max(light,0.));
   float moonVisibility=smoothstep(.1,.7,nightLevel)*(1.-weatherAmount*.97);
   exterior=mix(exterior,moon,disc*lit*moonVisibility*skyMask);
   exterior+=vec3(.04,.055,.08)*exp(-max(0.,r-1.)*3.5)*(1.-disc)*moonIllumination*moonVisibility*skyMask;
   // Weather grading remains outside: retain the seasonal image and its silhouettes.
   float distant=exp(-pow((uv.y-.43)/.22,2.));
   vec3 wetTint=mix(vec3(1.),vec3(.91,.97,1.03),weatherAmount);
   exterior*=wetTint;
   float haze=weatherAmount*(.035+.13*distant);
   vec3 rainSky=mix(vec3(.30,.35,.38),nightSky,nightLevel);
   exterior=mix(exterior,rainSky,haze);
   // Clouds veil moon/stars in wet weather, without adding city lights.
   exterior=mix(exterior,exterior*.82,skyMask*weatherAmount*.55);
   diffuseColor.rgb=exterior;
  `);
 };
 plate.material.needsUpdate=true;
 return U;
}
