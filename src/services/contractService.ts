import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import type {
  ContractDocument,
  ContractTableRow,
  ContractTableSnapshot,
  ContractTemplate,
  Cotacao,
  Lead,
} from '@/types';
import { formatCEP, formatCNPJ, formatInscricaoEstadual } from '@/utils/formatters';
import { CONTRATO_CLOUDFY_TEMPLATE, removeRepresentativeSignatureHint } from '@/utils/contratoCloudfyTemplate';

const TEMPLATE_ID = 'cloudfy';

function buildTableSnapshot(cotacao: Cotacao): ContractTableSnapshot {
  const discountPercent = Number(cotacao.descontoPercentual) || 0;
  const licenses: ContractTableRow[] = (cotacao.itensCplug || [])
    .filter((item) => item.selecionado)
    .map((item) => {
      const quantity = Math.max(1, Number(item.quantidade) || 1);
      const unitValue = Number(item.valorUnitario) || 0;
      const itemDiscount = item.aplicaDescontoGlobal === false ? 0 : discountPercent;
      return {
        description: item.nome || 'Licença sem descrição',
        quantity,
        unitValue,
        discountPercent: itemDiscount,
        total: Number((unitValue * quantity * (1 - itemDiscount / 100)).toFixed(2)),
      };
    });
  const services: ContractTableRow[] = (cotacao.adicionais || [])
    .filter((item) => item.selecionado)
    .map((item) => ({
      description: item.nome || 'Serviço sem descrição',
      quantity: Math.max(1, Number(item.quantidade) || 1),
      unitValue: Number(item.valor) || 0,
      total: Number(((Number(item.valor) || 0) * Math.max(1, Number(item.quantidade) || 1)).toFixed(2)),
    }));
  const calculatedMonthly = licenses.reduce((sum, item) => sum + item.total, 0);
  const totalMonthly = Number(cotacao.totalMensalidade ?? calculatedMonthly);
  const grossMonthly = licenses.reduce((sum, item) => sum + item.unitValue * item.quantity, 0);
  const discountAmount = Number(cotacao.descontoGlobal ?? Math.max(0, grossMonthly - totalMonthly));
  const totalServices = Number(cotacao.valorServicos ?? services.reduce((sum, item) => sum + item.total, 0));
  const installments = (cotacao.parcelasServicos || []).map((installment) => ({
    numero: Number(installment.numero) || 1,
    valor: Number(installment.valor) || 0,
    dataVencimento: installment.dataVencimento || '',
  }));
  if (installments.some((installment) => !installment.dataVencimento)) {
    throw new Error('Informe as datas de vencimento de todas as parcelas antes de preparar o contrato.');
  }
  const installmentTotal = installments.reduce((sum, installment) => sum + installment.valor, 0);
  if (installments.length > 0 && Math.abs(installmentTotal - totalServices) > 0.01) {
    throw new Error('O total das parcelas não corresponde ao total dos serviços. Revise a cotação antes de preparar o contrato.');
  }

  return {
    licenses,
    services,
    totalMonthly,
    totalServices,
    discountPercent,
    discountAmount,
    installments,
  };
}

function hydrateContractTablesHtml(html: string, tables: ContractTableSnapshot): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const tableData: Record<string, { rows: ContractTableRow[]; total: number }> = {
    licenses: { rows: Array.isArray(tables.licenses) ? tables.licenses : [], total: Number(tables.totalMonthly) || 0 },
    services: { rows: Array.isArray(tables.services) ? tables.services : [], total: Number(tables.totalServices) || 0 },
  };
  parsed.querySelectorAll<HTMLElement>('[data-contract-table]').forEach((element) => {
    const kind = element.dataset.contractTable === 'services' ? 'services' : 'licenses';
    const data = tableData[kind];
    element.dataset.contractTableRows = JSON.stringify(data.rows);
    element.dataset.contractTableTotal = String(data.total);
    element.dataset.contractDiscountPercent = String(Number(tables.discountPercent) || 0);
    element.dataset.contractDiscountAmount = String(kind === 'licenses' ? Number(tables.discountAmount) || 0 : 0);
    element.dataset.contractInstallments = JSON.stringify(
      kind === 'services' && Array.isArray(tables.installments) ? tables.installments : [],
    );
  });
  return parsed.body.innerHTML;
}

function buildContractHtml(templateHtml: string, lead: Lead, tables: ContractTableSnapshot): string {
  const generatedDate = new Date().toLocaleDateString('pt-BR');
  const address = [
    lead.logradouro,
    lead.numero,
    lead.complemento,
    lead.bairro,
    lead.cep ? `CEP ${formatCEP(lead.cep)}` : '',
  ].filter(Boolean).join(', ');
  const replacements: Record<string, string> = {
    '{{CLIENT_LEGAL_NAME}}': lead.razaoSocial || '[RAZÃO SOCIAL A PREENCHER]',
    '{{CLIENT_CNPJ}}': lead.cnpj ? formatCNPJ(lead.cnpj) : '[CNPJ A PREENCHER]',
    '{{CLIENT_IE}}': lead.inscricaoEstadual
      ? formatInscricaoEstadual(lead.inscricaoEstadual, lead.uf || '')
      : 'não informada',
    '{{CLIENT_FANTASY_NAME}}': lead.nomeFantasia || lead.razaoSocial || '[NOME FANTASIA A PREENCHER]',
    '{{CLIENT_ADDRESS}}': address || '[ENDEREÇO A PREENCHER]',
    '{{CLIENT_CITY}}': lead.municipio || '[MUNICÍPIO A PREENCHER]',
    '{{CLIENT_STATE}}': lead.uf || '[ESTADO A PREENCHER]',
    '{{PROPOSAL_DATE}}': generatedDate,
    '{{CONTRACT_DATE}}': generatedDate,
  };
  const parsed = new DOMParser().parseFromString(removeRepresentativeSignatureHint(templateHtml), 'text/html');
  const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      current.textContent = current.textContent?.split(placeholder).join(replacement) || '';
    }
    current = walker.nextNode();
  }
  return hydrateContractTablesHtml(parsed.body.innerHTML, tables);
}

export function gerarFingerprintContrato(cotacao: Cotacao, lead: Lead): string {
  return JSON.stringify({
    numero: cotacao.numero || '',
    tipoProduto: cotacao.tipoProduto || '',
    descontoPercentual: Number(cotacao.descontoPercentual) || 0,
    descontoGlobal: Number(cotacao.descontoGlobal) || 0,
    valorServicos: Number(cotacao.valorServicos) || 0,
    licencas: (cotacao.itensCplug || [])
      .filter((item) => item.selecionado)
      .map((item) => ({
        id: item.licencaId,
        nome: item.nome,
        quantidade: Number(item.quantidade) || 1,
        valorUnitario: Number(item.valorUnitario) || 0,
        aplicaDescontoGlobal: item.aplicaDescontoGlobal !== false,
      })),
    servicos: (cotacao.adicionais || [])
      .filter((item) => item.selecionado)
      .map((item) => ({
        id: item.adicionalId,
        nome: item.nome,
        quantidade: Number(item.quantidade) || 1,
        valor: Number(item.valor) || 0,
      })),
    parcelas: (cotacao.parcelasServicos || []).map((item) => ({
      numero: Number(item.numero) || 1,
      valor: Number(item.valor) || 0,
      dataVencimento: item.dataVencimento || '',
    })),
    totalMensalidade: Number(cotacao.totalMensalidade) || 0,
    totalServicos: Number(cotacao.valorServicos) || 0,
    cliente: {
      razaoSocial: lead.razaoSocial || '',
      nomeFantasia: lead.nomeFantasia || '',
      cnpj: lead.cnpj || '',
      inscricaoEstadual: lead.inscricaoEstadual || '',
      logradouro: lead.logradouro || '',
      numero: lead.numero || '',
      complemento: lead.complemento || '',
      bairro: lead.bairro || '',
      cep: lead.cep || '',
      municipio: lead.municipio || '',
      uf: lead.uf || '',
    },
  });
}

export const contractService = {
  async getTemplate(): Promise<ContractTemplate> {
    const snapshot = await getDoc(doc(db, 'contract_templates', TEMPLATE_ID));
    if (!snapshot.exists()) return { id: TEMPLATE_ID, html: CONTRATO_CLOUDFY_TEMPLATE, version: 1 };
    const savedTemplate = snapshot.data() as Omit<ContractTemplate, 'id'>;
    const html = removeRepresentativeSignatureHint(String(savedTemplate.html || CONTRATO_CLOUDFY_TEMPLATE));
    return { id: snapshot.id, ...savedTemplate, html, needsSave: html !== savedTemplate.html };
  },

  async saveTemplate(html: string, userId: string): Promise<number> {
    const reference = doc(db, 'contract_templates', TEMPLATE_ID);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      const version = snapshot.exists() ? (Number(snapshot.data().version) || 0) + 1 : 1;
      transaction.set(reference, {
        html,
        version,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      });
      return version;
    });
  },

  async getContract(cotacaoId: string): Promise<ContractDocument | null> {
    const snapshot = await getDoc(doc(db, 'contracts', cotacaoId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as ContractDocument : null;
  },

  async restoreContractTables(cotacaoId: string, quotation: Cotacao): Promise<ContractDocument> {
    const reference = doc(db, 'contracts', cotacaoId);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error('Contrato não encontrado.');

      const data = snapshot.data() as Omit<ContractDocument, 'id'>;
      const hasSnapshotShape = Array.isArray(data.tables?.licenses) &&
        Array.isArray(data.tables?.services) &&
        Array.isArray(data.tables?.installments);
      const storedSnapshotHasRows = hasSnapshotShape && (
        data.tables.licenses.length > 0 ||
        data.tables.services.length > 0 ||
        data.tables.installments.length > 0
      );
      let hasPersistedTableSnapshot = hasSnapshotShape;
      let tables = data.tables;
      if (!hasSnapshotShape || !storedSnapshotHasRows) {
        const quoteTables = buildTableSnapshot(quotation);
        const quoteHasRows = quoteTables.licenses.length > 0 ||
          quoteTables.services.length > 0 ||
          quoteTables.installments.length > 0;
        if (!hasSnapshotShape || quoteHasRows) {
          hasPersistedTableSnapshot = false;
          tables = quoteTables;
        }
      }
      const repairedHtml = hydrateContractTablesHtml(data.html, tables);
      if (!hasPersistedTableSnapshot || repairedHtml !== data.html) {
        transaction.update(reference, {
          html: repairedHtml,
          ...(!hasPersistedTableSnapshot ? { tables } : {}),
          updatedAt: serverTimestamp(),
        });
      }
      return { id: snapshot.id, ...data, tables, html: repairedHtml } as ContractDocument;
    });
  },

  async listContractVersions(cotacaoId: string): Promise<ContractDocument[]> {
    const snapshot = await getDocs(collection(db, 'contracts', cotacaoId, 'versions'));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as ContractDocument)
      .sort((first, second) => second.version - first.version);
  },

  async createForApprovedQuote(cotacao: Cotacao, lead: Lead): Promise<ContractDocument> {
    const reference = doc(db, 'contracts', cotacao.id);
    const templateReference = doc(db, 'contract_templates', TEMPLATE_ID);
    const quotationReference = doc(db, 'cotacoes', cotacao.id);
    const leadReference = doc(db, 'leads', lead.id);

    return runTransaction(db, async (transaction) => {
      const [contractSnapshot, templateSnapshot, quotationSnapshot, leadSnapshot] = await Promise.all([
        transaction.get(reference),
        transaction.get(templateReference),
        transaction.get(quotationReference),
        transaction.get(leadReference),
      ]);
      if (contractSnapshot.exists()) {
        return { id: contractSnapshot.id, ...contractSnapshot.data() } as ContractDocument;
      }
      if (!quotationSnapshot.exists()) throw new Error('Cotação não encontrada.');
      const currentQuotation = { id: quotationSnapshot.id, ...quotationSnapshot.data() } as Cotacao;
      if (currentQuotation.status !== 'aprovada') throw new Error('O contrato só pode ser preparado para uma cotação aprovada.');
      if (currentQuotation.tipoProduto !== 'cloudfy') throw new Error('A geração está disponível apenas para cotações Cloudfy neste momento.');
      if (!leadSnapshot.exists()) throw new Error('Cliente não encontrado.');
      const currentLead = { id: leadSnapshot.id, ...leadSnapshot.data() } as Lead;
      if (currentQuotation.leadId !== currentLead.id) throw new Error('O cliente da cotação foi alterado. Atualize a tela e tente novamente.');
      const templateHtml = templateSnapshot.exists()
        ? String(templateSnapshot.data().html || CONTRATO_CLOUDFY_TEMPLATE)
        : CONTRATO_CLOUDFY_TEMPLATE;
      const templateVersion = templateSnapshot.exists() ? Number(templateSnapshot.data().version) || 1 : 1;
      const tables = buildTableSnapshot(currentQuotation);
      const html = buildContractHtml(templateHtml, currentLead, tables);
      const contract: Omit<ContractDocument, 'id'> = {
        cotacaoId: currentQuotation.id,
        leadId: currentLead.id,
        clienteNome: currentLead.razaoSocial,
        numeroCotacao: currentQuotation.numero || currentQuotation.id,
        version: 1,
        templateVersion,
        html,
        tables,
        sourceFingerprint: gerarFingerprintContrato(currentQuotation, currentLead),
        ...(currentQuotation.vendedorId ? { vendedorId: currentQuotation.vendedorId } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      transaction.set(reference, contract);
      return { id: currentQuotation.id, ...contract };
    });
  },

  async createUpdatedVersion(cotacao: Cotacao, lead: Lead): Promise<ContractDocument> {
    const reference = doc(db, 'contracts', cotacao.id);
    const templateReference = doc(db, 'contract_templates', TEMPLATE_ID);
    const quotationReference = doc(db, 'cotacoes', cotacao.id);
    const leadReference = doc(db, 'leads', lead.id);

    return runTransaction(db, async (transaction) => {
      const currentSnapshot = await transaction.get(reference);
      if (!currentSnapshot.exists()) throw new Error('Contrato atual não encontrado.');
      const currentData = currentSnapshot.data() as Omit<ContractDocument, 'id'>;
      const currentVersion = Number(currentData.version) || 1;
      const historyReference = doc(db, 'contracts', cotacao.id, 'versions', String(currentVersion));
      const [templateSnapshot, quotationSnapshot, leadSnapshot, historySnapshot] = await Promise.all([
        transaction.get(templateReference),
        transaction.get(quotationReference),
        transaction.get(leadReference),
        transaction.get(historyReference),
      ]);
      if (!quotationSnapshot.exists()) throw new Error('Cotação não encontrada.');
      const currentQuotation = { id: quotationSnapshot.id, ...quotationSnapshot.data() } as Cotacao;
      if (currentQuotation.status !== 'aprovada') throw new Error('A cotação precisa estar aprovada para atualizar o contrato.');
      if (currentQuotation.tipoProduto !== 'cloudfy') throw new Error('A geração está disponível apenas para cotações Cloudfy neste momento.');
      if (!leadSnapshot.exists()) throw new Error('Cliente não encontrado.');
      const currentLead = { id: leadSnapshot.id, ...leadSnapshot.data() } as Lead;
      if (currentQuotation.leadId !== currentLead.id) throw new Error('O cliente da cotação foi alterado. Atualize a tela e tente novamente.');

      const sourceFingerprint = gerarFingerprintContrato(currentQuotation, currentLead);
      if (currentData.sourceFingerprint === sourceFingerprint) {
        return { id: cotacao.id, ...currentData } as ContractDocument;
      }
      if (historySnapshot.exists()) throw new Error('Esta versão já foi arquivada. Atualize a tela e tente novamente.');

      const templateHtml = templateSnapshot.exists()
        ? String(templateSnapshot.data().html || CONTRATO_CLOUDFY_TEMPLATE)
        : CONTRATO_CLOUDFY_TEMPLATE;
      const templateVersion = templateSnapshot.exists() ? Number(templateSnapshot.data().version) || 1 : 1;
      const tables = buildTableSnapshot(currentQuotation);
      const nextContract: Omit<ContractDocument, 'id'> = {
        cotacaoId: currentQuotation.id,
        leadId: currentLead.id,
        clienteNome: currentLead.razaoSocial,
        numeroCotacao: currentQuotation.numero || currentQuotation.id,
        version: currentVersion + 1,
        templateVersion,
        html: buildContractHtml(templateHtml, currentLead, tables),
        tables,
        sourceFingerprint,
        ...(currentQuotation.vendedorId ? { vendedorId: currentQuotation.vendedorId } : {}),
        createdAt: currentData.createdAt,
        updatedAt: serverTimestamp(),
      };
      transaction.set(historyReference, {
        ...currentData,
        id: historyReference.id,
        archivedAt: serverTimestamp(),
      });
      transaction.set(reference, nextContract);
      return { id: cotacao.id, ...nextContract };
    });
  },

  async saveContract(contractId: string, html: string, userId: string): Promise<void> {
    const reference = doc(db, 'contracts', contractId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error('Contrato não encontrado.');
      transaction.update(reference, {
        html,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      });
    });
  },
};
