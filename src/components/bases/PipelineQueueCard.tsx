import { ResearchTimer } from '@/components/bases/research/ResearchTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  computeChainedCompletionTimes,
  formatPipelineDurationMs,
} from '@/lib/pipelineQueue';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

export type PipelineQueueRow =
  | {
      variant: 'active';
      rowKey: string;
      title: ReactNode;
      durationMs: number;
      completesAt?: number;
      action?: { label: string; onClick: () => void | Promise<void> };
    }
  | {
      variant: 'queued';
      rowKey: string;
      title: ReactNode;
      durationMs: number;
      action?: { label: string; onClick: () => void | Promise<void> };
    };

type PipelineQueueCardProps = {
  title: string;
  rows: PipelineQueueRow[];
  /**
   * When set, the in-progress row with `completesAt` shows a live mm:ss timer and calls
   * this at zero (e.g. research `completeResearch`).
   */
  onActiveTimerComplete?: () => void;
  /**
   * `card` — default standalone Card (research, shipyards).
   * `embedded` — border-top section inside a parent Card (structure resource card).
   */
  layout?: 'card' | 'embedded';
  className?: string;
};

function rowsToTimingEntries(
  rows: PipelineQueueRow[]
): Array<{
  entryType: 'active' | 'queued';
  durationMs: number;
  completesAt?: number;
}> {
  return rows.map((r) =>
    r.variant === 'active'
      ? {
          entryType: 'active' as const,
          durationMs: r.durationMs,
          completesAt: r.completesAt,
        }
      : {
          entryType: 'queued' as const,
          durationMs: r.durationMs,
        }
  );
}

export function PipelineQueueCard({
  title,
  rows,
  onActiveTimerComplete,
  layout = 'card',
  className,
}: PipelineQueueCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (rows.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [rows.length]);

  const itemCompletionTimes = useMemo(
    () => computeChainedCompletionTimes(rowsToTimingEntries(rows)),
    [rows]
  );

  const totalRemainingMs = useMemo(() => {
    if (itemCompletionTimes.length === 0) return 0;
    const doneAt = itemCompletionTimes[itemCompletionTimes.length - 1]!;
    return Math.max(0, doneAt - now);
  }, [itemCompletionTimes, now]);

  if (rows.length === 0) {
    return null;
  }

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">
        Total remaining:{' '}
        <span className="font-medium text-foreground tabular-nums">
          {formatPipelineDurationMs(totalRemainingMs)}
        </span>
      </p>
    </div>
  );

  const list = (
    <ol className="space-y-2 text-sm">
      {rows.map((row, index) => {
        const durationLabel = formatPipelineDurationMs(row.durationMs);
        const doneAt = itemCompletionTimes[index];
        const remainingMs =
          doneAt != null ? Math.max(0, doneAt - now) : null;
        const showTimer =
          row.variant === 'active' &&
          row.completesAt != null &&
          onActiveTimerComplete != null;
        const showQueuedRemaining =
          row.variant === 'queued' && remainingMs != null;
        const showActiveApproxRemaining =
          row.variant === 'active' && !showTimer && remainingMs != null;

        return (
          <li
            key={row.rowKey}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {index + 1}.
                </span>{' '}
                {row.title}
              </div>
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                <div className="tabular-nums">
                  Duration: {durationLabel}
                  {showQueuedRemaining || showActiveApproxRemaining ? (
                    <>
                      {' '}
                      · {formatPipelineDurationMs(remainingMs)} left
                    </>
                  ) : null}
                </div>
                {showTimer ? (
                  <ResearchTimer
                    finishesAt={row.completesAt!}
                    onComplete={onActiveTimerComplete}
                  />
                ) : null}
              </div>
            </div>
            {row.action ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void row.action!.onClick()}
              >
                {row.action.label}
              </Button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );

  if (layout === 'embedded') {
    return (
      <div className={cn('border-t pt-4 space-y-2', className)}>
        {header}
        {list}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className={cn('pt-6 space-y-3', className)}>
        {header}
        {list}
      </CardContent>
    </Card>
  );
}
