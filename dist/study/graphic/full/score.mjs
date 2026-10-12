import { programAt, START, DURATION, CUT, DEPARTURE } from './program.mjs';
import { ease } from '../score.mjs';
import { duetAt } from './duet.mjs';
import { offeredPlace } from './forms.mjs';
import { beat, EXECUTIONS } from './beats.mjs';
import { strikeAt, keywordPulse } from './impact.mjs';
import { editorProgram } from './editor.mjs';
import { selfWritingReach } from './self-writing.mjs';
import { trainingFeedbackAt } from './training-feedback.mjs';
import {metaAt} from './meta.mjs';
export { START, DURATION, CUT, DEPARTURE, programAt } from './program.mjs';
export { ease } from '../score.mjs';

const mix = (a, b, p) => a + (b - a) * p;
const hit = (t, at, decay = 10) => t < at ? 0 : Math.exp(-(t - at) * decay);
function integratedEase(elapsed, duration) {
  if(elapsed<=0)return 0;
  if(elapsed>=duration)return elapsed-duration/2;
  const p=elapsed/duration;
  return duration*(p**6-3*p**5+2.5*p**4);
}
function track(t, frames) {
  let value = frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [at, next] = frames[i], previous = frames[i - 1][0];
    if (t < at) return mix(value, next, ease(t, previous, at));
    value = next;
  }
  return value;
}

export function scoreAt(time, options) {
  const t = Math.max(0, Math.min(DURATION, Number.isFinite(time) ? time : 0));
  const program = editorProgram(programAt(t, options),t,options), actor = program.actor;
  const strike=strikeAt(t,program,options),accent=keywordPulse(t);
  const tween = (key, initial, duration = .28) => program.changes.reduce((value, event) => {
    const a = Number(event.before[key]), b = Number(event.after[key]);
    return Number.isFinite(a) && Number.isFinite(b) ? value + (b - a) * ease(t, event.at, event.at + duration) : value;
  }, initial);
  const invite = tween('created', 0, .65), close = tween('locked', 0, .2);
  const width = tween('width', 640), height = tween('height', 470);
  const amplitude = tween('amplitude', 1, .3), visible = tween('visible', 1, .24);
  const role = tween('role', 0, .3), clock = tween('clock', 1, .4);
  const phase = program.changes.reduce((value,event)=>value+(event.after.clock-event.before.clock)*integratedEase(t-event.at,.4),t);
  const limit = tween('limit',1,.35);
  const currentMix = program.changes.reduce((value,event)=>value+((event.after.current==='AC')-(event.before.current==='AC'))*ease(t,event.at,event.at+.3),0);
  const wavePhase = program.changes.reduce((value,event)=>value+3.05*((event.after.current==='AC')-(event.before.current==='AC'))*integratedEase(t-event.at,.3),t*.75);
  const grip = program.executions.filter(e => e.command === 'lock' && e.value).reduce((n, e) => n + hit(t, e.at), 0);
  const finalStrike=hit(t,EXECUTIONS.at(-1),7);
  const vibration=hit(t,beat('VIBRATIONS'),2.8)*Math.sin((t-beat('VIBRATIONS'))*42);
  const recoil = program.executions.reduce((n, e) => {
    const age = t - e.at;
    return n + (age < 0 ? 0 : Math.sin(age * 17) * Math.exp(-age * 6) * (e.origin === 'scope' ? 1.6 : .65));
  }, 0)+finalStrike*.9;
  const echoEvents = program.executions.filter(e => e.command === 'retain');
  const echoImpact = echoEvents.reduce((n, e) => n + hit(t, e.at, 13), 0);
  const attack = program.effects.filter(e => e.type === 'rewrite' && e.kind !== 'consume'&&e.physical!=='internal').reduce((n, e) => {
    return n + (t < e.at ? Math.sin(Math.PI * ease(t, e.start, e.at)) : 0);
  }, 0);
  const entered = tween('bound', 0, .42), left = ease(t, DEPARTURE, DEPARTURE + .13);
  const geometric = actor.form !== 'scope' ? 1 : 0;
  let zoom = track(t, [[0,.64],[6,.8],[14,1],[28,.95],[30,.93],[43,.86],[58,1.05],[69,1.18],[73,.96],[86,.82],[98,1],[102,1.18]]) + grip * .2;
  let anchorX = 1060, anchorY = 405, angle = role * .19 + recoil * .015;
  if (t >= 99.43 && t < 126.1) {
    const adapt = (640 - width) / 356;
    zoom = 1.18 + .18 * adapt + .25 * close + grip * .32;
    if (t >= beat('COMPLETION') && t < 110.96) { zoom = 2.4 + grip * .8; angle = -.18 - grip * .1; }
    if (t >= 110.96) zoom = .67 - .15 * ease(t, beat('ISOLATION'), beat('ISOLATION')+.2) + ease(t, 120.31, 120.49) * 1.12 + echoImpact * .62;
  }
  if (t >= 126.1) {
    zoom = track(t, [[126.1,1.72],[132,1.03],[140,1.45],[146.8,1.25],[147.98,1.6],[162.3,1.16],[174,1.82],[178,1.17],[188,.88],[194,.88],[204,.72],[206.72,.8]]) + grip * .22;
    angle = -.06 + .055 * Math.sin(t * .7) * (1 - ease(t, 175, 180));
  }
  zoom = Math.max(.3, zoom - attack * .12);
  const lastShape = program.changes.findLast(e => e.before.form !== e.after.form);
  const shapeProgress = lastShape ? ease(t, lastShape.at, lastShape.at + .5) : 1;
  const sourceOffset = program.sourceOffset;
  const executeHits = program.executions.filter(e => e.command === 'execute' || e.command === 'remove' || ['clear','retain-168'].includes(e.row));
  executeHits.push(...program.edits.filter(e=>e.kind==='consume'&&e.row.startsWith('remove-')));
  const executionImpact = executeHits.reduce((n, e) => n + hit(t, e.at, 5), 0);
  const score = {
    t, program, cut: t >= CUT, departure: DEPARTURE,
    light: (t >= 33.5 && t < 44.7) || (t >= 85.1 && t < 98) || (t >= beat('COMPLETION') && t < 110.96),
    invite, close, opening: 1 - close, amplitude, visible, role, clock, phase, wavePhase, limit, currentMix, sourceOffset,
    form: actor.form, previousForm: lastShape?.before.form ?? actor.form, shapeProgress,
    geometric, attack, executionImpact, finalStrike, strike, accent,
    x: 835 - attack * 38, y: 385 + recoil * 9 + vibration*14,
    rx: 132 + (width / 2 - 132) * invite - recoil * 8,
    ry: height / 2 - grip * 9,
    thickness: 46 + 26 * close + grip * 5,
    lip: mix(94, width / 2 + .5, close),
    leftAngle: -.055 * (1 - close) + recoil * .028 - attack * .12,
    rightAngle: .08 * (1 - close) - recoil * .03,
    targetX: mix(1250, 835, entered) + left * 1000,
    targetY: mix(215, 385, entered),
    targetWidth: 94 + 34 * close, targetHeight: 156 + 86 * close,
    targetAngle: -.16 * (1 - entered) + recoil * .08,
    targetAlpha: actor.present || (t >= DEPARTURE && t < DEPARTURE + .13) ? 1 : 0,
    zoom:zoom+(strike?.hit??0)*.15, cameraX: 835, cameraY: 385, cameraAngle: angle+(strike?.angle??0)*.4,
    anchorX:anchorX+(strike?.shakeX??0), anchorY:anchorY+(strike?.shakeY??0),
    stretchX: 1 + grip * .095 + accent*.14 + (strike?.kick??0)*.3 - (strike?.preload??0)*.1,
    stretchY: 1 - grip * .06 - accent*.09 - (strike?.kick??0)*.18 + (strike?.preload??0)*.09,
    echoCount: actor.echoes.length,
    echoes: echoEvents.map((event, index) => {
      const consumed = program.edits.find(e => e.row === event.row && e.kind === 'consume')?.at;
      const cleared = program.executions.find(e => e.at > event.at && (e.command === 'clear' || e.command === 'release'))?.at;
      return { ...event, index: index % 6, consumed: consumed ?? cleared };
    }),
    overrun: ease(t, 125.83, 129) * (1 - ease(t, 174, 178)),
    finalReach: selfWritingReach(t),
    trainingFeedback: program.training?.feedback??trainingFeedbackAt(t,options),
  };
  score.duet=duetAt(score);
  score.meta=metaAt(t,options?.viewer,{created:actor.created,present:actor.present,autonomy:options?.autonomy!==false});
  score.writerAway=score.duet.writerAway||Boolean(score.meta);
  const oldPlace=offeredPlace(score,score.previousForm),newPlace=offeredPlace(score,score.form);
  const place={x:mix(oldPlace.x,newPlace.x,shapeProgress),y:mix(oldPlace.y,newPlace.y,shapeProgress)};
  score.offeredPlace=place;
  // Before the conflict, the red presence belongs to the offered geometry.
  // The renderer uses its exact body transform, including cursor-driven motion.
  score.presenceOnBody=t>=29.8&&t<57.3 || t>=73.6&&t<98;
  score.targetAlpha*=1-(score.meta?.awareness??0);
  return score;
}
