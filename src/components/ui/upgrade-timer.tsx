import { useEffect, useState } from 'react';

interface UpgradeTimerProps {
  upgradeCompleteTime: number;
  upgradeLevel: number;
  className?: string;
}

export function UpgradeTimer({ upgradeCompleteTime, upgradeLevel, className = '' }: UpgradeTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, upgradeCompleteTime - now);
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [upgradeCompleteTime]);

  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) return 'Completing...';
    
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const isUrgent = timeRemaining <= 60000; // Less than 1 minute remaining
  const isCompleting = timeRemaining <= 0;

  return (
    <div className={`text-xs ${className}`}>
      <div className="font-medium text-amber-600 dark:text-amber-400">
        Upgrading to Level {upgradeLevel}
      </div>
      <div className={`${
        isCompleting 
          ? 'text-green-600 dark:text-green-400 font-medium animate-pulse' 
          : isUrgent 
            ? 'text-orange-600 dark:text-orange-400' 
            : 'text-muted-foreground'
      }`}>
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
}