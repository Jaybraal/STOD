import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Stethoscope, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/citas', icon: CalendarDays, label: 'Citas' },
  { to: '/tratamientos', icon: Stethoscope, label: 'Tratamientos' },
  { to: '/configuracion', icon: Settings, label: 'Config.' },
];

export function BottomNav() {
  const { logout } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                isActive ? 'text-sky-600' : 'text-slate-500'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={22} />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  );
}
