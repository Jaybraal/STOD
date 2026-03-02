import { useSyncContext } from '../context/SyncContext';
import { Wifi, WifiOff } from 'lucide-react';

export function SyncStatusBar() {
  const { isOnline } = useSyncContext();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <WifiOff size={13} />
        <span>Sin conexión</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600">
      <Wifi size={13} />
      <span>Conectado</span>
    </div>
  );
}
