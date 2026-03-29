import type { PipelineQueueRow } from '@/components/bases/PipelineQueueCard';
import { Id } from '@cvx/_generated/dataModel';

type ShipBuildPipelineEntry = {
  entryType: 'active' | 'queued';
  shipName: string;
  quantity: number;
  finishesAt?: number;
  durationMs: number;
  queueId?: Id<'playerShipQueue'>;
};

/**
 * Maps server `shipBuildPipeline` to UI rows for ship production queue.
 */
export function mapShipBuildPipelineToQueueRows(
  entries: readonly ShipBuildPipelineEntry[],
  onRemoveQueued?: (queueId: Id<'playerShipQueue'>) => void
): PipelineQueueRow[] {
  return entries.map((entry, index) => ({
    variant: entry.entryType,
    rowKey: entry.queueId ? `queue-${entry.queueId}` : `active-${index}`,
    title: `${entry.quantity}x ${entry.shipName}`,
    durationMs: entry.durationMs,
    completesAt: entry.finishesAt,
    action: entry.entryType === 'queued' && entry.queueId && onRemoveQueued ? {
      label: 'Cancel',
      onClick: () => onRemoveQueued(entry.queueId!)
    } : undefined,
  }));
}
