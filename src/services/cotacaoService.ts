import { collection, getDocs, query, where } from 'firebase/firestore';
import { createCrudService } from './crudService';
import { db } from '@/firebase';
import type { Cotacao } from '@/types';

const baseService = createCrudService<Cotacao>('cotacoes');

export const cotacaoService = {
  ...baseService,
  async listarPorLead(leadId: string) {
    const snapshot = await getDocs(query(collection(db, 'cotacoes'), where('leadId', '==', leadId)));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Cotacao[];
  },
};
