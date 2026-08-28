import { useState, useEffect, useCallback } from 'react';
import { categoriaLicencaCloudfyService } from '../services/categoriaLicencaCloudfyService';
import type { CategoriaLicencaCloudfy } from '../types';

export function useCategoriaLicencaCloudfy() {
  const [categorias, setCategorias] = useState<CategoriaLicencaCloudfy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCategorias(await categoriaLicencaCloudfyService.listar()); }
    catch (err) { setError('Erro ao carregar categorias de licenças'); console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  const criar = async (data: Omit<CategoriaLicencaCloudfy, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try { const nova = await categoriaLicencaCloudfyService.criar(data); setCategorias(prev => [...prev, nova]); return nova; }
    catch (err) { setError('Erro ao criar categoria'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<CategoriaLicencaCloudfy>) => {
    setLoading(true);
    try { const atualizada = await categoriaLicencaCloudfyService.atualizar(id, data); setCategorias(prev => prev.map(c => c.id === id ? atualizada : c)); return atualizada; }
    catch (err) { setError('Erro ao atualizar categoria'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try { await categoriaLicencaCloudfyService.atualizar(id, { ativo: false }); setCategorias(prev => prev.filter(c => c.id !== id)); }
    catch (err) { setError('Erro ao remover categoria'); throw err; }
    finally { setLoading(false); }
  };

  return { categorias, loading, error, criar, atualizar, remover };
}