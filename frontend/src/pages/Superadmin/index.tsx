import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingPage } from '../../components/ui/Spinner';
import {
  Users, Building2, Plus, Trash2, Edit2, ShieldAlert,
  Eye, EyeOff, Check,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface SystemUser {
  uid: string;
  email: string;
  createdAt: string;
  isOwner: boolean;
  clinicId: string | null;
  clinicName: string;
  role: string;
  status: string;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`${API}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res.json();
}

export function SuperadminPage() {
  const [users, setUsers]       = useState<SystemUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Modal crear
  const [showCreate, setShowCreate]   = useState(false);
  const [newEmail, setNewEmail]       = useState('');
  const [newPass, setNewPass]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [createOk, setCreateOk]       = useState(false);

  // Modal editar
  const [editUser, setEditUser]       = useState<SystemUser | null>(null);
  const [editEmail, setEditEmail]     = useState('');
  const [editPass, setEditPass]       = useState('');
  const [showEditPass, setShowEditPass] = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editError, setEditError]     = useState('');

  // Confirmación eliminar
  const [deleteUid, setDeleteUid]     = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    const data = await adminFetch('/users');
    if (data.users) setUsers(data.users);
    else setError(data.error || 'Error al cargar usuarios');
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    const data = await adminFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ email: newEmail, password: newPass }),
    });
    setCreating(false);
    if (data.uid) {
      setCreateOk(true);
      setNewEmail('');
      setNewPass('');
      setTimeout(() => { setCreateOk(false); setShowCreate(false); }, 1500);
      loadUsers();
    } else {
      setCreateError(data.error || 'Error al crear usuario');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditing(true);
    setEditError('');
    const body: Record<string, string> = {};
    if (editEmail && editEmail !== editUser.email) body.email = editEmail;
    if (editPass) body.password = editPass;
    if (Object.keys(body).length === 0) { setEditing(false); setEditUser(null); return; }
    const data = await adminFetch(`/users/${editUser.uid}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setEditing(false);
    if (data.ok) { setEditUser(null); loadUsers(); }
    else setEditError(data.error || 'Error al actualizar');
  };

  const handleDelete = async () => {
    if (!deleteUid) return;
    setDeleting(true);
    const data = await adminFetch(`/users/${deleteUid}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteUid(null);
    if (data.ok) loadUsers();
    else alert(data.error || 'Error al eliminar');
  };

  const openEdit = (u: SystemUser) => {
    setEditUser(u);
    setEditEmail(u.email);
    setEditPass('');
    setEditError('');
    setShowEditPass(false);
  };

  if (loading) return <LoadingPage />;

  const owners  = users.filter((u) => u.isOwner);
  const members = users.filter((u) => !u.isOwner);

  return (
    <div>
      <Header title="Panel Superadmin" />

      <div className="p-4 lg:p-6 space-y-6 max-w-3xl">

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <Building2 size={22} className="mx-auto text-sky-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{owners.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Clínicas (owners)</p>
          </Card>
          <Card className="p-4 text-center">
            <Users size={22} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{members.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Colaboradores</p>
          </Card>
          <Card className="p-4 text-center col-span-2 sm:col-span-1">
            <ShieldAlert size={22} className="mx-auto text-violet-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total usuarios</p>
          </Card>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error} — <button onClick={loadUsers} className="underline">reintentar</button>
          </div>
        )}

        {/* Lista de usuarios */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-sky-500" />
              Todos los usuarios
            </h2>
            <Button size="sm" onClick={() => { setShowCreate(true); setCreateError(''); setCreateOk(false); }}>
              <Plus size={14} /> Crear usuario
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay usuarios.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.uid} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                      {u.isOwner && (
                        <span className="text-xs bg-sky-100 text-sky-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                          Owner
                        </span>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                          Admin
                        </span>
                      )}
                      {u.status === 'pending' && (
                        <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                          Pendiente
                        </span>
                      )}
                    </div>
                    {u.clinicName && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        Clínica: {u.clinicName}
                      </p>
                    )}
                    <p className="text-xs text-slate-300 font-mono truncate">{u.uid}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                    {u.uid !== 'RESKS8ugyVMK9iIpdjFOyFbA9XF3' && (
                      <button
                        onClick={() => setDeleteUid(u.uid)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <p className="text-xs text-slate-400 text-center">
          Panel de Superadmin — Solo visible para el administrador del sistema
        </p>
      </div>

      {/* Modal: Crear usuario */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Crear usuario">
        <form onSubmit={handleCreate} className="space-y-4 p-1">
          <p className="text-sm text-slate-500">
            El nuevo usuario podrá iniciar sesión y crear su clínica. Solo usuarios creados aquí tienen acceso al sistema.
          </p>
          <Input
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="clinica@ejemplo.com"
            required
          />
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {createError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createError}</p>
          )}
          <Button type="submit" disabled={creating} className="w-full">
            {createOk
              ? <><Check size={16} /> Usuario creado</>
              : creating ? 'Creando...' : <><Plus size={16} /> Crear usuario</>}
          </Button>
        </form>
      </Modal>

      {/* Modal: Editar usuario */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar usuario">
        <form onSubmit={handleEdit} className="space-y-4 p-1">
          <p className="text-sm text-slate-500">
            Deja en blanco los campos que no quieras cambiar.
          </p>
          <Input
            label="Nuevo email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder={editUser?.email}
          />
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showEditPass ? 'text' : 'password'}
                value={editPass}
                onChange={(e) => setEditPass(e.target.value)}
                placeholder="Dejar en blanco para no cambiar"
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEditPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showEditPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {editError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditUser(null)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={editing} className="flex-1">
              {editing ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar eliminación */}
      <Modal open={!!deleteUid} onClose={() => setDeleteUid(null)} title="Eliminar usuario">
        <div className="space-y-4 p-1">
          <p className="text-sm text-slate-600">
            ¿Estás seguro? Esta acción eliminará la cuenta de Firebase Auth y todos sus datos de acceso.{' '}
            <strong>No se puede deshacer.</strong>
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteUid(null)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
