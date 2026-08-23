import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoriaLicencaCloudfy } from '../../../hooks/useCategoriaLicencaCloudfy';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Tag } from '../../../components/ui/Tag';
import { ArrowLeft, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';

export function CategoriasLicencasCloudfy() {
  const navigate = useNavigate();
  const { categorias, loading, error, remover } = useCategoriaLicencaCloudfy();
  const [busca, setBusca] = useState('');
  const [removerId, setRemoverId] = useState<string | null>(null);
  const filtradas = categorias.filter((categoria) => categoria.nome.toLowerCase().includes(busca.toLowerCase()));

  const excluir = async () => {
    if (!removerId) return;
    await remover(removerId);
    setRemoverId(null);
  };

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate('/licencas/cloudfy')}><ArrowLeft size={18} /></Button><div><h1 className="text-2xl font-bold text-white">Categorias Cloudfy</h1><p className="text-slate-400 mt-1">Organize as licenças por tipo</p></div></div>
      <Button onClick={() => navigate('/licencas/cloudfy/categorias/nova')} className="flex items-center gap-2"><Plus size={18} /> Nova Categoria</Button>
    </div>
    <Card className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Buscar categoria..." value={busca} onChange={(event) => setBusca(event.target.value)} className="pl-10" /></div></Card>
    <Card className="overflow-hidden">{loading ? <div className="p-8 text-center text-slate-400">Carregando...</div> : error ? <div className="p-8 text-center text-red-400">{error}</div> : <div className="divide-y divide-slate-700/30">{filtradas.map((categoria) => <div key={categoria.id} className="flex items-center justify-between p-4 hover:bg-slate-800/50"><div className="flex items-center gap-3"><FolderOpen size={18} className="text-emerald-400" /><span className="text-white font-medium">{categoria.nome}</span><Tag variant={categoria.ativo !== false ? 'success' : 'default'} className="text-xs">{categoria.ativo !== false ? 'Ativa' : 'Inativa'}</Tag></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => navigate(`/licencas/cloudfy/categorias/editar/${categoria.id}`)}><Pencil size={16} /></Button><Button variant="ghost" size="sm" onClick={() => setRemoverId(categoria.id)} className="hover:text-red-400"><Trash2 size={16} /></Button></div></div>)}</div>}</Card>
    <Modal isOpen={!!removerId} onClose={() => setRemoverId(null)} title="Confirmar exclusão"><div className="space-y-4"><p className="text-slate-300">Remover esta categoria?</p><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setRemoverId(null)}>Cancelar</Button><Button variant="destructive" onClick={excluir}>Remover</Button></div></div></Modal>
  </div>;
}
