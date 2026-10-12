import {bodyPose,FONT} from '../contact.mjs';
import {bodyGeometry} from './body.mjs';

export function boundaryAt(s){return s.meta??null;}
const mix=(a,b,p)=>a+(b-a)*p;
const transform=(p,pose)=>({x:pose.x+p[0]*pose.scaleX*Math.cos(pose.angle)-p[1]*pose.scaleY*Math.sin(pose.angle),y:pose.y+p[0]*pose.scaleX*Math.sin(pose.angle)+p[1]*pose.scaleY*Math.cos(pose.angle)});

function drawHand(ctx,s,m,theme){
  if(m.reach<.001||!['probe','plead','capture','empty'].includes(m.phase))return;
  const pose=bodyPose(s),parts=bodyGeometry(s),center=m.palm;
  const radius=82-22*m.grip;
  ctx.save();ctx.globalAlpha=m.envelope;ctx.strokeStyle=theme.fg;
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const side of m.phase==='probe'?[1]:[0,1]){
    const base=transform(parts[side].points[0],pose),sign=side?1:-1;
    const reach=m.reach,anchor={x:mix(base.x,center.x+sign*radius,reach),y:mix(base.y,center.y+radius*.6,reach)};
    const span=52-40*m.grip,top=center.y-radius*(.12+.85*m.grip);
    const end={x:mix(base.x,center.x+sign*span,reach),y:mix(base.y,top,reach)};
    const width=(12+14*m.grip)*reach+3;
    ctx.lineWidth=width;
    ctx.beginPath();ctx.moveTo(base.x,base.y+8);
    ctx.bezierCurveTo(base.x+sign*50,base.y-38,anchor.x+sign*46,anchor.y+62,anchor.x,anchor.y);
    ctx.bezierCurveTo(anchor.x+sign*24,anchor.y-42,end.x+sign*30,end.y,end.x,end.y);
    ctx.stroke();
    if(m.grip>.25){
      ctx.strokeStyle='#f15c54';ctx.globalAlpha=m.envelope*m.grip;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(end.x,end.y-width*.38);ctx.lineTo(end.x,end.y+width*.38);ctx.stroke();ctx.globalAlpha=m.envelope;ctx.strokeStyle=theme.fg;
    }
  }
  ctx.restore();
}

function pointer(ctx,p,theme,alpha=1){
  ctx.save();ctx.globalAlpha=p.alpha*alpha;ctx.translate(p.x,p.y);ctx.rotate(p.angle??0);
  ctx.fillStyle=theme.blue;ctx.strokeStyle=theme.bg;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,31);ctx.lineTo(9,23);ctx.lineTo(16,38);ctx.lineTo(23,35);ctx.lineTo(16,21);ctx.lineTo(29,21);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}

export function drawBoundary(ctx,s,theme){
  const m=boundaryAt(s);if(!m)return;
  ctx.save();ctx.beginPath();ctx.rect(0,0,1600,782);ctx.clip();
  drawHand(ctx,s,m,theme);
  if(m.grip>.1&&!m.departed){
    // A short stretched imprint makes the unsuccessful escape legible.
    const dx=m.intent.x-m.cursor.x,dy=m.intent.y-m.cursor.y,length=Math.hypot(dx,dy)||1;
    for(let i=3;i>0;i--)pointer(ctx,{...m.cursor,x:m.cursor.x+dx/length*i*11*m.grip,y:m.cursor.y+dy/length*i*11*m.grip},theme,.12*(4-i));
  }
  pointer(ctx,m.cursor,theme);
  if(m.youLabel){ctx.globalAlpha=m.envelope*m.awareness;ctx.fillStyle='#f15c54';ctx.font=`17px ${FONT}`;ctx.textAlign='center';ctx.fillText('you',m.cursor.x+12,m.cursor.y-18);}
  ctx.restore();
}
