import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { stagingService } from '@/services/stagingService';
import { leadService } from '@/services/leadService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ImportPlanilha } from '@/components/ImportPlanilha';
import { formatCNPJ, formatPhone } from '@/utils/formatters';
import {
  Filter,
  Check,
  X,
  Eye,
  Upload,
  Building2,
  Trash2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import type { Staging, Lead } from '@/types';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'text-amber-400' as const },
  aprovado: { label: 'Aprovado', color: 'text-emerald-400' as const },
  descartado: { label: 'Descartado', color: 'text-red-400' as const },
};

export function StagingList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Staging[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pendente');
  const [showImport, setShowImport] = useState(false);

  const fetchStaging = async () => {
    setLoading(true);
    try {
      const data = await stagingService.getAll(statusFilter || undefined);
      setItems(data);
    } catch (err) {
      toast.error('Erro ao carregar triagem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaging();
  }, [statusFilter]);

  const handleImport = async (data: Record<string, unknown>[]) => {
    const stagingItems = data.map((row) => ({
      fonte: 'upload_xlsx',
      bruto: row.bruto || row,
      nome: String(row.razaoSocial || row.nome || '').trim(),
      cnpj: String(row.cnpj || '').replace(/\D/g, ''),
      telefone: String(row.telefone || '').replace(/\D/g, ''),
      email: String(row.email || '').trim(),
      segmento: String(row.segmento || '').trim(),
      municipio: String(row.municipio || row.cidade || '').trim(),
      bairro: String(row.bairro || '').trim(),
    }));

    try {
      await stagingService.createMany(stagingItems);
      toast.success(`${stagingItems.length} leads importados para triagem!`);
      setStatusFilter('pendente');
      fetchStaging();
    } catch {
      toast.error('Erro ao importar para triagem');
    }
  };

  const handleApprove = async (item: Staging) => {
    if (!item.nome || item.nome.length < 3) {
      toast.error('Razão Social é obrigatória para aprovar');
      return;
    }
    if (!item.cnpj || item.cnpj.length !== 14) {
      toast.error('CNPJ válido é obrigatório para aprovar');
      return;
    }
    try {
      const leadData: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'> = {
        razaoSocial: item.nome,
        nomeFantasia: '',
        cnpj: item.cnpj,
        telefone: item.telefone || '',
        email: item.email || '',
        segmento: item.segmento || '',
        statusFunil: 'novo',
        produtoSugerido: item.produtoSugerido,
        classificacao: item.classificacao,
        canalOrigem: 'upload_xlsx',
        responsavelId: '',
        status: 'ativo',
        excluidoEm: null,
      };
      const leadId = await stagingService.approve(item.id, leadData);
      toast.success('Lead aprovado e criado!');
      navigate(`/leads/${leadId}`);
    } catch {
      toast.error('Erro ao aprovar lead');
    }
  };

  const handleReject = async (item: Staging) => {
    const motivo = prompt('Motivo do descarte:');
    if (motivo === null) return;
    try {
      await stagingService.reject(item.id, motivo);
      toast.success('Lead descartado');
      fetchStaging();
    } catch {
      toast.error('Erro ao descartar lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente?')) return;
    try {
      await stagingService.delete(id);
      toast.success('Registro excluído');
      fetchStaging();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Triagem de Leads</h1>
          <p className="text-slate-400 mt-1">Revise, aprove ou descarte leads importados</p>
        </div>
        <Button onClick={() => setShowImport(true)}>
          <Upload size={16} className="mr-2" />
          Importar Planilha
        </Button>
      </div>

      <div className="flex gap-2">
        {(['pendente', 'aprovado', 'descartado'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {statusConfig[status].label}
            {status === 'pendente' && (
              <span className="ml-2 bg-slate-800 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
                {items.filter((i) => i.status === 'pendente').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Filter size={40} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum lead na triagem</p>
            <p className="text-sm mt-1">Importe uma planilha para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-medium text-slate-400 uppercase">
                  <th className="pb-3 pr-4">Empresa</th>
                  <th className="pb-3 pr-4">Contato</th>
                  <th className="pb-3 pr-4">Localização</th>
                  <th className="pb-3 pr-4">Segmento</th>
                  <th className="pb-3 pr-4">Score</th>
                  <th className="pb-3 pr-4">Produto</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 pr-4">
                      <div>
                        <p className="text-sm font-medium text-white">{item.nome || '-'}</p>
                        {item.cnpj && (
                          <p className="text-xs text-slate-500 font-mono">{formatCNPJ(item.cnpj)}</p>
                        )}
                        {(!item.nome || item.nome.length < 3 || !item.cnpj || item.cnpj.length !== 14) && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-1">
                            <AlertTriangle size={10} /> Dados incompletos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="space-y-0.5 text-sm">
                        {item.telefone && (
                          <p className="text-slate-400">{formatPhone(item.telefone)}</p>
                        )}
                        {item.email && (
                          <p className="text-slate-400 text-xs truncate max-w-[150px]">{item.email}</p>
                        )}
                        {!item.telefone && !item.email && <span className="text-slate-600">-</span>}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-sm">
                        <p className="text-slate-300">{item.municipio || '-'}</p>
                        {item.bairro && <p className="text-slate-500 text-xs">{item.bairro}</p>}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-sm text-slate-300">{item.segmento || '-'}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <ScoreBadge score={item.score} classificacao={item.classificacao} />
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-sm text-slate-300 capitalize">{item.produtoSugerido}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`text-sm font-medium ${statusConfig[item.status as keyof typeof statusConfig]?.color || 'text-slate-400'}`}>
                        {statusConfig[item.status as keyof typeof statusConfig]?.label || item.status}
                      </span>
                      {item.motivoDescarte && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.motivoDescarte}</p>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => handleApprove(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                              title="Aprovar"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Descartar"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {item.leadId && (
                          <button
                            onClick={() => navigate(`/leads/${item.leadId}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                            title="Ver lead"
                          >
                            <ArrowRight size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ImportPlanilha
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  );
}
