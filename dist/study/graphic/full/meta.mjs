import {ease} from '../score.mjs';
import {DEPARTURE} from './score-script.mjs';

const mix=(a,b,p)=>a+(b-a)*p;
const point=(x,y)=>({x,y});
function track(t,frames){
  for(let i=1;i<frames.length;i++)if(t<frames[i][0]){
    const a=frames[i-1],b=frames[i],p=ease(t,a[0],b[0]);
    return point(mix(a[1],b[1],p),mix(a[2],b[2],p));
  }
  return point(...frames.at(-1).slice(1));
}
const PATH=[
  [85.5,1410,325],[86.7,1380,235],[87.6,1380,235],[88.15,1320,315],
  [89.4,1460,190],[90.5,1440,175],[91.35,1470,150],[92,1470,150],
  [94.8,1350,210],[97.8,1320,240],[98.55,1320,280],[99.4,1290,310],
  [100.1,1410,250],[101.2,1280,260],[102.3,1430,180],[103.4,1330,210],
  [104.6,1400,170],[105.98,1430,95],[107.25,1450,95],[108.5,1470,100],
  [109.25,1550,-30],[109.7,1670,15],[110.1,1670,180],[110.55,1680,220],[110.8,1700,-55],
];
const PROBE=[[22.4,1390,280],[23.25,1380,270],[24.2,1380,270],[24.48,1460,240],[25.2,1460,240],[25.75,1390,300],[28,1380,300]];

export function metaWindow(t){return t>=22.4&&t<28||t>=85.5&&t<114.1;}

// Intention and the rendered pointer are separate: the grasp can oppose the
// author's attempted movement. It never changes the browser's real input.
export function metaAt(t,viewer,{created=true,present=true,autonomy=true}={}){
  if(!autonomy||!created||!metaWindow(t))return null;
  const probe=t<28,departed=t>=DEPARTURE||!present;
  const phase=probe?'probe':t<90.5?'recognize':t<98.55?'watch':t<105.98?'plead':t<108.85?'resist':departed?'empty':'capture';
  const envelope=probe?ease(t,22.4,22.85)*(1-ease(t,27.2,28)):ease(t,85.5,86)*(1-ease(t,112.4,114.1));
  const scripted=track(t,probe?PROBE:PATH),lagged=track(t-.22,probe?PROBE:PATH);
  const weight=viewer&&Number.isFinite(viewer.x)&&Number.isFinite(viewer.y)?Math.max(0,Math.min(1,viewer.weight??1)):0;
  const intent=point(mix(scripted.x,viewer?.x??0,weight),mix(scripted.y,viewer?.y??0,weight));
  const following=point(mix(lagged.x,viewer?.followX??viewer?.x??0,weight),mix(lagged.y,viewer?.followY??viewer?.y??0,weight));
  const grip=departed?ease(t,DEPARTURE,110.95)*(1-ease(t,111.6,113.8)):ease(t,108.85,109.35)*(1-ease(t,110.56,DEPARTURE));
  const cage=point(1320-70*ease(t,109.25,109.85),174+42*ease(t,109.7,110.25));
  const cursor={x:mix(intent.x,cage.x,grip),y:mix(intent.y,cage.y,grip),alpha:departed?0:envelope,angle:grip*Math.sin(t*26)*.12};
  const palm=departed?cage:point(mix(following.x,cage.x,grip),mix(following.y,cage.y,grip));
  const reach=probe?(ease(t,22.7,23.6)*(1-ease(t,24.25,24.65))*.55+ease(t,25.1,25.8)*.7):
    phase==='plead'?(.38+.4*ease(t,100.35,101.2))*(1-.3*ease(t,102.05,102.55))*ease(t,98.55,99.05)*(1-ease(t,105.3,105.98)):
    phase==='capture'||phase==='empty'?ease(t,108.85,109.35):phase==='recognize'?.22:0;
  return {phase,envelope,awareness:probe?0:ease(t,87.1,88.149),youLabel:!probe&&!departed,
    intent,cursor,palm,grip,reach:reach*envelope,departed,caught:grip>.8,release:1-envelope,
    attention:envelope*(probe?.65:1),live:weight>0};
}
