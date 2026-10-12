import { CUES } from '../../../media/cues.mjs';
import { LYRIC_DELAY } from '../../../film/timeline.mjs';
import { EXECUTIONS } from './beats.mjs';
import { ease } from '../score.mjs';
import { project, rowPoint } from '../contact.mjs';
import { COLORS } from '../syntax.mjs';

const keywords=CUES.filter(c=>c.keyword&&c.text!=='EXECUTION').map(c=>({...c,at:c.time+LYRIC_DELAY}));
export function keywordPulse(t){
  const cue=keywords.findLast(c=>c.at<=t);
  if(!cue||t-cue.at>.45)return 0;
  return Math.exp(-Math.max(0,t-cue.at-.04)*10);
}

// The 12-word refrain alternates a committed deletion with the actor tearing
// its actual source row away. Anticipation is visible, but no effect lands early.
export function strikeAt(t,program,{autonomy=true}={}){
  const index=EXECUTIONS.findIndex(at=>t>=at-.24&&t<at+.66);
  if(index<0)return null;
  const at=EXECUTIONS[index],age=t-at;
  const repeat=index>=1&&index<=12,tearing=repeat&&index%2===0;
  if(tearing&&!autonomy)return null;
  const event=[...program.executions,...program.edits].find(e=>e.at===at);
  const final=index===EXECUTIONS.length-1;
  if(age>=0&&!event&&!final)return null;
  const peer=repeat?Math.floor((index-1)/2):null;
  const row=event?.row??(repeat?`remove-${peer}`:final?'unfinished':null);
  const hold=.067;
  const hit=age<0?0:Math.exp(-Math.max(0,age-hold)*9);
  const preload=age<0?ease(age,-.24,-.03):0;
  const rebound=age<hold?0:Math.sin((age-hold)*18)*Math.exp(-(age-hold)*7);
  const direction=repeat?(peer%2?1:-1):index%2?1:-1;
  const strength=repeat?1.1+peer*.12:final?.9:1.05;
  return {at,age,index,peer,row,tearing,final,hit,preload,rebound,direction,strength,
    kick:hit*strength,angle:direction*(hit*.16-rebound*.12),
    shakeX:age<hold?0:Math.sin((age-hold)*59)*hit*11*strength,
    shakeY:age<hold?0:Math.cos((age-hold)*47)*hit*7*strength};
}

// Emphasize the source row as its command takes effect, without a mouse click.
export function drawOperation(ctx,s,theme){
  const strike=s.strike;
  const event=s.program.effects.findLast(e=>e.type==='execute'&&s.t>=e.start-.12&&s.t<e.at+.24);
  const rowId=strike?.row??event?.row;
  if(!rowId)return;
  const row=s.program.rows.find(r=>r.id===rowId);if(!row)return;
  const at=strike?.at??event.at,age=s.t-at;
  if(age<-.3||age>.42)return;
  const p=rowPoint(s,rowId),w=Math.min(410,(row.text.length||20)*12.6),tear=strike?.tearing;
  const landed=age>=0,fade=1-ease(age,.16,.42);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=tear?COLORS.red:theme.blue;
  ctx.globalAlpha=(landed?.25:.12)*fade;ctx.fillRect(-9,-22,w+18,43);
  ctx.globalAlpha=fade;ctx.fillRect(-9,-22,4,43);
  ctx.restore();
}

export function drawStrike(ctx,s,theme){
  const v=s.strike;if(!v||v.age<0)return;
  const target=v.peer!==null&&!v.tearing?
    project(s,640+(v.peer%3)*210,205+Math.floor(v.peer/3)*320):rowPoint(s,v.row);
  const x=target.x+(v.tearing||v.peer===null?165:0),y=target.y;
  const progress=1-Math.exp(-Math.max(0,v.age)*18),fade=1-ease(v.age,.12,.48);
  if(fade<=0)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(v.direction*(v.tearing?-.23:.35));
  // A broad cut contacts the exact target, holds for two frames, then recoils.
  ctx.globalAlpha=fade;ctx.fillStyle=v.tearing?COLORS.red:theme.fg;
  ctx.beginPath();ctx.moveTo(-205-80*progress,-10-v.hit*12);ctx.lineTo(205+140*progress,-3);
  ctx.lineTo(148+140*progress,8+v.hit*18);ctx.lineTo(-170-80*progress,4);ctx.closePath();ctx.fill();
  ctx.fillStyle=COLORS.red;ctx.fillRect(-175,-4,350,8*v.hit+2);
  for(let i=0;i<7;i++){
    const side=i%2?1:-1,reach=progress*(90+i*32);
    ctx.save();ctx.translate(side*reach,(i-3)*24*(1+progress));ctx.rotate(side*(.25+progress*.7));
    ctx.fillStyle=i%3?theme.fg:COLORS.red;ctx.fillRect(-24,-4,48+(i%3)*22,8+v.hit*8);ctx.restore();
  }
  ctx.restore();
}
