import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePacoteCplug } from '../../hooks/usePacoteCplug';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tag } from '../../components/ui/Tag';
import { ArrowLeft, Save, AlertTriangle, Plus, X, Layers, CheckSquare, Hash, Package } from 'lucide-react';
import { parseValorMonetario } from '../../utils/calculos';
import { formatarEntradaMonetaria, formatarNumeroMonetario } from '../../utils/formatters';

interface ModuloFixo { id: string; nome: string; }
interface ModuloOpcional { id: string; nome: string; valor: number; }
interface ItemQuantificavel { id: string; nome: string; valorUnitario: number; }
interface FormData { nome: string; descricao: string; valorBase: string; ativo: boolean; modulosFixos: ModuloFixo[]; modulosOpcionais: ModuloOpcional[]; itensQuantificaveis: ItemQuantificavel[]; }

export function PacoteForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdicao = !!id;
  const { pacotes, loading: loadingPacotes, criar, atualizar } = usePacoteCplug();

  const [formData, setFormData] = useState<FormData>({ nome: '', descricao: '', valorBase: '', ativo: true, modulosFixos: [], modulosOpcionais: [], itensQuantificaveis: [] });
  const [erros, setErros] = useState<Partial<Record<keyof FormData, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [novoFixo, setNovoFixo] = useState('');
  const [novoOpcionalNome, setNovoOpcionalNome] = useState('');
  const [novoOpcionalValor, setNovoOpcionalValor] = useState('');
  const [novoQuantNome, setNovoQuantNome] = useState('');
  const [novoQuantValor, setNovoQuantValor] = useState('');

  useEffect(() => {
    if (isEdicao && pacotes.length > 0) {
      const pacote = pacotes.find((p) => p.id === id);
      if (pacote) setFormData({ nome: pacote.nome, descricao: pacote.descricao || '', valorBase: formatarNumeroMonetario(pacote.valorBase), ativo: pacote.ativo !== false, modulosFixos: pacote.modulosFixos || [], modulosOpcionais: pacote.modulosOpcionais || [], itensQuantificaveis: pacote.itensQuantificaveis || [] });
    }
  }, [isEdicao, id, pacotes]);

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof FormData, string>> = {};
    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!formData.valorBase.trim()) novosErros.valorBase = 'Valor base é obrigatório';
    else { const v = parseValorMonetario(formData.valorBase); if (v === null || v < 0) novosErros.valorBase = 'Informe um valor válido, por exemplo 1.234,56'; }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErroGeral(null);
    if (!validar()) return;
    setSalvando(true);
    try {
      const payload = { nome: formData.nome.trim(), descricao: formData.descricao.trim() || undefined, valorBase: parseValorMonetario(formData.valorBase)!, ativo: formData.ativo, modulosFixos: formData.modulosFixos, modulosOpcionais: formData.modulosOpcionais, itensQuantificaveis: formData.itensQuantificaveis };
      if (isEdicao) await atualizar(id!, payload); else await criar(payload);
      navigate('/pacotes');
    } catch (err) { setErroGeral('Erro ao salvar pacote.'); console.error(err); }
    finally { setSalvando(false); }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (erros[field]) setErros((prev) => ({ ...prev, [field]: undefined }));
  };

  const adicionarFixo = () => { if (!novoFixo.trim()) return; setFormData((prev) => ({ ...prev, modulosFixos: [...prev.modulosFixos, { id: crypto.randomUUID(), nome: novoFixo.trim() }] })); setNovoFixo(''); };
  const removerFixo = (idRemover: string) => setFormData((prev) => ({ ...prev, modulosFixos: prev.modulosFixos.filter((m) => m.id !== idRemover) }));

  const adicionarOpcional = () => { if (!novoOpcionalNome.trim() || !novoOpcionalValor.trim()) return; const valor = parseValorMonetario(novoOpcionalValor); if (valor === null || valor < 0) return; setFormData((prev) => ({ ...prev, modulosOpcionais: [...prev.modulosOpcionais, { id: crypto.randomUUID(), nome: novoOpcionalNome.trim(), valor }] })); setNovoOpcionalNome(''); setNovoOpcionalValor(''); };
  const removerOpcional = (idRemover: string) => setFormData((prev) => ({ ...prev, modulosOpcionais: prev.modulosOpcionais.filter((m) => m.id !== idRemover) }));

  const adicionarQuantificavel = () => { if (!novoQuantNome.trim() || !novoQuantValor.trim()) return; const valor = parseValorMonetario(novoQuantValor); if (valor === null || valor < 0) return; setFormData((prev) => ({ ...prev, itensQuantificaveis: [...prev.itensQuantificaveis, { id: crypto.randomUUID(), nome: novoQuantNome.trim(), valorUnitario: valor }] })); setNovoQuantNome(''); setNovoQuantValor(''); };
  const removerQuantificavel = (idRemover: string) => setFormData((prev) => ({ ...prev, itensQuantificaveis: prev.itensQuantificaveis.filter((m) => m.id !== idRemover) }));

  const formatarValor = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (isEdicao && loadingPacotes) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pacotes')} className="text-slate-400 hover:text-white"><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdicao ? 'Editar Pacote' : 'Novo Pacote'}</h1>
          <p className="text-slate-400 mt-1">{isEdicao ? 'Atualize os dados' : 'Configure um novo plano Cplug'}</p>
        </div>
      </div>

      <Card className="p-6">
        {erroGeral && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400"><AlertTriangle size={18} />{erroGeral}</div>}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Package size={20} className="text-emerald-400" />Dados do Pacote</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome <span className="text-red-400">*</span></label>
              <Input value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} placeholder="Ex: Plano Essencial Food" className={erros.nome ? 'border-red-500' : ''} />
              {erros.nome && <p className="mt-1 text-sm text-red-400">{erros.nome}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
              <textarea value={formData.descricao} onChange={(e) => handleChange('descricao', e.target.value)} placeholder="Descrição..." rows={2} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Valor base (R$) <span className="text-red-400">*</span></label>
              <Input value={formData.valorBase} onChange={(e) => handleChange('valorBase', formatarEntradaMonetaria(e.target.value))} placeholder="0,00" className={erros.valorBase ? 'border-red-500' : ''} />
              {erros.valorBase && <p className="mt-1 text-sm text-red-400">{erros.valorBase}</p>}
              <p className="mt-1 text-xs text-slate-500">Valor mensal base (módulos fixos já inclusos)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Status</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleChange('ativo', true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.ativo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>Ativo</button>
                <button type="button" onClick={() => handleChange('ativo', false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!formData.ativo ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>Inativo</button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Layers size={20} className="text-sky-400" />Módulos Fixos <span className="text-xs font-normal text-slate-500">(inclusos no valor base)</span></h3>
            <div className="flex gap-2">
              <Input value={novoFixo} onChange={(e) => setNovoFixo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarFixo())} placeholder="Nome do módulo fixo..." className="flex-1" />
              <Button type="button" onClick={adicionarFixo} variant="outline" className="flex items-center gap-1"><Plus size={16} /> Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.modulosFixos.length === 0 && <p className="text-sm text-slate-500 italic">Nenhum módulo fixo</p>}
              {formData.modulosFixos.map((modulo) => (
                <Tag key={modulo.id} variant="info" className="text-sm flex items-center gap-1.5 pr-1">{modulo.nome}<button type="button" onClick={() => removerFixo(modulo.id)} className="ml-1 p-0.5 hover:bg-sky-500/20 rounded"><X size={12} /></button></Tag>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><CheckSquare size={20} className="text-amber-400" />Módulos Opcionais <span className="text-xs font-normal text-slate-500">(checkbox — somam ao valor)</span></h3>
            <div className="flex gap-2">
              <Input value={novoOpcionalNome} onChange={(e) => setNovoOpcionalNome(e.target.value)} placeholder="Nome..." className="flex-1" />
              <Input value={novoOpcionalValor} onChange={(e) => setNovoOpcionalValor(formatarEntradaMonetaria(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarOpcional())} placeholder="Valor R$" className="w-32" />
              <Button type="button" onClick={adicionarOpcional} variant="outline" className="flex items-center gap-1"><Plus size={16} /> Adicionar</Button>
            </div>
            <div className="space-y-2">
              {formData.modulosOpcionais.length === 0 && <p className="text-sm text-slate-500 italic">Nenhum módulo opcional</p>}
              {formData.modulosOpcionais.map((modulo) => (
                <div key={modulo.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-white text-sm">{modulo.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-sm font-medium">+ {formatarValor(modulo.valor)}</span>
                    <button type="button" onClick={() => removerOpcional(modulo.id)} className="p-1 text-slate-500 hover:text-red-400"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Hash size={20} className="text-purple-400" />Itens Quantificáveis <span className="text-xs font-normal text-slate-500">(contador +/-)</span></h3>
            <div className="flex gap-2">
              <Input value={novoQuantNome} onChange={(e) => setNovoQuantNome(e.target.value)} placeholder="Nome..." className="flex-1" />
              <Input value={novoQuantValor} onChange={(e) => setNovoQuantValor(formatarEntradaMonetaria(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarQuantificavel())} placeholder="Valor unitário R$" className="w-40" />
              <Button type="button" onClick={adicionarQuantificavel} variant="outline" className="flex items-center gap-1"><Plus size={16} /> Adicionar</Button>
            </div>
            <div className="space-y-2">
              {formData.itensQuantificaveis.length === 0 && <p className="text-sm text-slate-500 italic">Nenhum item quantificável</p>}
              {formData.itensQuantificaveis.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-white text-sm">{item.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 text-sm font-medium">{formatarValor(item.valorUnitario)} / unidade</span>
                    <button type="button" onClick={() => removerQuantificavel(item.id)} className="p-1 text-slate-500 hover:text-red-400"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={() => navigate('/pacotes')}>Cancelar</Button>
            <Button type="submit" disabled={salvando} className="flex items-center gap-2"><Save size={18} />{salvando ? 'Salvando...' : isEdicao ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
