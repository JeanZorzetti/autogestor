/** As 6 verticais do hub. Cada uma vira um subdomínio de autogestor.com.br mais
 *  para a frente — por isso `slug` já é o nome do futuro subdomínio, e nenhuma
 *  página depende de estar sob o mesmo host. */
export type Solucao = {
  slug: string;
  nome: string;
  /** Rótulo curto da navegação. A nav mostra as 6 verticais de uma vez, sem
   *  hambúrguer — rótulo longo quebraria a barra em mobile. */
  curto: string;
  /** Frase de card e de nav. Uma linha, benefício antes de categoria. */
  resumo: string;
  /** <title> da página. Único por página — template repetido em 11 páginas é
   *  11 páginas competindo entre si. */
  titulo: string;
  descricao: string;
  /** Onde a solução realmente atende — vira `areaServed` no JSON-LD. Só a
   *  Coopluz é restrita: depende da área de concessão da Equatorial Goiás.
   *  O resto do hub atende o Brasil inteiro. */
  abrangencia: "BR" | "GO";
  /** Nome de quem presta o serviço, quando não é a própria Autogestor (ex.:
   *  Coopluz — a Autogestor é representante credenciada, não a cooperativa).
   *  Vira `provider` no JSON-LD; a Autogestor entra como `broker`. Omitido nas
   *  verticais onde a Autogestor é a prestadora direta (seguro, viagens...). */
  provedor?: string;
  /** Rótulo e placeholder do 3º campo do formulário. Nome e WhatsApp são os
   *  outros dois; e-mail foi cortado porque o canal de atendimento é WhatsApp.
   *  `avisoPara` mostra um aviso (não bloqueia envio) quando a opção escolhida
   *  é essa — serve para antecipar uma ressalva que já está no FAQ, antes da
   *  pessoa preencher o resto do formulário à toa. */
  campo: { rotulo: string; exemplo: string; opcoes?: readonly string[]; avisoPara?: { opcao: string; texto: string } };
  cta: string;
  /** H2 do bloco final, logo acima do formulário de fechamento. Escrito à mão:
   *  derivar do `cta` por regex produzia "Peça agora: simular meu crédito". */
  fechamento: string;
  /** Conteúdo interno do <svg viewBox="0 0 24 24">, traçado em currentColor. */
  icone: string;
  /** URL absoluta quando a vertical JÁ MORA em domínio próprio. Presente =
   *  esta vertical não tem página no hub; o card, a nav e o rodapé apontam
   *  para fora, e o hub deixa de publicar `/${slug}`.
   *
   *  Existe porque o hub e o site da vertical estavam publicando o MESMO
   *  conteúdo em dois domínios — canibalização literal, não risco teórico
   *  (spec 003-identidade-coopluz do repositório coopluz). A alternativa
   *  (deixar o link interno e confiar no 301) faria o hub mandar o próprio
   *  visitante para um redirect a cada clique.
   *
   *  A oferta continua na navegação e na grade da home: o que muda é o
   *  destino do link, não a existência da vertical. */
  externo?: string;
};

/** Para onde o link de uma solução aponta. Todo lugar que monta esse link —
 *  nav, rodapé, card, grade da home, JSON-LD, /obrigado — passa por aqui, e
 *  não por `/${slug}` cru: uma vertical que migrou precisa migrar em todos os
 *  lugares de uma vez, senão sobra um link para uma página que não existe. */
export const hrefSolucao = (s: Solucao): string => s.externo ?? `/${s.slug}`;

export const ICONES = {
  zap: '<path d="M12 3.5c-4.7 0-8.5 3.3-8.5 7.4 0 2.4 1.3 4.5 3.3 5.9l-.8 3.2 3.5-1.6c.8.2 1.6.3 2.5.3 4.7 0 8.5-3.3 8.5-7.4s-3.8-7.4-8.5-7.4z"/>',
  energia: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4.2"/>',
  aviao: '<path d="M10.2 3.6a1.8 1.8 0 0 1 3.6 0V9l7.7 4.3v2.3l-7.7-2.2v4.3l2.6 1.9v1.8L12 20.3l-4.4 1.1v-1.8l2.6-1.9v-4.3L2.5 15.6v-2.3L10.2 9z"/>',
  nota: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.6v4.8M18 9.6v4.8"/>',
  grupo: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16.6 5.3a3.2 3.2 0 0 1 0 6.2M17.7 14a6.2 6.2 0 0 1 3.5 6"/>',
  carro: '<path d="M3.2 16.4h17.6v-3.9l-1.8-4.2a2 2 0 0 0-1.8-1.2H6.8a2 2 0 0 0-1.8 1.2l-1.8 4.2z"/><circle cx="7.3" cy="16.4" r="1.9"/><circle cx="16.7" cy="16.4" r="1.9"/>',
} as const;

export const SOLUCOES: readonly Solucao[] = [
  {
    slug: "coopluz",
    nome: "Energia Coopluz",
    curto: "Energia",
    resumo: "20% de desconto na conta da Equatorial Goiás, sem obra e sem placa no telhado.",
    titulo: "Coopluz: 20% de desconto na conta de luz em Goiás | Autogestor",
    descricao:
      "Associe-se à Coopluz e pague 20% menos na conta da Equatorial Goiás. Sem instalar placa solar, sem obra, sem taxa de adesão e sem multa para sair.",
    abrangencia: "GO",
    provedor: "Coopluz",
    campo: {
      rotulo: "Valor médio da sua conta de luz",
      exemplo: "ex.: R$ 450",
      opcoes: ["Até R$ 250", "R$ 251 a R$ 500", "R$ 501 a R$ 1.000", "Acima de R$ 1.000"],
      avisoPara: {
        opcao: "Até R$ 250",
        texto: "Abaixo de R$ 250 o desconto não compensa a operação — a gente prefere dizer isso antes de você preencher o resto.",
      },
    },
    cta: "Quero pagar 20% menos",
    fechamento: "Peça a análise da sua conta de luz",
    icone: ICONES.energia,
    // Primeira vertical a ganhar site próprio. A página `/coopluz` deste hub
    // foi removida e responde 301 para cá (redirects em astro.config.mjs).
    externo: "https://coopluz.roilabs.com.br/",
  },
  {
    slug: "seguro",
    nome: "Seguro e proteção veicular",
    curto: "Seguro",
    resumo: "Cotação de carro, moto e caminhão comparada entre seguradoras, com assistência 24h.",
    titulo: "Seguro de carro, moto e caminhão no Brasil | Autogestor",
    descricao:
      "Corretora com registro SUSEP desde 2004. Comparamos seguro e proteção veicular para carro, moto e caminhão, com assistência 24h nacional e apoio na regulação de sinistro.",
    abrangencia: "BR",
    campo: { rotulo: "Marca e modelo do veículo", exemplo: "ex.: Onix 2021" },
    cta: "Quero minha cotação",
    fechamento: "Peça sua cotação de seguro",
    icone: ICONES.escudo,
    // Segunda vertical a ganhar site próprio (repositório C:\dev\seguros). A
    // página `/seguro` deste hub foi removida e responde 301 para lá
    // (redirects em astro.config.mjs). O slug continua "seguro" — é o pipeline
    // que /api/lead aceita e que o /admin lê; o subdomínio é que é "seguros".
    externo: "https://seguros.roilabs.com.br/",
  },
  {
    slug: "viagens",
    nome: "Viagens e passagens",
    curto: "Viagens",
    resumo: "Voo, hotel, pacote e carro na mesma busca, comprados por você em até 12x.",
    titulo: "Passagens aéreas, hotéis e pacotes em até 12x | Autogestor Viagens",
    descricao:
      "Busque, compare e emita você mesmo: passagens aéreas nacionais e internacionais, hotéis, pacotes e aluguel de carro, com promoções diárias e pagamento em até 12x no cartão.",
    abrangencia: "BR",
    // Única vertical self-service: a página não capta lead, leva direto para a
    // busca. `campo` fica porque a home ainda oferece "Viagens" como assunto.
    campo: { rotulo: "Para onde você quer ir?", exemplo: "ex.: Maceió em janeiro, 2 adultos" },
    cta: "Buscar minha viagem",
    fechamento: "Sua próxima viagem começa aqui",
    icone: ICONES.aviao,
  },
  {
    slug: "financiamento",
    nome: "Financiamento de veículos",
    curto: "Financiamento",
    resumo: "Crédito aprovado antes de escolher o carro. Sem taxa para analisar sua ficha.",
    titulo: "Financiamento de carro, moto e caminhão | Autogestor",
    descricao:
      "Financiamento para veículo novo ou usado, nacional ou importado. Aprovação antes da compra, sem cobrança para analisar a ficha nem para liberar o crédito.",
    abrangencia: "BR",
    campo: { rotulo: "Quanto você precisa financiar?", exemplo: "ex.: R$ 60.000" },
    cta: "Quero simular meu crédito",
    fechamento: "Simule seu crédito antes de escolher o veículo",
    icone: ICONES.nota,
  },
  {
    slug: "consorcio",
    nome: "Consórcio",
    curto: "Consórcio",
    resumo: "Carro, moto, caminhão ou imóvel com parcela sem juros e lance para antecipar.",
    titulo: "Consórcio de veículo e imóvel no Brasil | Autogestor",
    descricao:
      "Consórcio de carro, moto, caminhão e imóvel: parcela sem juros, com taxa de administração, e possibilidade de antecipar a contemplação por lance.",
    abrangencia: "BR",
    campo: {
      rotulo: "O que você quer conquistar?",
      exemplo: "Carro",
      opcoes: ["Carro", "Moto", "Caminhão", "Imóvel", "Serviços"],
    },
    cta: "Quero ver as parcelas",
    fechamento: "Veja quanto fica a parcela do seu consórcio",
    icone: ICONES.grupo,
  },
  {
    slug: "repasse",
    nome: "Repasse de veículos",
    curto: "Repasse",
    resumo: "Seminovos de locadora abaixo da FIPE, sem leilão e sem histórico de sinistro.",
    titulo: "Repasse de veículos de locadora abaixo da FIPE | Autogestor",
    descricao:
      "Compra direta de veículos desmobilizados das maiores locadoras do Brasil, abaixo da tabela FIPE, sem leilão e sem sinistro. Pátios em Goiânia, Contagem e Brasília.",
    abrangencia: "BR",
    campo: { rotulo: "Quanto você pretende investir?", exemplo: "ex.: R$ 80.000 à vista" },
    cta: "Quero ver os veículos",
    fechamento: "Peça a lista de veículos disponíveis",
    icone: ICONES.carro,
  },
];

export const porSlug = (slug: string): Solucao => {
  const s = SOLUCOES.find((x) => x.slug === slug);
  if (!s) throw new Error(`solução desconhecida: ${slug}`);
  return s;
};

/** Pipeline de captação que não é uma vertical do hub — não aparece na nav nem
 *  na grade, mas o /api/lead precisa aceitar o slug. */
export const PARCEIRO: Solucao = {
  slug: "parceiro",
  nome: "Programa de parceiros",
  curto: "Parceiro",
  resumo: "Indique clientes das seis frentes e receba por indicação validada.",
  titulo: "Seja parceiro Autogestor: renda extra por indicação | Autogestor",
  descricao:
    "Ganhe renda extra indicando clientes para energia, seguro, viagens, financiamento, consórcio e repasse. Sem investimento inicial, sem estoque e sem equipe própria.",
  abrangencia: "BR",
  campo: {
    rotulo: "Qual frente mais combina com você?",
    exemplo: "Energia (Coopluz)",
    opcoes: ["Energia (Coopluz)", "Seguros", "Viagens", "Financiamento", "Consórcio", "Repasse", "Todas"],
  },
  cta: "Quero ser parceiro",
  fechamento: "Comece pela conversa, não pelo contrato",
  icone: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16.6 5.3a3.2 3.2 0 0 1 0 6.2M17.7 14a6.2 6.2 0 0 1 3.5 6"/>',
};

/** As cidades do material impresso de captação, na ordem em que o parceiro
 *  reconhece a praça (capital e região metropolitana primeiro). A lista existe
 *  para o lead já chegar roteado por cidade, não para restringir: a Coopluz
 *  atende toda a área de concessão da Equatorial Goiás, e é por isso que
 *  "Outra cidade de Goiás" fecha o `<select>` em vez de ficar de fora. */
export const CIDADES_COOPLUZ = [
  "Goiânia",
  "Aparecida de Goiânia",
  "Anápolis",
  "Rio Verde",
  "Catalão",
  "Itumbiara",
  "Formosa",
  "Ceres",
  "Uruaçu",
  "Iporá",
  "Outra cidade de Goiás",
] as const;

/** Segundo pipeline de parceiro, só da energia. Slug próprio — e não uma opção
 *  do `PARCEIRO` acima — porque é outro funil: oferta com número (comissão de
 *  ativação + recorrente sobre a carteira), área presa a Goiás e lead
 *  trabalhado individualmente por cidade de atuação. Misturar os dois no mesmo
 *  slug perderia justamente o corte que faz o atendimento acontecer. */
export const PARCEIRO_COOPLUZ: Solucao = {
  slug: "parceiro-coopluz",
  nome: "Parceiro Autogestor Energia",
  curto: "Parceiro Energia",
  resumo: "Ative contas de energia em Goiás e receba na ativação mais recorrente sobre a carteira.",
  titulo: "Seja parceiro da energia Coopluz em Goiás | Autogestor",
  descricao:
    "Represente a energia Coopluz em Goiás: 50% da primeira receita de cada conta ativada e 2% recorrente sobre toda a carteira a partir de 100 contas ativas. Sem investimento, sem instalação e sem taxa de adesão.",
  abrangencia: "GO",
  campo: {
    rotulo: "Sua cidade de atuação",
    exemplo: "Goiânia",
    opcoes: CIDADES_COOPLUZ,
  },
  cta: "Quero ser parceiro",
  fechamento: "Escolha sua cidade e comece",
  icone: ICONES.energia,
  externo: "https://coopluz.roilabs.com.br/parceiro",
};

/** Captação da home, onde a pessoa ainda não escolheu vertical. Existe como
 *  `Solucao` para reusar o LeadForm inteiro em vez de manter um segundo
 *  formulário — e porque o /api/lead valida o slug contra esta lista. */
export const GERAL: Solucao = {
  slug: "geral",
  nome: "as seis soluções",
  curto: "Início",
  resumo: "Seis frentes num só atendimento.",
  titulo: "Autogestor",
  descricao: "Captação da home, antes de a pessoa escolher a frente.",
  abrangencia: "BR",
  campo: {
    rotulo: "O que você procura?",
    exemplo: "Energia (Coopluz)",
    opcoes: ["Energia (Coopluz)", "Seguro", "Viagens", "Financiamento", "Consórcio", "Repasse", "Ainda não sei"],
  },
  cta: "Falar com um consultor",
  fechamento: "Fale com um consultor",
  icone: ICONES.grupo,
};

/** `areaServed` do schema.org a partir da abrangência. Fica aqui, e não em
 *  cada layout, porque a exceção da Coopluz tem que ter um dono só. */
export const AREA_SERVIDA = {
  BR: { "@type": "Country", name: "Brasil" },
  GO: { "@type": "State", name: "Goiás" },
} as const;
