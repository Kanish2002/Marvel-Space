import { cp, rm, mkdir } from 'node:fs/promises';
import {verifyAssets} from './verify-assets.mjs';
const coverage=await verifyAssets();
console.log(`Verified all ${coverage.files} required files before building.`);
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
await mkdir(new URL('../dist/', import.meta.url));
await cp(new URL('../public/', import.meta.url), new URL('../dist/', import.meta.url), { recursive: true });
console.log('Built static site → dist/ (no dependencies or API keys required)');


