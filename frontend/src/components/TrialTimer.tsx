import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TrialTimerProps {
  minutesRemaining: number;
  onExpired?: () => void;
}

// El backend reporta minutos enteros (trial de días) — se formatea como
// d/h/m según la magnitud en vez de asumir que siempre quedan pocos minutos.
function formatRemaining(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'Trial expired';

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function TrialTimer({ minutesRemaining, onExpired }: TrialTimerProps) {
  const [remaining, setRemaining] = useState(Math.floor(minutesRemaining));

  useEffect(() => {
    setRemaining(Math.floor(minutesRemaining));
  }, [minutesRemaining]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.();
    }
  }, [remaining, onExpired]);

  const isPastExpiry = remaining <= 0;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
      <Clock className="w-4 h-4 text-amber-600" />
      <span className={`text-sm font-medium ${isPastExpiry ? 'text-red-600' : 'text-amber-600'}`}>
        {formatRemaining(remaining)}
      </span>
    </div>
  );
}
