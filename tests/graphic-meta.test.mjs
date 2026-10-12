import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';
import {boundaryAt} from '../dist/study/graphic/full/boundary.mjs';
import {bodyPose} from '../dist/study/graphic/contact.mjs';
import {filmPoint,createViewer} from '../dist/study/graphic/full/viewer.mjs';

test('the actor tests for a response before recognizing you behind the pointer',()=>{
  const probe=boundaryAt(scoreAt(24));
  assert.equal(probe?.phase,'probe');
  assert.equal(probe.awareness,0);
  const recognized=boundaryAt(scoreAt(89));
  assert.equal(recognized.phase,'recognize');
  assert.ok(recognized.awareness>.99);
  assert.equal(recognized.youLabel,true);
});

test('a viewer position changes attention and body placement, without changing source execution',()=>{
  const left=scoreAt(100,{viewer:{x:800,y:240,weight:1}}),right=scoreAt(100,{viewer:{x:1430,y:400,weight:1}});
  assert.notDeepEqual(boundaryAt(left)?.cursor,boundaryAt(right)?.cursor);
  assert.notDeepEqual(bodyPose(left),bodyPose(right));
  assert.deepEqual(left.program.executions,right.program.executions);
});

test('an open invitation becomes a grasp that pulls a departing cursor back into the frame',()=>{
  const offer=boundaryAt(scoreAt(100)),grasp=boundaryAt(scoreAt(109.65));
  assert.equal(offer?.phase,'plead');
  assert.ok(offer.grip<.1);
  assert.equal(grasp.phase,'capture');
  assert.ok(grasp.grip>.8);
  assert.ok(grasp.intent.y<64||grasp.intent.x>1560);
  assert.ok(grasp.cursor.y>75&&grasp.cursor.x<1500);
  assert.ok(Math.hypot(grasp.cursor.x-grasp.intent.x,grasp.cursor.y-grasp.intent.y)>100);
});

test('the departure leaves an empty grasp and cannot resurrect the missing you',()=>{
  const held=boundaryAt(scoreAt(111.1,{viewer:{x:1200,y:240,weight:1}}));
  assert.equal(held?.phase,'empty');
  assert.equal(held.cursor.alpha,0);
  assert.equal(held.youLabel,false);
  assert.ok(held.grip>.5);
  assert.equal(boundaryAt(scoreAt(114.1)),null);
  for(const t of [24,89,100,109.65,111.1])assert.deepEqual(boundaryAt(scoreAt(t)),boundaryAt(scoreAt(t)));
});

test('turning off autonomy also removes the meta chase',()=>{
  assert.equal(boundaryAt(scoreAt(109.65,{autonomy:false})),null);
});

test('real pointer coordinates respect fullscreen letterboxing and leave no retained input',()=>{
  const bounds={left:0,top:0,width:1600,height:1200};
  assert.equal(filmPoint({clientX:800,clientY:100},bounds),null);
  assert.deepEqual(filmPoint({clientX:800,clientY:600},bounds),{x:800,y:450});
  assert.equal(filmPoint({clientX:800,clientY:1020},bounds),null);
  const input=createViewer();input.move({x:800,y:450},0);
  assert.equal(input.sample(200).weight,1);input.leave(200);
  assert.ok(input.sample(400).weight<1);assert.equal(input.sample(700),null);
  input.move({x:100,y:200},800);input.clear();assert.equal(input.sample(900),null);
});
