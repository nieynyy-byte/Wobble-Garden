export const KEEPSAKE_KEY='wobble-garden.moon-keepsake.preview.v1';
export const LIVE_KEEPSAKE_KEY='wobble-garden.moon-keepsake.v1';
export const KEEPSAKES=['necklace','bandana'];
export function createKeepsakeState(storage,{preview=true}={}){
 const key=preview?KEEPSAKE_KEY:LIVE_KEEPSAKE_KEY;
 const read=()=>{try{const v=JSON.parse(storage.getItem(key));return {passed:v?.passed===true,choice:KEEPSAKES.includes(v?.choice)?v.choice:null,equipped:v?.equipped!==false};}catch{return {passed:false,choice:null,equipped:true};}};
 let state=read();
 function write(next){try{storage.setItem(key,JSON.stringify(next));state=next;return true;}catch{return false;}}
 return {getState:()=>({...state}),complete:()=>{state=read();return write({...state,passed:true});},choose(choice){state=read();if(!state.passed||state.choice||!KEEPSAKES.includes(choice))return false;return write({...state,choice,equipped:true});},equip(value){state=read();if(!state.choice)return false;return write({...state,equipped:!!value});},reset(){return write({passed:false,choice:null,equipped:true});}};
}
