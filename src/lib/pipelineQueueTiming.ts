/** Rows in processing order: at most one active head, then queued FIFO. */
export type PipelineTimingRow =
  | { entryType: 'active'; completeAt: number; durationMs: number }
  | { entryType: 'queued'; durationMs: number };

export function formatQueueDurationMs(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr > 0) return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
  return `${min}m`;
}

/**
 * Wall-clock completion per step. Active uses server `completeAt`; queued chains
 * after the previous step (or `Date.now()` if nothing active yet).
 */
export function computePipelineCompletionTimes(
  rows: PipelineTimingRow[]
): number[] {
  const ends: number[] = [];
  let cursor: number | null = null;

  for (const item of rows) {
    if (item.entryType === 'active') {
      ends.push(item.completeAt);
      cursor = item.completeAt;
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
