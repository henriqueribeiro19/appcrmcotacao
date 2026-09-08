import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import type { Cotacao, Lead, CategoriaCanal, Adicional } from '@/types';
import logoHrp from '../../assets/logo-hrp.png';
import logoCloudfy from '../../assets/logo-cloudfy.png';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoHrp: {
    width: 62,
    height: 62,
    objectFit: 'contain',
  },
  logoHrpBlock: {
    alignItems: 'center',
    width: 120,
  },
  logoHrpName: {
    color: '#000000',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  logoCloudfy: {
    width: 128,
    height: 52,
    objectFit: 'contain',
  },
  date: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 64,
  },
  greeting: {
    width: '78%',
    alignSelf: 'center',
    marginBottom: 0,
  },
  greetingTitle: {
    fontSize: 12,
    marginBottom: 14,
    color: '#0f172a',
  },
  greetingText: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 14,
    textAlign: 'justify',
    lineHeight: 1.65,
  },
  greetingSignature: {
    marginTop: 12,
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.25,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 11,
    color: '#000000',
    marginBottom: 6,
  },
  bulletList: {
    marginLeft: 18,
    marginBottom: 10,
  },
  bulletItem: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 8,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 10,
    color: '#334155',
  },
  tableCellRight: {
    fontSize: 10,
    color: '#334155',
    textAlign: 'right',
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  paymentInfo: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 6,
  },
  confidentiality: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  confidentialityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  confidentialityText: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 30,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
  },
});

interface PropostaPDFProps {
  cotacao: Cotacao;
  lead: Lead;
  categoriaCanal?: CategoriaCanal | null;
  adicionaisDisponiveis: Adicional[];
}

export function PropostaPDF({ cotacao, lead, categoriaCanal: _categoriaCanal, adicionaisDisponiveis: _adicionaisDisponiveis }: PropostaPDFProps) {
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const itensSelecionados = cotacao.itensCplug?.filter((i) => i.selecionado) || [];
  const adicionaisSelecionados = cotacao.adicionais?.filter((a) => a.selecionado) || [];

  const subtotalLicencas = itensSelecionados.reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0);
  const descontoValor = subtotalLicencas * ((cotacao.descontoPercentual || 0) / 100);
  const totalMensalidade = subtotalLicencas - descontoValor;
  const totalServicos = adicionaisSelecionados.reduce((sum, a) => sum + a.valor * a.quantidade, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Texto do escopo baseado no produto
  const funcionalidadesCloudfy = [
    'Base de dados em nuvem com usuários ilimitados;',
    'Gestão de estoque com baixa automática por ficha técnica;',
    'Conciliação bancária importando arquivo .OFX;',
    'Calendário de contas a pagar e receber;',
    'Balancete e DRE;',
    'Gestão financeira facilitada com dashboard;',
    'Emissão de NFe com certificado digital A1;',
    'Integração com plataformas de vendas on-line;',
    'Aplicativo para android e iOS, acompanha vendas remotamente;',
    'QR code na mesa (cardápio para visualizar e pedir na mesa - OPCIONAL);',
    'KDS nas produções (opcional);',
    'Terminais de atendimento fixo e móvel (móvel opcional);',
  ];

  const funcionalidadesCplug = [
    'Sistema de autoatendimento e gestão para food service;',
    'Integração com terminais de pedido;',
    'Gestão de cardápio digital;',
    'Relatórios de vendas e performance;',
    'Suporte técnico especializado;',
  ];

  const funcionalidades = cotacao.tipoProduto === 'cloudfy' ? funcionalidadesCloudfy : funcionalidadesCplug;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.logoHrpBlock}>
            <Image src={logoHrp} style={styles.logoHrp} />
            <Text style={styles.logoHrpName}>HRP SOLUÇÕES</Text>
          </View>
          <Image src={logoCloudfy} style={styles.logoCloudfy} />
        </View>

        <Text style={styles.date}>São Paulo, {dataHoje}.</Text>

        {/* Carta de apresentação */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Prezados,</Text>
          <Text style={styles.greetingText}>
            É com satisfação que apresentamos à {lead.razaoSocial} a proposta de prestação de serviços de consultoria em software, a ser realizada pela HRP Soluções em parceria com o seu estabelecimento.
          </Text>
          <Text style={styles.greetingText}>
            Agradecemos desde já pela oportunidade de apresentar nossa solução e reforçamos nosso compromisso em oferecer um atendimento transparente e eficiente. Permanecemos à disposição para quaisquer esclarecimentos adicionais que se façam necessários.
          </Text>
          <Text style={styles.greetingSignature}>Atenciosamente,</Text>
          <Text style={styles.greetingSignature}>Henrique Ribeiro</Text>
          <Text style={styles.greetingSignature}>+55 11 98499-1905</Text>
          <Text style={styles.greetingSignature}>henrique@hrpsolucoes.com.br</Text>
        </View>

        {/* Introdução */}
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introdução</Text>
          <Text style={styles.sectionText}>
            Apresentamos nossa proposta com o objetivo de fornecer um sistema automatizado que otimize o atendimento operacional e a gestão empresarial.
          </Text>
        </View>

        {/* Escopo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Escopo</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>- <Text style={{ fontWeight: 'bold' }}>Funcionalidades plano Pro.</Text></Text>
            <View style={{ marginLeft: 16 }}>
              {funcionalidades.map((funcionalidade, indice) => (
                <Text key={indice} style={styles.bulletItem}>- {funcionalidade}</Text>
              ))}
            </View>
            <Text style={styles.bulletItem}>- <Text style={{ fontWeight: 'bold' }}>Migração de dados</Text></Text>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.bulletItem}>- Migração dos dados de grupo de produtos, produtos, clientes e fornecedores;</Text>
              <Text style={styles.bulletItem}>- A migração dos dados está vinculada ao acesso à base de dados atual do cliente, ficando de responsabilidade do cliente em fornecer o acesso a esses dados;</Text>
            </View>
            <Text style={styles.bulletItem}>- <Text style={{ fontWeight: 'bold' }}>Implantação</Text></Text>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.bulletItem}>- Preparação do ambiente de produção para hospedagem da aplicação Cloudfy BLUE;</Text>
              <Text style={styles.bulletItem}>- Instalação da aplicação CloudfyBLUE no ambiente de produção;</Text>
              <Text style={styles.bulletItem}>- Acompanhamento e tunelamento do ambiente de produção;</Text>
              <Text style={styles.bulletItem}>- Definir perfis de usuários juntamente com o cliente;</Text>
            </View>
            <Text style={styles.bulletItem}>- <Text style={{ fontWeight: 'bold' }}>Suporte de implantação</Text></Text>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.bulletItem}>- Atendimento não presencial para sanar dúvidas quanto à implantação da aplicação e sua usabilidade;</Text>
            </View>
          </View>
        </View>

        </Page>

        <Page size="A4" style={styles.page}>
          {/* Tabela de Mensalidade (Licenças) */}
          {itensSelecionados.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Valor da mensalidade - Servidor Cloud, Manutenção, Atualização e Suporte</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Qtd</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descrição dos Produtos</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>R$ unitário</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Desc.</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>R$ total</Text>
                </View>
                {itensSelecionados.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantidade}</Text>
                    <Text style={[styles.tableCell, { flex: 3 }]}>{item.nome}</Text>
                    <Text style={[styles.tableCellRight, { flex: 2 }]}>{formatCurrency(item.valorUnitario)}</Text>
                    <Text style={[styles.tableCellRight, { flex: 1 }]}>{cotacao.descontoPercentual ? `${cotacao.descontoPercentual}%` : '-'}</Text>
                    <Text style={[styles.tableCellRight, { flex: 2 }]}>{formatCurrency(item.valorUnitario * item.quantidade * (1 - (cotacao.descontoPercentual || 0) / 100))}</Text>
                  </View>
                ))}
                {cotacao.descontoPercentual && cotacao.descontoPercentual > 0 && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 7 }]}>Desconto global ({cotacao.descontoPercentual}%)</Text>
                    <Text style={[styles.tableCellRight, { flex: 2, color: '#dc2626' }]}>-{formatCurrency(descontoValor)}</Text>
                  </View>
                )}
                <View style={styles.tableFooter}>
                  <Text style={[styles.totalLabel, { flex: 5 }]}>Total Mensalidade do Sistema</Text>
                  <Text style={[styles.totalValue, { flex: 4 }]}>{formatCurrency(totalMensalidade)}</Text>
                </View>
              </View>
            </View>
          )}
        </Page>

        <Page size="A4" style={styles.page}>
          {/* Tabela de Serviços (Adicionais) - Pagamento Único */}
          {adicionaisSelecionados.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Valor de Licenciamento e Serviços</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Qtd</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Descrição dos serviços</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>R$ unitário</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>R$ total</Text>
                </View>
                {adicionaisSelecionados.map((adicional, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{adicional.quantidade}</Text>
                    <Text style={[styles.tableCell, { flex: 4 }]}>{adicional.nome}</Text>
                    <Text style={[styles.tableCellRight, { flex: 2 }]}>{formatCurrency(adicional.valor)}</Text>
                    <Text style={[styles.tableCellRight, { flex: 2 }]}>{formatCurrency(adicional.valor * adicional.quantidade)}</Text>
                  </View>
                ))}
                <View style={styles.tableFooter}>
                  <Text style={[styles.totalLabel, { flex: 5 }]}>Total Serviços (Pagamento único)</Text>
                  <Text style={[styles.totalValue, { flex: 4 }]}>{formatCurrency(totalServicos)}</Text>
                </View>
              </View>
              <Text style={styles.paymentInfo}>Pagamento único ou parcelado conforme acordo comercial.</Text>
              {cotacao.parcelasServicos && cotacao.parcelasServicos.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.paymentInfo}>Cronograma de pagamento dos serviços:</Text>
                  {cotacao.parcelasServicos.map((parcela) => (
                    <Text key={parcela.numero} style={styles.paymentInfo}>
                      {parcela.numero}ª parcela - {formatCurrency(parcela.valor)}{parcela.dataVencimento ? ` - vencimento: ${new Date(`${parcela.dataVencimento}T00:00:00`).toLocaleDateString('pt-BR')}` : ''}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Termo de confidencialidade */}
          <View style={styles.confidentiality}>
            <Text style={styles.confidentialityTitle}>Termo de confidencialidade</Text>
            <Text style={styles.confidentialityText}>
              As informações contidas nessa proposta são confidenciais e fornecidas com a finalidade exclusiva de descrever as soluções apresentadas pela HRP Soluções a pedido do cliente. Estes dados não deverão, de forma alguma, ser utilizados para qualquer outra finalidade. Esta proposta tem validade de 60 dias a partir da data de sua emissão.
            </Text>
          </View>

          {/* Assinaturas */}
          <View style={styles.signature}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>HRP Soluções</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>{lead.razaoSocial}</Text>
            </View>
          </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>HRP Soluções | henrique@hrpsolucoes.com.br | +55 11 98499-1905</Text>
          <Text style={styles.footerText}>Proposta {cotacao.numero || '—'}</Text>
        </View>
      </Page>
    </Document>
  );
}