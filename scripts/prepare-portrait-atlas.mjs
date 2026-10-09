import sharp from 'sharp';
import {readdir,writeFile,readFile} from 'node:fs/promises';
import {CHARACTERS,REALMS} from '../public/js/data.js';
const files=(await readdir('public/assets/portraits')).filter(f=>f.endsWith('.jpg')).sort((a,b)=>parseInt(a)-parseInt(b));
const columns=14,rows=Math.ceil(files.length/columns),width=112,height=168,composite=[],mapping={};
for(let i=0;i<files.length;i++){const column=i%columns,row=Math.floor(i/columns);composite.push({input:await sharp('public/assets/portraits/'+files[i]).resize(width,height,{fit:'cover'}).toBuffer(),left:column*width,top:row*height});mapping['assets/portraits/'+files[i]]={column,row,columns,rows};}
await sharp({create:{width:columns*width,height:rows*height,channels:3,background:'#182132'}}).composite(composite).webp({quality:86}).toFile('public/assets/portraits/atlas.webp');
await writeFile('public/assets/provenance/portrait-atlas.json',JSON.stringify(mapping,null,2));
for(const c of CHARACTERS)if(mapping[c.portrait]){c.portraitPosition=mapping[c.portrait];c.portrait='assets/portraits/atlas.webp';}
await writeFile('public/js/data.js','export const REALMS = '+JSON.stringify(REALMS)+';\nexport const CHARACTERS = '+JSON.stringify(CHARACTERS)+';\nexport const RESIDENTS = CHARACTERS.filter(c => c.status === "animated");\nexport const assetURL = path => globalThis.MARVEL_ASSETS?.[path] || new URL(path, document.baseURI).href;\n');
console.log('Prepared shared atlas:',files.length,'portraits');
