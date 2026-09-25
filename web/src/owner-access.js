import {validBirthday} from './birthday-state.js';
// Local prototype unlock; production purchase verification needs a server.
const KEY='wobble-garden.owner.v1';
const CODES=new Set(['e9f7990e7cfc470382b73f3624bf4743e04ad5baad5e7d2ab526879b42bd2f91']);
export function createOwnerAccess(storage){
 let value={owner:false,color:'green'};try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(saved?.owner===true)value={owner:true,color:saved.color==='pink'?'pink':'green',birthday:validBirthday(saved.birthday)?saved.birthday:null};}catch{}
 function commit(next){try{if(!storage)throw Error();storage.setItem(KEY,JSON.stringify(next));value=next;return true;}catch{return false;}}
 return {setBirthday(birthday){return value.owner&&validBirthday(birthday)&&commit({...value,birthday});},getState:()=>({...value}),async unlock(code){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code.trim()));const hex=Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');if(!CODES.has(hex))return 'invalid';return commit({...value,owner:true})?'ok':'storage';},setColor(color){return value.owner&&['green','pink'].includes(color)&&commit({...value,color});}};
}
