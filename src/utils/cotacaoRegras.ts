import type { StatusFunil } from '@/types';

export const statusElegiveisParaCotacao: StatusFunil[] = ['contato', 'proposta', 'negociacao'];

export function leadPodeReceberCotacao(status?: StatusFunil): boolean {
  return status ? statusElegiveisParaCotacao.includes(status) : false;
}

export const rotulosStatusCotacao: Record<StatusFunil, string> = {
  novo: 'Novo',
  contato: 'Contato',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado_ganho: 'Fechado (Ganho)',
  fechado_perdido: 'Fechado (Perdido)',
};
