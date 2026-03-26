import type { PipelineQueueRow } from '@/components/bases/PipelineQueueCard';

/**
 * Maps server `shipBuildPipeline` to UI rows. Extend when per-base ship production queue exists.
 */
export function mapShipBuildPipelineToQueueRows(
  _entries: readonly unknown[]
): PipelineQueueRow[] {
  return [];
}
