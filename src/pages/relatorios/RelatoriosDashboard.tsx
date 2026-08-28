import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { BarChart3, Download, FileText, Filter, RefreshCw, TrendingUp, Users, Calculator, Wrench, UserRound, Clock3 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCotacao } from '../../hooks/useCotacao';
import { useLead } from '../../hooks/useLead';
import { formatarData, formatarValor } from '../../utils/calculos';
import type { Cotacao, StatusCotacao, StatusFunil } from '../../types';
import { userService } from '../../services/userService';

const statusLabels: Record<StatusCotacao, string> = {
  rascunho: 'Rascunho', enviada: 'Enviada', aprovada: 'Aprovada', rejeitada: 'Rejeitada',
};
const funilLabels: Record<StatusFunil, string> = {
  novo: 'Novo', contato: 'Contato', proposta: 'Proposta', negociacao: 'Negociação',
  fechado_ganho: 'Ganho', fechado_perdido: 'Perdido',
};
const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-red-500'];

function dataCotacao(cotacao: Cotacao) {
  const data = cotacao.dataCriacao || cotacao.createdAt;
  if (!data) return null;
  if (typeof data === 'object' && data !== null && 'toDate' in data && typeof data.toDate === 'function') return data.toDate();
  return new Date(data as string | number | Date);
}

type AbaRelatorio = 'conversao' | 'financeiro' | 'usuarios' | 'servicos' | 'parados';

function dataLead(lead: { atualizadoEm?: unknown; criadoEm?: unknown }) {
  const valor = lead.atualizadoEm || lead.criadoEm;
  if (!valor) return null;
  if (typeof valor === 'object' && valor !== null && 'toDate' in valor && typeof valor.toDate === 'function') return valor.toDate();
  return new Date(valor as string | number | Date);
}

export function RelatoriosDashboard() {
  const { cotacoes, loading: carregandoCotacoes, fetchCotacoes } = useCotacao();
  const { leads, loading: carregandoLeads, fetchLeads } = useLead();
  const [status, setStatus] = useState<'todos' | StatusCotacao>('todos');
  const [produto, setProduto] = useState<'todos' | 'cloudfy' | 'cplug'>('todos');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [aba, setAba] = useState<AbaRelatorio>('conversao');
  const [usuarios, setUsuarios] = useState<Array<{ uid: string; nome: string; email: string }>>([]);

  useEffect(() => { fetchCotacoes(); fetchLeads(); }, [fetchCotacoes, fetchLeads]);
  useEffect(() => { userService.listar().then(setUsuarios).catch(() => setUsuarios([])); }, []);

  const cotacoesFiltradas = useMemo(() => cotacoes.filter((cotacao) => {
    const data = dataCotacao(cotacao);
    const atendeStatus = status === 'todos' || cotacao.status === status;
    const atendeProduto = produto === 'todos' || cotacao.tipoProduto === produto;
    const atendeInicio = !inicio || (data && data >= new Date(`${inicio}T00:00:00`));
    const atendeFim = !fim || (data && data <= new Date(`${fim}T23:59:59`));
    return atendeStatus && atendeProduto && atendeInicio && atendeFim;
  }), [cotacoes, fim, inicio, produto, status]);

  const resumo = useMemo(() => {
    const aprovadas = cotacoesFiltradas.filter((cotacao) => cotacao.status === 'aprovada');
    const valorMensal = aprovadas.reduce((total, cotacao) => total + (cotacao.totalMensalidade || 0), 0);
    const valorServicos = aprovadas.reduce((total, cotacao) => total + (cotacao.valorServicos || 0), 0);
    const valorTotal = aprovadas.reduce((total, cotacao) => total + (cotacao.valorTotal || 0), 0);
    const leadsComCotacao = new Set(cotacoesFiltradas.map((cotacao) => cotacao.leadId).filter(Boolean)).size;
    const ganhos = leads.filter((lead) => lead.statusFunil === 'fechado_ganho').length;
    return { aprovadas: aprovadas.length, valorMensal, valorServicos, valorTotal, leadsComCotacao, ganhos };
  }, [cotacoesFiltradas, leads]);

  const porStatus = (Object.keys(statusLabels) as StatusCotacao[]).map((item) => ({ label: statusLabels[item], quantidade: cotacoesFiltradas.filter((cotacao) => cotacao.status === item).length }));
  const porFunil = (Object.keys(funilLabels) as StatusFunil[]).map((item) => ({ label: funilLabels[item], quantidade: leads.filter((lead) => lead.statusFunil === item).length }));
  const maiorStatus = Math.max(...porStatus.map((item) => item.quantidade), 1);

  const conversao = useMemo(() => {
    const total = leads.length;
    const ganhos = leads.filter((lead) => lead.statusFunil === 'fechado_ganho').length;
    const cotados = new Set(cotacoesFiltradas.map((cotacao) => cotacao.leadId).filter(Boolean)).size;
    return { total, cotados, ganhos, taxaCotacao: total ? Math.round((cotados / total) * 100) : 0, taxaGanho: total ? Math.round((ganhos / total) * 100) : 0 };
  }, [cotacoesFiltradas, leads]);

  const financeiro = useMemo(() => {
    const aprovadas = cotacoesFiltradas.filter((cotacao) => cotacao.status === 'aprovada');
    return {
      mensalidade: aprovadas.reduce((total, cotacao) => total + (cotacao.totalMensalidade || 0), 0),
      servicos: aprovadas.reduce((total, cotacao) => total + (cotacao.valorServicos || 0), 0),
      descontos: aprovadas.reduce((total, cotacao) => total + (cotacao.descontoGlobal || 0), 0),
      royalties: aprovadas.reduce((total, cotacao) => total + (cotacao.totalRoyalties || 0), 0),
      margem: aprovadas.reduce((total, cotacao) => total + (cotacao.margemLiquida || 0), 0),
    };
  }, [cotacoesFiltradas]);

  const porUsuario = useMemo(() => usuarios.map((usuario) => {
    const itens = cotacoesFiltradas.filter((cotacao) => cotacao.vendedorId === usuario.uid);
    const aprovadas = itens.filter((cotacao) => cotacao.status === 'aprovada');
    return { ...usuario, cotacoes: itens.length, aprovadas: aprovadas.length, valor: aprovadas.reduce((total, cotacao) => total + (cotacao.valorTotal || 0), 0) };
  }), [cotacoesFiltradas, usuarios]);

  const porServico = useMemo(() => {
    const mapa = new Map<string, { nome: string; quantidade: number; receita: number }>();
    cotacoesFiltradas.filter((cotacao) => cotacao.status === 'aprovada').forEach((cotacao) => (cotacao.adicionais || []).filter((adicional) => adicional.selecionado).forEach((adicional) => {
      const atual = mapa.get(adicional.adicionalId) || { nome: adicional.nome, quantidade: 0, receita: 0 };
      atual.quantidade += adicional.quantidade;
      atual.receita += adicional.valor * adicional.quantidade;
      mapa.set(adicional.adicionalId, atual);
    }));
    return [...mapa.values()].sort((a, b) => b.receita - a.receita);
  }, [cotacoesFiltradas]);

  const leadsParados = useMemo(() => leads.filter((lead) => {
    if (lead.statusFunil === 'fechado_ganho' || lead.statusFunil === 'fechado_perdido') return false;
    const data = dataLead(lead);
    return data ? (Date.now() - data.getTime()) >= 7 * 24 * 60 * 60 * 1000 : false;
  }).sort((a, b) => (dataLead(a)?.getTime() || 0) - (dataLead(b)?.getTime() || 0)), [leads]);

  const exportar = () => {
    const linhas = cotacoesFiltradas.map((cotacao) => ({
      Numero: cotacao.numero || '', Cliente: cotacao.nomeLead || '', Produto: cotacao.tipoProduto || '',
      Status: statusLabels[cotacao.status], Data: formatarData(dataCotacao(cotacao)),
      Mensalidade: cotacao.totalMensalidade || 0, Servicos: cotacao.valorServicos || 0, Total: cotacao.valorTotal || 0,
    }));
    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Relatório de cotações');
    XLSX.writeFile(livro, `relatorio-cotacoes-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const limparFiltros = () => { setStatus('todos'); setProduto('todos'); setInicio(''); setFim(''); };
  const carregando = carregandoCotacoes || carregandoLeads;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><BarChart3 className="text-emerald-400" size={24} />Relatórios</h1><p className="mt-1 text-slate-400">Visão comercial baseada em cotações aprovadas e no funil de leads.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => { fetchCotacoes(); fetchLeads(); }} disabled={carregando} className="flex items-center gap-2"><RefreshCw size={16} />Atualizar</Button><Button onClick={exportar} disabled={cotacoesFiltradas.length === 0} className="flex items-center gap-2"><Download size={16} />Exportar Excel</Button></div>
      </div>

      <Card className="p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Filter size={16} className="text-emerald-400" />Filtros</div><div className="grid grid-cols-1 gap-3 md:grid-cols-4"><select value={status} onChange={(e) => setStatus(e.target.value as 'todos' | StatusCotacao)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"><option value="todos">Todos os status</option>{(Object.keys(statusLabels) as StatusCotacao[]).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select><select value={produto} onChange={(e) => setProduto(e.target.value as 'todos' | 'cloudfy' | 'cplug')} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"><option value="todos">Todos os produtos</option><option value="cloudfy">Cloudfy</option><option value="cplug">Cplug</option></select><input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /><input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></div><button type="button" onClick={limparFiltros} className="mt-3 text-xs text-slate-400 hover:text-white">Limpar filtros</button></Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><Card><div className="flex items-center gap-3"><FileText className="text-amber-400" /><div><p className="text-2xl font-bold text-white">{resumo.aprovadas}</p><p className="text-sm text-slate-400">Cotações aprovadas</p></div></div></Card><Card><div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" /><div><p className="text-2xl font-bold text-white">{formatarValor(resumo.valorTotal)}</p><p className="text-sm text-slate-400">Valor aprovado total</p></div></div></Card><Card><div className="flex items-center gap-3"><Users className="text-blue-400" /><div><p className="text-2xl font-bold text-white">{resumo.leadsComCotacao}</p><p className="text-sm text-slate-400">Leads com cotação</p></div></div></Card><Card><div className="flex items-center gap-3"><BarChart3 className="text-purple-400" /><div><p className="text-2xl font-bold text-white">{resumo.ganhos}</p><p className="text-sm text-slate-400">Leads ganhos</p></div></div></Card></div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card><h2 className="mb-4 text-lg font-semibold text-white">Cotações por status</h2><div className="space-y-3">{porStatus.map((item, index) => <div key={item.label}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{item.label}</span><span className="text-slate-400">{item.quantidade}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${colors[index]} rounded-full`} style={{ width: `${(item.quantidade / maiorStatus) * 100}%` }} /></div></div>)}</div></Card><Card><h2 className="mb-4 text-lg font-semibold text-white">Leads por etapa do funil</h2><div className="grid grid-cols-2 gap-3">{porFunil.map((item) => <div key={item.label} className="rounded-lg bg-slate-900/60 p-3"><p className="text-xl font-bold text-white">{item.quantidade}</p><p className="text-xs text-slate-400">{item.label}</p></div>)}</div></Card></div>

      <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Cotações detalhadas</h2><span className="text-sm text-slate-500">{cotacoesFiltradas.length} registro(s)</span></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500"><th className="px-3 py-3">Cotação</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Produto</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Data</th><th className="px-3 py-3 text-right">Mensalidade</th><th className="px-3 py-3 text-right">Total</th></tr></thead><tbody>{cotacoesFiltradas.map((cotacao) => <tr key={cotacao.id} className="border-b border-slate-800 text-slate-300"><td className="px-3 py-3 font-mono text-xs">{cotacao.numero || '-'}</td><td className="px-3 py-3">{cotacao.nomeLead || '-'}</td><td className="px-3 py-3">{cotacao.tipoProduto === 'cloudfy' ? 'Cloudfy' : 'Cplug'}</td><td className="px-3 py-3">{statusLabels[cotacao.status]}</td><td className="px-3 py-3">{formatarData(dataCotacao(cotacao))}</td><td className="px-3 py-3 text-right">{formatarValor(cotacao.totalMensalidade || 0)}</td><td className="px-3 py-3 text-right font-medium text-emerald-400">{formatarValor(cotacao.valorTotal || 0)}</td></tr>)}</tbody></table>{cotacoesFiltradas.length === 0 && <p className="py-10 text-center text-slate-500">Nenhuma cotação encontrada para os filtros selecionados.</p>}</div></Card>
      <Card className="p-3"><div className="flex flex-wrap gap-2">{([{ id: 'conversao', label: 'Conversão', icon: TrendingUp }, { id: 'financeiro', label: 'Financeiro', icon: Calculator }, { id: 'usuarios', label: 'Por usuário', icon: UserRound }, { id: 'servicos', label: 'Serviços adicionais', icon: Wrench }, { id: 'parados', label: 'Leads parados', icon: Clock3 }] as const).map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setAba(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${aba === item.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon size={16} />{item.label}</button>; })}</div></Card>

      {aba === 'conversao' && <Card><h2 className="mb-4 text-lg font-semibold text-white">Relatório de conversão</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-4"><div className="rounded-lg bg-slate-900/60 p-4"><p className="text-2xl font-bold text-white">{conversao.total}</p><p className="text-sm text-slate-400">Leads no período</p></div><div className="rounded-lg bg-slate-900/60 p-4"><p className="text-2xl font-bold text-white">{conversao.cotados}</p><p className="text-sm text-slate-400">Leads com cotação ({conversao.taxaCotacao}%)</p></div><div className="rounded-lg bg-slate-900/60 p-4"><p className="text-2xl font-bold text-emerald-400">{conversao.ganhos}</p><p className="text-sm text-slate-400">Leads ganhos ({conversao.taxaGanho}%)</p></div><div className="rounded-lg bg-slate-900/60 p-4"><p className="text-2xl font-bold text-amber-400">{resumo.aprovadas}</p><p className="text-sm text-slate-400">Cotações aprovadas</p></div></div></Card>}

      {aba === 'financeiro' && <Card><h2 className="mb-1 text-lg font-semibold text-white">Relatório financeiro</h2><p className="mb-4 text-xs text-slate-500">Valores calculados somente sobre cotações aprovadas.</p><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div><p className="text-sm text-slate-400">Mensalidades</p><p className="text-xl font-bold text-white">{formatarValor(financeiro.mensalidade)}</p></div><div><p className="text-sm text-slate-400">Serviços adicionais</p><p className="text-xl font-bold text-amber-400">{formatarValor(financeiro.servicos)}</p></div><div><p className="text-sm text-slate-400">Total aprovado</p><p className="text-xl font-bold text-emerald-400">{formatarValor(financeiro.mensalidade + financeiro.servicos)}</p></div><div><p className="text-sm text-slate-400">Descontos concedidos</p><p className="text-xl font-bold text-red-400">{formatarValor(financeiro.descontos)}</p></div><div><p className="text-sm text-slate-400">Royalties</p><p className="text-xl font-bold text-white">{formatarValor(financeiro.royalties)}</p></div><div><p className="text-sm text-slate-400">Margem líquida</p><p className="text-xl font-bold text-emerald-400">{formatarValor(financeiro.margem)}</p></div></div></Card>}

      {aba === 'usuarios' && <Card><h2 className="mb-4 text-lg font-semibold text-white">Desempenho por usuário</h2><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-slate-700 text-xs uppercase text-slate-500"><th className="px-3 py-3">Usuário</th><th className="px-3 py-3">Cotações</th><th className="px-3 py-3">Aprovadas</th><th className="px-3 py-3 text-right">Valor aprovado</th></tr></thead><tbody>{porUsuario.map((usuario) => <tr key={usuario.uid} className="border-b border-slate-800 text-slate-300"><td className="px-3 py-3">{usuario.nome}<span className="ml-2 text-xs text-slate-500">{usuario.email}</span></td><td className="px-3 py-3">{usuario.cotacoes}</td><td className="px-3 py-3">{usuario.aprovadas}</td><td className="px-3 py-3 text-right text-emerald-400">{formatarValor(usuario.valor)}</td></tr>)}</tbody></table>{porUsuario.length === 0 && <p className="py-8 text-center text-slate-500">Nenhum usuário encontrado.</p>}</div></Card>}

      {aba === 'servicos' && <Card><h2 className="mb-4 text-lg font-semibold text-white">Serviços adicionais contratados</h2><div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr className="border-b border-slate-700 text-xs uppercase text-slate-500"><th className="px-3 py-3">Serviço</th><th className="px-3 py-3">Quantidade</th><th className="px-3 py-3 text-right">Receita</th></tr></thead><tbody>{porServico.map((servico) => <tr key={servico.nome} className="border-b border-slate-800 text-slate-300"><td className="px-3 py-3">{servico.nome}</td><td className="px-3 py-3">{servico.quantidade}</td><td className="px-3 py-3 text-right text-amber-400">{formatarValor(servico.receita)}</td></tr>)}</tbody></table>{porServico.length === 0 && <p className="py-8 text-center text-slate-500">Nenhum serviço contratado no período.</p>}</div></Card>}

      {aba === 'parados' && <Card><h2 className="mb-1 text-lg font-semibold text-white">Leads parados</h2><p className="mb-4 text-xs text-slate-500">Leads ativos sem atualização há pelo menos 7 dias.</p><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-slate-700 text-xs uppercase text-slate-500"><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Etapa</th><th className="px-3 py-3">Última atualização</th><th className="px-3 py-3">Responsável</th></tr></thead><tbody>{leadsParados.map((lead) => <tr key={lead.id} className="border-b border-slate-800 text-slate-300"><td className="px-3 py-3">{lead.razaoSocial}</td><td className="px-3 py-3">{funilLabels[lead.statusFunil]}</td><td className="px-3 py-3">{formatarData(dataLead(lead))}</td><td className="px-3 py-3">{lead.responsavelId || 'Sem responsável'}</td></tr>)}</tbody></table>{leadsParados.length === 0 && <p className="py-8 text-center text-slate-500">Nenhum lead parado encontrado.</p>}</div></Card>}
    </div>
  );
}
