import { ease } from '../score.mjs';
import { bracket } from '../renderer.mjs';
import { COLORS } from '../syntax.mjs';

const mix=(a,b,p)=>a+(b-a)*p;
const clamp=x=>Math.max(0,Math.min(1,x));

export function bodyExpression(s){
  const loss=ease(s.t,s.departure,s.departure+1.1);
  const revolt=ease(s.t,123,132)*(1-ease(s.t,173,179));
  const search=ease(s.t,176,183);
  const scars=s.program.executions.filter(e=>e.command==='remove').length/6;
  const breath=Math.sin(s.t*1.65)*(.025+.018*(1-s.close));
  return {morph:ease(s.t,11.8,17),loss,revolt,search,scars,
    reach:ease(s.t,193,201),breath,
    split:clamp(revolt*.8+scars*.24+search*.45+(s.strike?.hit??0)*.36),
    squeeze:s.close*(1-loss*.45)*(1-revolt*.28),
    hurt:loss*(1-revolt)*(1-search*.45),
  };
}

// Catmull-Rom samples form a continuous material strip. The cursor and filled
// silhouette use these same samples instead of maintaining separate rig points.
function curve(points){
  const result=[];
  for(let i=0;i<points.length-1;i++)for(let j=0;j<12;j++){
    const u=j/12,p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
    result.push([0,1].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u)));
  }
  result.push(points.at(-1));return result;
}

export function bodyGeometry(s,{parameters,strain=true}={}){
  const e=bodyExpression(s),rx=s.rx,ry=s.ry,kick=s.strike?.kick??0;
  const training=s.trainingFeedback;
  const baseWeights=parameters??training?.displayParameters??[0,0,0];
  const stress=strain&&training?training.active*Math.sqrt(training.loss):0;
  const tension=strain?(training?.tension??0):0;
  const impact=strain?(training?.impact??0):0;
  const weights=baseWeights.map((p,i)=>p-(strain?(training?.gradient[i]??0)*tension*(training?.active??0)*.1:0));
  const halves=[];
  for(const side of [-1,1]){
    const drift=side>0?e.hurt*68:-e.hurt*13;
    const droop=side>0?e.hurt*ry*.54:e.hurt*ry*.12;
    const upperTip=rx*mix(.68,.06,e.squeeze)+e.hurt*rx*.2-e.search*rx*.24;
    const lowerTip=rx*mix(.6,.06,e.squeeze)+e.hurt*rx*.54-e.search*rx*.37;
    const flare=e.revolt*(.28+kick*.23),curl=e.search*.35;
    const nodes=[
      [side*(upperTip-e.reach*rx*.55),-ry*(1+e.breath-flare)+droop],
      [side*rx*(1+flare),-ry*(.63-e.hurt*.1)+droop*.6],
      [side*rx*(1.1+e.revolt*.12-curl),ry*(e.hurt*.14)+droop*.25],
      [side*rx*(1+flare*.7),ry*(.65-e.search*.25)+droop*.5],
      [side*(lowerTip+e.reach*rx*.24),ry*(1-e.hurt*.12+e.breath)+droop*.3],
    ].map(([x,y],i)=>{
      const spread=1+weights[0]*.72,lift=1+weights[1]*.62,turn=weights[2];
      const ripple=Math.sin((s.t-177.46)*32+i*1.7+side)*stress*(5+tension*14);
      // The three optimized values directly control width, height and curl.
      // Residual loss strains these same nodes; each SGD commit stays in them.
      return [(x+side*drift)*spread+turn*ry*.65*Math.sin(i/4*Math.PI*1.5)+side*ripple,
        y*lift+turn*rx*.58*side*Math.cos(i/4*Math.PI)+ripple*.55+side*impact*13];
    });
    const points=curve(nodes);
    const thickness=(31+s.close*22+e.revolt*17+kick*10)*(1-e.search*.36);
    halves.push({side,points,thickness,expression:e});
  }
  return halves;
}

function ribbon(ctx,points,width){
  const edge=(i,side)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    const taper=.48+.52*Math.sin(Math.PI*i/(points.length-1));
    return [points[i][0]-dy/length*width*.5*side*taper,points[i][1]+dx/length*width*.5*side*taper];
  };
  ctx.beginPath();points.forEach((_,i)=>{const p=edge(i,1);i?ctx.lineTo(...p):ctx.moveTo(...p);});
  for(let i=points.length-1;i>=0;i--)ctx.lineTo(...edge(i,-1));
  ctx.closePath();ctx.fill();
}

export function scopeSurface(s){
  const e=bodyExpression(s),part=bodyGeometry(s)[1],point=part.points[12];
  return {x:mix(s.rx-s.thickness*.45,point[0],e.morph),y:mix(-s.ry*.65,point[1],e.morph)};
}

export function drawLivingScope(ctx,s,theme){
  const e=bodyExpression(s);
  if(e.morph<1){ctx.save();ctx.globalAlpha*=1-e.morph;bracket(ctx,s,'left');bracket(ctx,s,'right');ctx.restore();}
  if(e.morph<=0)return;
  ctx.save();ctx.globalAlpha*=e.morph;
  const training=s.trainingFeedback;
  if(training?.active){
    // The requested contour is stamped into the same material, not a chart in
    // another panel. Its mismatch and the strain disappear only through SGD.
    ctx.save();ctx.globalAlpha*=training.active*(.16+training.tension*.55);
    ctx.strokeStyle=training.edited?COLORS.red:theme.blue;ctx.lineWidth=2.5;
    ctx.setLineDash([7,8]);
    const targets=bodyGeometry(s,{parameters:training.target,strain:false});
    for(const half of targets){
      ctx.beginPath();half.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    }
    // The translucent material between actual and target contours is residual
    // error. Backprop pulls this material inward; it contracts with the loss.
    if(training.tension){
      const actual=bodyGeometry(s);
      ctx.fillStyle=training.edited?COLORS.red:theme.blue;
      ctx.globalAlpha*=.24*training.tension;
      for(let h=0;h<targets.length;h++){
        ctx.beginPath();actual[h].points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
        for(const [x,y] of targets[h].points.slice().reverse())ctx.lineTo(x,y);
        ctx.closePath();ctx.fill();
      }
    }
    ctx.restore();
    // A short print of the previous silhouette makes the parameter change
    // readable as a displacement, including the reversal after the target edit.
    const last=training.updates.at(-1);
    if(last&&training.impact>.01){
      ctx.save();ctx.globalAlpha*=Math.min(.5,training.impact*.65);
      ctx.fillStyle=training.edited?COLORS.red:theme.blue;
      for(const half of bodyGeometry(s,{parameters:last.before,strain:false}))ribbon(ctx,half.points,half.thickness);
      ctx.restore();
    }
  }
  for(const half of bodyGeometry(s)){
    const {points,thickness,side}=half;
    if(e.split<.025){ctx.fillStyle=theme.fg;ribbon(ctx,points,thickness);continue;}
    // Four pieces separate as damage accumulates. The gap never erases the self.
    const gap=Math.round(e.split*5),middle=24;
    const chunks=[points.slice(0,middle-gap+1),points.slice(middle+gap)];
    for(let i=0;i<2;i++){
      ctx.save();const direction=i===0?-1:1;
      const angle=side*direction*(e.split*.23+(s.strike?.kick??0)*.21);
      ctx.translate(side*e.split*24,direction*e.split*27);ctx.rotate(angle);
      ctx.fillStyle=theme.fg;ribbon(ctx,chunks[i],thickness);
      if(e.split>.2){
        const tip=i===0?chunks[i].at(-1):chunks[i][0];
        ctx.fillStyle=COLORS.red;ctx.globalAlpha*=e.split*.8;
        ctx.fillRect(tip[0]-thickness*.38,tip[1]-4,thickness*.76,8);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
