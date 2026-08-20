# Autogestor — estrutura do hub institucional e dos sites por solução

> Documento de referência sobre a arquitetura digital da Autogestor: um site
> institucional (hub) que apresenta as seis soluções da empresa, e um site
> individual por solução em subdomínio próprio. A primeira solução a ganhar site
> próprio é a Coopluz, em `coopluz.autogestor.com.br`.
>
> Versão de 20 de agosto de 2026.

---

## 1. Resumo executivo

A Autogestor opera **seis frentes de negócio distintas** sob a mesma marca:
energia por cooperativa (Coopluz), seguro e proteção veicular, viagens e
passagens, financiamento de veículos, consórcio e repasse de veículos.

A estratégia digital tem **duas camadas**:

1. **O hub institucional** (`autogestor.com.br`) — apresenta a empresa e as seis
   soluções lado a lado. É a porta de entrada para quem chega pela marca, pelo
   boca a boca ou por indicação, e não sabe ainda qual das seis frentes resolve
   o problema dele.
2. **Os sites por solução** (`<solução>.autogestor.com.br`) — cada vertical
   ganha um site institucional próprio, com domínio, conteúdo e posicionamento
   independentes. É a porta de entrada para quem chega pela **necessidade**
   ("quero pagar menos na conta de luz"), não pela marca.

A ordem de construção não é arbitrária. **A Coopluz é a primeira**, em
`coopluz.autogestor.com.br`, porque é a vertical com a melhor combinação de
demanda local, urgência real e concorrência digital fraca — os motivos estão
detalhados na seção 5.

O hub já está no ar e funcionando. Os sites por solução são a fase seguinte, e a
base técnica do hub foi construída desde o primeiro dia para permitir essa
separação sem reescrita.

---

## 2. A empresa

| Dado | Valor |
|---|---|
| Nome fantasia | Autogestor |
| Razão social | Grupo Autogestor Adm de Serviços — Seguros, Financiamentos e Turismo |
| Fundação | 2004 |
| Registro SUSEP | 202070004 (corretora de seguros habilitada) |
| Sede | Av. Itália, 1326 — Jardim Europa, Goiânia/GO, CEP 74325-110 |
| Contato | (62) 98262-2220 · atendimento@autogestor.com.br |
| Atendimento | Segunda a sexta, das 8h às 18h · resposta no mesmo dia útil |

Duas informações desse quadro carregam peso estratégico e reaparecem no site
inteiro:

- **2004** — mais de duas décadas de operação. Num mercado onde o concorrente
  típico é uma landing page de seis meses de idade, tempo de casa é diferencial
  verificável.
- **SUSEP 202070004** — registro público e conferível na consulta de corretores
  da própria SUSEP. O site não apenas afirma o registro: **linka o caminho para
  conferir**. Alegação sem caminho de verificação é só um número na tela, e é
  exatamente o tipo de afirmação que mecanismos de resposta por IA não citam sem
  fonte.

---

## 3. Arquitetura em duas camadas

### 3.1 Camada 1 — o hub institucional

O hub responde a uma pergunta só: *"o que a Autogestor faz e qual dessas coisas
resolve o meu problema?"*

Estrutura de páginas do hub, hoje no ar:

| Página | Papel |
|---|---|
| Home | Apresenta as seis soluções em grade + formulário de captação genérico |
| 6 páginas de solução | Uma por vertical: promessa, prova, FAQ e formulário |
| Sobre | História, registro SUSEP, endereço, credenciais |
| Seja parceiro | Programa de indicação — pipeline de captação paralelo |
| Blog | Conteúdo de busca, organizado por cluster de intenção |
| Contato / Obrigado | Confirmação de lead e canal direto |
| Privacidade e Termos | Base legal, com data de última revisão visível |

A navegação mostra **as seis verticais de uma vez, sem menu hambúrguer**. A
decisão é deliberada: menu fechado esconde exatamente aquilo que a pessoa veio
procurar, e num negócio de seis frentes a lista *é* a proposta de valor.

### 3.2 Camada 2 — os sites por solução

Cada vertical vira um site institucional próprio em subdomínio:

| Solução | Subdomínio futuro | Ordem |
|---|---|---|
| Energia Coopluz | `coopluz.autogestor.com.br` | **1º — em construção** |
| Seguro e proteção veicular | `seguro.autogestor.com.br` | 2º |
| Financiamento de veículos | `financiamento.autogestor.com.br` | 3º |
| Consórcio | `consorcio.autogestor.com.br` | 4º |
| Repasse de veículos | `repasse.autogestor.com.br` | 5º |
| Viagens e passagens | `viagens.autogestor.com.br` | 6º |

### 3.3 Por que separar em vez de deixar tudo num site só

**Porque as seis soluções não competem pela mesma pessoa.** Quem quer desconto
na conta de luz em Goiânia e quem quer financiar um caminhão não são o mesmo
público, não usam as mesmas palavras e não decidem pelos mesmos critérios. Um
site único obriga todas as seis a dividirem a mesma autoridade de domínio, o
mesmo título, a mesma home e a mesma narrativa.

**Porque busca premia especificidade.** Um site inteiro sobre energia por
cooperativa em Goiás é um sinal mais forte, para buscador e para motor de
resposta por IA, do que uma página sobre energia dentro de um site sobre seis
assuntos. O mesmo vale para o outro lado: o hub deixa de ter que ser bom em seis
temas ao mesmo tempo e passa a ser bom em um — apresentar o grupo.

**Porque cada vertical tem ciclo próprio.** A Coopluz depende de área de
concessão e de mudança regulatória. Seguro depende de sinistro e renovação
anual. Viagens depende de sazonalidade. Separados, cada site pode publicar, medir
e evoluir no ritmo do próprio mercado, sem que uma campanha de energia polua a
mensagem de consórcio.

**Porque abrangência geográfica difere.** Cinco verticais atendem o Brasil
inteiro. A Coopluz atende **apenas a área de concessão da Equatorial Goiás** —
uma restrição que precisa estar clara no site dela e que seria ruído no hub.

---

## 4. As seis soluções, em detalhe

Cada solução carrega uma promessa própria, uma abrangência geográfica e uma
pergunta de qualificação que é feita já no formulário — a terceira pergunta,
depois de nome e WhatsApp.

### 4.1 Energia Coopluz — `coopluz`

- **Promessa:** 20% de desconto na conta da Equatorial Goiás, sem obra e sem
  placa no telhado.
- **Abrangência:** Goiás (área de concessão da Equatorial Goiás).
- **Como funciona:** a Coopluz é uma cooperativa de energia por compensação. O
  cliente se associa, a energia é gerada em fazendas solares cooperadas, e os
  créditos dessa geração entram como desconto na própria fatura da distribuidora.
  Nada é instalado no imóvel do cliente.
- **O que não muda:** a Equatorial Goiás continua sendo a distribuidora, a fatura
  continua vindo dela, a titularidade permanece com o cliente.
- **Elegibilidade:** residências, comércios e pequenas indústrias com consumo
  médio acima de R$ 250/mês. Abaixo disso o desconto não compensa a operação — e
  a Autogestor diz isso antes da assinatura.
- **Prazo:** o primeiro crédito costuma aparecer em até 90 dias, conforme o ciclo
  de leitura da distribuidora.
- **Compromissos:** sem taxa de adesão, sem fidelidade, sem multa de
  cancelamento. Ao sair, paga-se apenas o saldo residual dos créditos já usados e
  não faturados.
- **Base legal:** compensação de energia elétrica regulada pela ANEEL e amparada
  pela Lei 14.300/2022, o marco legal da microgeração e minigeração distribuída.
- **Qualificação no formulário:** valor médio da conta de luz.
- **Chamada:** "Quero pagar 20% menos".

### 4.2 Seguro e proteção veicular — `seguro`

- **Promessa:** cotação de carro, moto e caminhão comparada entre seguradoras,
  com assistência 24h.
- **Abrangência:** Brasil.
- **Diferencial:** corretora com registro SUSEP desde 2004 — o que significa
  comparação real entre seguradoras e apoio na regulação de sinistro, não apenas
  venda de apólice.
- **Contexto de mercado:** a LC 213/2025 deu marco regulatório à proteção
  veicular mutualista, tornando a diferença entre "seguro" e "proteção veicular"
  uma dúvida ativa e recente do consumidor.
- **Qualificação no formulário:** marca e modelo do veículo.
- **Chamada:** "Quero minha cotação".

### 4.3 Viagens e passagens — `viagens`

- **Promessa:** passagem aérea, hotel e resort com tarifa de agência e
  parcelamento em até 12x.
- **Abrangência:** Brasil (destinos nacionais e internacionais).
- **Operação:** agência online 24h, com tarifas de agência não disponíveis na
  venda direta ao consumidor.
- **Qualificação no formulário:** destino, período e número de passageiros.
- **Chamada:** "Quero uma cotação de viagem".

### 4.4 Financiamento de veículos — `financiamento`

- **Promessa:** crédito aprovado **antes** de escolher o carro, sem taxa para
  analisar a ficha.
- **Abrangência:** Brasil.
- **Escopo:** veículo novo ou usado, nacional ou importado.
- **Inversão do processo:** o mercado manda escolher o carro e depois torcer pela
  aprovação. Aqui a aprovação vem primeiro — a pessoa negocia sabendo quanto tem.
- **Compromisso:** sem cobrança para analisar a ficha nem para liberar o crédito.
- **Qualificação no formulário:** quanto precisa financiar.
- **Chamada:** "Quero simular meu crédito".

### 4.5 Consórcio — `consorcio`

- **Promessa:** carro, moto, caminhão ou imóvel com parcela sem juros e lance
  para antecipar a contemplação.
- **Abrangência:** Brasil.
- **Escopo:** veículos, imóveis e serviços.
- **Mecânica:** parcela sem juros (com taxa de administração), e possibilidade de
  antecipar a contemplação por lance.
- **Qualificação no formulário:** o que a pessoa quer conquistar (carro, moto,
  caminhão, imóvel ou serviços).
- **Chamada:** "Quero ver as parcelas".

### 4.6 Repasse de veículos — `repasse`

- **Promessa:** seminovos de locadora abaixo da FIPE, sem leilão e sem histórico
  de sinistro.
- **Abrangência:** Brasil, com pátios em Goiânia, Contagem e Brasília.
- **Origem:** compra direta de veículos desmobilizados das maiores locadoras do
  país.
- **Dois medos endereçados de frente:** não é leilão (não há disputa nem lote às
  cegas) e não é carro batido (a frota de locadora tem manutenção documentada).
- **Qualificação no formulário:** quanto pretende investir.
- **Chamada:** "Quero ver os veículos".

### 4.7 Programa de parceiros — pipeline paralelo

Além das seis verticais, existe um sétimo caminho de captação: o **programa de
parceiros**, para quem quer indicar clientes das seis frentes e receber por
indicação validada. Sem investimento inicial, sem estoque e sem equipe própria.

Ele não aparece na navegação das soluções porque **não é uma solução para o
cliente final** — é uma frente de crescimento por rede. Mas usa a mesma
infraestrutura de captação e cai na mesma base de leads, identificado por
origem própria.

---

## 5. Por que a Coopluz é a primeira

A escolha da Coopluz como primeiro site em subdomínio se sustenta em cinco
argumentos independentes que apontam para a mesma direção.

**1. A dor é mensal, visível e crescente.** Conta de luz chega todo mês com o
valor impresso. Não é preciso convencer ninguém de que o problema existe — a
fatura já fez isso. Nas outras verticais, a necessidade é episódica: alguém
financia um carro a cada cinco anos, contrata seguro uma vez por ano, viaja
quando dá.

**2. Existe uma mudança regulatória em curso, com data.** A Lei 14.300/2022
instituiu a cobrança progressiva do Fio B para a geração distribuída: 15% em
2023, 30% em 2024, 45% em 2025 e **60% em 2026**, com projeção de 100% em 2029.
Isso significa que o cálculo de "vale a pena colocar placa no telhado?" muda a
cada ano — e que a alternativa por cooperativa, sem investimento em
equipamento, ganha argumento novo a cada degrau da tabela. Quem publica conteúdo
sobre isso agora chega antes.

**3. A concorrência digital é fraca no recorte local.** Nas verticais
financeiras, a primeira página de busca é ocupada por bancos e grandes
administradoras — ranquear ali dá impressão em posição irrelevante e clique perto
de zero. Já em "reduzir conta da Equatorial Goiás", a disputa é entre conteúdo
raso e notícia local. É o único cluster com chance real de primeira posição em
prazo curto.

**4. A restrição geográfica vira vantagem quando isolada.** A Coopluz só atende a
área de concessão da Equatorial Goiás. Dentro do hub, isso é uma exceção que
precisa ser explicada. Num site próprio, é foco: **um site inteiramente sobre
energia em Goiás**, escrito para quem mora em Goiás, é um sinal de relevância
local que nenhuma página dentro de um site nacional consegue emitir.

**5. O conteúdo já começou.** O cluster editorial da Coopluz já tem um artigo
pilar ("como reduzir a conta da Equatorial Goiás sem placa solar") e um artigo
satélite sobre o Fio B de 60% em 2026, ambos publicados. O site em subdomínio
não parte do zero — herda base de conteúdo já indexável.

---

## 6. Como a separação em subdomínios funciona tecnicamente

A decisão de separar não foi tomada depois. Ela está embutida na estrutura do
hub desde o início, e isso é o que torna a migração barata.

**O identificador de cada solução já é o nome do futuro subdomínio.** A vertical
de energia tem o identificador `coopluz`; o site dela será
`coopluz.autogestor.com.br`. Não há tradução, mapa ou tabela de conversão a
manter.

**Nenhuma página depende de estar no mesmo endereço que as outras.** Não existe
link interno que assuma um domínio comum. Uma página de solução funciona
igualmente bem dentro do hub ou sozinha em outro domínio.

**O endereço base é configuração, não código.** Uma única variável de ambiente
controla os endereços canônicos, o mapa do site e as tags de compartilhamento
social. Trocar o domínio de um site é trocar um valor de configuração.

Com isso, existem **dois caminhos possíveis de migração**, e a escolha pode ser
feita por vertical:

- **Caminho rápido:** apontar o subdomínio para o mesmo deploy do hub, com
  reescrita de rota na hospedagem. O site sobe em minutos, sem código novo.
- **Caminho completo:** extrair a vertical para um projeto próprio, reaproveitando
  os layouts e componentes já prontos. Dá liberdade total de conteúdo e
  identidade visual, ao custo de manter mais um projeto.

A recomendação é usar o caminho completo na Coopluz — ela merece conteúdo
próprio, profundidade e identidade — e avaliar o caminho rápido nas verticais
seguintes conforme a demanda comprovar o investimento.

---

## 7. O que já está no ar

O hub está publicado e operante. Números da entrega atual:

| Item | Estado |
|---|---|
| Páginas do site | 11 páginas estáticas + blog |
| JavaScript enviado ao navegador | ~1 KB — o site funciona inteiro sem ele |
| Dependências de estilo | nenhuma; CSS puro |
| Formulário de captação | 3 campos |
| Artigos publicados | 2 (cluster Coopluz: 1 pilar + 1 satélite) |
| Painel administrativo | construído e verificado, aguardando publicação |
| Tema claro e escuro | implementado, com preferência salva |

**Como o site é construído:** HTML estático gerado no momento da publicação. A
página que o visitante recebe já está pronta — não há montagem no navegador. Isso
dá o melhor tempo de carregamento possível e entrega ao buscador exatamente o
conteúdo que o humano vê, sem depender de execução de script.

**A única parte dinâmica é o recebimento de lead.** Todo o resto é arquivo
estático servido de borda.

---

## 8. O motor de captação de leads

Todas as seis soluções — e o futuro site da Coopluz — alimentam o mesmo motor.

### 8.1 O formulário de três campos

O site antigo pedia seis campos. O atual pede **três**: nome, WhatsApp e **uma
pergunta específica da solução**.

O e-mail foi cortado porque **o canal real de atendimento é o WhatsApp**. Pedir
um dado que ninguém vai usar é fricção pura: cada campo a mais é uma chance a
mais de a pessoa desistir, em troca de uma informação que ficará parada no banco.

A terceira pergunta muda por solução, e é o que transforma um contato em um lead
qualificado:

| Solução | Terceira pergunta |
|---|---|
| Coopluz | Valor médio da sua conta de luz |
| Seguro | Marca e modelo do veículo |
| Viagens | Para onde você quer ir? |
| Financiamento | Quanto você precisa financiar? |
| Consórcio | O que você quer conquistar? |
| Repasse | Quanto você pretende investir? |

O consultor abre a conversa já sabendo o que a pessoa quer e em que faixa. É a
primeira pergunta da ligação, feita antes da ligação existir.

### 8.2 O formulário da home

Na home, a pessoa ainda não escolheu vertical. Em vez de um formulário sem
contexto, a terceira pergunta vira **"o que você procura?"**, com as seis frentes
como opção e um "ainda não sei" honesto. O lead sai com contexto em vez de sair
cru.

### 8.3 O que acontece com o lead

Cada envio é gravado com data, origem, solução e histórico de eventos, numa base
compartilhada com o restante da operação digital do grupo — o mesmo formato que
o painel administrativo lê, sem camada de tradução no meio.

### 8.4 Falha honesta

Se a gravação do lead falhar por qualquer motivo, **o site não finge que deu
certo**. Ele mostra o WhatsApp direto. O princípio: um formulário que diz
"recebido" sem ter recebido é pior que um formulário quebrado, porque a pessoa
vai embora achando que será chamada.

Mesmo raciocínio na página de confirmação: ela é montada no servidor justamente
para conseguir distinguir sucesso de erro. Se fosse uma página estática, quem
enviasse sem JavaScript e errasse o telefone leria "pedido recebido" — a página
mentiria exatamente para quem não foi atendido.

---

## 9. O painel administrativo

Existe um painel separado, já construído, que lê os leads captados pelos seis
sites e organiza o atendimento em quadro visual (kanban), com histórico por lead.

Duas decisões vale registrar:

- **Login com sessão, não senha compartilhada.** O histórico do lead precisa
  dizer **quem** moveu o card. Senha única de equipe registra "alguém mudou o
  status", que não serve para nada.
- **É um projeto separado do site.** O site institucional precisa ser leve,
  público e estático; o painel precisa ser autenticado e dinâmico. Misturar os
  dois faria o site carregar o peso de um sistema que 100% dos visitantes nunca
  vão abrir.

O painel está codado e verificado, faltando apenas a publicação.

---

## 10. Estratégia de conteúdo e visibilidade

### 10.1 Conteúdo por cluster de intenção, não por vertical

O blog **não** tem uma categoria por solução. Ele tem **clusters de intenção**:
um artigo pilar responde a pergunta grande, e artigos satélite respondem as
perguntas periféricas e apontam de volta para o pilar. Cada artigo termina numa
chamada para a vertical correspondente.

Ordem de ataque definida por concorrência de busca e sinal de intenção:

| Ordem | Cluster | Justificativa |
|---|---|---|
| 1º | **Coopluz** | Disputa fraca + tema local + notícia recorrente. Único com chance real de primeira posição em prazo curto. |
| 2º | Seguro | A LC 213/2025 abriu janela de conteúdo, e a Autogestor tem SUSEP desde 2004 como fonte citável. |
| 3º | Financiamento | "Score baixo" é intenção alta com concorrência de conteúdo raso. |
| 4º | Consórcio | O termo genérico está perdido para bancos; o valor está na cauda de "contemplado" e "lance". |
| 5º | Viagens | Disputa dominada por grandes agências online. Cluster mais fraco — deixado por último. |

### 10.2 Visibilidade em mecanismos de resposta por IA

Além do buscador tradicional, o site é preparado para ser **citado** por
assistentes de IA. Isso exige coisas que SEO clássico não pedia:

- **Um mapa do site em texto legível por máquina** (`llms.txt`), listando o que
  existe e do que cada página trata.
- **Dados estruturados completos**, descrevendo a organização, o site, cada
  página e as perguntas frequentes num formato que a máquina consegue extrair sem
  interpretar layout.
- **Área de atendimento declarada por solução** — Brasil nas cinco verticais
  nacionais, Goiás na Coopluz. Um assistente que responde "atende em Goiás?"
  precisa dessa informação como dado, não como frase solta no meio de um
  parágrafo.
- **Perguntas frequentes no HTML mesmo quando fechadas na tela.** A resposta
  existe no código da página independentemente de a pessoa ter clicado para
  abrir — que é o que o dado estruturado precisa espelhar para ser confiável.
- **Nenhum número sem fonte.** Durante a pesquisa de conteúdo, valores de
  bandeira tarifária encontrados em notícia local foram **descartados** por não
  haver certeza de que continuavam válidos. Os artigos descrevem o mecanismo sem
  fixar valor duvidoso. Número errado citado por IA vira número errado atribuído
  à marca.

---

## 11. Princípios de produto observáveis no site

Um conjunto de decisões pequenas que, somadas, definem como a Autogestor se
apresenta. Vale citar porque são as que diferenciam o site de um template.

**Menos campos, mais respostas.** Três campos em vez de seis. Cada campo cortado
é conversão ganha.

**Dizer não antes da assinatura.** A Coopluz informa que abaixo de R$ 250 de
conta o desconto não compensa. Perder o lead errado no site é mais barato que
perder o cliente errado depois.

**Contraste antes de estética.** O laranja da marca com texto branco reprova em
acessibilidade (2,93:1). Com texto escuro, aprova (5,94:1). Escurecer o laranja
também resolveria, mas perderia a cor da marca — então o texto mudou, não a cor.

**Ação sempre ao alcance no celular.** As páginas de solução são longas. Entre o
formulário do topo e o do fim havia quase 4.000 pixels sem nenhuma ação
disponível. Uma barra fixa resolve isso — e some sozinha quando um formulário
está visível, para não cobrir justamente o botão de enviar.

**Tema escuro que não é um segundo site.** O modo escuro é a mesma paleta azul
com a luz apagada. Cada elemento mantém o papel que já tinha no modo claro; o que
inverte é a hierarquia de luminosidade, não a função. Custa cerca de 1 KB de
estilo.

**Uma fonte de verdade por assunto.** Nome, endereço e telefone da empresa
aparecem no rodapé, nos dados estruturados e na página de contato — e vivem num
único lugar no código. Divergência entre esses três é o erro clássico que derruba
posicionamento local em busca.

**Simplicidade deliberada, marcada como tal.** Onde uma solução simples foi
escolhida no lugar de uma robusta, o código registra a escolha, o limite dela e o
gatilho para evoluir. Simplificação anotada é decisão; simplificação silenciosa é
dívida.

---

## 12. Situação atual e próximos passos

**Concluído**
- Hub institucional com as seis soluções, publicado e operante.
- Motor de captação de leads com gravação em base própria.
- Programa de parceiros como pipeline paralelo.
- Cluster editorial da Coopluz iniciado (pilar + 1 satélite).
- Painel administrativo de leads construído e verificado.

**Em andamento**
- Publicação do painel administrativo.
- Site próprio da Coopluz em `coopluz.autogestor.com.br`.

**Planejado**
- Sites em subdomínio para as cinco verticais restantes, na ordem: seguro,
  financiamento, consórcio, repasse, viagens.
- Expansão dos clusters editoriais na mesma ordem.
- Fonte tipográfica própria da marca (hoje usa fontes do sistema, que custam
  0 KB de carregamento).
- Medição de conversão além da contagem de visitas.

---

## 13. Glossário

**Área de concessão** — território onde uma distribuidora de energia tem
exclusividade de atendimento. A Coopluz só atende quem está na área da Equatorial
Goiás.

**Cluster de intenção** — grupo de artigos que responde a um mesmo conjunto de
dúvidas, com um artigo principal (pilar) e vários satélites que apontam para ele.

**Consórcio** — modalidade de compra em grupo, com parcelas sem juros (mas com
taxa de administração) e contemplação por sorteio ou lance.

**Contemplação** — momento em que o participante do consórcio tem direito à
carta de crédito.

**Compensação de energia** — sistema regulado pela ANEEL em que a energia gerada
em um lugar abate a conta de consumo em outro, por meio de créditos.

**FIPE** — tabela de referência de preço de veículos usados no Brasil.

**Fio B** — parcela da tarifa de energia referente ao uso do sistema de
distribuição. A Lei 14.300/2022 estabeleceu sua cobrança progressiva sobre a
geração distribuída: 15% em 2023, 30% em 2024, 45% em 2025, 60% em 2026 e
projeção de 100% em 2029.

**GEO / AEO** — otimização para mecanismos de resposta por IA (ChatGPT,
Perplexity, resumos de IA do Google). Difere do SEO clássico por priorizar
extração de fatos e verificabilidade sobre posicionamento em lista de links.

**Geração distribuída** — energia produzida perto de quem consome, em pequena e
média escala, como as fazendas solares cooperadas da Coopluz.

**Hub** — o site institucional central, que apresenta a marca e todas as
soluções. Em oposição aos sites satélite, um por solução.

**Lead** — contato de alguém que demonstrou interesse e deixou dados para ser
atendido.

**LC 213/2025** — lei complementar que estabeleceu marco regulatório para a
proteção veicular mutualista, tornando explícita a diferença entre ela e o seguro
tradicional.

**Lei 14.300/2022** — marco legal da microgeração e minigeração distribuída no
Brasil. É a base regulatória da operação da Coopluz.

**Repasse** — venda direta de veículos desmobilizados por locadoras, geralmente
abaixo da tabela FIPE, sem passar por leilão.

**Subdomínio** — endereço derivado do domínio principal, como
`coopluz.autogestor.com.br` a partir de `autogestor.com.br`.

**SUSEP** — Superintendência de Seguros Privados, órgão federal que regula o
mercado de seguros. Corretoras habilitadas têm registro consultável publicamente.

**Vertical** — cada uma das seis frentes de negócio da Autogestor.
