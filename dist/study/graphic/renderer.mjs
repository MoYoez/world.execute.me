// Shared graphic primitives used by full/renderer.mjs and full/body.mjs.
import { ease } from './score.mjs';
import { COLORS } from './syntax.mjs';

// The curly brace remains a recognisable source delimiter while its arms
// grow into a closed scope. The centre cusp resists the enclosing motion.
export function bracket(ctx, s, side, { outline = false } = {}) {
  const { rx, ry, thickness: d } = s;
  const end = -rx + s.lip;
  ctx.save();
  ctx.scale(side === 'left' ? 1 : -1, 1);
  const angle = side === 'left' ? s.leftAngle : -s.rightAngle;
  ctx.translate(-rx, ry);
  ctx.rotate(angle);
  ctx.translate(rx, -ry);
  ctx.beginPath(); ctx.moveTo(end, -ry);
  ctx.lineTo(-rx + d * .8, -ry);
  ctx.quadraticCurveTo(-rx, -ry, -rx, -ry + d);
  ctx.lineTo(-rx, -d);
  ctx.quadraticCurveTo(-rx, -d * .27, -rx - d * .66, 0);
  ctx.quadraticCurveTo(-rx, d * .27, -rx, d);
  ctx.lineTo(-rx, ry - d);
  ctx.quadraticCurveTo(-rx, ry, -rx + d * .8, ry);
  ctx.lineTo(end, ry); ctx.lineTo(end, ry - d);
  ctx.lineTo(-rx + d * 1.4, ry - d);
  ctx.quadraticCurveTo(-rx + d, ry - d, -rx + d, ry - d * 1.4);
  ctx.lineTo(-rx + d, d);
  ctx.quadraticCurveTo(-rx + d, d * .35, -rx + d * .3, 0);
  ctx.quadraticCurveTo(-rx + d, -d * .35, -rx + d, -d);
  ctx.lineTo(-rx + d, -ry + d * 1.4);
  ctx.quadraticCurveTo(-rx + d, -ry + d, -rx + d * 1.4, -ry + d);
  ctx.lineTo(end, -ry + d); ctx.closePath();
  if (outline) ctx.stroke(); else ctx.fill();
  ctx.restore();
}

export function echoes(ctx, s, theme) {
  for (const event of s.echoes) {
    const i = event.index;
    const appear = ease(s.t, event.at, event.at + .12);
    const erase = event.consumed === undefined ? 0 : ease(s.t, event.consumed, event.consumed + .15);
    if (erase >= 1) continue;
    const expansion = (i + 1) * 155 * appear;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-1900 + erase * 3800, -1500, 3800 * (1 - erase), 3000);
    ctx.clip();
    ctx.rotate((i % 2 ? -1 : 1) * .024 * (i + 1));
    ctx.globalAlpha = (.52 - i * .045) * appear;
    ctx.lineWidth = 5;
    ctx.fillStyle = i % 2 ? theme.fg : theme.blue;
    ctx.strokeStyle = theme.blue;
    const echo = {
      ...s, rx: s.rx + expansion, ry: s.ry + expansion * .76,
      thickness: 26, lip: s.rx + expansion - 3, bevel: 15,
      leftAngle: 0, rightAngle: 0,
    };
    bracket(ctx, echo, 'left', { outline: i % 2 === 1 });
    bracket(ctx, echo, 'right', { outline: i % 2 === 1 });
    ctx.restore();
  }
}

export function presence(ctx, s, theme) {
  if (!s.targetAlpha) return;
  ctx.save();
  ctx.translate(s.targetX, s.targetY);
  ctx.rotate(s.targetAngle);
  // A text caret acquires the mass of a selected block as the scope closes.
  const width = s.targetWidth * (.23 + .77 * s.close);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(-width / 2, -s.targetHeight / 2, width, s.targetHeight);
  if (s.close < .85) {
    ctx.fillRect(-width / 2 - 12, -s.targetHeight / 2, width + 24, 4);
    ctx.fillRect(-width / 2 - 12, s.targetHeight / 2 - 4, width + 24, 4);
  }
  ctx.font = '14px Consolas, "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.fg; ctx.fillText('you', 0, -s.targetHeight / 2 - 25);
  ctx.restore();
}
