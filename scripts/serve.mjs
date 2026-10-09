import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('public');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.png':'image/png'};
http.createServer(async (req,res) => {
  try {
    const p = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (p !== root && !p.startsWith(root + '/')) {res.writeHead(403).end(); return;}
    const target = (await stat(p)).isDirectory() ? resolve(p, 'index.html') : p;
    const bytes = await readFile(target);
    res.writeHead(200, {'Content-Type': mime[extname(target)] || 'application/octet-stream'}).end(bytes);
  } catch {res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT || 3000), () => console.log(`Local: http://localhost:${process.env.PORT || 3000}`));
