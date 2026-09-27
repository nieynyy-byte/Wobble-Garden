import * as T from 'three';
import {createMeteorKeepsakes} from './meteor-keepsake-model.js?v=release31';
import {createKeepsakeState} from './meteor-keepsake-state.js?v=31';
export function createKeepsakeReview({actor,storage,onHour=()=>{},preview=true}){
 const state=createKeepsakeState(storage,{preview}),model=createMeteorKeepsakes(actor);actor.add(model.root);model.set(null);
 let selected=state.getState().choice||'necklace',open=false,night=false,yaw=-.08,targetYaw=-.08;
 const ui=document.createElement('section');ui.className='keepsake-review';ui.hidden=true;
 ui.innerHTML=`<style>
 .keepsake-review[hidden]{display:none}.keepsake-review{position:fixed;z-index:120;bottom:12px;left:12px;right:12px;padding:16px 18px;border-radius:24px;background:#f6f1e8ed;backdrop-filter:blur(14px);color:#354737;font-family:Aileron,Arial,sans-serif;box-shadow:0 4px 25px #20312722;max-height:42vh;overflow:auto}.keepsake-review h2{font-size:21px;font-weight:900;margin:0 0 6px}.keepsake-review p{font-size:13px;margin:6px 0 12px}.keepsake-review button{font:inherit;border:1px solid #819176;border-radius:18px;padding:10px 14px;background:#fffaf0;color:#304c34;min-height:44px;touch-action:manipulation}.keepsake-review [aria-pressed=true],.keepsake-review .primary{background:#3d5c3e;color:#fff}.keepsake-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.keepsake-row button{flex:1}.keepsake-review [hidden]{display:none!important}.keepsake-open .garden>:not(.scene-wrap){visibility:hidden!important}.keepsake-open .eye-target{visibility:hidden!important}.keepsake-open .meteor-ui{visibility:hidden!important}.keepsake-review label{font-size:12px;display:flex;align-items:center;gap:12px;margin:10px 0}.keepsake-review input{flex:1;min-width:40px}.keepsake-note{min-height:16px}@media(min-aspect-ratio:6/5){.keepsake-review{left:auto;right:16px;top:18px;bottom:18px;width:270px;max-height:none;box-sizing:border-box}} </style>
 <h2>A keepsake of your journey</h2><p data-description>Try them on. One adventure, one keepsake.</p>
 <div class="keepsake-row" data-options><button data-kind="necklace">Meteor necklace</button><button data-kind="bandana">Meteor bandana</button></div>
 <label>Turn around <input aria-label="Turn the pot" type="range" min="-180" max="180" value="0"></label>
 <div class="keepsake-row"><button data-night>Night view</button><button data-wear hidden>Take off</button></div>
 <div class="keepsake-row" data-pick><button class="primary" data-choose>Choose this keepsake</button></div>
 <div data-confirm hidden><p>This choice is yours to keep. You can choose only one.</p><div class="keepsake-row"><button data-cancel>Keep trying</button><button class="primary" data-lock>Confirm choice</button></div></div>
 <p class="keepsake-note" role="status"></p><button data-close hidden>Back to my garden</button>`;
 document.body.append(ui);const q=s=>ui.querySelector(s);q('[data-night]').hidden=!preview;
 function refresh(){const s=state.getState();for(const b of ui.querySelectorAll('[data-kind]'))b.setAttribute('aria-pressed',String(b.dataset.kind===selected));q('[data-options]').hidden=!!s.choice;q('[data-pick]').hidden=!!s.choice;q('[data-wear]').hidden=!s.choice;q('[data-close]').hidden=!s.choice;q('[data-description]').textContent=s.choice?'Yours to keep. Wear it whenever you like.':selected==='necklace'?'Colorful meteor beads, with three glowing fireballs.':'Soft ivory cloth, green meteors. The knot rests at the back.';q('[data-wear]').textContent=s.equipped?'Take off':'Wear it';model.set(s.choice?(s.equipped?s.choice:null):selected);}
 for(const b of ui.querySelectorAll('[data-kind]'))b.onclick=()=>{selected=b.dataset.kind;q('[data-confirm]').hidden=true;refresh();};
 q('input').oninput=e=>targetYaw=Number(e.target.value)*Math.PI/180-.08;
 q('[data-night]').onclick=()=>{night=!night;onHour(night?22:10);q('[data-night]').textContent=night?'Day view':'Night view';};
 q('[data-choose]').onclick=()=>{q('[data-confirm]').hidden=false;q('[data-pick]').hidden=true;};
 q('[data-cancel]').onclick=()=>{q('[data-confirm]').hidden=true;refresh();};
 q('[data-lock]').onclick=()=>{if(state.choose(selected)){q('[data-confirm]').hidden=true;q('.keepsake-note').textContent=preview?'Your keepsake is saved in this preview.':'Your keepsake is yours to keep.';refresh();}else q('.keepsake-note').textContent='Could not save the choice. Please try again.';};
 q('[data-wear]').onclick=()=>{if(state.equip(!state.getState().equipped))refresh();else q('.keepsake-note').textContent='Could not save. Please try again.';};
 q('[data-close]').onclick=()=>{open=false;ui.hidden=true;document.body.classList.remove('keepsake-open');actor.rotation.y=-.08;onHour(null);};
 function show(){if(!state.getState().passed)return false;open=true;ui.hidden=false;document.body.classList.add('keepsake-open');if(preview)onHour(night?22:10);refresh();return true;}
 if(state.getState().choice)model.set(state.getState().equipped?state.getState().choice:null);
 return {unlock:()=>state.complete(),complete(){if(!state.complete())return false;return show();},show,reset(){if(!preview)return false;state.reset();model.set(null);open=false;ui.hidden=true;document.body.classList.remove('keepsake-open');onHour(null);},update(time,dt,camera,darkness=0){if(open){yaw=T.MathUtils.lerp(yaw,targetYaw,1-Math.exp(-dt*6));actor.rotation.y=yaw;const wide=camera.aspect>1.2;camera.position.set(wide?1.45:0,2.5,wide?6.5:10);camera.lookAt(wide?1.45:0,wide?1.25:.12,0);}model.update(time,camera,preview?(night?1:0):darkness);},getState:()=>({...state.getState(),open,selected,model:model.getState()}),dispose(){model.dispose();ui.remove();}};
}
