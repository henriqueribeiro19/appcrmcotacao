import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLead } from '@/hooks/useLead';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { ScoreBadge } from '@/components/ScoreBadge';
import { formatCNPJ, formatPhone, formatDate } from '@/utils/formatters';
import { Search, ArrowRight, RotateCcw, Archive, TrendingUp, TrendingDown } from 'lucide-react';

const statusLabels: Record<string, string> = {
  fechado_ganho: 'Ganho',
  fechado_perdido: 'Perdido',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  fechado_ganho: 'success',
  fechado_perdido: 'danger',
};

export function ArquivadosList() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { isAdmin } = useRole();
  const { arquivados, loading, fetchArquivados, desarquivarLead } = useLead();
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ganho' | 'perdido'>('todos');

  useEffect(() => {
    fetchArquivados();
  }, [fetchArquivados]);

  const filtered = arquivados.filter((l) => {
    const term = search.toLowerCase();
    const matchSearch =
      l.razaoSocial.toLowerCase().includes(term) ||
      l.cnpj.includes(term);
    const matchStatus =
      filtroStatus === 'todos'
        ? true
        : filtroStatus === 'ganho'
        ? l.statusFunil === 'fechado_ganho'
        : l.statusFunil === 'fechado_perdido';
    return matchSearch && matchStatus;
  });

  const ganhos = arquivados.filter((l) => l.statusFunil === 'fechado_ganho').length;
  const perdidos = arquivados.filter((l) => l.statusFunil === 'fechado_perdido').length;

  const handleDesarquivar = async (id: string) => {
    if (!confirm('Deseja reativar este lead? Ele voltará para o funil em Negociação.')) return;
    try {
      await desarquivarLead(id);
      toast.success('Lead reativado e movido para Negociação!');
      fetchArquivados();
    } catch {
      toast.error('Erro ao reativar lead');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes Arquivados</h1>
          <p className="text-slate-400 mt-1">Leads fechados (ganhos e perdidos) para análise futura</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{ganhos}</p>
            <p className="text-sm text-slate-400">Clientes Ganhos</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{perdidos}</p>
            <p className="text-sm text-slate-400">Clientes Perdidos</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-800 text-slate-400">
            <Archive size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{arquivados.length}</p>
            <p className="text-sm text-slate-400">Total Arquivados</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por razão social ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'ganho', 'perdido'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroStatus(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroStatus === f
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'ganho' ? 'Ganhos' : 'Perdidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Archive size={40} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum lead arquivado</p>
            <p className="text-sm mt-1">Leads movidos para Ganho ou Perdido no funil aparecerão aqui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-medium text-slate-400 uppercase">
                  <th className="pb-3 pr-4">Empresa</th>
                  <th className="pb-3 pr-4">Contato</th>
                  <th className="pb-3 pr-4">Resultado</th>
                  <th className="pb-3 pr-4">Arquivado em</th>
                  <th className="pb-3 pr-4">Classificação</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-medium text-white">{lead.razaoSocial}</p>
                      <p className="text-xs text-slate-500 font-mono">{formatCNPJ(lead.cnpj)}</p>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-400">
                      {lead.telefone && <p>{formatPhone(lead.telefone)}</p>}
                      {lead.email && <p className="text-xs">{lead.email}</p>}
                    </td>
                    <td className="py-4 pr-4">
                      <Tag variant={statusColors[lead.statusFunil] || 'default'}>
                        {statusLabels[lead.statusFunil] || lead.statusFunil}
                      </Tag>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-400">
                      {formatDate(lead.dataArquivamento)}
                    </td>
                    <td className="py-4 pr-4">
                      {lead.classificacao && (
                        <ScoreBadge
                          score={lead.classificacao === 'A' ? 85 : lead.classificacao === 'B' ? 70 : 45}
                          classificacao={lead.classificacao}
                        />
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="Ver detalhes"
                        >
                          <ArrowRight size={16} />
                        </button>
                        <button
                          onClick={() => handleDesarquivar(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                          title="Reativar lead"
                        >
                          <RotateCcw size={16} />
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
    </div>
  );
}
