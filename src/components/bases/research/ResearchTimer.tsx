import { useState, useEffect } from 'react';

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function ResearchTimer({
  finishesAt,
  onComplete,
}: {
  finishesAt: number;
  onComplete: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((finishesAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [finishesAt, timeLeft, onComplete]);

  return (
    <span className="text-sm text-muted-foreground">
      Time remaining: {formatTime(timeLeft)}
    </span>
  );
}
