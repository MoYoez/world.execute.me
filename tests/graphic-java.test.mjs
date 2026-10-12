import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {JAVA_PROGRAM} from '../dist/study/graphic/full/java-program.mjs';
import {programAt,CUT} from '../dist/study/graphic/full/program.mjs';
import {editorProgram,displayedSource} from '../dist/study/graphic/full/editor.mjs';
import {problemsAt} from '../dist/study/graphic/full/problems.mjs';
import {baseRowPoint} from '../dist/study/graphic/contact.mjs';

const names=['GodDrinksJava','World','Thing','Lovable','Score','Trace'];
const sourceDir=path.resolve('java/graphic/goddrinksjava');
const bin=name=>process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',name):name;
test('the displayed Java compiles and produces the exact events packaged for the film',async()=>{
  const build=await mkdtemp(path.join(tmpdir(),'graphic-java-check-'));
  try{
    const digest=createHash('sha256');
    for(const name of names)digest.update(await readFile(path.join(sourceDir,name+'.java')));
    assert.equal(digest.digest('hex'),JAVA_PROGRAM.sourceHash,'prepare:graphic-java must run after source edits');
    assert.equal(await readFile(path.join(sourceDir,'GodDrinksJava.java'),'utf8'),JAVA_PROGRAM.source);
    execFileSync(bin('javac'),['-encoding','UTF-8','-d',build,...names.map(n=>path.join(sourceDir,n+'.java'))],{windowsHide:true});
    const actual=JSON.parse(execFileSync(bin('java'),['-cp',build,JAVA_PROGRAM.className],{windowsHide:true,encoding:'utf8'}));
    assert.deepEqual(actual.events,JAVA_PROGRAM.events);
    const baseline=programAt(CUT,{autonomy:false});
    for(const event of actual.events){
      const replay=baseline.executions.find(e=>e.row===event.row);
      // Binding to the departed presence is rejected by the narrative state.
      assert.ok(replay,event.row);
      assert.equal(replay.at,event.at,event.row);
      assert.equal(replay.command,event.command.kind,event.row);
      assert.equal(replay.value,event.command.value,event.row);
    }
    assert.ok(!actual.events.some(e=>e.row==='unfinished'));
    const identity=path.join(build,'IdentityCheck.java');
    await writeFile(identity,'package goddrinksjava; class IdentityCheck { public static void main(String[] args) { Thing a = new Lovable("Me"); a.state.memories.add("you"); Trace.command=null; Thing b=new PointSet(a); Trace.command=null; Thing c=new Circle(b); if (a.state!=c.state || !c.state.memories.contains("you")) throw new AssertionError("Identity lost"); } }');
    execFileSync(bin('javac'),['-cp',build,'-d',build,identity],{windowsHide:true});
    execFileSync(bin('java'),['-cp',build,'goddrinksjava.IdentityCheck'],{windowsHide:true});
  }finally{await rm(build,{recursive:true,force:true});}
});

test('Java grows as a single live document, and future commands are not revealed',()=>{
  const view=t=>editorProgram(programAt(t),t);
  for(const time of [1,18,30,42,60]){
    assert.ok(!view(time).rows.some(r=>r.id==='execute-161'));
    const current=view(time);
    assert.equal((current.javaRows??current.rows).find(r=>r.id==='world').text,'world = new World(5);');
  }
  const a=view(29.49),b=view(29.7);
  assert.ok(a.rows.find(r=>r.id==='points').text.length<b.rows.find(r=>r.id==='points').text.length);
  assert.equal(a.caret.visible,true);
  assert.equal(a.rows[a.activeIndex].id,'points');
  assert.equal(view(108.5).rows.find(r=>r.id==='relock').text,view(108.65).rows.find(r=>r.id==='relock').text);
  assert.equal(view(64.3).runState,'RUNNING · MODIFIED');
  const gone=view(111).rows.find(r=>r.id==='bind');
  assert.equal(gone.text,'me.setProof(   );');
  assert.ok(view(207).rows.some(r=>r.id==='unfinished'&&r.text==='world.execute(me'));
  assert.ok(!JAVA_PROGRAM.source.includes('world.execute(me'));
  for(const [id,line]of Object.entries(JAVA_PROGRAM.lineMap)){
    assert.equal(displayedSource(id),JAVA_PROGRAM.source.split('\n')[line-1].trim());
  }
});

test('Problems follows actual source mutations and clears when seeking backwards',()=>{
  const at=t=>problemsAt(programAt(t),t);
  assert.deepEqual(at(60),{warnings:[],errors:[]});
  assert.equal(at(64.3).warnings.length,1);assert.equal(at(64.3).errors.length,0);
  assert.equal(at(110.8).errors[0].row,'bind');
  assert.equal(at(205).errors.at(-1).row,'unfinished');
  assert.equal(at(205).errors.length,2);
  assert.deepEqual(at(18),{warnings:[],errors:[]});
  assert.ok(at(149).warnings.some(w=>w.row==='remove-0'&&w.message==='Statement removed from running source'));
});

test('the editor brings the attacked argument into view before it is removed',()=>{
  const view=t=>editorProgram(programAt(t),t);
  const at=view(110.8),row=at.rows.find(r=>r.id==='bind');
  const y=baseRowPoint({program:at},row.id).y;
  assert.ok(y>=80&&y<=398,`attacked argument is visible at ${y}`);
  const left=view(111.6-.00001),right=view(111.6+.00001);
  assert.ok(Math.abs(left.sourceOffset-right.sourceOffset)<.01,'return from the attacked line is continuous');
});
