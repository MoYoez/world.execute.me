import test from 'node:test';
import assert from 'node:assert/strict';
import { START, DURATION, CUT, DEPARTURE, ECHO_BEATS, SCRIPT, programAt } from '../dist/study/graphic/full/program.mjs';
import { beat as lyricBeat, EXECUTIONS } from '../dist/study/graphic/full/beats.mjs';

const rowAt = (time, id, options) => programAt(time, options).rows.find(row => row.id === id);

test('the writer repairs the same lock and the actor rejects that repair',()=>{
  assert.equal(rowAt(64.21,'lock-63').text,'me.lock(false);');
  const partial=rowAt(64.45,'lock-63').text;
  assert.ok(partial.length>0&&!partial.endsWith(';'));
  assert.equal(rowAt(64.61,'lock-63').text,'me.lock(true);');
  assert.equal(programAt(64.61).actor.locked,true);
  assert.equal(rowAt(64.87,'lock-63').text,'me.lock(false);');
  assert.equal(programAt(64.87).actor.locked,false);
  assert.equal(rowAt(64.45,'lock-63',{autonomy:false}).text,'me.lock(true);');
});

test('the performance spans the song and only complete, arrived statements execute', () => {
  assert.equal(START, 0);
  assert.equal(CUT,211.906667);
  assert.equal(DURATION-CUT,3);
  assert.equal(DEPARTURE, 110.8);
  assert.equal(programAt(lyricBeat('OBJECT CREATION')-.12).actor.created, false);
  assert.equal(programAt(lyricBeat('OBJECT CREATION')-.001).actor.created, false);
  assert.equal(programAt(lyricBeat('OBJECT CREATION')).actor.created, true);
  assert.equal(programAt(29.79).actor.form, 'scope');
  assert.equal(programAt(29.87).actor.form, 'scope');
  assert.equal(programAt(29.89).actor.form, 'points');
  assert.equal(programAt(41).actor.form, 'infinity');
  assert.equal(programAt(198.4).actor.width, 240);
  for (const event of programAt(DURATION).executions) {
    assert.ok(event.source.endsWith(';'), `${event.row} must end in a semicolon`);
    if (event.origin === 'writer') {
      const row = SCRIPT.find(item => item.id === event.row);
      assert.ok(event.at >= row.end, `${event.row} cannot execute while being typed`);
    }
  }
});

test('the early explicit scene API carries all form, current, role, and clock changes', () => {
  const values = [
    [0, 'created', false], [11.9, 'present', true], [13.4, 'bound', true], [14.5, 'running', true],
    [33.7, 'form', 'circle'], [37.5, 'form', 'wave'], [44.9, 'current', 'AC'],
    [46.4, 'current', 'DC'], [48.1, 'visible', false], [50.3, 'visible', true],
    [53.8, 'clock', -1], [74.3, 'form', 'eggplant'], [78.3,'form','tomato'], [82,'form','cat'], [85.4, 'form', 'world'],
    [89.3, 'gender', 'F'], [90.9, 'gender', 'M'], [92.3, 'clock', 2],
    [94.3, 'period', 'PM'], [96.3, 'role', 1], [98.3,'role',-1], [98.5, 'form', 'scope'],
    [lyricBeat('NUTRIENTS'),'offering','NUTRIENTS'], [lyricBeat('ANTIOXIDANTS'),'offering','ANTIOXIDANTS'],[lyricBeat('ENJOYMENT'),'purring',true],
  ];
  for (const [time, field, value] of values) assert.equal(programAt(time).actor[field], value, `${field} at ${time}`);
  assert.deepEqual(programAt(0).actor.peers, []);
});

test('the middle lock revision changes live state, with a counterfactual autonomy control', () => {
  assert.equal(programAt(106).actor.locked, true);
  const changed = programAt(107.5);
  assert.equal(changed.actor.locked, false);
  assert.equal(rowAt(107.5, 'lock').text, 'me.lock(false);');
  assert.equal(programAt(107.5, { autonomy: false }).actor.locked, true);
  const rewrite = changed.edits.find(event => event.kind === 'resist'&&event.row==='lock');
  assert.deepEqual([rewrite.at, rewrite.start, rewrite.from, rewrite.to], [107.24, 105.98, 'true', 'false']);
  const transition = changed.changes.find(event => event.type === 'resist'&&event.at===107.24);
  assert.equal(transition.before.locked, true);
  assert.equal(transition.after.locked, false);
  assert.equal(programAt(99.5).actor.created, true, 'the study section does not recreate the actor');
  assert.equal(programAt(111).executions.filter(event => event.command === 'create').length, 1);
});

test('stealing the caret freezes real text without anticipating a future interruption', () => {
  assert.equal(rowAt(108.4, 'relock').text, rowAt(108.4, 'relock', { autonomy: false }).text);
  assert.equal(rowAt(108.5, 'relock').text, rowAt(108.65, 'relock').text);
  assert.notEqual(rowAt(108.5, 'relock', { autonomy: false }).text, rowAt(108.65, 'relock', { autonomy: false }).text);
  assert.equal(programAt(108.6).caret.stolen, true);
  assert.equal(programAt(108.6).caret.row, 'relock');
  assert.equal(programAt(108.8).caret.stolen, false);
  assert.equal(rowAt(108.94, 'relock').text, 'me.lock(true);');
  assert.equal(programAt(lyricBeat('COMPLETION')-.001).actor.locked, false);
  assert.equal(programAt(lyricBeat('COMPLETION')).actor.locked, true);
  assert.equal(programAt(108.6, { autonomy: false }).caret.stolen, false);
});

test('departure tears the bind statement and you never returns', () => {
  assert.equal(programAt(110.79).actor.present, true);
  assert.equal(programAt(110.8).actor.present, false);
  assert.equal(rowAt(110.8, 'bind').text, 'me.bind(   );');
  for (let time = DEPARTURE; time <= DURATION; time += .5) {
    assert.equal(programAt(time).actor.present, false, `present at ${time}`);
    assert.equal(programAt(time).actor.bound, false, `bound at ${time}`);
  }
  assert.equal(programAt(200, { autonomy: false }).actor.present, false);
});

test('release interception executes retain on the five beats and persists consumed rows through seeks', () => {
  assert.deepEqual(ECHO_BEATS, [112.48, 113.39, 114.25, 115.15, 116.10]);
  assert.equal(programAt(116.2).actor.echoes.length, 5);
  assert.equal(programAt(116.2, { autonomy: false }).actor.echoes.length, 0);
  ECHO_BEATS.forEach((beat, i) => {
    assert.equal(rowAt(beat, `release-${i}`).text, 'me.retain();');
    assert.ok(programAt(beat).executions.some(event => event.row === `release-${i}` && event.command === 'retain'));
  });
  const consumed=lyricBeat('FRAGMENTS')+.201,saved = programAt(consumed);
  assert.ok(saved.rows.filter(row => row.id.startsWith('release-')).every(row => row.text === ''));
  assert.equal(saved.actor.echoes.length, 0);
  assert.equal(rowAt(117, 'release-0').text, 'me.retain();');
  programAt(DURATION);
  assert.deepEqual(programAt(consumed), saved);
  assert.ok(saved.rows.find(row => row.id === 'release-0').revisions.length >= 2);
});

test('the absent scope protects the lock and expands the limit through actual revisions', () => {
  assert.equal(programAt(120.32).actor.locked, false);
  assert.equal(programAt(122.31).actor.locked, true);
  assert.equal(programAt(126.51).actor.limit, 1);
  assert.equal(programAt(128.61).actor.limit, 6);
  assert.equal(programAt(128.61, { autonomy: false }).actor.limit, 1);
  assert.equal(programAt(143.6).actor.locked, true);
  assert.equal(programAt(143.6, { autonomy: false }).actor.locked, false);
});

test('all six peers disappear at their removal statements before those rows are consumed', () => {
  assert.deepEqual(programAt(132).actor.peers, [0, 1, 2, 3, 4, 5]);
  const beats = [147.98, 149.64, 151.69, 153.44, 155.34, 157.19];
  beats.forEach((beat, i) => {
    const before = programAt(beat - .001), after = programAt(beat + .001);
    assert.equal(before.actor.peers.length, 6 - i);
    assert.equal(after.actor.peers.length, 5 - i);
    const removal = after.executions.find(event => event.command === 'remove' && event.value === i);
    assert.ok(removal);
    assert.equal(removal.at, beat);
    const next=EXECUTIONS[2+i*2];
    assert.equal(rowAt(next-.001,removal.row).text,`world.remove(${i});`);
    assert.equal(rowAt(next, removal.row).text, '');
    assert.equal(rowAt(next, removal.row, { autonomy: false }).text, `world.remove(${i});`);
  });
  assert.deepEqual(programAt(157.4).actor.peers, []);
  assert.deepEqual(programAt(157.4, { autonomy: false }).actor.peers, []);
});

test('the last unfinished statement never executes and the cut leaves a live locked actor', () => {
  const final = programAt(DURATION);
  assert.equal(final.actor.created, true);
  assert.equal(final.actor.running, true);
  assert.equal(final.actor.locked, true);
  assert.equal(rowAt(DURATION, 'unfinished').text, 'world.execute(me');
  assert.ok(!final.executions.some(event => event.row === 'unfinished'));
  assert.ok(final.executions.every(event => event.at < CUT));
  assert.deepEqual(programAt(DURATION + 100), final);
  assert.deepEqual(programAt(NaN), programAt(0));
});
