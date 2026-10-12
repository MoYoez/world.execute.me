import { EXECUTIONS, beat } from './beats.mjs';
import { CUT } from './score-script.mjs';

const panels=[
  [[0,0],[590,0],[552,64],[0,64]],
  [[590,0],[1600,0],[1600,64],[552,64]],
  [[0,64],[552,64],[552,295],[0,470]],
  [[0,470],[552,295],[590,782],[0,782]],
  [[552,64],[1600,64],[1600,300],[840,370],[552,295]],
  [[840,370],[1600,300],[1600,782],[930,680]],
  [[552,295],[840,370],[930,680],[1600,782],[590,782]],
];
const snapshots=new WeakMap();
const impact=(t,at)=>t<at?0:Math.exp(-Math.max(0,t-at-.067)*9);
export function fractureAt(t){
  if(t<EXECUTIONS[1]||t>=CUT)return {damage:0,hit:0,pieces:[]};
  const landed=EXECUTIONS.slice(1,13).filter(at=>at<=t).length;
  const hit=Math.max(...EXECUTIONS.slice(1,17).map(at=>impact(t,at)),
    ...[0,1,2,3].map(i=>impact(t,beat('LO-O-OVE',i))*.55));
  const damage=landed/12;
  return {damage,hit,pieces:panels.map((polygon,i)=>{
    const cx=polygon.reduce((n,p)=>n+p[0],0)/polygon.length;
    const cy=polygon.reduce((n,p)=>n+p[1],0)/polygon.length;
    const side=cx<800?-1:1,vertical=cy<350?-1:1;
    return {polygon,cx,cy,x:side*(damage*(i<2?18:7)+hit*(i<2?92:64)),
      y:vertical*(damage*(i<2?14:5)+hit*(i<2?34:43)),
      angle:(i%2?1:-1)*(damage*.006+hit*.055)};
  })};
}

function snapshotFor(canvas){
  if(snapshots.has(canvas))return snapshots.get(canvas);
  // HTML Canvas and the native export canvas both provide their own factory.
  const copy=canvas.ownerDocument?canvas.ownerDocument.createElement('canvas'):new canvas.constructor(1600,900);
  copy.width=1600;copy.height=900;snapshots.set(canvas,copy);return copy;
}

/** Fracture actual rendered IDE regions; diagnostic/body contacts travel together. */
export function drawFracture(ctx,s){
  const f=fractureAt(s.t);if(!f.pieces.length)return;
  const copy=snapshotFor(ctx.canvas),buffer=copy.getContext('2d');
  buffer.clearRect(0,0,1600,900);buffer.drawImage(ctx.canvas,0,0);
  ctx.save();ctx.beginPath();ctx.rect(0,0,1600,782);ctx.clip();
  ctx.fillStyle='#050609';ctx.fillRect(0,0,1600,782);
  for(const p of f.pieces){
    ctx.save();ctx.translate(p.cx+p.x,p.cy+p.y);ctx.rotate(p.angle);ctx.translate(-p.cx,-p.cy);
    ctx.beginPath();p.polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.save();ctx.clip();ctx.drawImage(copy,0,0);ctx.restore();
    ctx.globalAlpha=.16+f.hit*.6;ctx.strokeStyle='#f15c54';ctx.lineWidth=1+f.hit*3;ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
