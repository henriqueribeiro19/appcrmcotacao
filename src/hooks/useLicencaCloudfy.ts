import { useState, useEffect, useCallback } from 'react';
import { licencaCloudfyService } from '../services/licencaCloudfyService';
import type { LicencaCloudfy } from '../types';

export function useLicencaCloudfy() {
  const [licencas, setLicencas] = useState<LicencaCloudfy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLicencas = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await licencaCloudfyService.listar();
      setLicencas(data);
    } catch (err) {
      setError('Erro ao carregar licenças Cloudfy'); console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLicencas(); }, [fetchLicencas]);

  const criar = async (data: Omit<LicencaCloudfy, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const nova = await licencaCloudfyService.criar(data);
      setLicencas(prev => [...prev, nova]); return nova;
    } catch (err) { setError('Erro ao criar licença Cloudfy'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<LicencaCloudfy>) => {
    setLoading(true);
    try {
      const atualizada = await licencaCloudfyService.atualizar(id, data);
      setLicencas(prev => prev.map(l => l.id === id ? atualizada : l)); return atualizada;
    } catch (err) { setError('Erro ao atualizar licença Cloudfy'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await licencaCloudfyService.atualizar(id, { ativo: false });
      setLicencas(prev => prev.filter(l => l.id !== id));
    } catch (err) { setError('Erro ao remover licença Cloudfy'); throw err; }
    finally { setLoading(false); }
  };

  return { licencas, loading, error, fetchLicencas, criar, atualizar, remover };
}
