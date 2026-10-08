import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { createContext, useContext } from 'react';
import type { ContractTableRow, ContractTableSnapshot } from '@/types';

interface ContractTableAttributes {
  kind: 'licenses' | 'services';
  rows: ContractTableRow[];
  total: number;
  discountPercent: number;
  discountAmount: number;
  installments: { numero: number; valor: number; dataVencimento: string }[];
}

export const ContractTableDataContext = createContext<ContractTableSnapshot | undefined>(undefined);

function normalizeInstallments(value: unknown): ContractTableAttributes['installments'] {
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      numero: Number(item.numero) || 1,
      valor: Number(item.valor) || 0,
      dataVencimento: typeof item.dataVencimento === 'string' ? item.dataVencimento : '',
    }));
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function date(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day).toLocaleDateString('pt-BR') : value;
}

function ContractTableView({ node }: NodeViewProps) {
  const attributes = node.attrs as ContractTableAttributes;
  const tableSnapshot = useContext(ContractTableDataContext);
  const isLicenses = attributes.kind === 'licenses';
  const snapshotRows = isLicenses ? tableSnapshot?.licenses : tableSnapshot?.services;
  const rows = Array.isArray(snapshotRows)
    ? snapshotRows
    : Array.isArray(attributes.rows) ? attributes.rows : [];
  const total = isLicenses
    ? tableSnapshot?.totalMonthly ?? attributes.total
    : tableSnapshot?.totalServices ?? attributes.total;
  const discountPercent = tableSnapshot?.discountPercent ?? attributes.discountPercent;
  const discountAmount = isLicenses
    ? tableSnapshot?.discountAmount ?? attributes.discountAmount
    : 0;
  const installments = normalizeInstallments(tableSnapshot?.installments ?? attributes.installments);

  return (
    <NodeViewWrapper className="contract-table-block" contentEditable={false}>
      <table className="contract-data-table">
        <thead>
          <tr>
            <th>Qtd.</th>
            <th>{isLicenses ? 'Descrição dos produtos' : 'Descrição dos serviços'}</th>
            <th>Valor unitário</th>
            {isLicenses && <th>Desconto</th>}
            <th>Valor total</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={isLicenses ? 5 : 4}>Nenhum item informado na cotação aprovada.</td></tr>
          ) : rows.map((row, index) => (
            <tr key={`${row.description}-${index}`}>
              <td>{row.quantity}</td>
              <td>{row.description}</td>
              <td>{currency(row.unitValue)}</td>
              {isLicenses && <td>{row.discountPercent ? `${row.discountPercent}%` : '—'}</td>}
              <td>{currency(row.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {isLicenses && discountAmount > 0 && (
            <tr>
              <th colSpan={isLicenses ? 4 : 3}>Desconto global ({discountPercent}%)</th>
              <th>-{currency(discountAmount)}</th>
            </tr>
          )}
          <tr>
            <th colSpan={isLicenses ? 4 : 3}>
              {isLicenses ? 'Total mensalidade do sistema' : 'Total dos serviços'}
            </th>
            <th>{currency(total)}</th>
          </tr>
        </tfoot>
      </table>
      {isLicenses ? (
        <p className="contract-table-note">Valor mensal recorrente.</p>
      ) : (
        <div className="contract-installments">
          <p>Pagamento único ou parcelado conforme acordo comercial.</p>
          {installments.length > 0 && (
            <>
              <p><strong>Cronograma de pagamento dos serviços:</strong></p>
              <ul>
                {installments.map((installment) => (
                  <li key={installment.numero}>
                    {installment.numero}ª parcela — {currency(installment.valor)}
                    {installment.dataVencimento ? ` — vencimento: ${date(installment.dataVencimento)}` : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}

function parseRows(value: string | null): ContractTableRow[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as ContractTableRow[] : [];
  } catch {
    return [];
  }
}

export const ContractTable = Node.create({
  name: 'contractTable',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,
  isolating: true,

  addAttributes() {
    return {
      kind: { default: 'licenses' },
      rows: { default: [] },
      total: { default: 0 },
      discountPercent: { default: 0 },
      discountAmount: { default: 0 },
      installments: { default: [] },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-contract-table]',
      getAttrs: (element) => {
        if (!(element instanceof HTMLElement)) return false;
        return {
          kind: element.dataset.contractTable === 'services' ? 'services' : 'licenses',
          rows: parseRows(element.dataset.contractTableRows ?? null),
          total: Number(element.dataset.contractTableTotal) || 0,
          discountPercent: Number(element.dataset.contractDiscountPercent) || 0,
          discountAmount: Number(element.dataset.contractDiscountAmount) || 0,
          installments: parseRows(element.dataset.contractInstallments ?? null),
        };
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-contract-table': node.attrs.kind,
      'data-contract-table-rows': JSON.stringify(node.attrs.rows),
      'data-contract-table-total': String(node.attrs.total),
      'data-contract-discount-percent': String(node.attrs.discountPercent),
      'data-contract-discount-amount': String(node.attrs.discountAmount),
      'data-contract-installments': JSON.stringify(node.attrs.installments),
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContractTableView);
  },
});
