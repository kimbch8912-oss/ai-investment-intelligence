import { createServer } from 'node:http';
import { renderDashboard } from './render.ts';
const port=Number(process.env.PORT??3000);createServer((req,res)=>{if(req.url!=='/'){res.statusCode=404;res.end('Not found');return}res.setHeader('content-type','text/html; charset=utf-8');res.end(renderDashboard())}).listen(port,()=>console.log(`Dashboard server listening on ${port}`));
