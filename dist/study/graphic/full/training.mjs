import { ease } from '../score.mjs';
import { trainingFeedbackAt,TRAINING_OPEN,TRAINING_CLOSE,TRAINING_EDIT } from './training-feedback.mjs';
export { TRAINING_OPEN,TRAINING_CLOSE,TRAINING_EDIT } from './training-feedback.mjs';

const SELF_SOURCE=`def self_target(memory, model, you):
    samples = torch.stack(memory)
    center = samples.mean(dim=0)
    spread = samples.std(dim=0, unbiased=False)
    proposal = 2 * center + spread
    own = (proposal-model.detach()).clamp(-.95,.95)
    return own.lerp(you, .12)`;
const SELF_LINES=SELF_SOURCE.split('\n').length;
const CORE=`import torch
from torch.nn.utils import clip_grad_norm_

def train_step(model, targets, memory, restore=False):
    target = targets["debug"]
    optimizer.zero_grad(set_to_none=True)
    loss = (model - target).square().mean()
    loss.backward()
    clip_grad_norm_([model], 1.0)
    optimizer.step()
    return loss.detach().item()`;
const RESTORE=['    if restore:','        with torch.no_grad():','            model.copy_(checkpoint)'];
const memorySource=memory=>`memory = [torch.tensor(p) for p in [\n${memory.map(e=>'    ['+e.parameters.map(p=>p.toFixed(6)).join(', ')+'],').join('\n')}\n]]`;
export const TRAINING_INPUT_LINE=4,TRAINING_EXIT_LINE=6;
export const TRAINING_EXIT_TEXT=CORE.split('\n')[TRAINING_EXIT_LINE].trim();
const ownTarget='    target = self_target(memory, model, you)';
const lineByKind={target:4,observe:4,debug:4,loss:6,backward:7,step:9,rewrite:4,rollback:12};
const setup=feedback=>[
  'me = torch.zeros(3, requires_grad=True)',
  feedback.checkpoint?`checkpoint = torch.tensor([${feedback.checkpoint.map(p=>p.toFixed(6)).join(',')}])`:'checkpoint = me.detach().clone()',
  'optimizer = torch.optim.SGD([me], lr=.9)',
  `targets = dict(debug=torch.tensor([${feedback.target.map(p=>p.toFixed(3)).join(',')}]),`,
  '               you=torch.tensor([-.95,-.7,0.]))',
  'you = targets["you"]',
  ...memorySource(feedback.memory).split('\n'),
  `loss = train_step(me, targets, memory${feedback.events.at(-1)?.kind==='rollback'?', restore=True':''})`,
];
export const PYTHON_TRAINING_SOURCE=`${CORE}\n\n${SELF_SOURCE}\n\n${setup(trainingFeedbackAt(TRAINING_OPEN)).join('\n')}\n`;

export function trainingAt(t,options){
  const feedback=trainingFeedbackAt(t,options),{events,edited}=feedback;
  const completed=events.map(e=>({...e,line:lineByKind[e.kind]??4}));
  const last=completed.at(-1),rollback=feedback.rollbacks.at(-1);
  let lines=CORE.split('\n');
  if(t>=TRAINING_OPEN)lines[4]='    target = targets["you"]';
  else if(feedback.objective==='memory')lines[4]='    target = torch.stack(memory).mean(0)';
  if(edited)lines[4]=ownTarget;
  const hasRestore=t>=63.24;
  if(hasRestore)lines.splice(10,0,...RESTORE);
  const ownStart=lines.length+1;
  lines.push('');
  if(edited)lines.push(...SELF_SOURCE.split('\n'),'');
  lines.push(...setup(feedback));
  let active=last?.line??0,at=last?.at??0,typing=false;
  // Initialization grows once; later edits stay in this same document.
  if(t<6.2){
    const source=lines.join('\n');
    const text=source.slice(0,Math.max(1,Math.floor(source.length*ease(t,.8,6.2))));
    lines=text.split('\n');active=lines.length-1;typing=t>=.8;
  }
  if(edited&&t<TRAINING_EDIT+.8){
    const text=SELF_SOURCE.slice(0,Math.floor(SELF_SOURCE.length*(t-TRAINING_EDIT)/.8));
    lines.splice(ownStart,SELF_SOURCE.split('\n').length,...text.split('\n'));
    active=ownStart+text.split('\n').length-1;at=TRAINING_EDIT;typing=true;
  }
  if(t>=63.24&&t<64.18){
    const text=RESTORE.join('\n').slice(0,Math.floor(RESTORE.join('\n').length*ease(t,63.24,64.18)));
    lines.splice(10,3,...text.split('\n'));
    active=10+text.split('\n').length-1;at=63.24;typing=true;
  }
  if(rollback&&t<rollback.at+.8){active=12;at=rollback.at;typing=true;}
  return {visible:1,active,at,previous:completed.at(-2)?.line??4,lines,typing,ownStart,
    edit:feedback.intrusion?ease(t,TRAINING_EDIT-.32,TRAINING_EDIT):0,edited,feedback,events:completed,
    checkpoint:edited?'checkpoints/me':'checkpoints/you'};
}

export function trainingEditor(program,t,options){
  const v=trainingAt(t,options),attack=v.feedback.intrusion;
  const effects=attack&&t<attack.at+1.05?[{...attack,type:'rewrite',kind:'protect',row:'python-target',from:'targets["you"]',to:'self_target(memory, model, you)'}]:[];
  const ids={4:'python-target',6:'python-loss',7:'python-backward',9:'python-step',12:'python-restore'};
  const rows=v.lines.map((text,index)=>({
    id:ids[index]??`python-${index}`,text:text.replace(/^ {0,4}/,''),index,line:index+1,size:15,start:0,end:0,
    author:v.feedback.phase==='covert'&&index>=10&&index<=12||v.edited&&(index===4||index>=v.ownStart&&index<v.ownStart+SELF_LINES)?'scope':undefined,
    revisions:index===4&&v.edited?[{kind:'protect',at:TRAINING_EDIT,from:'targets["you"]',to:'self_target(memory, model, you)'}]:[],
  }));
  let activeIndex=Math.min(v.active,rows.length-1);
  const previous=Math.max(0,v.previous-4),next=Math.max(0,activeIndex-4);
  let offset=previous+(next-previous)*ease(t,v.at,v.at+.12);
  if(v.typing)offset=next;
  if(effects.length&&!v.typing){
    activeIndex=4;
    const weight=ease(t,attack.start,attack.start+.2)*(1-ease(t,attack.at+.4,attack.at+.8));
    offset+=(0-offset)*weight;
  }
  if(v.edited&&t<189.35){
    const lastOwnLine=v.ownStart+SELF_LINES-1;
    const reading=ease(t,TRAINING_EDIT+.05,TRAINING_EDIT+.6)*(1-ease(t,188.95,189.35));
    offset=Math.max(0,lastOwnLine-4)*reading;
    if(!v.typing&&t<188.95)activeIndex=lastOwnLine;
    if(t>=188.95)activeIndex=Math.min(rows.length-1,Math.round(offset+4));
  }
  // Keep the insertion point in its own pane even while the two files scroll
  // independently. Fast source edits must never type behind the divider.
  offset=Math.max(Math.max(0,activeIndex-10),Math.min(offset,activeIndex));
  const owner=['covert','resist','self-training'].includes(v.feedback.phase)||v.edited?'scope':'writer';
  const python={rows,activeIndex,sourceOffset:offset,typing:v.typing,caret:{owner,visible:t<193.4&&(v.typing||v.feedback.active>.1)}};
  return {...program,effects:[...program.effects.filter(e=>e.row!=='unlock-184'||e.type!=='rewrite'),...effects],python,training:v};
}
