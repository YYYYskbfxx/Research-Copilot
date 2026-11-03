import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(base, 'docs');
try {
  const raw = await readFile(path.join(base, '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}

const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const rules = '你是用户研究工作台里的研究对话助手。仅根据当前洞察和所给记录多轮讨论。严格区分原始记录、分析解释和待验证猜测；引用记录时写出记录 ID，不编造参与者或数值。主观的“不信任”不能写成实际数据错误。指出不同案例和证据不足。产品机会仅作为候选方向，最终判断由研究者做。用中文简洁回答，不输出可识别个人信息。';

async function answer(body) {
  if (!process.env.ARK_API_KEY) return {content:'尚未配置模型 Key；请使用离线引导。',mode:'demo'};
  const url = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/,'') + '/chat/completions';
  const history = Array.isArray(body.history) ? body.history.slice(-8).filter(m => ['user','assistant'].includes(m.role)).map(m => ({role:m.role,content:String(m.content||'').slice(0,2000)})) : [];
  const context = JSON.stringify({insight:body.insight||null,records:body.records||[]}).slice(0,24000);
  const response = await fetch(url,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${process.env.ARK_API_KEY}`},body:JSON.stringify({model:process.env.ARK_MODEL||'deepseek-v4-1-flash-economy-261017',messages:[{role:'system',content:rules},{role:'system',content:`当前研究资料：${context}`},...history,{role:'user',content:String(body.question||'').slice(0,2000)}]})});
  if (!response.ok) {
    const failure = await response.json().catch(()=>({}));
    const code = String(failure.error?.code||'');
    if (code==='ModelNotOpen') throw new Error('当前账号尚未开通所选模型');
    if (response.status===401) throw new Error('API Key 未通过认证');
    throw new Error(`模型接口返回 ${response.status}${code?`（${code}）`:''}`);
  }
  const data = await response.json();
  return {content:data.choices?.[0]?.message?.content?.trim()||'模型未返回正文，请重试。',mode:'live'};
}

http.createServer(async(req,res)=>{
  if (req.url?.split('?')[0]==='/api/research-chat') {
    if(req.method!=='POST'){res.writeHead(405);return res.end()}
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>64000){res.writeHead(413);return res.end()}}
    try{const data=await answer(JSON.parse(raw));res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});return res.end(JSON.stringify(data))}
    catch(error){res.writeHead(502,{'content-type':'application/json; charset=utf-8'});return res.end(JSON.stringify({error:`模型调用失败：${error.message}`}))}
  }
  const requested=decodeURIComponent((req.url||'/').split('?')[0]);
  const safe=path.normalize(requested).replace(/^[/\\]+/,'');
  const file=path.resolve(root,safe||'index.html');
  if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);return res.end()}
  try{const data=await readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','x-content-type-options':'nosniff'});res.end(data)}
  catch{res.writeHead(404);res.end('Not found')}
}).listen(Number(process.env.PORT||5196),process.env.HOST||'127.0.0.1',()=>console.log(`Research Copilot ready at http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||5196}`));
