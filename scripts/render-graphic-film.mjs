import {readFile,writeFile,copyFile,mkdir,rename} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {createCanvas} from './canvas-runtime.mjs';
import {ROOT,DIST,MEDIA,EXPORTS} from './paths.mjs';
import {renderFilm,DURATION,CUT,WIDTH,HEIGHT} from '../dist/study/graphic/full/renderer.mjs';

const fps=30,canvas=createCanvas(WIDTH,HEIGHT),ctx=canvas.getContext('2d');
const cues=JSON.parse(await readFile(path.join(MEDIA,'cues.json'),'utf8'));
const stillDir=path.join(EXPORTS,'graphic-film-stills');await mkdir(stillDir,{recursive:true});
const shots=[8.3,15.6,16.1,19,24,25.75,26.7,29.6,30.7,35.2,38.7,42,49,55,59.75,60.5,64.4,64.65,64.9,75.8,76.6,79,80.25,82,84,87.2,89.3,91.75,96,100,102,105.6,107.4,108.55,109.5,109.65,110.3,111.1,114.3,118.8,128.7,135,143.7,148.2,155.55,163,171,99.9,179,186.3,187.95,188.5,191,200,206.5,208.3,211.8,212,214.9];
for(const t of shots){renderFilm(ctx,t,{cues});await writeFile(path.join(stillDir,`${t}.png`),canvas.toBuffer('image/png'));}
// A contact sheet makes it possible to inspect the arc, not just one good frame.
const sheet=createCanvas(1600,Math.ceil(shots.length/4)*245),sc=sheet.getContext('2d');
sc.fillStyle='#0d1015';sc.fillRect(0,0,sheet.width,sheet.height);
for(let i=0;i<shots.length;i++){
  renderFilm(ctx,shots[i],{cues});sc.drawImage(canvas,(i%4)*400,Math.floor(i/4)*245,400,225);
  sc.fillStyle='#aeb8cb';sc.font='12px Consolas,monospace';sc.fillText(`${shots[i].toFixed(2)}s`,(i%4)*400+12,Math.floor(i/4)*245+239);
}
await writeFile(path.join(EXPORTS,'graphic-film-contact-sheet.png'),sheet.toBuffer('image/png'));
if(process.argv.includes('--stills'))process.exit(0);
const manifest=JSON.parse(await readFile(path.join(MEDIA,'manifest.json'),'utf8'));
const temporary=path.join(EXPORTS,'graphic-film.rendering.mp4'),output=path.join(EXPORTS,'graphic-film.mp4');
const encoder=spawn('ffmpeg',[
  '-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s',`${WIDTH}x${HEIGHT}`,'-r',String(fps),'-i','pipe:0',
  '-i',path.join(ROOT,'references',manifest.sourceAudio),'-map','0:v:0','-map','1:a:0',
  '-af',`apad=whole_dur=${DURATION}`,
  '-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','192k','-t',String(DURATION),'-movflags','+faststart',temporary,
],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let stderr='',failure;encoder.stderr.on('data',data=>stderr+=data.toString());
const done=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(stderr||`ffmpeg: ${code}`)));});
done.catch(error=>{failure=error;});encoder.stdin.on('error',error=>{failure=error;});
try{
  for(let frame=0;frame<Math.ceil(DURATION*fps);frame++){
    if(failure)throw failure;renderFilm(ctx,frame/fps,{cues});
    if(!encoder.stdin.write(canvas.data()))await Promise.race([once(encoder.stdin,'drain'),done]);
    if(frame%600===0)console.log(`${Math.round(frame/(DURATION*fps)*100)}%`);
  }
  encoder.stdin.end();await done;await rename(temporary,output);
  const served=path.join(DIST,'study/graphic/graphic-film.mp4');
  await copyFile(output,served+'.tmp');await rename(served+'.tmp',served);console.log(output);
}catch(error){encoder.stdin.destroy();encoder.kill();await done.catch(()=>{});throw error;}
