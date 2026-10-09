import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PixelWorld} from '../public/world/world.js';
import {PLACES,TILE} from '../public/world/data.js';
const require=createRequire(import.meta.url);
let drawing;try{drawing=require('@napi-rs/canvas');}catch{drawing=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');}
let sharp;try{sharp=require('sharp');}catch{sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');}
const save=async(name,canvas)=>writeFile(new URL('../docs/'+name+'.webp',import.meta.url),await sharp(canvas.toBuffer('image/png')).webp({quality:86}).toBuffer());
const {createCanvas,loadImage}=drawing,base=new URL('../public/world/',import.meta.url);
const {actors}=JSON.parse(await readFile(new URL('sprites.json',base)));
await mkdir(new URL('../docs/',import.meta.url),{recursive:true});
const contact=createCanvas(1600,1600),ctx=contact.getContext('2d');ctx.fillStyle='#0a1b23';ctx.fillRect(0,0,1600,1600);
for(const [i,p]of PLACES.entries()){
  const canvas=createCanvas(TILE,TILE),world=Object.create(PixelWorld.prototype);
  Object.assign(world,{ctx:canvas.getContext('2d'),camera:{x:p.x+TILE/2,y:p.y+TILE/2,zoom:1},width:TILE,height:TILE,dpr:1,time:1.6,labels:false,place:p.id,images:new Map(),ordered:actors.filter(a=>a.place===p.id),active:null,hover:null});
  for(const url of [p.background,...world.ordered.map(a=>a.sheet)])world.images.set(url,await loadImage(fileURLToPath(new URL(url,base))));
  world.draw();
  if(p.id==='avengers')await save('connected-avengers',canvas);
  const x=i%4*400,y=Math.floor(i/4)*400;ctx.drawImage(canvas,x,y,400,400);ctx.fillStyle='#0a1b23dc';ctx.fillRect(x,y,400,30);ctx.fillStyle='#e1d4ad';ctx.font='16px sans-serif';ctx.fillText(`${p.name} · ${world.ordered.length} illustrated residents`,x+12,y+21);
}
await save('connected-contact-sheet',contact);
console.log('Rendered 13 connected-world scenes using their actual backgrounds, sprite crops and effects.');
