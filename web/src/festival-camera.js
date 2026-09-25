import {installCameraDrag} from './camera-control.js';
export function installFestivalCamera(surface,{enabled=()=>true}={}){
 const controls=installCameraDrag(surface,{enabled,onChange:()=>{},panLimit:5,panSpeed:10,zoomMin:.65,zoomMax:1.5});
 const state=()=>{const v=controls();return {x:v.pan,yaw:v.x,zoom:v.zoom};};
 return {update(dt){controls.update(dt);return state();},getState:state,isGesture:controls.isGesture};
}
