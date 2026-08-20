---
description: "Task list for 001-kanban-leads"
---

# Tasks: Kanban de Leads

**Input**: Design documents from `specs/001-kanban-leads/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/server-actions.md](./contracts/server-actions.md), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — não por opção, por governança. A constituição v1.0.0
("Fluxo de Desenvolvimento e Portões de Qualidade") exige que toda lógica pura
não-trivial viva em `.mjs` testável por `node --test` e deixe ao menos uma
checagem executável. Isso cobre `lib/quadro.mjs` (T004/T005). **Não** há
framework de teste de componente React no repo e nenhum é introduzido — a
verificação de UI é a `ui-verification` com evidência (T046), que a mesma
constituição torna portão de conclusão.

**Organization**: Agrupadas por história de usuário. US1 é o MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: US1 · US2 · US3 · US4
- Todo caminho de arquivo é relativo à raiz do repositório

## Path Conventions

Web app, dois projetos independentes. Esta feature vive **inteiramente** em
`admin/` (Next.js App Router). O site Astro em `src/` **não é tocado** — a
coluna nova tem `DEFAULT`, então o `INSERT` dele continua válido
(constituição, "Restrições de Stack e Dados": mudança de schema
retrocompatível com a app não alterada).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependências e registro do novo alvo de teste.

- [ ] T001 Instalar `@dnd-kit/core@^6.3.1` e `@dnd-kit/sortable@^10.0.0` como dependências em `admin/package.json` (rodar `npm install` de dentro de `admin/`; confirmar que o peer dep aceita React 19.2 sem `--force`)
- [ ] T002 Registrar `test/quadro.test.mjs` no script `test` de `admin/package.json` (`node --test test/pipelines.test.mjs test/auth.test.mjs test/quadro.test.mjs`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema, lógica pura e leitura ordenada. Tudo abaixo bloqueia todas as histórias.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase fechar.

- [ ] T003 Adicionar a coluna de posição ao bloco `ensure()` em `admin/lib/db.ts`: `ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS posicao DOUBLE PRECISION NOT NULL DEFAULT extract(epoch from now())`, ao lado do `ALTER TABLE crm_eventos ADD COLUMN IF NOT EXISTS autor TEXT` que já está lá
- [ ] T004 [P] Escrever `admin/test/quadro.test.mjs` **antes** da implementação e confirmar que falha: `posicaoEntre()` nos 4 casos (meio, topo, fundo, coluna vazia) e `agruparPorEtapa()` (sempre 5 chaves, nenhum lead duplicado, nenhum sumido, ordem preservada)
- [ ] T005 Criar `admin/lib/quadro.mjs` com `posicaoEntre(anterior, proximo)` e `agruparPorEtapa(leads)` — ESM puro, sem JSX, sem React, sem `pg`; rodar `npm test` em `admin/` e ver T004 passar
- [ ] T006 Adicionar o backfill idempotente das linhas existentes ao `ensure()` em `admin/lib/db.ts`, alinhando `posicao` com `extract(epoch from criado)` conforme [data-model.md](./data-model.md) (depende de T003)
- [ ] T007 Alterar `listarLeads()` em `admin/lib/db.ts` para `ORDER BY l.posicao ASC, l.id ASC` e `LIMIT 501`, e retornar o sinal de truncamento (a 501ª linha) para o chamador (depende de T003)
- [ ] T008 Adicionar o tipo de retorno `Resultado` e as guardas comuns (`dbOn()` → `"db"`, `usuarioAtual()` nulo → `"sessao"`, id/etapa inválidos → `"invalido"`, erro do Postgres → `"falhou"`) em `admin/app/leads/actions.ts`, conforme [contracts/server-actions.md](./contracts/server-actions.md)

**Checkpoint**: `npm test` passa em `admin/`; o banco tem `posicao`; a leitura já sai ordenada. As histórias podem começar.

---

## Phase 3: User Story 1 — Ver o funil inteiro de uma vez (Priority: P1) 🎯 MVP

**Goal**: `/leads` deixa de ser tabela e passa a ser um quadro de 5 colunas com um cartão por lead, contagem por coluna e destaque de parado. Sem arraste ainda.

**Independent Test**: com leads em várias etapas no banco, abrir `/leads` e conferir que cada lead aparece exatamente uma vez na coluna da sua etapa, e que a contagem do topo de cada coluna bate com o número de cartões (quickstart V1, V2, V10, V11).

### Implementation for User Story 1

- [ ] T009 [P] [US1] Criar `admin/app/leads/cartao.tsx` como componente estático: nome com `Link` para `/leads/{id}`, vertical via `nomeDoPipeline()`, contexto de `metadata.contexto`, dias parados ("hoje" / "há Nd"), e link de WhatsApp reusando a função `linkWhatsApp()` que hoje vive em `admin/app/leads/page.tsx`
- [ ] T010 [P] [US1] Adicionar ao cartão em `admin/app/leads/cartao.tsx` o destaque de parado além do limiar, lendo `LIMIAR_PARADO` de `admin/lib/pipelines.mjs` — com **ícone ou rótulo além da cor** (constituição, Princípio V: status nunca só por cor)
- [ ] T011 [P] [US1] Criar `admin/app/leads/quadro.tsx` renderizando as 5 colunas na ordem de `ETAPAS`, cada uma com nome da etapa, contagem, e estado vazio explícito quando não houver cartões (FR-006)
- [ ] T012 [P] [US1] Adicionar os estilos do quadro a `admin/app/globals.css`: `.quadro` (5 trilhas, rolagem horizontal), `.coluna` (rolagem vertical própria, cabeçalho `sticky`), `.cartao` — reusando os tokens que já existem (`--surface`, `--border`, `--grid`, `--muted`, `--crit-ink`)
- [ ] T013 [US1] Reescrever `admin/app/leads/page.tsx`: continua Server Component, lê `searchParams`, chama `listarLeads()`, passa por `agruparPorEtapa()` e renderiza `<Quadro>` no lugar da `<table>` — removendo `Linha` e a tabela inteira (FR-018) (depende de T009–T012)
- [ ] T014 [US1] Remover o campo `<select name="etapa">` da barra de filtros em `admin/app/leads/page.tsx` e remover `etapa` do tipo `FiltroLeads` em `admin/lib/db.ts`, de modo que `?etapa=` em endereços antigos seja **ignorado sem erro e sem redirect** (FR-018 + premissa do spec)
- [ ] T015 [US1] Exibir em `admin/app/leads/quadro.tsx` o aviso explícito de truncamento quando o recorte passar de 500 leads, usando o sinal de T007 (edge case "volume acima do teto de leitura")
- [ ] T016 [US1] Confirmar em `admin/app/leads/page.tsx` que o banner de "Leads sem persistência" continua sendo exibido e que o quadro renderiza as 5 colunas vazias sem quebrar quando `dbOn()` é falso (FR-017)

**Checkpoint**: quickstart V1, V2, V10 e V11 passam. O quadro já substitui a tabela e é útil sozinho — a etapa ainda muda pelo `<select>` que já existe no detalhe do lead.

---

## Phase 4: User Story 2 — Mover um lead de etapa arrastando (Priority: P1)

**Goal**: arrastar o cartão entre colunas muda a etapa na hora, grava histórico com autor, e desfaz visivelmente se a gravação falhar. Mouse, teclado e toque.

**Independent Test**: arrastar um cartão de "contato" para "proposta", recarregar e conferir que continua em proposta e que o histórico registra autor e horário (quickstart V3–V7).

**Depends on**: US1 (o quadro precisa existir para ter de onde e para onde arrastar). Esta dependência é real e está no spec — não é acoplamento acidental.

### Implementation for User Story 2

- [ ] T017 [US2] Tornar `moverLead()` transacional em `admin/lib/db.ts` (`BEGIN … COMMIT`): `UPDATE crm_leads SET etapa, posicao, atualizado` **e** `INSERT INTO crm_eventos` na mesma transação, para que um lead nunca fique com etapa nova e histórico sem o evento; quando a etapa não muda, gravar **só** `posicao` e **nenhum** evento (FR-022, US2 cenário 4)
- [ ] T018 [US2] Adicionar a `admin/lib/db.ts` a leitura dos `posicao` dos leads vizinhos (`antes`/`depois`) restrita à etapa de destino, ignorando ids que não estejam nela — o cliente pode estar com visão obsoleta ([contracts/server-actions.md](./contracts/server-actions.md))
- [ ] T019 [US2] Reescrever a server action `mover()` em `admin/app/leads/actions.ts` com a assinatura `MoverEntrada` do contrato, calculando `posicao` **no servidor** via `posicaoEntre()` a partir dos vizinhos lidos em T018 — o cliente nunca envia número de posição (constituição, Princípio IV) (depende de T017, T018)
- [ ] T020 [US2] Manter em `admin/app/leads/actions.ts` a assinatura antiga `mover(fd: FormData)` como fallback sem JS, delegando para a nova com `antes: null, depois: null` (o lead cai no fim da coluna de destino)
- [ ] T021 [US2] Envolver o quadro em `<DndContext>` em `admin/app/leads/quadro.tsx` com `PointerSensor`, `TouchSensor` (com delay de ativação, para não conflitar com a rolagem da coluna) e `KeyboardSensor` — marcar o arquivo `"use client"`; é a única ilha cliente da tela
- [ ] T022 [US2] Tornar o cartão arrastável em `admin/app/leads/cartao.tsx` com `useSortable` e cada coluna um alvo de soltura em `admin/app/leads/quadro.tsx` (depende de T021)
- [ ] T023 [US2] Aplicar `useOptimistic` em `admin/app/leads/quadro.tsx` para mover o cartão no ato do gesto, sem esperar o round-trip ao Postgres (SC-003: < 1 s) (depende de T021)
- [ ] T024 [US2] Tratar o retorno `{ ok: false }` em `admin/app/leads/quadro.tsx`: reverter visivelmente o cartão para a coluna de origem e exibir a mensagem correspondente ao `erro` (FR-012, US2 cenário 5) (depende de T023)
- [ ] T025 [US2] Tratar `erro: "sessao"` em `admin/app/leads/quadro.tsx` navegando para `/entrar` depois de reverter o cartão (edge case "sessão expirada durante o arraste") (depende de T024)
- [ ] T026 [US2] Traduzir os `accessibility.announcements` do `@dnd-kit` para português em `admin/app/leads/quadro.tsx` (pego / sobre / movido / cancelado / não salvo), com os textos exatos da tabela de acessibilidade em [contracts/server-actions.md](./contracts/server-actions.md) (depende de T021)
- [ ] T027 [US2] Escrever os textos de erro e de estado do quadro em `admin/app/leads/quadro.tsx` seguindo a skill `ux-writing` — o usuário precisa saber **o que não foi salvo** e o que fazer, não só que "algo deu errado"
- [ ] T028 [US2] Adicionar ao cartão em `admin/app/leads/cartao.tsx` o controle compacto de mudança de etapa (fallback que reusa a action `mover(FormData)` de T020), garantindo que em tela estreita seja possível mudar a etapa sem arrastar entre colunas fora da tela (FR-008, edge case de tela estreita)
- [ ] T029 [US2] Verificar em `admin/app/leads/actions.ts` que `revalidatePath("/leads")`, `revalidatePath("/")` e `revalidatePath("/leads/{id}")` continuam sendo chamados em sucesso, para que o Painel e o detalhe do lead não sirvam dado velho

**Checkpoint**: quickstart V3, V4, V5, V6 e V7 passam. Parar aqui já entrega um quadro utilizável — é o corte mínimo com valor se o escopo precisar encolher.

---

## Phase 5: User Story 3 — Focar o quadro na vertical e na busca (Priority: P2)

**Goal**: os filtros existentes recortam o quadro inteiro, incluindo as contagens, e o recorte é reproduzível pela URL.

**Independent Test**: filtrar por uma vertical e conferir que só leads dela aparecem em todas as colunas, com as contagens atualizadas (quickstart V9).

**Depends on**: US1. Boa parte já vem de graça — os filtros de `pipeline` e `q` já funcionam em `listarLeads()` e o `<form method="get">` já põe o recorte na URL. O trabalho real desta fase é o estado vazio e a confirmação das contagens.

### Implementation for User Story 3

- [ ] T030 [US3] Confirmar em `admin/app/leads/quadro.tsx` que a contagem do cabeçalho de cada coluna é derivada do array já filtrado, e não de um total global — para que a soma das 5 contagens seja sempre igual ao número de leads do recorte (FR-014, SC-005)
- [ ] T031 [US3] Implementar em `admin/app/leads/quadro.tsx` o estado vazio de busca sem resultado: as 5 colunas aparecem vazias, com uma mensagem explicando que o filtro não retornou leads (US3 cenário 3)
- [ ] T032 [US3] Adicionar um link de "limpar filtro" em um clique (para `/leads`, sem query) em `admin/app/leads/page.tsx`, visível quando houver qualquer filtro aplicado (US3 cenário 3)
- [ ] T033 [US3] Tratar `pipeline` inválido em `admin/app/leads/page.tsx` como ausente (validando com `pipelineValido()`), sem erro e sem redirect (constituição, Princípio IV: validar contra a lista fixa, nunca contra o payload)

**Checkpoint**: quickstart V9 passa. US1, US2 e US3 funcionam.

---

## Phase 6: User Story 4 — Priorizar a fila dentro de uma etapa (Priority: P3)

**Goal**: arrastar cartões para cima e para baixo dentro da mesma coluna monta a ordem de trabalho, compartilhada por todo o painel, sem poluir o histórico.

**Independent Test**: reordenar três cartões numa coluna, recarregar e conferir que a ordem se manteve; abrir em outra sessão e ver a mesma ordem (quickstart V8).

**Depends on**: US2 (reusa o `DndContext` e os sensores já montados).

### Implementation for User Story 4

- [ ] T034 [US4] Criar `reposicionarLead(id, posicao)` em `admin/lib/db.ts`: um único `UPDATE crm_leads SET posicao, atualizado WHERE id`. **Nenhuma outra linha da coluna é escrita** — é o que garante o edge case "nenhum outro cartão troca de lugar por consequência"
- [ ] T035 [US4] Criar a server action `reposicionar()` em `admin/app/leads/actions.ts` com a assinatura `ReposicionarEntrada` do contrato, reusando as guardas de T008 e o cálculo de vizinhos de T018 restrito à etapa **atual** do lead; nunca toca `etapa`, nunca grava evento (FR-022) (depende de T034)
- [ ] T036 [US4] Envolver cada coluna em `<SortableContext>` com estratégia vertical em `admin/app/leads/quadro.tsx`, para que o arraste dentro da coluna reordene em vez de só mudar de coluna (depende de T021)
- [ ] T037 [US4] Rotear o fim do gesto em `admin/app/leads/quadro.tsx`: mesma coluna → `reposicionar()`; coluna diferente → `mover()`; fora de qualquer coluna → nada (US2 cenário 4) (depende de T035, T036)
- [ ] T038 [US4] Estender os anúncios de acessibilidade em `admin/app/leads/quadro.tsx` para incluir a nova **posição dentro da coluna** ("posição i de n"), de modo que reordenar por teclado seja anunciado (FR-021, US4 cenário 5)
- [ ] T039 [US4] Verificar manualmente o invariante de SC-009: anotar `SELECT count(*) FROM crm_eventos`, reordenar N vezes dentro da coluna, e confirmar que a contagem **não mudou** (quickstart V8 passos 1 e 5)

**Checkpoint**: quickstart V8 passa. As quatro histórias funcionam.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: o que a constituição torna portão de conclusão, e a documentação que ela exige.

- [ ] T040 [P] Ajustar `admin/app/globals.css` para tela estreita (360px): nenhuma coluna inalcançável, rolagem horizontal do quadro sem estourar a página, área de toque de todo controle do cartão ≥ 44×44 px (edge case de tela estreita; skill `responsive-design`)
- [ ] T041 [P] Adicionar guarda `@media (prefers-reduced-motion: reduce)` em `admin/app/globals.css` desligando as transições de arraste, mantendo o arraste funcional (edge case "usuário com movimento reduzido"; constituição, Princípio V)
- [ ] T042 [P] Conferir contraste WCAG AA de todo texto e borda novos do quadro em `admin/app/globals.css`, em especial o destaque de parado sobre `--surface` (constituição, Princípio V)
- [ ] T043 Rodar `npm test` na raiz **e** em `admin/`, e ver a saída dos dois passar (constituição: "Portão de conclusão" — afirmação de sucesso sem evidência é violação)
- [ ] T044 Executar os cenários V1–V12 de [quickstart.md](./quickstart.md) contra `http://localhost:3000/leads` com o Postgres local, e registrar o que falhou
- [ ] T045 Rodar a skill `ui-verification` contra `/leads`: árvore de acessibilidade, passagem completa de teclado, três larguras (360 / 768 / 1440), console limpo e LCP, com screenshot antes/depois (quickstart V13; constituição, Princípio V)
- [ ] T046 [P] Registrar em `README.md` da raiz, na seção "Decisões que não são óbvias no código", as duas decisões desta feature: por que `@dnd-kit` em vez de DnD nativo, e por que a ordem é ponto médio em vez de renumeração (constituição: "Decisão não óbvia vira documentação")
- [ ] T047 [P] Atualizar a seção "admin/ — painel Next.js separado" em `CLAUDE.md` da raiz para dizer que `/leads` é um quadro Kanban, não uma tabela
- [ ] T048 [P] Adicionar os comentários `ponytail:` exigidos pela constituição (Princípio III) com **teto e caminho de saída**: precisão do `double precision` em `admin/lib/quadro.mjs` (saída: renumerar a coluna com `row_number() * 1000`) e o teto de 500 leads em `admin/lib/db.ts`
- [ ] T049 [P] Atualizar a seção "Constitution Check" de [plan.md](./plan.md), que hoje diz "constituição no estado de template, sem gates" — a constituição v1.0.0 foi ratificada em 2026-08-20 e passa a ter cinco princípios avaliáveis (o veredito da avaliação informal já feita não muda)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup — **bloqueia todas as histórias**
- **US1 (Phase 3)**: depende da Foundational
- **US2 (Phase 4)**: depende de **US1** — precisa do quadro para arrastar
- **US3 (Phase 5)**: depende de **US1** — independente de US2, pode rodar em paralelo com ela
- **US4 (Phase 6)**: depende de **US2** — reusa `DndContext` e sensores
- **Polish (Phase 7)**: depende das histórias desejadas estarem completas

### User Story Dependencies

```
Setup → Foundational → US1 ─┬─→ US2 ──→ US4
                            └─→ US3
```

Ao contrário do caso ideal do template, **as histórias aqui não são todas
independentes** — e isso está no próprio spec: a US4 diz "depende do quadro e do
arraste já existirem". A dependência é real, não acoplamento acidental. O que
cada história mantém é a **testabilidade independente**: cada uma tem um
cenário do quickstart que a valida sozinha.

### Within Each User Story

- Teste antes da implementação onde há teste (T004 antes de T005)
- Camada de banco (`lib/db.ts`) antes da server action (`actions.ts`) antes da UI
- Componentes folha (`cartao.tsx`) antes do container (`quadro.tsx`) antes da página (`page.tsx`)

### Parallel Opportunities

- **Phase 2**: T004 roda em paralelo com T003 (arquivos diferentes)
- **Phase 3**: T009, T010, T011 e T012 são quatro arquivos distintos — todos em paralelo, antes de T013
- **Phase 4**: T017/T018 (banco) em paralelo com T021 (montagem do `DndContext`), convergindo em T019 e T022
- **Phase 5**: US3 inteira roda em paralelo com US2, se houver duas pessoas
- **Phase 7**: T040, T041, T042, T046, T047, T048 e T049 são todos independentes

**Conflito a evitar**: `admin/app/leads/quadro.tsx` é tocado por 11 tarefas ao
longo de 4 fases e `admin/app/leads/actions.ts` por 5. Nenhuma delas leva `[P]`
entre si. Se duas pessoas trabalharem em paralelo, a divisão limpa é
**US3 (page.tsx + filtros) contra US2 (quadro.tsx + actions.ts)**.

---

## Parallel Example: User Story 1

```bash
# Os quatro arquivos da US1 são distintos — lançar juntos:
Task: "Criar admin/app/leads/cartao.tsx como componente estático"        # T009
Task: "Adicionar destaque de parado com ícone/rótulo em cartao.tsx"      # T010
Task: "Criar admin/app/leads/quadro.tsx com as 5 colunas"                # T011
Task: "Adicionar estilos .quadro/.coluna/.cartao a admin/app/globals.css" # T012

# Depois, sequencial (depende dos quatro):
Task: "Reescrever admin/app/leads/page.tsx trocando a tabela pelo quadro" # T013
```

> T009 e T010 tocam o mesmo arquivo. São `[P]` entre si **apenas** se forem
> feitas pela mesma pessoa numa passada; com duas pessoas, T010 vem depois de
> T009.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup
2. Phase 2: Foundational (crítico — bloqueia tudo)
3. Phase 3: US1
4. **PARAR E VALIDAR**: quickstart V1, V2, V10, V11
5. Já dá para demonstrar: o funil aparece inteiro, a tabela morreu

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. US1 → V1/V2/V10/V11 → **MVP**
3. US2 → V3–V7 → **corte mínimo com valor real** (o quadro ganha da tabela aqui)
4. US3 → V9
5. US4 → V8
6. Polish → V12, V13, `npm test` nos dois projetos

Se o escopo precisar encolher, o corte é **depois da US2**. US3 é conforto e
US4 é otimização de fila; nenhuma das duas é o que faz o Kanban valer a pena.

### Parallel Team Strategy

Com duas pessoas, depois da Foundational e da US1:

- Pessoa A: US2 (`quadro.tsx`, `cartao.tsx`, `actions.ts`, `db.ts`) → depois US4
- Pessoa B: US3 (`page.tsx`, filtros) → depois Phase 7 (CSS responsivo, docs)

Com uma pessoa: ordem de prioridade, US1 → US2 → US3 → US4.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente
- Commit após cada tarefa ou grupo lógico; mensagem de commit em inglês, código e comentários em português (constituição, "Restrições de Stack e Dados")
- O site Astro em `src/` não é tocado em nenhuma tarefa — se uma tarefa quiser mexer lá, algo saiu do plano
- Parar em qualquer checkpoint é válido; cada um deixa a tela funcionando
- T043, T044 e T045 não são formalidade: a constituição transforma "rodei e vi a saída" em condição para declarar a feature pronta
