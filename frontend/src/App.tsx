import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { SyncProvider } from './context/SyncContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { CheckoutPage } from './pages/Checkout';
import { PacientesList } from './pages/Pacientes';
import { PacienteDetalle } from './pages/Pacientes/PacienteDetalle';
import { PacienteForm } from './pages/Pacientes/PacienteForm';
import { CitasPage } from './pages/Citas';
import { CitaForm } from './pages/Citas/CitaForm';
import { TratamientosPage } from './pages/Tratamientos';
import { TratamientoForm } from './pages/Tratamientos/TratamientoForm';
import { DocumentosPage } from './pages/Documentos';
import { SelectorTipo } from './pages/Documentos/SelectorTipo';
import { DocumentoFormNuevo, DocumentoFormEditar } from './pages/Documentos/DocumentoFormRouter';
import { DocumentoPrint } from './pages/Documentos/DocumentoPrint';
import { ConfiguracionPage } from './pages/Configuracion';
import { SuperadminPage } from './pages/Superadmin';
import ChatAssistant from './components/ChatAssistant';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PendingApprovalScreen() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="text-amber-500" size={32} />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Esperando aprobación</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tu solicitud fue enviada. El administrador de la clínica debe aprobarte antes de que puedas acceder.
        </p>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Cancelar y cerrar sesión
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, pendingApproval } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (pendingApproval) return <PendingApprovalScreen />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ChatAssistantGate() {
  const { user, pendingApproval } = useAuth();
  if (!user || pendingApproval) return null;
  return <ChatAssistant />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <Routes>
            {/* Login - redirige al dashboard si ya hay sesión */}
            <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

            {/* Checkout - after payment, sin shell */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Panel superadmin - sin shell de clínica */}
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <AppShell>
                    <SuperadminPage />
                  </AppShell>
                </SuperAdminRoute>
              }
            />

            {/* Vista de impresión - sin shell */}
            <Route
              path="/documentos/:id/imprimir"
              element={
                <ProtectedRoute>
                  <DocumentoPrint />
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
                      <Route path="/documentos" element={<DocumentosPage />} />
                      <Route path="/documentos/nuevo" element={<SelectorTipo />} />
                      <Route path="/documentos/nuevo/:tipo" element={<DocumentoFormNuevo />} />
                      <Route path="/documentos/:id/editar" element={<DocumentoFormEditar />} />
                      <Route path="/configuracion" element={<ConfiguracionPage />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </SyncProvider>
        <ChatAssistantGate />
      </AuthProvider>
    </BrowserRouter>
  );
}
