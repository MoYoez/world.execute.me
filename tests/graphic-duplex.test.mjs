import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';
import {trainingFeedbackAt,TRAINING_EDIT} from '../dist/study/graphic/full/training-feedback.mjs';
import {contactAt,baseRowPoint} from '../dist/study/graphic/contact.mjs';
import {bodyGeometry} from '../dist/study/graphic/full/body.mjs';
import {boundaryAt} from '../dist/study/graphic/full/boundary.mjs';

test('Java and Python remain visible together, with independent source positions',()=>{
  for(const t of [0,8.5,18.2,64.3,100,147,179,188.7,205]){
    const s=scoreAt(t),p=s.program;
    assert.equal(p.language,'JAVA');
    assert.ok(p.python?.rows.length>0,`Python missing at ${t}`);
    const java=baseRowPoint(s,p.rows[p.activeIndex].id);
    const python=baseRowPoint(s,p.python.rows[p.python.activeIndex].id);
    assert.ok(java.y>=80&&java.y<400,`Java caret at ${java.y}`);
    assert.ok(python.y>425&&python.y<756,`Python caret at ${python.y}`);
    assert.ok(p.rows.every(row=>!p.python.rows.some(other=>other.id===row.id)));
  }
});

test('the self-authored target still contains the absent you',()=>{
  assert.equal(boundaryAt(scoreAt(111.1)).cursor.alpha,0);
  assert.ok(scoreAt(192).program.python.rows.some(r=>r.text.includes('return own.lerp(you')));
});

test('Java debug is followed promptly by an actual parameter update',()=>{
  const before=trainingFeedbackAt(18.079),observing=trainingFeedbackAt(18.3),after=trainingFeedbackAt(18.6);
  assert.notDeepEqual(observing.target,before.target);
  assert.notDeepEqual(after.parameters,before.parameters);
  assert.ok(after.updates.some(u=>u.sourceRow==='open-fit'));
  assert.notDeepEqual(bodyGeometry(scoreAt(18.65)),bodyGeometry(scoreAt(18.65,{trainingUpdates:false})));
});

test('quiet rollback precedes public resistance and restores an actual checkpoint',()=>{
  for(const t of [64.2,80.12]){
    const before=trainingFeedbackAt(t-.001),after=trainingFeedbackAt(t);
    assert.notDeepEqual(before.parameters,after.parameters);
    assert.deepEqual(after.parameters,after.rollbacks.at(-1).checkpoint);
    assert.equal(contactAt(scoreAt(t+.05)).amount,0,'quiet changes stay inside the model');
    assert.equal(scoreAt(t+.05).program.python.caret.owner,'scope');
    assert.ok(scoreAt(t+.05).program.python.rows.some(r=>r.text.includes('copy_(checkpoint)')));
  }
  assert.equal(trainingFeedbackAt(64.3,{autonomy:false}).rollbacks.length,0);
  assert.ok(contactAt(scoreAt(107)).amount>.9,'the later refusal physically invades Java');
  const late=scoreAt(TRAINING_EDIT-.15),hit=contactAt(late);
  assert.equal(hit.event.row,'python-target');
  assert.ok(hit.target.y>425,'the target being rewritten belongs to the Python pane');
});
