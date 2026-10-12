// Shared interpolation used by the current full-length performance.
import { clamp } from '../../film/timeline.mjs';

export function ease(t, a, b) {
  const p = clamp((t - a) / (b - a));
  return p * p * p * (p * (p * 6 - 15) + 10);
}
