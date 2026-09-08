import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Staging, Lead, Classificacao } from '@/types';

const STAGING_COLLECTION = 'staging';

function calcularScore(staging: Partial<Staging>): number {
  let score = 50;
  const segmentoPremium = ['Restaurante', 'Bar'];
  const segmentoPadrao = ['Lanchonete', 'Padaria'];
  const cidadesGrandes = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'];

  if (staging.segmento && segmentoPremium.includes(staging.segmento)) score += 15;
  if (staging.segmento && segmentoPadrao.includes(staging.segmento)) score += 10;
  if (staging.email && staging.email.includes('@')) score += 5;
  if (staging.telefone && staging.telefone.length >= 10) score += 5;
  if (staging.municipio && cidadesGrandes.includes(staging.municipio)) score += 5;
  if (!staging.email) score -= 10;
  if (!staging.telefone) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function getClassificacao(score: number): Classificacao {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

export const stagingService = {
  async getAll(status?: string) {
    const constraints = status ? [where('status', '==', status)] : [];
    const q = query(
      collection(db, STAGING_COLLECTION),
      ...constraints,
      orderBy('criadoEm', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Staging[];
  },

  async getById(id: string) {
    const docRef = doc(db, STAGING_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Staging;
    }
    return null;
  },

  async create(data: Omit<Staging, 'id' | 'score' | 'classificacao' | 'produtoSugerido' | 'criadoEm' | 'status'>) {
    const score = calcularScore(data);
    const docRef = await addDoc(collection(db, STAGING_COLLECTION), {
      ...data,
      score,
      classificacao: getClassificacao(score),
      produtoSugerido: 'qualificar',
      status: 'pendente',
      criadoEm: serverTimestamp(),
    });
    return docRef.id;
  },

  async createMany(items: Omit<Staging, 'id' | 'score' | 'classificacao' | 'produtoSugerido' | 'criadoEm' | 'status'>[]) {
    const createdIds: string[] = [];
    for (const item of items) {
      const id = await this.create(item);
      createdIds.push(id);
    }
    return createdIds;
  },

  async update(id: string, data: Partial<Staging>) {
    const docRef = doc(db, STAGING_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  async approve(id: string, leadData: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) {
    const { leadService } = await import('./leadService');
    const leadId = await leadService.create(leadData);
    await this.update(id, {
      status: 'aprovado',
      leadId,
    });
    return leadId;
  },

  async reject(id: string, motivo: string) {
    await this.update(id, {
      status: 'descartado',
      motivoDescarte: motivo,
    });
  },

  async reactivate(id: string) {
    await updateDoc(doc(db, STAGING_COLLECTION, id), {
      status: 'pendente',
      motivoDescarte: deleteField(),
    });
  },

  async delete(id: string) {
    await deleteDoc(doc(db, STAGING_COLLECTION, id));
  },
};
