import { ease } from '../score.mjs';
import { SOURCE, baseRowPoint, project } from '../contact.mjs';
import { waveAt } from './forms.mjs';
import { scopeSurface } from './body.mjs';

export const GESTURES = [
  { start:6.4, end:10.7, row:'create', kind:'offer', swing:66, lift:-36 },
  { start:15.6, end:25.8, row:'run', kind:'follow', swing:124, lift:-60 },
  { start:30.05, end:41.0, row:'points', kind:'balance', swing:98, lift:54 },
  { start:43.6, end:50.6, row:'limit-43', kind:'hesitate', swing:-98, lift:32 },
  { start:61.5, end:67.2, row:'fit-61', kind:'push', swing:-48, lift:12 },
  { start:73.2, end:77.6, row:'fit-71', kind:'dodge', swing:-58, lift:-28 },
  { start:79.7, end:82.1, row:'amplitude-79', kind:'restore', swing:0, lift:0 },
  { start:85.5, end:90.2, row:'orbit', kind:'witness', swing:30, lift:-14 },
  { start:90.8, end:97.1, row:'role-negative', kind:'block', swing:-84, lift:28 },
  { start:100.0, end:104.6, row:'scope-98', kind:'refuse', swing:-46, lift:18 },
];
const mix=(a,b,p)=>a+(b-a)*p;
const between=(t,a,b)=>ease(t,a,a+.4)*(1-ease(t,b-.4,b));
const empty=()=>({active:false,dx:0,dy:0,angle:0,squeeze:0,guard:0,writerAway:false,attention:0,pointer:null,kind:null});

function surface(s,form) {
  const w=s.rx*1.7,h=s.ry*1.25;
  if(form==='circle'||form==='tomato') {const r=Math.min(w*.57,h*.9)*(.88+.12*s.amplitude);return{x:r*.71,y:-r*.71};}
  if(form==='wave')return{x:0,y:waveAt(s).y};
  if(form==='infinity')return{x:w*.51,y:-h*.65};
  if(form==='points')return{x:w*.45,y:-h*.6};
  if(form==='eggplant')return{x:90,y:-95};
  if(form==='cat')return{x:100,y:-100};
  if(form==='world')return{x:s.rx*1.28-12,y:-s.ry*1.2*.65};
  return scopeSurface(s);
}

// These are blocking and reaction beats, not a free-running cursor ornament.
// A single pose drives both the actor's contact surface and the author's hand.
export function duetAt(s) {
  const episode=GESTURES.find(e=>s.t>=e.start&&s.t<e.end);
  if(!episode||!s.program.actor.created)return empty();
  const {start,end,kind}=episode,t=s.t;
  const enter=ease(t,start,start+.9),exit=1-ease(t,end-.85,end),visit=enter*exit;
  const p=Math.max(0,Math.min(1,(t-start-.85)/(end-start-1.6)));
  const motion=q=>Math.sin(q*Math.PI*2)*Math.sin(q*Math.PI);
  const lag=['hesitate','refuse'].includes(kind)?.11:0;
  const actorP=Math.max(0,p-lag),envelope=between(t,start+.35,end-.15);
  let dx=episode.swing*motion(actorP)*envelope;
  let dy=episode.lift*Math.sin(actorP*Math.PI)*envelope;
  let angle=dx*.0007,squeeze=0,guard=0;
  const targetDx=episode.swing*motion(p)*envelope;
  const targetDy=episode.lift*Math.sin(p*Math.PI)*envelope;
  if(kind==='offer') {dx-=26*Math.sin(p*Math.PI)*envelope;angle-=.07*visit;}
  if(kind==='balance') {dy+=28*Math.sin(p*Math.PI)*visit;angle+=.09*Math.sin(p*Math.PI*2)*visit;}
  if(kind==='hesitate') {squeeze=.13*between(t,44.6,47.6);dx+=65*between(t,45.2,47.3);}
  if(kind==='push') {squeeze=.13*between(t,62.4,64.2);dx+=18*between(t,64.15,65.6);angle-=.035*between(t,64.1,65.3);}
  if(kind==='dodge') {dx+=124*between(t,74.55,76.5);dy+=52*between(t,74.55,76.5);angle+=.15*between(t,74.55,76.5);}
  if(kind==='restore') {dx=0;dy=0;}
  if(kind==='block') {guard=between(t,91.35,94.8);angle-=.09*guard;}
  if(kind==='refuse') {dx+=88*between(t,101.2,103.5);squeeze=.10*visit;}
  const keyboard=s.program.typing&&!s.program.caret.stolen;
  const row=keyboard?s.program.rows[s.program.activeIndex]:s.program.rows.find(row=>row.id===episode.row)??s.program.rows.at(-1);
  const home=baseRowPoint(s,row?.id);
  // Use a stable column while away; typed characters cannot jiggle the hand.
  home.x=Math.min(SOURCE.edge-30,home.x+(row?.text.length??0)*SOURCE.size*.6+3);
  const base=project(s,s.x,s.y),now=surface(s,s.form),old=surface(s,s.previousForm);
  const local={x:mix(old.x,now.x,s.shapeProgress),y:mix(old.y,now.y,s.shapeProgress)};
  const rotation=s.cameraAngle+angle,c=Math.cos(rotation),n=Math.sin(rotation);
  const sx=s.zoom*s.stretchX*(1-squeeze),sy=s.zoom*s.stretchY*(1+squeeze*.5);
  const anchor={x:(local.x*sx*c-local.y*sy*n),y:(local.x*sx*n+local.y*sy*c)};
  const cooperative=['offer','follow','balance','witness'].includes(kind);
  let tip={x:base.x+anchor.x+(cooperative?dx:targetDx),y:base.y+anchor.y+(cooperative?dy:targetDy)};
  let down=visit>.92;
  if(kind==='hesitate'||kind==='refuse')down=down&&p<.5;
  if(kind==='push') {
    const shove=between(t,64.15,65.6);tip.x+=shove*26;tip.y-=shove*18;down=down&&t<64.2;
  }
  if(kind==='dodge')down=false;
  if(kind==='restore') {
    // After reducing the value the writer withdraws, leaving a brief opening.
    tip={x:home.x+64,y:home.y-90};down=false;
  }
  if(kind==='block') {
    tip={x:base.x+anchor.x+mix(targetDx,dx,guard),y:base.y+anchor.y+mix(targetDy,dy,guard)};
    down=down&&t<92.0;
  }
  const typingRow=s.program.rows[s.program.activeIndex];
  const returnToKeys=keyboard?1:typingRow?1-ease(t,typingRow.end,typingRow.end+.22):0;
  const handVisit=visit*(1-returnToKeys);
  const x=mix(home.x,tip.x,handVisit),y=mix(home.y,tip.y,handVisit);
  const alpha=ease(t,start,start+.18)*(1-ease(t,end-.18,end));
  return {
    active:true,kind,dx,dy,angle,squeeze,guard,
    writerAway:alpha>.05&&!keyboard,attention:kind==='witness'?visit:0,
    pointer:{x,y,alpha:keyboard?0:alpha,down:down&&!keyboard,angle:(kind==='push'?-.6*between(t,64.15,65.6):0),morph:handVisit,
      contactX:base.x+anchor.x+dx,contactY:base.y+anchor.y+dy},
  };
}

export function drawAuthor(ctx,s,theme) {
  if(s.meta)return;
  const d=s.duet,p=d?.pointer;if(!p)return;
  ctx.save();ctx.globalAlpha=p.alpha;ctx.translate(p.x,p.y);ctx.rotate(p.angle);
  ctx.fillStyle=theme.blue;ctx.strokeStyle=theme.bg;ctx.lineWidth=2;
  const m=p.morph;
  if(m<.08){ctx.fillRect(0,-12,3,24);ctx.restore();return;}
  ctx.scale(.75+.25*m,.75+.25*m);
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,34);ctx.lineTo(10,25);ctx.lineTo(17,42);
  ctx.lineTo(24,39);ctx.lineTo(17,23);ctx.lineTo(31,23);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}
