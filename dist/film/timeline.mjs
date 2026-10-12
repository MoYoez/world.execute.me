// Shared lyric parsing and playback timing.
export const LYRIC_DELAY = .5;

export function clamp(value, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
export function cueAt(cues, t) {
  let low = 0, high = cues.length - 1, result = null;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (cues[mid].time <= t) { result = cues[mid]; low = mid + 1; }
    else high = mid - 1;
  }
  return result;
}
export function lyricCueAt(cues,t) { return cueAt(cues,Math.round((t-LYRIC_DELAY)*1e6)/1e6); }
export function parseLrc(source) {
  const offset = Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1] ?? 0) / 1000;
  const cues = [];
  for (const line of source.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{1,3}):(\d{2}(?:\.\d+)?)\]/g)];
    if (!matches.length) continue;
    const text = line.replace(/\[[^\]]*\]/g, '').trim();
    for (const match of matches) cues.push({ time: Math.round((Number(match[1]) * 60 + Number(match[2]) + offset) * 1000) / 1000, text });
  }
  return cues.sort((a, b) => a.time - b.time);
}
