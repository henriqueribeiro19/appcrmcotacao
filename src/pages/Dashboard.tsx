import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLead } from '@/hooks/useLead';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  FileText,
  TrendingUp,
  Percent,
  ArrowRight,
  Filter,
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { leads, fetchLeads } = useLead();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    cotacoes: 0,
    faturamento: 0,
    conversao: 0,
  });

  useEffect(() => {
    fetchLeads(userProfile?.uid);
  }, [fetchLeads, userProfile]);

  useEffect(() => {
    const total = leads.length;
    const ganhos = leads.filter((l) => l.statusFunil === 'fechado_ganho').length;
    setMetrics({
      totalLeads: total,
      cotacoes: leads.filter((l) => l.statusFunil === 'proposta' || l.statusFunil === 'negociacao').length,
      faturamento: 0,
      conversao: total > 0 ? Math.round((ganhos / total) * 100) : 0,
    });
  }, [leads]);

  const cards = [
    { label: 'Total Leads', value: metrics.totalLeads, icon: Users, color: 'text-blue-400' },
    { label: 'Cotações Ativas', value: metrics.cotacoes, icon: FileText, color: 'text-amber-400' },
    { label: 'Faturamento', value: `R$ ${metrics.faturamento.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Taxa de Conversão', value: `${metrics.conversao}%`, icon: Percent, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Visão geral do seu pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-slate-900 ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-sm text-slate-400">{card.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Leads por Status do Funil</h3>
          <div className="space-y-3">
            {['novo', 'contato', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'].map((status) => {
              const count = leads.filter((l) => l.statusFunil === status).length;
              const total = leads.length || 1;
              const pct = Math.round((count / total) * 100);
              const labels: Record<string, string> = {
                novo: 'Novo', contato: 'Contato', proposta: 'Proposta',
                negociacao: 'Negociação', fechado_ganho: 'Ganho', fechado_perdido: 'Perdido',
              };
              const colors: Record<string, string> = {
                novo: 'bg-blue-500', contato: 'bg-slate-400', proposta: 'bg-amber-500',
                negociacao: 'bg-purple-500', fechado_ganho: 'bg-emerald-500', fechado_perdido: 'bg-red-500',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{labels[status]}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/leads/novo')}>
              <Users size={16} className="mr-2" /> Novo Lead
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/cotacoes/nova')}>
              <FileText size={16} className="mr-2" /> Nova Cotação
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/triagem')}>
              <Filter size={16} className="mr-2" /> Ver Triagem
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/funil')}>
              <ArrowRight size={16} className="mr-2" /> Abrir Funil
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
