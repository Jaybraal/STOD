import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TrialTimerProps {
  minutesRemaining: number;
  onExpired?: () => void;
}

export function TrialTimer({ minutesRemaining, onExpired }: TrialTimerProps) {
  const [displayMinutes, setDisplayMinutes] = useState(minutesRemaining);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    setDisplayMinutes(Math.floor(minutesRemaining));
    setDisplaySeconds(Math.round((minutesRemaining % 1) * 60));
  }, [minutesRemaining]);

  useEffect(() => {
    if (displayMinutes === 0 && displaySeconds === 0) {
      onExpired?.();
    }
  }, [displayMinutes, displaySeconds, onExpired]);

  const isPastExpiry = displayMinutes === 0 && displaySeconds === 0;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
      <Clock className="w-4 h-4 text-amber-600" />
      <span className={`text-sm font-medium ${isPastExpiry ? 'text-red-600' : 'text-amber-600'}`}>
        {isPastExpiry ? 'Trial expired' : `${displayMinutes}m ${displaySeconds}s`}
      </span>
    </div>
  );
}
