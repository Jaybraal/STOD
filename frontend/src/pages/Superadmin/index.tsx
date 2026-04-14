import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../db/firebase';
import { subscribeClinics, type ClinicSummary } from '../../db/queries/superadmin';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { Building2, Users, Shield, Clock } from 'lucide-react';

interface SystemUser {
  uid: string;
  email: string;
  clinicId?: string;
  status?: string;
  role?: string;
  joinedAt?: string;
}

export function SuperadminPage() {
  const [clinics, setClinics] = useState<ClinicSummary[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubClinics = subscribeClinics((data) => {
      setClinics(data);
      setLoading(false);
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as SystemUser)));
    });

    return () => {
      unsubClinics();
      unsubUsers();
    };
  }, []);

  if (loading) return <LoadingPage />;

  const totalUsers = allUsers.filter((u) => u.status !== 'pending').length;
  const pendingUsers = allUsers.filter((u) => u.status === 'pending').length;
  const adminUsers = allUsers.filter((u) => u.role === 'admin').length;

  return (
    <div>
      <Header title="Panel Superadmin" />

      <div className="p-4 lg:p-6 space-y-6 max-w-4xl">

        {/* Estadísticas globales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Building2 size={22} className="mx-auto text-sky-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{clinics.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Clínicas</p>
          </Card>
          <Card className="p-4 text-center">
            <Users size={22} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Usuarios activos</p>
          </Card>
          <Card className="p-4 text-center">
            <Shield size={22} className="mx-auto text-violet-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{adminUsers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Admins de clínica</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock size={22} className="mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{pendingUsers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pendientes</p>
          </Card>
        </div>

        {/* Lista de clínicas */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-sky-500" />
            Clínicas registradas
          </h2>

          {clinics.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay clínicas registradas.</p>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => {
                const clinicPending = allUsers.filter(
                  (u) => u.clinicId === clinic.clinicId && u.status === 'pending'
                ).length;

                return (
                  <div
                    key={clinic.clinicId}
                    className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {clinic.config.clinicName || <span className="italic text-slate-400">Sin nombre</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {clinic.config.doctorName && `Dr/a. ${clinic.config.doctorName}`}
                        {clinic.config.clinicType && ` · ${clinic.config.clinicType}`}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{clinic.clinicId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs bg-sky-100 text-sky-700 font-medium px-2 py-0.5 rounded-full">
                        {clinic.memberCount} {clinic.memberCount === 1 ? 'miembro' : 'miembros'}
                      </span>
                      {clinicPending > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                          {clinicPending} pendiente{clinicPending > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Lista de todos los usuarios */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={18} className="text-sky-500" />
            Todos los usuarios del sistema
          </h2>

          {allUsers.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay usuarios registrados.</p>
          ) : (
            <div className="space-y-2">
              {allUsers.map((u) => (
                <div key={u.uid} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{u.clinicId || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {u.role === 'admin' && (
                      <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    {u.status === 'pending' ? (
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <p className="text-xs text-slate-400 text-center">
          Panel de Superadmin — Solo visible para administradores del sistema
        </p>
      </div>
    </div>
  );
}
