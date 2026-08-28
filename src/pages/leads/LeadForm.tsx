import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useLead } from '@/hooks/useLead';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InteracaoItem } from '@/components/InteracaoItem';
import { isValidCNPJ, isValidEmail, isValidCEP, isValidPhone } from '@/utils/validators';
import { formatCNPJ, formatCEP, formatPhone } from '@/utils/formatters';
import { Save, ArrowLeft, User, MessageSquare, FileText, Plus } from 'lucide-react';
import type { Lead, Interacao } from '@/types';

const segmentos = [
  { value: '', label: 'Selecione...' },
  { value: 'Restaurante', label: 'Restaurante' },
  { value: 'Lanchonete', label: 'Lanchonete' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Padaria', label: 'Padaria' },
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Loja', label: 'Loja' },
  { value: 'Outro', label: 'Outro' },
];

const portes = [
  { value: '', label: 'Selecione...' },
  { value: 'MEI', label: 'MEI' },
  { value: 'ME', label: 'ME' },
  { value: 'EPP', label: 'EPP' },
  { value: 'DEMAIS', label: 'DEMAIS' },
];

const statusFunilOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'contato', label: 'Contato' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechado_ganho', label: 'Fechado (Ganho)' },
  { value: 'fechado_perdido', label: 'Fechado (Perdido)' },
];

const tipoInteracaoOptions = [
  { value: 'anotacao', label: 'Anotação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'visita', label: 'Visita' },
  { value: 'ligacao', label: 'Ligação' },
];

type Aba = 'dados' | 'interacoes' | 'notas';

const initialFormState: Partial<Lead> = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  telefone: '',
  email: '',
  segmento: '',
  porte: '',
  capitalSocial: undefined,
  socios: '',
  cep: '',
  municipio: '',
  uf: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  statusFunil: 'novo',
  produtoSugerido: 'qualificar',
  classificacao: 'C',
  tipoEmpresa: 'matriz',
  nomeUnidade: '',
  matrizCnpj: '',
  contatoNome: '',
  contatoTel: '',
  contatoEmail: '',
  respFinanceiroNome: '',
  respFinanceiroTel: '',
  respFinanceiroEmail: '',
  observacoes: '',
  responsavelId: '',
  status: 'ativo',
  excluidoEm: null,
  arquivado: false,
  dataArquivamento: null,
};

export function LeadForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { lead, loading, fetchLead, createLead, updateLead, addInteracao } = useLead();
  const [aba, setAba] = useState<Aba>('dados');
  const [saving, setSaving] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  const [form, setForm] = useState<Partial<Lead>>({ ...initialFormState });

  const [novaInteracao, setNovaInteracao] = useState({
    tipo: 'anotacao' as Interacao['tipo'],
    descricao: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carrega o lead quando edita
  useEffect(() => {
    if (id) {
      fetchLead(id);
    }
  }, [id]);

  // Popula o form quando o lead é carregado (edição)
  useEffect(() => {
    if (id && lead && !formLoaded) {
      setForm({
        ...initialFormState,
        ...lead,
        // Garante que campos undefined venham como string vazia para inputs controlados
        nomeFantasia: lead.nomeFantasia || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        segmento: lead.segmento || '',
        porte: lead.porte || '',
        socios: lead.socios || '',
        cep: lead.cep || '',
        municipio: lead.municipio || '',
        uf: lead.uf || '',
        logradouro: lead.logradouro || '',
        numero: lead.numero || '',
        complemento: lead.complemento || '',
        bairro: lead.bairro || '',
        contatoNome: lead.contatoNome || '',
        contatoTel: lead.contatoTel || '',
        contatoEmail: lead.contatoEmail || '',
        respFinanceiroNome: lead.respFinanceiroNome || '',
        respFinanceiroTel: lead.respFinanceiroTel || '',
        respFinanceiroEmail: lead.respFinanceiroEmail || '',
        observacoes: lead.observacoes || '',
        nomeUnidade: lead.nomeUnidade || '',
        matrizCnpj: lead.matrizCnpj || '',
        arquivado: lead.arquivado ?? false,
        dataArquivamento: lead.dataArquivamento || null,
      });
      setFormLoaded(true);
    }
  }, [lead, id, formLoaded]);

  // Reseta quando sai da edição
  useEffect(() => {
    if (!id) {
      setForm({
        ...initialFormState,
        responsavelId: userProfile?.uid || '',
      });
      setFormLoaded(false);
    }
  }, [id, userProfile]);

  const buscarCEP = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          municipio: data.localidade || '',
          uf: data.uf || '',
          complemento: data.complemento || '',
        }));
      }
    } catch {
      toast.error('Erro ao buscar CEP');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.razaoSocial || form.razaoSocial.length < 3) {
      newErrors.razaoSocial = 'Razão social é obrigatória (mín. 3 caracteres)';
    }
    if (!form.cnpj || !isValidCNPJ(form.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
    }
    if (form.email && !isValidEmail(form.email)) {
      newErrors.email = 'Email inválido';
    }
    if (form.cep && !isValidCEP(form.cep)) {
      newErrors.cep = 'CEP inválido';
    }
    if (form.telefone && !isValidPhone(form.telefone)) {
      newErrors.telefone = 'Telefone inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (id) {
        await updateLead(id, form);
        toast.success('Lead atualizado com sucesso!');
      } else {
        const newId = await createLead(form as Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>);
        if (newId) {
          toast.success('Lead criado com sucesso!');
          navigate(`/leads/${newId}`);
        }
      }
    } catch {
      toast.error('Erro ao salvar lead');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInteracao = async () => {
    if (!novaInteracao.descricao.trim() || !id || !userProfile) return;

    const interacao: Interacao = {
      id: crypto.randomUUID(),
      tipo: novaInteracao.tipo,
      descricao: novaInteracao.descricao.trim(),
      dataHora: Timestamp.now(),
      usuarioId: userProfile.uid || '',
      usuarioNome: userProfile.nome || userProfile.email || 'Usuário',
    };

    setForm((prev) => ({
      ...prev,
      interacoes: [...(prev.interacoes || []), interacao],
    }));

    setNovaInteracao({ tipo: 'anotacao', descricao: '' });

    try {
      await addInteracao(id, {
        tipo: interacao.tipo,
        descricao: interacao.descricao,
        dataHora: interacao.dataHora,
        usuarioId: interacao.usuarioId,
        usuarioNome: interacao.usuarioNome,
      });
      toast.success('Interação adicionada!');
    } catch (err) {
      console.error('ERRO AO SALVAR INTERAÇÃO:', err);
      toast.error('Erro ao salvar interação no servidor');
      setForm((prev) => ({
        ...prev,
        interacoes: (prev.interacoes || []).filter((i) => i.id !== interacao.id),
      }));
    }
  };

  const abaButtons: { key: Aba; label: string; icon: typeof User }[] = [
    { key: 'dados', label: 'Dados', icon: User },
    { key: 'interacoes', label: 'Interações', icon: MessageSquare },
    { key: 'notas', label: 'Notas', icon: FileText },
  ];

  if (loading && id) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/leads')}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {id ? 'Editar Lead' : 'Novo Lead'}
          </h1>
          <p className="text-slate-400 text-sm">
            {id ? form.razaoSocial || 'Carregando...' : 'Preencha os dados da empresa'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {abaButtons.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              aba === key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
            {key === 'interacoes' && form.interacoes && (
              <span className="bg-slate-800 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
                {form.interacoes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {aba === 'dados' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Razão Social *"
                  value={form.razaoSocial || ''}
                  onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
                  error={errors.razaoSocial}
                  containerClassName="md:col-span-2"
                />
                <Input
                  label="Nome Fantasia"
                  value={form.nomeFantasia || ''}
                  onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                />
                <Input
                  label="CNPJ *"
                  value={form.cnpj ? formatCNPJ(form.cnpj) : ''}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value.replace(/\D/g, '') })}
                  error={errors.cnpj}
                  placeholder="00.000.000/0000-00"
                />
                <Input
                  label="Telefone"
                  value={form.telefone ? formatPhone(form.telefone) : ''}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value.replace(/\D/g, '') })}
                  error={errors.telefone}
                  placeholder="(00) 00000-0000"
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                />
                <Select
                  label="Segmento"
                  value={form.segmento || ''}
                  onChange={(e) => setForm({ ...form, segmento: e.target.value })}
                  options={segmentos}
                />
                <Select
                  label="Porte"
                  value={form.porte || ''}
                  onChange={(e) => setForm({ ...form, porte: e.target.value as Lead['porte'] })}
                  options={portes}
                />
                <Input
                  label="Capital Social"
                  type="number"
                  value={form.capitalSocial || ''}
                  onChange={(e) => setForm({ ...form, capitalSocial: Number(e.target.value) || undefined })}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Sócios"
                    value={form.socios || ''}
                    onChange={(e) => setForm({ ...form, socios: e.target.value })}
                    containerClassName="md:col-span-2"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="CEP"
                  value={form.cep ? formatCEP(form.cep) : ''}
                  onChange={(e) => {
                    const cep = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, cep });
                    if (cep.length === 8) buscarCEP(cep);
                  }}
                  error={errors.cep}
                  placeholder="00000-000"
                />
                <Input
                  label="Logradouro"
                  value={form.logradouro || ''}
                  onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                  containerClassName="md:col-span-2"
                />
                <Input
                  label="Número"
                  value={form.numero || ''}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
                <Input
                  label="Complemento"
                  value={form.complemento || ''}
                  onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                />
                <Input
                  label="Bairro"
                  value={form.bairro || ''}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                />
                <Input
                  label="Cidade / Município"
                  value={form.municipio || ''}
                  onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                />
                <Input
                  label="UF"
                  value={form.uf || ''}
                  onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Funil e Classificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Status do Funil"
                  value={form.statusFunil || 'novo'}
                  onChange={(e) => setForm({ ...form, statusFunil: e.target.value as Lead['statusFunil'] })}
                  options={statusFunilOptions}
                />
                <Select
                  label="Produto Sugerido"
                  value={form.produtoSugerido || 'qualificar'}
                  onChange={(e) => setForm({ ...form, produtoSugerido: e.target.value as Lead['produtoSugerido'] })}
                  options={[
                    { value: 'cloudfy', label: 'Cloudfy' },
                    { value: 'cplug', label: 'Cplug' },
                    { value: 'qualificar', label: 'Qualificar' },
                  ]}
                />
                <Select
                  label="Classificação"
                  value={form.classificacao || 'C'}
                  onChange={(e) => setForm({ ...form, classificacao: e.target.value as Lead['classificacao'] })}
                  options={[
                    { value: 'A', label: 'A - Excelente' },
                    { value: 'B', label: 'B - Bom' },
                    { value: 'C', label: 'C - Regular' },
                  ]}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Contatos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Nome do Contato Principal"
                  value={form.contatoNome || ''}
                  onChange={(e) => setForm({ ...form, contatoNome: e.target.value })}
                />
                <Input
                  label="Telefone do Contato"
                  value={form.contatoTel ? formatPhone(form.contatoTel) : ''}
                  onChange={(e) => setForm({ ...form, contatoTel: e.target.value.replace(/\D/g, '') })}
                />
                <Input
                  label="Email do Contato"
                  type="email"
                  value={form.contatoEmail || ''}
                  onChange={(e) => setForm({ ...form, contatoEmail: e.target.value })}
                />
                <div className="md:col-span-2 border-t border-slate-800 pt-4 mt-2">
                  <p className="text-sm font-medium text-slate-300 mb-3">Responsável Financeiro</p>
                </div>
                <Input
                  label="Nome"
                  value={form.respFinanceiroNome || ''}
                  onChange={(e) => setForm({ ...form, respFinanceiroNome: e.target.value })}
                />
                <Input
                  label="Telefone"
                  value={form.respFinanceiroTel ? formatPhone(form.respFinanceiroTel) : ''}
                  onChange={(e) => setForm({ ...form, respFinanceiroTel: e.target.value.replace(/\D/g, '') })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.respFinanceiroEmail || ''}
                  onChange={(e) => setForm({ ...form, respFinanceiroEmail: e.target.value })}
                />
              </div>
            </Card>

            {id && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">Status do Registro</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="arquivado"
                      checked={form.arquivado || false}
                      onChange={(e) => setForm({ ...form, arquivado: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <label htmlFor="arquivado" className="text-sm text-slate-300">
                      Arquivado (não aparece no funil)
                    </label>
                  </div>
                  {form.dataArquivamento && (
                    <span className="text-xs text-slate-500">
                      Arquivado em: {typeof form.dataArquivamento === 'object' && 'seconds' in form.dataArquivamento
                        ? new Date(form.dataArquivamento.seconds * 1000).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {aba === 'interacoes' && id && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Nova Interação</h3>
              <div className="flex gap-4">
                <div className="w-48">
                  <Select
                    label="Tipo"
                    value={novaInteracao.tipo}
                    onChange={(e) => setNovaInteracao({ ...novaInteracao, tipo: e.target.value as Interacao['tipo'] })}
                    options={tipoInteracaoOptions}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                  <div className="flex gap-2">
                    <textarea
                      value={novaInteracao.descricao}
                      onChange={(e) => setNovaInteracao({ ...novaInteracao, descricao: e.target.value })}
                      className="flex-1 bg-slate-850 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none h-20"
                      placeholder="Descreva a interação..."
                    />
                    <Button
                      type="button"
                      onClick={handleAddInteracao}
                      disabled={!novaInteracao.descricao.trim()}
                      className="self-end"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Histórico</h3>
              {form.interacoes && form.interacoes.length > 0 ? (
                [...form.interacoes]
                  .sort((a, b) => {
                    const aTime = typeof a.dataHora === 'object' && 'seconds' in a.dataHora
                      ? a.dataHora.seconds
                      : 0;
                    const bTime = typeof b.dataHora === 'object' && 'seconds' in b.dataHora
                      ? b.dataHora.seconds
                      : 0;
                    return bTime - aTime;
                  })
                  .map((interacao) => (
                    <InteracaoItem key={interacao.id} interacao={interacao} />
                  ))
              ) : (
                <p className="text-slate-500 text-center py-8">Nenhuma interação registrada</p>
              )}
            </div>
          </div>
        )}

        {aba === 'interacoes' && !id && (
          <Card>
            <p className="text-slate-500 text-center py-8">
              Salve o lead primeiro para adicionar interações
            </p>
          </Card>
        )}

        {aba === 'notas' && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Observações Gerais</h3>
            <textarea
              value={form.observacoes || ''}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full bg-slate-850 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none h-40"
              placeholder="Adicione observações sobre este lead..."
            />
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/leads')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={saving}>
            <Save size={16} className="mr-2" />
            {id ? 'Salvar Alterações' : 'Criar Lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}
