import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';
import {EXECUTIONS} from '../dist/study/graphic/full/beats.mjs';
import {bodyGeometry,bodyExpression,scopeSurface} from '../dist/study/graphic/full/body.mjs';
import {programAt,CUT,DURATION} from '../dist/study/graphic/full/program.mjs';

test('each execution prepares before the word, holds its contact, and recovers before the next word',()=>{
  for(let i=1;i<=12;i++){
    const at=EXECUTIONS[i],pre=scoreAt(at-.06).strike,hit=scoreAt(at).strike,held=scoreAt(at+1/30).strike;
    assert.equal(pre.hit,0,'anticipation cannot perform an early deletion');assert.ok(pre.preload>.9);
    assert.equal(hit.hit,1);assert.equal(held.hit,1,'contact must survive more than a single video frame');
    assert.equal(hit.tearing,i%2===0);
    assert.equal(hit.row,`remove-${Math.floor((i-1)/2)}`);
    assert.ok(scoreAt(at+.6).strike.hit<.01,'the next operation starts from a recovered body');
    const facts=[...programAt(at).executions,...programAt(at).edits];
    assert.ok(facts.some(e=>e.at===at&&e.row===hit.row));
    if(i%2===0)assert.equal(scoreAt(at,{autonomy:false}).strike,null,'disabling the actor also removes its counterattack');
  }
});

test('the flexible silhouette remains finite across the film and retains damage after the refrain',()=>{
  for(let t=0;t<=DURATION;t+=.073){
    const s=scoreAt(t),contact=scopeSurface(s);
    assert.ok(Number.isFinite(contact.x)&&Number.isFinite(contact.y));
    for(const half of bodyGeometry(s)){
      assert.ok(half.thickness>0);
      for(const p of half.points)assert.ok(p.every(Number.isFinite),`invalid strip at ${t}`);
    }
  }
  assert.equal(bodyExpression(scoreAt(19)).split,0);
  assert.ok(bodyExpression(scoreAt(117)).hurt>.9);
  assert.ok(bodyExpression(scoreAt(155)).split>.75);
  assert.ok(bodyExpression(scoreAt(185)).scars>.99);
  assert.ok(!programAt(CUT).executions.some(e=>e.row==='unfinished'));
});
