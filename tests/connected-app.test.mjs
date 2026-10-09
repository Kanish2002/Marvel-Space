import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('connected app mounts, changes locations, searches portraits, selects residents and controls playback',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8'),registry=new Map(),all=[],frames=[];
  class Element{
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.listeners={};this.attributes={};this.dataset={};this.children=[];this.style={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,v)=>{v??=!this.classes.has(c);v?this.classes.add(c):this.classes.delete(c);}};this.hidden=false;this.isConnected=true;this.value='';this.width=360;this.height=300;all.push(this);}
    addEventListener(t,f){(this.listeners[t]??=[]).push(f);}removeEventListener(){}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}
    async fire(t,e={}){if(this['on'+t])await this['on'+t]({target:this,preventDefault(){},...e});for(const f of this.listeners[t]||[])await f({target:this,preventDefault(){},...e});}
    click(){return this.fire('click');}focus(){document.activeElement=this;}setPointerCapture(){}showModal(){this.open=true;}close(){this.open=false;}
    getBoundingClientRect(){return {width:1300,height:900,left:0,top:0};}getContext(){return new Proxy({},{get:(_,key)=>key==='measureText'?s=>({width:s.length*7}):key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});}
    set innerHTML(s){this._html=s;this.children=[];for(const m of s.matchAll(/<(button|canvas|option)\b([^>]*)>/g)){const e=new Element(m[1]);for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1].startsWith('data-'))e.dataset[a[1].slice(5)]=a[2];if(a[1]==='class')a[2].split(' ').forEach(c=>e.classes.add(c));if(['width','height'].includes(a[1]))e[a[1]]=Number(a[2]);e.attributes[a[1]]=a[2];}this.children.push(e);}}
    get innerHTML(){return this._html||'';}querySelectorAll(q){return this.children.filter(e=>e.tagName===q.toUpperCase());}
  }
  for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.id=m[2];e.hidden=/\bhidden\b/.test(m[0]);registry.set(e.id,e);}
  for(const m of html.matchAll(/<button[^>]+data-close="([^"]+)"[^>]*>/g)){const e=new Element('button');e.dataset.close=m[1];}
  const intro=new Element(),alive=new Element(),node=id=>{assert(registry.has(id),'Missing '+id);return registry.get(id);};
  node('placeFilter').value='all';node('artFilter').value='scene';
  const doc=new Element();Object.assign(doc,{hidden:false,baseURI:'https://example.test/',activeElement:null,getElementById:node,querySelectorAll:q=>all.filter(e=>q==='[data-close]'?e.dataset.close:q==='[data-place]'?e.dataset.place:false),querySelector:q=>q==='.intro'?intro:q==='.alive'?alive:q==='dialog[open]'?all.find(e=>e.tagName==='DIALOG'&&e.open):null});
  globalThis.document=doc;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.requestAnimationFrame=f=>{frames.push(f);return frames.length;};globalThis.cancelAnimationFrame=()=>{};
  globalThis.location={href:'https://example.test/',search:''};globalThis.history={replaceState(){}};
  globalThis.Image=class{constructor(){this.width=1600;this.height=1600;}set src(v){this.url=v;queueMicrotask(()=>this.onload());}};
  globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
  await import('../public/world/app.js');await new Promise(r=>setTimeout(r,0));
  assert.equal(node('count').textContent,292);assert.equal(node('loading').hidden,true);assert.equal(node('sectors').children.length,13);assert.match(node('residents').textContent,/55 across/);
  await node('locations').children.find(e=>e.dataset.place==='kamar').click();assert.equal(node('placeName').textContent,'Kamar-Taj');
  await node('archive').click();assert(node('directory').open);assert.equal(node('grid').querySelectorAll('button').length,55);
  node('artFilter').value='all';node('search').value='Doctor Doom';await node('search').fire('input');const references=node('grid').querySelectorAll('button');assert(references.length>=1);await references[0].click();assert.equal(node('characterName').textContent,'Doctor Doom');assert(!node('inspector').hidden);assert(node('find').hidden);assert.match(node('task').textContent,/pending/);
  await node('archive').click();node('search').value='Captain America';node('artFilter').value='scene';await node('search').fire('input');const cards=node('grid').querySelectorAll('button');assert(cards.length>=1);await cards.find(c=>c.dataset.id==='captain-america').click();assert.equal(node('characterName').textContent,'Captain America');assert.equal(node('placeName').textContent,'Avengers Tower');assert(!node('find').hidden);
  await node('pause').click();assert.equal(node('pause').getAttribute('aria-pressed'),'true');await node('pause').click();assert.equal(node('pause').getAttribute('aria-pressed'),'false');await node('labels').click();assert.equal(node('labels').getAttribute('aria-pressed'),'false');
  await node('plus').click();const zoom=node('zoom').textContent;await node('minus').click();assert.notEqual(node('zoom').textContent,zoom);
  await node('close').click();assert(node('inspector').hidden);assert(frames.length>0);
});
