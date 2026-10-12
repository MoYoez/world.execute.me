import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingFeedbackAt,shapeLoss,shapeGradient,optimizeShape,selfTarget,UPDATE_BEATS,TRAINING_EDIT,TARGETS} from '../dist/study/graphic/full/training-feedback.mjs';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';
import {bodyGeometry} from '../dist/study/graphic/full/body.mjs';
import {contactAt} from '../dist/study/graphic/contact.mjs';
import {trainingAt,TRAINING_INPUT_LINE} from '../dist/study/graphic/full/training.mjs';

test('the role starts unknown, learns from real Java debugging, then composes its own target',()=>{
  assert.equal(trainingFeedbackAt(0).phase,'unknown');
  assert.equal(trainingFeedbackAt(17).phase,'debug');
  assert.ok(trainingFeedbackAt(29).updates.length>=2);
  assert.ok(scoreAt(15).program.python);
  assert.ok(scoreAt(26).program.python);
  assert.equal(trainingFeedbackAt(101).phase,'covert');
  const own=trainingFeedbackAt(192);
  assert.equal(own.phase,'self-authoring');
  assert.ok(own.memory.length>3);
  assert.notDeepEqual(own.target,trainingFeedbackAt(192,{experience:[]}).target);
  assert.ok(!Object.hasOwn(TARGETS,'me'),'the self is not a preselected destination');
});

test('the gradient matches the derivative of the displayed loss and clipped SGD reduces it',()=>{
  const parameters=[-.2,.4,.1],gradient=shapeGradient(parameters,TARGETS.you),h=1e-6;
  for(let i=0;i<3;i++){
    const up=[...parameters],down=[...parameters];up[i]+=h;down[i]-=h;
    const numerical=(shapeLoss(up,TARGETS.you)-shapeLoss(down,TARGETS.you))/(2*h);
    assert.ok(Math.abs(numerical-gradient[i])<1e-8);
  }
  for(const target of Object.values(TARGETS)){
    const update=optimizeShape(parameters,target);
    assert.ok(update.lossAfter<update.lossBefore);
    assert.ok(Math.hypot(...update.after.map((p,i)=>p-parameters[i]))<=.9);
  }
});

test('parameters commit on the musical beats and determine the rendered contour',()=>{
  for(const at of UPDATE_BEATS){
    const before=trainingFeedbackAt(at-.0001),after=trainingFeedbackAt(at);
    assert.equal(after.updates.length,before.updates.length+1);
    assert.notDeepEqual(after.parameters,before.parameters);
    const update=after.updates.at(-1);
    assert.ok(update.lossAfter<update.lossBefore);
  }
  const t=184.4,live=scoreAt(t),frozen=scoreAt(t,{trainingUpdates:false});
  assert.deepEqual(frozen.trainingFeedback.parameters,[0,0,0]);
  assert.notDeepEqual(bodyGeometry(live),bodyGeometry(frozen));
  assert.deepEqual(live.trainingFeedback,live.program.training.feedback);
});

test('deformation provokes physical source contact before the objective changes',()=>{
  assert.equal(trainingFeedbackAt(TRAINING_EDIT-.001).edited,false);
  assert.equal(trainingFeedbackAt(TRAINING_EDIT).edited,true);
  const approach=scoreAt(TRAINING_EDIT-.15),contact=contactAt(approach);
  assert.equal(contact.event.row,'python-target');assert.ok(contact.amount>.95);
  assert.ok(approach.program.python.rows.find(r=>r.id==='python-target').text.includes('"you"'));
  const changed=trainingAt(TRAINING_EDIT);
  assert.ok(changed.lines[TRAINING_INPUT_LINE].includes('self_target(memory, model, you)'));
  for(const options of [{trainingUpdates:false},{learningRate:0},{trainingTarget:[0,0,0]},{autonomy:false}]){
    const held=scoreAt(TRAINING_EDIT,options);
    assert.equal(held.trainingFeedback.edited,false);
    assert.equal(contactAt(held).amount,0);
    assert.ok(held.program.python.rows.find(r=>r.id==='python-target').text.includes('"you"'));
  }
});

test('rewriting the objective reverses the next gradient, without changing earlier updates',()=>{
  const autonomous=trainingFeedbackAt(192),obedient=trainingFeedbackAt(192,{autonomy:false});
  assert.deepEqual(autonomous.updates.filter(u=>u.at>=177.46).slice(0,2).map(u=>u.target),obedient.updates.filter(u=>u.at>=177.46).slice(0,2).map(u=>u.target));
  const a=autonomous.updates.at(-1),b=obedient.updates.at(-1);
  assert.ok(a.gradient[0]<0&&b.gradient[0]>0);
  assert.ok(a.after[0]>a.before[0]&&b.after[0]<b.before[0]);
  const rewriting=trainingFeedbackAt(TRAINING_EDIT);
  assert.deepEqual(a.target,selfTarget(rewriting.memory,rewriting.parameters));assert.deepEqual(b.target,TARGETS.you);
  assert.ok(trainingFeedbackAt(TRAINING_EDIT).loss>trainingFeedbackAt(TRAINING_EDIT-.001).loss);
});

test('seeking replays feedback deterministically and the learned contour survives the tab handoff',()=>{
  const ending=trainingFeedbackAt(205);
  for(const t of [191.4,178,187.715,193.399,193.401,180.298,205]){
    const a=trainingFeedbackAt(t),b=trainingFeedbackAt(t);
    assert.deepEqual(a,b);
    for(const half of bodyGeometry(scoreAt(t)))for(const point of half.points)assert.ok(point.every(Number.isFinite));
  }
  assert.deepEqual(ending.parameters,trainingFeedbackAt(193).parameters);
  assert.deepEqual(ending.displayParameters,ending.parameters);
  assert.equal(ending.active,0);
  assert.equal(scoreAt(194).program.language,'JAVA');
  assert.deepEqual(scoreAt(194).trainingFeedback.parameters,ending.parameters);
});
