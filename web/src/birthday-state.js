export const BIRTHDAY_VISIT_MS=90*60*1000;
export function validBirthday(value){if(typeof value!=='string'||!/^\d{2}-\d{2}$/.test(value))return false;const [m,d]=value.split('-').map(Number),date=new Date(2000,m-1,d);return date.getMonth()===m-1&&date.getDate()===d;}
export function isBirthday(owner,date=new Date()){return owner?.owner===true&&validBirthday(owner.birthday)&&owner.birthday===`${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function birthdaySchedule(date){const elapsed=((date.getHours()*60+date.getMinutes())*60+date.getSeconds())*1000+date.getMilliseconds();return {slot:Math.min(13,Math.floor(elapsed/BIRTHDAY_VISIT_MS)),age:elapsed%BIRTHDAY_VISIT_MS,evening:date.getHours()>=21,remaining:BIRTHDAY_VISIT_MS-elapsed%BIRTHDAY_VISIT_MS};}
export function createBirthdayState(storage){
 const KEY='wobble-garden.birthday-years.v2';let years={};
 try{const s=JSON.parse(storage?.getItem(KEY)||'{}');if(s&&typeof s==='object'&&!Array.isArray(s))for(const [year,day]of Object.entries(s))if(/^\d{4}$/.test(year)&&validBirthday(day))years[year]=day;
 const legacy=JSON.parse(storage?.getItem('wobble-garden.birthday-visits.v1')||'{}');for(const [key,time]of Object.entries(legacy||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isFinite(time)&&!years[key.slice(0,4)]&&validBirthday(key.slice(5)))years[key.slice(0,4)]=key.slice(5);
 }catch{}
 return {get(owner,date=new Date(),start=false){const year=String(date.getFullYear());let eligible=isBirthday({...owner,birthday:years[year]||owner?.birthday},date),storageError=false;
 if(eligible&&start&&!years[year]){const next={...years,[year]:owner.birthday};try{if(!storage)throw Error();storage.setItem(KEY,JSON.stringify(next));years=next;}catch{storageError=true;eligible=false;}}
 const active=eligible&&!!years[year],schedule=birthdaySchedule(date);return {active,visiting:active&&!schedule.evening,...schedule,celebratedThisYear:!!years[year],storageError};}};
}
