import { CUES } from '../../../media/cues.mjs';
import { LYRIC_DELAY } from '../../../film/timeline.mjs';

export const beat=(text,occurrence=0)=>{
  const cue=CUES.filter(cue=>cue.text===text)[occurrence];
  if(!cue)throw new Error(`Missing lyric beat: ${text} [${occurrence}]`);
  return Math.round((cue.time+LYRIC_DELAY)*1000000)/1000000;
};
export const EXECUTIONS=CUES.filter(c=>c.text==='EXECUTION').map(c=>Math.round((c.time+LYRIC_DELAY)*1000000)/1000000);
export const COUNTS=['EIN','DOS','TROIS','NE','FEM','LIU'].map(text=>beat(text));
export const rise=(t,text,duration=.22,occurrence=0)=>{
  const p=Math.max(0,Math.min(1,(t-beat(text,occurrence))/duration));
  return 1-(1-p)**3;
};
