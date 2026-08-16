import { useAuth } from '@/hooks/useAuth';
import { Bell, Search, User } from 'lucide-react';

export function TopBar() {
  const { userProfile } = useAuth();

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search size={16} className="text-slate-500" />
        <input
          type="text"
          placeholder="Buscar leads, cotações..."
          className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <User size={16} className="text-emerald-400" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">{userProfile?.nome || 'Usuário'}</p>
            <p className="text-xs text-slate-500 capitalize">{userProfile?.perfil || 'vendedor'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
