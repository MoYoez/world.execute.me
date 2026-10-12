import { rowPoint, FONT } from '../contact.mjs';
import { ease } from '../score.mjs';
import { CUT } from './score-script.mjs';
import { TRAINING_EXIT_TEXT } from './training.mjs';

export function selfWritingDraft(t){
  if(t<199.85||t>=201.05)return '';
  if(t<200.12)return 'm';
  if(t<200.78)return 'me';
  return 'm';
}

export function selfWritingReach(t){
  const hesitate=ease(t,201.15,201.8)*(1-ease(t,202.55,203.4));
  return ease(t,198.4,199.65)*(1-hesitate*.32);
}

function handoffTarget(ctx,s){
  const row=s.program.python?.rows.find(r=>r.id==='python-loss');
  const p=rowPoint(s,'python-loss');
  ctx.save();ctx.font=`${row?.size??15}px ${FONT}`;const width=ctx.measureText(row?.text??TRAINING_EXIT_TEXT).width;ctx.restore();
  return {x:p.x+width+3,y:p.y,angle:0};
}

export function writingTarget(ctx,s){
  const row=s.program.rows.find(r=>r.id==='unfinished')??s.program.rows.find(r=>r.id==='draft-slot');
  if(!row)return s.t>=193.4?handoffTarget(ctx,s):null;
  const p=rowPoint(s,row.id),focus=s.strike?.row===row.id?Math.max(s.strike.preload,s.strike.hit):0;
  ctx.save();ctx.font=`${(row.size??18)+focus*7}px ${FONT}`;
  const width=ctx.measureText(row.text).width;ctx.restore();
  return {x:p.x+Math.cos(p.angle)*(width+3),y:p.y+Math.sin(p.angle)*(width+3),angle:p.angle};
}

export function selfWritingAt(s,pose,target,handoff={x:295,y:362}){
  if(s.t<193.4||s.t>=CUT||!target)return null;
  const reach=selfWritingReach(s.t),release=ease(s.t,206.4,210.5);
  const origin={x:pose.x-s.rx*pose.scaleX*.64,y:pose.y+s.ry*pose.scaleY*.72};
  const transfer=ease(s.t,193.4,194.8);
  const tip=s.t<194.8?{
    x:handoff.x+(origin.x-handoff.x)*transfer,
    y:handoff.y+(origin.y-handoff.y)*transfer-75*Math.sin(transfer*Math.PI),
  }:{x:origin.x+(target.x-origin.x)*reach,y:origin.y+(target.y-origin.y)*reach};
  return {origin,tip,reach,release,ink:1-release*.82,
    typing:s.t>=204&&s.t<206.06||s.t>=199.85&&s.t<201.05};
}

export function drawSelfWriting(ctx,s,pose,target){
  const w=selfWritingAt(s,pose,target,handoffTarget(ctx,s));if(!w)return;
  const {origin:a,tip:b,reach}=w;
  ctx.save();ctx.beginPath();ctx.rect(0,0,1600,782);ctx.clip();
  // A narrow strip peels off the body and becomes the writing tip.
  // It is material from the actor, not an incoming author cursor or a signal wire.
  const bend=65*Math.sin(reach*Math.PI*.65),thickness=10*(1-w.release)+2;
  ctx.fillStyle='#f15c54';ctx.globalAlpha=w.ink*reach;
  ctx.beginPath();ctx.moveTo(a.x,a.y-thickness);
  ctx.bezierCurveTo(a.x-80,a.y-bend,b.x+35,b.y+24,b.x,b.y+12);
  ctx.lineTo(b.x,b.y+8);
  ctx.bezierCurveTo(b.x+26,b.y+18,a.x-70,a.y-bend+thickness,a.x,a.y+thickness);
  ctx.closePath();ctx.fill();
  ctx.globalAlpha=w.typing||s.t%1.1<.7?1:.3;
  ctx.translate(b.x,b.y);ctx.rotate((1-reach)*-.5+target.angle*reach);
  ctx.fillRect(-1.5,-12,3,24);
  ctx.restore();
}
