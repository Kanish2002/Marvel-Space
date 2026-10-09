import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile,mkdir} from 'node:fs/promises';
import {MarvelWorld,ImageCache,fitCamera} from '../public/js/world.js';
import {REALMS,RESIDENTS} from '../public/js/data.js';
globalThis.document={baseURI:new URL('../public/',import.meta.url).href};
const cache=new ImageCache(16,url=>loadImage(new URL(url).pathname));
const world=new MarvelWorld(cache);
await mkdir('docs',{recursive:true});
const previews=['avengers','sanctum','xavier','baxter','knowhere'];
for(const id of previews){await world.setRealm(id);const canvas=createCanvas(1536,1024),ctx=canvas.getContext('2d');world.draw(ctx,1.1,{scale:1,x:0,y:0},1536,1024);await writeFile(`docs/${id}-preview.png`,canvas.toBuffer('image/png'));console.log('Rendered actual scene:',id);}
// A contact sheet of all actual location renders to catch missing or mispositioned art.
const sheet=createCanvas(1536,1368),ctx=sheet.getContext('2d');ctx.fillStyle='#0b1420';ctx.fillRect(0,0,1536,1368);
for(let i=0;i<REALMS.length;i++){const r=REALMS[i];await world.setRealm(r.id);const canvas=createCanvas(512,342),c=canvas.getContext('2d');world.draw(c,1.1,fitCamera(512,342),512,342);ctx.drawImage(canvas,(i%3)*512,Math.floor(i/3)*342);ctx.fillStyle='#0b1420d9';ctx.fillRect((i%3)*512,Math.floor(i/3)*342,512,26);ctx.fillStyle='#e7d4ad';ctx.font='14px sans-serif';ctx.fillText(`${r.name} · ${RESIDENTS.filter(c=>c.realm===r.id).length} residents`,(i%3)*512+12,Math.floor(i/3)*342+18);}
await writeFile('docs/location-contact-sheet.png',sheet.toBuffer('image/png'));
console.log('Saved location contact sheet');
