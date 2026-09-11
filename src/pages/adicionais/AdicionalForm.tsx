import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdicional } from '../../hooks/useAdicional';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Save, AlertTriangle, Puzzle, CheckSquare, Hash } from 'lucide-react';
import { parseValorMonetario } from '../../utils/calculos';
import { formatarEntradaMonetaria, formatarNumeroMonetario } from '../../utils/formatters';

interface FormData {
  nome: string;
  descricao: string;
  valor: string;
  tipo: 'checkbox' | 'quantificavel';
  ativo: boolean;
}

export function AdicionalForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdicao = !!id;
  const { adicionais, loading: loadingAdicionais, criar, atualizar } = useAdicional();

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    valor: '',
    tipo: 'checkbox',
    ativo: true,
  });
  const [erros, setErros] = useState<Partial<Record<keyof FormData, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  useEffect(() => {
    if (isEdicao && adicionais.length > 0) {
      const adicional = adicionais.find((a) => a.id === id);
      if (adicional) {
        setFormData({
          nome: adicional.nome,
          descricao: adicional.descricao || '',
          valor: formatarNumeroMonetario(adicional.valor),
          tipo: adicional.tipo,
          ativo: adicional.ativo !== false,
        });
      }
    }
  }, [isEdicao, id, adicionais]);

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof FormData, string>> = {};
    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!formData.valor.trim()) novosErros.valor = 'Valor é obrigatório';
    else {
      const v = parseValorMonetario(formData.valor);
      if (v === null || v < 0) novosErros.valor = 'Informe um valor válido, por exemplo 1.234,56';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);
    if (!validar()) return;
    setSalvando(true);
    try {
      const payload = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        valor: parseValorMonetario(formData.valor)!,
        tipo: formData.tipo,
        ativo: formData.ativo,
      };
      if (isEdicao) await atualizar(id!, payload);
      else await criar(payload);
      navigate('/adicionais');
    } catch (err) {
      setErroGeral('Erro ao salvar adicional.');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (erros[field]) setErros((prev) => ({ ...prev, [field]: undefined }));
  };

  if (isEdicao && loadingAdicionais) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/adicionais')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdicao ? 'Editar Serviço/Adicional' : 'Novo Serviço/Adicional'}</h1>
          <p className="text-slate-400 mt-1">{isEdicao ? 'Atualize os dados' : 'Cadastre um novo serviço para inclusão nas propostas'}</p>
        </div>
      </div>

      <Card className="p-6">
        {erroGeral && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />{erroGeral}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome <span className="text-red-400">*</span></label>
            <div className="relative">
              <Puzzle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Serviço de ativação da base"
                className={`pl-10 ${erros.nome ? 'border-red-500' : ''}`}
              />
            </div>
            {erros.nome && <p className="mt-1 text-sm text-red-400">{erros.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descrição do serviço..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Valor (R$) <span className="text-red-400">*</span></label>
            <Input
              value={formData.valor}
              onChange={(e) => handleChange('valor', formatarEntradaMonetaria(e.target.value))}
              placeholder="0,00"
              className={erros.valor ? 'border-red-500' : ''}
            />
            {erros.valor && <p className="mt-1 text-sm text-red-400">{erros.valor}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Tipo</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('tipo', 'checkbox')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.tipo === 'checkbox'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <CheckSquare size={16} /> Único (Checkbox)
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipo', 'quantificavel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.tipo === 'quantificavel'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Hash size={16} /> Quantificável
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('ativo', true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.ativo
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => handleChange('ativo', false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !formData.ativo
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                Inativo
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={() => navigate('/adicionais')}>Cancelar</Button>
            <Button type="submit" disabled={salvando} className="flex items-center gap-2">
              <Save size={18} />{salvando ? 'Salvando...' : isEdicao ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}