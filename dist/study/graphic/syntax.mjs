import { ease } from './score.mjs';
import { DEPARTURE } from './full/score-script.mjs';
import { FONT, SOURCE, sourceLayout, rowPoint, contactAt, glyphPull, PYTHON_SOURCE } from './contact.mjs';
export { FONT, SOURCE, sourceLayout, rowPoint } from './contact.mjs';

export const COLORS = {
  paper: '#efeee8', ink: '#14171e', text: '#e1e4eb',
  red: '#f15c54', blue: '#79a8ff', violet: '#bb9af7', muted: '#657087',
};
export function themeAt(s) {
  const light = s.light ?? (s.t >= 9.76 && s.t < 11.53);
  return {
    bg: light ? COLORS.paper : COLORS.ink,
    fg: light ? COLORS.ink : COLORS.text,
    blue: light ? '#315eab' : COLORS.blue,
    keyword: light ? '#7455b3' : COLORS.violet,
    muted: light ? '#747a86' : COLORS.muted,
  };
}
function tokenColor(token, theme) {
  if (/^(var|new|true|false|null|package|import|static|public|private|final|class|void|if|instanceof|from|def|return)$/.test(token)) return theme.keyword;
  if (/^(Object|Scope|World|Thing|Lovable|PointSet|Circle|SineWave|Sequence|Eggplant|Tomato|TabbyCat|God|GodDrinksJava|bind|setProof|fit|lock|release|retain|shape|power|run|execute|runExecution|startSimulation|limit|amplitude|current|clock|vision|gender|role|spawn|remove|clear|offer|purr|time|era)$/.test(token)) return theme.blue;
  return theme.fg;
}
function sourceLine(ctx, row, s, theme, contact) {
  let x = 0, index = 0;
  const revision = row.revisions.at(-1);
  const modified = revision?.to ? row.text.indexOf(revision.to) : -1;
  for (const token of row.text.match(/[A-Za-z_]+|[^A-Za-z_]+/g) || []) {
    const color = tokenColor(token, theme);
    for (const letter of token) {
      const pull = glyphPull(s, row, index, contact);
      const changed = revision?.origin!=='writer'&&!row.repairing&&modified >= 0 && index >= modified && index < modified + revision.to.length;
      ctx.save(); ctx.translate(x + pull.x, pull.y); ctx.rotate(pull.angle);
      ctx.fillStyle = changed || row.author==='scope' ? COLORS.red : color; ctx.fillText(letter, 0, 0);
      if (changed) { ctx.globalAlpha = .5; ctx.fillRect(0, 15, ctx.measureText(letter).width, 1); }
      ctx.restore();
      x += ctx.measureText(letter).width; index++;
    }
  }
  return x;
}

export function drawSource(ctx, s, theme) {
  const contact=contactAt(s),python=s.program.python;
  ctx.save();ctx.textBaseline='middle';ctx.textAlign='left';
  ctx.fillStyle=theme.bg;ctx.fillRect(0,0,1600,64);ctx.fillRect(0,64,SOURCE.edge,692);
  ctx.strokeStyle=theme.muted;ctx.globalAlpha=.24;
  ctx.beginPath();ctx.moveTo(0,63.5);ctx.lineTo(1600,63.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(SOURCE.edge,64);
  if(contact.amount>.3){ctx.lineTo(SOURCE.edge,Math.max(64,contact.target.y-155));ctx.moveTo(SOURCE.edge,Math.min(756,contact.target.y+155));}
  ctx.lineTo(SOURCE.edge,756);ctx.stroke();ctx.globalAlpha=1;
  ctx.font=`17px ${FONT}`;ctx.fillStyle=theme.blue;ctx.fillText('{}',32,32);
  ctx.fillStyle=theme.fg;ctx.fillText('GodDrinksJava.java',76,32);
  ctx.fillStyle=theme.blue;ctx.fillRect(26,61,286,2);
  ctx.fillStyle=theme.muted;ctx.font=`12px ${FONT}`;ctx.fillText('JAVA',476,32);
  ctx.fillText(s.program.runState??'RUNNING',1300,32);
  if(python){
    ctx.fillStyle=theme.bg;ctx.fillRect(0,400,SOURCE.edge,39);
    ctx.strokeStyle=theme.muted;ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(0,400);ctx.lineTo(SOURCE.edge,400);ctx.moveTo(0,439);ctx.lineTo(SOURCE.edge,439);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=python.caret.owner==='scope'?COLORS.red:theme.blue;ctx.font=`12px ${FONT}`;ctx.fillText('Py',33,420);
    ctx.fillStyle=theme.fg;ctx.font=`16px ${FONT}`;ctx.fillText('train.py',76,420);
    const f=s.program.training.feedback;
    ctx.fillStyle=f.impact>.08?COLORS.red:theme.muted;ctx.font=`12px ${FONT}`;ctx.textAlign='right';ctx.fillText(`loss ${f.loss.toFixed(3)}`,528,420);ctx.textAlign='left';
  }
  for(const [pane,metrics] of [[s.program,SOURCE],...(python?[[python,PYTHON_SOURCE]]:[])]){
    const active=pane.activeIndex,localContact=pane.rows.some(r=>r.id===contact.event?.row);
    const focusId=localContact?contact.event.row:pane.rows[active]?.id;
    ctx.save();ctx.beginPath();ctx.rect(0,metrics.top,localContact?1600:SOURCE.edge,metrics.bottom-metrics.top);ctx.clip();
    for(const row of pane.rows){
      const point=rowPoint(s,row.id,contact);
      if(point.y<metrics.top-16||point.y>metrics.bottom+16)continue;
      ctx.save();ctx.translate(point.x,point.y);ctx.rotate(point.angle||0);
      if(row.id===focusId){ctx.fillStyle=pane.caret.owner==='scope'||localContact?COLORS.red:theme.blue;ctx.globalAlpha=.09;ctx.fillRect(-15,-13,SOURCE.edge-82,26);ctx.globalAlpha=1;}
      ctx.textAlign='right';ctx.fillStyle=theme.muted;ctx.font=`13px ${FONT}`;ctx.fillText(String(row.line??row.index+1).padStart(2,'0'),-29,0);
      const hit=s.strike?.row===row.id?Math.max(s.strike.preload,s.strike.hit):0;
      ctx.textAlign='left';ctx.font=`${(row.size??metrics.size)+hit*5}px ${FONT}`;
      const end=sourceLine(ctx,row,s,theme,contact);
      if(row.index===active&&pane.caret.visible!==false&&!pane.caret.stolen&&(!s.writerAway||pane.caret.owner==='scope')&&(s.t<row.end||s.t%.9<.54)){
        ctx.fillStyle=pane.caret.owner==='scope'?COLORS.red:theme.blue;ctx.fillRect(end+3,-10,2,20);
      }
      if(row.revisions.length){ctx.fillStyle=COLORS.red;ctx.globalAlpha=.7;ctx.fillRect(-20,-9,2,18);ctx.globalAlpha=1;}
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawScope(ctx, s, theme) {
  ctx.save();
  const x = -s.rx + s.thickness + 13, y = -s.ry + s.thickness + 13;
  const width = Math.max(0, s.rx * 2 - s.thickness * 2 - 26);
  const height = s.ry * 2 - s.thickness * 2 - 26;
  ctx.fillStyle = theme.blue; ctx.globalAlpha = .045 + .085 * s.close;
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = .26; ctx.strokeStyle = theme.blue; ctx.lineWidth = 1;
  ctx.setLineDash([4, 7]); ctx.strokeRect(x, y, width, height); ctx.setLineDash([]);
  ctx.globalAlpha = .62; ctx.fillStyle = theme.blue;
  ctx.font = `12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('me', 0, -s.ry - 25);
  if (s.t >= (s.departure ?? DEPARTURE) + .13) {
    ctx.globalAlpha = .5; ctx.font = `18px ${FONT}`; ctx.fillText('null', 0, 0);
  }
  ctx.restore();
}
