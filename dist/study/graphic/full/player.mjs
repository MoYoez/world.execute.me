import { renderFilm, DURATION, CUT } from './renderer.mjs';
import {metaWindow} from './meta.mjs';
import {filmPoint,createViewer} from './viewer.mjs';
import {DEPARTURE} from './score-script.mjs';
import {CUES} from '../../../media/cues.mjs';

const audio=document.querySelector('#audio'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const seek=document.querySelector('#seek'),button=document.querySelector('#play'),reset=document.querySelector('#reset');
const captionButton=document.querySelector('#captions'),status=document.querySelector('#status'),time=document.querySelector('#time');
const fileInput=document.querySelector('#audio-file'),chooseAudio=document.querySelector('#choose-audio');
let t=0,playing=false,captions=true,pending=false,generation=0,blankEpoch=null,objectUrl=null,mediaReady=false;
const viewer=createViewer();
const format=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(Math.floor(value%60)).padStart(2,'0')}`;

function draw() {
  const input=viewer.sample(performance.now());
  canvas.style.cursor=input?.inside&&metaWindow(t)&&t<DEPARTURE?'none':'';
  renderFilm(ctx,t,{cues:CUES,captions,viewer:input});seek.value=String(t);
  time.textContent=`${format(t)} / ${format(DURATION)}`;
}
function pause() {
  generation++;pending=false;audio.pause();playing=false;blankEpoch=null;button.textContent='播放';
}
async function play() {
  if(!mediaReady)return;
  pending=true;const request=++generation;
  if(t>=DURATION)t=0;
  if(t>=CUT) {
    audio.pause();audio.muted=true;blankEpoch=performance.now()-(t-CUT)*1000;
    playing=true;pending=false;button.textContent='暂停';status.textContent='';return;
  }
  blankEpoch=null;
  audio.currentTime=Math.min(t,audio.duration);audio.muted=t>=CUT;
  try {
    await audio.play();if(request!==generation)return;
    playing=true;button.textContent='暂停';status.textContent='';
  } catch(error) {
    if(request===generation){pause();status.textContent='音乐暂时未能播放，请再点一次播放。';}
  } finally {if(request===generation)pending=false;}
}
function jump(value) {
  const resume=playing||pending;pause();viewer.clear();
  t=Math.max(0,Math.min(DURATION,value));audio.currentTime=Math.min(t,audio.duration);audio.muted=t>=CUT;
  draw();if(resume&&t<DURATION)void play();
}
function toggleCaptions(){captions=!captions;captionButton.setAttribute('aria-pressed',String(captions));draw();}
function fullscreen(){canvas.requestFullscreen?.().catch(()=>{status.textContent='当前窗口不支持全屏。';});}
function setMediaReady(ready){mediaReady=ready;seek.disabled=button.disabled=reset.disabled=!ready;}
function releaseAudio(){
  audio.removeAttribute('src');audio.load();
  if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl=null;setMediaReady(false);
}
chooseAudio.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',()=>{
  const file=fileInput.files?.[0];fileInput.value='';
  if(!file)return;
  pause();viewer.clear();t=0;releaseAudio();draw();
  objectUrl=URL.createObjectURL(file);audio.src=objectUrl;audio.muted=false;
  status.textContent='正在读取音频…';audio.load();
});
audio.addEventListener('loadedmetadata',()=>{
  if(!objectUrl||audio.currentSrc!==objectUrl||audio.readyState<1)return;
  if(!Number.isFinite(audio.duration)||Math.abs(audio.duration-CUT)>1){
    releaseAudio();status.textContent='请使用约 3 分 32 秒的原版录音，当前文件与演出时间轴不匹配。';return;
  }
  setMediaReady(true);chooseAudio.textContent='更换音频';status.textContent='';draw();
});
button.addEventListener('click',()=>playing||pending?pause():play());
reset.addEventListener('click',()=>{pause();viewer.clear();t=0;draw();void play();});
canvas.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||!metaWindow(t)||t>=DEPARTURE)return;
  viewer.move(filmPoint(event,canvas.getBoundingClientRect()),performance.now());draw();
});
canvas.addEventListener('pointerleave',()=>{viewer.leave(performance.now());draw();});
seek.addEventListener('input',()=>jump(Number(seek.value)));
captionButton.addEventListener('click',toggleCaptions);
document.querySelector('#fullscreen').addEventListener('click',fullscreen);
audio.addEventListener('ended',()=>{
  if(!playing)return;
  // The media clock ends here; keep the three-second blank on a monotonic clock.
  t=CUT;blankEpoch=performance.now();audio.muted=true;draw();
});
audio.addEventListener('error',()=>{
  if(!objectUrl||!audio.error)return;
  pause();releaseAudio();status.textContent='无法读取这个音频，请重新选择 MP3、M4A、FLAC 或 WAV 文件。';
});
document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.repeat||button.disabled)return;
  if(event.target.matches('input,button,a'))return;
  if(event.code==='Space'){event.preventDefault();playing||pending?pause():play();}
  if(event.code==='ArrowRight'){event.preventDefault();jump(t+5);}
  if(event.code==='ArrowLeft'){event.preventDefault();jump(t-5);}
  if(event.key.toLowerCase()==='c')toggleCaptions();
  if(event.key.toLowerCase()==='f')fullscreen();
});
function tick(){
  if(playing&&blankEpoch!==null){t=Math.min(DURATION,CUT+(performance.now()-blankEpoch)/1000);if(t>=DURATION)pause();draw();}
  else if(playing&&!audio.seeking){t=Math.min(CUT,audio.currentTime);draw();}
  else if(viewer.sample(performance.now()))draw();
  requestAnimationFrame(tick);
}
seek.max=String(DURATION);setMediaReady(false);draw();tick();
