import { useState, useEffect, useCallback } from 'react';
import { pacoteCplugService } from '../services/pacoteCplugService';
import type { PacoteCplug } from '../types';

export function usePacoteCplug() {
  const [pacotes, setPacotes] = useState<PacoteCplug[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacotes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await pacoteCplugService.listar();
      setPacotes(data);
    } catch (err) {
      setError('Erro ao carregar pacotes Cplug'); console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPacotes(); }, [fetchPacotes]);

  const criar = async (data: Omit<PacoteCplug, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const novo = await pacoteCplugService.criar(data);
      setPacotes(prev => [...prev, novo]); return novo;
    } catch (err) { setError('Erro ao criar pacote Cplug'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<PacoteCplug>) => {
    setLoading(true);
    try {
      const atualizado = await pacoteCplugService.atualizar(id, data);
      setPacotes(prev => prev.map(p => p.id === id ? atualizado : p)); return atualizado;
    } catch (err) { setError('Erro ao atualizar pacote Cplug'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await pacoteCplugService.atualizar(id, { ativo: false });
      setPacotes(prev => prev.filter(p => p.id !== id));
    } catch (err) { setError('Erro ao remover pacote Cplug'); throw err; }
    finally { setLoading(false); }
  };

  return { pacotes, loading, error, fetchPacotes, criar, atualizar, remover };
}
