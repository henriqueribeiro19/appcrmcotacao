import { useEffect } from 'react';
import { useFunil } from '@/hooks/useFunil';
import { KanbanColumn } from './KanbanColumn';
import { toast } from 'react-toastify';

const colunas = [
  { status: 'novo' as const, label: 'Novo', color: 'bg-blue-500' },
  { status: 'contato' as const, label: 'Contato', color: 'bg-slate-400' },
  { status: 'proposta' as const, label: 'Proposta', color: 'bg-amber-500' },
  { status: 'negociacao' as const, label: 'Negociação', color: 'bg-purple-500' },
  { status: 'fechado_ganho' as const, label: 'Ganho', color: 'bg-emerald-500' },
  { status: 'fechado_perdido' as const, label: 'Perdido', color: 'bg-red-500' },
];

export function KanbanBoard() {
  const { loading, fetchLeads, moverLead, leadsPorStatus } = useFunil();

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDrop = async (leadId: string, novoStatus: typeof colunas[number]['status']) => {
    try {
      await moverLead(leadId, novoStatus);

      if (novoStatus === 'fechado_ganho') {
        toast.success('🎉 Lead fechado com sucesso! Arquivado em Clientes.');
      } else if (novoStatus === 'fechado_perdido') {
        toast.info('Lead arquivado como perdido. Acesse em Clientes > Perdidos.');
      } else {
        toast.success(`Lead movido para ${colunas.find(c => c.status === novoStatus)?.label}`);
      }
    } catch {
      toast.error('Erro ao mover lead');
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
  );
}
