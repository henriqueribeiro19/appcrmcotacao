import { useState, useEffect, useCallback } from 'react';
import { licencaCplugService } from '../services/licencaCplugService';
import type { LicencaCplug } from '../types';

export function useLicencaCplug() {
  const [licencas, setLicencas] = useState<LicencaCplug[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLicencas = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await licencaCplugService.listar();
      setLicencas(data);
    } catch (err) {
      setError('Erro ao carregar licenças Cplug'); console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLicencas(); }, [fetchLicencas]);

  const criar = async (data: Omit<LicencaCplug, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const nova = await licencaCplugService.criar(data);
      setLicencas(prev => [...prev, nova]); return nova;
    } catch (err) { setError('Erro ao criar licença Cplug'); throw err; }
    finally { setLoading(false); }
  };

  const atualizar = async (id: string, data: Partial<LicencaCplug>) => {
    setLoading(true);
    try {
      const atualizada = await licencaCplugService.atualizar(id, data);
      setLicencas(prev => prev.map(l => l.id === id ? atualizada : l)); return atualizada;
    } catch (err) { setError('Erro ao atualizar licença Cplug'); throw err; }
    finally { setLoading(false); }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await licencaCplugService.atualizar(id, { ativo: false });
      setLicencas(prev => prev.filter(l => l.id !== id));
    } catch (err) { setError('Erro ao remover licença Cplug'); throw err; }
    finally { setLoading(false); }
  };

  return { licencas, loading, error, fetchLicencas, criar, atualizar, remover };
}
