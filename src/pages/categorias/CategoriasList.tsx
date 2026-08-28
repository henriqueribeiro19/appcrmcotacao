import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoriaCanal } from '../../hooks/useCategoriaCanal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tag } from '../../components/ui/Tag';
import { Search, Plus, Pencil, Trash2, AlertTriangle, FolderOpen } from 'lucide-react';

export function CategoriasList() {
  const navigate = useNavigate();
  const { categorias, loading, error, remover } = useCategoriaCanal();
  const [busca, setBusca] = useState('');
  const [categoriaParaRemover, setCategoriaParaRemover] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const categoriasFiltradas = categorias.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleRemover = async () => {
    if (!categoriaParaRemover) return;
    setRemovendo(true);
    try { await remover(categoriaParaRemover); setCategoriaParaRemover(null); }
    finally { setRemovendo(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias de Canal</h1>
          <p className="text-slate-400 mt-1">Origem das oportunidades (leads)</p>
        </div>
        <Button onClick={() => navigate('/categorias/nova')} className="flex items-center gap-2"><Plus size={18} /> Nova Categoria</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2"><AlertTriangle size={20} />{error}</div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{busca ? 'Nenhuma categoria encontrada.' : 'Nenhuma categoria cadastrada.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-700/50 bg-slate-900/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Descrição</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700/30">
                {categoriasFiltradas.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FolderOpen size={18} className="text-emerald-400 shrink-0" />
                        <span className="font-medium text-white">{categoria.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate">{categoria.descricao || '-'}</td>
                    <td className="px-6 py-4"><Tag variant={categoria.ativo !== false ? 'success' : 'default'} className="text-xs">{categoria.ativo !== false ? 'Ativo' : 'Inativo'}</Tag></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/categorias/editar/${categoria.id}`)} className="text-slate-400 hover:text-white"><Pencil size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setCategoriaParaRemover(categoria.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={!!categoriaParaRemover} onClose={() => setCategoriaParaRemover(null)} title="Desativar categoria">
        <div className="space-y-4">
          <p className="text-slate-300">A categoria será preservada, mas deixará de ser usada em novos cadastros. Deseja continuar?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCategoriaParaRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemover} disabled={removendo} className="bg-red-600 hover:bg-red-700">{removendo ? 'Desativando...' : 'Desativar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
