import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { DIST } from './paths.mjs';

const host='127.0.0.1',port=4173,origin=`http://${host}:${port}`;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.m4a':'audio/mp4','.lrc':'text/plain; charset=utf-8','.mp4':'video/mp4','.png':'image/png'};
const send=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
  try{
    if(req.headers.host!==`${host}:${port}`&&req.headers.host!==`localhost:${port}`){send(res,403,{error:'Local access only'});return;}
    const url=new URL(req.url,origin);
    if(!['GET','HEAD'].includes(req.method)){send(res,405,{error:'Method not allowed'});return;}
    let file;
    {
      const requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
      file=path.resolve(DIST,'.'+requested);
      if(!file.startsWith(DIST+path.sep)||requested.includes('\0')){send(res,403,{error:'Forbidden'});return;}
    }
    const info=await stat(file);if(!info.isFile()){send(res,404,{error:'Not found'});return;}
    const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
    let start=0,end=info.size-1,code=200;
    if(req.headers.range){
      const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!m||!m[1]&&!m[2]){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      start=m[1]?Number(m[1]):Math.max(0,info.size-Number(m[2]));end=m[1]&&m[2]?Math.min(Number(m[2]),info.size-1):info.size-1;
      if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      code=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length']=end-start+1;res.writeHead(code,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());req.on('close',()=>stream.destroy());stream.pipe(res);
  }catch(error){if(!res.headersSent)send(res,error.code==='ENOENT'?404:500,{error:error.code==='ENOENT'?'Not found':'Local server error'});else res.destroy();}
});
server.listen(port,host,()=>console.log(`Local: ${origin}`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
