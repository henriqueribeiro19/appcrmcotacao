import { useState, useEffect, useCallback } from 'react';
import { categoriaCanalService } from '../services/categoriaCanalService';
import type { CategoriaCanal } from '../types';

export function useCategoriaCanal() {
  const [categorias, setCategorias] = useState<CategoriaCanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await categoriaCanalService.listar();
      setCategorias(data);
    } catch (err) {
      setError('Erro ao carregar categorias'); console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  const criar = async (data: Omit<CategoriaCanal, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const nova = await categoriaCanalService.criar(data);
      setCategorias(prev => [...prev, nova]); return nova;
    } catch (err) { setError('Erro ao criar categoria'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<CategoriaCanal>) => {
    setLoading(true);
    try {
      const atualizada = await categoriaCanalService.atualizar(id, data);
      setCategorias(prev => prev.map(c => c.id === id ? atualizada : c)); return atualizada;
    } catch (err) { setError('Erro ao atualizar categoria'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await categoriaCanalService.atualizar(id, { ativo: false });
      setCategorias(prev => prev.filter(c => c.id !== id));
    } catch (err) { setError('Erro ao remover categoria'); throw err; }
    finally { setLoading(false); }
  };

  return { categorias, loading, error, fetchCategorias, criar, atualizar, remover };
}
