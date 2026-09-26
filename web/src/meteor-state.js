// Trial results live separately from all plant/growth data.
export const TRIAL_RULES={kills:20,maxMisses:5,bossDamage:6,duration:90};
export function createMeteorState({random=Math.random}={}){
 let phase='battle',elapsed=0,next=1,boss=false,wave=0,id=0,kills=0,misses=0,bossDamage=0,passed=false;const meteors=[];
 function spawn(kind,width=9){const giant=kind==='giant';const m={id:++id,kind,hp:giant?18:kind==='fireball'?10:kind==='medium'?3:1,r:giant?2.6:kind==='fireball'?1.15:kind==='medium'?1.05:.60,x:giant?0:(random()*2-1)*Math.min(width-1,8),y:giant?6.3:8,z:0,speed:giant?.53:kind==='fireball'?1.5:kind==='medium'?1.375:2.3125+random()*.825,spin:random()*2-1,playerDamage:0};m.vx=giant?0:((random()*2-1)*Math.min(width*.3,3)-m.x)*m.speed/12;meteors.push(m);return m;}
 function finish(defeated){passed=defeated&&kills>=TRIAL_RULES.kills&&misses<=TRIAL_RULES.maxMisses&&bossDamage>=TRIAL_RULES.bossDamage;phase='calm';}
 function hit(m,damage=1,source='player'){if(phase!=='battle'||!m||m.hp<=0)return false;const dealt=Math.min(damage,m.hp);if(source==='player'){m.playerDamage+=dealt;if(m.kind==='giant')bossDamage+=dealt;}m.hp-=dealt;if(!m.hp){if(m.playerDamage>0)kills++;if(m.kind==='giant')finish(true);}return !m.hp;}
 function tick(dt,width){if(phase!=='battle')return;elapsed+=dt;
  if(elapsed<72&&elapsed>=next){wave++;const lead=spawn(wave%2===1?'fireball':random()<Math.min(.5,.12+elapsed/240)?'medium':'small',width);
   if(wave%4===0){lead.kind='small';lead.hp=1;lead.r=.60;for(let i=1;i<=2;i++){const follower=spawn('small',width);follower.x=lead.x;follower.y=lead.y+i*1.65;follower.speed=lead.speed;follower.vx=lead.vx;follower.x=lead.x-lead.vx*i*1.65/lead.speed;} }
   if(wave%12===0){const extra=spawn('small',width);extra.x=-lead.x;extra.vx=-lead.vx;}
   next=elapsed+Math.max(.85,2.3-elapsed/85)+(wave%4===0?1.1:0);}
  if(elapsed>=75&&!boss){boss=true;spawn('giant',width);}
  for(const m of meteors)if(m.hp>0){m.x+=m.vx*dt;m.y-=m.speed*dt;if(m.kind==='giant')m.y=Math.max(2,m.y);else if(m.y< -6.5){m.hp=0;misses++;}}
  if(elapsed>=TRIAL_RULES.duration)finish(false);
 }
 return {tick,hit,spawn,meteors,getState:()=>({phase,elapsed,boss,kills,misses,bossDamage,passed,alive:meteors.filter(m=>m.hp>0).length})};
}
