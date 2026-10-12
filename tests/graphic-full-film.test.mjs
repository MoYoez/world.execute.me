import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas} from '../scripts/canvas-runtime.mjs';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';
import {bodyPose,contactAt,rowPoint} from '../dist/study/graphic/contact.mjs';
import {renderFilm,CUT,DURATION,WIDTH,HEIGHT} from '../dist/study/graphic/full/renderer.mjs';
import {waveAt} from '../dist/study/graphic/full/forms.mjs';
import {beat} from '../dist/study/graphic/full/beats.mjs';

test('all full-film geometry remains finite and the departed presence stays absent',()=>{
  for(let t=0;t<=DURATION;t+=.04){
    const s=scoreAt(t),contact=contactAt(s),pose=bodyPose(s,contact);
    for(const value of [...Object.values(s),...Object.values(pose)])if(typeof value==='number')assert.ok(Number.isFinite(value),`nonfinite at ${t}`);
    assert.ok(pose.scaleX>0&&pose.scaleY>0);
    if(t>110.93)assert.equal(s.targetAlpha,0);
    for(const row of s.program.rows){const p=rowPoint(s,row.id,contact);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
  }
});

test('the full film responds to executed shapes and actual autonomous edits',()=>{
  assert.equal(scoreAt(29.85).form,'scope');assert.equal(scoreAt(30).form,'points');
  assert.equal(scoreAt(34).form,'circle');assert.equal(scoreAt(38).form,'wave');
  assert.ok(scoreAt(108).close>.5,'creator repair closes the actor again');
  assert.ok(scoreAt(108.27).close<.01,'the next refusal reopens it');
  assert.ok(scoreAt(108,{autonomy:false}).close>.99);
  assert.equal(contactAt(scoreAt(108.55)).event.kind,'interrupt');
  assert.ok(bodyPose(scoreAt(107.4)).x<552);
});

test('changing current accelerates the wave without teleporting its phase',()=>{
  const at=beat('ENJOYMENT'),before=scoreAt(at-.00001),after=scoreAt(at+.00001);
  assert.ok(Number.isFinite(before.wavePhase));
  assert.ok(Math.abs(after.wavePhase-before.wavePhase)<.001);
  assert.ok(scoreAt(at+.8).wavePhase-scoreAt(at+.7).wavePhase>.37);
});

test('full-film backward seeking is deterministic and chapters render distinct images',()=>{
  const canvas=createCanvas(WIDTH,HEIGHT),ctx=canvas.getContext('2d');
  const hash=t=>{renderFilm(ctx,t);return createHash('sha256').update(canvas.data()).digest('hex');};
  const times=[0,15,30.7,35.2,38.7,49,75,76.5,79,82,84,87,89.3,90.9,94.3,107.4,108.55,118.8,148.2,163,186.3,206.5];
  const expected=times.map(hash);times.slice().reverse().forEach(hash);
  assert.deepEqual(times.map(hash),expected);assert.equal(new Set(expected).size,times.length);
});

test('you rests on the actual sine tangent, whose slope matches the sampled curve',()=>{
  for(let t=38;t<40.8;t+=.04){
    const s=scoreAt(t),wave=waveAt(s);
    assert.ok(Math.abs(s.offeredPlace.y+s.targetHeight/2-wave.y)<.001);
    const derivative=(waveAt(s,.001).y-waveAt(s,-.001).y)/.002;
    assert.ok(Math.abs(derivative-wave.slope)<.00001);
  }
});

test('the full music reaches its end before an immediate three-second blank',()=>{
  const canvas=createCanvas(WIDTH,HEIGHT),ctx=canvas.getContext('2d');
  const hash=t=>{renderFilm(ctx,t);return createHash('sha256').update(canvas.data()).digest('hex');};
  assert.equal(DURATION-CUT,3);
  assert.notEqual(hash(CUT-.001),hash(CUT),'the last musical frame is still the performance');
  assert.notEqual(hash(206.8),hash(CUT),'there is no premature cut or fade');
  for(const t of [CUT,CUT+.5,DURATION]){
    renderFilm(ctx,t,{cues:[{time:0,text:'fixture',zh:'测试'}]});const bytes=canvas.data();
    for(let i=4;i<bytes.length;i+=4)assert.equal(bytes.readUInt32LE(i),bytes.readUInt32LE(0));
  }
});
