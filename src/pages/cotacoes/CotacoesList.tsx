import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCotacao } from '../../hooks/useCotacao';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tag } from '../../components/ui/Tag';
import { Search, Plus, Eye, Trash2, AlertTriangle, FileText, Cloud, Cpu } from 'lucide-react';

export function CotacoesList() {
  const navigate = useNavigate();
  const { cotacoes, loading, error, remover } = useCotacao();
  const [busca, setBusca] = useState('');
  const [cotacaoParaRemover, setCotacaoParaRemover] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const cotacoesFiltradas = cotacoes.filter((c) =>
    c.nomeLead?.toLowerCase().includes(busca.toLowerCase()) ||
    c.numero?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleRemover = async () => {
    if (!cotacaoParaRemover) return;
    setRemovendo(true);
    try { await remover(cotacaoParaRemover); setCotacaoParaRemover(null); }
    finally { setRemovendo(false); }
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const formatarData = (data: unknown) => {
    if (!data) return 'Data não informada';
    const dataConvertida = data instanceof Date
      ? data
      : typeof data === 'object' && data !== null && 'toDate' in data && typeof data.toDate === 'function'
        ? data.toDate()
        : new Date(data as string | number);
    if (Number.isNaN(dataConvertida.getTime())) return 'Data não informada';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dataConvertida);
  };

  const getStatusVariant = (status: string) => {
    switch (status) { case 'aprovada': return 'success'; case 'rejeitada': return 'destructive'; case 'enviada': return 'warning'; default: return 'default'; }
  };
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { rascunho: 'Rascunho', enviada: 'Enviada', aprovada: 'Aprovada', rejeitada: 'Rejeitada' };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cotações</h1>
          <p className="text-slate-400 mt-1">Gerencie as propostas comerciais</p>
        </div>
        <Button onClick={() => navigate('/cotacoes/nova')} className="flex items-center gap-2"><Plus size={18} /> Nova Cotação</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por lead ou número..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />Carregando...</Card>
        ) : error ? (
          <Card className="p-8 text-center text-red-400 flex items-center justify-center gap-2"><AlertTriangle size={20} />{error}</Card>
        ) : cotacoesFiltradas.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">{busca ? 'Nenhuma cotação encontrada.' : 'Nenhuma cotação cadastrada.'}</Card>
        ) : (
          cotacoesFiltradas.map((cotacao) => (
            <Card key={cotacao.id} className="p-5 hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => navigate(`/cotacoes/${cotacao.id}`)}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <FileText size={18} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">{cotacao.numero || '—'}</span>
                    <Tag variant={getStatusVariant(cotacao.status)} className="text-xs">{getStatusLabel(cotacao.status)}</Tag>
                    <Tag variant="default" className="text-xs flex items-center gap-1">{cotacao.tipoProduto === 'cloudfy' ? <><Cloud size={10} /> Cloudfy</> : <><Cpu size={10} /> Cplug</>}</Tag>
                  </div>
                  <p className="text-white font-medium">{cotacao.nomeLead || 'Lead não informado'}</p>
                  <p className="text-slate-500 text-sm mt-1">{cotacao.categoriaCanalNome || 'Sem categoria'} · {formatarData(cotacao.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-xl font-bold text-emerald-400">{formatarValor(cotacao.valorTotal || 0)}</p>
                    {cotacao.descontoPercentual && cotacao.descontoPercentual > 0 && <p className="text-xs text-amber-400">-{cotacao.descontoPercentual}%</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/cotacoes/${cotacao.id}`); }} className="text-slate-400 hover:text-white"><Eye size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setCotacaoParaRemover(cotacao.id); }} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={!!cotacaoParaRemover} onClose={() => setCotacaoParaRemover(null)} title="Confirmar exclusão">
        <div className="space-y-4">
          <p className="text-slate-300">Tem certeza que deseja remover esta cotação?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCotacaoParaRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemover} disabled={removendo} className="bg-red-600 hover:bg-red-700">{removendo ? 'Removendo...' : 'Remover'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
