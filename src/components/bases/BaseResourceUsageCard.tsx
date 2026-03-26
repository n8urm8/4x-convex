import { BaseDetails, BuildPipelineEntry } from '@/features/bases/types';
import { PipelineQueueCard, type PipelineQueueRow } from '@/components/bases/PipelineQueueCard';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMutation } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

function structureBuildPipelineToRows(
  pipeline: BuildPipelineEntry[],
  onCancelActive: (structureId: Id<'baseStructures'>) => void,
  onRemoveQueued: (queueId: Id<'baseStructureBuildQueue'>) => void
): PipelineQueueRow[] {
  return pipeline.map((item) => {
    if (item.entryType === 'active') {
      return {
        variant: 'active',
        rowKey: `active-${item.structureId}`,
        title: (
          <>
            {item.kind === 'build' ? 'Building' : 'Upgrading'}{' '}
            <span className="text-foreground">{item.label}</span>
            <span className="ml-1 text-xs">(in progress)</span>
          </>
        ),
        durationMs: item.durationMs,
        completesAt: item.upgradeCompleteTime,
        action: {
          label: 'Cancel',
          onClick: () => onCancelActive(item.structureId),
        },
      };
    }
    return {
      variant: 'queued',
      rowKey: `q-${item.queueId}`,
      title: (
        <>
          Queued: {item.kind === 'build' ? 'Build' : 'Upgrade'}{' '}
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

export function BaseResourceUsageCard({ base }: { base: BaseDetails }) {
  const cancelBuild = useMutation(
    api.game.bases.baseMutations.cancelStructureUpgrade
  );
  const removeQueue = useMutation(
    api.game.bases.baseMutations.removeFromStructureBuildQueue
  );

  const pipeline = base.buildPipeline ?? [];

  const handleCancel = useCallback(
    async (structureId: Id<'baseStructures'>) => {
      try {
        await cancelBuild({ structureId });
        toast.success('Build cancelled. Resources refunded.');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [cancelBuild]
  );

  const handleRemoveQueued = useCallback(
    async (queueId: Id<'baseStructureBuildQueue'>) => {
      try {
        await removeQueue({ queueEntryId: queueId });
        toast.success('Removed from queue.');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [removeQueue]
  );

  const queueRows = useMemo(
    () =>
      structureBuildPipelineToRows(
        pipeline,
        (id) => void handleCancel(id),
        (id) => void handleRemoveQueued(id)
      ),
    [pipeline, handleCancel, handleRemoveQueued]
  );

  const energyPercentage = (base.usedEnergy / base.totalEnergy) * 100;
  const spacePercentage = (base.usedSpace / base.totalSpace) * 100;

  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Energy Usage</span>
            <span>
              {base.usedEnergy} / {base.totalEnergy}
            </span>
          </div>
          <Progress value={energyPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {energyPercentage.toFixed(1)}% used
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Space Usage</span>
            <span>
              {base.usedSpace} / {base.totalSpace}
            </span>
          </div>
          <Progress value={spacePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {spacePercentage.toFixed(1)}% used
          </p>
        </div>
        <PipelineQueueCard
          layout="embedded"
          title="Build queue"
          rows={queueRows}
          className="md:col-span-2"
        />
      </CardContent>
    </Card>
  );
}
