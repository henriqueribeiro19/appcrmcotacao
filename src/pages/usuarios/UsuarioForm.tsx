import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { userService } from '../../services/userService';
import type { User } from '../../types';

export function UsuarioForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdicao = Boolean(id);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!isEdicao) return;
    userService.listar().then((lista) => {
      setUsuarios(lista);
      const usuario = lista.find((item) => item.uid === id);
      if (usuario) { setNome(usuario.nome); setEmail(usuario.email); setAtivo(usuario.ativo); }
    }).catch(() => setErro('Erro ao carregar usuário.'));
  }, [id, isEdicao]);

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault(); setErro(null);
    if (!nome.trim() || !email.trim() || (!isEdicao && senha.length < 6)) { setErro(isEdicao ? 'Informe o nome.' : 'Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.'); return; }
    setSalvando(true);
    try {
      if (isEdicao) await userService.atualizar(id!, { nome: nome.trim(), ativo });
      else await userService.criar({ nome: nome.trim(), email: email.trim(), senha });
      navigate('/usuarios');
    } catch (error) {
      setErro(error instanceof Error && error.message.includes('email-already-in-use') ? 'Este e-mail já está cadastrado.' : 'Erro ao salvar usuário.');
    } finally { setSalvando(false); }
  };

  const usuarioAtual = usuarios.find((item) => item.uid === id);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="sm" onClick={() => navigate('/usuarios')} className="text-slate-400 hover:text-white"><ArrowLeft size={18} /></Button><div><h1 className="text-2xl font-bold text-white">{isEdicao ? 'Editar usuário' : 'Novo usuário'}</h1><p className="mt-1 text-slate-400">Todos os usuários são administradores nesta versão.</p></div></div>
      <Card className="p-6">
        {erro && <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400"><AlertTriangle size={18} />{erro}</div>}
        <form onSubmit={salvar} className="space-y-5">
          <div><label className="mb-2 block text-sm font-medium text-slate-300">Nome</label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-300">E-mail</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={isEdicao} className={isEdicao ? 'cursor-not-allowed opacity-60' : ''} placeholder="usuario@empresa.com" /></div>
          {!isEdicao && <div><label className="mb-2 block text-sm font-medium text-slate-300">Senha inicial</label><Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" /></div>}
          {isEdicao && <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />Usuário ativo</label>}
          {isEdicao && usuarioAtual && <p className="text-xs text-slate-500">Perfil: Administrador</p>}
          <div className="flex justify-end gap-3 border-t border-slate-700/50 pt-4"><Button type="button" variant="outline" onClick={() => navigate('/usuarios')}>Cancelar</Button><Button type="submit" disabled={salvando} className="flex items-center gap-2"><Save size={18} />{salvando ? 'Salvando...' : isEdicao ? 'Salvar' : 'Cadastrar'}</Button></div>
        </form>
      </Card>
    </div>
  );
}