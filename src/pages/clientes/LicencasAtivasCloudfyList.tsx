import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Plus, Search, Users, UserX, WalletCards } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { useClienteLicencaCloudfy } from '@/hooks/useClienteLicencaCloudfy';

const spreadsheetColumns = [
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'nome', label: 'Nome' },
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
  { key: 'catraca', label: 'catraca' },
  { key: 'ifood', label: 'Ifood' },
  { key: 'anotaAi', label: 'Anota AI' },
  { key: 'ninetyNineFood', label: '99food' },
  { key: 'keeta', label: 'keeta' },
  { key: 'aconn', label: 'Aconn' },
  { key: 'kds', label: 'KDS' },
] as const;

const moduleKeys = spreadsheetColumns.filter((column) => column.key !== 'cnpj' && column.key !== 'nome').map((column) => column.key);

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && String(value).trim() !== '') return asNumber;
  return String(value).trim();
};

const getColumnValue = (record: Record<string, unknown>, key: string) => {
  const aliases: string[] = [
    key,
    key.replace(/([a-z])([A-Z])/g, '$1_$2'),
    key.replace(/_/g, ' '),
    key.toUpperCase(),
    key.toLowerCase(),
  ];

  const direct = aliases.find((alias) => Object.prototype.hasOwnProperty.call(record, alias));
  if (!direct) {
    return '';
  }

  return normalizeValue(record[direct]);
};

export function LicencasAtivasCloudfyList() {
  const navigate = useNavigate();
  const { licencasAtivas, loading, error, remover } = useClienteLicencaCloudfy();
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'ativos' | 'todos' | 'inativos'>('ativos');
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 20;

  const isRegistroAtivo = (item: (typeof licencasAtivas)[number]) =>
    item.ativo !== false && item.status !== 'inativa' && item.status !== 'expirada';

  const rows = useMemo(() => {
    return licencasAtivas
      .filter((item) => {
        const ativo = isRegistroAtivo(item);
        if (filtroStatus === 'ativos') return ativo;
        if (filtroStatus === 'inativos') return !ativo;
        return true;
      })
      .filter((item) => Boolean(item.clienteNome || item.nomeFantasia || item.cnpj))
      .map((item) => {
        const modulos = item.modulos ?? {};
        const base: Record<string, unknown> = {
          id: item.id,
          cnpj: item.cnpj || '',
          nome: item.clienteNome || item.nomeFantasia || '',
          status: item.status,
          ativo: item.ativo !== false,
        };

        moduleKeys.forEach((key) => {
          const value = modulos[key];
          const modulo = typeof value === 'boolean' ? { ativo: value, quantidade: value ? 1 : 0 } : value;
          const quantidade = typeof modulo === 'number'
            ? modulo
            : typeof modulo === 'string'
              ? Number(modulo) || 0
              : Number((modulo as { quantidade?: number; qtd?: number; count?: number } | undefined)?.quantidade ?? (modulo as { quantidade?: number; qtd?: number; count?: number } | undefined)?.qtd ?? (modulo as { quantidade?: number; qtd?: number; count?: number } | undefined)?.count ?? 0);
          const mod = typeof value === 'boolean' ? value : Boolean((value as { ativo?: boolean } | undefined)?.ativo);
          const fromString = typeof item.licencaNome === 'string' && item.licencaNome.toLowerCase().includes(key.replace(/([A-Z])/g, ' $1').toLowerCase());

          base[key] = mod || fromString ? (quantidade > 0 ? quantidade : 1) : '';
        });

        return {
          ...base,
          ...Object.fromEntries(Object.entries(item).map(([key, value]) => [key, normalizeValue(value)])),
        };
      });
  }, [filtroStatus, licencasAtivas]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((row) => {
      const haystack = `${row.nome ?? ''} ${row.cnpj ?? ''} ${row.licencaNome ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, search]);

  const resumo = useMemo(() => {
    const clientes = licencasAtivas.filter((item) => Boolean(item.clienteNome || item.nomeFantasia || item.cnpj));
    const clientesAtivos = clientes.filter(isRegistroAtivo);
    const ativos = clientesAtivos.length;
    const mensalidade = clientesAtivos.reduce((total, item) => total + (Number(item.valorMensal) || 0), 0);
    return { ativos, inativos: clientes.length - ativos, mensalidade, royalties: mensalidade / 2 };
  }, [licencasAtivas]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / registrosPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginaRows = filtered.slice((paginaAtual - 1) * registrosPorPagina, paginaAtual * registrosPorPagina);

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const alterarBusca = (value: string) => {
    setSearch(value);
    setPagina(1);
  };

  const alterarFiltro = (value: 'ativos' | 'todos' | 'inativos') => {
    setFiltroStatus(value);
    setPagina(1);
  };

  const exportar = () => {
    if (filtered.length === 0) return;

    const linhas = filtered.map((row) => {
      const cliente = String(row.nome ?? '');
      const cnpj = String(row.cnpj ?? '');

      const exportRow: Record<string, string | number> = {
        Cliente: cliente,
        CNPJ: cnpj,
        Status: row.ativo === false || row.status === 'inativa' || row.status === 'expirada' ? 'Inativo' : 'Ativo',
      };

      spreadsheetColumns.forEach((column) => {
        const value = getColumnValue(row, column.key);
        exportRow[column.label] = typeof value === 'number' ? value : String(value ?? '');
      });

      return exportRow;
    });

    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Licenças Ativas');
    XLSX.writeFile(livro, `licencas-ativas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getCellClass = (value: unknown) => {
    if (value === '' || value === null || value === undefined) {
      return 'bg-white text-slate-600';
    }

    return 'bg-white text-slate-800';
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Deseja remover esta licença ativa do cadastro?')) return;
    await remover(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenda HRP - Licenças ativas</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={exportar} disabled={filtered.length === 0}>
            <Download size={16} />
            Exportar
          </Button>
          <Button onClick={() => navigate('/clientes/licencas-ativas/nova')} className="flex items-center gap-2">
            <Plus size={16} />
            Nova licença
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={search}
              onChange={(e) => alterarBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 p-1">
            {([
              { key: 'ativos', label: 'Ativos' },
              { key: 'todos', label: 'Todos' },
              { key: 'inativos', label: 'Inativos' },
            ] as const).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => alterarFiltro(option.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtroStatus === option.key ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-700 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 px-3 py-2.5">
            <Users size={18} className="text-emerald-400" />
            <div><p className="text-lg font-semibold text-white">{resumo.ativos}</p><p className="text-xs text-slate-400">Clientes ativos</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 px-3 py-2.5">
            <UserX size={18} className="text-amber-400" />
            <div><p className="text-lg font-semibold text-white">{resumo.inativos}</p><p className="text-xs text-slate-400">Clientes inativos</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 px-3 py-2.5">
            <WalletCards size={18} className="text-blue-400" />
            <div><p className="text-lg font-semibold text-white">{formatarValor(resumo.mensalidade)}</p><p className="text-xs text-slate-400">Mensalidade total</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 px-3 py-2.5">
            <WalletCards size={18} className="text-violet-400" />
            <div><p className="text-lg font-semibold text-white">{formatarValor(resumo.royalties)}</p><p className="text-xs text-slate-400">Royalties (50%)</p></div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
          Carregando licenças...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
          <table className="min-w-max border-collapse">
            <thead>
              <tr className="bg-slate-700 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                {spreadsheetColumns.map((column) => (
                  <th key={column.key} className="min-w-[110px] border border-slate-600 px-2 py-2 text-left">
                    {column.label}
                  </th>
                ))}
                <th className="min-w-[120px] border border-slate-600 px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={spreadsheetColumns.length + 1} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma licença encontrada para a busca atual.
                  </td>
                </tr>
              ) : (
                paginaRows.map((row, index) => (
                  <tr key={`${row.cnpj ?? 'cliente'}-${index}`} className="bg-white hover:bg-slate-100">
                    {spreadsheetColumns.map((column) => {
                      const value = getColumnValue(row, column.key);
                      return (
                        <td key={`${column.key}-${index}`} className={`min-w-[110px] border border-slate-300 px-2 py-1 text-left text-[11px] ${getCellClass(value)}`}>
                          {value === '' ? '' : value}
                        </td>
                      );
                    })}
                    <td className="min-w-[120px] border border-slate-300 bg-slate-100 px-2 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/clientes/licencas-ativas/editar/${row.id ?? ''}`)}
                          className="rounded bg-emerald-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => typeof row.id === 'string' && handleRemove(row.id)}
                          className="rounded bg-red-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Exibindo {(paginaAtual - 1) * registrosPorPagina + 1}-{Math.min(paginaAtual * registrosPorPagina, filtered.length)} de {filtered.length} registros</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPagina((atual) => Math.max(1, atual - 1))} disabled={paginaAtual === 1} aria-label="Página anterior" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="min-w-[100px] text-center text-xs text-slate-300">Página {paginaAtual} de {totalPaginas}</span>
            <button type="button" onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))} disabled={paginaAtual === totalPaginas} aria-label="Próxima página" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
