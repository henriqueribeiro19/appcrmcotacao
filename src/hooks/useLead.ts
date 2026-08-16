import { useState, useCallback } from 'react';
import { leadService } from '@/services/leadService';
import type { Lead, Interacao } from '@/types';

export function useLead() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [arquivados, setArquivados] = useState<Lead[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async (vendedorId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = vendedorId
        ? await leadService.getLeadsByVendedor(vendedorId)
        : await leadService.getAllActive();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArquivados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadService.getArquivados();
      setArquivados(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar arquivados');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLead = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadService.getById(id);
      setLead(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar lead');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (data: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await leadService.create(data);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
    setLoading(true);
    setError(null);
    try {
      await leadService.update(id, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await leadService.softDelete(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addInteracao = useCallback(async (leadId: string, interacao: Omit<Interacao, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const novaInteracao = await leadService.addInteracao(leadId, interacao);
      return novaInteracao;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar interação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const arquivarLead = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await leadService.updateStatusFunil(id, 'fechado_ganho');
      setLeads((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao arquivar lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const desarquivarLead = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await leadService.desarquivar(id);
      setArquivados((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desarquivar lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    leads,
    arquivados,
    lead,
    loading,
    error,
    fetchLeads,
    fetchArquivados,
    fetchLead,
    createLead,
    updateLead,
    deleteLead,
    addInteracao,
    arquivarLead,
    desarquivarLead,
  };
}
