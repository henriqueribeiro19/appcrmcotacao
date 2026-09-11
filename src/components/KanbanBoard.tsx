import { useEffect, useState } from 'react';
import { useFunil } from '@/hooks/useFunil';
import { KanbanColumn } from './KanbanColumn';
import { toast } from 'react-toastify';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { funilService } from '@/services/funilService';
import type { ProdutoContratado } from '@/types';

const colunas = [
  { status: 'novo' as const, label: 'Novo', color: 'bg-blue-500' },
  { status: 'contato' as const, label: 'Contato', color: 'bg-slate-400' },
  { status: 'proposta' as const, label: 'Proposta', color: 'bg-amber-500' },
  { status: 'negociacao' as const, label: 'Negociação', color: 'bg-purple-500' },
  { status: 'fechado_ganho' as const, label: 'Ganho', color: 'bg-emerald-500' },
  { status: 'fechado_perdido' as const, label: 'Perdido', color: 'bg-red-500' },
];

const motivosPerda = [
  'Não atende o perfil',
  'Não respondeu o contato',
  'Preço muito alto',
  'Fechou com o concorrente',
  'Não tem interesse',
  'Outro',
];

const produtosContratados: Array<{ value: ProdutoContratado; label: string; description: string }> = [
  { value: 'cloudfy', label: 'Cloudfy', description: 'Sistema de gestão' },
  { value: 'cplug', label: 'Cplug', description: 'Plataforma de delivery' },
];

export function KanbanBoard() {
  const { loading, fetchLeads, moverLead, removerLead, leadsPorStatus } = useFunil();
  const { user, userProfile } = useAuth();
  const [leadPerdidoId, setLeadPerdidoId] = useState<string | null>(null);
  const [leadGanhoId, setLeadGanhoId] = useState<string | null>(null);
  const [produtoContratado, setProdutoContratado] = useState<ProdutoContratado>('cloudfy');
  const [motivoPerda, setMotivoPerda] = useState('');
  const [observacaoPerda, setObservacaoPerda] = useState('');
  const [arquivando, setArquivando] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDrop = async (leadId: string, novoStatus: typeof colunas[number]['status']) => {
    if (novoStatus === 'fechado_ganho') {
      setLeadGanhoId(leadId);
      setProdutoContratado('cloudfy');
      return;
    }

    if (novoStatus === 'fechado_perdido') {
      setLeadPerdidoId(leadId);
      setMotivoPerda('');
      setObservacaoPerda('');
      return;
    }

    try {
      await moverLead(leadId, novoStatus);

      toast.success(`Lead movido para ${colunas.find(c => c.status === novoStatus)?.label}`);
    } catch {
      toast.error('Erro ao mover lead');
    }
  };

  const handleCancelarPerda = () => {
    if (arquivando) return;
    setLeadPerdidoId(null);
    setMotivoPerda('');
    setObservacaoPerda('');
  };

  const handleCancelarGanho = () => {
    if (arquivando) return;
    setLeadGanhoId(null);
    setProdutoContratado('cloudfy');
  };

  const handleConfirmarGanho = async () => {
    if (!leadGanhoId) return;

    setArquivando(true);
    try {
      await funilService.arquivarLeadGanho(leadGanhoId, produtoContratado);
      removerLead(leadGanhoId);
      toast.success('Lead convertido em cliente com sucesso!');
      setLeadGanhoId(null);
    } catch (error) {
      console.error('Erro ao converter lead em cliente:', error);
      toast.error('Erro ao converter lead em cliente');
    } finally {
      setArquivando(false);
    }
  };

  const handleArquivarPerdido = async () => {
    if (!leadPerdidoId || !motivoPerda || !observacaoPerda.trim() || !user) return;

    setArquivando(true);
    try {
      await funilService.arquivarLeadPerdido(
        leadPerdidoId,
        motivoPerda,
        observacaoPerda.trim(),
        user.uid,
        userProfile?.nome || user.displayName || user.email || 'Usuário',
      );
      removerLead(leadPerdidoId);
      toast.info('Lead arquivado como perdido. Acesse em Clientes > Perdidos.');
      setLeadPerdidoId(null);
      setMotivoPerda('');
      setObservacaoPerda('');
    } catch (error) {
      console.error('Erro ao arquivar lead como perdido:', error);
      toast.error('Erro ao arquivar lead como perdido');
    } finally {
      setArquivando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-180px)]">
        {colunas.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            leads={leadsPorStatus(col.status)}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <Modal
        isOpen={!!leadPerdidoId}
        onClose={handleCancelarPerda}
        title="Arquivar lead como perdido"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Informe o motivo da perda e uma observação para registrar no histórico do lead.
          </p>
          <div>
            <label htmlFor="motivo-perda" className="block text-sm font-medium text-slate-300 mb-1.5">
              Motivo da perda <span className="text-red-400">*</span>
            </label>
            <select
              id="motivo-perda"
              value={motivoPerda}
              onChange={(event) => setMotivoPerda(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Selecione um motivo</option>
              {motivosPerda.map((motivo) => (
                <option key={motivo} value={motivo}>{motivo}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="observacao-perda" className="block text-sm font-medium text-slate-300 mb-1.5">
              Observação <span className="text-red-400">*</span>
            </label>
            <textarea
              id="observacao-perda"
              value={observacaoPerda}
              onChange={(event) => setObservacaoPerda(event.target.value)}
              rows={4}
              placeholder="Descreva o contexto da perda"
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCancelarPerda} disabled={arquivando}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleArquivarPerdido}
              isLoading={arquivando}
              disabled={!motivoPerda || !observacaoPerda.trim() || !user}
            >
              Arquivar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!leadGanhoId}
        onClose={handleCancelarGanho}
        title="Converter em Cliente"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-400">Selecione o produto contratado.</p>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Produto Contratado</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {produtosContratados.map((produto) => (
                <button
                  key={produto.value}
                  type="button"
                  onClick={() => setProdutoContratado(produto.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${produtoContratado === produto.value
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                    }`}
                >
                  <span className={`block text-sm font-medium ${produtoContratado === produto.value ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {produto.label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{produto.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={handleCancelarGanho} disabled={arquivando}>Cancelar</Button>
            <Button onClick={handleConfirmarGanho} isLoading={arquivando}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
