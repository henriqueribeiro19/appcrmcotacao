import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { LayoutDashboard, Users, Filter, Kanban, FileText, Key, UserCog, BarChart3, LogOut, Archive, ChevronDown, ChevronRight, Cloud, Cpu, Package, Puzzle, FolderOpen } from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/triagem', label: 'Triagem', icon: Filter },
  { path: '/funil', label: 'Funil', icon: Kanban },
  { path: '/clientes', label: 'Clientes', icon: Archive },
  { path: '/cotacoes', label: 'Cotações', icon: FileText },
  { path: '/pacotes', label: 'Pacotes', icon: Package },
  { path: '/adicionais', label: 'Adicionais', icon: Puzzle },
  { path: '/categorias', label: 'Categorias', icon: FolderOpen },
  { path: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const [licencasAbertas, setLicencasAbertas] = useState(true);

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-800">
        <h1 className="text-lg font-bold text-white">
          CRM <span className="text-emerald-500">+Cotação</span>
        </h1>
        <p className="text-xs text-slate-500">Pro</p>
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
                onClick={() => navigate(item.path)}
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
              <button onClick={() => navigate('/licencas/cloudfy')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname.startsWith('/licencas/cloudfy') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Cloud size={16} />Cloudfy</button>
              <button onClick={() => navigate('/licencas/cplug')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname.startsWith('/licencas/cplug') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Cpu size={16} />Cplug</button>
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
