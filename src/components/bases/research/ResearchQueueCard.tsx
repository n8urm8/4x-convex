import { PipelineQueueCard, type PipelineQueueRow } from '@/components/bases/PipelineQueueCard';
import { ResearchPipelineEntry } from '@/features/research/researchPipeline';
import { useMutation } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

function researchPipelineToRows(
  pipeline: ResearchPipelineEntry[],
  onRemoveQueued: (queueId: Id<'playerResearchQueue'>) => void
): PipelineQueueRow[] {
  return pipeline.map((item) => {
    if (item.entryType === 'active') {
      return {
        variant: 'active',
        rowKey: `active-${item.researchDefinitionId}`,
        title: (
          <>
            Researching{' '}
            <span className="text-foreground">{item.label}</span>
            <span className="ml-1 text-xs">(in progress)</span>
          </>
        ),
        durationMs: item.durationMs,
        completesAt: item.researchFinishesAt,
      };
    }
    return {
      variant: 'queued',
      rowKey: `q-${item.queueId}`,
      title: (
        <>
          Queued:{' '}
          <span className="text-foreground">{item.label}</span>
        </>
      ),
      durationMs: item.durationMs,
      action: {
        label: 'Remove',
        onClick: () => onRemoveQueued(item.queueId),
      },
    };
  });
}

export function ResearchQueueCard({
  pipeline,
  onActiveResearchComplete,
}: {
  pipeline: ResearchPipelineEntry[];
  onActiveResearchComplete?: () => void;
}) {
  const removeFromQueue = useMutation(
    api.game.research.researchMutations.removeFromResearchQueue
  );

  const handleRemoveQueued = useCallback(
    async (queueId: Id<'playerResearchQueue'>) => {
      try {
        await removeFromQueue({ queueEntryId: queueId });
        toast.success('Removed from research queue.');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [removeFromQueue]
  );

  const rows = useMemo(
    () => researchPipelineToRows(pipeline, (id) => void handleRemoveQueued(id)),
    [pipeline, handleRemoveQueued]
  );

  return (
    <PipelineQueueCard
      title="Research"
      rows={rows}
      onActiveTimerComplete={onActiveResearchComplete}
    />
  );
}
