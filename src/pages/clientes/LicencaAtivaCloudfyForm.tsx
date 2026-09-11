import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClienteLicencaCloudfy } from '@/hooks/useClienteLicencaCloudfy';
import { parseValorMonetario } from '@/utils/calculos';
import { formatarEntradaMonetaria, formatarNumeroMonetario } from '@/utils/formatters';

interface ModuloFormValue {
  ativo: boolean;
  quantidade: number;
  label?: string;
}

interface FormData {
  clienteNome: string;
  nomeFantasia: string;
  cnpj: string;
  categoriaNome: string;
  quantidade: string;
  valorMensal: string;
  dataAtivacao: string;
  status: 'ativa' | 'inativa' | 'pendente' | 'expirada';
  observacoes: string;
  responsavel: string;
  unidade: string;
  modulos: Record<string, ModuloFormValue | boolean>;
}

const licencasPadrao = [
  { key: 'pdvPro', label: 'PDV PRO' },
  { key: 'pdvBlue', label: 'PDV Blue' },
  { key: 'termFixo', label: 'Term Fixo' },
  { key: 'termTenc', label: 'Term Móvel' },
  { key: 'appDeliv', label: 'App Deliv' },
  { key: 'rappi', label: 'Rappi' },
  { key: 'pdvMovel', label: 'PDV móvel' },
  { key: 'tef', label: 'TEF' },
  { key: 'qr5Meses', label: 'QR(5 meses)' },
  { key: 'fila', label: 'Filial' },
  { key: 'catraca', label: 'Catraca' },
  { key: 'ifood', label: 'Ifood' },
  { key: 'anotaAi', label: 'Anota AI' },
  { key: 'ninetyNineFood', label: '99food' },
  { key: 'keeta', label: 'Keeta' },
  { key: 'aconn', label: 'Aconn' },
  { key: 'kds', label: 'KDS' },
  { key: 'orcamento', label: 'Orçamento' },
  { key: 'suporte', label: 'Suporte' },
  { key: 'gestao', label: 'Gestão' },
  { key: 'analytics', label: 'Analytics' },
] as const;

const buildLabelFromKey = (key: string) => {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  const labels = normalized.split(/\s+/).filter(Boolean);

  const aliases: Record<string, string> = {
    pdv: 'PDV',
    tef: 'TEF',
    qr: 'QR',
    kds: 'KDS',
    ai: 'AI',
    ifood: 'Ifood',
    app: 'App',
    pro: 'PRO',
    blue: 'Blue',
  };

  return labels
    .map((part) => {
      const keyPart = part.toLowerCase();
      return aliases[keyPart] ?? (part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    })
    .join(' ');
};

const emptyModulos = Object.fromEntries(licencasPadrao.map(({ key, label }) => [key, { ativo: false, quantidade: 1, label }])) as Record<string, ModuloFormValue>;

const normalizeModulo = (value: boolean | number | string | ModuloFormValue | undefined): ModuloFormValue => {
  if (typeof value === 'boolean') {
    return { ativo: value, quantidade: value ? 1 : 0 };
  }

  if (typeof value === 'number') {
    return { ativo: value > 0, quantidade: value > 0 ? value : 0 };
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return { ativo: parsed > 0, quantidade: parsed > 0 ? parsed : 0 };
    }
    return { ativo: Boolean(value.trim()), quantidade: value.trim() ? 1 : 0 };
  }

  const obj = value as Partial<ModuloFormValue & { qtd?: number; count?: number }> | undefined;
  const hasExplicitAtivo = Object.prototype.hasOwnProperty.call(obj ?? {}, 'ativo');
  const explicitAtivo = Boolean(obj?.ativo);

  const quantityValue = obj?.quantidade;
  const fallbackQuantity = obj?.qtd;
  const alternativeQuantity = obj?.count;
  const quantidade = Number(quantityValue ?? fallbackQuantity ?? alternativeQuantity ?? 0);

  return {
    ativo: hasExplicitAtivo ? explicitAtivo : false,
    quantidade: quantidade > 0 ? quantidade : 0,
    label: obj?.label,
  };
};

const initialForm: FormData = {
  clienteNome: '',
  nomeFantasia: '',
  cnpj: '',
  categoriaNome: '',
  quantidade: '1',
  valorMensal: '0',
  dataAtivacao: '',
  status: 'ativa',
  observacoes: '',
  responsavel: '',
  unidade: '',
  modulos: emptyModulos,
};

export function LicencaAtivaCloudfyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { licencasAtivas, loading, criar, atualizar } = useClienteLicencaCloudfy();
  const [form, setForm] = useState<FormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [novaLicenca, setNovaLicenca] = useState('');
  const [quantidadeNovaLicenca, setQuantidadeNovaLicenca] = useState('1');
  const [opcoesLicenca, setOpcoesLicenca] = useState<Array<{ key: string; label: string }>>([...licencasPadrao]);

  useEffect(() => {
    if (!isEdit || licencasAtivas.length === 0) return;

    const item = licencasAtivas.find((licenca) => licenca.id === id);
    if (!item) return;

    const modulosBase = Object.fromEntries(
      licencasPadrao.map(({ key }) => [key, normalizeModulo((item.modulos ?? {})[key] ?? { ativo: false, quantidade: 0, label: key })])
    );

    const modulosExtras = Object.fromEntries(
      Object.entries(item.modulos ?? {}).filter(([key]) => !licencasPadrao.some((option) => option.key === key)).map(([key, value]) => [key, normalizeModulo(value as any)])
    );

    const modulos = { ...modulosBase, ...modulosExtras };

    const labelsExtras = Object.keys(modulos).reduce<Array<{ key: string; label: string }>>((acc, key) => {
      if (!licencasPadrao.some((option) => option.key === key)) {
        acc.push({ key, label: item.modulos?.[key] && typeof item.modulos[key] === 'object' && 'label' in item.modulos[key] ? (item.modulos[key] as any).label : buildLabelFromKey(key) });
      }
      return acc;
    }, []);

    setOpcoesLicenca((prev) => {
      const base = prev.filter((option) => licencasPadrao.some((itemOption) => itemOption.key === option.key));
      return [...base, ...labelsExtras];
    });

    setForm({
      clienteNome: item.clienteNome || '',
      nomeFantasia: item.nomeFantasia || '',
      cnpj: item.cnpj || '',
      categoriaNome: item.categoriaNome || '',
      quantidade: String(item.quantidade ?? 1),
      valorMensal: formatarNumeroMonetario(item.valorMensal ?? 0),
      dataAtivacao: item.dataAtivacao || '',
      status: item.status || 'ativa',
      observacoes: item.observacoes || '',
      responsavel: item.responsavel || '',
      unidade: item.unidade || '',
      modulos,
    });
  }, [id, isEdit, licencasAtivas]);

  const isDisabled = useMemo(() => loading || saving, [loading, saving]);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleModulo = (key: string, checked: boolean) => {
    setForm((prev) => {
      const atual = normalizeModulo(prev.modulos[key]);
      const label = atual.label || opcoesLicenca.find((option) => option.key === key)?.label || buildLabelFromKey(key);
      return {
        ...prev,
        modulos: {
          ...prev.modulos,
          [key]: {
            ativo: checked,
            quantidade: checked ? (atual.quantidade > 0 ? atual.quantidade : 1) : 0,
            label,
          },
        },
      };
    });
  };

  const handleQuantidadeModulo = (key: string, quantidade: number) => {
    setForm((prev) => {
      const atual = normalizeModulo(prev.modulos[key]);
      const proximaQuantidade = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;
      const label = atual.label || opcoesLicenca.find((option) => option.key === key)?.label || buildLabelFromKey(key);
      return {
        ...prev,
        modulos: {
          ...prev.modulos,
          [key]: {
            ativo: atual.ativo || quantidade > 0,
            quantidade: proximaQuantidade,
            label,
          },
        },
      };
    });
  };

  const handleAdicionarLicencaCustomizada = () => {
    const nome = novaLicenca.trim();
    if (!nome) return;

    const key = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `licenca-${Date.now()}`;
    const quantidade = Number(quantidadeNovaLicenca) > 0 ? Number(quantidadeNovaLicenca) : 1;

    setOpcoesLicenca((prev) => {
      if (prev.some((option) => option.key === key)) {
        return prev;
      }
      return [...prev, { key, label: nome }];
    });

    setForm((prev) => ({
      ...prev,
      modulos: {
        ...prev.modulos,
        [key]: {
          ativo: true,
          quantidade,
          label: nome,
        },
      },
    }));

    setNovaLicenca('');
    setQuantidadeNovaLicenca('1');
  };

  const handleAtualizarNomeOpcao = (key: string, label: string) => {
    const trimmedLabel = label.trim();

    setOpcoesLicenca((prev) => prev.map((option) => (option.key === key ? { ...option, label: trimmedLabel } : option)));
    setForm((prev) => {
      const atual = normalizeModulo(prev.modulos[key]);
      return {
        ...prev,
        modulos: {
          ...prev.modulos,
          [key]: {
            ...atual,
            label: trimmedLabel,
          },
        },
      };
    });
  };

  const sincronizarNomeModulos = (modulos: Record<string, ModuloFormValue | boolean>) => {
    return Object.fromEntries(
      Object.entries(modulos).map(([key, value]) => {
        const normalized = normalizeModulo(value as any);
        const nomeAtual = opcoesLicenca.find((option) => option.key === key)?.label?.trim();
        return [
          key,
          {
            ativo: normalized.ativo,
            quantidade: normalized.quantidade,
            label: nomeAtual || normalized.label || buildLabelFromKey(key),
          },
        ];
      })
    );
  };

  const moduloEntries = useMemo(() => {
    const base = opcoesLicenca.map(({ key, label }) => {
      const modulo = normalizeModulo(form.modulos[key]);
      return {
        key,
        label: modulo.label || label,
        ...modulo,
      };
    });

    const extras = Object.entries(form.modulos || {}).reduce<Array<{ key: string; label: string; ativo: boolean; quantidade: number }>>((acc, [key, value]) => {
      const fixedKeys = new Set<string>(opcoesLicenca.map(({ key: optionKey }) => optionKey));
      if (fixedKeys.has(key)) return acc;

      const modulo = normalizeModulo(value as any);
      acc.push({ key, label: modulo.label || buildLabelFromKey(key), ...modulo });
      return acc;
    }, []);

    return [...base, ...extras];
  }, [form.modulos, opcoesLicenca]);

  const licencasSelecionadas = moduloEntries.filter((item) => item.ativo).map((item) => `${item.label || buildLabelFromKey(item.key)} (${item.quantidade})`);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.clienteNome.trim()) {
      setError('Cliente é obrigatório.');
      return;
    }

    if (licencasSelecionadas.length === 0) {
      setError('Selecione pelo menos uma licença para o cliente.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clienteNome: form.clienteNome.trim(),
        nomeFantasia: form.nomeFantasia.trim(),
        cnpj: form.cnpj.trim(),
        licencaNome: licencasSelecionadas.join(', '),
        categoriaNome: form.categoriaNome.trim(),
        quantidade: Number(form.quantidade || 1),
        valorMensal: parseValorMonetario(form.valorMensal) ?? 0,
        dataAtivacao: form.dataAtivacao,
        status: form.status,
        observacoes: form.observacoes.trim(),
        responsavel: form.responsavel.trim(),
        unidade: form.unidade.trim(),
        modulos: sincronizarNomeModulos(form.modulos),
        ativo: form.status === 'ativa' || form.status === 'pendente',
      };

      if (isEdit && id) {
        await atualizar(id, payload);
      } else {
        await criar(payload);
      }

      navigate('/clientes/licencas-ativas');
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar a licença ativa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clientes/licencas-ativas')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdit ? 'Editar licença ativa' : 'Nova licença ativa'}</h1>
          <p className="text-slate-400 mt-1">Dados da licença do cliente no Cloudfy</p>
        </div>
      </div>

      <Card className="border-slate-600 bg-slate-700 p-6">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Cliente" value={form.clienteNome} onChange={(e) => handleChange('clienteNome', e.target.value)} placeholder="Ex: Empresa X" />
            <Input label="Nome fantasia" value={form.nomeFantasia} onChange={(e) => handleChange('nomeFantasia', e.target.value)} placeholder="Opcional" />
            <Input label="CNPJ" value={form.cnpj} onChange={(e) => handleChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            <Input label="Responsável" value={form.responsavel} onChange={(e) => handleChange('responsavel', e.target.value)} placeholder="Nome do contato" />
            <Input label="Categoria" value={form.categoriaNome} onChange={(e) => handleChange('categoriaNome', e.target.value)} placeholder="Ex: Financeiro" />
            <Input label="Quantidade" type="number" value={form.quantidade} onChange={(e) => handleChange('quantidade', e.target.value)} min={1} />
            <Input label="Valor mensal" value={form.valorMensal} onChange={(e) => handleChange('valorMensal', formatarEntradaMonetaria(e.target.value))} placeholder="0,00" />
            <Input label="Data de ativação" type="date" value={form.dataAtivacao} onChange={(e) => handleChange('dataAtivacao', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value as FormData['status'])}
                className="w-full rounded-lg border border-slate-700 bg-slate-850 px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="ativa">Ativa</option>
                <option value="pendente">Pendente</option>
                <option value="inativa">Inativa</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
            <Input label="Unidade" value={form.unidade} onChange={(e) => handleChange('unidade', e.target.value)} placeholder="Ex: Matriz/SP" />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-850/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Licenças do cliente</h3>
              <span className="text-xs text-slate-400">{licencasSelecionadas.length} selecionadas</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {moduloEntries.map(({ key, label, ativo, quantidade }) => (
                <div key={key} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500/40">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => handleToggleModulo(key, e.target.checked)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <input
                    value={label || ''}
                    onChange={(e) => handleAtualizarNomeOpcao(key, e.target.value)}
                    className="min-w-0 flex-1 rounded border border-slate-700 bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60"
                    placeholder="Nome da licença"
                  />
                  <input
                    type="number"
                    min={1}
                    value={quantidade || 1}
                    onChange={(e) => handleQuantidadeModulo(key, Number(e.target.value) || 1)}
                    disabled={!ativo}
                    className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-slate-600 bg-slate-900/60 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Adicionar outra licença</div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  value={novaLicenca}
                  onChange={(e) => setNovaLicenca(e.target.value)}
                  placeholder="Nome da licença personalizada"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  value={quantidadeNovaLicenca}
                  onChange={(e) => setQuantidadeNovaLicenca(e.target.value)}
                  className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
                <Button type="button" variant="outline" className="whitespace-nowrap" onClick={handleAdicionarLicencaCustomizada}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-850 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
              placeholder="Informações relevantes sobre o cliente, renovação, quantidade ou observações do contrato."
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-700/50 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/clientes/licencas-ativas')}>Cancelar</Button>
            <Button type="submit" disabled={isDisabled} className="flex items-center gap-2">
              <Save size={18} />
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar licença'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
