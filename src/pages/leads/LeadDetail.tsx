import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLead } from '@/hooks/useLead';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { ScoreBadge } from '@/components/ScoreBadge';
import { InteracaoItem } from '@/components/InteracaoItem';
import { formatCNPJ, formatCEP, formatPhone, formatDate } from '@/utils/formatters';
import {
  ArrowLeft, Edit, Building2, MapPin, Phone, Mail, User, FileText, Calendar,
} from 'lucide-react';

const statusLabels: Record<string, string> = {
  novo: 'Novo', contato: 'Contato', proposta: 'Proposta',
  negociacao: 'Negociação', fechado_ganho: 'Ganho', fechado_perdido: 'Perdido',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  novo: 'info', contato: 'default', proposta: 'warning',
  negociacao: 'warning', fechado_ganho: 'success', fechado_perdido: 'danger',
};

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lead, loading, fetchLead } = useLead();

  useEffect(() => {
    if (id) fetchLead(id);
  }, [id, fetchLead]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Lead não encontrado</p>
        <Button variant="ghost" onClick={() => navigate('/leads')} className="mt-4">
          <ArrowLeft size={16} className="mr-2" />Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/leads')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{lead.razaoSocial}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Tag variant={statusColors[lead.statusFunil] || 'default'}>
                {statusLabels[lead.statusFunil] || lead.statusFunil}
              </Tag>
              {lead.classificacao && (
                <ScoreBadge score={lead.classificacao === 'A' ? 85 : lead.classificacao === 'B' ? 70 : 45} classificacao={lead.classificacao} />
              )}
              <span className="text-xs text-slate-500 capitalize">{lead.produtoSugerido}</span>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/leads/${id}/editar`)}>
          <Edit size={16} className="mr-2" />Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-emerald-500" />Dados da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">Razão Social</p><p className="text-white font-medium">{lead.razaoSocial}</p></div>
              {lead.nomeFantasia && <div><p className="text-slate-500">Nome Fantasia</p><p className="text-white">{lead.nomeFantasia}</p></div>}
              <div><p className="text-slate-500">CNPJ</p><p className="text-white font-mono">{formatCNPJ(lead.cnpj)}</p></div>
              <div><p className="text-slate-500">Segmento</p><p className="text-white">{lead.segmento || '-'}</p></div>
              <div><p className="text-slate-500">Porte</p><p className="text-white">{lead.porte || '-'}</p></div>
              {lead.capitalSocial && <div><p className="text-slate-500">Capital Social</p><p className="text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.capitalSocial)}</p></div>}
              {lead.socios && <div className="md:col-span-2"><p className="text-slate-500">Sócios</p><p className="text-white">{lead.socios}</p></div>}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-emerald-500" />Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">CEP</p><p className="text-white">{lead.cep ? formatCEP(lead.cep) : '-'}</p></div>
              <div><p className="text-slate-500">UF</p><p className="text-white">{lead.uf || '-'}</p></div>
              <div className="md:col-span-2"><p className="text-slate-500">Logradouro</p><p className="text-white">{lead.logradouro || '-'}{lead.numero ? `, ${lead.numero}` : ''}{lead.complemento ? ` - ${lead.complemento}` : ''}</p></div>
              <div><p className="text-slate-500">Bairro</p><p className="text-white">{lead.bairro || '-'}</p></div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-emerald-500" />Contatos
            </h3>
            <div className="space-y-4">
              {lead.contatoNome && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-1">Contato Principal</p>
                  <p className="text-white font-medium">{lead.contatoNome}</p>
                  {lead.contatoTel && <p className="text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={12} />{formatPhone(lead.contatoTel)}</p>}
                  {lead.contatoEmail && <p className="text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={12} />{lead.contatoEmail}</p>}
                </div>
              )}
              {lead.respFinanceiroNome && (
                <div className="text-sm border-t border-slate-800 pt-3">
                  <p className="text-slate-500 mb-1">Responsável Financeiro</p>
                  <p className="text-white font-medium">{lead.respFinanceiroNome}</p>
                  {lead.respFinanceiroTel && <p className="text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={12} />{formatPhone(lead.respFinanceiroTel)}</p>}
                  {lead.respFinanceiroEmail && <p className="text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={12} />{lead.respFinanceiroEmail}</p>}
                </div>
              )}
            </div>
          </Card>

          {lead.interacoes && lead.interacoes.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-emerald-500" />Interações ({lead.interacoes.length})
              </h3>
              <div className="space-y-3">
                {lead.interacoes.slice().sort((a, b) => {
                  const aTime = typeof a.dataHora === 'object' && 'seconds' in a.dataHora ? a.dataHora.seconds : 0;
                  const bTime = typeof b.dataHora === 'object' && 'seconds' in b.dataHora ? b.dataHora.seconds : 0;
                  return bTime - aTime;
                }).map((interacao) => (
                  <InteracaoItem key={interacao.id} interacao={interacao} />
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><Tag variant={statusColors[lead.statusFunil] || 'default'}>{statusLabels[lead.statusFunil] || lead.statusFunil}</Tag></div>
              <div className="flex justify-between"><span className="text-slate-500">Produto</span><span className="text-white capitalize">{lead.produtoSugerido || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Classificação</span>{lead.classificacao ? <ScoreBadge score={lead.classificacao === 'A' ? 85 : lead.classificacao === 'B' ? 70 : 45} classificacao={lead.classificacao} /> : <span className="text-slate-500">-</span>}</div>
              <div className="flex justify-between"><span className="text-slate-500">Canal</span><span className="text-white capitalize">{lead.canalOrigem || 'manual'}</span></div>
            </div>
          </Card>

          {lead.observacoes && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><FileText size={18} className="text-emerald-500" />Observações</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{lead.observacoes}</p>
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Calendar size={18} className="text-emerald-500" />Histórico</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Criado em</span><span className="text-white">{formatDate(lead.criadoEm)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Atualizado em</span><span className="text-white">{formatDate(lead.atualizadoEm)}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
