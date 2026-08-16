import {
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Lead } from '@/types';

export const funilService = {
  async moverLead(leadId: string, novoStatus: Lead['statusFunil']) {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      statusFunil: novoStatus,
      atualizadoEm: serverTimestamp(),
    });
  },
};
