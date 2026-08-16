import { Timestamp } from 'firebase/firestore';

export type Perfil = 'admin' | 'vendedor';

export interface User {
  uid: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  telefone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type StatusFunil = 'novo' | 'contato' | 'proposta' | 'negociacao' | 'fechado_ganho' | 'fechado_perdido';
export type Classificacao = 'A' | 'B' | 'C';
export type Produto = 'cloudfy' | 'cplug' | 'qualificar';
export type CanalOrigem = 'scraping' | 'upload_xlsx' | 'indicacao' | 'site' | 'manual';

export interface Interacao {
  id: string;
  tipo: 'anotacao' | 'whatsapp' | 'email' | 'visita' | 'ligacao';
  descricao: string;
  dataHora: Timestamp;
  usuarioId: string;
  usuarioNome: string;
}

export interface Lead {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  segmento?: string;
  porte?: 'MEI' | 'ME' | 'EPP' | 'DEMAIS';
  capitalSocial?: number;
  socios?: string;
  cep?: string;
  uf?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  statusFunil: StatusFunil;
  produtoSugerido?: Produto;
  classificacao?: Classificacao;
  canalOrigem?: CanalOrigem;
  tipoEmpresa?: 'matriz' | 'filial';
  nomeUnidade?: string;
  matrizCnpj?: string;
  contatoNome?: string;
  contatoTel?: string;
  contatoEmail?: string;
  respFinanceiroNome?: string;
  respFinanceiroTel?: string;
  respFinanceiroEmail?: string;
  observacoes?: string;
  responsavelId?: string;
  status: 'ativo' | 'inativo';
  excluidoEm: Timestamp | null;
  arquivado: boolean;
  dataArquivamento: Timestamp | null;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  interacoes?: Interacao[];
}

export interface Staging {
  id: string;
  fonte: string;
  bruto: Record<string, unknown>;
  nome?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  segmento?: string;
  municipio?: string;
  bairro?: string;
  score: number;
  classificacao: Classificacao;
  produtoSugerido: Produto;
  status: 'pendente' | 'aprovado' | 'descartado';
  motivoDescarte?: string;
  leadId?: string | null;
  criadoEm: Timestamp;
}

export type Periodicidade = 'mensal' | 'anual' | 'unico';

export interface Licenca {
  id: string;
  descricao: string;
  categoria: string;
  periodicidade: Periodicidade;
  valorIntegral: number;
  obrigatorio: boolean;
  ativo: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface CategoriaCanal {
  id: string;
  nome: string;
  percentualRoyalties: number;
  produto: Produto;
  descricao?: string;
  ativo: boolean;
}

export interface CotacaoItem {
  licencaId: string;
  descricao: string;
  quantidade: number;
  valorIntegralUnitario: number;
  valorIntegralTotal: number;
  descontoPorItem: number;
  valorFinal: number;
  royalties: number;
}

export type StatusCotacao = 'rascunho' | 'pendente' | 'aprovado' | 'rejeitado';

export interface Cotacao {
  id: string;
  leadId: string;
  vendedorId: string;
  produto: Produto;
  categoriaCanalId: string;
  percentualDescontoGlobal: number;
  itens: CotacaoItem[];
  mensalidadeIntegral: number;
  descontoGlobal: number;
  totalMensalidade: number;
  totalRoyalties: number;
  status: StatusCotacao;
  dataCriacao: Timestamp;
  dataAtualizacao: Timestamp;
}
