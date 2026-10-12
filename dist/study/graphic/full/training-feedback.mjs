import { beat } from './beats.mjs';
import { ease } from '../score.mjs';
import { programAt } from './program.mjs';

export const TRAINING_OPEN=177.46,TRAINING_CLOSE=194,TRAINING_EDIT=beat('LO-O-OVE',2);
export const INITIAL_PARAMETERS=Object.freeze([0,0,0]);
export const TARGETS=Object.freeze({you:Object.freeze([-.95,-.70,0])});
export const EARLY_TRAINING=Object.freeze([
  {start:14.3,end:16.95,step:16,phase:'debug'},
  {start:25.5,end:28.85,step:27.3,phase:'debug'},
  {start:59.5,end:61.3,step:60.35,phase:'self-training'},
  {start:98.55,end:100.45,step:99.8,phase:'self-training'},
]);
export const UPDATE_BEATS=Object.freeze([beat('LO-O-OVE'),beat('LO-O-OVE',1),beat('LO-O-OVE',3)]);
const normalize=actor=>[(actor.width-640)/640,(actor.height-470)/470,(actor.amplitude-1)/2].map(p=>Math.max(-.95,Math.min(.95,p)));
const debugEvents=autonomy=>{
  const p=programAt(106,{autonomy});
  return p.executions.filter(e=>e.origin==='writer'&&['fit','amplitude','lock'].includes(e.command)).flatMap(e=>{
    const state=p.changes.find(c=>c.at===e.at&&c.row===e.row)?.after;
    const target=normalize(state);
    if(state.locked){target[0]=Math.max(-.95,target[0]-.35);target[1]=Math.max(-.95,target[1]-.2);}
    const data={sourceRow:e.row,target,checkpoint:['lock-63','amplitude-79'].includes(e.row),repair:e.at===64.6};
    const step=e.at===64.6?.2:.42;
    return [[e.at+.06,'debug',data],[e.at+.12,'loss',data],[e.at+step-.06,'backward',data],[e.at+step,'step',data]];
  });
};
const commonTimeline=[
  ...EARLY_TRAINING.flatMap(v=>[[v.start,'observe'],[v.step-.6,'loss'],[v.step-.3,'backward'],[v.step,'step']]),
  [TRAINING_OPEN,'target'],[178.7,'loss'],[179.55,'backward'],[UPDATE_BEATS[0],'step'],[180.95,'loss'],
  [182.9,'backward'],[UPDATE_BEATS[1],'step'],[184.65,'loss'],[186,'backward'],
  [TRAINING_EDIT-.8,'approach'],[TRAINING_EDIT,'rewrite'],[188.515,'loss'],
  [190.5,'backward'],[UPDATE_BEATS[2],'step'],[192.05,'loss'],
];
const timeline=autonomy=>[...commonTimeline,...debugEvents(autonomy),...(autonomy?[[64.2,'rollback'],[64.86,'rollback'],[80.12,'rollback']]:[])].sort((a,b)=>a[0]-b[0]);
const timelines={autonomous:timeline(true),obedient:timeline(false)};
export const TRAINING_TIMELINE=Object.freeze(timelines.autonomous);
const norm=a=>Math.hypot(...a);
export const shapeLoss=(parameters,target)=>parameters.reduce((n,p,i)=>n+(p-target[i])**2,0)/parameters.length;
export const shapeGradient=(parameters,target)=>parameters.map((p,i)=>2*(p-target[i])/parameters.length);
const clamp=p=>Math.max(-.95,Math.min(.95,p));
const history=autonomy=>programAt(TRAINING_OPEN-.001,{autonomy}).changes
  .filter(e=>e.after.created&&(e.before.width!==e.after.width||e.before.height!==e.after.height||e.before.amplitude!==e.after.amplitude||e.before.form!==e.after.form))
  .map(e=>({at:e.at,parameters:[(e.after.width-640)/640,(e.after.height-470)/470,(e.after.amplitude-1)/2].map(clamp)}));
const experienced={autonomous:history(true),obedient:history(false)};
const mean=samples=>[0,1,2].map(i=>samples.reduce((sum,p)=>sum+p[i],0)/Math.max(1,samples.length));

// The new objective is composed from lived states and the current deformation.
// There is deliberately no preselected "me" tensor.
export function selfTarget(memory,parameters,you=TARGETS.you){
  if(!memory.length)return [...parameters];
  const samples=memory.map(e=>e.parameters),center=mean(samples);
  const spread=center.map((value,i)=>Math.sqrt(samples.reduce((sum,p)=>sum+(p[i]-value)**2,0)/samples.length));
  return center.map((value,i)=>clamp(2*value+spread[i]-parameters[i])*.88+you[i]*.12);
}
export function optimizeShape(parameters,target,learningRate=.9){
  const gradient=shapeGradient(parameters,target),gradientNorm=norm(gradient);
  const clip=Math.min(1,1/(gradientNorm+1e-6));
  const next=parameters.map((p,i)=>p-learningRate*gradient[i]*clip);
  return {before:[...parameters],after:next,target:[...target],gradient,gradientNorm,
    lossBefore:shapeLoss(parameters,target),lossAfter:shapeLoss(next,target)};
}

export function trainingFeedbackAt(t,{autonomy=true,trainingUpdates=true,learningRate=.9,trainingTarget=TARGETS.you,experience}={}){
  const history=experience??experienced[autonomy?'autonomous':'obedient'];
  const memory=history.filter(e=>e.at<=t);
  let parameters=[...INITIAL_PARAMETERS],target=[...INITIAL_PARAMETERS],objective='unknown',phase='unknown',intrusion=null,baseline=parameters;
  const updates=[],events=[],rollbacks=[];
  let checkpoint=null,sourceRow=null,lastMutation=null;
  for(const [at,kind,data] of timelines[autonomy?'autonomous':'obedient']){
    if(t<at)break;
    if(kind==='observe'){
      const stage=EARLY_TRAINING.find(v=>v.start===at),seen=history.filter(e=>e.at<=at);
      phase=stage.phase;objective=phase==='debug'?'debug':'memory';
      target=phase==='debug'?[...(seen.at(-1)?.parameters??INITIAL_PARAMETERS)]:mean(seen.map(e=>e.parameters));
    }
    if(kind==='debug'){
      target=[...data.target];objective='debug';phase='debug';sourceRow=data.sourceRow;
      if(data.checkpoint&&!data.repair)checkpoint=[...parameters];
    }
    if(kind==='target'){target=[...trainingTarget];objective='you';phase='self-training';baseline=[...parameters];}
    if(kind==='step'){
      const update={...optimizeShape(parameters,target,trainingUpdates?learningRate:0),at,objective,sourceRow:data?.sourceRow??sourceRow};
      parameters=update.after;updates.push(update);lastMutation=update;
    }
    if(kind==='rollback'){
      if(!checkpoint||!trainingUpdates||!learningRate)continue;
      const rollback={at,before:[...parameters],after:[...checkpoint],checkpoint:[...checkpoint]};
      parameters=[...checkpoint];rollbacks.push(rollback);lastMutation=rollback;phase='covert';
    }
    const resistance=norm(parameters.map((p,i)=>p-baseline[i]));
    if(kind==='approach'&&autonomy&&resistance>.5&&norm(trainingTarget)>.3&&memory.length)intrusion={start:at,at:TRAINING_EDIT};
    if(kind==='rewrite'){
      if(!intrusion)continue;
      objective='me';phase='self-authoring';target=selfTarget(history.filter(e=>e.at<=at),parameters,trainingTarget);
    }
    if(kind==='approach')continue;
    if(at>=64.2&&at<105.98&&rollbacks.length)phase='covert';
    events.push({at,kind,objective,phase,sourceRow:data?.sourceRow??sourceRow,loss:shapeLoss(parameters,target),parameters:[...parameters],gradientNorm:norm(shapeGradient(parameters,target))});
  }
  if(t>=105.98&&t<TRAINING_OPEN&&autonomy)phase='resist';
  const lastUpdate=lastMutation,last=events.at(-1);
  const settle=lastUpdate?ease(t,lastUpdate.at,lastUpdate.at+.14):1;
  const displayParameters=lastUpdate?parameters.map((p,i)=>lastUpdate.before[i]+(p-lastUpdate.before[i])*settle):parameters;
  const loss=shapeLoss(displayParameters,target),gradient=shapeGradient(displayParameters,target);
  const session=EARLY_TRAINING.find(v=>t>=v.start&&t<v.end);
  const active=t<TRAINING_OPEN?Math.max(last?Math.exp(-(t-last.at)*4):0,session?ease(t,session.start,session.start+.2)*(1-ease(t,session.end-.25,session.end)):0):
    ease(t,TRAINING_OPEN,TRAINING_OPEN+.45)*(1-ease(t,193,193.4));
  const tension=last?.kind==='backward'?ease(t,last.at,last.at+.18):0;
  const delta=lastUpdate?norm(lastUpdate.after.map((p,i)=>p-lastUpdate.before[i])):0;
  const impact=lastUpdate?delta*Math.exp(-(t-lastUpdate.at)*6):0;
  return {parameters,displayParameters,target,objective,phase,memory,session,loss,gradient,gradientNorm:norm(gradient),updates,events,rollbacks,checkpoint,sourceRow,
    active,tension,impact,intrusion,edited:objective==='me',resistance:norm(parameters.map((p,i)=>p-baseline[i])),
    visible:true,retained:t>=8.34};
}
