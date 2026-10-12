import { COLORS } from '../syntax.mjs';
import { LYRIC_DELAY } from '../../../film/timeline.mjs';

export function drawLyricTerminal(ctx,cue,t) {
  ctx.save();ctx.globalAlpha=1;ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillStyle='#101319';ctx.fillRect(0,782,1600,118);
  ctx.fillStyle='#2b3240';ctx.fillRect(0,782,1600,1);
  ctx.font='11px Consolas, monospace';ctx.fillStyle='#6e7c93';
  ctx.fillText('TERMINAL',28,798);ctx.fillStyle=COLORS.blue;ctx.fillText('lyrics',112,798);
  ctx.fillStyle=COLORS.blue;ctx.font='21px Consolas, monospace';ctx.fillText('>',28,830);
  if(cue?.text) {
    ctx.fillStyle=COLORS.text;ctx.font='25px "Microsoft YaHei", sans-serif';ctx.fillText(cue.zh||'',57,830,1508);
    ctx.fillStyle=cue.keyword?COLORS.blue:'#8d99ae';ctx.font=cue.keyword?'bold 20px Consolas, monospace':'16px Consolas, monospace';ctx.fillText(cue.text,57,870,1508);
    const age=t-cue.time-LYRIC_DELAY;
    if(cue.keyword&&age>=0&&age<.25){ctx.globalAlpha=1-age/.25;ctx.fillStyle=COLORS.blue;ctx.fillRect(0,810,4,72);}
  } else {
    ctx.fillStyle='#56647b';ctx.fillRect(57,820,2,20);
  }
  ctx.restore();
}
