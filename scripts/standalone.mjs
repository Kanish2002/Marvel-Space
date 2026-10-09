import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const html=await readFile('public/illustrated.html','utf8'),css=await readFile('public/style.css','utf8'),svg=await readFile('public/favicon.svg','utf8');
const code=(await Promise.all(['data.js','world.js','app.js'].map(f=>readFile(`public/js/${f}`,'utf8')))).map(s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
const assets={};
async function collect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const filename=path.join(dir,entry.name);if(entry.isDirectory())await collect(filename);else if(/\.(webp|jpg|png)$/.test(filename)){const extension=path.extname(filename).slice(1);assets[path.relative('public',filename).replaceAll('\\','/')]=`data:image/${extension==='jpg'?'jpeg':extension};base64,${(await readFile(filename)).toString('base64')}`;}}}
await collect('public/assets');
const result=html.replace('<link rel="stylesheet" href="/style.css">',`<style>${css}</style>`).replace('href="/favicon.svg"',`href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"`).replace('class="brand" href="/"','class="brand" href="#"').replace('<script type="module" src="/js/app.js"></script>',()=>`<script>globalThis.MARVEL_ASSETS=${JSON.stringify(assets)};</script><script type="module">${code}</script>`);
await writeFile('dist/marvel-multiverse.html',result);
console.log(`Built self-contained HTML with ${Object.keys(assets).length} embedded images`);
