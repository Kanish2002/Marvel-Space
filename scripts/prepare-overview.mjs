import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=new URL('../public/world/',import.meta.url);

// Mechanical downsampling preserves every existing alpha frame and pose.
// One 35 MB decoded atlas replaces ~563 MB of decoded full sheets in overview.
export async function prepareOverview(actors){
  const sharp=require('sharp'),scale=.25,tile=400,columns=5;
  const layers=[];
  for(let i=0;i<actors.length;i++){
    const a=actors[i],left=i%columns*tile,top=Math.floor(i/columns)*tile;
    const input=await sharp(fileURLToPath(new URL(a.sheet,root))).resize(tile,tile).png().toBuffer();
    layers.push({input,left,top});
    a.overview={sheet:'assets/residents-overview.webp',frames:a.frames.map(f=>({x:left+f.x*scale,y:top+f.y*scale,width:f.width*scale,height:f.height*scale}))};
  }
  await sharp({create:{width:columns*tile,height:Math.ceil(actors.length/columns)*tile,channels:4,background:'#00000000'}}).composite(layers).webp({quality:85}).toFile(fileURLToPath(new URL('assets/residents-overview.webp',root)));
  return actors;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const path=new URL('sprites.json',root),manifest=JSON.parse(await readFile(path));
  await prepareOverview(manifest.actors);await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
  console.log(`Prepared animated overview atlas for ${manifest.actors.length} residents.`);
}
