import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdicional } from '../../hooks/useAdicional';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tag } from '../../components/ui/Tag';
import { formatarValor } from '../../utils/calculos';
import {
  Plus, Search, Edit, Trash2, AlertTriangle, CheckSquare, Hash,
  Wrench, Loader2,
} from 'lucide-react';

export function AdicionaisList() {
  const navigate = useNavigate();
  const { adicionais, loading, error, remover } = useAdicional();
  const [busca, setBusca] = useState('');
  const [itemParaExcluir, setItemParaExcluir] = useState<string | null>(null);

  const adicionaisFiltrados = adicionais
    .filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()) || (a.descricao || '').toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const handleExcluir = async (id: string) => {
    try { await remover(id); setItemParaExcluir(null); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2">
        <AlertTriangle size={20} />Erro ao carregar serviços
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench size={24} className="text-emerald-400" />Serviços / Adicionais
          </h1>
          <p className="text-slate-400 mt-1">Gerencie os serviços adicionais que aparecem nas propostas</p>
        </div>
        <Button onClick={() => navigate('/adicionais/novo')} className="flex items-center gap-2 self-start">
          <Plus size={18} /> Novo Serviço
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar serviço..." className="pl-10" />
        </div>
      </Card>

      <div className="grid gap-3">
        {adicionaisFiltrados.map((adicional) => (
          <Card key={adicional.id} className="p-4 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{adicional.nome}</h3>
                  {adicional.ativo !== false ? (
                    <Tag variant="success" className="text-xs">Ativo</Tag>
                  ) : (
                    <Tag variant="danger" className="text-xs">Inativo</Tag>
                  )}
                  {adicional.tipo === 'quantificavel' ? (
                    <Tag variant="info" className="text-xs flex items-center gap-0.5"><Hash size={10} /> Quantificável</Tag>
                  ) : (
                    <Tag variant="warning" className="text-xs flex items-center gap-0.5"><CheckSquare size={10} /> Único</Tag>
                  )}
                </div>
                {adicional.descricao && <p className="text-sm text-slate-400">{adicional.descricao}</p>}
                <p className="text-sm text-emerald-400 font-medium mt-1">{formatarValor(adicional.valor)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/adicionais/editar/${adicional.id}`)} className="text-slate-400 hover:text-white">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setItemParaExcluir(adicional.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {adicionaisFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Wrench size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-400">Nenhum serviço encontrado</h3>
          <p className="text-slate-500 mt-1">Cadastre serviços para incluir nas propostas.</p>
        </div>
      )}

      {itemParaExcluir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Desativar serviço</h3>
            <p className="text-slate-400 mb-6">O serviço deixará de aparecer em novas cotações, mas será preservado no histórico. Deseja continuar?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setItemParaExcluir(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => handleExcluir(itemParaExcluir)}>Excluir</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}