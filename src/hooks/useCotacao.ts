import { useState, useEffect, useCallback } from 'react';
import { cotacaoService } from '../services/cotacaoService';
import type { Cotacao, CotacaoItemCplug } from '../types';

export function useCotacao() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCotacoes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await cotacaoService.listar();
      setCotacoes(data);
    } catch (err) {
      setError('Erro ao carregar cotações'); console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCotacoes(); }, [fetchCotacoes]);

  const fetchCotacoesPorLead = useCallback(async (leadId: string) => {
    setLoading(true); setError(null);
    try {
      const data = await cotacaoService.listarPorLead(leadId);
      return data;
    } catch (err) {
      setError('Erro ao carregar cotações do lead'); throw err;
    } finally { setLoading(false); }
  }, []);

  const criar = async (data: Omit<Cotacao, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const nova = await cotacaoService.criar(data);
      setCotacoes(prev => [...prev, nova]); return nova;
    } catch (err) { setError('Erro ao criar cotação'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<Cotacao>) => {
    setLoading(true);
    try {
      const atualizada = await cotacaoService.atualizar(id, data);
      setCotacoes(prev => prev.map(c => c.id === id ? atualizada : c)); return atualizada;
    } catch (err) { setError('Erro ao atualizar cotação'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await cotacaoService.remover(id);
      setCotacoes(prev => prev.filter(c => c.id !== id));
    } catch (err) { setError('Erro ao remover cotação'); throw err; }
    finally { setLoading(false); }
  };

  const calcularTotal = (itens: CotacaoItemCplug[]) => {
    return itens.reduce((total, item) => {
      const valorUnitario = item.valorUnitario || 0;
      const quantidade = item.quantidade || 1;
      return total + (valorUnitario * quantidade);
    }, 0);
  };

  return {
    cotacoes, loading, error, fetchCotacoes, fetchCotacoesPorLead,
    criar, atualizar, remover, calcularTotal,
  };
}
