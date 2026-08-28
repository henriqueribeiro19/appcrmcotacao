import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { Timestamp } from 'firebase/firestore';
import { useCotacao } from '../../hooks/useCotacao';
import { useLead } from '../../hooks/useLead';
import { useCategoriaCanal } from '../../hooks/useCategoriaCanal';
import { useAdicional } from '../../hooks/useAdicional';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tag } from '../../components/ui/Tag';
import { PropostaPDF } from '../../components/pdf/PropostaPDF';
import { formatarValor, formatarData } from '../../utils/calculos';
import {
  Plus, Search, Filter, FileText, Trash2, Edit, CheckCircle,
  XCircle, Send, AlertTriangle, Printer, RotateCcw,
} from 'lucide-react';

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  rascunho: { label: 'Rascunho', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'info' },
  aprovada: { label: 'Aprovada', variant: 'success' },
  rejeitada: { label: 'Rejeitada', variant: 'danger' },
};

const produtoLabels: Record<string, { label: string; color: string }> = {
  cloudfy: { label: 'Cloudfy Premium', color: 'text-sky-400' },
  cplug: { label: 'Cplug', color: 'text-purple-400' },
};

export function CotacoesList() {
  const navigate = useNavigate();
  const { cotacoes, loading, error, fetchCotacoes, remover, atualizar } = useCotacao();
  const { leads, fetchLeads } = useLead();
  const { categorias } = useCategoriaCanal();
  const { adicionais: adicionaisDisponiveis } = useAdicional();

  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroProduto, setFiltroProduto] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [cotacaoParaExcluir, setCotacaoParaExcluir] = useState<string | null>(null);
  const [cotacaoParaAprovar, setCotacaoParaAprovar] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const cotacoesFiltradas = useMemo(() => {
    return cotacoes
      .filter((c) => (filtroStatus === 'todos' ? true : c.status === filtroStatus))
      .filter((c) => (filtroProduto === 'todos' ? true : c.tipoProduto === filtroProduto))
      .filter((c) => {
        if (!busca.trim()) return true;
        const termo = busca.toLowerCase();
        const lead = leads.find((l) => l.id === c.leadId);
        return (
          c.numero?.toLowerCase().includes(termo) ||
          lead?.razaoSocial?.toLowerCase().includes(termo) ||
          lead?.nomeFantasia?.toLowerCase().includes(termo) ||
          c.categoriaCanalNome?.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => (b.dataCriacao?.toMillis?.() || 0) - (a.dataCriacao?.toMillis?.() || 0));
  }, [cotacoes, filtroStatus, filtroProduto, busca, leads]);

  const handleExcluir = async (id: string) => {
    try { await remover(id); setCotacaoParaExcluir(null); } catch (err) { console.error(err); }
  };

  const handleEnviar = async (cotacaoId: string) => {
    setProcessando(cotacaoId);
    try {
      await atualizar(cotacaoId, { status: 'enviada' });
      await fetchCotacoes();
    } catch (err) {
      console.error('Erro ao enviar cotação:', err);
    } finally {
      setProcessando(null);
    }
  };

  const handleAbrirPDF = async (cotacaoId: string) => {
    const cotacao = cotacoes.find((item) => item.id === cotacaoId);
    const lead = cotacao ? leads.find((item) => item.id === cotacao.leadId) : undefined;
    if (!cotacao || !lead) return;

    const novaAba = window.open('', '_blank');
    if (!novaAba) return;
    novaAba.document.title = 'Gerando proposta...';
    try {
      const documento = (
        <PropostaPDF
          cotacao={cotacao}
          lead={lead}
          categoriaCanal={categorias.find((item) => item.id === cotacao.categoriaCanalId)}
          adicionaisDisponiveis={adicionaisDisponiveis}
        />
      );
      const arquivo = await pdf(documento).toBlob();
      novaAba.location.href = URL.createObjectURL(arquivo);
    } catch (err) {
      novaAba.close();
      console.error('Erro ao gerar PDF:', err);
    }
  };

  const handleAprovar = async (cotacaoId: string) => {
    setProcessando(cotacaoId);
    try {
      const cotacao = cotacoes.find((c) => c.id === cotacaoId);
      if (!cotacao) return;
      // Atualiza cotação para aprovada
      await atualizar(cotacaoId, { status: 'aprovada' });
      // Atualiza lead para fechado_ganho
      const { leadService } = await import('../../services/leadService');
      if (cotacao.leadId) {
        await leadService.update(cotacao.leadId, {
          statusFunil: 'fechado_ganho',
          arquivado: true,
          dataArquivamento: Timestamp.now(),
        });
      }
      await fetchCotacoes();
      setCotacaoParaAprovar(null);
    } catch (err) {
      console.error('Erro ao aprovar:', err);
    } finally {
      setProcessando(null);
    }
  };

  const handleRejeitar = async (cotacaoId: string) => {
    setProcessando(cotacaoId);
    try {
      await atualizar(cotacaoId, { status: 'rejeitada' });
      await fetchCotacoes();
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
    } finally {
      setProcessando(null);
    }
  };

  const handleReabrir = async (cotacaoId: string) => {
    setProcessando(cotacaoId);
    try {
      await atualizar(cotacaoId, { status: 'rascunho' });
      await fetchCotacoes();
    } catch (err) {
      console.error('Erro ao reabrir:', err);
    } finally {
      setProcessando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2">
        <AlertTriangle size={20} />Erro ao carregar cotações
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cotações</h1>
          <p className="text-slate-400 mt-1">Gerencie as cotações e propostas comerciais</p>
        </div>
        <Button onClick={() => navigate('/cotacoes/nova')} className="flex items-center gap-2 self-start">
          <Plus size={18} /> Nova Cotação
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por lead, número ou categoria..." className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
              <option value="todos">Todos status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviada">Enviada</option>
              <option value="aprovada">Aprovada</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
            <select value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
              <option value="todos">Todos produtos</option>
              <option value="cloudfy">Cloudfy</option>
              <option value="cplug">Cplug</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-700/70 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Cotações realizadas</h2>
          <span className="text-xs text-slate-500">{cotacoesFiltradas.length} registro(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Cotação</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cotacoesFiltradas.map((cotacao) => {
                const lead = leads.find((l) => l.id === cotacao.leadId);
                const status = statusLabels[cotacao.status || 'rascunho'] || statusLabels.rascunho;
                const produto = produtoLabels[cotacao.tipoProduto || 'cloudfy'] || produtoLabels.cloudfy;
                const isFinalizada = cotacao.status === 'aprovada' || cotacao.status === 'rejeitada';
                const isRascunho = cotacao.status === 'rascunho';
                return (
                  <tr key={cotacao.id} className="border-b border-slate-800 transition-colors hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-400">{cotacao.numero || '—'}</td>
                    <td className="max-w-[240px] px-4 py-4">
                      <p className="truncate font-medium text-white">{lead?.razaoSocial || cotacao.nomeLead || 'Lead não identificado'}</p>
                      <p className="truncate text-xs text-slate-500">{lead?.nomeFantasia || lead?.contatoNome || '—'}</p>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-4 text-xs font-medium ${produto.color}`}>{produto.label}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">{cotacao.categoriaCanalNome || 'Sem categoria'}</td>
                    <td className="whitespace-nowrap px-4 py-4"><Tag variant={status.variant} className="text-xs">{status.label}</Tag></td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">{formatarData(cotacao.dataCriacao)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <p className="font-semibold text-emerald-400">{formatarValor(cotacao.valorTotal || 0)}</p>
                      {cotacao.valorServicos && cotacao.valorServicos > 0 && <p className="text-xs text-slate-500">{formatarValor(cotacao.valorServicos)} serviços</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Editar cotação" onClick={() => navigate(`/cotacoes/editar/${cotacao.id}`)} className="text-slate-400 hover:text-white"><Edit size={16} /></Button>
                        {lead && cotacao.itensCplug && cotacao.itensCplug.length > 0 && <Button variant="ghost" size="sm" title="Gerar PDF" onClick={() => handleAbrirPDF(cotacao.id)} className="text-slate-400 hover:text-white"><Printer size={16} /></Button>}
                        {isRascunho && <Button variant="ghost" size="sm" title="Enviar cotação" onClick={() => handleEnviar(cotacao.id)} className="text-sky-400 hover:text-sky-300" disabled={processando === cotacao.id}><Send size={16} /></Button>}
                        {cotacao.status === 'enviada' && <><Button variant="ghost" size="sm" title="Aprovar cotação" onClick={() => setCotacaoParaAprovar(cotacao.id)} className="text-emerald-400 hover:text-emerald-300" disabled={processando === cotacao.id}><CheckCircle size={16} /></Button><Button variant="ghost" size="sm" title="Rejeitar cotação" onClick={() => handleRejeitar(cotacao.id)} className="text-red-400 hover:text-red-300" disabled={processando === cotacao.id}><XCircle size={16} /></Button></>}
                        {isFinalizada && <Button variant="ghost" size="sm" title="Reabrir cotação" onClick={() => handleReabrir(cotacao.id)} className="text-slate-400 hover:text-white" disabled={processando === cotacao.id}><RotateCcw size={16} /></Button>}
                        <Button variant="ghost" size="sm" title="Excluir cotação" onClick={() => setCotacaoParaExcluir(cotacao.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {cotacoesFiltradas.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-400">Nenhuma cotação encontrada</h3>
          <p className="text-slate-500 mt-1">Ajuste os filtros ou crie uma nova cotação.</p>
        </div>
      )}

      {/* Modal Excluir */}
      {cotacaoParaExcluir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Confirmar exclusão</h3>
            <p className="text-slate-400 mb-6">Tem certeza que deseja excluir esta cotação? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCotacaoParaExcluir(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => handleExcluir(cotacaoParaExcluir)}>Excluir</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Aprovar */}
      {cotacaoParaAprovar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Aprovar Proposta</h3>
            <p className="text-slate-400 mb-4">Ao aprovar esta proposta:</p>
            <ul className="text-sm text-slate-400 mb-6 space-y-1 list-disc list-inside">
              <li>O status da cotação será alterado para <span className="text-emerald-400">Aprovada</span></li>
              <li>O lead será movido para <span className="text-emerald-400">Fechado Ganho</span></li>
              <li>O lead será arquivado automaticamente</li>
            </ul>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCotacaoParaAprovar(null)}>Cancelar</Button>
              <Button onClick={() => handleAprovar(cotacaoParaAprovar)} disabled={processando === cotacaoParaAprovar}>
                {processando === cotacaoParaAprovar ? 'Processando...' : 'Confirmar Aprovação'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}