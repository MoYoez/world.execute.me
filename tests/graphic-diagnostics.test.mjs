import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas} from '../scripts/canvas-runtime.mjs';
import {scoreAt,CUT} from '../dist/study/graphic/full/score.mjs';
import {diagnosticsAt,diagnosticCardPose} from '../dist/study/graphic/full/diagnostics.mjs';
import {fractureAt} from '../dist/study/graphic/full/fracture.mjs';
import {renderFilm} from '../dist/study/graphic/full/renderer.mjs';
import {beat,EXECUTIONS} from '../dist/study/graphic/full/beats.mjs';
import {ECHO_BEATS} from '../dist/study/graphic/full/score-script.mjs';
import {JAVA_PROGRAM} from '../dist/study/graphic/full/java-program.mjs';
const at=t=>diagnosticsAt(scoreAt(t));

test('diagnostics erupt on their source or lyric beat and swallowed instances stay gone',()=>{
  assert.equal(at(64.199).cards.length,0);
  assert.equal(at(64.2).cards.length,0);
  assert.equal(at(107.24).cards[0].level,'WARNING');
  assert.equal(at(110.8).cards.filter(c=>c.id.startsWith('missing')).length,1);
  ECHO_BEATS.forEach((time,i)=>{
    assert.equal(at(time-.001).cards.filter(c=>c.id.startsWith('missing')).length,i+1);
    assert.equal(at(time).cards.filter(c=>c.id.startsWith('missing')).length,i+2);
  });
  const end=beat('FRAGMENTS')+.7;
  assert.equal(at(end).cards.filter(c=>c.id.startsWith('missing')).length,0);
  assert.equal(at(end).consumed.filter(c=>c.id.startsWith('missing')).length,6);
  for(let i=0;i<6;i++){
    assert.ok(at(EXECUTIONS[1+i*2]).cards.some(c=>c.id===`execution-${i}`));
    assert.ok(!at(EXECUTIONS[2+i*2]+.35).cards.some(c=>c.id===`execution-${i}`));
  }
  assert.equal(at(60).cards.length,0);
});

test('consumed diagnostic text physically converges inside the actor and shrinks',()=>{
  const card=at(beat('FRAGMENTS')+.249).cards.find(c=>c.id==='missing-0');
  const actor={x:380,y:410,scaleY:1.3},p=diagnosticCardPose(card,actor);
  assert.ok(Math.abs(p.x-actor.x)<1);
  assert.ok(Math.abs(p.y-(actor.y+38*actor.scaleY))<1);
  assert.ok(p.scaleX<.05&&p.scaleY<.03);
});

test('each sung LOVE stamps strongly and every refrain execution displaces the IDE',()=>{
  for(let i=0;i<4;i++){
    assert.equal(at(beat('LO-O-OVE',i)).stamp,1);
    assert.ok(at(beat('LO-O-OVE',i)+1.5).stamp<.02);
  }
  assert.equal(fractureAt(EXECUTIONS[1]-.001).pieces.length,0);
  for(const time of EXECUTIONS.slice(1,13)){
    const f=fractureAt(time);assert.equal(f.hit,1);
    assert.ok(f.pieces.some(p=>p.polygon.some(v=>v[1]===0)&&Math.abs(p.x)>80));
  }
  assert.equal(fractureAt(194).damage,1);
  assert.equal(fractureAt(CUT).pieces.length,0);
});

test('new text choreography and compositor reproduce pixels after out-of-order seeking',()=>{
  const canvas=createCanvas(1600,900),ctx=canvas.getContext('2d');
  const draw=t=>{renderFilm(ctx,t);return createHash('sha256').update(canvas.data()).digest('hex');};
  const times=[64.2,110.8,121.316,131.24,142,148.82,158.3,180.298,191.306,210,CUT];
  const expected=times.map(draw);
  [...times].reverse().forEach(t=>assert.equal(draw(t),expected[times.indexOf(t)]));
  const pose={x:800,y:400,scaleY:1};
  for(let t=60;t<CUT;t+=.13){
    const state=at(t);
    state.cards.forEach(c=>Object.values(diagnosticCardPose(c,pose)).forEach(v=>assert.ok(Number.isFinite(v))));
  }
});

test('visible Java uses chapter functions and keeps musical scheduling out of the story',()=>{
  assert.ok(JAVA_PROGRAM.source.includes('private void learnToLove()'));
  assert.ok(JAVA_PROGRAM.source.includes('offerMyDimensions();'));
  assert.ok(!/at\(\d|Trace\.at/.test(JAVA_PROGRAM.source));
  assert.equal(JAVA_PROGRAM.events.length,97);
});
