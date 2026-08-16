import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { LeadsList } from '@/pages/leads/LeadsList';
import { LeadForm } from '@/pages/leads/LeadForm';
import { LeadDetail } from '@/pages/leads/LeadDetail';
import { StagingList } from '@/pages/staging/StagingList';
import { FunilKanban } from '@/pages/funil/FunilKanban';
import { ArquivadosList } from '@/pages/clientes/ArquivadosList';
import { MigrationTool } from '@/pages/migrate/MigrationTool';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<LeadsList />} />
            <Route path="leads/novo" element={<LeadForm />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="leads/:id/editar" element={<LeadForm />} />
            <Route path="triagem" element={<StagingList />} />
            <Route path="funil" element={<FunilKanban />} />
            <Route path="clientes" element={<ArquivadosList />} />
            <Route path="migrate" element={<ProtectedRoute adminOnly><MigrationTool /></ProtectedRoute>} />
            <Route path="cotacoes" element={<div className="text-white text-center py-20">Cotações - Em desenvolvimento</div>} />
            <Route path="licencas" element={<div className="text-white text-center py-20">Licenças - Em desenvolvimento</div>} />
            <Route path="usuarios" element={<ProtectedRoute adminOnly><div className="text-white text-center py-20">Usuários - Em desenvolvimento</div></ProtectedRoute>} />
            <Route path="relatorios" element={<ProtectedRoute adminOnly><div className="text-white text-center py-20">Relatórios - Em desenvolvimento</div></ProtectedRoute>} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
