import { useAuth } from '@/hooks/useAuth';
import { Bell, Menu, Search, User } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { userProfile } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 max-w-md">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
        >
          <Menu size={20} />
        </button>
        <Search size={16} className="shrink-0 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar leads, cotações..."
          className="w-full min-w-0 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
