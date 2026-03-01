import { type ReactNode } from 'react';
import { SyncStatusBar } from '../SyncStatusBar';

interface HeaderProps {
  title: string;
  actions?: ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-slate-900 flex-1">{title}</h1>
      <div className="hidden lg:block">
        <SyncStatusBar />
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
