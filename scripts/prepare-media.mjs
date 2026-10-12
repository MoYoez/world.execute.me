import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, MEDIA } from './paths.mjs';
import { bilingualCues, writeCues } from './captions.mjs';

const references = path.join(ROOT, 'references');
const files = await readdir(references);
const audioFiles = files.filter((file) => /\.flac$/i.test(file));
if (audioFiles.length !== 1) throw new Error('Place exactly one original-recording FLAC in references/ for local video export.');
const audioPath = path.join(references, audioFiles[0]);
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:format_tags=title,artist,album', '-of', 'json', audioPath], { encoding: 'utf8' }));
await mkdir(MEDIA, { recursive: true });
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', audioPath, '-map', '0:a:0', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', path.join(MEDIA, 'song.m4a')]);
const cues = await bilingualCues(await readFile(path.join(references,'translations/source-timing.lrc'),'utf8'));
await writeCues(MEDIA,cues);
await writeFile(path.join(MEDIA, 'manifest.json'), JSON.stringify({ duration: Number(probe.format.duration), title: 'world.execute(me);', artist: 'Mili', album: 'Miracle Milk', sourceAudio: audioFiles[0], cueCount: cues.length, audio: '/media/song.m4a' }, null, 2));
console.log(JSON.stringify({ duration: Number(probe.format.duration), cues: cues.length, audio: 'dist/media/song.m4a' }));
