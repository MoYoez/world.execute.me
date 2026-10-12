import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {bilingualCues} from '../scripts/captions.mjs';
import {CUES} from '../dist/media/cues.mjs';
import {lyricCueAt,LYRIC_DELAY} from '../dist/film/timeline.mjs';
import {SCRIPT,programAt,DURATION} from '../dist/study/graphic/full/program.mjs';
import {beat,EXECUTIONS,COUNTS,rise} from '../dist/study/graphic/full/beats.mjs';
import {scoreAt} from '../dist/study/graphic/full/score.mjs';

test('every displayed English/Chinese line preserves the supplied reference boundaries, case and order',async()=>{
  const lines=(await readFile(new URL('../references/translations/user-provided.txt',import.meta.url),'utf8')).trim().split(/\r?\n/).slice(2);
  const expected=Array.from({length:Math.ceil(lines.length/2)},(_,i)=>({text:lines[i*2],zh:lines[i*2+1]??'执行死刑'}));
  assert.equal(expected.length,129);
  assert.deepEqual(CUES.filter(c=>c.text).map(({text,zh})=>({text,zh})),expected.filter(c=>c.text!=='world.execute(me);'));
  for(const t of [16.54,20,29.779])assert.equal(lyricCueAt(CUES,t).text,'','instrumental passage has no caption');
  const source=await readFile(new URL('../references/translations/source-timing.lrc',import.meta.url),'utf8');
  assert.deepEqual(await bilingualCues(source),CUES,'regeneration uses the same authoritative reference');
  assert.deepEqual(JSON.parse(await readFile(new URL('../dist/media/cues.json',import.meta.url),'utf8')),CUES);
  for(let i=0;i<CUES.length;i++){
    const cue=CUES[i],at=cue.time+LYRIC_DELAY;
    if(i)assert.ok(cue.time>CUES[i-1].time);
    assert.equal(lyricCueAt(CUES,at),cue,'exact onset must not slip a frame due to floating point');
    assert.notEqual(lyricCueAt(CUES,at-.001),cue);
  }
});

test('keyword source commands arrive on the same frame as the standalone caption',()=>{
  const rows=[['OBJECT CREATION','create'],['INITIALIZATION','initial-unlock'],['SIMULATION','run'],
    ['DIMENSION','amplitude-32'],['CIRCUMFERENCE','circle-fit'],['TANGENTS','amplitude-39'],
    ['LIMITATIONS','limit-43'],['STIMULATIONS','fit-61'],['SATISFACTION','unlock-65'],
    ['NUTRIENTS','amplitude-76'],['ANTIOXIDANTS','antioxidants'],['ENJOYMENT','current-83'],
    ['EXISTENCE','bind-87'],['VIBRATIONS','vibrations'],['COMPLETION','relock'],['ILLEGAL ARGUMENTS','spawn']];
  for(const [word,row] of rows){
    const at=beat(word);
    assert.equal(lyricCueAt(CUES,at).text,word);
    assert.ok(!programAt(at-.001).executions.some(e=>e.row===row));
    assert.ok(programAt(at).executions.some(e=>e.row===row&&e.at===at),`${word} must change the executed state`);
  }
  for(const word of ['DIMENSION','CIRCUMFERENCE','TANGENTS','LIMITATIONS','EXISTENCE']){
    assert.equal(rise(beat(word)-.01,word),0,'no reveal during the preceding sentence');
    assert.ok(rise(beat(word)+.1,word)>.5,'reveal lands promptly within the short keyword');
  }
});

test('every repeated execution has a distinct consequence; the last remains unfinished',()=>{
  assert.equal(EXECUTIONS.length,18);
  for(const at of EXECUTIONS.slice(0,-1)){
    const p=programAt(at),events=[...p.executions,...p.edits];
    assert.ok(events.some(e=>e.at===at),`missing action at ${at}`);
    assert.ok(scoreAt(at).executionImpact>=1,`missing graphic impact at ${at}`);
  }
  for(let i=0;i<6;i++){
    assert.equal(programAt(EXECUTIONS[1+i*2]-.001).actor.peers.length,6-i);
    assert.equal(programAt(EXECUTIONS[1+i*2]).actor.peers.length,5-i);
    assert.equal(programAt(EXECUTIONS[2+i*2]).rows.find(r=>r.id===`remove-${i}`).text,'');
    assert.ok(programAt(COUNTS[i]).executions.some(e=>e.row===`count-${i}`&&e.at===COUNTS[i]));
  }
  const final=programAt(DURATION);
  assert.ok(!final.executions.some(e=>e.row==='unfinished'));
  assert.equal(scoreAt(EXECUTIONS.at(-1)).finalStrike,1);
});

test('a single cursor keeps writing in order after keyword retiming',()=>{
  for(let i=1;i<SCRIPT.length;i++)assert.ok(SCRIPT[i].start>=SCRIPT[i-1].end,`${SCRIPT[i].id} overlaps ${SCRIPT[i-1].id}`);
});
