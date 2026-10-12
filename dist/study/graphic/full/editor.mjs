import { JAVA_PROGRAM } from './java-program.mjs';
import { SCRIPT } from './score-script.mjs';
import { trainingEditor } from './training.mjs';
import { selfWritingDraft } from './self-writing.mjs';
import { writtenRows } from './writing.mjs';
import { ease } from '../score.mjs';

export const BUILD_AT=.46, RUN_AT=.68;
const sourceById=new Map(JAVA_PROGRAM.lines.map(line=>[line.id,line]));

export function editorProgram(program,t,options){
  const rows=writtenRows(program,t);
  const draft=rows.find(row=>row.id==='draft-slot');
  if(draft&&t>=199.7){draft.text=selfWritingDraft(t);draft.author='scope';}
  const incomplete=program.rows.find(row=>row.id==='unfinished');
  if(incomplete){
    const insertion=rows.findIndex(row=>row.id==='draft-slot');
    rows.splice(insertion,0,{...incomplete,line:rows[insertion].line,size:18});
    rows.forEach((row,index)=>{row.index=index;});
  }
  const activeRewrite=program.effects.findLast(e=>e.type==='rewrite'&&t>=e.start&&t<e.at+.8);
  const activeInterrupt=program.effects.findLast(e=>e.type==='interrupt'&&t>=e.start&&t<e.end+.2);
  const repair=program.effects.findLast(e=>e.type==='repair'&&t>=e.start&&t<e.at+.08);
  const newest=rows.filter(r=>r.start>=0).sort((a,b)=>a.start-b.start);
  const writing=newest.findLast(r=>r.typing)??newest.at(-1);
  const selfWriting=t>=193.4,prepareDraft=t>=198.4;
  const intrusion=activeInterrupt??activeRewrite;
  const activeId=incomplete?'unfinished':prepareDraft?'draft-slot':repair?.row??activeInterrupt?.row??(writing?.typing?writing.id:activeRewrite?.row??writing?.id);
  const activeIndex=Math.max(0,rows.findIndex(row=>row.id===activeId));
  const latest=newest.at(-1),previous=newest.at(-2);
  const target=Math.max(0,(latest?.index??0)-5),before=Math.max(0,(previous?.index??0)-5);
  let offset=before+(target-before)*ease(t,latest?.start??0,(latest?.start??0)+.16);
  const focus=repair??intrusion;
  if(focus&&!incomplete){
    const hold=focus.end??focus.at+.4,exit=focus.end?focus.end+.2:focus.at+.8;
    const weight=ease(t,focus.start,focus.start+.2)*(1-ease(t,hold,exit));
    const focusIndex=rows.findIndex(row=>row.id===focus.row);
    offset+=(Math.max(0,focusIndex-5)-offset)*weight;
  }
  if(prepareDraft)offset+=(Math.max(0,activeIndex-5)-offset)*ease(t,198.4,199.3);
  return trainingEditor({...program,rows,activeIndex,sourceOffset:offset,java:true,
    typing:Boolean(repair||writing?.typing),
    fileName:'GodDrinksJava.java',language:'JAVA',files:['GodDrinksJava.java','train.py'],
    runState:program.edits.length?'RUNNING · MODIFIED':t<RUN_AT?'EDITING':'RUNNING',
    caret:{...program.caret,owner:selfWriting?'scope':'writer',visible:true},
  },t,options);
}

export function displayedSource(id){return sourceById.get(id)?.text.trim()??null;}
export function scriptSource(id){return SCRIPT.find(row=>row.id===id)?.text??null;}
