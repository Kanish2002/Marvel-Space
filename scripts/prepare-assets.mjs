import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const locations={avengers:'exec-3bd91319-e887-4557-a145-fcdd9c229ff5.png',asgard:'exec-1bb092b5-e376-4217-9823-deadc8d07a90.png',wakanda:'exec-d1c84ec4-9ba2-474a-8880-b8d2fcc892ba.png',sanctum:'exec-106f7956-e3bf-4471-9a52-a360108aaf99.png',baxter:'exec-897338da-f986-489c-9894-d33d1dae2217.png',latveria:'exec-ea7a2351-4e61-408f-ac0b-7e811e408d33.png',knowhere:'exec-56876bbe-81e4-4860-beb9-a81d9b0213ad.png'};
if(!process.argv[2]) for(const [id,file] of Object.entries(locations)) await sharp(new URL('../../generated_images/'+file,import.meta.url).pathname).resize(1536,1024).webp({quality:86}).toFile(new URL(`public/assets/locations/${id}.webp`,root).pathname);
console.log('Location backgrounds prepared');
const allReferences=JSON.parse(await readFile(new URL('public/assets/provenance/full-body.json',root)));
const references=process.argv[2]?allReferences.filter(r=>r.id===process.argv[2]):allReferences;
const output=[];
for(const hero of references){
 const input=await sharp(new URL('.work/originals/'+hero.id+'-source.png',root).pathname).trim({threshold:8}).resize(280,360,{fit:'inside'}).png().toBuffer();
 const metadata=await sharp(input).metadata();
 const body=`data:image/png;base64,${input.toString('base64')}`;
 const cols=5,rows=4,width=320,height=400;
 const frames=[];
 for(let n=0;n<20;n++){
  const phase=n/20*Math.PI*2, lean=Math.sin(phase)*1.6, rise=(1-Math.cos(phase))*2.4;
  const x=(width-metadata.width)/2, y=height-24-metadata.height;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g transform="translate(160 ${height-24-rise}) rotate(${lean}) scale(1 ${1+Math.sin(phase)*.008}) translate(-160 -${height-24})"><image href="${body}" x="${x}" y="${y}" width="${metadata.width}" height="${metadata.height}"/></g></svg>`;
  frames.push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:n%cols*width,top:Math.floor(n/cols)*height});
 }
 await sharp({create:{width:width*cols,height:height*rows,channels:4,background:'#00000000'}}).composite(frames).webp({quality:86,effort:4}).toFile(new URL(`public/assets/characters/${hero.id}-loop.webp`,root).pathname);
 await sharp(input).resize(480,600,{fit:'inside'}).webp({quality:90}).toFile(new URL(`public/assets/characters/${hero.id}.webp`,root).pathname);
 output.push({...hero,bodyPath:`assets/characters/${hero.id}.webp`,spritePath:`assets/characters/${hero.id}-loop.webp`,frames:20,columns:5,frameWidth:width,frameHeight:height,animationKind:'20-frame illustration puppet loop with procedural signature effects'});
 console.log('20-frame sheet:',hero.name);
}
await writeFile(new URL('public/assets/provenance/full-body.json',root),JSON.stringify(allReferences.map(r=>output.find(o=>o.id===r.id)||r),null,2));
