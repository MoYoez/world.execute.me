import { bracket } from '../renderer.mjs';
import { COLORS } from '../syntax.mjs';
import { ease } from './score.mjs';
import { formSize, waveAt } from './forms.mjs';
import { project, rowPoint } from '../contact.mjs';
import { beat, rise, COUNTS } from './beats.mjs';
import { drawLivingScope } from './body.mjs';

const TAU = Math.PI * 2;
function path(ctx, points, close = false) {
  ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  if (close) ctx.closePath(); ctx.stroke();
}

// Every form is the same actor. Shape commands change its geometry, rather
// than adding a detached illustration next to a motionless character.
export function drawForm(ctx, s, form, theme) {
  const {w,h}=formSize(s),a=s.amplitude;
  ctx.fillStyle = theme.fg; ctx.strokeStyle = theme.fg;
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  if (form === 'scope') {
    drawLivingScope(ctx,s,theme);
  } else if (form === 'points') {
    const depth=rise(s.t,'DIMENSION',.13)*a*1.3,turn=(s.t-29.8)*.15;
    // A flat point plane opens into a volume: the offered dimension is visible.
    for(let layer=0;layer<3;layer++) {
      const z=(layer-1)*50*depth;
      ctx.save();ctx.globalAlpha*=layer===1?1:.28+.32*depth/2;
      for(let i=0;i<20;i++) {
        const x=(i%5-2)*w*.2+z*Math.cos(turn),y=(Math.floor(i/5)-1.5)*h*.4-z*.6;
        ctx.fillRect(x-6,y-6,12,12);
        if(layer===0&&depth>0){ctx.strokeStyle=theme.blue;ctx.lineWidth=2.5;path(ctx,[[x,y],[x+100*depth*Math.cos(turn),y-60*depth]]);}
      }
      ctx.restore();
    }
  } else if (form === 'circle') {
    const r = Math.min(w*.57,h*.9)*(.88+.12*a);
    ctx.lineWidth = 27;
    ctx.beginPath(); ctx.arc(0,0,r,-Math.PI/2,-Math.PI/2 + TAU*.975); ctx.stroke();
    const perimeter=rise(s.t,'CIRCUMFERENCE');
    ctx.save();ctx.globalAlpha*=perimeter;
    ctx.strokeStyle = theme.blue; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(0,0,r+31,-Math.PI/2,-Math.PI/2+TAU*perimeter); ctx.stroke();
    const theta = (s.t-beat('CIRCUMFERENCE'))*.72;
    ctx.save(); ctx.rotate(theta); ctx.fillStyle = theme.blue;
    ctx.fillRect(r-8,-35,16,70); ctx.restore();
    ctx.fillStyle = theme.fg; ctx.font='15px Consolas, monospace';
    ctx.fillText('2πr',r+47,5);
    ctx.restore();
  } else if (form === 'wave') {
    const points = [];
    for(let i=0;i<=140;i++) {
      const x = (i/140-.5)*w*1.45;
      points.push([x,waveAt(s,x).y]);
    }
    ctx.lineWidth=23; path(ctx,points);
    ctx.strokeStyle=theme.blue; ctx.lineWidth=1;
    path(ctx,[[-w*.8,0],[w*.8,0]]);
    for(let i=0;i<3;i++) {
      const x=(i-1)*w*.4,{y,slope}=waveAt(s,x),length=230*rise(s.t,'TANGENTS',.1)/Math.sqrt(1+slope*slope);
      ctx.lineWidth=i===1?10:6;
      path(ctx,[[x-length,y-length*slope],[x+length,y+length*slope]]);
    }
  } else if (form === 'infinity') {
    const points=[];
    for(let i=0;i<=200;i++) {
      const u=i/200*TAU;
      points.push([Math.cos(u)*w*.72,Math.sin(u*2)*h*.65]);
    }
    ctx.lineWidth=25; path(ctx,points);
    ctx.save(); ctx.strokeStyle=theme.blue; ctx.lineWidth=1.5;
    for(let i=1;i<=4;i++) { ctx.scale(1.08,1.08); ctx.globalAlpha*=.65; path(ctx,points); }
    ctx.restore();
    const boundary=rise(s.t,'LIMITATIONS',.18);
    ctx.save();ctx.globalAlpha*=boundary;ctx.strokeStyle=COLORS.red;ctx.lineWidth=13;
    for(const side of [-1,1])path(ctx,[[side*w*.77,-h*boundary],[side*w*.77,h*boundary]]);
    ctx.restore();
  } else if (form === 'eggplant') {
    ctx.lineWidth=22;
    ctx.beginPath();ctx.moveTo(90,-95);
    ctx.bezierCurveTo(149,-32,71,52,-10,112);
    ctx.bezierCurveTo(-85,173,-181,135,-162,66);
    ctx.bezierCurveTo(-150,20,-66,11,-29,-46);
    ctx.bezierCurveTo(12,-114,50,-135,90,-95);ctx.closePath();ctx.stroke();
    ctx.strokeStyle=theme.blue;ctx.lineWidth=13;
    path(ctx,[[34,-100],[25,-153],[73,-123],[89,-162],[102,-115],[127,-113],[91,-87]]);
    ctx.beginPath();ctx.moveTo(75,-135);ctx.quadraticCurveTo(84,-178,120,-182);ctx.stroke();
    if(s.program.actor.offering==='NUTRIENTS') {
      // The source gives part of itself away; the recipient collects the cells.
      const age=s.t-s.program.executions.findLast(e=>e.command==='offer').at;
      for(let i=0;i<8;i++) {
        const p=ease(age,i*.025,.32+i*.025),x=-48+(s.offeredPlace.x+48)*p,y=45-80*Math.sin(p*Math.PI);
        ctx.fillStyle=p>.94?COLORS.red:theme.blue;ctx.globalAlpha=1-p*.3;
        ctx.fillRect(x-9,y-9+(i-3.5)*17,18,18);
      }
    }
  } else if (form === 'tomato') {
    const r=Math.min(w*.57,h*.9)*(.88+.12*a);
    ctx.lineWidth=23;ctx.beginPath();ctx.arc(0,12,r,0,TAU);ctx.stroke();
    ctx.fillStyle=theme.blue;ctx.beginPath();
    for(let i=0;i<10;i++) {
      const u=-Math.PI/2+i*Math.PI/5,leaf=i%2?29:78;
      const x=Math.cos(u)*leaf,y=-r+30+Math.sin(u)*leaf*.65;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fill();ctx.lineWidth=9;ctx.strokeStyle=theme.blue;path(ctx,[[0,-r+8],[12,-r-52]]);
    if(s.program.actor.offering==='ANTIOXIDANTS') {
      const x=s.offeredPlace.x,p=rise(s.t,'ANTIOXIDANTS',.16);
      ctx.lineWidth=9;ctx.globalAlpha=p;ctx.strokeStyle=theme.blue;
      path(ctx,[[x-45,-71],[x+45,-71],[x+45,78],[x,110],[x-45,78]],true);
      // Incoming fragments stop at the protection offered to "you".
      for(let i=0;i<5;i++) {
        const q=((s.t-beat('ANTIOXIDANTS'))*.85+i*.19)%1;
        ctx.globalAlpha=(1-q)*p;ctx.fillStyle=theme.blue;
        ctx.fillRect(x+51+(1-q)*100,-49+i*30,13,13);
      }
    }
  } else if (form === 'cat') {
    const purr=s.program.actor.purring?1:0,breath=Math.sin(s.wavePhase*2)*purr;
    ctx.save();ctx.scale(1+breath*.05,1-breath*.045);ctx.lineWidth=20;
    ctx.beginPath();ctx.moveTo(-128,-55);ctx.lineTo(-139,-167);ctx.lineTo(-43,-112);
    ctx.quadraticCurveTo(20,-140,68,-106);ctx.lineTo(140,-169);ctx.lineTo(136,-48);
    ctx.bezierCurveTo(199,114,64,172,-35,146);ctx.bezierCurveTo(-157,117,-177,20,-128,-55);ctx.stroke();
    ctx.lineWidth=7;ctx.strokeStyle=theme.blue;
    path(ctx,[[-33,-104],[-27,-60]]);
    path(ctx,[[0,-113],[0,-63]]);path(ctx,[[33,-106],[27,-60]]);
    path(ctx,[[-72,-7],[-43,0],[-19,-8]]);path(ctx,[[34,-8],[61,0],[84,-9]]);
    ctx.fillStyle=theme.fg;path(ctx,[[0,26],[18,26],[9,39]],true);
    for(let i=0;i<3;i++) {
      path(ctx,[[-75,39+i*18],[-172,22+i*34]]);
      path(ctx,[[79,39+i*18],[169,22+i*34]]);
    }
    ctx.restore();
    if(purr)for(let i=0;i<3;i++) {
      const q=((s.t-beat('ENJOYMENT'))*1.8+i/3)%1;
      ctx.globalAlpha=(1-q);ctx.lineWidth=8;ctx.strokeStyle=theme.blue;
      ctx.beginPath();ctx.ellipse(116,25,70+q*130,70+q*92,0,-.72,.72);ctx.stroke();
    }
  } else if (form === 'world') {
    const attention=rise(s.t,'EXISTENCE',.16)*Math.max(s.duet?.attention??0,.65),guard=s.duet?.guard??0;
    // It can generate whole little worlds. Their repetition stays hollow
    // until the author's attention brings the enclosing self into focus.
    ctx.save();ctx.strokeStyle=theme.blue;ctx.lineWidth=1.5;ctx.globalAlpha*=.42;
    for(let i=0;i<6;i++) {
      const x=(i%3-1)*154,y=(Math.floor(i/3)-.5)*210;
      ctx.save();ctx.translate(x,y);ctx.strokeRect(-63,-71,126,142);
      if(i%3===0){ctx.beginPath();ctx.arc(0,0,35,0,TAU);ctx.stroke();}
      else if(i%3===1){path(ctx,Array.from({length:41},(_,j)=>[(j/40-.5)*94,Math.sin(j/40*TAU+s.phase)*24]));}
      else {for(let j=0;j<9;j++){ctx.fillStyle=theme.blue;ctx.fillRect((j%3-1)*24-2,(Math.floor(j/3)-1)*24-2,4,4);}}
      ctx.restore();
    }
    ctx.restore();
    ctx.save();ctx.globalAlpha*=.15+.85*attention;ctx.fillStyle=theme.fg;
    const frame={...s,rx:s.rx*1.28,ry:s.ry*1.2,thickness:24+guard*18,lip:70+guard*95};
    bracket(ctx,frame,'left');bracket(ctx,frame,'right');ctx.restore();
    if(s.t>=88.84&&s.t<91.94) {
      ctx.font='26px Consolas, monospace';ctx.fillStyle=theme.fg;ctx.fillText(s.program.actor.gender,-13,h*.92);
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-h*.72,23,0,TAU);ctx.stroke();
      if(s.program.actor.gender==='F'){path(ctx,[[0,-h*.72+23],[0,-h*.72+65]]);path(ctx,[[-15,-h*.72+48],[15,-h*.72+48]]);}
      else {path(ctx,[[17,-h*.72-17],[44,-h*.72-44],[26,-h*.72-44]]);path(ctx,[[44,-h*.72-44],[44,-h*.72-26]]);}
    }
    if(s.t>=92.08&&s.t<95.78) {
      ctx.font='28px Consolas, monospace';ctx.fillStyle=theme.fg;ctx.fillText(s.program.actor.period,-17,h*.9);
      const turn=ease(s.t,92.08,94.7)*Math.PI;
      ctx.strokeStyle=theme.fg;ctx.lineWidth=4;
      path(ctx,[[0,0],[Math.sin(turn)*65,-Math.cos(turn)*65]]);
    }
  }
}

export function drawBlindfold(ctx,s,theme) {
  const shut=1-s.visible;if(shut<=0)return;
  ctx.save();ctx.globalAlpha=shut;ctx.fillStyle=theme.bg;
  const x=s.offeredPlace.x,y=s.offeredPlace.y;
  ctx.fillRect(x-75,y-105,150,205);
  ctx.strokeStyle=theme.blue;ctx.lineWidth=3;
  ctx.strokeRect(x-75,y-105,150,205);
  for(let i=0;i<6;i++)path(ctx,[[x-75,y-99+i*34],[x+75,y-99+i*34]]);
  ctx.restore();
}

export function drawGeometry(ctx,s,theme) {
  ctx.save();
  const p=s.shapeProgress;
  if(p<1) { ctx.save(); ctx.globalAlpha*=1-p; drawForm(ctx,s,s.previousForm,theme); ctx.restore(); }
  ctx.globalAlpha*=p; drawForm(ctx,s,s.form,theme); ctx.restore();
}

export function drawWorld(ctx,s,theme) {
  if(!s.program.actor.running) return;
  ctx.save(); ctx.translate(s.x,s.y);
  // The first instrumental passage gives the newly created space depth.
  const gridAlpha=.16*(1-ease(s.t,27.5,29.5));
  if(gridAlpha>0) {
    ctx.strokeStyle=theme.blue;ctx.lineWidth=1;ctx.globalAlpha=gridAlpha;
    const advance=(s.t*33)%56;
    for(let i=0;i<9;i++) {
      const r=40+i*56+advance;
      ctx.strokeRect(-r,-r*.65,r*2,r*1.3);
    }
    ctx.globalAlpha=.45;ctx.font='14px Consolas, monospace';ctx.fillStyle=theme.blue;
    ctx.fillText('0, 0',16,32);
  }
  // Changing current and clock changes the surrounding motion as well.
  if(s.t>=44.7&&s.t<58.2) {
    const phase=s.phase;
    ctx.globalAlpha=.18;ctx.strokeStyle=theme.blue;ctx.lineWidth=2;
    for(let i=0;i<8;i++) {
      const r=120+i*40;
      ctx.save();ctx.rotate((phase*.15+i*.12)*s.currentMix);ctx.strokeRect(-r,-r*.45,r*2,r*.9);ctx.restore();
    }
    if(s.t>=51.58&&s.t<55.4) {
      ctx.globalAlpha=.85;ctx.fillStyle=theme.blue;ctx.font='22px Consolas, monospace';
      ctx.textAlign='center';ctx.fillText(s.program.actor.era==='AD'?'A.D.':'B.C.',0,240);
    }
  }
  ctx.restore();
  if(s.program.executions.some(e=>e.command==='spawn')&&s.t<165.6) drawPeers(ctx,s,theme);
}

function drawPeers(ctx,s,theme) {
  const appear=rise(s.t,'ILLEGAL ARGUMENTS',.18);
  for(let i=0;i<6;i++) {
    const removed=s.program.executions.find(e=>e.command==='remove'&&e.value===i);
    const age=removed?s.t-removed.at:-1;
    if(age>1.3) continue;
    const x=640+(i%3)*210,y=205+Math.floor(i/3)*320;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=appear*(age<0?.7:1-ease(age,.2,1.3));
    ctx.strokeStyle=age<0?theme.blue:COLORS.red;ctx.lineWidth=age<0?2:5;
    if(age<0) {
      ctx.strokeRect(-67,-96,134,192);
      ctx.font='13px Consolas, monospace';ctx.fillStyle=theme.blue;ctx.fillText(`[${i}]`,-65,119);
      ctx.globalAlpha*=.3;ctx.fillRect(-52,-75,104,8);ctx.fillRect(-52,-53,65,5);
    } else {
      for(let j=0;j<6;j++) {
        ctx.save();ctx.translate((j%2?1:-1)*age*(100+j*42),(j-2.5)*age*64);ctx.rotate(age*(j%2?1:-1)*2);
        ctx.fillStyle=j%2?theme.fg:COLORS.red;ctx.fillRect(-60,-90+j*31,120,14);ctx.restore();
      }
    }
    ctx.restore();
  }
}

// At the climax the cuts are physical: the editor and its contents separate
// into slabs, then retain the missing rows in the same document.
export function drawRuptures(ctx,s,theme) {
  // Each spoken number singles out one empty slot; the six losses stay distinct.
  for(let i=0;i<COUNTS.length;i++){
    const age=s.t-COUNTS[i];if(age<0||age>.45)continue;
    const center=project(s,640+(i%3)*210,205+Math.floor(i/3)*320);
    ctx.save();ctx.translate(center.x,center.y);ctx.globalAlpha=1-ease(age,.12,.45);
    ctx.strokeStyle=COLORS.red;ctx.lineWidth=3;ctx.strokeRect(-52,-74,104,148);ctx.restore();
  }
  if(s.t>=beat('PROTECTION')&&s.t<beat('OBJECT CREATION')){
    const guard=rise(s.t,'PROTECTION');
    ctx.save();ctx.globalAlpha=guard*(1-ease(s.t,5.8,beat('OBJECT CREATION')));ctx.strokeStyle=theme.blue;ctx.lineWidth=3;
    ctx.strokeRect(925,255,270,300);
    for(let i=0;i<7;i++)path(ctx,[[930+i*40,250],[950+i*40,228]]);
    ctx.restore();
  }
  if(s.t>=162&&s.t<177) {
    const pressure=ease(s.t,162,165)*(1-ease(s.t,175,177));
    ctx.save();ctx.globalAlpha=pressure*.2;ctx.strokeStyle=theme.blue;ctx.lineWidth=1;
    for(let i=0;i<6;i++) {
      const r=70+i*64+(s.t*12)%64;
      ctx.strokeRect(1060-r,405-r*.72,r*2,r*1.44);
    }
    ctx.restore();
  }
}

export function drawEndSpace(ctx,s,theme) {
  if(s.t<176.96) return;
  const p=ease(s.t,176.96,179),empty=ease(s.t,188,192);
  ctx.save();ctx.strokeStyle=theme.blue;ctx.lineWidth=1;ctx.globalAlpha=.18*p;
  for(let i=0;i<5;i++) {
    const r=155+i*65;
    ctx.strokeRect(1060-r,405-r*.75,r*2,r*1.5);
  }
  ctx.globalAlpha=.12*p*(1-empty*.6);ctx.fillStyle=COLORS.red;
  // Only an unfilled memory remains; the departed presence never returns.
  ctx.strokeStyle=COLORS.red;ctx.setLineDash([2,9]);ctx.strokeRect(1018,324,84,162);ctx.setLineDash([]);
  ctx.restore();
}

export function drawExpandedScope(ctx,s,theme) {
  const growth=Math.max(0,Math.min(1,(s.limit-1)/5))*(1-ease(s.t,140,143));
  if(growth<=0||s.t<126)return;
  ctx.save();ctx.strokeStyle=theme.blue;ctx.lineWidth=2;
  // The rewritten limit surrounds the editor itself, consuming its margins.
  for(let i=0;i<6;i++) {
    const p=ease(growth, i/8, (i+3)/8);
    if(p<=0)continue;
    const inset=22+i*22;
    ctx.globalAlpha=(.36-i*.035)*p;
    ctx.strokeRect(inset,82+inset*.45,(1556-inset*2)*p,646-inset*.9);
  }
  ctx.restore();
}
