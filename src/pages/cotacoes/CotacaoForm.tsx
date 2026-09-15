import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useCotacao } from '../../hooks/useCotacao';
import { usePacoteCplug } from '../../hooks/usePacoteCplug';
import { useLicencaCloudfy } from '../../hooks/useLicencaCloudfy';
import { useLicencaCplug } from '../../hooks/useLicencaCplug';
import { useCategoriaCanal } from '../../hooks/useCategoriaCanal';
import { useCategoriaLicencaCloudfy } from '../../hooks/useCategoriaLicencaCloudfy';
import { useLead } from '../../hooks/useLead';
import { useAdicional } from '../../hooks/useAdicional';
import { useAuth } from '../../hooks/useAuth';
import { leadService } from '../../services/leadService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tag } from '../../components/ui/Tag';
import { PropostaPDF } from '../../components/pdf/PropostaPDF';
import { leadPodeReceberCotacao, rotulosStatusCotacao } from '../../utils/cotacaoRegras';
import { calcularResumoCotacao, gerarNumeroCotacao, parseValorMonetario } from '../../utils/calculos';
import { formatarEntradaMonetaria, formatarNumeroMonetario } from '../../utils/formatters';
import {
  ArrowLeft, Save, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown,
  ArrowUp, ArrowDown, User, Cloud, Cpu, TagIcon, Percent, Package,
  Eye, CheckSquare, Hash, Minus, Plus as PlusIcon, FileText, Wrench,
} from 'lucide-react';

interface Step5Item {
  licencaId: string;
  nome: string;
  categoriaNome?: string;
  tipo: 'checkbox' | 'quantificavel';
  valorUnitario: number;
  selecionado: boolean;
  quantidade: number;
}

interface Step5Adicional {
  adicionalId: string;
  nome: string;
  descricao?: string;
  valor: number;
  tipo: 'checkbox' | 'quantificavel';
  selecionado: boolean;
  quantidade: number;
}

interface ParcelaServico {
  numero: number;
  valor: number;
  dataVencimento: string;
}

interface FormState {
  leadId: string;
  tipoProduto: 'cloudfy' | 'cplug' | '';
  pacoteCplugId: string;
  categoriaCanalId: string;
  descontoPercentual: string;
  observacaoDesconto: string;
  itens: Step5Item[];
  adicionais: Step5Adicional[];
  parcelasServicos: ParcelaServico[];
}

type ResultadoLead = 'aberto' | 'ganho' | 'perdido';

const STEPS = [
  { num: 1, label: 'Lead', icon: User },
  { num: 2, label: 'Produto', icon: Package },
  { num: 3, label: 'Categoria', icon: TagIcon },
  { num: 4, label: 'Licenças', icon: CheckSquare },
  { num: 5, label: 'Serviços', icon: Wrench },
  { num: 6, label: 'Desconto', icon: Percent },
  { num: 7, label: 'Preview', icon: Eye },
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
  const { adicionais: adicionaisDisponiveis, fetchAdicionais } = useAdicional();
  const { userProfile } = useAuth();
  const leadsElegiveis = leads.filter((lead) => leadPodeReceberCotacao(lead.statusFunil));

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    leadId: '',
    tipoProduto: '',
    pacoteCplugId: '',
    categoriaCanalId: '',
    descontoPercentual: '0',
    observacaoDesconto: '',
    itens: [],
    adicionais: [],
    parcelasServicos: [],
  });
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({});
  const [ordemCategorias, setOrdemCategorias] = useState<string[]>([]);
  const [resultadoLead, setResultadoLead] = useState<ResultadoLead>('aberto');

  useEffect(() => { fetchLeads(); fetchAdicionais(); }, [fetchLeads, fetchAdicionais]);

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (!isEdicao && leadId) updateForm('leadId', leadId);
  }, [isEdicao, searchParams]);

  useEffect(() => {
    if (isEdicao && cotacoes.length > 0) {
      const cotacao = cotacoes.find((c) => c.id === id);
      if (cotacao) {
        setForm({
          leadId: cotacao.leadId || '',
          tipoProduto: cotacao.tipoProduto || '',
          pacoteCplugId: cotacao.pacoteCplugId || '',
          categoriaCanalId: cotacao.categoriaCanalId || '',
          descontoPercentual: (cotacao.descontoPercentual || 0).toString(),
          observacaoDesconto: cotacao.observacaoDesconto || '',
          itens: (cotacao.itensCplug || []).map((i) => ({
            licencaId: i.licencaId,
            nome: i.nome || 'Licença sem nome',
            categoriaNome: i.categoriaNome,
            tipo: i.tipo || 'checkbox',
            valorUnitario: Number(i.valorUnitario) || 0,
            selecionado: i.selecionado === true,
            quantidade: Math.max(1, Number(i.quantidade) || 1),
          })),
          adicionais: (cotacao.adicionais || []).map((a) => ({
            adicionalId: a.adicionalId,
            nome: a.nome,
            descricao: a.descricao,
            valor: Number(a.valor) || 0,
            tipo: a.tipo || 'checkbox',
            selecionado: a.selecionado === true,
            quantidade: Math.max(1, Number(a.quantidade) || 1),
          })),
          parcelasServicos: (cotacao.parcelasServicos || []).map((parcela) => ({
            numero: Number(parcela.numero) || 1,
            valor: Number(parcela.valor) || 0,
            dataVencimento: parcela.dataVencimento || '',
          })),
        });
      }
    }
  }, [isEdicao, id, cotacoes]);

  const updateForm = (field: keyof FormState, value: string | Step5Item[] | Step5Adicional[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (erros[field]) setErros((prev) => ({ ...prev, [field]: undefined }));
  };

  const leadSelecionado = leads.find((l) => l.id === form.leadId);
  const pacoteSelecionado = pacotes.find((p) => p.id === form.pacoteCplugId);
  const categoriaSelecionada = categorias.find((c) => c.id === form.categoriaCanalId);

  const validarStep = (s: number): boolean => {
    const novosErros: Partial<Record<keyof FormState, string>> = {};
    if (s === 1 && !form.leadId) novosErros.leadId = 'Selecione um lead';
    if (s === 1 && form.leadId && !leadPodeReceberCotacao(leadSelecionado?.statusFunil)) {
      novosErros.leadId = 'Este lead só poderá receber cotação nas fases Contato, Proposta ou Negociação';
    }
    if (s === 2 && !form.tipoProduto) novosErros.tipoProduto = 'Selecione o tipo';
    if (s === 2 && form.tipoProduto === 'cplug' && !form.pacoteCplugId) {
      novosErros.pacoteCplugId = 'Selecione um pacote';
    }
    if (s === 3 && !form.categoriaCanalId) novosErros.categoriaCanalId = 'Selecione uma categoria';
    if (s === 6) {
      const pct = parseFloat(form.descontoPercentual.replace(',', '.'));
      if (isNaN(pct) || pct < 0 || pct > 100) {
        novosErros.descontoPercentual = 'Desconto deve ser entre 0 e 100%';
      }
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const avancar = () => { if (validarStep(step)) setStep((s) => Math.min(s + 1, 7)); };
  const voltar = () => setStep((s) => Math.max(s - 1, 1));

  const resumo = useMemo(() => {
    const pct = parseFloat(form.descontoPercentual.replace(',', '.')) || 0;
    return calcularResumoCotacao(
      form.itens,
      form.adicionais,
      pct,
      categoriaSelecionada,
      form.tipoProduto || undefined
    );
  }, [form.itens, form.adicionais, form.descontoPercentual, categoriaSelecionada, form.tipoProduto]);

  const inicializarItens = () => {
    if (form.tipoProduto === 'cloudfy') {
      const ativos = licencasCloudfy.filter((l) => l.ativo !== false);
      setForm((prev) => ({
        ...prev,
        itens: ativos.map((l) => ({
          licencaId: l.id,
          nome: l.nome || 'Licença sem nome',
          categoriaNome: categoriasLicencas.find((c) => c.id === l.categoriaId)?.nome || l.categoriaNome,
          tipo: l.permiteMultiplasUnidades ? 'quantificavel' as const : 'checkbox' as const,
          valorUnitario: l.valor ?? l.valorIntegral ?? 0,
          selecionado: false,
          quantidade: 1,
        })),
      }));
    } else if (form.tipoProduto === 'cplug' && form.pacoteCplugId) {
      const pacote = pacotes.find((p) => p.id === form.pacoteCplugId);
      if (!pacote) return;
      const itens: Step5Item[] = [];
      (pacote.modulosOpcionais || []).forEach((m) => {
        itens.push({ licencaId: m.id, nome: m.nome, tipo: 'checkbox', valorUnitario: m.valor, selecionado: false, quantidade: 1 });
      });
      (pacote.itensQuantificaveis || []).forEach((m) => {
        itens.push({ licencaId: m.id, nome: m.nome, tipo: 'quantificavel', valorUnitario: m.valorUnitario, selecionado: false, quantidade: 1 });
      });
      const avulsas = licencasCplug.filter((l) => l.ativo !== false);
      avulsas.forEach((l) => {
        itens.push({
          licencaId: l.id,
          nome: l.nome || l.descricao || 'Licença sem nome',
          tipo: l.tipo || 'checkbox',
          valorUnitario: l.valor ?? l.valorIntegral ?? 0,
          selecionado: false,
          quantidade: 1,
        });
      });
      setForm((prev) => ({ ...prev, itens }));
    }
  };

  useEffect(() => {
    if (step === 4 && form.itens.length === 0) inicializarItens();
  }, [step, licencasCloudfy, licencasCplug, pacotes, categoriasLicencas]);

  const inicializarAdicionais = () => {
    const ativos = adicionaisDisponiveis.filter((a) => a.ativo !== false);
    setForm((prev) => ({
      ...prev,
      adicionais: ativos.map((a) => ({
        adicionalId: a.id,
        nome: a.nome,
        descricao: a.descricao,
        valor: a.valor,
        tipo: a.tipo,
        selecionado: false,
        quantidade: 1,
      })),
    }));
  };

  useEffect(() => {
    if (step === 5 && form.adicionais.length === 0) inicializarAdicionais();
  }, [step, adicionaisDisponiveis]);

  const toggleItem = (licencaId: string) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.map((i) => i.licencaId === licencaId ? { ...i, selecionado: !i.selecionado } : i),
    }));
  };

  const alterarQuantidade = (licencaId: string, delta: number) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.map((i) => i.licencaId === licencaId ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i),
    }));
  };

  const toggleAdicional = (adicionalId: string) => {
    setForm((prev) => ({
      ...prev,
      adicionais: prev.adicionais.map((a) => a.adicionalId === adicionalId ? { ...a, selecionado: !a.selecionado } : a),
    }));
  };

  const alterarQuantidadeAdicional = (adicionalId: string, delta: number) => {
    setForm((prev) => ({
      ...prev,
      adicionais: prev.adicionais.map((a) => a.adicionalId === adicionalId ? { ...a, quantidade: Math.max(1, a.quantidade + delta) } : a),
    }));
  };

  const alterarValorAdicional = (adicionalId: string, valor: string) => {
    const valorFormatado = formatarEntradaMonetaria(valor);
    const valorNumerico = parseValorMonetario(valorFormatado) ?? 0;
    setForm((prev) => ({
      ...prev,
      adicionais: prev.adicionais.map((a) => a.adicionalId === adicionalId
        ? { ...a, valor: Math.max(0, valorNumerico) }
        : a),
    }));
  };

  const moverItemSelecionado = (itemId: string, direcao: -1 | 1) => {
    setForm((prev) => {
      const itens = [...prev.itens];
      const indice = itens.findIndex((item) => item.licencaId === itemId);
      if (indice < 0) return prev;
      let destino = indice + direcao;
      while (destino >= 0 && destino < itens.length && !itens[destino].selecionado) destino += direcao;
      if (destino < 0 || destino >= itens.length) return prev;
      [itens[indice], itens[destino]] = [itens[destino], itens[indice]];
      return { ...prev, itens };
    });
  };

  const moverAdicionalSelecionado = (adicionalId: string, direcao: -1 | 1) => {
    setForm((prev) => {
      const adicionais = [...prev.adicionais];
      const indice = adicionais.findIndex((adicional) => adicional.adicionalId === adicionalId);
      if (indice < 0) return prev;
      let destino = indice + direcao;
      while (destino >= 0 && destino < adicionais.length && !adicionais[destino].selecionado) destino += direcao;
      if (destino < 0 || destino >= adicionais.length) return prev;
      [adicionais[indice], adicionais[destino]] = [adicionais[destino], adicionais[indice]];
      return { ...prev, adicionais };
    });
  };

  const atualizarParcela = (numero: number, campo: 'valor' | 'dataVencimento', valor: string) => {
    setForm((prev) => ({
      ...prev,
      parcelasServicos: prev.parcelasServicos.map((parcela) => parcela.numero === numero
        ? { ...parcela, [campo]: campo === 'valor' ? Math.max(0, parseValorMonetario(formatarEntradaMonetaria(valor)) ?? 0) : valor }
        : parcela),
    }));
  };

  const gerarParcelasServicos = (quantidade: number) => {
    const total = resumo.totalServicos;
    const valorBase = quantidade > 0 ? Math.floor((total / quantidade) * 100) / 100 : 0;
    const hoje = new Date();
    const parcelas = Array.from({ length: quantidade }, (_, indice) => {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + indice + 1, hoje.getDate());
      const valor = indice === quantidade - 1 ? Math.max(0, total - valorBase * (quantidade - 1)) : valorBase;
      return {
        numero: indice + 1,
        valor: Number(valor.toFixed(2)),
        dataVencimento: data.toISOString().slice(0, 10),
      };
    });
    setForm((prev) => ({ ...prev, parcelasServicos: parcelas }));
  };

  const gruposDeItens = useMemo(() => {
    const grupos = new Map<string, { id: string; nome: string; itens: Step5Item[]; ordem: number }>();
    form.itens.forEach((item) => {
      const nome = item.categoriaNome || 'Sem categoria';
      const id = item.categoriaNome || '__sem_categoria__';
      const existente = grupos.get(id);
      if (existente) existente.itens.push(item);
      else grupos.set(id, { id, nome, itens: [item], ordem: categoriasLicencas.find((c) => c.nome === nome)?.ordem ?? 9999 });
    });
    const gruposOrdenados = [...grupos.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
    if (ordemCategorias.length !== gruposOrdenados.length) return gruposOrdenados;
    return gruposOrdenados.sort((a, b) => ordemCategorias.indexOf(a.id) - ordemCategorias.indexOf(b.id));
  }, [form.itens, categoriasLicencas, ordemCategorias]);

  useEffect(() => {
    const idsAtuais = gruposDeItens.map((grupo) => grupo.id);
    setOrdemCategorias((atual) =>
      atual.length === idsAtuais.length && atual.every((id) => idsAtuais.includes(id)) ? atual : idsAtuais
    );
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
    setErroGeral(null);
    setSalvando(true);
    try {
      if (!leadPodeReceberCotacao(leadSelecionado?.statusFunil)) {
        setErroGeral('O lead precisa estar nas fases Contato, Proposta ou Negociação para receber uma cotação.');
        return;
      }
      if (form.parcelasServicos.length > 0) {
        const totalParcelado = form.parcelasServicos.reduce((total, parcela) => total + parcela.valor, 0);
        if (Math.abs(totalParcelado - resumo.totalServicos) > 0.01) {
          setErroGeral('O total das parcelas precisa ser igual ao total dos serviços.');
          return;
        }
        if (form.parcelasServicos.some((parcela) => !parcela.dataVencimento)) {
          setErroGeral('Informe a data de vencimento de todas as parcelas.');
          return;
        }
      }

      const numero = isEdicao ? cotacoes.find((c) => c.id === id)?.numero : gerarNumeroCotacao();

      const payload = {
        leadId: form.leadId,
        vendedorId: userProfile?.uid,
        vendedorNome: userProfile?.nome || userProfile?.email || '',
        vendedorTelefone: userProfile?.telefone || '',
        vendedorEmail: userProfile?.email || '',
        nomeLead: leadSelecionado?.razaoSocial || '',
        tipoProduto: form.tipoProduto as 'cloudfy' | 'cplug',
        pacoteCplugId: form.tipoProduto === 'cplug' ? form.pacoteCplugId : undefined,
        categoriaCanalId: form.categoriaCanalId,
        categoriaCanalNome: categoriaSelecionada?.nome || '',
        percentualRoyalties: resumo.percentualRoyalties,
        descontoPercentual: parseFloat(form.descontoPercentual.replace(',', '.')) || 0,
        observacaoDesconto: form.observacaoDesconto || undefined,
        itensCplug: form.itens.map((i) => ({
          licencaId: i.licencaId,
          nome: i.nome,
          categoriaNome: i.categoriaNome,
          tipo: i.tipo,
          valorUnitario: i.valorUnitario,
          quantidade: i.quantidade,
          selecionado: i.selecionado,
        })),
        adicionais: form.adicionais.map((a) => ({
          adicionalId: a.adicionalId,
          nome: a.nome,
          descricao: a.descricao,
          valor: a.valor,
          tipo: a.tipo,
          quantidade: a.quantidade,
          selecionado: a.selecionado,
        })),
        parcelasServicos: form.parcelasServicos,
        mensalidadeIntegral: resumo.subtotalLicencas,
        descontoGlobal: resumo.descontoValor,
        totalMensalidade: resumo.totalMensalidade,
        totalRoyalties: resumo.totalRoyalties,
        margemLiquida: resumo.margemLiquida,
        valorTotal: resumo.totalGeral,
        valorServicos: resumo.totalServicos,
        status: 'rascunho' as const,
        numero,
      };

      if (isEdicao) await atualizar(id!, payload);
      else await criar(payload);
      if (resultadoLead !== 'aberto') {
        await leadService.updateStatusFunil(form.leadId, resultadoLead === 'ganho' ? 'fechado_ganho' : 'fechado_perdido');
      }
      navigate('/cotacoes');
    } catch (err) {
      setErroGeral('Erro ao salvar cotação.');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const formatarValorLocal = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (isEdicao && loadingCotacoes) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const cotacaoParaPDF = isEdicao && cotacoes.length > 0 ? cotacoes.find((c) => c.id === id) : undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cotacoes')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={18} />
        </Button>
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
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                isCompleted ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800/50 text-slate-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-emerald-500 text-slate-950' :
                  isCompleted ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-700 text-slate-500'
                }`}>
                  {isCompleted ? '✓' : s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && <ChevronRight size={16} className="text-slate-600 shrink-0" />}
            </div>
          );
        })}
      </div>

      <Card className="p-6">
        {erroGeral && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />{erroGeral}
          </div>
        )}

        {/* PASSO 1 — LEAD */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User size={20} className="text-emerald-400" />Selecione o Lead</h2>
            <div className="grid gap-3">
              {leadsElegiveis.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => updateForm('leadId', lead.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-colors ${
                    form.leadId === lead.id ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.leadId === lead.id ? 'border-emerald-500' : 'border-slate-600'
                  }`}>
                    {form.leadId === lead.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{lead.razaoSocial}</p>
                    <p className="text-sm text-slate-400">{lead.nomeFantasia || lead.contatoNome || 'Sem nome fantasia'} · {rotulosStatusCotacao[lead.statusFunil]}</p>
                  </div>
                </button>
              ))}
            </div>
            {leadsElegiveis.length === 0 && <p className="text-sm text-amber-400">Nenhum lead está em uma fase elegível para cotação.</p>}
            {erros.leadId && <p className="text-sm text-red-400">{erros.leadId}</p>}
          </div>
        )}

        {/* PASSO 2 — PRODUTO */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Package size={20} className="text-emerald-400" />Selecione o Produto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { updateForm('tipoProduto', 'cloudfy'); updateForm('pacoteCplugId', ''); updateForm('itens', []); }}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-colors ${
                  form.tipoProduto === 'cloudfy' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Cloud size={32} />
                <span className="font-semibold">Cloudfy Premium</span>
                <span className="text-xs opacity-70">Licenças avulsas</span>
              </button>
              <button
                type="button"
                onClick={() => { updateForm('tipoProduto', 'cplug'); updateForm('itens', []); }}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-colors ${
                  form.tipoProduto === 'cplug' ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Cpu size={32} />
                <span className="font-semibold">Cplug</span>
                <span className="text-xs opacity-70">Pacotes + licenças</span>
              </button>
            </div>
            {erros.tipoProduto && <p className="text-sm text-red-400">{erros.tipoProduto}</p>}
            {form.tipoProduto === 'cplug' && (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-medium text-slate-300">Selecione o pacote:</h3>
                <div className="grid gap-2">
                  {pacotes.filter((p) => p.ativo !== false).map((pacote) => (
                    <button
                      key={pacote.id}
                      type="button"
                      onClick={() => { updateForm('pacoteCplugId', pacote.id); updateForm('itens', []); }}
                      className={`flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${
                        form.pacoteCplugId === pacote.id ? 'bg-purple-500/10 border-purple-500/40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          form.pacoteCplugId === pacote.id ? 'border-purple-500' : 'border-slate-600'
                        }`}>
                          {form.pacoteCplugId === pacote.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-white">{pacote.nome}</p>
                          <p className="text-xs text-slate-500">{(pacote.modulosFixos?.length || 0)} fixos · {(pacote.modulosOpcionais?.length || 0)} opcionais · {(pacote.itensQuantificaveis?.length || 0)} quantificáveis</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 font-semibold">{formatarValorLocal(pacote.valorBase)}</span>
                    </button>
                  ))}
                </div>
                {erros.pacoteCplugId && <p className="text-sm text-red-400">{erros.pacoteCplugId}</p>}
              </div>
            )}
          </div>
        )}

        {/* PASSO 3 — CATEGORIA */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><TagIcon size={20} className="text-emerald-400" />Categoria de Canal</h2>
            <p className="text-slate-400 text-sm">Selecione a origem desta oportunidade</p>
            <div className="grid gap-2">
              {categorias.filter((c) => c.ativo !== false).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateForm('categoriaCanalId', cat.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                    form.categoriaCanalId === cat.id ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.categoriaCanalId === cat.id ? 'border-emerald-500' : 'border-slate-600'
                  }`}>
                    {form.categoriaCanalId === cat.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{cat.nome}</p>
                    {cat.descricao && <p className="text-xs text-slate-500">{cat.descricao}</p>}
                    <p className="text-xs text-amber-400 mt-0.5">Royalties: {cat.percentualRoyalties || 30}%</p>
                  </div>
                </button>
              ))}
            </div>
            {erros.categoriaCanalId && <p className="text-sm text-red-400">{erros.categoriaCanalId}</p>}
          </div>
        )}

        {/* PASSO 4 — LICENÇAS */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckSquare size={20} className="text-emerald-400" />
                {form.tipoProduto === 'cloudfy' ? 'Licenças Cloudfy' : 'Licenças e Itens'}
              </h2>
              {form.tipoProduto === 'cplug' && pacoteSelecionado && (
                <Tag variant="info" className="text-xs">Pacote: {pacoteSelecionado.nome}</Tag>
              )}
            </div>
            {form.itens.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhum item disponível. Volte e selecione um produto/pacote.</div>
            ) : (
              <div className="space-y-3">
                {gruposDeItens.map((grupo, grupoIndex) => (
                  <div key={grupo.id} className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => setCategoriasAbertas((atual) => ({ ...atual, [grupo.id]: !(atual[grupo.id] ?? true) }))}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <span className="flex items-center gap-2 font-semibold text-white">
                          {(categoriasAbertas[grupo.id] ?? true) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          {grupo.nome}
                          <span className="text-xs font-normal text-slate-500">{grupo.itens.length} {grupo.itens.length === 1 ? 'item' : 'itens'}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        title="Mover categoria para cima"
                        disabled={grupoIndex === 0}
                        onClick={() => moverCategoria(grupo.id, -1)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        title="Mover categoria para baixo"
                        disabled={grupoIndex === gruposDeItens.length - 1}
                        onClick={() => moverCategoria(grupo.id, 1)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                    {(categoriasAbertas[grupo.id] ?? true) && (
                      <div className="space-y-2 border-t border-slate-700/70 p-2">
                        {grupo.itens.map((item) => (
                          <div
                            key={item.licencaId}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              item.selecionado ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-800 border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleItem(item.licencaId)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  item.selecionado ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-slate-500'
                                }`}
                              >
                                {item.selecionado && <CheckSquare size={14} className="text-slate-950" />}
                              </button>
                              <div>
                                <p className={`font-medium ${item.selecionado ? 'text-white' : 'text-slate-400'}`}>{item.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.categoriaNome && <Tag variant="default" className="text-[10px]">{item.categoriaNome}</Tag>}
                                  {item.tipo === 'quantificavel' ? (
                                    <Tag variant="info" className="text-[10px] flex items-center gap-0.5"><Hash size={10} /> Quantificável</Tag>
                                  ) : (
                                    <Tag variant="warning" className="text-[10px] flex items-center gap-0.5"><CheckSquare size={10} /> Checkbox</Tag>
                                  )}
                                  <span className="text-xs text-emerald-400">{formatarValorLocal(item.valorUnitario)}{item.tipo === 'quantificavel' && ' / un'}</span>
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
                            {item.selecionado && (
                              <span className="text-emerald-400 font-semibold text-sm">{formatarValorLocal(item.valorUnitario * item.quantidade)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {form.itens.length > 0 && (
              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Subtotal licenças</p>
                  <p className="text-lg font-bold text-emerald-400">{formatarValorLocal(resumo.subtotalLicencas)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASSO 5 — SERVIÇOS/ADICIONAIS */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wrench size={20} className="text-emerald-400" />Serviços Adicionais
            </h2>
            <p className="text-slate-400 text-sm">Selecione os serviços que serão incluídos na proposta (pagamento único, sem desconto).</p>
            {form.adicionais.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhum serviço cadastrado. Cadastre serviços em /adicionais.</div>
            ) : (
              <div className="space-y-2">
                {form.adicionais.map((adicional) => (
                  <div
                    key={adicional.adicionalId}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      adicional.selecionado ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleAdicional(adicional.adicionalId)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          adicional.selecionado ? 'bg-amber-500 border-amber-500' : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {adicional.selecionado && <CheckSquare size={14} className="text-slate-950" />}
                      </button>
                      <div>
                        <p className={`font-medium ${adicional.selecionado ? 'text-white' : 'text-slate-400'}`}>{adicional.nome}</p>
                        {adicional.descricao && <p className="text-xs text-slate-500">{adicional.descricao}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          {adicional.tipo === 'quantificavel' ? (
                            <Tag variant="info" className="text-[10px] flex items-center gap-0.5"><Hash size={10} /> Quantificável</Tag>
                          ) : (
                            <Tag variant="warning" className="text-[10px] flex items-center gap-0.5"><CheckSquare size={10} /> Único</Tag>
                          )}
                          <div className="flex items-center gap-2">
                            <label htmlFor={`valor-adicional-${adicional.adicionalId}`} className="sr-only">Valor do serviço {adicional.nome}</label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                              <input
                                id={`valor-adicional-${adicional.adicionalId}`}
                                type="text"
                                inputMode="decimal"
                                value={formatarNumeroMonetario(adicional.valor)}
                                onChange={(e) => alterarValorAdicional(adicional.adicionalId, e.target.value)}
                                className="w-24 rounded border border-slate-600 bg-slate-900/60 py-1 pl-7 pr-2 text-right text-xs text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                              />
                            </div>
                            {adicional.tipo === 'quantificavel' && <span className="text-xs text-slate-500">/ un</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    {adicional.tipo === 'quantificavel' && adicional.selecionado && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => alterarQuantidadeAdicional(adicional.adicionalId, -1)} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"><Minus size={14} /></button>
                        <span className="w-8 text-center font-semibold text-white">{adicional.quantidade}</span>
                        <button type="button" onClick={() => alterarQuantidadeAdicional(adicional.adicionalId, 1)} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"><PlusIcon size={14} /></button>
                      </div>
                    )}
                    {adicional.selecionado && (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <button type="button" title="Mover serviço para cima" onClick={() => moverAdicionalSelecionado(adicional.adicionalId, -1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"><ArrowUp size={13} /></button>
                          <button type="button" title="Mover serviço para baixo" onClick={() => moverAdicionalSelecionado(adicional.adicionalId, 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"><ArrowDown size={13} /></button>
                        </div>
                        <span className="text-amber-400 font-semibold text-sm">{formatarValorLocal(adicional.valor * adicional.quantidade)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {form.adicionais.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">Parcelamento dos serviços</p>
                      <p className="text-xs text-slate-500">Informe a quantidade, o valor e a data de vencimento de cada parcela.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="quantidade-parcelas" className="text-sm text-slate-400">Parcelas</label>
                      <input
                        id="quantidade-parcelas"
                        type="number"
                        min="1"
                        max="48"
                        value={form.parcelasServicos.length || 1}
                        onChange={(e) => gerarParcelasServicos(Math.min(48, Math.max(1, Number(e.target.value) || 1)))}
                        className="w-16 rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-center text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                      <Button type="button" variant="outline" onClick={() => gerarParcelasServicos(form.parcelasServicos.length || 1)} className="text-xs">Recalcular</Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {form.parcelasServicos.map((parcela) => (
                      <div key={parcela.numero} className="grid grid-cols-[auto_1fr_1fr] items-center gap-3 rounded border border-slate-700/70 bg-slate-900/40 p-2">
                        <span className="w-8 text-center text-sm font-medium text-slate-400">{parcela.numero}ª</span>
                        <div>
                          <label htmlFor={`valor-parcela-${parcela.numero}`} className="sr-only">Valor da parcela {parcela.numero}</label>
                          <input id={`valor-parcela-${parcela.numero}`} type="text" inputMode="decimal" value={formatarNumeroMonetario(parcela.valor)} onChange={(e) => atualizarParcela(parcela.numero, 'valor', e.target.value)} className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none" />
                        </div>
                        <div>
                          <label htmlFor={`data-parcela-${parcela.numero}`} className="sr-only">Vencimento da parcela {parcela.numero}</label>
                          <input id={`data-parcela-${parcela.numero}`} type="date" value={parcela.dataVencimento} onChange={(e) => atualizarParcela(parcela.numero, 'dataVencimento', e.target.value)} className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end text-sm">
                    <span className="text-slate-400">Total parcelado: </span>
                    <span className={`ml-1 font-semibold ${form.parcelasServicos.reduce((total, parcela) => total + parcela.valor, 0).toFixed(2) === resumo.totalServicos.toFixed(2) ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatarValorLocal(form.parcelasServicos.reduce((total, parcela) => total + parcela.valor, 0))} / {formatarValorLocal(resumo.totalServicos)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total serviços (sem desconto)</p>
                  <p className="text-lg font-bold text-amber-400">{formatarValorLocal(resumo.totalServicos)}</p>
                </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASSO 6 — DESCONTO */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Percent size={20} className="text-emerald-400" />Desconto</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Percentual de desconto (%)</label>
              <div className="relative max-w-xs">
                <Input
                  value={form.descontoPercentual}
                  onChange={(e) => updateForm('descontoPercentual', e.target.value)}
                  placeholder="0"
                  className={`${erros.descontoPercentual ? 'border-red-500' : ''} pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              {erros.descontoPercentual && <p className="mt-1 text-sm text-red-400">{erros.descontoPercentual}</p>}
              <p className="mt-2 text-xs text-slate-500">O desconto aplica apenas sobre as licenças mensais. Serviços não sofrem desconto.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Observação sobre o desconto</label>
              <textarea
                value={form.observacaoDesconto}
                onChange={(e) => updateForm('observacaoDesconto', e.target.value)}
                placeholder="Ex: Desconto concedido por volume..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* PASSO 7 — PREVIEW */}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Eye size={20} className="text-emerald-400" />Resumo da Cotação</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Lead</p>
                  <p className="text-white font-medium">{leadSelecionado?.razaoSocial || '—'}</p>
                  <p className="text-xs text-slate-400">{leadSelecionado?.nomeFantasia || ''}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Produto</p>
                  <p className="text-white font-medium flex items-center gap-2">
                    {form.tipoProduto === 'cloudfy' ? <><Cloud size={16} className="text-sky-400" /> Cloudfy Premium</> : <><Cpu size={16} className="text-purple-400" /> Cplug</>}
                  </p>
                  {pacoteSelecionado && <p className="text-xs text-slate-400 mt-1">{pacoteSelecionado.nome}</p>}
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Categoria</p>
                  <p className="text-white font-medium">{categoriaSelecionada?.nome || '—'}</p>
                  <p className="text-xs text-amber-400 mt-0.5">Royalties: {resumo.percentualRoyalties}%</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Desconto</p>
                  <p className="text-white font-medium">{parseFloat(form.descontoPercentual.replace(',', '.')) || 0}%</p>
                  {form.observacaoDesconto && <p className="text-xs text-slate-400 mt-1">{form.observacaoDesconto}</p>}
                </div>
              </div>

              {/* Itens selecionados */}
              {form.itens.filter((i) => i.selecionado).length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Licenças selecionadas</p>
                  <div className="space-y-2">
                    {form.itens.filter((i) => i.selecionado).map((item, itemIndex, itensSelecionados) => (
                      <div key={item.licencaId} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{item.nome}{item.tipo === 'quantificavel' && <span className="text-slate-500 ml-1">× {item.quantidade}</span>}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <button type="button" title="Mover licença para cima" disabled={itemIndex === 0} onClick={() => moverItemSelecionado(item.licencaId, -1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"><ArrowUp size={13} /></button>
                            <button type="button" title="Mover licença para baixo" disabled={itemIndex === itensSelecionados.length - 1} onClick={() => moverItemSelecionado(item.licencaId, 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"><ArrowDown size={13} /></button>
                          </div>
                          <span className="text-emerald-400 font-medium">{formatarValorLocal(item.valorUnitario * item.quantidade)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serviços selecionados */}
              {form.adicionais.filter((a) => a.selecionado).length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Serviços adicionais</p>
                  <div className="space-y-2">
                    {form.adicionais.filter((a) => a.selecionado).map((adicional, adicionalIndex, adicionaisSelecionados) => (
                      <div key={adicional.adicionalId} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{adicional.nome}{adicional.tipo === 'quantificavel' && <span className="text-slate-500 ml-1">× {adicional.quantidade}</span>}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <button type="button" title="Mover serviço para cima" disabled={adicionalIndex === 0} onClick={() => moverAdicionalSelecionado(adicional.adicionalId, -1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"><ArrowUp size={13} /></button>
                            <button type="button" title="Mover serviço para baixo" disabled={adicionalIndex === adicionaisSelecionados.length - 1} onClick={() => moverAdicionalSelecionado(adicional.adicionalId, 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30"><ArrowDown size={13} /></button>
                          </div>
                          <span className="text-amber-400 font-medium">{formatarValorLocal(adicional.valor * adicional.quantidade)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.parcelasServicos.length > 0 && resumo.totalServicos > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Parcelamento dos serviços</p>
                  <div className="space-y-2">
                    {form.parcelasServicos.map((parcela) => (
                      <div key={parcela.numero} className="flex justify-between text-sm">
                        <span className="text-slate-300">{parcela.numero}ª parcela{parcela.dataVencimento && ` · ${new Date(`${parcela.dataVencimento}T00:00:00`).toLocaleDateString('pt-BR')}`}</span>
                        <span className="text-amber-400 font-medium">{formatarValorLocal(parcela.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo financeiro */}
              <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal licenças</span><span className="text-white">{formatarValorLocal(resumo.subtotalLicencas)}</span></div>
                  {resumo.descontoValor > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-amber-400">Desconto ({parseFloat(form.descontoPercentual.replace(',', '.')) || 0}%)</span><span className="text-amber-400">-{formatarValorLocal(resumo.descontoValor)}</span></div>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Total mensalidade</span><span className="text-white">{formatarValorLocal(resumo.totalMensalidade)}</span></div>
                  {resumo.totalServicos > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Total serviços (pagamento único)</span><span className="text-amber-400">{formatarValorLocal(resumo.totalServicos)}</span></div>
                  )}
                  <div className="border-t border-slate-700 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total Geral</span>
                      <span className="text-2xl font-bold text-emerald-400">{formatarValorLocal(resumo.totalGeral)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm font-medium text-white mb-1">Resultado do lead</p>
                <p className="text-xs text-slate-500 mb-3">Ao marcar Ganho ou Perdido, o lead será retirado do funil ativo e arquivado.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    { value: 'aberto' as const, label: 'Em negociação', style: 'border-slate-600 text-slate-300' },
                    { value: 'ganho' as const, label: 'Ganho', style: 'border-emerald-500/50 text-emerald-400' },
                    { value: 'perdido' as const, label: 'Perdido', style: 'border-red-500/50 text-red-400' },
                  ]).map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => setResultadoLead(opcao.value)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${opcao.style} ${resultadoLead === opcao.value ? 'bg-white/10 ring-1 ring-current' : 'bg-slate-900/40 hover:bg-slate-700/50'}`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visão interna — Royalties */}
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Visão interna — Royalties</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Total mensalidade</span><span className="text-white">{formatarValorLocal(resumo.totalMensalidade)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Royalties ({resumo.percentualRoyalties}%)</span><span className="text-red-400">-{formatarValorLocal(resumo.totalRoyalties)}</span></div>
                  <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-1">
                    <span className="text-slate-300 font-medium">Margem líquida</span>
                    <span className="text-emerald-400 font-bold">{formatarValorLocal(resumo.margemLiquida)}</span>
                  </div>
                </div>
              </div>

              {/* Botão Gerar PDF */}
              {leadSelecionado && (
                <div className="flex justify-end">
                  <PDFDownloadLink
                    document={
                      <PropostaPDF
                        cotacao={{
                          ...cotacaoParaPDF,
                          id: id || 'preview',
                          leadId: form.leadId,
                          vendedorId: userProfile?.uid,
                          vendedorNome: userProfile?.nome || userProfile?.email || '',
                          vendedorTelefone: userProfile?.telefone || '',
                          vendedorEmail: userProfile?.email || '',
                          nomeLead: leadSelecionado.razaoSocial,
                          tipoProduto: form.tipoProduto as 'cloudfy' | 'cplug',
                          categoriaCanalId: form.categoriaCanalId,
                          categoriaCanalNome: categoriaSelecionada?.nome,
                          descontoPercentual: parseFloat(form.descontoPercentual.replace(',', '.')) || 0,
                          observacaoDesconto: form.observacaoDesconto,
                          itensCplug: form.itens,
                          adicionais: form.adicionais,
                          parcelasServicos: form.parcelasServicos,
                          numero: cotacaoParaPDF?.numero || gerarNumeroCotacao(),
                        } as any}
                        lead={leadSelecionado}
                        categoriaCanal={categoriaSelecionada}
                        adicionaisDisponiveis={adicionaisDisponiveis}
                      />
                    }
                    fileName={`proposta-${(cotacaoParaPDF?.numero || 'preview').replace(/\//g, '-')}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="outline" className="flex items-center gap-2" disabled={loading}>
                        <FileText size={18} />
                        {loading ? 'Gerando PDF...' : 'Gerar Proposta PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
          <Button type="button" variant="outline" onClick={voltar} disabled={step === 1} className="flex items-center gap-2">
            <ChevronLeft size={16} /> Voltar
          </Button>
          {step < 7 ? (
            <Button type="button" onClick={avancar} className="flex items-center gap-2">
              Avançar <ChevronRight size={16} />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button type="button" onClick={handleSubmit} disabled={salvando} className="flex items-center gap-2">
                <Save size={18} />{salvando ? 'Salvando...' : isEdicao ? 'Salvar' : 'Finalizar'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}