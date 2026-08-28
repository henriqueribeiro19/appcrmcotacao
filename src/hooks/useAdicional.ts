import { useState, useEffect, useCallback } from 'react';
import { adicionalService } from '../services/adicionalService';
import type { Adicional } from '../types';

export function useAdicional() {
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdicionais = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adicionalService.listar();
      setAdicionais(data.filter((a) => a.ativo !== false));
    } catch (err) {
      setError('Erro ao carregar adicionais'); console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdicionais(); }, [fetchAdicionais]);

  const criar = async (data: Omit<Adicional, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const novo = await adicionalService.criar(data);
      setAdicionais(prev => [...prev, novo]); return novo;
    } catch (err) { setError('Erro ao criar adicional'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<Adicional>) => {
    setLoading(true);
    try {
      const atualizado = await adicionalService.atualizar(id, data);
      setAdicionais(prev => prev.map(a => a.id === id ? atualizado : a)); return atualizado;
    } catch (err) { setError('Erro ao atualizar adicional'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await adicionalService.atualizar(id, { ativo: false });
      setAdicionais(prev => prev.filter(a => a.id !== id));
    } catch (err) { setError('Erro ao remover adicional'); throw err; }
    finally { setLoading(false); }
  };

  return { adicionais, loading, error, fetchAdicionais, criar, atualizar, remover };
}