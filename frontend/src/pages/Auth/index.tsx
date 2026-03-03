import { useState, type FormEvent } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../db/firebase';
import { getClinicIdByCode } from '../../db/queries/config';

type Mode = 'login' | 'register' | 'join';

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Email inválido';
    case 'auth/user-not-found': return 'No existe una cuenta con ese email';
    case 'auth/wrong-password': return 'Contraseña incorrecta';
    case 'auth/invalid-credential': return 'Email o contraseña incorrectos';
    case 'auth/email-already-in-use': return 'Ya existe una cuenta con ese email';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/too-many-requests': return 'Demasiados intentos fallidos. Intente más tarde';
    case 'auth/operation-not-allowed': return 'Email/Password no está habilitado en Firebase';
    default: return `Error: ${code || 'desconocido'}`;
  }
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setCode('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);

      } else if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);

      } else {
        // Unirse con código
        if (!code.trim()) { setError('Ingresa el código de conexión'); setLoading(false); return; }
        const clinicId = await getClinicIdByCode(code.trim());
        if (!clinicId) { setError('Código inválido o expirado'); setLoading(false); return; }
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        // Guardar mapeo usuario → clínica
        await setDoc(doc(db, 'users', user.uid), { clinicId });
      }
    } catch (err: unknown) {
      const errCode = (err as { code?: string }).code ?? '';
      setError(getErrorMessage(errCode));
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Iniciar sesión',
    register: 'Crear clínica nueva',
    join: 'Unirse a una clínica',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-slate-900 text-2xl">STOD</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-6">{titles[mode]}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="clinica@ejemplo.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? '••••••••' : 'Mínimo 6 caracteres'}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de conexión</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: AB12CD"
                  maxLength={6}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors font-mono tracking-widest uppercase"
                />
                <p className="text-xs text-slate-400 mt-1">Pídelo al administrador de la clínica en Configuración</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Cargando...' : titles[mode]}
            </button>
          </form>

          {/* Links de navegación */}
          <div className="mt-5 space-y-2 text-center">
            {mode !== 'login' && (
              <button onClick={() => switchMode('login')} className="block w-full text-sm text-sky-600 hover:text-sky-700">
                ¿Ya tienes cuenta? Iniciar sesión
              </button>
            )}
            {mode !== 'register' && (
              <button onClick={() => switchMode('register')} className="block w-full text-sm text-slate-500 hover:text-slate-700">
                Crear clínica nueva
              </button>
            )}
            {mode !== 'join' && (
              <button onClick={() => switchMode('join')} className="block w-full text-sm text-slate-500 hover:text-slate-700">
                Unirse a una clínica con código
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
