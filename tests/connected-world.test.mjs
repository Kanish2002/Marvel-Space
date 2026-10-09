import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {PLACES,TILE,actorBounds,frameAt,filterCharacters} from '../public/world/data.js';
import {PixelWorld,screenToWorld,zoomAt,drawActor,IMAGE_TIMEOUT_MS} from '../public/world/world.js';
const base=new URL('../public/world/',import.meta.url);
const {actors}=JSON.parse(await readFile(new URL('sprites.json',base)));
const catalogue=JSON.parse(await readFile(new URL('catalogue.json',base)));
function context(){const numbers=[];let balance=0;const target={numbers,get balance(){return balance;},save(){balance++;},restore(){balance--;assert(balance>=0);},measureText(s){return {width:s.length*7};},createRadialGradient(){return {addColorStop(){}};}};return new Proxy(target,{get:(t,k)=>k in t?t[k]:(...args)=>{for(const a of args)if(typeof a==='number'){assert(Number.isFinite(a),k+' emitted a non-finite number');numbers.push(a);}}});}
function globals(){globalThis.matchMedia=()=>({matches:false});globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};globalThis.Image=class{set src(v){this.url=v;queueMicrotask(()=>this.onload?.());}};}
function makeWorld(){globals();const c=context(),canvas={style:{},width:1200,height:900,getContext:()=>c,getBoundingClientRect:()=>({width:1200,height:900,left:0,top:0}),addEventListener(){},removeEventListener(){},setPointerCapture(){}};return new PixelWorld(canvas,actors);}

test('all 13 inspected backgrounds and all 55 reused sheets exist; frames and placements stay within valid bounds',async()=>{
  assert.equal(PLACES.length,13);assert.equal(actors.length,55);assert.equal(new Set(actors.map(a=>a.id)).size,55);
  for(const p of PLACES)assert((await stat(new URL(p.background,base))).size>10000);
  for(const a of actors){assert(PLACES.some(p=>p.id===a.place));assert.equal(a.animationType,'illustrated-puppet');assert.equal(a.frames.length,20);assert.equal(a.sequence.length,20);assert((await stat(new URL(a.sheet,base))).size>1000);const b=actorBounds(a),p=PLACES.find(p=>p.id===a.place);assert(b.x>=p.x&&b.y>=p.y&&b.x+b.width<=p.x+TILE&&b.y+b.height<=p.y+TILE);for(const f of a.frames){assert(f.x>=0&&f.x+f.width<=1600);assert(f.y>=0&&f.y+f.height<=1600);}}
});
test('loop indexing wraps at negative times and periods; zoom anchors its pointer',()=>{
  for(const a of actors)for(const t of [-100,-.001,0,.01,1,100]){const i=frameAt(a,t);assert(i>=0&&i<20);assert.equal(frameAt(a,t+a.period),i);}
  const camera={x:1000,y:2000,zoom:.6},before=screenToWorld(camera,120,350,1200,900),next=zoomAt(camera,1.6,120,350,1200,900),after=screenToWorld(next,120,350,1200,900);assert(Math.abs(before.x-after.x)<1e-8);assert(Math.abs(before.y-after.y)<1e-8);
});
test('search exposes the full 292-entry archive without duplicating illustrated residents or inventing Doom artwork',()=>{
  assert.equal(filterCharacters(actors,catalogue,{art:'all'}).length,292);
  const doom=filterCharacters(actors,catalogue,{art:'all',query:'doctor doom'});assert(doom.length>=1);assert(doom.every(a=>a.reference));
  assert.equal(filterCharacters(actors,catalogue,{art:'scene',place:'baxter'}).length,4);
  assert.equal(filterCharacters(actors,catalogue,{art:'all',query:'tobey'}).length,1);
});
test('each resident effect renders finite balanced commands and every sprite crop is valid',()=>{
  for(const a of actors)for(const t of [0,.3,1.8,4.7]){const c=context();drawActor(c,a,{},t,{active:true,labels:true,local:true});assert.equal(c.balance,0);assert(c.numbers.length>25);}
});
test('overview loads landscapes and one animated atlas; focus restores detailed sheets and selection; stale focus cannot replace a later location',async()=>{
  const w=makeWorld();await w.loadPlace('avengers');w.images.clear();await w.fitWorld();assert.equal(w.images.size,14);assert([...w.images.keys()].every(p=>p.startsWith('assets/')));assert(w.images.has(actors[0].overview.sheet));
  const a=actors.find(a=>a.id==='captain-america');await w.focusActor(a);assert.equal(w.place,'avengers');assert.equal(w.active,a.id);const p=PLACES.find(p=>p.id===a.place),x=(p.x+a.x-w.camera.x)*w.camera.zoom+w.width/2,y=(p.y+a.y-a.height*.45-w.camera.y)*w.camera.zoom+w.height/2;assert.equal(w.pick(x,y)?.id,a.id);
  const focus=w.focusActor(a);await w.focusPlace('titan');await focus;assert.equal(w.place,'titan');assert.equal(w.camera.x,PLACES.find(p=>p.id==='titan').x+TILE/2);w.destroy();
});
test('residents render and remain selectable below the old 28 percent cutoff, including minimum zoom',async()=>{
  const w=makeWorld();await w.fitWorld();
  const atlas=w.images.get(actors[0].overview.sheet),calls=[];
  w.ctx.drawImage=(image,...args)=>calls.push({image,args});
  for(const zoom of [.075,.15,.279]){
    w.camera.zoom=zoom;calls.length=0;w.draw();
    const visible=actors.filter(a=>w.visiblePlace(PLACES.find(p=>p.id===a.place)));
    assert(visible.length>0);assert(calls.filter(c=>c.image===atlas).length>=visible.length);
    assert.equal(w.artwork(visible[0]).image,atlas);
  }
  const a=actors.find(a=>a.id==='captain-america'),p=PLACES.find(p=>p.id===a.place);
  w.camera={x:p.x+TILE/2,y:p.y+TILE/2,zoom:.15};
  const x=(p.x+a.x-w.camera.x)*w.camera.zoom+w.width/2,y=(p.y+a.y-a.height*.45-w.camera.y)*w.camera.zoom+w.height/2;
  assert.equal(w.pick(x,y)?.id,a.id);
  w.camera.zoom=.5;await w.loadVisible();assert.equal(w.artwork(a).image,w.images.get(a.sheet));
  w.camera.zoom=.15;assert.equal(w.artwork(a).image,atlas);w.destroy();
});
test('every overview frame preserves animation timing and fits inside the compact alpha atlas',async()=>{
  const width=2000,height=Math.ceil(actors.length/5)*400;
  assert((await stat(new URL(actors[0].overview.sheet,base))).size>10000);
  for(const a of actors){
    assert.equal(a.overview.frames.length,a.frames.length);
    for(let i=0;i<a.frames.length;i++){
      const f=a.overview.frames[i],original=a.frames[i];
      assert.equal(f.width,original.width/4);assert.equal(f.height,original.height/4);
      assert(f.x>=0&&f.y>=0&&f.x+f.width<=width&&f.y+f.height<=height);
    }
    assert.equal(frameAt(a,.3),frameAt({...a,frames:a.overview.frames},.3));
  }
});
test('failed image requests can retry; pinch completion never selects a resident',async()=>{
  const w=makeWorld();await w.loadPlace('avengers');let attempts=0;globalThis.Image=class{set src(v){queueMicrotask(()=>++attempts===1?this.onerror?.():this.onload?.());}};
  await assert.rejects(w.load('missing-test.webp'));await w.load('missing-test.webp');assert.equal(attempts,2);
  let selected=0;w.onSelect=()=>selected++;w.down({pointerId:1,clientX:200,clientY:200});w.down({pointerId:2,clientX:300,clientY:200});w.move({pointerId:2,clientX:350,clientY:200});w.up({pointerId:2},false);w.up({pointerId:1},false);assert.equal(selected,0);w.destroy();
});
test('keyboard panning supersedes pending character focus and updates the centered location',async()=>{
  const w=makeWorld();await w.loadPlace('avengers');
  const pending=[];globalThis.Image=class{set src(v){pending.push(()=>this.onload?.());}};
  const focus=w.focusActor(actors.find(a=>a.id==='cyclops'));
  const target=PLACES.find(p=>p.id==='titan');
  w.pan(target.x+TILE/2-w.camera.x,target.y+TILE/2-w.camera.y);
  const camera={...w.camera};assert.equal(w.place,'titan');
  while(pending.length)pending.shift()();
  assert.equal(await focus,false);assert.deepEqual(w.camera,camera);w.destroy();
});
test('paused and hidden scenes do not keep painting, but interaction and resumed animation repaint',async()=>{
  const w=makeWorld();await w.loadPlace('avengers');let paints=0;w.draw=()=>paints++;
  w.paused=true;w.frame(100);w.frame(116);w.frame(132);assert.equal(paints,1);assert.equal(w.time,0);
  w.zoom(1.1);w.frame(148);assert.equal(paints,2);
  document.hidden=true;w.invalidate();w.frame(164);assert.equal(paints,2);
  document.hidden=false;w.frame(180);assert.equal(paints,3);
  w.paused=false;w.frame(196);w.frame(212);assert.equal(paints,5);assert(w.time>0);w.destroy();
});
test('stalled image requests time out, free the bounded loader, and can retry',async t=>{
  const w=makeWorld();await w.loadPlace('avengers');
  t.mock.timers.enable({apis:['setTimeout']});
  globalThis.Image=class{set src(v){}};
  const loads=Array.from({length:5},(_,i)=>w.load(`stalled-${i}.webp`));
  const results=Promise.allSettled(loads);
  assert.equal(w.running,4);assert.equal(w.queue.length,1);
  t.mock.timers.tick(IMAGE_TIMEOUT_MS);await Promise.resolve();
  assert.equal(w.running,1);assert.equal(w.queue.length,0);
  t.mock.timers.tick(IMAGE_TIMEOUT_MS);assert((await results).every(r=>r.status==='rejected'));
  assert.equal(w.running,0);assert.equal(w.inflight.size,0);
  globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload?.());}};
  await w.load('stalled-0.webp');assert(w.images.has('stalled-0.webp'));w.destroy();
});
test('closing the world settles running and queued image requests without retaining late images',async()=>{
  const w=makeWorld();await w.loadPlace('avengers');
  globalThis.Image=class{set src(v){}};
  const pending=Array.from({length:6},(_,i)=>w.load(`closing-${i}.webp`));const results=Promise.allSettled(pending);
  w.destroy();assert((await results).every(r=>r.status==='rejected'));
  assert.equal(w.running,0);assert.equal(w.queue.length,0);assert.equal(w.pendingImages.size,0);assert.equal(w.images.size,0);
  await assert.rejects(w.load('after-close.webp'),/closed/);
});
