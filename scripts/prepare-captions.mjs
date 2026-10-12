import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, MEDIA } from './paths.mjs';
import { bilingualCues, writeCues } from './captions.mjs';
const cues=await bilingualCues(await readFile(path.join(ROOT,'references/translations/source-timing.lrc'),'utf8'));
await mkdir(MEDIA,{recursive:true});
await writeCues(MEDIA,cues);
const manifestPath=path.join(MEDIA,'manifest.json');
try {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  await writeFile(manifestPath,JSON.stringify({...manifest,cueCount:cues.length},null,2));
} catch(error) { if(error.code!=='ENOENT')throw error; }
console.log(`${cues.filter(c=>c.text).length} verbatim bilingual lines; phrase anchors preserved, keywords separated.`);
