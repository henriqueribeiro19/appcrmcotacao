export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

const ieMasks: Record<string, Record<number, string>> = {
  AC: { 13: '##.###.###/###-##' },
  AL: { 9: '#########' },
  AP: { 9: '##.###.###-#' },
  AM: { 9: '##.###.###-#' },
  BA: { 8: '######-##', 9: '#######-##' },
  CE: { 9: '########-#' },
  DF: { 13: '########.###-##' },
  ES: { 9: '###.###.##-#' },
  GO: { 9: '##.###.###-#' },
  MA: { 9: '########-#' },
  MT: { 11: '##########-#' },
  MS: { 9: '########-#' },
  MG: { 13: '###.###.###/####' },
  PA: { 9: '##-######-#' },
  PB: { 9: '########-#' },
  PR: { 10: '##.###.###-##' },
  PE: { 9: '#######-##' },
  PI: { 9: '########-#' },
  RJ: { 8: '##.###.##-#' },
  RN: { 9: '##.###.###-#', 10: '##.#.###.###-#' },
  RS: { 10: '###/#######' },
  RO: { 14: '#############-#' },
  RR: { 9: '##.###.###-#' },
  SC: { 9: '###.###.###' },
  SP: { 12: '###.###.###.###' },
  SE: { 9: '########-#' },
  TO: { 11: '##.###.###-#' },
};

export function formatInscricaoEstadual(value: string, uf: string): string {
  const digits = value.replace(/\D/g, '');
  const mask = ieMasks[uf.trim().toUpperCase()]?.[digits.length];
  if (!mask || !/^\d+$/.test(value)) return value;

  let digitIndex = 0;
  return mask.replace(/#/g, () => digits[digitIndex++] || '');
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

export function formatDate(timestamp: unknown): string {
  if (!timestamp) return '-';
  if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
    const date = new Date((timestamp as { seconds: number }).seconds * 1000);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return String(timestamp);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
export function formatarEntradaMonetaria(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function formatarNumeroMonetario(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
