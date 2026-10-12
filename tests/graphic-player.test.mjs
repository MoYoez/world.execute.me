import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas} from '../scripts/canvas-runtime.mjs';
import {CUT,DURATION} from '../dist/study/graphic/full/renderer.mjs';

test('the browser plays all audio, times three seconds of blank, and can pause, seek and replay the tail',async()=>{
  const keys=['document','fetch','requestAnimationFrame','performance','URL'];
  const original=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));
  const nodes=new Map();let now=0,frame;
  for(const id of ['audio','film','seek','play','reset','captions','status','time','fullscreen','audio-file','choose-audio'])nodes.set(`#${id}`,{
    value:'0',textContent:'',listeners:new Map(),setAttribute(){},
    addEventListener(name,fn){this.listeners.set(name,fn);},
    emit(name,event){return this.listeners.get(name)?.(event);},style:{},click(){this.emit('click');},
  });
  const audio=nodes.get('#audio'),play=nodes.get('#play'),seek=nodes.get('#seek');
  Object.assign(audio,{readyState:1,duration:CUT-.000658,currentTime:0,paused:true,seeking:false,plays:0,
    async play(){this.paused=false;this.plays++;},pause(){this.paused=true;},
    removeAttribute(name){delete this[name];},load(){this.currentSrc=this.src??'';this.readyState=0;this.error=null;}});
  const ctx=createCanvas(1600,900).getContext('2d');nodes.get('#film').getContext=()=>ctx;
  nodes.get('#film').getBoundingClientRect=()=>({left:20,top:60,width:800,height:450});
  globalThis.document={querySelector:s=>nodes.get(s),addEventListener(){}};
  globalThis.fetch=async()=>{throw new Error('Local audio must not be uploaded or fetched');};
  const revoked=[];let urls=0;
  globalThis.URL={createObjectURL:()=>`blob:local-${++urls}`,revokeObjectURL:url=>revoked.push(url)};
  globalThis.performance={now:()=>now};globalThis.requestAnimationFrame=fn=>{frame=fn;};
  const advance=ms=>{now+=ms;frame();};
  const jump=async t=>{seek.value=String(t);seek.emit('input');await Promise.resolve();};
  try{
    await import('../dist/study/graphic/full/player.mjs?blank-tail-test');
    const file=nodes.get('#audio-file'),status=nodes.get('#status');
    assert.equal(audio.src,undefined,'there is no bundled default track');
    assert.equal(play.disabled,true);assert.equal(seek.disabled,true);
    await play.emit('click');assert.equal(audio.plays,0);
    const choose=duration=>{
      file.files=[{name:'local.mp3'}];file.emit('change');
      assert.equal(play.disabled,true);audio.duration=duration;audio.readyState=1;audio.emit('loadedmetadata');
    };
    choose(100);assert.equal(play.disabled,true);assert.match(status.textContent,/不匹配/);
    assert.deepEqual(revoked,['blob:local-1']);
    choose(CUT-.000658);assert.equal(play.disabled,false);assert.equal(status.textContent,'');
    assert.equal(audio.plays,0,'choosing a file does not autoplay');
    file.files=[];file.emit('change');assert.equal(play.disabled,false,'cancelling preserves the current track');
    await play.emit('click');audio.currentTime=audio.duration-.02;advance(16);
    assert.equal(audio.muted,false);assert.ok(Number(seek.value)<CUT);
    audio.currentTime=audio.duration;audio.paused=true;audio.emit('ended');
    assert.equal(Number(seek.value),CUT);assert.equal(play.textContent,'暂停');
    advance(1500);assert.equal(Number(seek.value),CUT+1.5);
    await play.emit('click');advance(1000);assert.equal(Number(seek.value),CUT+1.5);
    const plays=audio.plays;await play.emit('click');assert.equal(audio.plays,plays,'blank resume does not replay audio');
    advance(1490);assert.equal(play.textContent,'暂停');advance(10);
    assert.equal(Number(seek.value),DURATION);assert.equal(play.textContent,'播放');
    await play.emit('click');assert.equal(audio.currentTime,0);assert.equal(audio.muted,false);
    await jump(CUT+1);assert.equal(audio.muted,true);assert.equal(play.textContent,'暂停');
    advance(1000);assert.equal(Number(seek.value),CUT+2);
    await jump(84);assert.equal(audio.currentTime,84);assert.equal(audio.muted,false);assert.equal(audio.paused,false);
    await jump(100);await play.emit('click');
    const film=nodes.get('#film');
    assert.ok(film.listeners.has('pointermove'),'the actor can perceive a real viewer');
    film.emit('pointermove',{clientX:430,clientY:200,pointerType:'mouse'});advance(200);
    const pixels=()=>createHash('sha256').update(ctx.getImageData(0,0,1600,900).data).digest('hex');
    const first=pixels();
    film.emit('pointermove',{clientX:740,clientY:280,pointerType:'mouse'});advance(200);
    assert.notEqual(pixels(),first);
    assert.equal(film.style.cursor,'none');
    film.emit('pointerleave');advance(700);assert.equal(film.style.cursor,'');
    await jump(212);assert.equal(film.style.cursor,'');
    choose(CUT);assert.equal(Number(seek.value),0);assert.equal(audio.paused,true);
    assert.ok(revoked.includes('blob:local-2'),'replacing a track releases the old object URL');
    audio.error={code:3};audio.emit('error');
    assert.equal(play.disabled,true);assert.equal(seek.disabled,true);assert.match(status.textContent,/无法读取/);
    assert.ok(revoked.includes('blob:local-3'));
    choose(CUT);assert.equal(play.disabled,false,'a failed file can be replaced');
  }finally{
    for(const [key,value]of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
});
