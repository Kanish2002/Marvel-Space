import {readFile,stat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CHARACTERS,REALMS} from '../public/js/data.js';
import {PLACES} from '../public/world/data.js';

// Both editions must be deployable from the same checkout. A successful copy
// alone cannot detect an interrupted transfer of the binary artwork.
export async function verifyAssets(publicRoot=fileURLToPath(new URL('../public/',import.meta.url))){
  const paths=new Set(['index.html','illustrated.html','world/index.html','world/sprites.json','world/catalogue.json']);
  const add=(base,path)=>{
    const absolute=resolve(publicRoot,base,path),local=relative(publicRoot,absolute);
    if(local.startsWith('..'))throw new Error(`Artwork path escapes public/: ${path}`);
    paths.add(local);
  };
  for(const realm of REALMS)add('',realm.background);
  for(const character of CHARACTERS)for(const path of [character.body,character.sheet,character.portrait].filter(Boolean))add('',path);
  for(const place of PLACES)add('world',place.background);
  const manifest=JSON.parse(await readFile(resolve(publicRoot,'world/sprites.json'),'utf8'));
  for(const actor of manifest.actors){add('world',actor.sheet);if(actor.overview)add('world',actor.overview.sheet);}
  const missing=[];
  await Promise.all([...paths].map(async path=>{
    try{const file=await stat(resolve(publicRoot,path));if(!file.isFile()||!file.size)missing.push(path);}
    catch(error){if(error.code==='ENOENT')missing.push(path);else throw error;}
  }));
  if(missing.length)throw new Error(`Cannot build: ${missing.length} required files are missing or empty. Restore the complete artwork checkpoint before deploying.\n${missing.sort().map(p=>' - '+p).join('\n')}`);
  return {files:paths.size,places:PLACES.length,actors:manifest.actors.length,characters:CHARACTERS.length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=await verifyAssets();console.log(`Verified ${result.files} required files across both editions (${result.places} locations, ${result.actors} residents, ${result.characters} character records).`);}
  catch(error){console.error(error.message);process.exitCode=1;}
}
