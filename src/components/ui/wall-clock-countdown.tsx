import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

function formatMmSs(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function WallClockCountdown({
  finishesAt,
  onComplete,
  className,
}: {
  finishesAt: number;
  onComplete: () => void;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((finishesAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finishesAt, timeLeft, onComplete]);

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      Time remaining: {formatMmSs(timeLeft)}
    </span>
  );
}
