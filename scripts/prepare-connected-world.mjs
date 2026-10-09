import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {RESIDENTS,CHARACTERS} from '../public/js/data.js';
const require=createRequire(import.meta.url);
let sharp;
try {sharp=require('sharp');} catch {
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Install sharp to prepare artwork. Builds do not require it.');
  sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');
}
const root=new URL('../',import.meta.url);
const destination=new URL('public/world/',root);
await mkdir(new URL('assets/',destination),{recursive:true});
const sources=JSON.parse(await readFile(new URL('work-in-progress/generated-assets/manifest.json',root)));
const provenance=[];
for(const source of sources.assets){
  const input=new URL('work-in-progress/generated-assets/'+source.file,root);
  for(let i=0;i<source.places.length;i++){
    const id=source.places[i],size=source.places.length===1?1254:627;
    const box={left:source.places.length===1?0:i%2*627,top:source.places.length===1?0:Math.floor(i/2)*627,width:size,height:size};
    await sharp(input.pathname).extract(box).webp({quality:91}).toFile(new URL(`assets/${id}.webp`,destination).pathname);
    provenance.push({place:id,source:source.file,source_sha256:source.sha256,crop:box,generation:'imagegen',character_art:'separate existing illustrated sheets'});
  }
}
// Coordinates are ground points on the inspected landscapes, in a 1536-unit square.
const positions={
  'iron-man':['avengers',1165,595,195], 'captain-america':['avengers',775,896,175],
  hulk:['avengers',250,1090,240],hawkeye:['avengers',1260,1240,160],
  'black-widow':['avengers',605,565,155], 'winter-soldier':['avengers',520,935,165],ultron:['avengers',1000,540,190],
  'scarlet-witch':['sanctum',750,840,190], 'cloak-dagger':['sanctum',1170,1070,190], 'moon-knight':['sanctum',390,1260,180],
  'doctor-strange':['kamar',660,970,190],magik:['kamar',990,1090,170],'iron-fist':['kamar',390,1080,165],
  cyclops:['xavier',440,895,170],wolverine:['xavier',570,1285,170],gambit:['xavier',900,1180,170],
  rogue:['xavier',775,805,170],deadpool:['xavier',1180,940,170],phoenix:['xavier',1010,615,185],
  magneto:['xavier',325,580,185],'emma-frost':['xavier',795,540,170],psylocke:['xavier',1080,1220,170],jubilee:['xavier',480,700,155],
  'mister-fantastic':['baxter',700,855,185],'invisible-woman':['baxter',935,580,175],
  'human-torch':['baxter',350,680,180],'the-thing':['baxter',1130,1080,215],
  'spider-man':['queens',800,835,175],venom:['queens',450,1240,210],'black-cat':['queens',1135,880,170],
  'peni-parker':['queens',570,770,210],'devil-dinosaur':['queens',1090,1260,235],'squirrel-girl':['queens',650,1060,175],
  'black-panther':['wakanda',810,1135,180],storm:['wakanda',1100,700,185],namor:['wakanda',365,950,180],
  thor:['asgard',850,1130,190],loki:['asgard',655,855,185],hela:['asgard',1120,1120,195],
  angela:['asgard',450,1060,180],'gorr-the-god-butcher':['asgard',1210,790,190],
  'the-hood':['latveria',820,1170,190],
  'star-lord':['knowhere',710,995,175],'rocket-raccoon':['knowhere',925,1090,125],groot:['knowhere',550,1160,220],
  mantis:['knowhere',1100,915,170],'adam-warlock':['knowhere',1110,730,180],'luna-snow':['knowhere',395,605,165],
  'jeff-the-land-shark':['knowhere',725,1160,115],thanos:['titan',855,1190,230],
  daredevil:['madripoor',660,990,175],blade:['madripoor',360,1050,175],
  'the-punisher':['madripoor',1150,1040,175],'white-fox':['madripoor',895,810,170],'elsa-bloodstone':['madripoor',990,1210,175]
};
const actors=RESIDENTS.map(c=>{
  if(!positions[c.id])throw new Error('Missing inspected placement: '+c.id);
  const [place,x,y,height]=positions[c.id];
  return {...c,place,x,y,height,widthRatio:.8,sheet:'../'+c.sheet,
    frames:Array.from({length:c.frames},(_,i)=>({x:i%c.columns*c.frameWidth,y:Math.floor(i/c.columns)*c.frameHeight,width:c.frameWidth,height:c.frameHeight})),
    sequence:Array.from({length:c.frames},(_,i)=>i),phase:c.phase*c.period,
    animationType:'illustrated-puppet',artStatus:'Existing 20-frame puppet sheet; distinct action poses pending'};
});
await writeFile(new URL('sprites.json',destination),JSON.stringify({version:1,actors},null,2)+'\n');
await writeFile(new URL('catalogue.json',destination),JSON.stringify(CHARACTERS,null,2)+'\n');
await writeFile(new URL('assets/provenance.json',destination),JSON.stringify(provenance,null,2)+'\n');
console.log(`Prepared ${provenance.length} backgrounds and ${actors.length} illustrated residents. Existing sheets reused without alteration.`);
