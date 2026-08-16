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
import { formatCNPJ, formatPhone } from '@/utils/formatters';
import { Plus, Search, Trash2, ArrowRight } from 'lucide-react';

const statusLabels: Record<string, string> = {
  novo: 'Novo', contato: 'Contato', proposta: 'Proposta',
  negociacao: 'Negociação', fechado_ganho: 'Ganho', fechado_perdido: 'Perdido',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  novo: 'info', contato: 'default', proposta: 'warning',
  negociacao: 'warning', fechado_ganho: 'success', fechado_perdido: 'danger',
};

export function LeadsList() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { isAdmin } = useRole();
  const { leads, fetchLeads, deleteLead } = useLead();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchLeads();
    } else if (userProfile?.uid) {
      fetchLeads(userProfile.uid);
    }
  }, [fetchLeads, isAdmin, userProfile]);

  const filtered = leads.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.razaoSocial.toLowerCase().includes(term) ||
      l.cnpj.includes(term) ||
      (l.email && l.email.toLowerCase().includes(term))
    );
  });

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

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por razão social, CNPJ ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-medium text-slate-400 uppercase">
                  <th className="pb-3 pr-4">Empresa</th>
                  <th className="pb-3 pr-4">Contato</th>
                  <th className="pb-3 pr-4">Status</th>
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
                        >
                          <ArrowRight size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
    </div>
  );
}
