import { useState, type FormEvent } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../db/firebase';

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Email inválido';
    case 'auth/user-not-found': return 'No existe una cuenta con ese email';
    case 'auth/wrong-password': return 'Contraseña incorrecta';
    case 'auth/invalid-credential': return 'Email o contraseña incorrectos';
    case 'auth/email-already-in-use': return 'Ya existe una cuenta con ese email';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/too-many-requests': return 'Demasiados intentos fallidos. Intente más tarde';
    default: return 'Ocurrió un error. Intente nuevamente';
  }
}

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-xl font-semibold text-slate-900 mb-6">
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading
                ? 'Cargando...'
                : isLogin
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-sky-600 hover:text-sky-700 transition-colors"
            >
              {isLogin
                ? '¿No tienes cuenta? Crear una'
                : '¿Ya tienes cuenta? Iniciar sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
