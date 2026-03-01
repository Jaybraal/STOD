import { useSyncContext } from '../context/SyncContext';
import { formatRelative } from '../utils/dateUtils';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function SyncStatusBar() {
  const { isOnline, status, lastSync, error } = useSyncContext();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <WifiOff size={13} />
        <span>Sin conexión</span>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span>Sin sincronizar</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-sky-600 animate-pulse">
        <RefreshCw size={13} className="animate-spin" />
        <span>Conectando...</span>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Wifi size={13} />
        <span>Sincronizando</span>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500" title={error || undefined}>
        <CheckCircle size={13} />
        <span>Sincronizado {formatRelative(lastSync)}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500" title={error || undefined}>
        <AlertCircle size={13} />
        <span>Error de sync</span>
      </div>
    );
  }

  return null;
}
