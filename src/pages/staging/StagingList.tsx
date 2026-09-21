import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLead } from '@/hooks/useLead';
import { stagingService } from '@/services/stagingService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ImportPlanilha } from '@/components/ImportPlanilha';
import { formatCNPJ, formatPhone } from '@/utils/formatters';
import {
  Filter,
  Check,
  X,
  Upload,
  Trash2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { Staging, Lead, RegimeTributario } from '@/types';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'text-amber-400' as const },
  aprovado: { label: 'Aprovado', color: 'text-emerald-400' as const },
  descartado: { label: 'Descartado', color: 'text-red-400' as const },
};

const PAGE_SIZE = 50;

export function StagingList() {
  const navigate = useNavigate();
  const { leads, fetchLeads } = useLead();
  const [items, setItems] = useState<Staging[]>([]);
  const [totaisPorStatus, setTotaisPorStatus] = useState({ pendente: 0, aprovado: 0, descartado: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pendente' | 'aprovado' | 'descartado'>('pendente');
  const [showImport, setShowImport] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const carregarTotaisPorStatus = async () => {
    try {
      const [pendentes, aprovados, descartados] = await Promise.all([
        stagingService.getAll('pendente'),
        stagingService.getAll('aprovado'),
        stagingService.getAll('descartado'),
      ]);

      setTotaisPorStatus({
        pendente: pendentes.length,
        aprovado: aprovados.length,
        descartado: descartados.length,
      });
    } catch {
      setTotaisPorStatus({ pendente: 0, aprovado: 0, descartado: 0 });
    }
  };

  const fetchStaging = async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setItems([]);

    try {
      const data = await stagingService.getAll(statusFilter || undefined);
      if (currentRequestId !== requestIdRef.current) return;
      setItems(data);
      setPaginaAtual(1);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      toast.error('Erro ao carregar triagem');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStaging();
    carregarTotaisPorStatus();
  }, [statusFilter]);

  const totalPaginas = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const itensPagina = items.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  const handleImport = async (data: Record<string, unknown>[]) => {
    const stagingItems = data.map((row) => ({
      fonte: 'upload_xlsx',
      bruto: (row.bruto && typeof row.bruto === 'object' ? row.bruto : row) as Record<string, unknown>,
      nome: String(row.razaoSocial || row.nome || '').trim(),
      nomeFantasia: String(row.nomeFantasia || '').trim(),
      cnpj: String(row.cnpj || '').replace(/\D/g, ''),
      telefone: String(row.telefone || '').replace(/\D/g, ''),
      email: String(row.email || '').trim(),
      inscricaoEstadual: String(row.inscricaoEstadual || '').trim(),
      regimeTributario: String(row.regimeTributario || '').trim() as RegimeTributario || undefined,
      segmento: String(row.segmento || '').trim(),
      socios: String(row.socios || '').trim(),
      cep: String(row.cep || '').replace(/\D/g, ''),
      uf: String(row.uf || '').trim().toUpperCase(),
      logradouro: String(row.logradouro || '').trim(),
      numero: String(row.numero || '').trim(),
      complemento: String(row.complemento || '').trim(),
      municipio: String(row.municipio || row.cidade || '').trim(),
      bairro: String(row.bairro || '').trim(),
      porte: String(row.porte || '').trim().toUpperCase() as Lead['porte'],
      capitalSocial: typeof row.capitalSocial === 'number' ? row.capitalSocial : undefined,
    }));

    const jaExistemNaBase = new Set<string>();
    const repetidosNoArquivo = new Set<string>();

    for (const item of stagingItems) {
      if (!item.cnpj || item.cnpj.length !== 14) continue;

      const cnpjJaBase = leads.some((lead) => {
        if (lead.status === 'inativo') return false;
        return (lead.cnpj || '').replace(/\D/g, '') === item.cnpj;
      });

      if (cnpjJaBase) {
        jaExistemNaBase.add(item.cnpj);
        continue;
      }

      const ocorrencias = stagingItems.filter((registro) => registro.cnpj === item.cnpj).length;
      if (ocorrencias > 1) {
        repetidosNoArquivo.add(item.cnpj);
      }
    }

    const todosDuplicados = [...new Set([...jaExistemNaBase, ...repetidosNoArquivo])];
    if (todosDuplicados.length > 0) {
      const lista = todosDuplicados.slice(0, 5).map((cnpj) => formatCNPJ(cnpj)).join(', ');
      toast.error(`Não foi possível importar. CNPJ(s) duplicados encontrados: ${lista}${todosDuplicados.length > 5 ? '...' : ''}`);
      return;
    }

    try {
      await stagingService.createMany(stagingItems);
      toast.success(`${stagingItems.length} leads importados para triagem!`);
      setStatusFilter('pendente');
      await Promise.all([fetchStaging(), carregarTotaisPorStatus()]);
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
        nomeFantasia: item.nomeFantasia || '',
        cnpj: item.cnpj,
        telefone: item.telefone || '',
        email: item.email || '',
        inscricaoEstadual: item.inscricaoEstadual || '',
        regimeTributario: item.regimeTributario,
        segmento: item.segmento || '',
        socios: item.socios || '',
        cep: item.cep || '',
        uf: item.uf || '',
        logradouro: item.logradouro || '',
        numero: item.numero || '',
        complemento: item.complemento || '',
        municipio: item.municipio || '',
        bairro: item.bairro || '',
        porte: item.porte || '',
        capitalSocial: item.capitalSocial,
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
      await Promise.all([fetchStaging(), carregarTotaisPorStatus()]);
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
      await Promise.all([fetchStaging(), carregarTotaisPorStatus()]);
    } catch {
      toast.error('Erro ao descartar lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente?')) return;
    try {
      await stagingService.delete(id);
      toast.success('Registro excluído');
      await Promise.all([fetchStaging(), carregarTotaisPorStatus()]);
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!confirm('Deseja reativar este lead? Ele voltará para a triagem pendente.')) return;
    try {
      await stagingService.reactivate(id);
      toast.success('Lead reativado e movido para pendentes');
      await Promise.all([fetchStaging(), carregarTotaisPorStatus()]);
    } catch {
      toast.error('Erro ao reativar lead');
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
            <span className="ml-2 bg-slate-800 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
              {totaisPorStatus[status] ?? 0}
            </span>
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
            <div className="flex items-center justify-between pb-3 text-xs text-slate-400">
              <span>Página {paginaAtual} de {totalPaginas}</span>
              <span>{items.length} registros no filtro atual</span>
            </div>
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
                {itensPagina.map((item) => (
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
                        {item.status === 'descartado' && (
                          <button
                            onClick={() => handleReactivate(item.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Reativar"
                          >
                            <RotateCcw size={16} />
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

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-sm text-slate-300">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                  disabled={paginaAtual === 1}
                >
                  Anterior
                </Button>

                <span>
                  Página {paginaAtual} / {totalPaginas}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                </Button>
              </div>
            )}
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
