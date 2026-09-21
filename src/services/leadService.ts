import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Lead, Interacao } from '@/types';

const LEADS_COLLECTION = 'leads';

function limparUndefined<T extends Record<string, unknown>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as T;
}

function normalizarCNPJ(cnpj?: string) {
  return (cnpj || '').replace(/\D/g, '');
}

export const leadService = {
  async validarCnpjUnico(cnpj: string, currentId?: string) {
    const cnpjLimpo = normalizarCNPJ(cnpj);
    if (!cnpjLimpo || cnpjLimpo.length !== 14) return;

    const q = query(
      collection(db, LEADS_COLLECTION),
      where('cnpj', '==', cnpjLimpo),
      where('status', '==', 'ativo'),
    );

    const snapshot = await getDocs(q);
    const duplicado = snapshot.docs.some((item) => item.id !== currentId);

    if (duplicado) {
      throw new Error('Já existe um lead ativo com este CNPJ.');
    }
  },

  async getAll(constraints: QueryConstraint[] = []) {
    const q = query(collection(db, LEADS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];
  },

  async getById(id: string) {
    const docRef = doc(db, LEADS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Lead;
    }
    return null;
  },

  async create(data: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) {
    await this.validarCnpjUnico(data.cnpj, undefined);

    const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
      ...limparUndefined(data as unknown as Record<string, unknown>),
      interacoes: [],
      arquivado: false,
      dataArquivamento: null,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Lead>) {
    if (data.cnpj) {
      await this.validarCnpjUnico(data.cnpj, id);
    }

    const docRef = doc(db, LEADS_COLLECTION, id);
    const statusFinalizado = data.statusFunil === 'fechado_ganho' || data.statusFunil === 'fechado_perdido';
    const { arquivado, dataArquivamento, ...dadosEditaveis } = data;
    await updateDoc(docRef, {
      ...limparUndefined({
        ...dadosEditaveis,
        ...(statusFinalizado ? { arquivado, dataArquivamento } : {}),
      } as unknown as Record<string, unknown>),
      atualizadoEm: serverTimestamp(),
    });
  },

  async softDelete(id: string) {
    const docRef = doc(db, LEADS_COLLECTION, id);
    await updateDoc(docRef, {
      excluidoEm: serverTimestamp(),
      status: 'inativo',
      atualizadoEm: serverTimestamp(),
    });
  },

  async addInteracao(leadId: string, interacao: Omit<Interacao, 'id'>) {
    const leadRef = doc(db, LEADS_COLLECTION, leadId);
    const leadDoc = await getDoc(leadRef);

    if (!leadDoc.exists()) {
      throw new Error('Lead não encontrado');
    }

    const leadData = leadDoc.data() as Lead;
    const interacoesAtuais = Array.isArray(leadData.interacoes) ? leadData.interacoes : [];

    const novaInteracao: Interacao = {
      ...interacao,
      id: crypto.randomUUID(),
    };

    const interacaoLimpa = limparUndefined(novaInteracao as unknown as Record<string, unknown>);

    await updateDoc(leadRef, {
      interacoes: [...interacoesAtuais, interacaoLimpa],
      atualizadoEm: serverTimestamp(),
    });

    return novaInteracao;
  },

  async updateStatusFunil(id: string, statusFunil: Lead['statusFunil']) {
    const docRef = doc(db, LEADS_COLLECTION, id);
    const updateData: Record<string, unknown> = {
      statusFunil,
      atualizadoEm: serverTimestamp(),
    };

    // Se movido para ganho ou perdido, arquiva automaticamente
    if (statusFunil === 'fechado_ganho' || statusFunil === 'fechado_perdido') {
      updateData.arquivado = true;
      updateData.dataArquivamento = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
  },

  async desarquivar(id: string) {
    const docRef = doc(db, LEADS_COLLECTION, id);
    await updateDoc(docRef, {
      arquivado: false,
      dataArquivamento: null,
      statusFunil: 'negociacao',
      atualizadoEm: serverTimestamp(),
    });
  },

  async getLeadsByVendedor(vendedorId: string) {
    const all = await this.getAll([
      where('responsavelId', '==', vendedorId),
      where('arquivado', '==', false),
    ]);
    return all
      .filter((lead) => lead.status === 'ativo')
      .sort((a, b) => {
        const aTime = a.criadoEm && typeof a.criadoEm === 'object' && 'seconds' in a.criadoEm
          ? a.criadoEm.seconds
          : 0;
        const bTime = b.criadoEm && typeof b.criadoEm === 'object' && 'seconds' in b.criadoEm
          ? b.criadoEm.seconds
          : 0;
        return bTime - aTime;
      });
  },

  async getAllActive() {
    const all = await this.getAll([
      where('status', '==', 'ativo'),
      where('arquivado', '==', false),
    ]);
    return all.sort((a, b) => {
      const aTime = a.criadoEm && typeof a.criadoEm === 'object' && 'seconds' in a.criadoEm
        ? a.criadoEm.seconds
        : 0;
      const bTime = b.criadoEm && typeof b.criadoEm === 'object' && 'seconds' in b.criadoEm
        ? b.criadoEm.seconds
        : 0;
      return bTime - aTime;
    });
  },

  async getArquivados() {
    const all = await this.getAll([
      where('status', '==', 'ativo'),
      where('arquivado', '==', true),
    ]);
    return all.sort((a, b) => {
      const aTime = a.dataArquivamento && typeof a.dataArquivamento === 'object' && 'seconds' in a.dataArquivamento
        ? a.dataArquivamento.seconds
        : 0;
      const bTime = b.dataArquivamento && typeof b.dataArquivamento === 'object' && 'seconds' in b.dataArquivamento
        ? b.dataArquivamento.seconds
        : 0;
      return bTime - aTime;
    });
  },
};
