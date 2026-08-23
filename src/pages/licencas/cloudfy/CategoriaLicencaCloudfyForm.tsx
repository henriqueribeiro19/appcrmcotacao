import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategoriaLicencaCloudfy } from '../../../hooks/useCategoriaLicencaCloudfy';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';

export function CategoriaLicencaCloudfyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { categorias, loading, criar, atualizar } = useCategoriaLicencaCloudfy();
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const categoria = categorias.find((item) => item.id === id);
    if (categoria) { setNome(categoria.nome); setAtivo(categoria.ativo !== false); }
  }, [categorias, id]);

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try { if (id) await atualizar(id, { nome: nome.trim(), ativo }); else await criar({ nome: nome.trim(), ativo }); navigate('/licencas/cloudfy/categorias'); }
    finally { setSalvando(false); }
  };

  if (id && loading && categorias.length === 0) return <div className="p-8 text-center text-slate-400">Carregando...</div>;
  return <div className="space-y-6 max-w-2xl mx-auto"><div className="flex items-center gap-4"><Button variant="ghost" size="sm" onClick={() => navigate('/licencas/cloudfy/categorias')}><ArrowLeft size={18} /></Button><div><h1 className="text-2xl font-bold text-white">{id ? 'Editar Categoria' : 'Nova Categoria'}</h1><p className="text-slate-400 mt-1">Categoria de licença Cloudfy</p></div></div><Card className="p-6"><form onSubmit={salvar} className="space-y-6"><div><label className="block text-sm font-medium text-slate-300 mb-2">Nome</label><Input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex: Terminais, POS PDV, TEF..." /></div><div className="flex gap-3"><Button type="button" onClick={() => setAtivo(true)} className={ativo ? '' : 'opacity-50'}>Ativa</Button><Button type="button" variant="outline" onClick={() => setAtivo(false)} className={!ativo ? 'border-red-500 text-red-400' : ''}>Inativa</Button></div><div className="flex justify-end gap-3 border-t border-slate-700/50 pt-4"><Button type="button" variant="outline" onClick={() => navigate('/licencas/cloudfy/categorias')}>Cancelar</Button><Button type="submit" disabled={salvando} className="flex items-center gap-2"><Save size={18} />{salvando ? 'Salvando...' : 'Salvar'}</Button></div></form></Card></div>;
}
