import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import logoCloudfy from '@/assets/logo-cloudfy.png';
import logoHrp from '@/assets/logo-hrp.png';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ContractRichEditor } from '@/components/contracts/ContractRichEditor';
import { useAuth } from '@/hooks/useAuth';
import { contractService, gerarFingerprintContrato } from '@/services/contractService';
import { db } from '@/firebase';
import type { ContractDocument, Cotacao, Lead } from '@/types';

function tableCounts(html: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return {
    licenses: parsed.querySelectorAll('[data-contract-table="licenses"]').length,
    services: parsed.querySelectorAll('[data-contract-table="services"]').length,
  };
}

export function ContractEditor() {
  const { cotacaoId } = useParams<{ cotacaoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractDocument | null>(null);
  const [previousContracts, setPreviousContracts] = useState<ContractDocument[]>([]);
  const [viewingPreviousContract, setViewingPreviousContract] = useState<ContractDocument | null>(null);
  const [quotation, setQuotation] = useState<Cotacao | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [html, setHtml] = useState('');
  const [editable, setEditable] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sourceChanged, setSourceChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const load = useCallback(async () => {
    if (!cotacaoId) {
      setError('Identificador da cotação não informado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const quotationSnapshot = await getDoc(doc(db, 'cotacoes', cotacaoId));
      if (!quotationSnapshot.exists()) throw new Error('Cotação não encontrada.');
      const currentQuotation = { id: quotationSnapshot.id, ...quotationSnapshot.data() } as Cotacao;
      setQuotation(currentQuotation);
      if (!currentQuotation.leadId) throw new Error('A cotação não está vinculada a um cliente.');
      const leadSnapshot = await getDoc(doc(db, 'leads', currentQuotation.leadId));
      if (!leadSnapshot.exists()) throw new Error('Cliente não encontrado.');
      const currentLead = { id: leadSnapshot.id, ...leadSnapshot.data() } as Lead;
      setLead(currentLead);

      let currentContract = await contractService.getContract(cotacaoId);
      if (!currentContract) {
        currentContract = await contractService.createForApprovedQuote(currentQuotation, currentLead);
      }
      currentContract = await contractService.restoreContractTables(cotacaoId, currentQuotation);
      setContract(currentContract);
      setPreviousContracts(await contractService.listContractVersions(cotacaoId));
      setViewingPreviousContract(null);
      setHtml(currentContract.html);
      setEditorKey((key) => key + 1);
      setSourceChanged(currentContract.sourceFingerprint !== gerarFingerprintContrato(currentQuotation, currentLead));
      setEditable(false);
      setDirty(false);
    } catch (loadError) {
      console.error('Erro ao carregar o contrato:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o contrato.');
    } finally {
      setLoading(false);
    }
  }, [cotacaoId]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => tableCounts(html), [html]);
  const validTables = counts.licenses === 1 && counts.services === 1;
  const missingClientData = useMemo(() => {
    if (!lead) return [];
    const missing = [];
    if (!lead.cnpj) missing.push('CNPJ');
    if (!lead.logradouro || !lead.municipio || !lead.uf) missing.push('endereço completo');
    return missing;
  }, [lead]);

  const saveCurrent = async () => {
    if (!contract || viewingPreviousContract || !user?.uid || !validTables || sourceChanged) return false;
    setSaving(true);
    setError(null);
    try {
      await contractService.saveContract(contract.id, html, user.uid);
      setDirty(false);
      toast.success('Alterações do contrato salvas.');
      return true;
    } catch (saveError) {
      console.error('Erro ao salvar contrato:', saveError);
      setError('Não foi possível salvar o contrato. Suas alterações continuam nesta tela.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    if (sourceChanged || viewingPreviousContract) {
      setError('Atualize o contrato para a versão atual da cotação antes de exportar.');
      return;
    }
    if (!validTables) {
      setError('O contrato precisa conter uma tabela de licenças e uma tabela de serviços antes da exportação.');
      return;
    }
    if (dirty && !(await saveCurrent())) return;
    setEditable(false);
    window.setTimeout(() => window.print(), 250);
  };

  const refreshFromQuotation = async () => {
    if (!quotation || !lead || !window.confirm('A cotação ou o cadastro do cliente mudou após a geração deste contrato. Uma nova versão será criada com os dados atuais; o documento e os ajustes antigos serão preservados no histórico. Deseja continuar?')) return;
    setSaving(true);
    setError(null);
    try {
      const nextContract = await contractService.createUpdatedVersion(quotation, lead);
      setContract(nextContract);
      setViewingPreviousContract(null);
      setHtml(nextContract.html);
      setEditorKey((key) => key + 1);
      setSourceChanged(false);
      setDirty(false);
      setEditable(false);
      toast.success(`Nova versão do contrato criada (v${nextContract.version}).`);
      try {
        setPreviousContracts(await contractService.listContractVersions(nextContract.id));
      } catch (historyError) {
        console.error('Erro ao carregar o histórico do contrato:', historyError);
        setPreviousContracts([]);
        setError('A nova versão foi criada, mas não foi possível carregar o histórico agora.');
      }
    } catch (refreshError) {
      console.error('Erro ao atualizar versão do contrato:', refreshError);
      setError(refreshError instanceof Error ? refreshError.message : 'Não foi possível criar uma nova versão do contrato.');
    } finally {
      setSaving(false);
    }
  };

  const showCurrentContract = () => {
    if (!contract) return;
    setViewingPreviousContract(null);
    setHtml(contract.html);
    setEditorKey((key) => key + 1);
    setEditable(false);
    setDirty(false);
  };

  const showPreviousContract = (previousContract: ContractDocument) => {
    setViewingPreviousContract(previousContract);
    setHtml(previousContract.html);
    setEditorKey((key) => key + 1);
    setEditable(false);
    setDirty(false);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" /></div>;
  }

  return (
    <div className="contract-page space-y-5">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contrato — {contract?.clienteNome || lead?.razaoSocial || 'Cliente'}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Cotação {contract?.numeroCotacao || quotation?.numero || '—'} · Contrato v{viewingPreviousContract?.version || contract?.version || 1} · Modelo Cloudfy v{viewingPreviousContract?.templateVersion || contract?.templateVersion || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/cotacoes')}><ArrowLeft size={16} className="mr-2" />Cotações</Button>
          {viewingPreviousContract ? (
            <Button variant="outline" onClick={showCurrentContract}>Voltar à versão atual</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditable((value) => !value)} disabled={sourceChanged}><Eye size={16} className="mr-2" />{editable ? 'Pré-visualizar' : 'Editar contrato'}</Button>
              <Button variant="outline" onClick={saveCurrent} disabled={!dirty || saving || !validTables || sourceChanged}><Save size={16} className="mr-2" />{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
              <Button onClick={exportPdf} disabled={saving || !validTables || sourceChanged}><Download size={16} className="mr-2" />Imprimir / salvar como PDF</Button>
            </>
          )}
        </div>
      </div>

      {previousContracts.length > 0 && !viewingPreviousContract && (
        <Card className="no-print border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-200">
          <p className="mb-3 font-medium">Histórico de versões — versões anteriores são preservadas sem alterações.</p>
          <div className="flex flex-wrap gap-2">
            {previousContracts.map((previousContract) => (
              <Button key={previousContract.id} size="sm" variant="outline" onClick={() => showPreviousContract(previousContract)}>
                Consultar versão {previousContract.version}
              </Button>
            ))}
          </div>
        </Card>
      )}
      {viewingPreviousContract && (
        <Card className="no-print border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          Você está consultando uma versão histórica em modo somente leitura. Para editar ou exportar, volte à versão atual.
        </Card>
      )}

      {error && (
        <div role="alert" className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <span>{error}</span>
          {!contract && <Button variant="outline" size="sm" onClick={() => void load()}>Tentar novamente</Button>}
        </div>
      )}
      {sourceChanged && !viewingPreviousContract && (
        <Card className="no-print border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>A cotação ou o cadastro do cliente foi alterado depois que esta versão foi preparada. Para evitar um contrato com dados antigos, exportação e edição estão bloqueadas até atualizar a versão.</p>
            <Button onClick={refreshFromQuotation} disabled={saving || quotation?.status !== 'aprovada'}>{saving ? 'Atualizando...' : 'Criar nova versão'}</Button>
          </div>
        </Card>
      )}
      {quotation?.status !== 'aprovada' && (
        <Card className="no-print border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
          Esta cotação não está marcada como aprovada. O documento existente é preservado, mas confira o status e os dados antes de exportar.
        </Card>
      )}
      {missingClientData.length > 0 && (
        <Card className="no-print border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
          Dados cadastrais incompletos no cliente: {missingClientData.join(', ')}. Revise a qualificação no contrato antes de gerar o PDF.
        </Card>
      )}
      <Card className="no-print border-sky-500/30 bg-sky-500/5 p-4 text-sm text-sky-100">
        As datas da proposta e do contrato são preenchidas com a data de geração desta versão; revise-as e ajuste se necessário, e confira a identificação do representante legal antes de exportar. A prévia não é uma assinatura eletrônica. As tabelas refletem os dados aprovados da cotação e não são editáveis aqui.
      </Card>
      {!validTables && (
        <div role="alert" className="no-print rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          O documento precisa conter uma tabela de licenças e uma de serviços. Insira os blocos ausentes pela barra do editor antes de salvar ou exportar.
        </div>
      )}

      {contract && (
        <Card className="contract-print-area overflow-hidden bg-white p-0 text-slate-900">
          <div className="contract-brand-header">
            <div className="contract-hrp-brand">
              <img src={logoHrp} alt="HRP Soluções" />
              <span>HRP SOLUÇÕES</span>
            </div>
            <img className="contract-cloudfy-logo" src={logoCloudfy} alt="Cloudfy" />
          </div>
          <ContractRichEditor
            key={editorKey}
            html={html}
            editable={editable && !viewingPreviousContract}
            tables={viewingPreviousContract?.tables || contract.tables}
            onChange={(nextHtml) => { setHtml(nextHtml); setDirty(true); }}
          />
        </Card>
      )}
    </div>
  );
}
