import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LeadsList } from './pages/leads/LeadsList';
import { LeadForm } from './pages/leads/LeadForm';
import { LeadDetail } from './pages/leads/LeadDetail';
import { StagingList } from './pages/staging/StagingList';
import { FunilKanban } from './pages/funil/FunilKanban';
import { CotacoesList } from './pages/cotacoes/CotacoesList';
import { CotacaoForm } from './pages/cotacoes/CotacaoForm';
import { LicencasCloudfyList } from './pages/licencas/cloudfy/LicencasCloudfyList';
import { LicencaCloudfyForm } from './pages/licencas/cloudfy/LicencaCloudfyForm';
import { LicencasCplugList } from './pages/licencas/cplug/LicencasCplugList';
import { LicencaCplugForm } from './pages/licencas/cplug/LicencaCplugForm';
import { PacotesList } from './pages/pacotes/PacotesList';
import { PacoteForm } from './pages/pacotes/PacoteForm';
import { CategoriasList } from './pages/categorias/CategoriasList';
import { CategoriaForm } from './pages/categorias/CategoriaForm';
import { AdicionaisList } from './pages/adicionais/AdicionaisList';
import { AdicionalForm } from './pages/adicionais/AdicionalForm';
import { ArquivadosList } from './pages/clientes/ArquivadosList';
import { LicencasAtivasCloudfyList } from './pages/clientes/LicencasAtivasCloudfyList';
import { LicencaAtivaCloudfyForm } from './pages/clientes/LicencaAtivaCloudfyForm';
import { UsuariosList } from './pages/usuarios/UsuariosList';
import { UsuarioForm } from './pages/usuarios/UsuarioForm';
import { RelatoriosDashboard } from './pages/relatorios/RelatoriosDashboard';

const PlaceholderPage = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="space-y-2">
    <h1 className="text-2xl font-bold text-white">{title}</h1>
    <p className="text-slate-400">{subtitle}</p>
  </div>
);

const FunilReview = () => <PlaceholderPage title="Revisão do funil" subtitle="Esta tela será implementada no próximo ajuste." />;
const PropostasEnviadas = () => <PlaceholderPage title="Propostas enviadas" subtitle="Acompanhamento de propostas enviadas em desenvolvimento." />;
const PropostasAprovadas = () => <PlaceholderPage title="Propostas aprovadas" subtitle="Acompanhamento de propostas aprovadas em desenvolvimento." />;
const ClientesArquivados = () => <ArquivadosList />;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsList />} />
              <Route path="/leads/novo" element={<LeadForm />} />
              <Route path="/leads/editar/:id" element={<LeadForm />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/leads/arquivados" element={<ClientesArquivados />} />
              <Route path="/clientes" element={<ClientesArquivados />} />
              <Route path="/clientes/licencas-ativas" element={<LicencasAtivasCloudfyList />} />
              <Route path="/clientes/licencas-ativas/nova" element={<LicencaAtivaCloudfyForm />} />
              <Route path="/clientes/licencas-ativas/editar/:id" element={<LicencaAtivaCloudfyForm />} />
              <Route path="/triagem" element={<StagingList />} />
              <Route path="/staging" element={<StagingList />} />
              <Route path="/funil" element={<FunilKanban />} />
              <Route path="/funil/revisao" element={<FunilReview />} />
              <Route path="/cotacoes" element={<CotacoesList />} />
              <Route path="/cotacoes/nova" element={<CotacaoForm />} />
              <Route path="/cotacoes/editar/:id" element={<CotacaoForm />} />
              <Route path="/licencas/cloudfy" element={<LicencasCloudfyList />} />
              <Route path="/licencas/cloudfy/nova" element={<LicencaCloudfyForm />} />
              <Route path="/licencas/cloudfy/editar/:id" element={<LicencaCloudfyForm />} />
              <Route path="/licencas/cplug" element={<LicencasCplugList />} />
              <Route path="/licencas/cplug/nova" element={<LicencaCplugForm />} />
              <Route path="/licencas/cplug/editar/:id" element={<LicencaCplugForm />} />
              <Route path="/pacotes" element={<PacotesList />} />
              <Route path="/pacotes/novo" element={<PacoteForm />} />
              <Route path="/pacotes/editar/:id" element={<PacoteForm />} />
              <Route path="/categorias" element={<CategoriasList />} />
              <Route path="/categorias/nova" element={<CategoriaForm />} />
              <Route path="/categorias/editar/:id" element={<CategoriaForm />} />
              <Route path="/adicionais" element={<AdicionaisList />} />
              <Route path="/adicionais/novo" element={<AdicionalForm />} />
              <Route path="/adicionais/editar/:id" element={<AdicionalForm />} />
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/usuarios" element={<UsuariosList />} />
                <Route path="/usuarios/novo" element={<UsuarioForm />} />
                <Route path="/usuarios/editar/:id" element={<UsuarioForm />} />
              </Route>
              <Route path="/relatorios" element={<RelatoriosDashboard />} />
              <Route path="/propostas/enviadas" element={<PropostasEnviadas />} />
              <Route path="/propostas/aprovadas" element={<PropostasAprovadas />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;