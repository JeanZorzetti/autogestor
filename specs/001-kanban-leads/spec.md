# Feature Specification: Kanban de Leads

**Feature Branch**: `001-kanban-leads`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Kanban em https://admin.autogestor.roilabs.com.br/leads"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o funil inteiro de uma vez (Priority: P1)

O corretor abre a tela de Leads e vê o funil em colunas — uma coluna por etapa
(novo, contato, proposta, ganho, perdido) — com um cartão por lead. Cada cartão
mostra nome, vertical, contexto da origem e há quantos dias o lead está parado
naquela etapa. Cada coluna mostra quantos leads contém.

**Why this priority**: É o valor central do Kanban e funciona sozinho. Hoje a
lista é uma tabela linear: para saber "quantos estão em proposta?" o corretor
precisa filtrar por etapa e contar. O quadro responde isso sem nenhuma ação.

**Independent Test**: Com leads em várias etapas no banco, abrir a tela e
conferir que cada lead aparece exatamente uma vez, na coluna da sua etapa
atual, e que a contagem do topo de cada coluna bate com o número de cartões.

**Acceptance Scenarios**:

1. **Given** existem leads distribuídos entre as 5 etapas, **When** o corretor
   abre a tela de Leads, **Then** vê 5 colunas na ordem do funil, cada lead na
   coluna da sua etapa atual, e a contagem de cada coluna igual ao número de
   cartões nela.
2. **Given** uma etapa sem nenhum lead, **When** o quadro é exibido, **Then** a
   coluna aparece mesmo assim, vazia, com contagem 0 e uma mensagem curta de
   estado vazio.
3. **Given** um lead parado além do limiar da sua etapa (1 dia em novo, 5 em
   contato, 7 em proposta), **When** o quadro é exibido, **Then** o cartão traz
   um destaque visual de "parado" com o número de dias, e o destaque é
   perceptível sem depender só de cor.
4. **Given** o corretor clica no nome de um lead no cartão, **When** a navegação
   ocorre, **Then** ele chega na página de detalhe daquele lead.

---

### User Story 2 - Mover um lead de etapa arrastando (Priority: P1)

O corretor arrasta o cartão de uma coluna para outra e o lead muda de etapa na
hora, com o histórico registrando quem moveu e quando. A mesma mudança é
possível sem mouse, pelo teclado, e em tela de toque.

**Why this priority**: Sem mover, o quadro é só um relatório. Mover é a ação que
o corretor repete dezenas de vezes por dia e é onde o Kanban ganha da tabela.

**Independent Test**: Arrastar um cartão de "contato" para "proposta", recarregar
a página e conferir que ele continua em proposta e que o histórico do lead
registra o autor e o horário da mudança.

**Acceptance Scenarios**:

1. **Given** um lead na coluna "contato", **When** o corretor arrasta o cartão
   para "proposta" e solta, **Then** o cartão passa a pertencer à coluna
   "proposta", as contagens das duas colunas se ajustam, e a mudança persiste
   após recarregar.
2. **Given** a mudança foi confirmada, **When** o corretor abre o detalhe do
   lead, **Then** o histórico traz um evento com etapa de origem, etapa de
   destino, autor e data/hora.
3. **Given** o cartão está com o foco do teclado, **When** o corretor usa as
   teclas para pegar, mover e soltar, **Then** consegue mudar de coluna sem
   mouse, com o resultado anunciado por leitor de tela.
4. **Given** o corretor solta o cartão fora de qualquer coluna ou na mesma
   coluna de origem, **When** o gesto termina, **Then** nada muda e nenhum
   evento de histórico é criado.
5. **Given** a gravação da mudança falha, **When** o erro retorna, **Then** o
   cartão volta visivelmente para a coluna de origem e o corretor recebe uma
   mensagem dizendo que a mudança não foi salva.

---

### User Story 3 - Focar o quadro na vertical e na busca (Priority: P2)

Os filtros que a tela já tem — vertical, busca por nome ou telefone — continuam
valendo e passam a recortar o quadro inteiro: as colunas mostram só os leads
que passam no filtro, e as contagens refletem o recorte.

**Why this priority**: São 8 verticais no mesmo funil. Sem recorte, a coluna
"novo" vira um amontoado de negócios que não têm relação entre si. Mas o quadro
já entrega valor sem isso, então vem depois.

**Independent Test**: Filtrar por uma vertical e conferir que só leads daquela
vertical aparecem, em todas as colunas, com as contagens atualizadas.

**Acceptance Scenarios**:

1. **Given** leads de várias verticais, **When** o corretor filtra por uma
   vertical, **Then** todas as colunas mostram apenas leads dela e as contagens
   correspondem ao recorte.
2. **Given** um filtro aplicado, **When** o corretor compartilha ou recarrega o
   endereço da página, **Then** o mesmo recorte é reproduzido.
3. **Given** uma busca que não encontra nada, **When** o quadro é exibido,
   **Then** todas as colunas aparecem vazias com uma mensagem explicando que o
   filtro não retornou leads, e o corretor consegue limpar o filtro em um clique.

---

### Edge Cases

- **Muitos cartões numa coluna**: cada coluna rola de forma independente sem
  esticar a página inteira; o cabeçalho da coluna (nome da etapa e contagem)
  continua visível durante a rolagem.
- **Volume acima do teto de leitura**: quando o número de leads que passa no
  filtro excede o teto de exibição, o quadro deixa isso explícito em vez de
  omitir leads em silêncio.
- **Duas pessoas movendo o mesmo lead**: a última mudança gravada vence; ao
  recarregar, as duas veem o mesmo estado, e o histórico preserva as duas
  movimentações na ordem em que ocorreram.
- **Sem banco configurado**: o aviso de "sem persistência" que a tela já exibe
  continua aparecendo e o quadro aparece vazio, sem quebrar.
- **Sessão expirada durante o arraste**: a mudança não é gravada, o cartão
  volta para a origem e o corretor é levado à tela de entrada.
- **Tela estreita (celular)**: o quadro continua utilizável — nenhuma coluna
  fica inalcançável e é possível mudar a etapa de um lead sem depender de
  arrastar entre colunas fora da tela.
- **Usuário com movimento reduzido**: as animações de arraste respeitam a
  preferência do sistema por menos movimento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de Leads MUST apresentar os leads em um quadro de colunas,
  uma coluna por etapa do funil, na ordem novo → contato → proposta → ganho →
  perdido.
- **FR-002**: O sistema MUST exibir cada lead como um cartão único, na coluna
  correspondente à sua etapa atual.
- **FR-003**: Cada cartão MUST mostrar nome do lead, vertical, contexto de
  origem (quando houver) e há quantos dias o lead está na etapa atual.
- **FR-004**: Cada cartão MUST oferecer acesso direto à página de detalhe do
  lead e ao contato por WhatsApp quando houver telefone.
- **FR-005**: Cada coluna MUST exibir o nome da etapa e a quantidade de leads
  que contém no recorte atual.
- **FR-006**: Colunas sem leads MUST continuar visíveis, com estado vazio
  explícito.
- **FR-007**: Usuários MUST conseguir mover um lead entre etapas arrastando e
  soltando o cartão.
- **FR-008**: Usuários MUST conseguir realizar a mesma mudança de etapa apenas
  pelo teclado e em dispositivos de toque.
- **FR-009**: O sistema MUST registrar cada mudança de etapa no histórico do
  lead com etapa de origem, etapa de destino, autor e data/hora.
- **FR-010**: O sistema MUST rejeitar mudanças para etapas fora do conjunto
  definido do funil, independentemente do que o cliente enviar.
- **FR-011**: O sistema MUST exigir usuário autenticado para qualquer mudança de
  etapa.
- **FR-012**: O sistema MUST refletir a mudança no quadro imediatamente após o
  gesto e MUST desfazer visivelmente a mudança, com aviso ao usuário, se a
  gravação falhar.
- **FR-013**: O sistema MUST destacar leads parados além do limiar da sua etapa
  (1 dia em novo, 5 em contato, 7 em proposta), com o destaque perceptível sem
  depender exclusivamente de cor.
- **FR-014**: Os filtros de vertical e de busca por nome/telefone MUST recortar
  o quadro inteiro, incluindo as contagens das colunas.
- **FR-015**: O recorte atual do quadro MUST ser reproduzível pelo endereço da
  página (compartilhável e resistente a recarregar).
- **FR-016**: Dentro de cada coluna, os cartões MUST seguir uma ordem estável e
  previsível, com os leads parados há mais tempo aparecendo primeiro.
- **FR-017**: O sistema MUST manter o aviso de ausência de persistência quando o
  banco não estiver configurado, sem quebrar o quadro.
- **FR-018**: [NEEDS CLARIFICATION: o quadro substitui a lista em tabela na tela
  de Leads, ou as duas visões coexistem com um alternador de visão?]
- **FR-019**: [NEEDS CLARIFICATION: reordenar cartões manualmente dentro de uma
  coluna (priorização própria do corretor, com a ordem salva) entra no escopo,
  ou a ordem é sempre automática por tempo parado?]

### Key Entities

- **Lead**: um contato captado por um formulário do site. Atributos relevantes
  para o quadro: nome, vertical (uma das 8), etapa atual (uma das 5), telefone,
  contexto de origem, valor e o momento em que entrou na etapa atual.
- **Etapa do funil**: uma das cinco posições fixas do funil — vira uma coluna.
- **Vertical (pipeline)**: a linha de negócio do lead — recorta o quadro.
- **Evento de movimentação**: o registro histórico de uma mudança de etapa, com
  origem, destino, nota opcional, autor e momento.
- **Usuário do painel**: quem move os cartões; é o autor gravado no evento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O corretor identifica quantos leads existem em cada etapa em até
  5 segundos após a tela carregar, sem clicar em nada.
- **SC-002**: Mover um lead de etapa leva no máximo 2 ações do usuário (hoje
  são 3: escolher etapa, opcionalmente escrever nota, clicar em mover).
- **SC-003**: O resultado da movimentação aparece para o usuário em menos de
  1 segundo após soltar o cartão.
- **SC-004**: 100% das movimentações possíveis com mouse também são possíveis
  só com teclado, e todas ficam registradas no histórico com autor.
- **SC-005**: Nenhum lead some: para qualquer recorte de filtro, a soma das
  contagens das colunas é igual ao número de leads que atendem ao filtro.
- **SC-006**: 90% dos corretores conseguem mover um lead corretamente na
  primeira tentativa, sem instrução prévia.
- **SC-007**: Leads parados além do limiar são notados: o tempo médio de leads
  em "novo" e "contato" cai em relação à média das 4 semanas anteriores ao
  lançamento.

## Assumptions

- O quadro atende ao mesmo público e às mesmas permissões da tela de Leads
  atual: qualquer usuário autenticado do painel vê e move qualquer lead. Não há
  atribuição de dono por lead nesta feature.
- As 5 etapas e as 8 verticais permanecem como estão; o quadro não cria, renomeia
  nem reordena etapas, e configurar etapas não faz parte desta feature.
- Ao arrastar, o corretor não é interrompido para escrever uma nota — a nota
  continua opcional e permanece disponível na página de detalhe do lead. Prender
  uma caixa de texto ao gesto anularia o ganho de velocidade.
- O limite de leitura de leads da tela atual (500 por recorte) continua valendo;
  o quadro não introduz paginação, apenas avisa quando o recorte ultrapassa o
  limite.
- O filtro por etapa que existe hoje na tela perde a função no quadro (cada
  etapa já é uma coluna) e pode sair da barra de filtros.
- O quadro é a mesma feature em celular e desktop; nenhuma tela separada é
  criada para mobile.
- A feature usa a autenticação, o banco e o registro de histórico que já existem
  no painel — nada de novo precisa ser provisionado.
