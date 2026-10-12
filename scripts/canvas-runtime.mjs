import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Match the typefaces used by the local Windows browser.
const fontRoot = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts');
for (const [file,family] of [['consola.ttf','Consolas'],['arial.ttf','Arial'],['msyh.ttc','Microsoft YaHei']]) {
  const fontPath=path.join(fontRoot,file);
  if(existsSync(fontPath))GlobalFonts.registerFromPath(fontPath,family);
}
export { createCanvas };
