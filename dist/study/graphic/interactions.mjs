import { ease } from './score.mjs';
import { COLORS } from './syntax.mjs';
import { FONT, SOURCE, rowPoint, bodyPose, contactAt, rowPane } from './contact.mjs';

// Only material contact remains: no connector paths or travelling command labels.
export function drawInteractions(ctx, s, theme) {
  const contact = contactAt(s), pose = bodyPose(s, contact);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 64, 1600, 692); ctx.clip();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  for (const event of s.program.effects) {
    if(['stage','internal'].includes(event.physical)||event.type==='repair')continue;
    const row = rowPane(s,event.row).rows.find(row => row.id === event.row);
    if (!row) continue;
    const point = rowPoint(s, event.row, contact);
    if (event.type === 'execute') {
      const age = s.t - event.at;
      if (age < 0 || age > .18) continue;
      ctx.globalAlpha = .16 * (1 - ease(age, 0, .18));
      ctx.fillStyle = theme.blue;
      ctx.fillRect(point.x - 7, point.y - 16, Math.max(40, row.text.length * 12.6), 32);
      continue;
    }
    if (event.type === 'interrupt') {
      if (s.t < event.at || s.t > event.end + .2) continue;
      const p = ease(s.t, event.at, event.end);
      const grab = ease(s.t, event.at, event.at + .06);
      const startX = point.x + row.text.length * SOURCE.size * .6 + 3;
      const endX = pose.x + 34 + 290 * p, endY = pose.y - 24 - 240 * Math.sin(p * Math.PI * .75);
      ctx.globalAlpha = 1 - ease(s.t, event.end, event.end + .2);
      ctx.fillStyle = theme.blue;
      ctx.save(); ctx.translate(startX + (endX - startX) * grab, point.y + (endY - point.y) * grab);
      ctx.rotate(p * 4.2); ctx.fillRect(-3, -22, 6, 44); ctx.restore();
      continue;
    }
    const age = s.t - event.at;
    const consume = event.kind === 'consume';
    const grab = ease(s.t, event.at - .34, event.at);
    if (age < 0 || age > 1.05) continue;
    const letters = [...event.from];
    ctx.font = `${SOURCE.size}px ${FONT}`;
    ctx.globalAlpha = (age < 0 ? grab : 1 - ease(age, .5, 1.05));
    ctx.fillStyle = event.kind === 'departure' ? COLORS.red : theme.fg;
    // Letters caught between the two braces are pulled as a strip, then torn
    // into independently rotating pieces. Deleted source stays deleted.
    const carry = Math.max(0, age);
    letters.forEach((letter, i) => {
      const local = i - letters.length / 2;
      const spread = consume ? .45 : 1;
      const x = pose.x - 24 + local * 13 + carry * (local * 45 + 120) * spread;
      const y = point.y - grab * 40 + carry * (-145 - i * 7) + carry * carry * 300;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.12 * grab + carry * (i % 2 ? -2.2 : 1.8));
      ctx.fillText(letter, 0, 0); ctx.restore();
    });
    if (age >= 0 && age < .24) {
      ctx.globalAlpha = .6 * (1 - ease(age, 0, .24));
      ctx.fillStyle = COLORS.red;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.translate(pose.x + 16 + i * 22, point.y + 28 + i * 4); ctx.rotate(-.5);
        ctx.fillRect(0, 0, 4, 14 + i * 4); ctx.restore();
      }
    }
  }
  ctx.restore();
}
