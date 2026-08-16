import { useState, useCallback } from 'react';
import { funilService } from '@/services/funilService';
import { leadService } from '@/services/leadService';
import type { Lead } from '@/types';

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

  const leadsPorStatus = useCallback(
    (status: Lead['statusFunil']) => leads.filter((l) => l.statusFunil === status),
    [leads]
  );

  return {
    leads,
    loading,
    fetchLeads,
    moverLead,
    leadsPorStatus,
  };
}
