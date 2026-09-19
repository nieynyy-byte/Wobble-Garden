// Stable developmental graphs: older leaves retain their identity and pose.
export const COUNTS={pothos:[5,8,13,21,30,42,84],fittonia:[6,12,20,30,42,56,104],peperomia:[4,7,11,16,22,28,52],syngonium:[3,5,8,12,16,21,42],sansevieria:[4,6,8,10,13,17,32]};
const BASE_COUNTS={pothos:[5,8,13,21,30,42,48],fittonia:[6,12,20,30,42,56,64],peperomia:[4,7,11,16,22,28,32],syngonium:[3,5,8,12,16,21,24],sansevieria:[4,6,8,10,13,17,20]};
const polar=(r,a,y)=>[Math.sin(a)*r,y,Math.cos(a)*r];
export function architecture(id){
 const leaves=[],branches=[],counts=BASE_COUNTS[id],born=i=>counts.findIndex(n=>i<n)+1;
 const add=(i,start,position,rotation,length,width,branch)=>leaves.push({id:i,born:born(i),start,position,rotation,length,width,branch});
 if(id==='sansevieria'){
  for(let i=0;i<20;i++){
   const pup=i>=12,second=i>=17,j=pup?i-(second?17:12):i;
   const center=pup?[second?.51:-.5,1.57,second?.26:.30]:[0,1.57,.03];
   const a=j*2.399963+.3,outer=!pup&&j<5,r=pup?.025:outer?.16:.055;
   const length=pup?.42+(j%3)*.08:outer?.65+(j%2)*.08:.92+(j%3)*.1;
   const p=polar(r,a,center[1]+(pup?0:j*.014));p[0]+=center[0];p[2]+=center[2];
   add(i,center,p,[outer?.83:pup?.40:.22,a,0],length,pup?.13:outer?.23:.24,pup?second?'pup-2':'pup-1':'rosette');
  }
 }else if(id==='fittonia'){
  // Opposite pairs on creeping, branching axes; alternating pairs turn 90 degrees.
  for(let pair=0;pair<32;pair++){
   const axis=pair%8,node=Math.floor(pair/8),a=axis*Math.PI/4+.19,r=.1+node*.2;
   const p=polar(r,a,1.76+node*.115+(axis%3)*.08);
   const base=polar(.06,a,1.55);branches.push({id:'axis-'+axis+'-'+node,born:born(pair*2),points:[node?polar(r-.2,a,p[1]-.115):base,polar(r-.08,a,p[1]-.035),p]});
   for(let side=0;side<2;side++){const i=pair*2+side,heading=a+(node%2?Math.PI/2:0)+side*Math.PI;const pos=[p[0]+Math.sin(heading)*.09,p[1]+.04,p[2]+Math.cos(heading)*.09];add(i,p,pos,[.10+(pair%3)*.08,heading,side?.035:-.035],.37+(pair%3)*.025,.145+(pair%2)*.015,'axis-'+axis);}
  }
 }else if(id==='peperomia'){
  for(let i=0;i<32;i++){
   const axis=i%4,node=Math.floor(i/4),a=axis*Math.PI/2+.4,r=.13+node*.055,y=1.68+node*.105;
   const start=polar(r,a,y),heading=a+(node%2?.72:-.72),p=[start[0]+Math.sin(heading)*.08,y+.08,start[2]+Math.cos(heading)*.08];
   const prev=node?polar(r-.055,a,y-.105):[0,1.55,0];
   branches.push({id:'branch-'+axis+'-'+node,born:born(i),points:[prev,start]});
   add(i,start,p,[.14+(node%3)*.11,heading,axis%2?.04:-.04],.51+(i%3)*.035,.235+(i%2)*.018,'branch-'+axis);
  }
 }else{
  const total=counts[6],trailing=id==='pothos'?18:0,crown=total-trailing;
  for(let i=0;i<crown;i++){
   const a=i*2.399963+.34,layer=Math.floor(i/5),r=.14+layer*.105;
   const y=1.86+layer*(id==='syngonium'?.16:id==='peperomia'?.115:.09)+(i%3)*.07;
   const start=polar(r*.35,a,y-(id==='syngonium'?.32:.16)),p=polar(r,a,y);
   const length=(id==='syngonium'?.79:id==='peperomia'?.53:.64)*( .87+(i%3)*.085);
   add(i,start,p,[.16+(i%3)*.13,a,(i%2?1:-1)*.04],length,id==='syngonium'?.29:id==='peperomia'?.24:.26,'shoot-'+i%5);
   branches.push({id:'shoot-'+i,born:born(i),points:[polar(.08,a,1.55),polar(r*.28,a,start[1]-.18),start]});
  }
  if(trailing)for(let v=0;v<3;v++){
   const a=[-1.1,1.22,3.05][v];
   for(let j=0;j<6;j++){
    const i=crown+j*3+v,r=1.03+j*.038,p=polar(r,a,1.67-j*.19),start=j?polar(r-.038,a,1.67-(j-1)*.19):polar(.35,a,1.7);
    branches.push({id:'vine-'+v+'-'+j,born:born(i),points:[start,polar(r,a,1.77-j*.19),p]});
    const heading=a+(j%2?.60:-.50),pos=[p[0]+Math.sin(heading)*.07,p[1],p[2]+Math.cos(heading)*.07];
    add(i,p,pos,[.54,heading,0],.46+(j%2)*.04,.19,'vine-'+v);
   }
  }
 }
 if(id==='pothos'){
  const crownCounts=[5,8,13,18,22,27,30],vineCounts=[0,0,0,3,8,15,18];
  for(const l of leaves)l.born=(l.id<30?crownCounts.findIndex(n=>l.id<n):vineCounts.findIndex(n=>l.id-30<n))+1;
  for(const b of branches){const leaf=b.id.startsWith('shoot-')?leaves.find(l=>l.id===Number(b.id.slice(6))):leaves.find(l=>l.id===30+Number(b.id.split('-')[2])*3+Number(b.id.split('-')[1]));if(leaf)b.born=leaf.born;}
 }
 return {leaves:leaves.sort((a,b)=>a.born-b.born||a.id-b.id),branches};
}
