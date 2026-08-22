# Feature Specification: Site Próprio da Coopluz

**Feature Branch**: `002-coopluz-standalone-site`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Site institucional próprio da Coopluz, publicado em coopluz.roilabs.com.br, como projeto separado do hub autogestor, reaproveitando layouts, componentes, tokens de design e motor de captação já prontos no hub. Migra o conteúdo hoje em /coopluz e /coopluz/parceiro, os dois artigos de blog do cluster Coopluz, e aponta o formulário de lead para o MESMO banco/painel administrativo do hub (pipeline `coopluz` já existe lá)."

## Clarifications

### Session 2026-08-21

Esta sessão de clarificação foi conduzida em modo autônomo — o dono do
projeto pediu para todas as decisões serem tomadas sem pausa para perguntas,
com revisão posterior. As duas ambiguidades de maior impacto arquitetural
foram resolvidas diretamente, com a opção recomendada, em vez de apresentadas
como pergunta em aberto.

- Q: O site novo deve portar o conteúdo da Coopluz tal como existe hoje no
  hub, ou aprofundar/reescrever o conteúdo já que `docs/estrutura-hub-e-subdominios.md`
  §6 recomenda que a Coopluz "mereça conteúdo próprio, profundidade e
  identidade"? → A: Nesta feature, portar o conteúdo tal como existe hoje
  (extração, não reescrita) — é a fatia que dá site no ar rápido, com texto
  já validado. Aprofundar/expandir conteúdo é uma iniciativa de conteúdo
  separada, não de engenharia, e fica para depois do lançamento.
- Q: Os dois artigos de blog e a página principal passam a existir em dois
  domínios ao mesmo tempo (hub e site novo). Isso deve ser resolvido nesta
  feature apontando o `canonical` das páginas do hub para o site novo (o que
  violaria FR-017, que proíbe alterar o hub), ou o site novo assume
  `canonical` própria e a duplicação temporária fica documentada como
  trade-off aceito? → A: O site novo assume `canonical` própria para todo o
  conteúdo migrado. O hub não é alterado nesta feature (FR-017 permanece
  intacto). A duplicação de conteúdo entre os dois domínios é temporária e
  deliberada, a ser resolvida na decisão futura — já prevista em
  `docs/estrutura-hub-e-subdominios.md` §6 — de redirecionar ou remover as
  páginas equivalentes do hub.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduzir a conta de luz vendo um site só sobre isso (Priority: P1)

Um morador, comércio ou pequena indústria na área de concessão da Equatorial
Goiás pesquisa como pagar menos na conta de luz, chega ao site da Coopluz (por
busca, indicação ou anúncio) e encontra um site inteiramente dedicado a esse
assunto — não uma página entre outras seis. Ele entende a promessa (20% de
desconto, sem obra, sem placa solar), confirma que se qualifica (consumo médio
acima de R$ 250/mês, dentro da área da Equatorial) e envia nome, WhatsApp e o
valor médio da sua conta.

**Why this priority**: É o motivo de existir do site — a vertical com a melhor
combinação de dor mensal visível, mudança regulatória em curso e concorrência
digital fraca. Sem esta jornada não há site.

**Independent Test**: Abrir o domínio do site sem nenhum contexto prévio do hub
autogestor, ler a página até o final, e conseguir enviar o formulário com os
três campos preenchidos, chegando a uma confirmação de recebimento.

**Acceptance Scenarios**:

1. **Given** a pessoa mora na área de concessão da Equatorial Goiás e paga mais
   de R$ 250/mês, **When** ela abre o site e lê a proposta, **Then** ela entende
   sem ambiguidade que não precisa instalar nada, não troca de distribuidora, e
   consegue localizar o formulário de contato sem rolar mais do que a página
   permite de forma razoável.
2. **Given** a pessoa preenche nome, WhatsApp e valor médio da conta, **When**
   ela envia o formulário, **Then** ela vê uma confirmação de que o pedido foi
   recebido e em quanto tempo será contatada.
3. **Given** a pessoa escolhe a faixa "Até R$ 250" no valor da conta, **When**
   ela ainda está preenchendo o formulário, **Then** ela vê um aviso de que
   abaixo desse valor o desconto não compensa, antes de enviar.
4. **Given** a pessoa não sabe se sua cidade está na área de concessão,
   **When** ela procura essa informação no site, **Then** ela encontra a
   resposta no FAQ sem precisar perguntar antes.

---

### User Story 2 - Virar parceiro de energia em Goiás (Priority: P1)

Alguém com rede de contatos em Goiás (comerciante, corretor, correspondente)
chega à página de parceiros do site, entende como funciona a comissão de
ativação e a renda recorrente sobre a carteira, e envia sua cidade de atuação
para começar o credenciamento.

**Why this priority**: É o segundo funil de captação que o site precisa
sustentar desde o primeiro dia — o programa de parceiros de energia já opera
com pipeline próprio no painel administrativo. Sem ele, a página perde o
segundo canal de crescimento que o conteúdo migrado já tem pronto.

**Independent Test**: A partir da home, navegar até a página de parceiros sem
passar por nenhuma outra vertical do grupo, entender a remuneração, e enviar o
formulário com a cidade de atuação escolhida numa lista fechada.

**Acceptance Scenarios**:

1. **Given** a pessoa está na home do site, **When** ela procura como ser
   parceira, **Then** encontra um link claro para a página de parceiros sem
   precisar sair do site ou ser levada ao hub autogestor.
2. **Given** a pessoa está na página de parceiros, **When** ela lê a oferta,
   **Then** entende os dois componentes de remuneração (comissão de ativação e
   recorrente sobre a carteira) e que não há investimento inicial.
3. **Given** a pessoa preenche o formulário de parceiro, **When** ela escolhe
   sua cidade numa lista fechada de opções, **Then** consegue enviar mesmo que
   sua cidade não esteja nomeada, escolhendo a opção "outra cidade de Goiás".

---

### User Story 3 - Chegar pela busca de um assunto, não pela marca (Priority: P2)

Alguém pesquisa "como reduzir a conta da Equatorial Goiás" ou "Fio B 60% 2026"
num buscador ou assistente de IA, sem nunca ter ouvido falar da Coopluz ou da
Autogestor, e chega a um artigo do blog do site. O artigo responde a dúvida e
aponta de volta para a oferta principal.

**Why this priority**: É o motivo declarado de a Coopluz ser a primeira
vertical a ganhar site próprio — busca premia especificidade, e um site
inteiro sobre o assunto é sinal mais forte que uma página entre seis. Sem o
blog publicado no site próprio, essa vantagem de posicionamento não se realiza
no domínio novo.

**Independent Test**: Abrir cada um dos dois artigos existentes diretamente
pela URL, sem navegar a partir da home, e confirmar que o conteúdo aparece
completo e que há um caminho de volta para a oferta da Coopluz.

**Acceptance Scenarios**:

1. **Given** um artigo publicado no blog do site, **When** alguém chega a ele
   por busca, **Then** o conteúdo completo está no HTML recebido, sem depender
   de JavaScript para aparecer.
2. **Given** a pessoa termina de ler um artigo, **When** ela quer saber mais
   sobre a oferta, **Then** encontra uma chamada clara de volta para a página
   principal da Coopluz.
3. **Given** alguém acessa o índice do blog, **When** a página carrega,
   **Then** vê apenas os artigos do cluster Coopluz — nenhum conteúdo das
   outras verticais do grupo aparece, porque elas não existem neste site.

---

### User Story 4 - Consultor atende o lead sem aprender ferramenta nova (Priority: P3)

Um consultor da Autogestor que já usa o painel administrativo para atender
leads do hub abre a mesma tela de hoje e encontra, junto dos leads das outras
verticais, os leads que chegaram pelo site próprio da Coopluz — sem instalar,
configurar ou aprender nada novo.

**Why this priority**: Não é uma jornada nova do usuário final, mas é a
condição que torna o site operável no primeiro dia sem tocar em nenhum sistema
já em produção. Prioridade mais baixa porque, tecnicamente, é consequência
direta de as User Stories 1 e 2 gravarem no lugar certo — não é uma tela nova
a construir.

**Independent Test**: Enviar um lead pelo site novo e, sem qualquer alteração
no painel administrativo existente, encontrá-lo na coluna correta do funil já
usado para a vertical Coopluz.

**Acceptance Scenarios**:

1. **Given** um lead foi enviado pelo site próprio da Coopluz, **When** o
   consultor abre o painel administrativo já existente, **Then** o lead
   aparece no funil da vertical Coopluz, indistinguível na estrutura de um
   lead vindo do hub.
2. **Given** o painel administrativo não foi alterado por esta feature,
   **When** ele é aberto para qualquer outra vertical, **Then** continua
   funcionando exatamente como antes.

### Edge Cases

- O que acontece quando a gravação do lead falha (banco fora do ar,
  indisponibilidade momentânea)? O site deve mostrar o WhatsApp direto em vez
  de confirmar um recebimento que não ocorreu — nunca finge sucesso.
- O que acontece quando a pessoa envia o formulário sem JavaScript no
  navegador? O envio precisa funcionar do mesmo jeito, por navegação de
  página inteira.
- O que acontece quando a mesma pessoa envia o formulário duas vezes seguidas
  (duplo clique, reenvio)? O sistema não deve criar dois leads distintos para
  o mesmo contato na mesma janela de tempo.
- O que acontece quando um robô de automação tenta enviar o formulário em
  volume? O site deve limitar tentativas repetidas da mesma origem sem
  bloquear pessoas reais enviando uma vez.
- O que acontece quando alguém fora da área de concessão da Equatorial Goiás
  tenta se cadastrar? O formulário aceita o envio (a qualificação final é
  humana, feita pelo consultor), mas o conteúdo do site já deixa a
  abrangência clara antes do envio.
- O que acontece quando um artigo do blog é acessado por alguém que nunca viu
  o site principal? O artigo precisa se sustentar sozinho e apontar
  claramente para a oferta, sem assumir contexto de navegação anterior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O site MUST apresentar, na página inicial, a promessa central da
  Coopluz (desconto de 20% na conta da Equatorial Goiás, sem obra e sem placa
  solar), como funciona a compensação de energia, quem pode e quem não pode
  participar, e prova social (números da cooperativa).
- **FR-002**: O site MUST oferecer uma página dedicada ao programa de
  parceiros de energia, com a explicação da remuneração (comissão de ativação
  e renda recorrente sobre a carteira) e um formulário próprio de captação.
- **FR-003**: O site MUST publicar os dois artigos do cluster editorial da
  Coopluz já existentes, acessíveis por um índice de blog restrito a esse
  cluster.
- **FR-004**: O site MUST capturar leads por um formulário de três campos
  (nome, WhatsApp, e uma terceira pergunta específica por página: valor médio
  da conta na home, cidade de atuação na página de parceiros).
- **FR-005**: Todo lead capturado MUST ser gravado na mesma base de dados e no
  mesmo formato já usados pelo painel administrativo existente, de forma que
  apareça no funil da vertical Coopluz sem qualquer alteração nesse painel.
- **FR-006**: Se a gravação de um lead falhar por qualquer motivo, o site
  MUST informar isso ao usuário e oferecer o contato direto por WhatsApp, sem
  jamais confirmar um recebimento que não ocorreu.
- **FR-007**: O envio do formulário MUST funcionar mesmo sem JavaScript no
  navegador do visitante.
- **FR-008**: O site MUST limitar o número de envios de formulário aceitos a
  partir da mesma origem numa janela curta de tempo, para conter abuso
  automatizado, sem impedir o envio legítimo de uma pessoa real.
- **FR-009**: Cada página MUST declarar, de forma legível tanto por humano
  quanto por buscador e por assistente de IA, que a abrangência geográfica da
  oferta é a área de concessão da Equatorial Goiás — nunca o Brasil inteiro.
- **FR-010**: O site MUST informar, de forma verificável, que a Autogestor é
  parceira credenciada da Coopluz (não a própria cooperativa), incluindo
  desde quando a Autogestor opera.
- **FR-011**: O site MUST oferecer uma página de Sobre — que também cumpre o
  papel de página de Contato, reunindo endereço, WhatsApp e e-mail, no mesmo
  padrão já usado pelo hub — além de Política de Privacidade e Termos, cada
  uma com conteúdo específico da Coopluz e da Autogestor como parceira
  credenciada.
- **FR-012**: O site MUST publicar um mapa do site legível por máquina
  (formato texto simples) listando as páginas existentes e do que cada uma
  trata, para consumo por assistentes de resposta por IA.
- **FR-013**: Toda página MUST carregar dados estruturados descrevendo a
  organização, a oferta e as perguntas frequentes, de forma extraível sem
  depender de interpretar o layout visual.
- **FR-014**: Nenhuma informação apresentada como fato verificável (registro,
  número, prazo) MUST ser publicada sem que já exista uma fonte para ela no
  conteúdo herdado do hub — nenhum dado novo e não verificado MUST ser
  introduzido nesta migração.
- **FR-015**: O site MUST funcionar em tema claro e escuro, com a preferência
  do visitante respeitada.
- **FR-016**: O site MUST ser publicado sob domínio próprio
  (`coopluz.roilabs.com.br`), com URLs canônicas, sitemap e mapa de site
  apontando para esse domínio — nunca para um domínio de pré-visualização,
  e nunca para o domínio do hub.
- **FR-017**: A existência deste site novo MUST NOT alterar o funcionamento
  do hub autogestor nem do painel administrativo existentes — nenhuma rota,
  dado ou comportamento deles muda como consequência desta feature.

### Key Entities

- **Lead**: Contato captado pelo formulário — nome, WhatsApp, a resposta da
  terceira pergunta específica da página, a página/pipeline de origem
  (`coopluz` ou `parceiro-coopluz`), e metadados de origem (data, referência).
  Vive na mesma base de dados já usada pelo hub e pelo painel administrativo;
  esta feature não cria uma nova entidade de dado, apenas um novo produtor
  para uma que já existe.
- **Artigo de blog**: Conteúdo editorial do cluster Coopluz — título, corpo,
  data de publicação. Migrado do hub sem mudança de conteúdo.
- **Página institucional**: Sobre, Contato, Privacidade, Termos — conteúdo
  específico da Coopluz/Autogestor como parceira credenciada, sem os dados
  que pertencem só a outra vertical (ex.: registro SUSEP, que é da vertical de
  seguros).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa que nunca ouviu falar do hub autogestor consegue,
  a partir da home do site novo, entender a oferta e enviar o formulário
  principal sem sair do domínio da Coopluz.
- **SC-002**: 100% dos envios de formulário, com ou sem JavaScript no
  navegador, resultam em confirmação visível para o usuário quando a
  gravação é bem-sucedida, e em orientação de contato direto quando falha —
  nunca em silêncio ou mensagem ambígua.
- **SC-003**: Um lead enviado pelo site novo aparece no painel administrativo
  existente na coluna correta do funil em até o mesmo tempo que um lead
  enviado pelo hub leva hoje, sem qualquer configuração adicional no painel.
- **SC-004**: As páginas essenciais (home, parceiro, os dois artigos) estão
  completamente presentes no HTML recebido pelo navegador, sem depender de
  execução de JavaScript para o conteúdo aparecer.
- **SC-005**: O peso de JavaScript enviado ao navegador em qualquer página
  pública não ultrapassa o orçamento já praticado no hub (~1 KB), a menos que
  uma exceção documentada justifique o excesso.
- **SC-006**: Todo texto que afirma um fato verificável (prazo, percentual,
  registro, condição de elegibilidade) é rastreável ao conteúdo já publicado
  no hub — nenhuma alegação nova sem lastro é introduzida.
- **SC-007**: O site publicado responde no domínio final
  `coopluz.roilabs.com.br` com canonical, sitemap e mapa de site em texto
  todos apontando para esse mesmo domínio.

## Assumptions

- O site novo é um projeto (repositório) separado do hub autogestor, e não
  uma extração dentro do mesmo build — conforme já recomendado em
  `docs/estrutura-hub-e-subdominios.md` do hub para a Coopluz especificamente
  ("caminho completo").
- O domínio de produção real usado hoje pelo hub é `autogestor.roilabs.com.br`
  (não `autogestor.com.br`, citado nos docs como nome de marca aspiracional);
  o site novo segue o mesmo padrão em `coopluz.roilabs.com.br`.
- O motor de captação de lead, o esquema de dados e o painel administrativo
  já existentes no hub continuam sendo a única fonte de verdade para leads —
  esta feature reaproveita esse motor, não cria um paralelo.
- O conteúdo (textos, FAQ, números da cooperativa, artigos de blog) é
  herdado do hub tal como está hoje; esta feature não inclui pesquisa ou
  redação de conteúdo novo, apenas adaptação do que depende de estar "dentro
  do hub" (links cruzados para as outras cinco verticais, breadcrumbs do
  hub). Aprofundar o conteúdo com a identidade própria que
  `docs/estrutura-hub-e-subdominios.md` recomenda é uma iniciativa futura,
  fora desta feature.
- Enquanto as páginas equivalentes continuarem no ar nos dois domínios (hub e
  site novo), haverá conteúdo duplicado entre eles. Isso é um trade-off
  temporário aceito nesta feature — o site novo é a fonte canônica para o
  conteúdo que ele publica, mas nenhuma mudança é feita no hub para evitar a
  duplicação. Resolver isso (redirecionar ou remover as páginas do hub) é
  decisão futura, já prevista nos docs do hub.
- Configuração de DNS e domínio na hospedagem é um passo operacional externo
  ao código e está fora do escopo desta feature — a feature entrega o site
  pronto para ser apontado a esse domínio.
- O hub autogestor e sua página `/coopluz` continuam no ar sem alteração; a
  decisão de redirecionar ou remover essa página do hub em favor do site
  próprio é uma decisão futura, fora do escopo desta feature.
- As outras cinco verticais (seguro, viagens, financiamento, consórcio,
  repasse) e o programa de parceiros genérico não fazem parte deste site e
  não são portados.
