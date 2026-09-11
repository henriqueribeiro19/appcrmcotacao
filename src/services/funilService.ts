import {
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Lead, Interacao, ProdutoContratado } from '@/types';

export const funilService = {
  async moverLead(leadId: string, novoStatus: Lead['statusFunil']) {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      statusFunil: novoStatus,
      atualizadoEm: serverTimestamp(),
    });
  },

  async arquivarLeadPerdido(
    leadId: string,
    motivo: string,
    observacao: string,
    usuarioId: string,
    usuarioNome: string,
  ) {
    const leadRef = doc(db, 'leads', leadId);
    const leadSnapshot = await getDoc(leadRef);

    if (!leadSnapshot.exists()) {
      throw new Error('Lead não encontrado');
    }

    const lead = leadSnapshot.data() as Lead;
    const interacoesAtuais = Array.isArray(lead.interacoes) ? lead.interacoes : [];
    const novaInteracao: Interacao = {
      id: crypto.randomUUID(),
      tipo: 'anotacao',
      descricao: `Lead marcado como perdido. Motivo: ${motivo}\nObservação: ${observacao}`,
      dataHora: Timestamp.now(),
      usuarioId,
      usuarioNome,
    };

    await updateDoc(leadRef, {
      statusFunil: 'fechado_perdido',
      arquivado: true,
      dataArquivamento: serverTimestamp(),
      interacoes: [...interacoesAtuais, novaInteracao],
      atualizadoEm: serverTimestamp(),
    });
  },

  async arquivarLeadGanho(leadId: string, produtoContratado: ProdutoContratado) {
    const leadRef = doc(db, 'leads', leadId);
    const leadSnapshot = await getDoc(leadRef);

    if (!leadSnapshot.exists()) {
      throw new Error('Lead não encontrado');
    }

    const dataContratacao = serverTimestamp();
    await updateDoc(leadRef, {
      statusFunil: 'fechado_ganho',
      arquivado: true,
      dataArquivamento: dataContratacao,
      dataContratacao,
      produtoContratado,
      atualizadoEm: serverTimestamp(),
    });
  },
};
