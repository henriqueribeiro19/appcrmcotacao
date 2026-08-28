import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLead } from '@/hooks/useLead';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { ScoreBadge } from '@/components/ScoreBadge';
import { formatCNPJ, formatDate } from '@/utils/formatters';
import { Plus, Search, Trash2, PencilLine, Eye } from 'lucide-react';

const statusLabels: Record<string, string> = {
  novo: 'Novo', contato: 'Contato', proposta: 'Proposta',
  negociacao: 'Negociação', fechado_ganho: 'Ganho', fechado_perdido: 'Perdido',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  novo: 'info', contato: 'default', proposta: 'warning',
  negociacao: 'warning', fechado_ganho: 'success', fechado_perdido: 'danger',
};

const ITEMS_PER_PAGE = 10;

export function LeadsList() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { isAdmin } = useRole();
  const { leads, fetchLeads, deleteLead } = useLead();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [segmentoFilter, setSegmentoFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isAdmin) {
      fetchLeads();
    } else if (userProfile?.uid) {
      fetchLeads(userProfile.uid);
    }
  }, [fetchLeads, isAdmin, userProfile]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return leads.filter((lead) => {
      const matchesText =
        lead.razaoSocial.toLowerCase().includes(term) ||
        (lead.nomeFantasia || '').toLowerCase().includes(term) ||
        lead.cnpj.includes(term) ||
        (lead.email || '').toLowerCase().includes(term) ||
        (lead.observacoes || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'todos' || lead.statusFunil === statusFilter;
      const matchesSegmento = segmentoFilter === 'todos' || lead.segmento === segmentoFilter;

      return matchesText && matchesStatus && matchesSegmento;
    });
  }, [leads, search, statusFilter, segmentoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeads = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, segmentoFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este lead?')) return;
    try {
      await deleteLead(id);
      toast.success('Lead excluído');
      fetchLeads(isAdmin ? undefined : userProfile?.uid);
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const uniqueSegments = Array.from(new Set(leads.map((lead) => lead.segmento).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-slate-400 mt-1">Gerencie seus leads e oportunidades</p>
        </div>
        <Button onClick={() => navigate('/leads/novo')}>
          <Plus size={16} className="mr-2" />Novo Lead
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por razão social, CNPJ, email ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-850 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="todos">Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={segmentoFilter}
            onChange={(e) => setSegmentoFilter(e.target.value)}
            className="bg-slate-850 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="todos">Segmento</option>
            {uniqueSegments.map((segmento) => (
              <option key={segmento} value={segmento}>{segmento}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-medium text-slate-400 uppercase">
                  <th className="pb-3 pr-4">Empresa</th>
                  <th className="pb-3 pr-4">Segmento</th>
                  <th className="pb-3 pr-4">Cidade</th>
                  <th className="pb-3 pr-4">Score</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Observação</th>
                  <th className="pb-3 pr-4">Atualizado em</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-slate-900/50 transition-colors align-top">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-medium text-white">{lead.razaoSocial}</p>
                      <p className="text-xs text-slate-500 font-mono">{formatCNPJ(lead.cnpj)}</p>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-300">{lead.segmento || '—'}</td>
                    <td className="py-4 pr-4 text-sm text-slate-300">{lead.municipio || '—'}</td>
                    <td className="py-4 pr-4">
                      {lead.classificacao ? (
                        <ScoreBadge
                          score={lead.classificacao === 'A' ? 85 : lead.classificacao === 'B' ? 70 : 45}
                          classificacao={lead.classificacao}
                        />
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <Tag variant={statusColors[lead.statusFunil] || 'default'}>
                        {statusLabels[lead.statusFunil] || lead.statusFunil}
                      </Tag>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-300 max-w-[220px]">
                      <span className="line-clamp-2">{lead.observacoes || '—'}</span>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-400">
                      {formatDate(lead.atualizadoEm || lead.criadoEm)}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="Detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/leads/editar/${lead.id}`)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                          title="Editar"
                        >
                          <PencilLine size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
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

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Mostrando {Math.min(filtered.length, pageStart + 1)}-{Math.min(filtered.length, pageStart + ITEMS_PER_PAGE)} de {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40"
            >
              ‹
            </button>
            <span className="px-2 text-slate-300">{currentPage}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
