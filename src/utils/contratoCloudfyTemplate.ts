export const CONTRATO_CLOUDFY_TEMPLATE = `
<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇO DE MANUTENÇÃO DE SOFTWARE</h1>
<p>HRP SOLUÇÕES, cujo nome empresarial é 41.510.076 ELAINE FERREIRA DE LIMA, inscrita sob o CNPJ nº 41.510.076/0001-44, com sede na Estr. Água Chata, 3009, bloco 9, apartamento 603, CEP 07251-000, no município de Guarulhos, no Estado de São Paulo, doravante denominada CONTRATADA.</p>
<p>{{CLIENT_LEGAL_NAME}}, sociedade inscrita no CNPJ nº {{CLIENT_CNPJ}}, e, I.E. {{CLIENT_IE}}, nome fantasia: {{CLIENT_FANTASY_NAME}}, com sede na {{CLIENT_ADDRESS}}, no município de {{CLIENT_CITY}}, no Estado de {{CLIENT_STATE}}, doravante denominada CONTRATANTE.</p>
<p>Considerando que a proposta comercial encaminhada no dia {{PROPOSAL_DATE}}, é parte integrante deste Contrato.</p>
<p>CONTRATADA e CONTRATANTE, quando em conjunto denominadas Partes, e isoladamente como Parte.</p>
<p>As Partes têm entre si justo e contratado, o presente CONTRATO DE PRESTAÇÃO DE SERVIÇO DE MANUTENÇÃO DE SOFTWARE (“Contrato”), nos termos abaixo:</p>
<h2>Cláusula 1ª – Do Objeto</h2>
<p>1.1 A CONTRATADA fornecerá um sistema automatizado para atendimento operacional e de gestão da CONTRATANTE (“Software”).</p>
<p>1.2 O Software objeto deste contrato é de propriedade intelectual da empresa CLOUDFY TECNOLOGIA LTDA, sociedade inscrita perante o CNPJ nº 26.288.478/0001-52, com sede na Rua Coronel Pedro Scherer Sobrinho, 426, apto 12, 2º andar, Cristo Rei, CEP 80.050-470, no município de Curitiba, no Estado do Paraná, sendo a CONTRATADA responsável por sua comercialização, implantação, suporte e faturamento perante a CONTRATANTE.</p>
<p>1.3 O sistema automatizado possui as seguintes funcionalidades: Base de dados em nuvem com usuários ilimitados; Gestão de estoque com baixa automática por ficha técnica; Conciliação bancária importando arquivo “OFX”; Calendário de contas a pagar e receber; Balancete e DRE; Gestão financeira facilitada com dashboard; Emissão de NFe com certificado digital A1; Integração com plataformas de vendas on-line; Aplicativo para Android e iOS, acompanha vendas remotamente; QR Code na mesa (cardápio para visualizar e pedir na mesa - opcional); KDS nas produções (opcional); e terminais de atendimento fixo e móvel (móvel opcional).</p>
<p>1.4 O sistema permite a migração dos dados de grupo de produtos, produtos, clientes e fornecedores.</p>
<p>1.4.1 A migração dos dados está vinculada ao acesso à base de dados atual do cliente, ficando sob responsabilidade do cliente fornecer acesso a esses dados.</p>
<p>1.4.2 A implantação e a preparação do ambiente de produção para hospedagem da aplicação Cloudfy BLUE incluem: instalação da aplicação no ambiente de produção; acompanhamento e tunelamento do ambiente; definição de perfis de usuários juntamente com o cliente; cadastro de filiais; e cadastro de usuários.</p>
<p>1.5 O suporte de implantação do Software ocorrerá de forma remota pela CONTRATADA.</p>
<p>1.6 As licenças adquiridas para mensalidade/manutenção pela CONTRATANTE são:</p>
<div data-contract-table="licenses"></div>
<p>1.7 Os serviços de implantação contratados pela CONTRATANTE são:</p>
<div data-contract-table="services"></div>
<h2>Cláusula 2ª – Da Instalação</h2>
<p>2.1 A instalação do Software ocorrerá no prazo de no máximo 10 (dez) dias úteis a partir da assinatura do Contrato.</p>
<p>2.2 A instalação do Software poderá ser feita remotamente ou presencialmente, conforme acordado previamente entre as Partes.</p>
<h2>Cláusula 3ª – Do Treinamento</h2>
<p>3.1 O treinamento para uso do Software e ferramentas descritas na Cláusula 1ª deste Contrato poderá ser feito de modo presencial, conforme previamente acordado entre as Partes e mediante valor previamente estipulado.</p>
<h2>Cláusula 4ª – Das Atualizações e Correções</h2>
<p>4.1 No caso de eventual necessidade de atualização e correção do Software, tais como correção de eventuais bugs, ajustes para adequação fiscal, melhorias e novidades, deverá ser comunicado à CONTRATANTE com pelo menos 48h (quarenta e oito horas) de antecedência.</p>
<h2>Cláusula 5ª – Do Suporte e Manutenção</h2>
<p>5.1 A CONTRATADA disponibilizará suporte remoto para maior velocidade no atendimento à CONTRATANTE. Desta forma, é essencial o uso de ferramentas de acesso remoto como:</p>
<ul><li>TeamViewer</li><li>AnyDesk</li></ul>
<p>5.2 O atendimento da CONTRATANTE também poderá ser feito por telefone ou WhatsApp.</p>
<p>5.3 A CONTRATADA realizará o atendimento da CONTRATANTE nos seguintes dias e horários:</p>
<ul><li>Segunda-feira a quinta-feira: 09:00 às 23:00;</li><li>Sexta-feira e sábado: 10:00 às 23:59;</li><li>Domingo e/ou feriado: 10:00 às 22:00.</li></ul>
<p>5.3.1 Atendimentos fora do horário comercial (09h00 às 18h00) caracterizam atendimento de plantão e serão priorizados no caso de emergências. SLA de 2h em horário comercial.</p>
<h2>Cláusula 6ª – Das Responsabilidades</h2>
<p>6.1 Constituem obrigações da CONTRATADA, sem prejuízo das demais estipuladas neste Contrato:</p>
<p>a) Disponibilizar e manter o Software em pleno funcionamento, nos prazos e condições estipulados neste Contrato;</p>
<p>b) Assegurar o suporte aos usuários do Software no prazo estipulado neste Contrato;</p>
<p>c) Corrigir os vícios, defeitos e divergências identificados no Software;</p>
<p>d) A CONTRATADA será responsável pela guarda e integridade dos dados armazenados no Software, adotando medidas técnicas e administrativas razoáveis de segurança e backup. Na hipótese de perda de dados ou incidente de segurança comprovadamente causado por falha exclusiva da CONTRATADA, esta responderá pelos danos diretos comprovados sofridos pela CONTRATANTE;</p>
<p>e) A CONTRATADA não será responsável por danos indiretos, lucros cessantes ou perda de faturamento; falhas decorrentes de uso indevido do sistema; problemas de internet, energia ou equipamentos do cliente; e acesso indevido por terceiros com credenciais da CONTRATANTE;</p>
<p>f) Informar imediatamente à CONTRATANTE sobre eventuais instabilidades que sejam detectadas no Software.</p>
<h2>Cláusula 7ª – Do Pagamento</h2>
<p>7.1 Como contraprestação pelos serviços da CONTRATADA, a CONTRATANTE pagará os valores descritos na Proposta Comercial, anexa a este Contrato. O vencimento de cada parcela ocorrerá todo dia 30 (trinta) do mês subsequente ao contratado.</p>
<p>7.1.1 Para quitação dos valores, a CONTRATADA encaminhará a respectiva fatura acompanhada da nota fiscal para a CONTRATANTE com pelo menos 05 (cinco) dias de antecedência da data do vencimento, que poderá ser paga via boleto bancário.</p>
<p>7.2 No caso de atraso no pagamento, haverá cobrança de multa de 2% (dois por cento) sobre o valor devido e juros de 1% (um por cento) ao mês. O atraso no pagamento superior a 10 (dez) dias após o vencimento acarretará bloqueio temporário do Software, mediante aviso prévio de 48h, até que o pagamento seja realizado.</p>
<p>7.2.1 Após o pagamento pendente, a CONTRATADA terá 48h (quarenta e oito horas) úteis para restabelecer o sistema do Software para a CONTRATANTE.</p>
<p>7.3 Os valores dos serviços serão reajustados anualmente, sempre no mês de janeiro, com base no IPCA acumulado nos últimos 12 (doze) meses. O primeiro reajuste ocorrerá no mês de janeiro subsequente à assinatura deste contrato, independentemente de já terem transcorrido 12 (doze) meses de vigência. Nos anos seguintes, os reajustes ocorrerão sempre no mês de janeiro.</p>
<h2>Cláusula 8ª – Do Layout e Projeto</h2>
<p>8.1 Para o correto funcionamento do Software no computador, a CONTRATANTE deverá ter os seguintes requisitos mínimos de infraestrutura:</p>
<table><thead><tr><th>Requisito</th><th>Especificação</th></tr></thead><tbody><tr><td>Processador</td><td>Intel Core i3 8ª Geração</td></tr><tr><td>Memória</td><td>8GB</td></tr><tr><td>Armazenamento</td><td>SSD 120GB</td></tr><tr><td>Sistema Operacional</td><td>Windows 10 Pro 64-bits</td></tr><tr><td>Internet mínima</td><td>10Mb</td></tr></tbody></table>
<p>8.2 É responsabilidade da CONTRATANTE ter os equipamentos necessários em pleno funcionamento para que a instalação do Software e o pleno funcionamento do sistema sejam fluidos. Computadores, equipamentos de rede (roteador, switch, access point, cabeamento), internet, smartphones, tablets e POS são de responsabilidade da CONTRATANTE.</p>
<h2>Cláusula 9ª – Da Rescisão do Contrato</h2>
<p>9.1 Este Contrato tem início na data de sua assinatura e vigorará pelo prazo de 12 (doze) meses (“Prazo de Vigência do Contrato”). A renovação do Contrato será automática, por igual período, caso não haja manifestação contrária.</p>
<p>9.2 O presente Contrato poderá ser rescindido por justa causa, sem nenhum ônus, multa ou indenização, por qualquer das Partes, mediante simples notificação, na ocorrência das seguintes hipóteses:</p>
<p>a) Requerimento ou declaração de falência, dissolução/liquidação judicial ou extrajudicial de quaisquer das Partes;</p>
<p>b) Impedimento na execução do objeto do Contrato, decorrente de caso fortuito ou força maior, que perdure por mais de 30 (trinta) dias consecutivos;</p>
<p>c) Descumprimento ou cumprimento irregular de obrigações contratuais não sanáveis ou não sanadas no prazo de 60 (sessenta) dias após o recebimento de notificação enviada pela Parte prejudicada e sem justificativa.</p>
<p>9.3 As Partes podem solicitar a rescisão deste Contrato sem justa causa, sem nenhum ônus, multa ou indenização, após comunicação com 30 (trinta) dias de antecedência e por escrito.</p>
<p>9.4 Em caso de rescisão deste Contrato, a CONTRATANTE se obriga a pagar à CONTRATADA todos os valores devidos e acumulados até a data da rescisão, ao qual se dará tolerância de até 30 (trinta) dias. De igual maneira, qualquer valor já despendido pela CONTRATANTE pelos serviços não prestados pela CONTRATADA também deverá ser reembolsado à CONTRATANTE no mesmo prazo.</p>
<p>9.5 Após o término do presente Contrato, independentemente do motivo ou de quem lhe deu causa, a CONTRATANTE poderá manter acesso ao Software pelo prazo de 30 (trinta) dias corridos, exclusivamente para fins de consulta e extração de seus dados e informações. Durante esse período, não serão permitidas novas operações no sistema, ficando o acesso restrito à visualização e exportação de dados. Decorrido o prazo de 30 (trinta) dias, a CONTRATADA poderá excluir definitivamente de seus sistemas todas as informações da CONTRATANTE, ressalvadas aquelas cuja guarda seja exigida por lei.</p>
<p>9.6 Em caso de falência, encerramento ou impossibilidade de continuidade da empresa representante da CONTRATADA, a CLOUDFY TECNOLOGIA LTDA assumirá integralmente o presente contrato, mantendo a prestação dos serviços sem prejuízo à CONTRATANTE.</p>
<h2>Cláusula 10ª – Da Confidencialidade</h2>
<p>10.1 As Partes se comprometem, por si e por seus colaboradores, a manter estritamente confidenciais os termos e condições deste Contrato e todas as informações recebidas com relação à outra Parte, tais como informações, documentos, equipamentos, softwares, bancos de dados, listas de clientes e fornecedores, dados de clientes, de consumo, estatísticas, materiais, relatórios, tecnologia, seja de natureza técnica, operacional, logística, econômica, de engenharia ou de qualquer outra natureza, entregues, revelados ou fornecidos, bem como todos e quaisquer assuntos e temas tratados, experiências e resultados de atividades, simulações lógicas, correspondências e elementos técnicos e quaisquer outras informações a que venham a ter acesso, verbalmente ou por escrito, incluindo, mas não se limitando a comunicação por SMS e WhatsApp, devido a este Contrato, independentemente da necessidade de identificação pela Parte reveladora de sua natureza confidencial (“Informações Confidenciais”).</p>
<p>10.2 As Informações Confidenciais pertencerão exclusivamente à Parte reveladora, devendo a Parte receptora manter, durante o Prazo de Vigência do Contrato e pelo prazo de mais 5 (cinco) anos a contar da data do término ou rescisão do Contrato, sigilo de todas as Informações Confidenciais da outra Parte, obrigando-se a não revelá-las a qualquer terceiro, exceto nos limites necessários à concretização do objeto deste Contrato.</p>
<p>10.3 A Parte receptora obriga-se a tomar todas as medidas destinadas à proteção e sigilo integrais das Informações Confidenciais pertencentes à Parte reveladora e a evitar sua revelação a qualquer terceiro, exceto na extensão permitida nos termos deste Contrato, a menos que a Parte reveladora a autorize por escrito a fazê-lo.</p>
<h2>Cláusula 11ª – Dos Tributos</h2>
<p>11.1 Todos os tributos que forem devidos em decorrência do presente Contrato ou de sua execução, existentes ou que venham a ser criados, bem como as respectivas majorações, mudanças de base de cálculo ou do período de apuração, reajustes, encargos moratórios e obrigações tributárias acessórias, constituem ônus de responsabilidade do respectivo sujeito passivo da obrigação tributária, conforme definido na legislação vigente.</p>
<h2>Cláusula 12ª – Da Lei Geral de Proteção de Dados</h2>
<p>12.1 As Partes declaram-se cientes e concordam de forma expressa que poderão ter acesso a dados de pessoas naturais vinculadas à outra Parte, podendo realizar o tratamento de dados pessoais relativos a colaboradores, prestadores de serviço, empregados, sócios, inclusive dos dados pessoais sensíveis, bem como poderá ter acesso, utilizar, manter, recepcionar, armazenar, classificar, avaliar, transmitir, reproduzir, eliminar, distribuir e processar, eletrônica e/ou manualmente, informações e dados prestados por este, razão pela qual, desde já, as Partes se comprometem a tratar os dados pessoais envolvidos na confecção e necessários à execução do presente Contrato, única e exclusivamente para cumprir com a finalidade a que se destinam, qual seja, a fiel execução do objeto deste Contrato, bem como em respeito a toda a legislação aplicável sobre a segurança da informação, privacidade e proteção de dados, inclusive, mas não se limitando à Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), sob pena de responsabilização da parte infratora por perdas e danos.</p>
<p>12.2 As Partes reconhecem que, diante do objeto do presente Contrato, ambas são consideradas controladoras, sendo cada Parte responsável pelo tratamento dos dados pessoais. No caso de eventuais falhas, problemas ou quaisquer outras situações que possam causar prejuízo ao proprietário dos dados, serão de exclusiva responsabilidade do controlador que causou o fato.</p>
<p>12.3 Compete às Partes, quando controladoras dos dados: a. Adotar as medidas de segurança, técnicas e administrativas para proteção dos dados pessoais de acessos não autorizados, abrangendo inclusive situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito; b. Tomar as decisões acerca do tratamento dos dados de pessoas naturais a que obtiverem acesso, devendo estabelecer forma de contato com o operador, em regra, por e-mail e mensagens telefônicas. Em caso de contato via telefone, deverá ser formalizado por escrito; c. Manter registro das operações de tratamento.</p>
<h2>Cláusula 13ª – Das Disposições Gerais</h2>
<p>13.1 As Partes declaram que possuem poderes específicos para a celebração do presente Contrato e estão devidamente autorizadas na forma de seus respectivos atos societários e plena capacidade para cumprimento de suas obrigações nele previstas.</p>
<p>13.2 O presente Contrato, seus direitos e suas obrigações não poderão ser cedidos ou transferidos, total ou parcialmente pelas Partes a terceiros, sem consentimento prévio e por escrito da parte contrária, sob pena de nulidade da cessão e da rescisão unilateral e de pleno direito deste Contrato.</p>
<p>13.3 Não se estabelece, por força deste Contrato, para nenhum efeito, nenhum tipo de sociedade, associação, joint venture, agência, consórcio, mandato de representação ou responsabilidade solidária entre as Partes, tampouco enseja este Contrato qualquer vínculo operacional, gerencial, trabalhista ou de qualquer outra natureza entre as Partes.</p>
<p>13.4 Este Contrato comporta execução específica nos termos do Código de Processo Civil.</p>
<p>13.5 A relação entre as Partes é regida exclusivamente pelas Leis Brasileiras, inclusive eventuais ações decorrentes de violação dos seus termos e condições. Fica eleito o Foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer dúvidas, questões ou litígios decorrentes deste Contrato, renunciando as Partes a qualquer outro, por mais privilegiado que seja.</p>
<p>13.6 Nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2, as Partes expressamente concordam em utilizar e reconhecem como válida qualquer forma de comprovação de anuência aos termos ora acordados em formato eletrônico, ainda que não utilizem certificado digital emitido no padrão ICP-Brasil. A formalização deste Contrato na maneira acima acordada será suficiente para a validade e integral vinculação das Partes ao presente Contrato.</p>
<p>E, por estarem assim justas e contratadas, as Partes assinam o presente Contrato, de forma eletrônica, dando plena validade para este tipo de assinatura, perante 2 (duas) testemunhas.</p>
<p>São Paulo, {{CONTRACT_DATE}}.</p>
<p><br><br>________________________________________<br>HRP SOLUÇÕES – CONTRATADA</p>
<p><br>________________________________________<br>{{CLIENT_LEGAL_NAME}} – CONTRATANTE</p>
<p><br>Testemunha 1: ______________________________ CPF: ____________________</p>
<p>Testemunha 2: ______________________________ CPF: ____________________</p>
`;

export function removeRepresentativeSignatureHint(html: string): string {
  return html.replace(
    /<br\s*\/?>\s*\[Preencher nome, CPF e cargo do representante legal\]/i,
    '',
  );
}
