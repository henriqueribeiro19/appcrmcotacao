import { useState, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { isValidCNPJ, isValidEmail, isValidPhone } from '@/utils/validators';

interface ImportPlanilhaProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>[]) => void;
}

type Etapa = 'upload' | 'mapeamento' | 'revisao';

interface CampoMapeamento {
  chave: string;
  label: string;
  obrigatorio: boolean;
  exemplo?: string;
}

const CAMPOS_SISTEMA: CampoMapeamento[] = [
  { chave: 'nome', label: 'Nome / Razão Social', obrigatorio: true },
  { chave: 'cnpj', label: 'CNPJ', obrigatorio: true },
  { chave: 'nomeFantasia', label: 'Nome Fantasia', obrigatorio: false },
  { chave: 'telefone', label: 'Telefone', obrigatorio: false },
  { chave: 'email', label: 'E-mail', obrigatorio: false },
  { chave: 'segmento', label: 'Segmento', obrigatorio: false },
  { chave: 'municipio', label: 'Município', obrigatorio: false },
  { chave: 'bairro', label: 'Bairro', obrigatorio: false },
  { chave: 'porte', label: 'Porte', obrigatorio: false },
  { chave: 'capitalSocial', label: 'Capital Social', obrigatorio: false },
];

interface RegistroRevisao {
  raw: Record<string, unknown>;
  mapeado: Record<string, string>;
  valido: boolean;
  erros: string[];
}

export function ImportPlanilha({ isOpen, onClose, onImport }: ImportPlanilhaProps) {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [todosDados, setTodosDados] = useState<Record<string, unknown>[]>([]);
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});
  const [importando, setImportando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Apenas arquivos .xlsx ou .xls são suportados');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (json.length < 2) {
          toast.error('Planilha vazia ou sem dados');
          setFile(null);
          return;
        }

        const cols = (json[0] as string[]).map(String);
        const rows = json.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          cols.forEach((col, idx) => {
            obj[col] = row[idx] ?? '';
          });
          return obj;
        });

        setHeaders(cols);
        setTodosDados(rows);

        // Auto-mapeamento inteligente
        const autoMap: Record<string, string> = {};
        const colLower = cols.map(c => c.toLowerCase().trim());

        CAMPOS_SISTEMA.forEach((campo) => {
          const possiveisNomes = getPossiveisNomesColuna(campo.chave);
          for (const nome of possiveisNomes) {
            const idx = colLower.findIndex(c => c.includes(nome));
            if (idx !== -1) {
              autoMap[campo.chave] = cols[idx];
              break;
            }
          }
        });

        setMapeamento(autoMap);
        setEtapa('mapeamento');
        toast.success(`${rows.length} registros encontrados. Mapeie as colunas.`);
      } catch {
        toast.error('Erro ao ler o arquivo');
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const getPossiveisNomesColuna = (chave: string): string[] => {
    const map: Record<string, string[]> = {
      nome: ['razao', 'razaosocial', 'nome', 'empresa', 'company', 'nome_empresa'],
      cnpj: ['cnpj', 'cnp'],
      nomeFantasia: ['fantasia', 'nomefantasia', 'fant', 'apelido'],
      telefone: ['telefone', 'tel', 'fone', 'phone', 'contato', 'whatsapp'],
      email: ['email', 'e-mail', 'mail', 'correio'],
      segmento: ['segmento', 'tipo', 'ramo', 'atividade', 'setor'],
      municipio: ['municipio', 'cidade', 'município', 'city'],
      bairro: ['bairro', 'neighborhood'],
      porte: ['porte', 'tamanho', 'size'],
      capitalSocial: ['capital', 'capitalsocial', 'capital_social'],
    };
    return map[chave] || [chave];
  };

  const getExemplo = (chave: string): string => {
    const coluna = mapeamento[chave];
    if (!coluna || todosDados.length === 0) return '—';
    const val = String(todosDados[0][coluna] ?? '');
    return val || '—';
  };

  const camposObrigatoriosMapeados = useMemo(() => {
    const obrigatorios = CAMPOS_SISTEMA.filter(c => c.obrigatorio);
    return obrigatorios.every(c => mapeamento[c.chave] && mapeamento[c.chave] !== '');
  }, [mapeamento]);

  const registrosRevisao: RegistroRevisao[] = useMemo(() => {
    return todosDados.map((row) => {
      const mapeado: Record<string, string> = {};
      Object.entries(mapeamento).forEach(([campo, coluna]) => {
        if (coluna) {
          mapeado[campo] = String(row[coluna] ?? '').trim();
        }
      });

      const erros: string[] = [];

      if (!mapeado.nome || mapeado.nome.length < 3) {
        erros.push('Razão Social é obrigatória (mín. 3 caracteres)');
      }

      const cnpjLimpo = mapeado.cnpj?.replace(/\D/g, '') || '';
      if (!cnpjLimpo) {
        erros.push('CNPJ é obrigatório');
      } else if (cnpjLimpo.length !== 14) {
        erros.push('CNPJ deve ter 14 dígitos');
      } else if (!isValidCNPJ(cnpjLimpo)) {
        erros.push('CNPJ inválido');
      }

      if (mapeado.email && mapeado.email.length > 0 && !isValidEmail(mapeado.email)) {
        erros.push('E-mail inválido');
      }

      if (mapeado.telefone && mapeado.telefone.length > 0) {
        const telLimpo = mapeado.telefone.replace(/\D/g, '');
        if (!isValidPhone(telLimpo)) {
          erros.push('Telefone inválido');
        }
      }

      return {
        raw: row,
        mapeado,
        valido: erros.length === 0,
        erros,
      };
    });
  }, [todosDados, mapeamento]);

  const validosCount = registrosRevisao.filter(r => r.valido).length;

  const handleAvancarRevisao = () => {
    if (!camposObrigatoriosMapeados) {
      toast.error('Mapeie todos os campos obrigatórios (*) antes de continuar');
      return;
    }
    setEtapa('revisao');
  };

  const handleImportar = () => {
    const validos = registrosRevisao.filter(r => r.valido);
    if (validos.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }

    setImportando(true);
    try {
      const dadosParaImportar = validos.map((r) => ({
        razaoSocial: r.mapeado.nome,
        nomeFantasia: r.mapeado.nomeFantasia || '',
        cnpj: r.mapeado.cnpj?.replace(/\D/g, '') || '',
        telefone: r.mapeado.telefone?.replace(/\D/g, '') || '',
        email: r.mapeado.email || '',
        segmento: r.mapeado.segmento || '',
        municipio: r.mapeado.municipio || '',
        bairro: r.mapeado.bairro || '',
        porte: r.mapeado.porte || '',
        capitalSocial: r.mapeado.capitalSocial ? Number(r.mapeado.capitalSocial) : undefined,
        bruto: r.raw,
      }));

      onImport(dadosParaImportar);
      toast.success(`${validos.length} de ${registrosRevisao.length} registros importados!`);
      handleClose();
    } catch {
      toast.error('Erro ao importar planilha');
    } finally {
      setImportando(false);
    }
  };

  const handleClose = () => {
    setEtapa('upload');
    setFile(null);
    setHeaders([]);
    setTodosDados([]);
    setMapeamento({});
    setImportando(false);
    onClose();
  };

  const etapas = [
    { key: 'upload', label: 'Upload', num: 1 },
    { key: 'mapeamento', label: 'Mapeamento', num: 2 },
    { key: 'revisao', label: 'Revisão', num: 3 },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Planilha" size="2xl">
      {/* Steps */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        {etapas.map((e, idx) => (
          <div key={e.key} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              etapa === e.key
                ? 'bg-emerald-500 text-white'
                : etapas.findIndex(step => step.key === etapa) > idx
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-500'
            }`}>
              {etapas.findIndex(step => step.key === etapa) > idx ? <Check size={14} /> : e.num}
            </div>
            <span className={`text-sm font-medium ${
              etapa === e.key ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {e.label}
            </span>
            {idx < etapas.length - 1 && (
              <div className="w-8 h-px bg-slate-800 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* ETAPA 1: UPLOAD */}
      {etapa === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="mx-auto mb-3 text-slate-500" size={48} />
            <p className="text-sm text-slate-300 font-medium">
              {file ? file.name : 'Clique para selecionar ou arraste um arquivo .xlsx'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Máximo 5MB. Formatos aceitos: .xlsx, .xls
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* ETAPA 2: MAPEAMENTO */}
      {etapa === 'mapeamento' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>
              Associe cada coluna da planilha ao campo correspondente no sistema. 
              Campos obrigatórios estão marcados com <span className="text-red-400">*</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {CAMPOS_SISTEMA.map((campo) => (
              <div
                key={campo.chave}
                className={`bg-slate-850 border rounded-lg p-3 ${
                  campo.obrigatorio && !mapeamento[campo.chave]
                    ? 'border-red-500/30'
                    : 'border-slate-800'
                }`}
              >
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {campo.label}
                  {campo.obrigatorio && <span className="text-red-400 ml-1">*</span>}
                </label>
                <select
                  value={mapeamento[campo.chave] || ''}
                  onChange={(e) =>
                    setMapeamento((prev) => ({ ...prev, [campo.chave]: e.target.value }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">— Não mapear —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Exemplo: <span className="text-slate-400">{getExemplo(campo.chave)}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={() => setEtapa('upload')}>
              <ChevronLeft size={16} className="mr-1" /> Voltar
            </Button>
            <div className="flex items-center gap-3">
              {!camposObrigatoriosMapeados && (
                <span className="text-xs text-red-400">
                  Mapeie os campos obrigatórios para continuar
                </span>
              )}
              <Button onClick={handleAvancarRevisao} disabled={!camposObrigatoriosMapeados}>
                Continuar <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3: REVISÃO */}
      {etapa === 'revisao' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-slate-400">Registros válidos:</span>{' '}
                <span className="text-emerald-400 font-bold">{validosCount}</span>
                <span className="text-slate-500"> / {registrosRevisao.length}</span>
              </div>
              {validosCount < registrosRevisao.length && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                  {registrosRevisao.length - validosCount} com erro
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium w-10">#</th>
                  <th className="px-3 py-2 text-left font-medium">Razão Social</th>
                  <th className="px-3 py-2 text-left font-medium">CNPJ</th>
                  <th className="px-3 py-2 text-left font-medium">Contato</th>
                  <th className="px-3 py-2 text-left font-medium">Localização</th>
                  <th className="px-3 py-2 text-left font-medium w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {registrosRevisao.map((reg, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      reg.valido ? 'bg-slate-850' : 'bg-red-500/5'
                    } hover:bg-slate-800/50 transition-colors`}
                  >
                    <td className="px-3 py-2 text-slate-500 text-xs">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <p className={`font-medium ${reg.valido ? 'text-white' : 'text-red-300'}`}>
                        {reg.mapeado.nome || '-'}
                      </p>
                      {reg.mapeado.nomeFantasia && (
                        <p className="text-xs text-slate-500">{reg.mapeado.nomeFantasia}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <p className={`font-mono text-xs ${reg.valido ? 'text-slate-400' : 'text-red-300'}`}>
                        {reg.mapeado.cnpj || '-'}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-0.5 text-xs">
                        {reg.mapeado.telefone && <p className="text-slate-400">{reg.mapeado.telefone}</p>}
                        {reg.mapeado.email && <p className="text-slate-400 truncate max-w-[120px]">{reg.mapeado.email}</p>}
                        {!reg.mapeado.telefone && !reg.mapeado.email && <span className="text-slate-600">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        <p className="text-slate-400">{reg.mapeado.municipio || '—'}</p>
                        {reg.mapeado.bairro && <p className="text-slate-500">{reg.mapeado.bairro}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {reg.valido ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                          <Check size={12} /> Válido
                        </span>
                      ) : (
                        <div className="relative group">
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full cursor-help">
                            <AlertTriangle size={12} /> Erro
                          </span>
                          <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-red-300 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                            {reg.erros.map((err, i) => (
                              <p key={i} className="py-0.5">• {err}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validosCount === 0 && (
            <div className="text-center py-4 text-red-400 text-sm bg-red-500/5 rounded-lg border border-red-500/20">
              Nenhum registro válido. Corrija os dados na planilha e tente novamente.
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={() => setEtapa('mapeamento')}>
              <ChevronLeft size={16} className="mr-1" /> Voltar
            </Button>
            <Button
              onClick={handleImportar}
              isLoading={importando}
              disabled={validosCount === 0}
            >
              <Upload size={16} className="mr-2" />
              Importar {validosCount} válido{validosCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
