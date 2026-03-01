import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { SyncProvider } from './context/SyncContext';
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

export default function App() {
  return (
    <BrowserRouter>
      <SyncProvider>
        <Routes>
          {/* Vista de impresión - sin shell */}
          <Route path="/recetas/:id/imprimir" element={<RecetaPrint />} />

          {/* App principal con shell */}
          <Route path="/*" element={
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
          } />
        </Routes>
      </SyncProvider>
    </BrowserRouter>
  );
}
