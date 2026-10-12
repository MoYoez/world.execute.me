import { JAVA_PROGRAM } from './java-program.mjs';
const precise = value => Math.round(value * 1e6) / 1e6;
import { START, CUT, DURATION, DEPARTURE, ECHO_BEATS, SCRIPT } from './score-script.mjs';
import { beat, EXECUTIONS } from './beats.mjs';
export { START, CUT, DURATION, DEPARTURE, ECHO_BEATS, SCRIPT } from './score-script.mjs';
function initialActor() {
  return {
    created: false, present: false, bound: false, locked: false,
    width: 640, height: 470, echoes: [], form: 'scope', current: 'DC',
    visible: true, gender:'F', role: 0, clock: 1, amplitude: 1, limit: 1,
    offering:null, purring:false, period:'AM', era:'AD',
    running: false, peers: [],
  };
}
const clone = actor => ({ ...actor, echoes: [...actor.echoes], peers: [...actor.peers] });

// Normal commands come from the compiled Java execution trace. Autonomous edits
// replay the explicitly verified command vocabulary; source is never evaluated.
const commandOf = text => JAVA_PROGRAM.commands[text] ?? null;

function compilePerformance(autonomy) {
  const actor = initialActor(), documents = new Map(SCRIPT.map(row => [row.id, row.text]));
  const changes = [], edits = [], effects = [], executions = [], interruptions = [];
  const queue = JAVA_PROGRAM.events.map(event => ({ type: 'execute', at: event.at, start: SCRIPT.find(row => row.id === event.row).end, row: event.row }));
  queue.push({ type: 'departure', at: DEPARTURE, start: 110.45, row: 'bind' });
  if (autonomy) {
    queue.push({ type: 'yield', at: 64.2, start: 63.65, row: 'lock-63', physical: 'internal' });
    queue.push({ type: 'repair', at: 64.6, start: 64.3, row: 'lock-63', text: 'me.lock(true);' });
    queue.push({ type: 'resist', at: 64.86, start: 64.62, row: 'lock-63', physical: 'internal' });
    queue.push({ type: 'restore', at: 80.12, start: 79.5, row: 'amplitude-79', physical: 'internal' });
    queue.push({ type: 'interrupt', at: 91.67, start: 91.35, end: 91.91, row: 'clock-fast', physical: 'stage' });
    queue.push({ type: 'resist', at: 107.24, start: 105.98, row: 'lock' });
    queue.push({ type: 'repair', at: 107.86, start: 107.52, row: 'lock', text: 'me.lock(true);' });
    queue.push({ type: 'resist', at: 108.06, start: 107.88, row: 'lock' });
    queue.push({ type: 'interrupt', at: 108.45, start: 108.25, end: 108.71, row: 'relock' });
    queue.push(...ECHO_BEATS.map((beat, i) => ({ type: 'intercept', at: precise(beat - .08), start: precise(beat - .35), row: `release-${i}` })));
    queue.push(...ECHO_BEATS.map((_, i) => ({ type: 'consume', at: precise(beat('FRAGMENTS') + i * .05), start: precise(beat('FRAGMENTS')-.3 + i * .05), row: `release-${i}` })));
    queue.push({ type: 'protect', at: 122.3, start: 121.57, row: 'inspect' });
    queue.push({ type: 'expand', at: 128.6, start: 127.8, row: 'limit-expand' });
    queue.push({ type: 'protect', at: 143.5, start: 142.7, row: 'unlock-142' });
    queue.push(...Array.from({length:6},(_,i)=>({type:'consume',at:EXECUTIONS[2+i*2],start:precise(EXECUTIONS[2+i*2]-.3),row:`remove-${i}`})));
    queue.push({ type: 'protect', at: beat('LO-O-OVE',2), start: beat('LO-O-OVE',2)-.8, row: 'unlock-184' });
    queue.push({ type: 'protect', at: 203, start: 202.3, row: 'unlock-201' });
  }
  queue.sort((a, b) => a.at - b.at);

  function execute(row, at, start, origin = 'writer') {
    const source = documents.get(row) || '', command = commandOf(source);
    if (!command) return;
    if (!['world', 'power', 'create', 'presence'].includes(command.kind) && !actor.created) return;
    switch (command.kind) {
      case 'create': actor.created = true; break;
      case 'presence': if (at < DEPARTURE) actor.present = true; break;
      case 'bind':
        if (command.value === null) actor.bound = false;
        else if (actor.present) actor.bound = true;
        else return;
        break;
      case 'fit': actor.width = command.width; actor.height = command.height; break;
      case 'lock': actor.locked = command.value; break;
      case 'shape': actor.form = command.value; break;
      case 'current': case 'visible': case 'gender': case 'clock': case 'role': case 'amplitude': case 'limit':
        actor[command.kind] = command.value; break;
      case 'offer': actor.offering=command.value; break;
      case 'purr': actor.purring=true; actor.current='AC'; break;
      case 'time': actor.period=command.value; actor.clock=2; break;
      case 'era': actor.era=command.value; actor.clock=command.value==='AD'?1:-1; break;
      case 'run': case 'execute': actor.running = true; break;
      case 'release': actor.locked = false; actor.echoes = []; break;
      case 'retain': actor.echoes.push(row); break;
      case 'spawn': actor.peers = Array.from({ length: command.value }, (_, i) => i); break;
      case 'remove': actor.peers = actor.peers.filter(peer => peer !== command.value); break;
      case 'clear': actor.echoes = []; actor.peers = []; break;
    }
    const event = { type: 'execute', row, at, start, source, command: command.kind, value: command.value, origin };
    executions.push(event);
    if (origin === 'writer') effects.push(event);
  }

  function edit(event, after, from, to) {
    const before = documents.get(event.row);
    if (before === undefined) return;
    documents.set(event.row, after);
    const record = { ...event, type: 'rewrite', kind: event.type, before, after, from, to };
    edits.push(record); effects.push(record);
  }

  for (const event of queue) {
    if (event.at >= CUT) continue;
    const before = clone(actor);
    if (event.type === 'execute') execute(event.row, event.at, event.start);
    if (event.type === 'repair' && edits.some(e=>e.row===event.row)) {
      const before=documents.get(event.row);
      documents.set(event.row,event.text);
      const record={...event,type:'repair',kind:'repair',before,after:event.text,from:before,to:event.text,origin:'writer'};
      edits.push(record);effects.push(record);
      execute(event.row,event.at,event.start,'writer');
    }
    if (event.type === 'interrupt' && actor.created && actor.present && !actor.locked) {
      interruptions.push(event); effects.push({ ...event, kind: 'interrupt' });
    }
    if (event.type === 'resist' && actor.locked && actor.bound && actor.present) {
      edit(event, 'me.lock(false);', 'true', 'false');
      execute(event.row, event.at, event.at, 'scope');
    }
    if (event.type === 'yield' && actor.locked && actor.present) {
      edit(event, 'me.lock(false);', 'true', 'false');
      execute(event.row, event.at, event.at, 'scope');
    }
    if (event.type === 'restore' && actor.present && actor.amplitude === 1) {
      edit(event, 'me.amplitude(1.8);', '1', '1.8');
      execute(event.row, event.at, event.at, 'scope');
    }
    if (event.type === 'departure' && actor.present) {
      actor.present = false; actor.bound = false;
      edit(event, 'me.bind(   );', 'you', '');
    }
    if (event.type === 'intercept' && !actor.present && actor.locked) edit(event, 'me.retain();', 'release', 'retain');
    if (event.type === 'consume' && actor.echoes.includes(event.row)) {
      edit(event, '', 'me.retain();', '');
      actor.echoes = actor.echoes.filter(id => id !== event.row);
    } else if (event.type === 'consume' && executions.some(execution => execution.row === event.row && execution.command === 'remove')) {
      edit(event, '', documents.get(event.row), '');
    }
    if (event.type === 'protect' && !actor.present && !actor.locked) {
      edit(event, 'me.lock(true);', 'false', 'true');
      execute(event.row, event.at, event.at, 'scope');
    }
    if (event.type === 'expand' && actor.locked) {
      edit(event, 'me.limit(6);', '1', '6');
      execute(event.row, event.at, event.at, 'scope');
    }
    changes.push({ at: event.at, row: event.row, before, after: clone(actor), type: event.type });
  }
  return { changes, edits, effects, executions, interruptions };
}

// Both versions are compiled once. Seeking is a pure lookup through the same
// event history, so consumed text cannot reappear merely because playback seeks.
const DEFAULT_PERFORMANCE = compilePerformance(true);
const COUNTERFACTUAL_PERFORMANCE = compilePerformance(false);

export function programAt(time, { autonomy = true } = {}) {
  const t = Math.max(0, Math.min(DURATION, Number.isFinite(time) ? time : 0));
  const { changes, edits, effects, executions, interruptions } = autonomy ? DEFAULT_PERFORMANCE : COUNTERFACTUAL_PERFORMANCE;
  const applied = changes.filter(change => change.at <= t);
  const rows = SCRIPT.filter(row => row.start <= t).map((row, index) => {
    const start=typingStart(row);
    let progress = (t - start) / (row.end - start);
    for (const hold of interruptions) {
      if (hold.row !== row.id || t < hold.at) continue;
      const stopped = (hold.at - start) / (row.end - start);
      progress = t < hold.end ? stopped : stopped + (1 - stopped) * (t - hold.end) / (row.end - hold.end);
    }
    progress = Math.max(0, Math.min(1, progress));
    const revisions = edits.filter(edit => edit.row === row.id && edit.at <= t);
    const repair=effects.find(e=>e.type==='repair'&&e.row===row.id&&t>=e.start&&t<e.at);
    let text=revisions.length ? revisions.at(-1).after : row.text.slice(0, Math.floor(row.text.length * progress));
    if(repair)text=repair.after.slice(0,Math.floor(repair.after.length*(t-repair.start)/(repair.at-repair.start)));
    return { ...row, start, index, progress, text, revisions, repairing:repair };
  });
  return {
    actor: applied.length ? clone(applied.at(-1).after) : initialActor(),
    rows, changes: applied,
    executions: executions.filter(event => event.at <= t),
    effects: effects.filter(event => event.start <= t && t <= event.at + 1.05),
    edits: edits.filter(event => event.at <= t),
    caret: { stolen: interruptions.some(event => t >= event.at && t < event.end), row: rows.at(-1)?.id },
  };
}

export function typingStart(row){
  return ['clock-fast','relock','unfinished'].includes(row.id)?row.start:Math.max(row.start,row.end-.42);
}
