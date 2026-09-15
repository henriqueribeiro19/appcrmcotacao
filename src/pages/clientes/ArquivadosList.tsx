import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLead } from '@/hooks/useLead';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { formatCNPJ, formatPhone, formatDate } from '@/utils/formatters';
import { Search, ArrowRight, RotateCcw, Archive, TrendingDown, CalendarDays, Cloud, Cpu, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const statusLabels: Record<string, string> = {
  fechado_ganho: 'Ganho',
  fechado_perdido: 'Perdido',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  fechado_ganho: 'success',
  fechado_perdido: 'danger',
};

function timestampToDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return value instanceof Date ? value : null;
}

export function ArquivadosList() {
  const navigate = useNavigate();
  const { arquivados, loading, fetchArquivados, desarquivarLead } = useLead();
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ganho' | 'perdido'>('ganho');
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    fetchArquivados();
  }, [fetchArquivados]);

  const filtered = arquivados.filter((l) => {
    const term = search.toLowerCase();
    const matchSearch = [l.razaoSocial, l.cnpj, l.segmento, l.email, l.observacoes]
      .some((value) => value?.toLowerCase().includes(term));
    const matchStatus =
      filtroStatus === 'todos'
        ? true
        : filtroStatus === 'ganho'
        ? l.statusFunil === 'fechado_ganho'
        : l.statusFunil === 'fechado_perdido';
    return matchSearch && matchStatus;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / registrosPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginaLeads = filtered.slice((paginaAtual - 1) * registrosPorPagina, paginaAtual * registrosPorPagina);

  const alterarBusca = (value: string) => {
    setSearch(value);
    setPagina(1);
  };

  const alterarFiltro = (value: 'todos' | 'ganho' | 'perdido') => {
    setFiltroStatus(value);
    setPagina(1);
  };

  const ganhos = arquivados.filter((l) => l.statusFunil === 'fechado_ganho').length;
  const perdidos = arquivados.filter((l) => l.statusFunil === 'fechado_perdido').length;
  const cloudfy = arquivados.filter((l) => l.statusFunil === 'fechado_ganho' && l.produtoContratado === 'cloudfy').length;
  const cplug = arquivados.filter((l) => l.statusFunil === 'fechado_ganho' && l.produtoContratado === 'cplug').length;
  const agora = new Date();
  const novosNoMes = arquivados.filter((lead) => {
    const data = timestampToDate(lead.dataContratacao || lead.dataArquivamento);
    return lead.statusFunil === 'fechado_ganho' && data !== null &&
      data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
  }).length;

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
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 mt-1">Clientes convertidos e leads perdidos para análise futura</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{ganhos}</p>
            <p className="text-sm text-slate-400">Clientes ativos</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400">
            <Cloud size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{cloudfy}</p>
            <p className="text-sm text-slate-400">Cloudfy</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-cyan-500/10 p-3 text-cyan-400">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{cplug}</p>
            <p className="text-sm text-slate-400">Cplug</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{novosNoMes}</p>
            <p className="text-sm text-slate-400">Este mês</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-red-500/10 p-3 text-red-400">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{perdidos}</p>
            <p className="text-sm text-slate-400">Clientes perdidos</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por empresa, segmento, CNPJ ou observação..."
            value={search}
            onChange={(e) => alterarBusca(e.target.value)}
            className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'ganho', 'perdido'] as const).map((f) => (
            <button
              key={f}
              onClick={() => alterarFiltro(f)}
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
                  <th className="pb-3 pr-4">Segmento</th>
                  <th className="pb-3 pr-4">Contato</th>
                  <th className="pb-3 pr-4">Resultado</th>
                  <th className="pb-3 pr-4">Arquivado em</th>
                  <th className="pb-3 pr-4">Observação</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginaLeads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-medium text-white">{lead.razaoSocial}</p>
                      <p className="text-xs text-slate-500 font-mono">{formatCNPJ(lead.cnpj)}</p>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-300">{lead.segmento || '—'}</td>
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
                    <td className="py-4 pr-4 max-w-xs">
                      <p className="text-sm text-slate-400 whitespace-pre-wrap break-words">
                        {lead.observacoes || 'Nenhuma observação.'}
                      </p>
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

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Exibindo {(paginaAtual - 1) * registrosPorPagina + 1}-{Math.min(paginaAtual * registrosPorPagina, filtered.length)} de {filtered.length} clientes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={paginaAtual === 1}
              aria-label="Página anterior"
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-20 text-center">Página {paginaAtual} de {totalPaginas}</span>
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
              disabled={paginaAtual === totalPaginas}
              aria-label="Próxima página"
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
