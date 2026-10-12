import {JAVA_PROGRAM} from './java-program.mjs';
import {SCRIPT} from './score-script.mjs';
import {typingStart} from './program.mjs';

const commands=new Map(SCRIPT.map(row=>[row.id,row]));
const first=JAVA_PROGRAM.lines.findIndex(row=>commands.has(row.id));
// Fold the launch scaffold; the method bodies have not been written yet.
const scaffold=JAVA_PROGRAM.lines.slice(0,first).filter(row=>
  [1,3,6,7,8,10,16,32].includes(row.line)).map(row=>({...row,
    text:row.text+([10,16].includes(row.line)?' … }':''),start:-1,end:-1}));
const body=JAVA_PROGRAM.lines.slice(first);
export const WRITING_ROWS=[...scaffold,...body.map((line,index)=>{
  const command=commands.get(line.id);
  if(command)return {...line,start:typingStart(command),end:command.end};
  if(line.id==='draft-slot')return {...line,start:198.4,end:198.4};
  const previous=body.slice(0,index).findLast(row=>commands.has(row.id));
  const next=body.slice(index+1).find(row=>commands.has(row.id));
  const end=next?typingStart(commands.get(next.id)):201.4;
  const begin=previous?commands.get(previous.id).end:0;
  const block=body.slice(previous?body.indexOf(previous)+1:0,next?body.indexOf(next):body.length).filter(row=>!commands.has(row.id)&&row.id!=='draft-slot');
  const duration=Math.min(.1,(end-begin)/Math.max(1,block.length));
  const start=end-duration*(block.length-block.findIndex(row=>row.id===line.id));
  return {...line,start,end:start+duration};
})].map(row=>({...row,text:row.text.replace(/^ {0,8}/,''),size:commands.has(row.id)?18:14}));

const javaText=text=>text.replace('me.bind(','me.setProof(').replace('me.vision(','me.canSee(').replace('world.remove(','world.runExecution(');
export function writtenRows(program,t){
  const live=new Map(program.rows.map(row=>[row.id,row]));
  return WRITING_ROWS.filter(row=>t>=row.start).map((line,index)=>{
    const state=live.get(line.id),revisions=state?.revisions??[];
    const progress=state?.progress??Math.min(1,(t-line.start)/Math.max(.001,line.end-line.start));
    let text=line.text.slice(0,Math.floor(line.text.length*progress));
    if(revisions.length||state?.repairing)text=javaText(state.text);
    return {...line,index,text,progress,revisions,repairing:state?.repairing,
      typing:t<line.end||Boolean(state?.repairing),author:state?.repairing||revisions.at(-1)?.origin==='writer'?undefined:revisions.length?'scope':undefined};
  });
}
