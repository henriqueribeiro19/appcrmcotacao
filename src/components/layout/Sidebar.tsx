import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { LayoutDashboard, Users, Filter, Kanban, FileText, Key, UserCog, BarChart3, LogOut, Archive, ChevronDown, ChevronRight, Cloud, Cpu, Package, Puzzle, FolderOpen, X } from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/triagem', label: 'Triagem', icon: Filter },
  { path: '/funil', label: 'Funil', icon: Kanban },
  { path: '/clientes', label: 'Clientes', icon: Archive },
  { path: '/clientes/licencas-ativas', label: 'Licenças Ativas', icon: Key },
  { path: '/cotacoes', label: 'Cotações', icon: FileText },
  { path: '/pacotes', label: 'Pacotes', icon: Package },
  { path: '/adicionais', label: 'Adicionais', icon: Puzzle },
  { path: '/categorias', label: 'Categorias', icon: FolderOpen },
  { path: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  { path: '/contratos/modelo/cloudfy', label: 'Modelo contrato Cloudfy', icon: FileText, adminOnly: true },
];

interface SidebarProps {
  mobileMenuOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileMenuOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const [licencasAbertas, setLicencasAbertas] = useState(true);

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between border-b border-slate-800 p-5">
        <h1 className="text-lg font-bold text-white">
          CRM <span className="text-emerald-500">+Cotação</span>
          <span className="block text-xs font-normal text-slate-500">Pro</span>
        </h1>
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        <div>
          <button
            onClick={() => setLicencasAbertas((aberta) => !aberta)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/licencas') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Key size={18} />
            <span className="flex-1 text-left">Licenças</span>
            {licencasAbertas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {licencasAbertas && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
              <button onClick={() => { navigate('/licencas/cloudfy'); onClose(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname.startsWith('/licencas/cloudfy') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Cloud size={16} />Cloudfy</button>
              <button onClick={() => { navigate('/licencas/cplug'); onClose(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname.startsWith('/licencas/cplug') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Cpu size={16} />Cplug</button>
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
