import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { LicencasCloudfyList } from '@/pages/licencas/cloudfy/LicencasCloudfyList';
import { LicencaCloudfyForm } from '@/pages/licencas/cloudfy/LicencaCloudfyForm';
import { CategoriasLicencasCloudfy } from '@/pages/licencas/cloudfy/CategoriasLicencasCloudfy';
import { CategoriaLicencaCloudfyForm } from '@/pages/licencas/cloudfy/CategoriaLicencaCloudfyForm';
import { LicencasCplugList } from '@/pages/licencas/cplug/LicencasCplugList';
import { LicencaCplugForm } from '@/pages/licencas/cplug/LicencaCplugForm';
import { PacotesList } from '@/pages/pacotes/PacotesList';
import { PacoteForm } from '@/pages/pacotes/PacoteForm';
import { AdicionaisList } from '@/pages/adicionais/AdicionaisList';
import { CategoriasList } from '@/pages/categorias/CategoriasList';
import { CategoriaForm } from '@/pages/categorias/CategoriaForm';
import { CotacoesList } from '@/pages/cotacoes/CotacoesList';
import { CotacaoForm } from '@/pages/cotacoes/CotacaoForm';

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
            <Route path="cotacoes" element={<CotacoesList />} />
            <Route path="cotacoes/nova" element={<CotacaoForm />} />
            <Route path="cotacoes/:id" element={<CotacaoForm />} />
            <Route path="licencas" element={<Navigate to="/licencas/cloudfy" replace />} />
            <Route path="licencas/cloudfy" element={<LicencasCloudfyList />} />
            <Route path="licencas/cloudfy/categorias" element={<CategoriasLicencasCloudfy />} />
            <Route path="licencas/cloudfy/categorias/nova" element={<CategoriaLicencaCloudfyForm />} />
            <Route path="licencas/cloudfy/categorias/editar/:id" element={<CategoriaLicencaCloudfyForm />} />
            <Route path="licencas/cloudfy/nova" element={<LicencaCloudfyForm />} />
            <Route path="licencas/cloudfy/editar/:id" element={<LicencaCloudfyForm />} />
            <Route path="licencas/cplug" element={<LicencasCplugList />} />
            <Route path="licencas/cplug/nova" element={<LicencaCplugForm />} />
            <Route path="licencas/cplug/editar/:id" element={<LicencaCplugForm />} />
            <Route path="pacotes" element={<PacotesList />} />
            <Route path="pacotes/novo" element={<PacoteForm />} />
            <Route path="pacotes/editar/:id" element={<PacoteForm />} />
            <Route path="adicionais" element={<AdicionaisList />} />
            <Route path="categorias" element={<CategoriasList />} />
            <Route path="categorias/nova" element={<CategoriaForm />} />
            <Route path="categorias/editar/:id" element={<CategoriaForm />} />
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
