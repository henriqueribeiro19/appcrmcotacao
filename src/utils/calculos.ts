import type { CotacaoItemCplug, CotacaoAdicional, CategoriaCanal } from '@/types';

export interface ResumoCotacao {
  subtotalLicencas: number;
  descontoValor: number;
  totalMensalidade: number;
  totalServicos: number;
  totalGeral: number;
  percentualRoyalties: number;
  totalRoyalties: number;
  margemLiquida: number;
}

export function calcularResumoCotacao(
  itens: CotacaoItemCplug[],
  adicionais: CotacaoAdicional[],
  descontoPercentual: number,
  categoriaCanal?: CategoriaCanal | null,
  tipoProduto?: 'cloudfy' | 'cplug'
): ResumoCotacao {
  // Subtotal licenças (apenas selecionados)
  const subtotalLicencas = itens
    .filter((i) => i.selecionado)
    .reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0);

  // Desconto aplica apenas sobre licenças (não sobre serviços)
  const descontoValor = subtotalLicencas * (descontoPercentual / 100);
  const totalMensalidade = subtotalLicencas - descontoValor;

  // Serviços (adicionais) - não sofrem desconto
  const totalServicos = adicionais
    .filter((a) => a.selecionado)
    .reduce((sum, a) => sum + a.valor * a.quantidade, 0);

  const totalGeral = totalMensalidade + totalServicos;

  // Royalties
  let percentualRoyalties = 0;
  if (tipoProduto === 'cplug') {
    percentualRoyalties = 50;
  } else if (categoriaCanal?.percentualRoyalties) {
    percentualRoyalties = categoriaCanal.percentualRoyalties;
  }

  // Royalties calculado sobre o valor final das licenças (após desconto)
  const totalRoyalties = totalMensalidade * (percentualRoyalties / 100);
  const margemLiquida = totalMensalidade - totalRoyalties;

  return {
    subtotalLicencas,
    descontoValor,
    totalMensalidade,
    totalServicos,
    totalGeral,
    percentualRoyalties,
    totalRoyalties,
    margemLiquida,
  };
}

export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function parseValorMonetario(valor: string): number | null {
  const normalizado = valor.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!normalizado || !/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

export function formatarData(data: Date | string | number | { toDate?: () => Date } | null | undefined): string {
  if (!data) return '—';

  const valor = typeof data === 'object' && data !== null && 'toDate' in data && typeof data.toDate === 'function'
    ? data.toDate()
    : data;

  const d = typeof valor === 'string' || typeof valor === 'number' ? new Date(valor) : valor;
  if (d instanceof Date && Number.isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d as Date);
}

export function gerarNumeroCotacao(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROP-${ano}${mes}${dia}-${random}`;
}