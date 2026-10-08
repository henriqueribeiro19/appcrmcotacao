import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, RotateCcw, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ContractRichEditor } from '@/components/contracts/ContractRichEditor';
import { useAuth } from '@/hooks/useAuth';
import { contractService } from '@/services/contractService';
import { CONTRATO_CLOUDFY_TEMPLATE } from '@/utils/contratoCloudfyTemplate';

function tableCounts(html: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return {
    licenses: parsed.querySelectorAll('[data-contract-table="licenses"]').length,
    services: parsed.querySelectorAll('[data-contract-table="services"]').length,
  };
}

export function ContractTemplateEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [html, setHtml] = useState('');
  const [version, setVersion] = useState(1);
  const [editable, setEditable] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorGeneration, setEditorGeneration] = useState(0);

  useEffect(() => {
    let active = true;
    contractService.getTemplate()
      .then((template) => {
        if (!active) return;
        setHtml(template.html);
        setVersion(template.version);
        setDirty(Boolean(template.needsSave));
      })
      .catch((loadError) => {
        console.error('Erro ao carregar o modelo de contrato:', loadError);
        if (active) setError('Não foi possível carregar o modelo. Verifique sua conexão e tente novamente.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => tableCounts(html), [html]);
  const validTables = counts.licenses === 1 && counts.services === 1;

  const save = async () => {
    if (!user?.uid || !validTables) return;
    setSaving(true);
    setError(null);
    try {
      const savedVersion = await contractService.saveTemplate(html, user.uid);
      setVersion(savedVersion);
      setDirty(false);
      toast.success('Modelo Cloudfy salvo. A nova versão será usada nos próximos contratos.');
    } catch (saveError) {
      console.error('Erro ao salvar o modelo de contrato:', saveError);
      setError('Não foi possível salvar o modelo. Suas alterações continuam nesta tela.');
    } finally {
      setSaving(false);
    }
  };

  const restore = () => {
    if (!window.confirm('Restaurar o texto inicial do modelo Cloudfy? As alterações não salvas nesta tela serão perdidas.')) return;
    setHtml(CONTRATO_CLOUDFY_TEMPLATE);
    setDirty(true);
    setEditable(true);
    setEditorGeneration((generation) => generation + 1);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" /></div>;
  }

  return (
    <div className="contract-page space-y-5">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><FileText size={22} /> Modelo de contrato Cloudfy</h1>
          <p className="mt-1 text-sm text-slate-400">Versão {version}. Alterações serão aplicadas apenas aos contratos preparados no futuro.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/cotacoes')}>Voltar às cotações</Button>
          <Button variant="outline" onClick={() => setEditable((value) => !value)}><Eye size={16} className="mr-2" />{editable ? 'Pré-visualizar' : 'Editar modelo'}</Button>
          <Button variant="outline" onClick={restore}><RotateCcw size={16} className="mr-2" />Restaurar texto inicial</Button>
          <Button onClick={save} disabled={!dirty || saving || !validTables}><Save size={16} className="mr-2" />{saving ? 'Salvando...' : 'Salvar modelo'}</Button>
        </div>
      </div>

      <Card className="no-print border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
        O texto inicial foi transcrito do modelo fornecido. Revise-o antes do uso operacional, em especial as regras de vencimento, reajuste, rescisão e suporte, que são fixas no texto. As tabelas de licenças e serviços são campos dinâmicos e devem aparecer exatamente uma vez no documento.
      </Card>

      {error && <div role="alert" className="no-print rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {!validTables && <div role="alert" className="no-print rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">O modelo precisa conter uma tabela de licenças e uma de serviços. Use os botões da barra de edição para restaurar os blocos ausentes.</div>}

      <Card className="contract-print-area overflow-hidden bg-white p-0 text-slate-900">
        <ContractRichEditor
          key={editorGeneration}
          html={html}
          editable={editable}
          onChange={(nextHtml) => { setHtml(nextHtml); setDirty(true); }}
        />
      </Card>
    </div>
  );
}
