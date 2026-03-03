import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { SyncProvider } from './context/SyncContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { PacientesList } from './pages/Pacientes';
import { PacienteDetalle } from './pages/Pacientes/PacienteDetalle';
import { PacienteForm } from './pages/Pacientes/PacienteForm';
import { CitasPage } from './pages/Citas';
import { CitaForm } from './pages/Citas/CitaForm';
import { TratamientosPage } from './pages/Tratamientos';
import { TratamientoForm } from './pages/Tratamientos/TratamientoForm';
import { RecetasPage } from './pages/Recetas';
import { RecetaForm } from './pages/Recetas/RecetaForm';
import { RecetaPrint } from './pages/Recetas/RecetaPrint';
import { ConfiguracionPage } from './pages/Configuracion';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <Routes>
            {/* Login - redirige al dashboard si ya hay sesión */}
            <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

            {/* Vista de impresión - sin shell */}
            <Route
              path="/recetas/:id/imprimir"
              element={
                <ProtectedRoute>
                  <RecetaPrint />
                </ProtectedRoute>
              }
            />

            {/* App principal con shell y protección */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/pacientes" element={<PacientesList />} />
                      <Route path="/pacientes/nuevo" element={<PacienteForm />} />
                      <Route path="/pacientes/:id" element={<PacienteDetalle />} />
                      <Route path="/pacientes/:id/editar" element={<PacienteForm />} />
                      <Route path="/citas" element={<CitasPage />} />
                      <Route path="/citas/nueva" element={<CitaForm />} />
                      <Route path="/citas/:id/editar" element={<CitaForm />} />
                      <Route path="/tratamientos" element={<TratamientosPage />} />
                      <Route path="/tratamientos/nuevo" element={<TratamientoForm />} />
                      <Route path="/tratamientos/:id/editar" element={<TratamientoForm />} />
                      <Route path="/recetas" element={<RecetasPage />} />
                      <Route path="/recetas/nueva" element={<RecetaForm />} />
                      <Route path="/recetas/:id/editar" element={<RecetaForm />} />
                      <Route path="/configuracion" element={<ConfiguracionPage />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
