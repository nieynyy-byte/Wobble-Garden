// Day 45 only. Earlier leaves/branches are frozen; additions have born=7.
export function extendMature(id,base){
 const graph=structuredClone(base);graph.leaves.forEach(l=>l.locked=true);
 const polar=(r,a,y)=>[Math.sin(a)*r,y,Math.cos(a)*r];
 const add=(start,position,rotation,length,width,branch)=>{const n=graph.leaves.length;graph.leaves.push({id:n,born:7,start,position,rotation,length,width,branch});return n;};
 const branch=(start,end,name)=>graph.branches.push({id:'mature-'+name,born:7,points:[start,end]});
 if(id==='pothos'){
  for(let i=0;i<18;i++){const a=i*2.399963+.9,r=.6+(i%3)*.15,y=2.45+Math.floor(i/6)*.21;const start=polar(.4,a,2.08),p=polar(r,a,y);branch(start,p,'crown-'+i);add(start,p,[.16+(i%3)*.1,a,0],.73+(i%3)*.035,.29,'mature-crown');}
  for(let v=0;v<3;v++){const a=[-1.15,1.28,3.02][v];let previous=polar(1.22,a,.72);
   for(let j=0;j<6;j++){const r=1.43+j*.065,y=Math.max(.34,.72-j*.09),p=polar(r,a+(j%2?.07:-.03),y);branch(previous,p,'trail-'+v+'-'+j);const heading=a+(j%2?.68:-.55);add(p,p,[.12,heading,0],.45+(j%2)*.03,.21,'mature-vine-'+v);previous=p;}
  }
 }else if(id==='fittonia'){
  for(let pair=0;pair<20;pair++){const axis=pair%10,tier=Math.floor(pair/10),a=axis*Math.PI/5+.2,r=.79+tier*.18,p=polar(r,a,2.08+tier*.15+(axis%3)*.045),start=polar(.5,a,1.97);branch(start,p,'creep-'+pair);
   for(let side=0;side<2;side++){const heading=a+(tier?Math.PI/2:0)+side*Math.PI,pos=[p[0]+Math.sin(heading)*.1,p[1]+.02,p[2]+Math.cos(heading)*.1];add(p,pos,[.08,heading,0],.43,.174,'mature-pair-'+pair);}
  }
 }else if(id==='peperomia'){
  for(let i=0;i<20;i++){const axis=i%5,node=Math.floor(i/5),a=axis*Math.PI*2/5+.7,r=.48+node*.075,y=2.26+node*.145,start=polar(r-.08,a,y-.14),p=polar(r,a,y);branch(node?polar(r-.075,a,y-.145):polar(.25,a,1.95),start,'shoot-'+i);add(start,p,[.14+(node%2)*.15,a+(node%2?.55:-.55),0],.64+(i%2)*.035,.285,'mature-branch-'+axis);}
 }else if(id==='syngonium'){
  for(let i=0;i<18;i++){const a=i*2.399963+.7,r=.52+(i%3)*.14,y=2.66+Math.floor(i/6)*.25,start=polar(.28,a,1.8+Math.floor(i/6)*.14),p=polar(r,a,y);branch(polar(.12,a,1.56),start,'shoot-'+i);add(start,p,[.14+(i%3)*.11,a,0],.94+(i%2)*.06,.36,'mature-shoot-'+i%6);}
 }else{
  for(let i=0;i<12;i++){const group=Math.floor(i/4),j=i%4,a=j*2.399963+group*.8,center=group===0?[0,1.59,0]:[group===1?-.50:.51,1.57,.3];const p=[center[0]+Math.sin(a)*.06,center[1]+j*.012,center[2]+Math.cos(a)*.06];add(center,p,[group===0?.37:.60,a,0],group===0?1.32+j*.045:.78+j*.035,group===0?.29:.225,'mature-rosette-'+group);}
 }
 return graph;
}
