import { scoreAt, CUT, DURATION, START, ease } from './score.mjs';
import { lyricCueAt } from '../../../film/timeline.mjs';
import { COLORS, themeAt, drawSource, drawScope } from '../syntax.mjs';
import { presence, echoes } from '../renderer.mjs';
import { drawInteractions } from '../interactions.mjs';
import { bodyPose, contactAt, baseRowPoint } from '../contact.mjs';
import { drawGeometry, drawWorld, drawRuptures, drawEndSpace, drawExpandedScope, drawBlindfold } from './stage.mjs';
import { drawAuthor } from './duet.mjs';
import { drawLyricTerminal } from './captions.mjs';
import { drawOperation, drawStrike } from './impact.mjs';
import { project } from '../contact.mjs';
import { drawProblems } from './problems.mjs';
import { diagnosticsAt, drawDiagnosticCards, drawDiagnosticRemains, drawDiagnosticLove } from './diagnostics.mjs';
import { drawFracture } from './fracture.mjs';
import { writingTarget, drawSelfWriting } from './self-writing.mjs';
import {drawBoundary} from './boundary.mjs';
export { START, DURATION, CUT } from './score.mjs';
export const WIDTH=1600, HEIGHT=900;

function clipStage(ctx,breakout=false) { ctx.beginPath();ctx.rect(0,breakout?0:64,WIDTH,breakout?782:692);ctx.clip(); }
function worldTransform(ctx,s) {
  ctx.translate(s.anchorX,s.anchorY);ctx.scale(s.zoom*s.stretchX,s.zoom*s.stretchY);
  ctx.rotate(s.cameraAngle);ctx.translate(-s.cameraX,-s.cameraY);
}

export function renderFilm(ctx,time,{cues=[],captions=true,...options}={}) {
  const s=scoreAt(time,options),theme=themeAt(s),contact=contactAt(s),diagnostics=diagnosticsAt(s);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=s.cut?COLORS.paper:theme.bg;ctx.fillRect(0,0,WIDTH,HEIGHT);
  if(s.cut) {ctx.restore();return;}
  ctx.save();clipStage(ctx);worldTransform(ctx,s);
  drawWorld(ctx,s,theme);if(!s.presenceOnBody)presence(ctx,s,theme);
  ctx.save();ctx.translate(s.x,s.y);if(s.program.actor.created) echoes(ctx,s,theme);ctx.restore();
  ctx.restore();

  drawSource(ctx,s,theme);
  ctx.save();clipStage(ctx);drawExpandedScope(ctx,s,theme);drawEndSpace(ctx,s,theme);ctx.restore();
  if(s.program.actor.created) {
    const pose=bodyPose(s,contact),last=baseRowPoint(s,'unfinished');
    const pen=writingTarget(ctx,s);
    const strike=s.strike;
    if(strike){
      if(strike.peer!==null&&!strike.tearing){
        const target=project(s,640+(strike.peer%3)*210,205+Math.floor(strike.peer/3)*320);
        const lunge=strike.hit*.48;
        pose.x+=(target.x-pose.x)*lunge;pose.y+=(Math.max(270,Math.min(540,target.y))-pose.y)*lunge;
        pose.scaleX*=1-strike.hit*.12;pose.scaleY*=1-strike.hit*.12;
      }
      pose.angle+=strike.angle;
      // Contact with source gets a distinct bite even while the body's normal
      // camera transform is overridden by the shared editor-contact solver.
      pose.scaleX*=1+strike.kick*.18*contact.amount;
      pose.scaleY*=1-strike.kick*.13*contact.amount;
    }
    // This reach is intentionally interrupted; there is no executed final call.
    pose.x+=((pen?.x??310)+230-pose.x)*s.finalReach;
    pose.y+=((pen?.y??Math.max(250,Math.min(560,last.y)))-70-pose.y)*s.finalReach;
    pose.angle-=s.finalReach*.16;
    pose.scaleX*=1+diagnostics.bite*.2;pose.scaleY*=1-diagnostics.bite*.17;
    drawDiagnosticCards(ctx,s,diagnostics,pose);
    ctx.save();clipStage(ctx,s.t>=128);ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);ctx.scale(pose.scaleX,pose.scaleY);
    const body={...s,close:Math.min(1,s.close+diagnostics.bite*.85),leftAngle:s.leftAngle-pose.bite*.08,rightAngle:s.rightAngle+pose.bite*.1};
    if(s.form==='scope'&&contact.amount<.2&&s.t>10&&s.t<15) drawScope(ctx,s,theme);
    drawGeometry(ctx,body,theme);
    if(s.presenceOnBody)presence(ctx,{...s,targetX:s.offeredPlace.x,targetY:s.offeredPlace.y,targetAngle:0},theme);
    drawBlindfold(ctx,s,theme);ctx.restore();
    drawDiagnosticRemains(ctx,s,diagnostics,pose);
    drawSelfWriting(ctx,s,pose,pen);
  }
  drawInteractions(ctx,s,theme);
  ctx.save();clipStage(ctx);drawAuthor(ctx,s,theme);ctx.restore();
  ctx.save();clipStage(ctx);drawRuptures(ctx,s,theme);drawOperation(ctx,s,theme);drawStrike(ctx,s,theme);ctx.restore();
  drawFracture(ctx,s);
  drawDiagnosticLove(ctx,s,diagnostics);
  drawBoundary(ctx,s,theme);
  if(captions)drawLyricTerminal(ctx,lyricCueAt(cues,s.t),s.t);
  drawProblems(ctx,s);
  ctx.restore();
}
