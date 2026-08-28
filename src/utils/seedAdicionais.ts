import { adicionalService } from '../services/adicionalService';

const adicionaisPadrao = [
  {
    nome: 'Serviço de ativação da base',
    descricao: 'Ativação e configuração inicial da base de dados no ambiente Cloudfy',
    valor: 250.00,
    tipo: 'checkbox' as const,
    ativo: true,
  },
  {
    nome: 'Serviço de cadastro da base',
    descricao: 'Cadastro de produtos, clientes, fornecedores e configurações iniciais',
    valor: 400.00,
    tipo: 'checkbox' as const,
    ativo: true,
  },
  {
    nome: 'Visita e acompanhamento',
    descricao: 'Visita técnica presencial para acompanhamento da implantação',
    valor: 400.00,
    tipo: 'quantificavel' as const,
    ativo: true,
  },
  {
    nome: 'Treinamento presencial',
    descricao: 'Treinamento presencial da equipe no uso do sistema',
    valor: 400.00,
    tipo: 'quantificavel' as const,
    ativo: true,
  },
  {
    nome: 'Treinamento remoto',
    descricao: 'Treinamento remoto via videoconferência',
    valor: 250.00,
    tipo: 'quantificavel' as const,
    ativo: true,
  },
];

export async function seedAdicionais() {
  console.log('🌱 Verificando seed de adicionais...');
  try {
    const existentes = await adicionalService.listar();
    if (existentes.length > 0) {
      console.log('✅ Adicionais já existem no Firestore');
      return;
    }
    for (const adicional of adicionaisPadrao) {
      await adicionalService.criar(adicional);
    }
    console.log('✅ Seed de adicionais concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed de adicionais:', err);
  }
}