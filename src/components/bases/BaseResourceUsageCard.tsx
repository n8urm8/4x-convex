import { BaseDetails, BuildPipelineEntry } from '@/features/bases/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMutation } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

function formatQueueDurationMs(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr > 0) return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
  return `${min}m`;
}

/**
 * Wall-clock completion time per step. Active row uses server `upgradeCompleteTime`.
 * Queued rows chain after the previous step ends (or after a snapshot `Date.now()` if
 * nothing is active yet), matching sequential server processing.
 */
function computePipelineItemCompletionTimes(
  pipeline: BuildPipelineEntry[]
): number[] {
  const ends: number[] = [];
  let cursor: number | null = null;

  for (const item of pipeline) {
    if (item.entryType === 'active') {
      const end =
        item.upgradeCompleteTime ??
        Date.now() + item.durationMs;
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

export function BaseResourceUsageCard({ base }: { base: BaseDetails }) {
  const cancelBuild = useMutation(
    api.game.bases.baseMutations.cancelStructureUpgrade
  );
  const removeQueue = useMutation(
    api.game.bases.baseMutations.removeFromStructureBuildQueue
  );

  const [now, setNow] = useState(() => Date.now());

  const pipeline = base.buildPipeline ?? [];

  useEffect(() => {
    if (pipeline.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pipeline.length]);

  const itemCompletionTimes = useMemo(
    () => computePipelineItemCompletionTimes(pipeline),
    [pipeline]
  );

  const totalRemainingMs = useMemo(() => {
    if (itemCompletionTimes.length === 0) return 0;
    const queueDoneAt = itemCompletionTimes[itemCompletionTimes.length - 1]!;
    return Math.max(0, queueDoneAt - now);
  }, [itemCompletionTimes, now]);

  const energyPercentage = (base.usedEnergy / base.totalEnergy) * 100;
  const spacePercentage = (base.usedSpace / base.totalSpace) * 100;

  const handleCancel = async (structureId: Id<'baseStructures'>) => {
    try {
      await cancelBuild({ structureId });
      toast.success('Build cancelled. Resources refunded.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRemoveQueued = async (queueId: Id<'baseStructureBuildQueue'>) => {
    try {
      await removeQueue({ queueEntryId: queueId });
      toast.success('Removed from queue.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

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
        {pipeline.length > 0 ? (
          <div className="md:col-span-2 border-t pt-4 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">Build queue</p>
              <p className="text-sm text-muted-foreground">
                Total remaining:{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {formatQueueDurationMs(totalRemainingMs)}
                </span>
              </p>
            </div>
            <ol className="space-y-2 text-sm">
              {pipeline.map((item, index) => {
                const durationLabel = formatQueueDurationMs(item.durationMs);
                const doneAt = itemCompletionTimes[index];
                const remainingMs =
                  doneAt != null ? Math.max(0, doneAt - now) : null;

                return (
                  <li
                    key={
                      item.entryType === 'active'
                        ? `active-${item.structureId}`
                        : `q-${item.queueId}`
                    }
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {index + 1}.
                        </span>{' '}
                        {item.entryType === 'active' ? (
                          <>
                            {item.kind === 'build' ? 'Building' : 'Upgrading'}{' '}
                            <span className="text-foreground">{item.label}</span>
                            <span className="ml-1 text-xs">(in progress)</span>
                          </>
                        ) : (
                          <>
                            Queued: {item.kind === 'build' ? 'Build' : 'Upgrade'}{' '}
                            <span className="text-foreground">{item.label}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                        Duration: {durationLabel}
                        {remainingMs != null ? (
                          <>
                            {' '}
                            · {formatQueueDurationMs(remainingMs)} left
                          </>
                        ) : null}
                      </div>
                    </div>
                    {item.entryType === 'active' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCancel(item.structureId)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRemoveQueued(item.queueId)}
                      >
                        Remove
                      </Button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
