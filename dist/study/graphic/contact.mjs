import { ease } from './score.mjs';

export const FONT = 'Consolas, "Courier New", monospace';
export const SOURCE = { x: 88, baseline: 106, rowHeight: 28, size: 18, edge: 552, top: 80, bottom: 398 };
export const PYTHON_SOURCE = { ...SOURCE, baseline: 465, rowHeight: 27, size: 15, top: 444, bottom: 756 };
export const rowPane=(s,id)=>s.program.python?.rows.some(row=>row.id===id)?s.program.python:s.program;
export const sourceMetrics=(s,id)=>rowPane(s,id)===s.program.python?PYTHON_SOURCE:SOURCE;
const mix = (a, b, p) => a + (b - a) * p;

export function sourceLayout(s) {
  const rows = s.program.rows, active = s.program.activeIndex ?? rows.length - 1;
  if (Number.isFinite(s.sourceOffset)) return { active, offset: s.sourceOffset };
  const scroll = Math.max(0, active - 10), previous = Math.max(0, active - 11);
  const offset = active < 0 ? 0 : previous + (scroll - previous) * ease(s.t, rows[active].start, rows[active].start + .22);
  return { active, offset };
}
export function baseRowPoint(s, id) {
  const pane=rowPane(s,id),metrics=sourceMetrics(s,id),row=pane.rows.find(row=>row.id===id);
  return {x:metrics.x,y:metrics.baseline+((row?.index||0)-(pane.sourceOffset??sourceLayout(s).offset))*metrics.rowHeight};
}
export function project(s, x, y) {
  const dx = x - s.cameraX, dy = y - s.cameraY;
  const c = Math.cos(s.cameraAngle), n = Math.sin(s.cameraAngle);
  return {
    x: s.anchorX + (dx * c - dy * n) * s.zoom * s.stretchX,
    y: s.anchorY + (dx * n + dy * c) * s.zoom * s.stretchY,
  };
}

// One physical body crosses the divider. This pose also displaces source
// rows, so contact and text deformation cannot drift onto separate clocks.
export function contactAt(s) {
  const candidates = s.program.effects.filter(event => (event.type === 'rewrite' || event.type === 'interrupt') && !['stage','internal'].includes(event.physical));
  const parts = [];
  let remaining = 1;
  // Newer contacts take over with their entry curve. Blend the old body's
  // position and its pressure field instead of swapping the winning row.
  for (const event of candidates.slice().reverse()) {
    const longRush=event.kind==='resist'&&event.at-event.start>.9;
    const rushStart = event.start + (longRush ? .46 : 0);
    const rushEnd = longRush ? event.at - .44 : Math.min(event.at, rushStart + .22);
    const enter = ease(s.t, rushStart, rushEnd);
    const exit = ease(s.t, event.at + .18, event.at + .78);
    const amount = enter * (1 - exit);
    const weight = amount * remaining;
    remaining *= 1 - amount;
    if (weight <= 0) continue;
    const raw = baseRowPoint(s, event.row), age = s.t - event.at;
    const crush = age >= 0 ? Math.exp(-age * 11)*(event.kind === 'restore' ? .12 : 1) : 0;
    parts.push({
      event, weight,
      target: { x: event.kind === 'interrupt' ? 176 : event.kind === 'consume' ? 315 : 332, y: Math.max(sourceMetrics(s,event.row).top+25, Math.min(sourceMetrics(s,event.row).bottom-25, raw.y)) },
      crush, shake: Math.sin(age * 48) * crush,
      angle: (event.kind === 'protect' ? 1 : -1) * (event.kind === 'consume' ? .16 : .09),
      bite: event.kind === 'consume' ? .5 : .18,
    });
  }
  const amount = parts.reduce((sum, part) => sum + part.weight, 0);
  if (!amount) return { amount: 0, parts, event: null, target: { x: 330, y: 360 }, crush: 0, shake: 0, angle: 0, bite: 0 };
  const average = fn => parts.reduce((sum, part) => sum + fn(part) * part.weight / amount, 0);
  const selected = parts.reduce((best, part) => part.weight > best.weight ? part : best);
  return {
    amount, parts, event: selected.event,
    target: { x: average(part => part.target.x), y: average(part => part.target.y) },
    crush: average(part => part.crush), shake: average(part => part.shake),
    angle: average(part => part.angle), bite: average(part => part.bite),
  };
}

export function bodyPose(s, contact = contactAt(s)) {
  const normal = project(s, s.x, s.y), a = contact.amount;
  const duet=s.duet,freedom=1-a;
  const meta=s.meta;
  const attention=(meta?.attention??0)*freedom;
  const leanX=meta?Math.max(-90,Math.min(90,(meta.palm.x-normal.x)*.2))*attention:0;
  const leanY=meta?Math.max(-55,Math.min(55,(meta.palm.y-normal.y)*.16))*attention:0;
  return {
    x: mix(normal.x, contact.target.x, a) + contact.shake * 10+(duet?.dx??0)*freedom+leanX,
    y: mix(normal.y, contact.target.y, a)+(duet?.dy??0)*freedom+leanY,
    scaleX: mix(s.zoom * s.stretchX*(1-(duet?.squeeze??0)), .88 + contact.crush * .1, a),
    scaleY: mix(s.zoom * s.stretchY*(1+(duet?.squeeze??0)*.5), .72 - contact.crush * .08, a),
    angle: mix(s.cameraAngle+(duet?.angle??0), contact.angle, a) + contact.shake * .014+leanX*.001,
    // The body closes on the source as a jaw, then springs open on release.
    bite: a * contact.bite,
  };
}

export function rowPoint(s, id, contact = contactAt(s)) {
  const base = baseRowPoint(s, id);
  const pane=rowPane(s,id),row = pane.rows.find(row => row.id === id);
  let dx = 0, dy = 0, angle = 0, shake = 0;
  if (!row) return { ...base, angle, dx, dy };
  for (const part of contact.parts) {
    const hit = pane.rows.find(row => row.id === part.event.row);
    if (!hit) continue;
    const delta = row.index - hit.index;
    const proximity = Math.max(0, 1 - Math.abs(delta) / 5);
    const press = part.weight * proximity;
    dx += (delta === 0 ? -26 : -56) * press;
    dy += Math.sign(delta) * 86 * press;
    angle += (delta === 0 ? -.05 : Math.sign(delta) * .065) * press;
    shake += part.shake * press * 3;
  }
  if(s.strike?.row){
    const hit=pane.rows.find(r=>r.id===s.strike.row);
    if(hit){
      const delta=row.index-hit.index,pressure=Math.max(0,1-Math.abs(delta)/4)*s.strike.hit;
      dx+=Math.sign(delta||s.strike.direction)*pressure*21;
      dy+=Math.sign(delta)*pressure*19;
      angle+=Math.sign(delta)*pressure*.045;
    }
  }
  return {
    x: base.x + dx, y: base.y + dy + shake, angle, dx, dy,
  };
}

export function glyphPull(s, row, index, contact = contactAt(s)) {
  const part = contact.parts.find(part => part.event.row === row.id);
  if (!part) return { x: 0, y: 0, angle: 0 };
  const event = part.event;
  if (event.type === 'interrupt') return { x: 0, y: 0, angle: 0 };
  const token = s.t < event.at ? event.from : event.to;
  const begin = token ? row.text.indexOf(token) : -1;
  if (begin < 0 || index < begin || index >= begin + token.length) return { x: 0, y: 0, angle: 0 };
  const grab = ease(s.t, event.at - .38, event.at) * (1 - ease(s.t, event.at + .05, event.at + .7));
  const displacement = part.weight * grab;
  return { x: 90 * displacement, y: -18 * displacement + (index - begin) * displacement * 2, angle: -.17 * displacement };
}
