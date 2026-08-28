import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCotacao } from '../../hooks/useCotacao';
import { useLead } from '../../hooks/useLead';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { ArrowLeft, AlertTriangle, Building2, Calendar, Calculator, Eye, FileText, Mail, MapPin, Phone, Plus, TagIcon, User } from 'lucide-react';
import type { Lead as LeadData, StatusFunil } from '../../types';
import { leadPodeReceberCotacao, rotulosStatusCotacao } from '../../utils/cotacaoRegras';

interface LeadView {
  id: string;
  nome: string;
  empresa?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  fase: StatusFunil;
  origem?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

type Aba = 'info' | 'historico' | 'propostas';

const fases: Record<StatusFunil, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-slate-500' },
  contato: { label: 'Contato', color: 'bg-sky-500' },
  proposta: { label: 'Proposta', color: 'bg-amber-500' },
  negociacao: { label: 'Negociação', color: 'bg-orange-500' },
  fechado_ganho: { label: 'Fechado (Ganho)', color: 'bg-emerald-500' },
  fechado_perdido: { label: 'Fechado (Perdido)', color: 'bg-red-500' },
};

function converterData(value: LeadData['criadoEm']): string {
  return value?.toDate ? value.toDate().toISOString() : new Date().toISOString();
}

export function LeadDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchLead } = useLead();
  const { fetchCotacoesPorLead } = useCotacao();
  const [lead, setLead] = useState<LeadView | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('info');
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [carregandoCotacoes, setCarregandoCotacoes] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchLead(id).then((data) => {
      if (!data) return;
      setLead({
        id: data.id,
        nome: data.razaoSocial,
        empresa: data.nomeFantasia,
        telefone: data.telefone,
        email: data.email,
        endereco: [data.logradouro, data.numero, data.bairro, data.uf].filter(Boolean).join(', '),
        fase: data.statusFunil,
        origem: data.canalOrigem,
        observacoes: data.observacoes,
        createdAt: converterData(data.criadoEm),
        updatedAt: converterData(data.atualizadoEm),
      });
    });
  }, [fetchLead, id]);

  useEffect(() => {
    if (abaAtiva !== 'propostas' || !id) return;
    setCarregandoCotacoes(true);
    fetchCotacoesPorLead(id)
      .then(setCotacoes)
      .catch(console.error)
      .finally(() => setCarregandoCotacoes(false));
  }, [abaAtiva, fetchCotacoesPorLead, id]);

  if (!lead) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando lead...</div>;

  const fase = fases[lead.fase];
  const podeCriarCotacao = leadPodeReceberCotacao(lead.fase);
  const formatarData = (data: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data));
  const formatarValor = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  const novaCotacao = () => navigate(`/cotacoes/nova?leadId=${lead.id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}><ArrowLeft size={18} /></Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-bold text-white">{lead.nome}</h1><span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${fase.color}`}>{fase.label}</span></div>
            {lead.empresa && <p className="text-slate-400 mt-1 flex items-center gap-1.5"><Building2 size={14} />{lead.empresa}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/leads/editar/${lead.id}`)}>Editar Lead</Button>
          {podeCriarCotacao && <Button size="sm" onClick={novaCotacao}><Plus size={16} className="mr-2" />Nova Cotação</Button>}
        </div>
      </div>

      <div className="border-b border-slate-700/50 flex gap-1">
        {([{ key: 'info', label: 'Informações', icon: User }, { key: 'historico', label: 'Histórico', icon: Calendar }, { key: 'propostas', label: 'Propostas', icon: FileText }] as const).map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setAbaAtiva(key)} className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 ${abaAtiva === key ? 'text-emerald-400 border-emerald-500' : 'text-slate-400 border-transparent'}`}><Icon size={16} />{label}</button>)}
      </div>

      {abaAtiva === 'info' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Dados do Lead</h3><div className="space-y-4">{lead.telefone && <p className="flex gap-3 text-white"><Phone size={16} className="text-slate-500" />{lead.telefone}</p>}{lead.email && <p className="flex gap-3 text-white"><Mail size={16} className="text-slate-500" />{lead.email}</p>}{lead.endereco && <p className="flex gap-3 text-white"><MapPin size={16} className="text-slate-500" />{lead.endereco}</p>}{lead.origem && <p className="flex gap-3 text-white"><TagIcon size={16} className="text-slate-500" />{lead.origem}</p>}</div></Card><Card><h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Observações</h3><p className="text-slate-300 text-sm">{lead.observacoes || 'Nenhuma observação.'}</p><div className="mt-6 pt-4 border-t border-slate-700/50 text-xs text-slate-400 space-y-2"><p>Criado em: {formatarData(lead.createdAt)}</p><p>Atualizado em: {formatarData(lead.updatedAt)}</p></div></Card></div>}

      {abaAtiva === 'historico' && <Card><h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Histórico</h3><p className="text-slate-300">Lead criado em {formatarData(lead.createdAt)}.</p><p className="text-slate-300 mt-3">Fase atual: {fase.label}.</p></Card>}

      {abaAtiva === 'propostas' && <div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-white">Propostas Comerciais</h3><p className="text-slate-400 text-sm">Cotações vinculadas a este lead</p></div>{podeCriarCotacao && <Button size="sm" onClick={novaCotacao}><Plus size={16} className="mr-2" />Nova Cotação</Button>}</div>{!podeCriarCotacao && <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-400 text-sm"><AlertTriangle size={18} className="shrink-0" />Cotação indisponível na fase {rotulosStatusCotacao[lead.fase]}. Avance para Contato, Proposta ou Negociação.</div>}<Card className="overflow-hidden">{carregandoCotacoes ? <div className="p-8 text-center text-slate-400">Carregando...</div> : cotacoes.length === 0 ? <div className="p-8 text-center"><Calculator size={40} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-400">Nenhuma proposta.</p></div> : <div className="overflow-x-auto"><table className="w-full"><tbody className="divide-y divide-slate-700/30">{cotacoes.map((cotacao) => <tr key={cotacao.id}><td className="px-6 py-4 text-white">{cotacao.numero || cotacao.id.slice(0, 8)}</td><td className="px-6 py-4"><Tag>{cotacao.tipoProduto === 'cloudfy' ? 'Cloudfy' : 'Cplug'}</Tag></td><td className="px-6 py-4 text-emerald-400">{formatarValor(cotacao.valorTotal || 0)}</td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => window.open(`/cotacoes/editar/${cotacao.id}`, '_blank', 'noopener,noreferrer')}><Eye size={16} /></Button></td></tr>)}</tbody></table></div>}</Card></div>}
    </div>
  );
}
