import { JAVA_PROGRAM } from './java-program.mjs';

export function problemsAt(program,t){
  const warnings=[],errors=[];
  const first=program.edits.find(e=>e.kind!=='departure');
  if(first)warnings.push({row:first.row,at:first.at,message:'Source changed after build'});
  for(const row of program.javaRows??program.rows){
    const change=row.revisions.at(-1);
    if(change?.kind==='consume'&&row.text==='')warnings.push({row:row.id,at:change.at,message:'Statement removed from running source'});
  }
  const missing=program.edits.find(e=>e.kind==='departure');
  if(missing)errors.push({row:missing.row,at:missing.at,message:'setProof(Thing): argument missing'});
  if(t>=204)errors.push({row:'unfinished',at:204,message:'Incomplete method call'});
  return {warnings,errors};
}

export function drawProblems(ctx,s){
  const {warnings,errors}=problemsAt(s.program,s.t);
  const newest=[...warnings,...errors].sort((a,b)=>a.at-b.at).at(-1);
  const color=errors.length?'#f15c54':warnings.length?'#d6ac58':'#6e7c93';
  ctx.save();ctx.globalAlpha=1;ctx.textBaseline='middle';ctx.font='12px Consolas, monospace';
  ctx.fillStyle=color;ctx.textAlign='left';
  ctx.fillText(`Problems   ${errors.length} error${errors.length===1?'':'s'}   ${warnings.length} warning${warnings.length===1?'':'s'}`,470,798);
  if(s.program.training&&s.program.training.feedback.active>.1){
    const v=s.program.training,f=v.feedback;
    ctx.textAlign='right';ctx.fillText(`loss ${f.loss.toFixed(3)}  /  θ [${f.displayParameters.map(p=>p.toFixed(2)).join(', ')}]  /  target ${f.objective}`,1570,798);
  }else if(newest){
    const age=s.t-newest.at,flash=age>=0&&age<.45?1-age/.45:0;
    ctx.globalAlpha=.07+flash*.12;ctx.fillRect(450,783,1150,29);ctx.globalAlpha=1;
    const line=JAVA_PROGRAM.lineMap[newest.row];
    ctx.textAlign='right';ctx.fillText(`${newest.message}${line?` :${line}`:''}`,1570,798);
  }
  ctx.restore();
}
