import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Exercises the real app's event handlers against a small DOM contract harness.
// It verifies behavior, not browser layout, gestures or performance.
test('app mounts, filters the archive, opens details, navigates worlds, and controls playback',async()=>{
 const html=await readFile(new URL('../public/illustrated.html',import.meta.url),'utf8');
 const registry=new Map(),all=[],frames=[];let images=[];
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.listeners={};this.attributes={};this.dataset={};this.children=[];this.style={setProperty(){}};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle:(c,v)=>{v??=!this.classes.has(c);v?this.classes.add(c):this.classes.delete(c);}};this.hidden=false;this.value='';all.push(this);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}fire(type,event={}){return Promise.all((this.listeners[type]||[]).map(fn=>fn({target:this,preventDefault(){},...event})));}click(){return this.fire('click');}focus(){}setPointerCapture(){}showModal(){this.open=true;}close(){this.open=false;}
  getBoundingClientRect(){return {width:1300,height:820,left:0,top:0,right:1300,bottom:820};}getContext(){return new Proxy({},{get:(_,key)=>key==='measureText'?s=>({width:s.length*7}):key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});}
  set innerHTML(html){this._html=html;this.children=[];for(const m of html.matchAll(/<(button|img|option)\b([^>]*)>/g)){const e=new Element(m[1]);for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1].startsWith('data-'))e.dataset[a[1].slice(5)]=a[2];if(a[1]==='class')a[2].split(' ').forEach(c=>e.classes.add(c));e.attributes[a[1]]=a[2];}this.children.push(e);}}
  get innerHTML(){return this._html||'';}querySelectorAll(query){return this.children.filter(e=>query.startsWith('.')?e.classes.has(query.slice(1)):e.tagName===query.toUpperCase());}
 }
 for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.id=m[2];e.hidden=/\bhidden\b/.test(m[0]);registry.set(e.id,e);}
 for(const m of html.matchAll(/<button[^>]+data-close="([^"]+)"[^>]*>/g)){const e=new Element('button');e.dataset.close=m[1];}
 const node=id=>{assert(registry.has(id),'Missing UI element '+id);return registry.get(id);};
 node('statusFilter').value='all';node('realmFilter').value='all';
 const doc=new Element();Object.assign(doc,{baseURI:'https://example.test/',hidden:false,documentElement:new Element(),body:new Element(),getElementById:node,querySelectorAll:q=>all.filter(e=>q==='[data-close]'?e.dataset.close:q==='dialog'?e.tagName==='DIALOG':q.startsWith('.')?e.classes.has(q.slice(1)):false),querySelector:q=>q==='dialog[open]'?all.find(e=>e.tagName==='DIALOG'&&e.open):null});
 globalThis.document=doc;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.ResizeObserver=class{observe(){}};globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};globalThis.Image=class{set src(value){this.url=value;images.push(this);queueMicrotask(()=>this.onload());}};
 await import('../public/js/app.js');await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(node('rosterCount').textContent,292);assert.equal(node('realmTabs').children.length,12);assert.equal(node('loading').hidden,true);assert(images.length>=8);
 await node('directoryButton').click();assert(node('directoryDialog').open);assert(node('characterGrid').children.length>=292);
 node('searchInput').value='Thanos';await node('statusFilter').fire('change');assert.equal(node('characterGrid').querySelectorAll('button').length,1);await node('characterGrid').querySelectorAll('button')[0].click();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(node('characterName').textContent,'Thanos');assert.equal(node('characterAnimation').textContent,'20-frame puppet loop + signature effects');assert(!node('characterPanel').hidden);assert(!node('directoryDialog').open);
 await node('directoryButton').click();node('statusFilter').value='animated';await node('statusFilter').fire('change');assert.equal(node('characterGrid').querySelectorAll('button').length,55);node('realmFilter').value='baxter';await node('realmFilter').fire('change');assert.equal(node('characterGrid').querySelectorAll('button').length,4);node('directoryDialog').close();
 await node('pauseButton').click();assert.equal(node('pauseButton').getAttribute('aria-pressed'),'true');await node('pauseButton').click();assert.equal(node('pauseButton').getAttribute('aria-pressed'),'false');await node('labelsButton').click();assert.equal(node('labelsButton').getAttribute('aria-pressed'),'false');
 await node('realmTabs').children.find(b=>b.dataset.realm==='xavier').click();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(node('realmName').textContent,'Xavier’s School');assert.equal(node('loading').hidden,true);
 await node('zoomIn').click();const zoom=node('zoomValue').textContent;await node('zoomOut').click();assert.notEqual(node('zoomValue').textContent,zoom);await node('fitButton').click();
 await doc.fire('keydown',{key:'/',target:node('world')});assert(node('directoryDialog').open);assert(frames.length>0);
});
