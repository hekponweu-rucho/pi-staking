import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ClaimTimerProps {
  targetTime?: Date;
  onComplete?: () => void;
  className?: string;
}

export function ClaimTimer({ targetTime, onComplete, className = '' }: ClaimTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 18 });
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (targetTime) {
        const now = new Date().getTime();
        const target = targetTime.getTime();
        const difference = target - now;

        if (difference > 0) {
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          setTimeLeft({ hours, minutes, seconds });
          setCanClaim(false);
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          setCanClaim(true);
          onComplete?.();
        }
      } else {
        // Demo mode - count down from current time
        setTimeLeft(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else if (prev.hours > 0) {
            return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
          } else {
            setCanClaim(true);
            onComplete?.();
            return { hours: 0, minutes: 0, seconds: 0 };
          }
        });
      }
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  if (canClaim) {
    return (
      <div className={`flex items-center gap-2 text-green-500 ${className}`}>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-semibold">Ready to Claim!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono font-semibold">
        {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
    </div>
  );
}