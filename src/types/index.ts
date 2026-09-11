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
export type ProdutoContratado = 'cloudfy' | 'cplug';
export type CanalOrigem = 'scraping' | 'upload_xlsx' | 'indicacao' | 'site' | 'manual';
export type RegimeTributario = 'SIMEI' | 'Simples Nacional' | 'Lucro Real' | 'Lucro Presumido' | 'Lucro Arbitrado';

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
  inscricaoEstadual?: string;
  regimeTributario?: RegimeTributario;
  municipio?: string;
  segmento?: string;
  porte?: 'MEI' | 'ME' | 'EPP' | 'DEMAIS' | '';
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
  produtoContratado?: ProdutoContratado;
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
  arquivado?: boolean;
  dataArquivamento?: Timestamp | null;
  dataContratacao?: Timestamp | null;
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
  inscricaoEstadual?: string;
  regimeTributario?: RegimeTributario;
  nomeFantasia?: string;
  segmento?: string;
  municipio?: string;
  bairro?: string;
  porte?: 'MEI' | 'ME' | 'EPP' | 'DEMAIS' | '';
  capitalSocial?: number;
  socios?: string;
  cep?: string;
  uf?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
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
  produto?: Produto;
  descricao?: string;
  ativo: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface LicencaCloudfy {
  id: string;
  nome?: string;
  valor?: number;
  valorIntegral?: number;
  ativo: boolean;
  categoriaId?: string;
  categoriaNome?: string;
  permiteMultiplasUnidades?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CategoriaLicencaCloudfy {
  id: string;
  nome: string;
  ativo: boolean;
  ordem?: number;
  createdAt?: any;
  updatedAt?: any;
}

export type StatusClienteLicencaCloudfy = 'ativa' | 'inativa' | 'pendente' | 'expirada';

export interface ModuloClienteLicenca {
  ativo: boolean;
  quantidade: number;
  label?: string;
}

export interface ClienteLicencaCloudfy {
  id: string;
  clienteId?: string;
  clienteNome: string;
  nomeFantasia?: string;
  cnpj?: string;
  licencaId?: string;
  licencaNome: string;
  categoriaId?: string;
  categoriaNome?: string;
  quantidade: number;
  valorMensal: number;
  valorAnual?: number;
  dataAtivacao?: string;
  dataRenovacao?: string;
  status: StatusClienteLicencaCloudfy;
  observacoes?: string;
  responsavel?: string;
  unidade?: string;
  contrato?: string;
  modulos?: Record<string, ModuloClienteLicenca | boolean>;
  ativo?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type TipoLicencaCplug = 'checkbox' | 'quantificavel';

export interface LicencaCplug extends LicencaCloudfy {
  descricao?: string;
  tipo?: TipoLicencaCplug;
}

export interface ModuloFixo { id: string; nome: string; }
export interface ModuloOpcional { id: string; nome: string; valor: number; }
export interface ItemQuantificavel { id: string; nome: string; valorUnitario: number; }

export interface PacoteCplug {
  id: string;
  nome: string;
  descricao?: string;
  valorBase: number;
  ativo: boolean;
  modulosFixos: ModuloFixo[];
  modulosOpcionais: ModuloOpcional[];
  itensQuantificaveis: ItemQuantificavel[];
  createdAt?: any;
  updatedAt?: any;
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

export interface CotacaoItemCplug {
  licencaId: string;
  nome: string;
  categoriaNome?: string;
  tipo: TipoLicencaCplug;
  valorUnitario: number;
  quantidade: number;
  selecionado: boolean;
}

export interface CotacaoAdicional {
  adicionalId: string;
  nome: string;
  descricao?: string;
  valor: number;
  quantidade: number;
  tipo: 'checkbox' | 'quantificavel';
  selecionado: boolean;
}

export interface CotacaoParcelaServico {
  numero: number;
  valor: number;
  dataVencimento: string;
}

export type StatusCotacao = 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada';

export interface Cotacao {
  id: string;
  leadId?: string;
  vendedorId?: string;
  produto?: Produto;
  categoriaCanalId?: string;
  categoriaCanalNome?: string;
  percentualDescontoGlobal?: number;
  percentualRoyalties?: number;
  itens?: CotacaoItem[];
  itensCplug?: CotacaoItemCplug[];
  adicionais?: CotacaoAdicional[];
  parcelasServicos?: CotacaoParcelaServico[];
  mensalidadeIntegral?: number;
  descontoGlobal?: number;
  totalMensalidade?: number;
  totalRoyalties?: number;
  margemLiquida?: number;
  status: StatusCotacao;
  dataCriacao?: Timestamp;
  dataAtualizacao?: Timestamp;
  numero?: string;
  nomeLead?: string;
  tipoProduto?: 'cloudfy' | 'cplug';
  pacoteCplugId?: string;
  descontoPercentual?: number;
  observacaoDesconto?: string;
  valorTotal?: number;
  valorServicos?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Adicional {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  tipo: 'checkbox' | 'quantificavel';
  ativo: boolean;
  createdAt?: any;
  updatedAt?: any;
}