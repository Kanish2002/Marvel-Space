import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {CHARACTERS,RESIDENTS,REALMS} from '../public/js/data.js';
import {MarvelWorld,ImageCache,frameAt,frameRect,fitCamera,zoomCamera,hitCharacter,characterBounds} from '../public/js/world.js';
import {RecordingContext} from './recording-canvas.mjs';
globalThis.document={baseURI:'https://example.test/'};
test('the archive has unique identities and preserves honest artwork coverage',()=>{
 assert(CHARACTERS.length>=290);assert.equal(RESIDENTS.length,55);assert.equal(REALMS.length,12);assert.equal(new Set(CHARACTERS.map(c=>c.id)).size,CHARACTERS.length);
 for(const c of CHARACTERS){assert(REALMS.some(r=>r.id===c.realm));assert(c.name&&c.identity&&c.portrait&&c.source);if(c.status==='animated'){assert(c.task);assert.equal(c.frames,20);assert(c.sheet&&c.body);}else assert(!c.sheet);}
 for(const name of ['Doctor Doom','Thanos','Falcon','Captain Marvel','Captain America','Thor','Vision','Spider-Man · Tobey Maguire','Spider-Man · Andrew Garfield','Spider-Man · Tom Holland'])assert(CHARACTERS.some(c=>c.name===name),name);
 assert.equal(CHARACTERS.find(c=>c.name==='Doctor Doom').status,'catalogue');assert.equal(REALMS[0].id,'avengers');assert(!REALMS.some(r=>r.name.includes('Spider-Verse')));
});
test('all referenced local assets exist and the 20-frame alpha sheets have the expected dimensions',async()=>{
 const paths=new Set([...REALMS.map(r=>r.background),...CHARACTERS.flatMap(c=>[c.portrait,c.sheet,c.body].filter(Boolean))]);
 for(const path of paths)assert((await stat(new URL('../public/'+path,import.meta.url))).size>100,`Missing or empty ${path}`);
 for(const c of RESIDENTS){const data=await readFile(new URL('../public/'+c.sheet,import.meta.url));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.equal(data.toString('ascii',12,16),'VP8X');assert(data[20]&16,'Transparency flag required');assert.equal(data.readUIntLE(24,3)+1,c.columns*c.frameWidth);assert.equal(data.readUIntLE(27,3)+1,4*c.frameHeight);}
});
test('frame indexing stays in bounds and wraps cleanly at the loop period',()=>{
 for(const c of RESIDENTS){for(const time of [-10,0,.01,1,10,1000]){const f=frameRect(c,time);assert(f.x>=0&&f.x<c.columns*c.frameWidth);assert(f.y>=0&&f.y<4*c.frameHeight);assert.equal(f.width,320);assert.equal(f.height,400);}assert.equal(frameAt(c,.13),frameAt(c,.13+c.period));}
});
test('zoom preserves the point under the pointer, fit centers the scene and hit detection selects visible residents',()=>{
 const fit=fitCamera(1300,820);assert.equal(fit.y,0);assert(fit.x>0);const x=500,y=300,newCam=zoomCamera(fit,1.2,x,y);assert(Math.abs((x-fit.x)/fit.scale-(x-newCam.x)/newCam.scale)<1e-8);assert(Math.abs((y-fit.y)/fit.scale-(y-newCam.y)/newCam.scale)<1e-8);
 const c=RESIDENTS.find(c=>c.id==='captain-america'),b=characterBounds(c);assert.equal(hitCharacter([c],c.x,b.y+b.height/2)?.id,c.id);assert.equal(hitCharacter([c],-500,-500),null);
});
test('image cache retries failed requests and limits retained decoded images',async()=>{
 let attempts=0;const cache=new ImageCache(2,async url=>{attempts++;if(attempts===1)throw Error('network');return {url};});await assert.rejects(cache.get('a'));assert.equal(cache.entries.size,0);const a=await cache.get('a');assert.equal(await cache.get('a'),a);assert.equal(attempts,2);await cache.get('b');await cache.get('c');assert.equal(cache.entries.size,2);assert(!cache.entries.has('a'));
});
test('rapid realm switches ignore stale loads without mixing artwork',async()=>{
 const pending=[];const cache=new ImageCache(32,url=>new Promise(resolve=>pending.push(()=>resolve({url}))));const world=new MarvelWorld(cache);const old=world.setRealm('avengers');const current=world.setRealm('baxter');pending.forEach(resolve=>resolve());assert((await old).stale);assert(!(await current).stale);assert.equal(world.realm.id,'baxter');assert([...world.images.keys()].every(path=>path.includes('baxter')||RESIDENTS.some(c=>c.realm==='baxter'&&c.sheet===path)));
});
test('every realm and effect renders finite balanced commands with valid sprite crops',async()=>{
 const world=new MarvelWorld(new ImageCache(16,async url=>({url})));const ctx=new RecordingContext();let sprites=0;
 ctx.drawImage=(image,...args)=>{assert(args.every(Number.isFinite));if(args.length===8){sprites++;assert(args[0]>=0&&args[0]<1600);assert(args[1]>=0&&args[1]<1600);}};
 ctx.createRadialGradient=()=>({addColorStop(){},toString(){return '#000';}});ctx.roundRect=function(x,y,w,h){this.moveTo(x,y);this.lineTo(x+w,y);this.lineTo(x+w,y+h);this.lineTo(x,y+h);this.closePath();};ctx.bezierCurveTo=function(a,b,c,d,x,y){this.lineTo(a,b);this.lineTo(c,d);this.lineTo(x,y);};ctx.measureText=s=>({width:s.length*7});
 for(const realm of REALMS){await world.setRealm(realm.id);for(const time of [0,.25,1,2,4]){world.draw(ctx,time,{x:0,y:0,scale:1},1536,1024);assert.equal(ctx.stack.length,0);ctx.nodes=[];}}
 assert(sprites>=55*5);assert(ctx.commands>1000);
});
