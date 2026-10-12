import test from 'node:test';
import assert from 'node:assert/strict';

let timeline = {};
try { timeline = await import('../dist/film/timeline.mjs'); } catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('LRC parsing retains empty cues, multiple timestamps, and millisecond offset', () => {
  assert.equal(typeof timeline.parseLrc, 'function', 'LRC parser is implemented');
  const cues = timeline.parseLrc('[ar:demo]\n[offset:100]\n[00:01.25][00:03.500]hello\n[00:02.00]\n');
  assert.deepEqual(cues, [{ time: 1.35, text: 'hello' }, { time: 2.1, text: '' }, { time: 3.6, text: 'hello' }]);
});

test('seeking backwards gives the correct lyric and empty cue clears the screen', () => {
  assert.equal(typeof timeline.cueAt, 'function', 'cue lookup is implemented');
  const cues = [{ time: 1, text: 'first' }, { time: 2, text: '' }, { time: 4, text: 'last' }];
  assert.equal(timeline.cueAt(cues, 5).text, 'last');
  assert.equal(timeline.cueAt(cues, 2.5).text, '');
  assert.equal(timeline.cueAt(cues, 1.5).text, 'first');
  assert.equal(timeline.cueAt(cues, 0), null);
});

test('captions are delayed by half a second without changing the source cues', () => {
  const cues=[{time:1,text:'first'},{time:2,text:'second'}];
  assert.equal(typeof timeline.lyricCueAt,'function');
  assert.equal(timeline.lyricCueAt(cues,1.49),null);
  assert.equal(timeline.lyricCueAt(cues,1.5).text,'first');
  assert.equal(timeline.lyricCueAt(cues,2.49).text,'first');
  assert.equal(timeline.lyricCueAt(cues,2.5).text,'second');
  assert.equal(cues[0].time,1);
});
