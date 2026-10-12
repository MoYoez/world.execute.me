import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';
import {programAt} from '../dist/study/graphic/full/program.mjs';
import {GESTURES} from '../dist/study/graphic/full/duet.mjs';
import {contactAt,bodyPose} from '../dist/study/graphic/contact.mjs';

test('early cooperation keeps the pointer on the moving surface; later refusal separates them',()=>{
  for(const t of [8.5,19,34.5]){
    const d=scoreAt(t).duet,p=d.pointer;
    assert.ok(d.writerAway);assert.ok(p.down);
    assert.ok(Math.hypot(p.x-p.contactX,p.y-p.contactY)<1,`contact at ${t}`);
  }
  const p=scoreAt(75.8).duet.pointer;
  assert.equal(p.down,false);assert.ok(Math.hypot(p.x-p.contactX,p.y-p.contactY)>90);
});

test('the first pushback really reopens the lock, and restoring amplitude really edits the source',()=>{
  assert.equal(programAt(63.8).actor.locked,true);
  assert.equal(programAt(64.3).actor.locked,false);
  assert.equal(programAt(64.3,{autonomy:false}).actor.locked,true);
  assert.equal(programAt(80.3).actor.amplitude,1.8);
  assert.equal(programAt(80.3,{autonomy:false}).actor.amplitude,1);
  assert.equal(programAt(82).rows.find(r=>r.id==='amplitude-79').text,'me.amplitude(1.8);');
});

test('the first blocked cursor freezes real typing before the later full theft',()=>{
  const row=t=>programAt(t).rows.find(r=>r.id==='clock-fast').text;
  assert.equal(programAt(91.75).caret.stolen,true);
  assert.equal(row(91.7),row(91.86));
  assert.equal(row(92.01),'me.time(AM);');
  assert.equal(programAt(92.1).actor.period,'AM');
  assert.equal(contactAt(scoreAt(91.75)).amount,0,'blocking occurs in the stage, not an unexplained editor rush');
});

test('early gesture boundaries do not teleport the body and trajectories remain finite',()=>{
  for(const gesture of GESTURES)for(const t of [gesture.start,gesture.end]){
    const a=bodyPose(scoreAt(t-.00001)),b=bodyPose(scoreAt(t+.00001));
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.1,`boundary ${t}`);
  }
  for(let t=6;t<105;t+=.025){
    const s=scoreAt(t),d=s.duet;
    for(const value of Object.values(d))if(typeof value==='number')assert.ok(Number.isFinite(value));
    if(d.pointer)for(const value of Object.values(d.pointer))if(typeof value==='number')assert.ok(Number.isFinite(value));
  }
});
