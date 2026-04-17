import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';

const s_MODULE_ID = "particule-fx"
const yaml = true;
const folders = true;

const packs = await fs.readdir('./packs');
for (const pack of packs) {
  if (pack.startsWith(".")) continue;
  console.log('Packing ' + pack);
  await compilePack(
    `packs/${pack}/_source`,
    `packs/${pack}`,
    { yaml, recursive: folders }
  );
}