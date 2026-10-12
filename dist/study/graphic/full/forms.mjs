import { ease } from '../score.mjs';
// Shared geometry keeps the offered surface, the pointer and "you" aligned.
export const TAU = Math.PI * 2;
export const formSize = s => ({ w:s.rx*1.7, h:s.ry*1.25 });
export function waveAt(s,x=0) {
  const {w,h}=formSize(s),u=(x/(w*1.45)+.5)*TAU*1.5-s.wavePhase;
  return {y:Math.sin(u)*h*.4*s.amplitude,slope:Math.cos(u)*h*.4*s.amplitude*TAU*1.5/(w*1.45)};
}
export function offeredPlace(s,form) {
  const {w,h}=formSize(s);
  if(form==='wave')return{x:0,y:waveAt(s).y-s.targetHeight/2,angle:0};
  if(form==='infinity')return{x:(w*.72+14)*(1-ease(s.t,55.58,56.7)),y:0,angle:0};
  if(['eggplant','tomato','cat'].includes(form))return{x:Math.min(340,w*.8),y:30,angle:0};
  return{x:0,y:0,angle:0};
}
