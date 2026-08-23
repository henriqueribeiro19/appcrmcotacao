import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCotacao } from '../../hooks/useCotacao';
import { usePacoteCplug } from '../../hooks/usePacoteCplug';
import { useLicencaCloudfy } from '../../hooks/useLicencaCloudfy';
import { useLicencaCplug } from '../../hooks/useLicencaCplug';
import { useCategoriaCanal } from '../../hooks/useCategoriaCanal';
import { useCategoriaLicencaCloudfy } from '../../hooks/useCategoriaLicencaCloudfy';
import { useLead } from '../../hooks/useLead';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tag } from '../../components/ui/Tag';
import { leadPodeReceberCotacao, rotulosStatusCotacao } from '../../utils/cotacaoRegras';
import { ArrowLeft, Save, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown, ArrowUp, ArrowDown, User, Cloud, Cpu, TagIcon, Percent, Package, Eye, CheckSquare, Hash, Minus, Plus as PlusIcon } from 'lucide-react';

interface Step5Item { licencaId: string; nome: string; categoriaNome?: string; tipo: 'checkbox' | 'quantificavel'; valorUnitario: number; selecionado: boolean; quantidade: number; }
interface FormState { leadId: string; tipoProduto: 'cloudfy' | 'cplug' | ''; pacoteCplugId: string; categoriaCanalId: string; descontoPercentual: string; observacaoDesconto: string; itens: Step5Item[]; }

const STEPS = [
  { num: 1, label: 'Lead', icon: User },
  { num: 2, label: 'Produto', icon: Package },
  { num: 3, label: 'Categoria', icon: TagIcon },
  { num: 4, label: 'Licenças', icon: CheckSquare },
  { num: 5, label: 'Desconto', icon: Percent },
  { num: 6, label: 'Preview', icon: Eye },
];

export function CotacaoForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdicao = !!id;

  const { cotacoes, loading: loadingCotacoes, criar, atualizar } = useCotacao();
  const { pacotes } = usePacoteCplug();
  const { licencas: licencasCloudfy } = useLicencaCloudfy();
  const { licencas: licencasCplug } = useLicencaCplug();
  const { categorias } = useCategoriaCanal();
  const { categorias: categoriasLicencas } = useCategoriaLicencaCloudfy();
  const { leads, fetchLeads } = useLead();
  const leadsElegiveis = leads.filter((lead) => leadPodeReceberCotacao(lead.statusFunil));

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ leadId: '', tipoProduto: '', pacoteCplugId: '', categoriaCanalId: '', descontoPercentual: '0', observacaoDesconto: '', itens: [] });
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({});
  const [ordemCategorias, setOrdemCategorias] = useState<string[]>([]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (!isEdicao && leadId) updateForm('leadId', leadId);
  }, [isEdicao, searchParams]);

  useEffect(() => {
    if (isEdicao && cotacoes.length > 0) {
      const cotacao = cotacoes.find((c) => c.id === id);
      if (cotacao) {
        setForm({ leadId: cotacao.leadId || '', tipoProduto: cotacao.tipoProduto || '', pacoteCplugId: cotacao.pacoteCplugId || '', categoriaCanalId: cotacao.categoriaCanalId || '', descontoPercentual: (cotacao.descontoPercentual || 0).toString(), observacaoDesconto: cotacao.observacaoDesconto || '', itens: (cotacao.itensCplug || []).map((i) => ({ licencaId: i.licencaId, nome: i.nome || 'Licença sem nome', categoriaNome: i.categoriaNome, tipo: i.tipo || 'checkbox', valorUnitario: Number(i.valorUnitario) || 0, selecionado: i.selecionado === true, quantidade: Math.max(1, Number(i.quantidade) || 1) })) });
      }
    }
  }, [isEdicao, id, cotacoes]);

  const updateForm = (field: keyof FormState, value: string | Step5Item[]) => { setForm((prev) => ({ ...prev, [field]: value })); if (erros[field]) setErros((prev) => ({ ...prev, [field]: undefined })); };
  const leadSelecionado = leads.find((l) => l.id === form.leadId);
  const pacoteSelecionado = pacotes.find((p) => p.id === form.pacoteCplugId);
  const categoriaSelecionada = categorias.find((c) => c.id === form.categoriaCanalId);

  const validarStep = (s: number): boolean => {
    const novosErros: Partial<Record<keyof FormState, string>> = {};
    if (s === 1 && !form.leadId) novosErros.leadId = 'Selecione um lead';
    if (s === 1 && form.leadId && !leadPodeReceberCotacao(leadSelecionado?.statusFunil)) novosErros.leadId = 'Este lead só poderá receber cotação nas fases Contato, Proposta ou Negociação';
    if (s === 2 && !form.tipoProduto) novosErros.tipoProduto = 'Selecione o tipo';
    if (s === 2 && form.tipoProduto === 'cplug' && !form.pacoteCplugId) novosErros.pacoteCplugId = 'Selecione um pacote';
    if (s === 3 && !form.categoriaCanalId) novosErros.categoriaCanalId = 'Selecione uma categoria';
    if (s === 5) { const pct = parseFloat(form.descontoPercentual.replace(',', '.')); if (isNaN(pct) || pct < 0 || pct > 100) novosErros.descontoPercentual = 'Desconto deve ser entre 0 e 100%'; }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const avancar = () => { if (validarStep(step)) setStep((s) => Math.min(s + 1, 6)); };
  const voltar = () => setStep((s) => Math.max(s - 1, 1));

  const subtotal = useMemo(() => form.itens.reduce((sum, item) => { if (!item.selecionado) return sum; return sum + item.valorUnitario * item.quantidade; }, 0), [form.itens]);
  const descontoValor = useMemo(() => { const pct = parseFloat(form.descontoPercentual.replace(',', '.')) || 0; return subtotal * (pct / 100); }, [subtotal, form.descontoPercentual]);
  const total = subtotal - descontoValor;

  const inicializarItens = () => {
    if (form.tipoProduto === 'cloudfy') {
      const ativos = licencasCloudfy.filter((l) => l.ativo !== false);
      setForm((prev) => ({ ...prev, itens: ativos.map((l) => ({ licencaId: l.id, nome: l.nome || 'Licença sem nome', categoriaNome: categoriasLicencas.find((categoria) => categoria.id === l.categoriaId)?.nome || l.categoriaNome, tipo: l.permiteMultiplasUnidades ? 'quantificavel' as const : 'checkbox' as const, valorUnitario: l.valor ?? l.valorIntegral ?? 0, selecionado: false, quantidade: 1 })) }));
    } else if (form.tipoProduto === 'cplug' && form.pacoteCplugId) {
      const pacote = pacotes.find((p) => p.id === form.pacoteCplugId);
      if (!pacote) return;
      const itens: Step5Item[] = [];
      (pacote.modulosOpcionais || []).forEach((m) => { itens.push({ licencaId: m.id, nome: m.nome, tipo: 'checkbox', valorUnitario: m.valor, selecionado: false, quantidade: 1 }); });
      (pacote.itensQuantificaveis || []).forEach((m) => { itens.push({ licencaId: m.id, nome: m.nome, tipo: 'quantificavel', valorUnitario: m.valorUnitario, selecionado: false, quantidade: 1 }); });
      const avulsas = licencasCplug.filter((l) => l.ativo !== false);
      avulsas.forEach((l) => { itens.push({ licencaId: l.id, nome: l.nome || l.descricao || 'Licença sem nome', tipo: l.tipo || 'checkbox', valorUnitario: l.valor ?? l.valorIntegral ?? 0, selecionado: false, quantidade: 1 }); });
      setForm((prev) => ({ ...prev, itens }));
    }
  };

  useEffect(() => { if (step === 4 && form.itens.length === 0) inicializarItens(); }, [step, licencasCloudfy, licencasCplug, pacotes, categoriasLicencas]);

  const toggleItem = (licencaId: string) => { setForm((prev) => ({ ...prev, itens: prev.itens.map((i) => i.licencaId === licencaId ? { ...i, selecionado: !i.selecionado } : i) })); };
  const alterarQuantidade = (licencaId: string, delta: number) => { setForm((prev) => ({ ...prev, itens: prev.itens.map((i) => i.licencaId === licencaId ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i) })); };

  const gruposDeItens = useMemo(() => {
    const grupos = new Map<string, { id: string; nome: string; itens: Step5Item[]; ordem: number }>();
    form.itens.forEach((item) => {
      const nome = item.categoriaNome || 'Sem categoria';
      const id = item.categoriaNome || '__sem_categoria__';
      const existente = grupos.get(id);
      if (existente) existente.itens.push(item);
      else grupos.set(id, { id, nome, itens: [item], ordem: categoriasLicencas.find((categoria) => categoria.nome === nome)?.ordem ?? 9999 });
    });
    const gruposOrdenados = [...grupos.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
    if (ordemCategorias.length !== gruposOrdenados.length) return gruposOrdenados;
    return gruposOrdenados.sort((a, b) => ordemCategorias.indexOf(a.id) - ordemCategorias.indexOf(b.id));
  }, [form.itens, categoriasLicencas, ordemCategorias]);

  useEffect(() => {
    const idsAtuais = gruposDeItens.map((grupo) => grupo.id);
    setOrdemCategorias((atual) => atual.length === idsAtuais.length && atual.every((id) => idsAtuais.includes(id)) ? atual : idsAtuais);
  }, [gruposDeItens]);

  const moverCategoria = (categoriaId: string, direcao: -1 | 1) => {
    setOrdemCategorias((atual) => {
      const proxima = [...atual];
      const indice = proxima.indexOf(categoriaId);
      const destino = indice + direcao;
      if (indice < 0 || destino < 0 || destino >= proxima.length) return atual;
      [proxima[indice], proxima[destino]] = [proxima[destino], proxima[indice]];
      return proxima;
    });
  };

  const handleSubmit = async () => {
    setErroGeral(null); setSalvando(true);
    try {
      if (!leadPodeReceberCotacao(leadSelecionado?.statusFunil)) {
        setErroGeral('O lead precisa estar nas fases Contato, Proposta ou Negociação para receber uma cotação.');
        return;
      }
      const payload = { leadId: form.leadId, nomeLead: leadSelecionado?.razaoSocial || '', tipoProduto: form.tipoProduto as 'cloudfy' | 'cplug', pacoteCplugId: form.tipoProduto === 'cplug' ? form.pacoteCplugId : undefined, categoriaCanalId: form.categoriaCanalId, categoriaCanalNome: categoriaSelecionada?.nome || '', descontoPercentual: parseFloat(form.descontoPercentual.replace(',', '.')) || 0, observacaoDesconto: form.observacaoDesconto || undefined, itensCplug: form.itens.map((i) => ({ licencaId: i.licencaId, nome: i.nome, categoriaNome: i.categoriaNome, tipo: i.tipo, valorUnitario: i.valorUnitario, quantidade: i.quantidade, selecionado: i.selecionado })), valorTotal: total, status: 'rascunho' as const };
      if (isEdicao) await atualizar(id!, payload); else await criar(payload);
      navigate('/cotacoes');
    } catch (err) { setErroGeral('Erro ao salvar cotação.'); console.error(err); }
    finally { setSalvando(false); }
  };

  const formatarValor = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (isEdicao && loadingCotacoes) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cotacoes')} className="text-slate-400 hover:text-white"><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdicao ? 'Editar Cotação' : 'Nova Cotação'}</h1>
          <p className="text-slate-400 mt-1">Preencha os dados em {STEPS.length} passos</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isCompleted ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800/50 text-slate-500'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-emerald-500 text-slate-950' : isCompleted ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>{isCompleted ? '✓' : s.num}</div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && <ChevronRight size={16} className="text-slate-600 shrink-0" />}
            </div>
          );
        })}
      </div>

      <Card className="p-6">
        {erroGeral && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400"><AlertTriangle size={18} />{erroGeral}</div>}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User size={20} className="text-emerald-400" />Selecione o Lead</h2>
            <div className="grid gap-3">
              {leadsElegiveis.map((lead) => (
                <button key={lead.id} type="button" onClick={() => updateForm('leadId', lead.id)} className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-colors ${form.leadId === lead.id ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.leadId === lead.id ? 'border-emerald-500' : 'border-slate-600'}`}>{form.leadId === lead.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}</div>
                  <div><p className="font-medium text-white">{lead.razaoSocial}</p><p className="text-sm text-slate-400">{lead.nomeFantasia || lead.contatoNome || 'Sem nome fantasia'} · {rotulosStatusCotacao[lead.statusFunil]}</p></div>
                </button>
              ))}
            </div>
            {leadsElegiveis.length === 0 && <p className="text-sm text-amber-400">Nenhum lead está em uma fase elegível para cotação.</p>}
            {erros.leadId && <p className="text-sm text-red-400">{erros.leadId}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Package size={20} className="text-emerald-400" />Selecione o Produto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => { updateForm('tipoProduto', 'cloudfy'); updateForm('pacoteCplugId', ''); updateForm('itens', []); }} className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-colors ${form.tipoProduto === 'cloudfy' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}><Cloud size={32} /><span className="font-semibold">Cloudfy Premium</span><span className="text-xs opacity-70">Licenças avulsas</span></button>
              <button type="button" onClick={() => { updateForm('tipoProduto', 'cplug'); updateForm('itens', []); }} className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-colors ${form.tipoProduto === 'cplug' ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}><Cpu size={32} /><span className="font-semibold">Cplug</span><span className="text-xs opacity-70">Pacotes + licenças</span></button>
            </div>
            {erros.tipoProduto && <p className="text-sm text-red-400">{erros.tipoProduto}</p>}
            {form.tipoProduto === 'cplug' && (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-medium text-slate-300">Selecione o pacote:</h3>
                <div className="grid gap-2">
                  {pacotes.filter(p => p.ativo !== false).map((pacote) => (
                    <button key={pacote.id} type="button" onClick={() => { updateForm('pacoteCplugId', pacote.id); updateForm('itens', []); }} className={`flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${form.pacoteCplugId === pacote.id ? 'bg-purple-500/10 border-purple-500/40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.pacoteCplugId === pacote.id ? 'border-purple-500' : 'border-slate-600'}`}>{form.pacoteCplugId === pacote.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}</div>
                        <div><p className="font-medium text-white">{pacote.nome}</p><p className="text-xs text-slate-500">{(pacote.modulosFixos?.length || 0)} fixos · {(pacote.modulosOpcionais?.length || 0)} opcionais · {(pacote.itensQuantificaveis?.length || 0)} quantificáveis</p></div>
                      </div>
                      <span className="text-emerald-400 font-semibold">{formatarValor(pacote.valorBase)}</span>
                    </button>
                  ))}
                </div>
                {erros.pacoteCplugId && <p className="text-sm text-red-400">{erros.pacoteCplugId}</p>}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><TagIcon size={20} className="text-emerald-400" />Categoria de Canal</h2>
            <p className="text-slate-400 text-sm">Selecione a origem desta oportunidade</p>
            <div className="grid gap-2">
              {categorias.filter(c => c.ativo !== false).map((cat) => (
                <button key={cat.id} type="button" onClick={() => updateForm('categoriaCanalId', cat.id)} className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${form.categoriaCanalId === cat.id ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.categoriaCanalId === cat.id ? 'border-emerald-500' : 'border-slate-600'}`}>{form.categoriaCanalId === cat.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}</div>
                  <div><p className="font-medium text-white">{cat.nome}</p>{cat.descricao && <p className="text-xs text-slate-500">{cat.descricao}</p>}</div>
                </button>
              ))}
            </div>
            {erros.categoriaCanalId && <p className="text-sm text-red-400">{erros.categoriaCanalId}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Percent size={20} className="text-emerald-400" />Desconto</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Percentual de desconto (%)</label>
              <div className="relative max-w-xs">
                <Input value={form.descontoPercentual} onChange={(e) => updateForm('descontoPercentual', e.target.value)} placeholder="0" className={`${erros.descontoPercentual ? 'border-red-500' : ''} pr-10`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              {erros.descontoPercentual && <p className="mt-1 text-sm text-red-400">{erros.descontoPercentual}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Observação sobre o desconto</label>
              <textarea value={form.observacaoDesconto} onChange={(e) => updateForm('observacaoDesconto', e.target.value)} placeholder="Ex: Desconto concedido por volume..." rows={3} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><CheckSquare size={20} className="text-emerald-400" />{form.tipoProduto === 'cloudfy' ? 'Licenças Cloudfy' : 'Licenças e Itens'}</h2>
              {form.tipoProduto === 'cplug' && pacoteSelecionado && <Tag variant="info" className="text-xs">Pacote: {pacoteSelecionado.nome}</Tag>}
            </div>
            {form.itens.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhum item disponível. Volte e selecione um produto/pacote.</div>
            ) : (
              <div className="space-y-3">
                {gruposDeItens.map((grupo, grupoIndex) => <div key={grupo.id} className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50">
                  <div className="flex items-center gap-2 p-3">
                    <button type="button" onClick={() => setCategoriasAbertas((atual) => ({ ...atual, [grupo.id]: !(atual[grupo.id] ?? true) }))} className="flex flex-1 items-center justify-between text-left">
                      <span className="flex items-center gap-2 font-semibold text-white">{(categoriasAbertas[grupo.id] ?? true) ? <ChevronDown size={18} /> : <ChevronRight size={18} />} {grupo.nome} <span className="text-xs font-normal text-slate-500">{grupo.itens.length} {grupo.itens.length === 1 ? 'item' : 'itens'}</span></span>
                    </button>
                    <button type="button" title="Mover categoria para cima" disabled={grupoIndex === 0} onClick={() => moverCategoria(grupo.id, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"><ArrowUp size={15} /></button>
                    <button type="button" title="Mover categoria para baixo" disabled={grupoIndex === gruposDeItens.length - 1} onClick={() => moverCategoria(grupo.id, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"><ArrowDown size={15} /></button>
                  </div>
                  {(categoriasAbertas[grupo.id] ?? true) && <div className="space-y-2 border-t border-slate-700/70 p-2">
                  {grupo.itens.map((item) => (
                  <div key={item.licencaId} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${item.selecionado ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => toggleItem(item.licencaId)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.selecionado ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-slate-500'}`}>{item.selecionado && <CheckSquare size={14} className="text-slate-950" />}</button>
                      <div>
                        <p className={`font-medium ${item.selecionado ? 'text-white' : 'text-slate-400'}`}>{item.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.categoriaNome && <Tag variant="default" className="text-[10px]">{item.categoriaNome}</Tag>}
                          {item.tipo === 'quantificavel' ? <Tag variant="info" className="text-[10px] flex items-center gap-0.5"><Hash size={10} /> Quantificável</Tag> : <Tag variant="warning" className="text-[10px] flex items-center gap-0.5"><CheckSquare size={10} /> Checkbox</Tag>}
                          <span className="text-xs text-emerald-400">{formatarValor(item.valorUnitario)}{item.tipo === 'quantificavel' && ' / un'}</span>
                        </div>
                      </div>
                    </div>
                    {item.tipo === 'quantificavel' && item.selecionado && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => alterarQuantidade(item.licencaId, -1)} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"><Minus size={14} /></button>
                        <span className="w-8 text-center font-semibold text-white">{item.quantidade}</span>
                        <button type="button" onClick={() => alterarQuantidade(item.licencaId, 1)} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"><PlusIcon size={14} /></button>
                      </div>
                    )}
                    {item.selecionado && <span className="text-emerald-400 font-semibold text-sm">{formatarValor(item.valorUnitario * item.quantidade)}</span>}
                  </div>
                  ))}
                  </div>}
                </div>)}
              </div>
            )}
            {form.itens.length > 0 && <div className="flex justify-end pt-2"><div className="text-right"><p className="text-xs text-slate-500">Subtotal adicionais</p><p className="text-lg font-bold text-emerald-400">{formatarValor(subtotal)}</p></div></div>}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Eye size={20} className="text-emerald-400" />Resumo da Cotação</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-500 mb-1">Lead</p><p className="text-white font-medium">{leadSelecionado?.razaoSocial || '—'}</p><p className="text-xs text-slate-400">{leadSelecionado?.nomeFantasia || ''}</p></div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-500 mb-1">Produto</p><p className="text-white font-medium flex items-center gap-2">{form.tipoProduto === 'cloudfy' ? <><Cloud size={16} className="text-sky-400" /> Cloudfy Premium</> : <><Cpu size={16} className="text-purple-400" /> Cplug</>}</p>{pacoteSelecionado && <p className="text-xs text-slate-400 mt-1">{pacoteSelecionado.nome}</p>}</div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-500 mb-1">Categoria</p><p className="text-white font-medium">{categoriaSelecionada?.nome || '—'}</p></div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-500 mb-1">Desconto</p><p className="text-white font-medium">{parseFloat(form.descontoPercentual.replace(',', '.')) || 0}%</p>{form.observacaoDesconto && <p className="text-xs text-slate-400 mt-1">{form.observacaoDesconto}</p>}</div>
              </div>
              {form.itens.filter((i) => i.selecionado).length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Itens selecionados</p>
                  <div className="space-y-2">
                    {form.itens.filter((i) => i.selecionado).map((item) => (
                      <div key={item.licencaId} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{item.nome}{item.tipo === 'quantificavel' && <span className="text-slate-500 ml-1">× {item.quantidade}</span>}</span>
                        <span className="text-emerald-400 font-medium">{formatarValor(item.valorUnitario * item.quantidade)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white">{formatarValor(subtotal)}</span></div>
                  {descontoValor > 0 && <div className="flex justify-between text-sm"><span className="text-amber-400">Desconto ({parseFloat(form.descontoPercentual.replace(',', '.')) || 0}%)</span><span className="text-amber-400">-{formatarValor(descontoValor)}</span></div>}
                  <div className="border-t border-slate-700 pt-3 mt-2"><div className="flex justify-between items-center"><span className="text-lg font-semibold text-white">Total</span><span className="text-2xl font-bold text-emerald-400">{formatarValor(total)}</span></div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
          <Button type="button" variant="outline" onClick={voltar} disabled={step === 1} className="flex items-center gap-2"><ChevronLeft size={16} /> Voltar</Button>
          {step < 6 ? <Button type="button" onClick={avancar} className="flex items-center gap-2">Avançar <ChevronRight size={16} /></Button> : <Button type="button" onClick={handleSubmit} disabled={salvando} className="flex items-center gap-2"><Save size={18} />{salvando ? 'Salvando...' : isEdicao ? 'Salvar' : 'Finalizar'}</Button>}
        </div>
      </Card>
    </div>
  );
}
