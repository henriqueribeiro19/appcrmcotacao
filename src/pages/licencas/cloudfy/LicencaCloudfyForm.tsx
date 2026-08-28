import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLicencaCloudfy } from '../../../hooks/useLicencaCloudfy';
import { useCategoriaLicencaCloudfy } from '../../../hooks/useCategoriaLicencaCloudfy';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { parseValorMonetario } from '../../../utils/calculos';

interface FormData { nome: string; categoriaId: string; valor: string; permiteMultiplasUnidades: boolean; ativo: boolean; }

export function LicencaCloudfyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdicao = !!id;
  const { licencas, loading: loadingLicencas, criar, atualizar } = useLicencaCloudfy();
  const { categorias, loading: loadingCategorias } = useCategoriaLicencaCloudfy();

  const [formData, setFormData] = useState<FormData>({ nome: '', categoriaId: '', valor: '', permiteMultiplasUnidades: false, ativo: true });
  const [erros, setErros] = useState<Partial<Record<keyof FormData, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  useEffect(() => {
    if (isEdicao && licencas.length > 0) {
      const licenca = licencas.find((l) => l.id === id);
      if (licenca) {
        setFormData({ nome: licenca.nome || '', categoriaId: licenca.categoriaId || '', valor: (licenca.valor ?? licenca.valorIntegral ?? 0).toString().replace('.', ','), permiteMultiplasUnidades: licenca.permiteMultiplasUnidades === true, ativo: licenca.ativo !== false });
      }
    }
  }, [isEdicao, id, licencas]);

  const validar = (): boolean => {
    const novosErros: Partial<Record<keyof FormData, string>> = {};
    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!formData.categoriaId) novosErros.categoriaId = 'Categoria é obrigatória';
    if (!formData.valor.trim()) novosErros.valor = 'Valor é obrigatório';
    else { const v = parseValorMonetario(formData.valor); if (v === null || v < 0) novosErros.valor = 'Informe um valor válido, por exemplo 1.234,56'; }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErroGeral(null);
    if (!validar()) return;
    setSalvando(true);
    try {
      const categoria = categorias.find((item) => item.id === formData.categoriaId);
      const payload = { nome: formData.nome.trim(), categoriaId: formData.categoriaId, categoriaNome: categoria?.nome || '', valor: parseValorMonetario(formData.valor)!, permiteMultiplasUnidades: formData.permiteMultiplasUnidades, ativo: formData.ativo };
      if (isEdicao) await atualizar(id!, payload); else await criar(payload);
      navigate('/licencas/cloudfy');
    } catch (err) { setErroGeral('Erro ao salvar licença.'); console.error(err); }
    finally { setSalvando(false); }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (erros[field]) setErros((prev) => ({ ...prev, [field]: undefined }));
  };

  if (isEdicao && (loadingLicencas || loadingCategorias)) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/licencas/cloudfy')} className="text-slate-400 hover:text-white"><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdicao ? 'Editar Licença Cloudfy' : 'Nova Licença Cloudfy'}</h1>
          <p className="text-slate-400 mt-1">{isEdicao ? 'Atualize os dados' : 'Cadastre um novo item avulso'}</p>
        </div>
      </div>

      <Card className="p-6">
        {erroGeral && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400"><AlertTriangle size={18} />{erroGeral}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome <span className="text-red-400">*</span></label>
            <Input value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} placeholder="Ex: Cloudfy Premium - Módulo Fiscal" className={erros.nome ? 'border-red-500' : ''} />
            {erros.nome && <p className="mt-1 text-sm text-red-400">{erros.nome}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Categoria <span className="text-red-400">*</span></label>
            <select value={formData.categoriaId} onChange={(e) => handleChange('categoriaId', e.target.value)} className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${erros.categoriaId ? 'border-red-500' : 'border-slate-700'}`}>
              <option value="">Selecione uma categoria</option>
              {categorias.filter((categoria) => categoria.ativo !== false).map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
            </select>
            {erros.categoriaId && <p className="mt-1 text-sm text-red-400">{erros.categoriaId}</p>}
            <button type="button" onClick={() => navigate('/licencas/cloudfy/categorias/nova')} className="mt-2 text-sm text-emerald-400 hover:text-emerald-300">+ Criar categoria</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Valor (R$) <span className="text-red-400">*</span></label>
            <Input value={formData.valor} onChange={(e) => handleChange('valor', e.target.value)} placeholder="0,00" className={erros.valor ? 'border-red-500' : ''} />
            {erros.valor && <p className="mt-1 text-sm text-red-400">{erros.valor}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Status</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => handleChange('ativo', true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.ativo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>Ativo</button>
              <button type="button" onClick={() => handleChange('ativo', false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!formData.ativo ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>Inativo</button>
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={formData.permiteMultiplasUnidades} onChange={(e) => handleChange('permiteMultiplasUnidades', e.target.checked)} className="h-4 w-4 accent-emerald-500" />
            Permitir múltiplas unidades na cotação
          </label>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={() => navigate('/licencas/cloudfy')}>Cancelar</Button>
            <Button type="submit" disabled={salvando} className="flex items-center gap-2"><Save size={18} />{salvando ? 'Salvando...' : isEdicao ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
