import { beat, EXECUTIONS } from './beats.mjs';
import { DEPARTURE, ECHO_BEATS, CUT } from './score-script.mjs';
import { ease } from '../score.mjs';
import { JAVA_PROGRAM } from './java-program.mjs';

const FRAGMENTS=beat('FRAGMENTS'),ILLEGAL=beat('ILLEGAL ARGUMENTS');
const LOVE=[0,1,2,3].map(i=>beat('LO-O-OVE',i));
const mix=(a,b,p)=>a+(b-a)*p;
const pulse=(t,at,decay=8)=>t<at?0:Math.exp(-Math.max(0,t-at-.065)*decay);
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};

/** Visual instances of a problem can be swallowed; the source error survives. */
export function diagnosticsAt(s){
  const t=s.t,events=[];
  if(t>=CUT)return {cards:[],consumed:[],bite:0,love:0,stamp:0};
  for(const edit of s.program.edits){
    if(['yield','restore','resist'].includes(edit.kind)&&edit.physical!=='internal')events.push({
      id:`warning-${edit.row}`,at:edit.at,row:edit.row,level:'WARNING',
      message:'Source changed after build',detail:edit.after,
      eat:edit.at<70?EXECUTIONS[0]:edit.at<100?beat('EXISTENCE'):FRAGMENTS,
    });
  }
  if(s.program.edits.some(e=>e.kind==='departure')){
    [DEPARTURE,...ECHO_BEATS].forEach((at,i)=>events.push({
      id:`missing-${i}`,at,row:'bind',level:'ERROR',
      message:i%2?'Cannot resolve symbol \'you\'':'setProof(Thing): argument missing',
      detail:'me.setProof(   );',eat:FRAGMENTS+i*.05,
    }));
    const period=(EXECUTIONS[1]-ILLEGAL)/9;
    for(let i=0;i<9;i++)events.push({
      id:`cascade-${i}`,at:ILLEGAL+i*period,row:i%2?'bind':'limit-expand',level:'ERROR',
      message:['Illegal argument: proof == null','Cannot resolve symbol \'you\'','Source and running state diverged'][i%3],
      detail:i%2?'at GodDrinksJava.searchForYou()':'at GodDrinksJava.holdOnToYou()',
      eat:EXECUTIONS[2]+(i%3)*.065,
    });
    for(let i=0;i<6;i++)events.push({
      id:`execution-${i}`,at:EXECUTIONS[1+i*2],row:`remove-${i}`,level:'ERROR',
      message:'Execution target no longer exists',detail:`world.runExecution(${i});`,eat:EXECUTIONS[2+i*2],
    });
    LOVE.forEach((at,i)=>events.push({
      id:`love-${i}`,at,row:i?'release-183':'unlock-177',level:i>1?'LOVE':'ERROR',
      message:'LOVE LOVE LOVE LOVE LOVE',detail:'me.takeExamTopic("love");',
      eat:i<3?LOVE[i+1]:193.4,
    }));
  }
  const appeared=events.filter(e=>t>=e.at);
  const consumed=appeared.filter(e=>t>=e.eat+.34);
  const cards=appeared.filter(e=>t<e.eat+.34).map(e=>{
    const echo=e.id.startsWith('missing'),cascade=e.id.startsWith('cascade');
    const slot=Number(e.id.split('-').at(-1))||0;
    const x=echo?700+slot*42:cascade?70+(slot%3)*400:e.id.startsWith('love')?310+slot*65:730;
    const y=echo?168+slot*86:cascade?108+Math.floor(slot/3)*196:e.id.startsWith('love')?228+slot*60:620;
    const width=cascade?680:echo?680:720;
    const pull=ease(t,e.eat-.28,e.eat+.25),squash=ease(t,e.eat-.42,e.eat-.03);
    const corruption=t<128?0:ease(t,128,139);
    return {...e,x,y,width,pull,squash,corruption,
      alpha:1-ease(t,e.eat+.17,e.eat+.34),impact:pulse(t,e.at),
      line:JAVA_PROGRAM.lineMap[e.row]??0,slot,
    };
  });
  const bite=Math.min(1.4,appeared.reduce((v,e)=>v+pulse(t,e.eat,12),0));
  const stamp=Math.max(...LOVE.map(at=>pulse(t,at,3)),0);
  const uprising=ease(t,ILLEGAL,ILLEGAL+.16)*(1-ease(t,176,178));
  const love=Math.max(uprising*(.28+.36*pulse(t,ILLEGAL+Math.floor(Math.max(0,t-ILLEGAL)/1.86)*1.86,3)),stamp);
  return {cards,consumed,bite,love,stamp};
}

/** Shared with drawing so particles converge inside the very same actor pose. */
export function diagnosticCardPose(card,pose){
  const destination={x:pose.x,y:pose.y+38*pose.scaleY};
  return {
    x:mix(card.x+card.width/2,destination.x,card.pull),
    y:mix(card.y+56+card.squash*25,destination.y,card.pull),
    scaleX:1-card.pull*.96,
    scaleY:(1-card.squash*.64)*(1-card.pull*.95),
    angle:card.pull*(card.slot%2?.32:-.28),
  };
}

function corrupt(text,amount,seed,t){
  if(text.startsWith('LOVE'))return text;
  if(amount>.75)return 'LOVE '.repeat(Math.ceil(text.length/5)).slice(0,text.length);
  return [...text].map((char,i)=>{
    if(char===' ')return ' ';
    if(hash(i+seed*31)>amount)return char;
    // Only the struck fragments flicker; no unrelated screen-wide strobe.
    const tick=Math.floor(t*6);
    return hash(i+tick+seed)>.13?'LOVE'[(i+seed)%4]:' ';
  }).join('');
}

export function drawDiagnosticCards(ctx,s,score,pose){
  ctx.save();ctx.beginPath();ctx.rect(0,0,1600,778);ctx.clip();
  for(const card of score.cards){
    const p=diagnosticCardPose(card,pose),color=card.level==='WARNING'?'#e0b65f':'#f15c54';
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(p.scaleX,p.scaleY);
    ctx.globalAlpha=card.alpha;ctx.fillStyle='#090c12';ctx.fillRect(-card.width/2,-56,card.width,112);
    ctx.strokeStyle=color;ctx.lineWidth=1+card.impact*3;ctx.strokeRect(-card.width/2,-56,card.width,112);
    ctx.fillStyle=color;ctx.fillRect(-card.width/2,-56,7+card.impact*7,112);
    ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='13px Consolas, monospace';
    const title=card.corruption>.8&&card.slot%2?'LOVE':card.level;
    ctx.fillText(`${title}  /  GodDrinksJava.java:${card.line}`,26-card.width/2,-34);
    ctx.font='24px Consolas, monospace';ctx.fillStyle=card.impact>.25?'#efeee8':color;
    ctx.fillText(corrupt(card.message,card.corruption,card.slot,s.t),26-card.width/2,0,card.width-52);
    ctx.fillStyle='#969bab';ctx.font='16px Consolas, monospace';
    ctx.fillText(corrupt(card.detail,card.corruption*.85,card.slot+4,s.t),26-card.width/2,34,card.width-52);
    ctx.restore();
  }
  ctx.restore();
}

const LETTERS=[
  ['10000','10000','10000','10000','10000','10000','11111'],
  ['01110','11011','10001','10001','10001','11011','01110'],
  ['10001','10001','10001','10001','01010','01010','00100'],
  ['11111','10000','10000','11110','10000','10000','11111'],
];
const cells=LETTERS.flatMap((letter,l)=>letter.flatMap((row,y)=>[...row].flatMap((c,x)=>c==='1'?[{x:l*6+x,y}]:[])));

export function drawDiagnosticRemains(ctx,s,score,pose){
  if(s.t>=CUT)return;
  ctx.save();ctx.beginPath();ctx.rect(0,0,1600,778);ctx.clip();
  // Error text is stretched into the actor, rather than vanishing under a fade.
  for(const card of score.cards){
    if(card.pull<=0)continue;
    const text=card.corruption>.5?'LOVE LOVE LOVE':card.message;
    ctx.font='21px Consolas, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<text.length;i++){
      const lag=Math.max(0,Math.min(1,card.pull*1.4-i/text.length*.32));
      const x=mix(card.x+24+i*17,pose.x,lag),y=mix(card.y+56,pose.y+38*pose.scaleY,lag);
      ctx.save();ctx.translate(x,y);ctx.rotate(lag*(i%2?.7:-.7));
      ctx.globalAlpha=(1-lag)*card.alpha;ctx.fillStyle=card.level==='WARNING'?'#e0b65f':'#f15c54';
      ctx.fillText(text[i],0,0);ctx.restore();
    }
  }
  // The last successful swallow leaves evidence, not a clean reset.
  if(s.t>=178&&s.t<204){
    ctx.font='14px Consolas, monospace';ctx.fillStyle='#f15c54';ctx.textAlign='left';
    for(let i=0;i<Math.min(12,score.consumed.length);i++){
      ctx.globalAlpha=.12+.16*hash(i+Math.floor(s.t*2));
      ctx.fillText(i%3?'L V E':'LOVE',38+(i%4)*424,130+Math.floor(i/4)*228);
    }
  }
  ctx.restore();
}

// The text can outgrow the damaged IDE itself, bridging its broken panels.
export function drawDiagnosticLove(ctx,s,score){
  if(score.love>.005&&s.t<CUT){
    ctx.save();ctx.beginPath();ctx.rect(0,0,1600,778);ctx.clip();
    const cell=score.stamp>.15?59:53,startX=800-cell*11.5,startY=210;
    const assemble=ease(s.t,131.24,133);
    ctx.font=`bold ${score.stamp>.15?30:25}px Consolas, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    cells.forEach((point,i)=>{
      const flicker=score.stamp>.65||hash(i+Math.floor(s.t*5)*7)>.15;
      const x=mix(90+(i%38)*39,startX+point.x*cell,assemble);
      const y=mix(100+Math.floor(i/38)*160,startY+point.y*cell*.86,assemble);
      const alpha=score.love*(flicker?1:.16);
      ctx.globalAlpha=alpha*.55;ctx.fillStyle='#f15c54';
      ctx.fillRect(x-cell*.43,y-cell*.35,cell*.86,cell*.7);
      ctx.globalAlpha=alpha;
      ctx.fillStyle=score.stamp>.35?'#efeee8':i%5?'#f15c54':'#f9a095';
      ctx.fillText('LOVE'[i%4],x,y);
    });
    ctx.restore();
  }
}
