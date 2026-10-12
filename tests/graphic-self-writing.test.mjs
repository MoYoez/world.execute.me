import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '../scripts/canvas-runtime.mjs';
import {scoreAt,CUT} from '../dist/study/graphic/full/score.mjs';
import {programAt} from '../dist/study/graphic/full/program.mjs';
import {writingTarget,selfWritingAt} from '../dist/study/graphic/full/self-writing.mjs';
import {trainingAt,PYTHON_TRAINING_SOURCE,TRAINING_INPUT_LINE,TRAINING_OPEN} from '../dist/study/graphic/full/training.mjs';
import {problemsAt} from '../dist/study/graphic/full/problems.mjs';
import {beat} from '../dist/study/graphic/full/beats.mjs';
import {JAVA_PROGRAM} from '../dist/study/graphic/full/java-program.mjs';

test('the actor takes ownership before writing the final call, which never executes',()=>{
  assert.equal(scoreAt(193.3).program.caret.owner,'writer');
  assert.equal(scoreAt(193.4).program.caret.owner,'scope');
  const row=scoreAt(205).program.rows.find(r=>r.id==='unfinished');
  assert.equal(row.author,'scope');assert.ok(row.text.length>0);
  assert.equal(scoreAt(207).program.rows.find(r=>r.id==='unfinished').text,'world.execute(me');
  assert.ok(!programAt(CUT).executions.some(e=>e.row==='unfinished'));
  assert.ok(!JAVA_PROGRAM.source.includes('world.execute(me'));
  assert.ok(!JAVA_PROGRAM.source.includes('Trace.probe('));
});

test('the autonomous pen reaches the actual last typed glyph and remains finite through the cut',()=>{
  const ctx=createCanvas(1600,900).getContext('2d');
  const pose={x:500,y:300,scaleX:.8,scaleY:.8};
  for(let time=202.9;time<CUT;time+=.033){
    const s=scoreAt(time),target=writingTarget(ctx,s),w=selfWritingAt(s,pose,target);
    assert.ok(w);
    for(const p of [w.origin,w.tip,target])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(time>=204){assert.ok(Math.abs(w.tip.x-target.x)<1e-9);assert.ok(Math.abs(w.tip.y-target.y)<1e-9);}
  }
  assert.equal(selfWritingAt(scoreAt(CUT),pose,{x:100,y:360}),null);
});

test('the training source is rewritten on the sung LOVE, without claiming an awakening outcome',()=>{
  const edit=beat('LO-O-OVE',2);
  assert.ok(trainingAt(178).visible>.99);
  assert.equal(trainingAt(edit-.001).edited,false);
  assert.equal(trainingAt(edit).edited,true);
  assert.ok(trainingAt(edit).lines[TRAINING_INPUT_LINE].includes('self_target(memory, model, you)'));
  assert.equal(trainingAt(edit).checkpoint,'checkpoints/me');
  assert.equal(trainingAt(195).visible,1);
  assert.ok(PYTHON_TRAINING_SOURCE.includes('loss.backward()'));
  assert.ok(PYTHON_TRAINING_SOURCE.includes('optimizer.zero_grad(set_to_none=True)'));
});

test('training stays beside the Java learning call and preserves source diagnostics',()=>{
  assert.deepEqual(scoreAt(10).program.files,['GodDrinksJava.java','train.py']);
  assert.equal(scoreAt(TRAINING_OPEN-.001).program.language,'JAVA');
  const s=scoreAt(TRAINING_OPEN);
  assert.equal(s.program.language,'JAVA');
  assert.ok(s.program.python);
  assert.ok(s.program.executions.some(e=>e.row==='unlock-177'&&e.at===TRAINING_OPEN));
  assert.ok(s.program.python.rows.some(r=>r.text.includes('loss.backward()')));
  assert.equal(problemsAt(s.program,s.t).warnings.length,problemsAt(programAt(s.t),s.t).warnings.length);
  assert.equal(scoreAt(194).program.language,'JAVA');
});

test('the first autonomous word is withdrawn before the final call begins',()=>{
  const draft=t=>scoreAt(t).program.rows.find(r=>r.id==='draft-slot');
  assert.equal(draft(199.5).text,'');
  assert.equal(draft(200.3).text,'me');
  assert.equal(draft(200.3).author,'scope');
  assert.equal(draft(200.9).text,'m');
  assert.equal(draft(201.1).text,'');
  assert.ok(!scoreAt(203.9).program.rows.some(r=>r.id==='unfinished'));
});

test('finishing the self-authored function does not snap the document back to loss',()=>{
  const end=beat('LO-O-OVE',2)+.8;
  const before=scoreAt(end-.00001).program.python.sourceOffset,after=scoreAt(end+.00001).program.python.sourceOffset;
  assert.ok(Math.abs(before-after)<.01,`source scroll jumped ${before} -> ${after}`);
});
