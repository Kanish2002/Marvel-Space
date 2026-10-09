import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,cp,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyAssets} from '../scripts/verify-assets.mjs';

test('the production build rejects a checkout with missing artwork, then accepts the full local checkpoint',async()=>{
  const source=fileURLToPath(new URL('../public/',import.meta.url)),fixture=await mkdtemp(join(tmpdir(),'marvel-incomplete-'));
  try{
    await mkdir(join(fixture,'world'),{recursive:true});
    await cp(join(source,'world/sprites.json'),join(fixture,'world/sprites.json'));
    let missing;await assert.rejects(verifyAssets(fixture),error=>{missing=error.message;return /Cannot build:/.test(error.message);});
    assert.match(missing,/world\/assets\/avengers.webp/);assert.match(missing,/assets\/characters\/hulk-loop.webp/);
    const files=missing.split('\n').filter(s=>s.startsWith(' - ')).map(s=>s.slice(3));
    for(const file of files){await mkdir(dirname(join(fixture,file)),{recursive:true});await symlink(join(source,file),join(fixture,file));}
    const complete=await verifyAssets(fixture);assert.equal(complete.actors,55);assert.equal(complete.places,13);
    // A zero-byte transfer is also incomplete, even when its filename exists.
    await rm(join(fixture,'world/assets/avengers.webp'));await writeFile(join(fixture,'world/assets/avengers.webp'),'');
    await assert.rejects(verifyAssets(fixture),/world\/assets\/avengers.webp/);
    assert.deepEqual(await verifyAssets(source),complete);
  }finally{await rm(fixture,{recursive:true,force:true});}
});
