import { useState, useCallback } from 'react';
import { funilService } from '@/services/funilService';
import { leadService } from '@/services/leadService';
import type { Lead } from '@/types';

function timestampParaMillis(valor: unknown): number {
  if (valor && typeof valor === 'object' && 'toMillis' in valor && typeof valor.toMillis === 'function') {
    return valor.toMillis();
  }
  if (valor instanceof Date) {
    return valor.getTime();
  }
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string') {
    return new Date(valor).getTime();
  }
  return 0;
}

export function useFunil() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadService.getAllActive();
      setLeads(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const moverLead = useCallback(async (leadId: string, novoStatus: Lead['statusFunil']) => {
    await funilService.moverLead(leadId, novoStatus);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, statusFunil: novoStatus } : l))
    );
  }, []);

  const removerLead = useCallback((leadId: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
  }, []);

  const leadsPorStatus = useCallback(
    (status: Lead['statusFunil']) => leads
      .filter((lead) => lead.statusFunil === status)
      .sort((a, b) => {
        return timestampParaMillis(b.atualizadoEm) - timestampParaMillis(a.atualizadoEm);
      }),
    [leads]
  );

  return {
    leads,
    loading,
    fetchLeads,
    moverLead,
    removerLead,
    leadsPorStatus,
  };
}
