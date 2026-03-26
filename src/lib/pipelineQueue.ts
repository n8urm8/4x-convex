/**
 * Shared helpers for FIFO pipeline UIs (research, structure builds, ship production, etc.).
 */

export type PipelineTimingEntry = {
  entryType: 'active' | 'queued';
  durationMs: number;
  /** Active step only: wall-clock completion (ms since epoch). */
  completesAt?: number;
};

export function formatPipelineDurationMs(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr > 0) return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
  return `${min}m`;
}

/**
 * Wall-clock completion per step. Active uses `completesAt` from the server; queued steps
 * chain after the previous step ends (or after a snapshot `Date.now()` if nothing active).
 */
export function computeChainedCompletionTimes(
  entries: PipelineTimingEntry[]
): number[] {
  const ends: number[] = [];
  let cursor: number | null = null;

  for (const item of entries) {
    if (item.entryType === 'active') {
      const end = item.completesAt ?? Date.now() + item.durationMs;
      ends.push(end);
      cursor = end;
    } else {
      if (cursor === null) {
        cursor = Date.now();
      }
      cursor += item.durationMs;
      ends.push(cursor);
    }
  }

  return ends;
}
