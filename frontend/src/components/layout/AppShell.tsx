import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div id="app-shell" className="min-h-screen bg-slate-50">
      <Sidebar />
      {/* Main content - offset by sidebar on desktop */}
      <main className="lg:ml-56 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
