import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Plus, Edit, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { userService } from '../../services/userService';
import type { User } from '../../types';

export function UsuariosList() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    userService.listar().then(setUsuarios).catch(() => setErro('Erro ao carregar usuários.')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  if (erro) return <div className="flex items-center justify-center gap-2 p-8 text-red-400"><AlertTriangle size={20} />{erro}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><UserCog size={24} className="text-emerald-400" />Usuários</h1>
          <p className="mt-1 text-slate-400">Gerencie os usuários que acessam o CRM.</p>
        </div>
        <Button onClick={() => navigate('/usuarios/novo')} className="flex items-center gap-2 self-start"><Plus size={18} />Novo usuário</Button>
      </div>
      <div className="grid gap-3">
        {usuarios.map((usuario) => (
          <Card key={usuario.uid} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{usuario.nome}</p>
                <p className="text-sm text-slate-400">{usuario.email}</p>
                <span className={`mt-2 inline-block text-xs ${usuario.ativo ? 'text-emerald-400' : 'text-red-400'}`}>{usuario.ativo ? 'Ativo' : 'Inativo'} · Administrador</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/usuarios/editar/${usuario.uid}`)} className="text-slate-400 hover:text-white"><Edit size={16} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}