export const BIRTHDAY_VISIT_MS=90*60*1000;
export function validBirthday(value){
 if(typeof value!=='string'||!/^\d{2}-\d{2}$/.test(value))return false;
 const [m,d]=value.split('-').map(Number),date=new Date(2000,m-1,d);
 return date.getMonth()===m-1&&date.getDate()===d;
}
export function isBirthday(owner,date=new Date()){
 return owner?.owner===true&&validBirthday(owner.birthday)&&owner.birthday===`${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function createBirthdayState(storage){
 let memory={};try{const saved=JSON.parse(storage?.getItem('wobble-garden.birthday-visits.v1')||'{}');memory=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}catch{}
 return {get(owner,date=new Date(),start=false){
  const active=isBirthday(owner,date),key=`${date.getFullYear()}-${owner?.birthday}`,now=date.getTime();
  if(active&&start&&!Number.isFinite(memory[key])){memory[key]=now;try{storage?.setItem('wobble-garden.birthday-visits.v1',JSON.stringify(memory));}catch{}}
  const begun=memory[key],age=Number.isFinite(begun)?Math.max(0,now-begun):null;
  return {active,age,visiting:active&&age!==null&&age<BIRTHDAY_VISIT_MS,remaining:active&&age!==null?Math.max(0,BIRTHDAY_VISIT_MS-age):0};
 }};
}
