// Pointer input is local to the film. Letterboxed fullscreen and the normal
// responsive canvas use the same 1600 × 900 coordinates as video export.
export function filmPoint(event,rect){
  if(!rect.width||!rect.height)return null;
  const scale=Math.min(rect.width/1600,rect.height/900);
  const x=(event.clientX-rect.left-(rect.width-1600*scale)/2)/scale;
  const y=(event.clientY-rect.top-(rect.height-900*scale)/2)/scale;
  return x>=0&&x<=1600&&y>=0&&y<=782?{x,y}:null;
}

export function createViewer(){
  let state=null;
  return {
    move(point,now){
      if(!point){this.leave(now);return;}
      state=state?{...state,...point,left:null}:{...point,followX:point.x,followY:point.y,entered:now,last:now,left:null};
    },
    leave(now){if(state&&state.left===null)state.left=now;},
    clear(){state=null;},
    sample(now){
      if(!state)return null;
      if(state.left!==null&&now-state.left>=450){state=null;return null;}
      const amount=1-Math.exp(-Math.max(0,now-state.last)/115);
      state.followX+=(state.x-state.followX)*amount;state.followY+=(state.y-state.followY)*amount;state.last=now;
      const weight=Math.min(1,(now-state.entered)/180)*(state.left===null?1:Math.max(0,1-(now-state.left)/450));
      return {...state,inside:state.left===null,weight};
    },
  };
}
