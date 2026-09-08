import { useCallback, useEffect, useState } from 'react';
import { clienteLicencaCloudfyService } from '../services/clienteLicencaCloudfyService';
import type { ClienteLicencaCloudfy } from '../types';

export function useClienteLicencaCloudfy() {
  const [licencasAtivas, setLicencasAtivas] = useState<ClienteLicencaCloudfy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLicencasAtivas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteLicencaCloudfyService.listar();
      setLicencasAtivas(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar licenças ativas de clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicencasAtivas();
  }, [fetchLicencasAtivas]);

  const criar = async (data: Omit<ClienteLicencaCloudfy, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const nova = await clienteLicencaCloudfyService.criar(data);
      setLicencasAtivas((prev) => [nova, ...prev]);
      return nova;
    } catch (err) {
      setError('Erro ao criar licença ativa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizar = async (id: string, data: Partial<ClienteLicencaCloudfy>) => {
    setLoading(true);
    try {
      const atualizada = await clienteLicencaCloudfyService.atualizar(id, data);
      setLicencasAtivas((prev) => prev.map((item) => (item.id === id ? atualizada : item)));
      return atualizada;
    } catch (err) {
      setError('Erro ao atualizar licença ativa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remover = async (id: string) => {
    setLoading(true);
    try {
      await clienteLicencaCloudfyService.remover(id);
      setLicencasAtivas((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Erro ao remover licença ativa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    licencasAtivas,
    loading,
    error,
    fetchLicencasAtivas,
    criar,
    atualizar,
    remover,
  };
}
