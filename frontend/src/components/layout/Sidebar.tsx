import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Stethoscope, FileText, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { SyncStatusBar } from '../SyncStatusBar';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/citas', icon: CalendarDays, label: 'Citas' },
  { to: '/tratamientos', icon: Stethoscope, label: 'Tratamientos' },
  { to: '/documentos', icon: FileText, label: 'Documentos' },
];

export function Sidebar() {
  const { logout, isSuperAdmin } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-slate-200 h-full fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="font-bold text-slate-900 text-lg">STOD</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 space-y-2">
        <SyncStatusBar />
        {isSuperAdmin && (
          <NavLink
            to="/superadmin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-violet-600 hover:bg-violet-50 hover:text-violet-700'
              }`
            }
          >
            <ShieldAlert size={18} />
            Superadmin
          </NavLink>
        )}
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
              isActive
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Settings size={18} />
          Configuración
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
