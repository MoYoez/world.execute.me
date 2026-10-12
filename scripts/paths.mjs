import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const DIST = path.join(ROOT, 'dist');
export const MEDIA = path.join(DIST, 'media');
export const EXPORTS = path.join(ROOT, 'exports');
