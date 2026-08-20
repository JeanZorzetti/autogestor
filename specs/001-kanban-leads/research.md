# Phase 0 — Research: Kanban de Leads

**Feature**: `001-kanban-leads` | **Data**: 2026-08-20

Cada item abaixo era um `NEEDS CLARIFICATION` do Technical Context de
[plan.md](./plan.md). Todos resolvidos.

---

## R1 — Como arrastar com teclado e toque sem escrever um motor de DnD

**Decision**: `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0`, com
`PointerSensor`, `TouchSensor` e `KeyboardSensor` habilitados e o objeto
`accessibility.announcements` traduzido para português.

**Rationale**:

- FR-008 e FR-021 exigem que **toda** movimentação possível com mouse também
  seja possível só com teclado e em toque, e o cenário 3 da US2 exige anúncio
  por leitor de tela. Isso é o que a `accessibility` do harness chama de básico
  não-negociável — não dá para simplificar fora.
- HTML5 Drag and Drop nativo (subir um rung da escada) **não atende**: não
  dispara em toque em nenhum navegador móvel e não tem modo de teclado. Seria
  preciso escrever sensores de ponteiro, um modo de teclado com `aria-live`,
  auto-scroll de coluna e colisão — algumas centenas de linhas de código de
  acessibilidade sutil, que é exatamente o tipo de código que quebra em
  silêncio.
- `@dnd-kit` já entrega `KeyboardSensor` (espaço para pegar/soltar, setas para
  mover), `TouchSensor` com delay de ativação (não conflita com o scroll da
  coluna), região `aria-live` com anúncios customizáveis e respeito a
  `prefers-reduced-motion` nas transições do `sortable`.
- Peer dep `react: >=16.8.0` — React 19.2 do projeto satisfaz sem `--force`.
- Custo: ~30 kB gzip no bundle de um painel autenticado (não o site público
  estático). Aceitável; nenhuma rota pública é afetada.

**Alternatives considered**:

| Alternativa | Rejeitada porque |
|---|---|
| HTML5 DnD nativo | Sem toque, sem teclado. Reprova FR-008/FR-021 direto. |
| `@dnd-kit/react@0.5.0` | Pré-1.0, API ainda em movimento. O `@dnd-kit/core` estável já aceita React 19 pelo peer range. |
| `@atlaskit/pragmatic-drag-and-drop` | Excelente motor, mas o modo teclado e a camada de acessibilidade vêm em pacotes extras (`…/element`, `…-a11y`) e exigem montar a orquestração à mão. Mais peças para o mesmo resultado. |
| Só teclado/menu, sem arraste | Reprova FR-007 e a razão de existir da feature (SC-002). |

**Riscos e mitigação**: `@dnd-kit` está em manutenção lenta. Mitigação: o
arraste é isolado num único componente cliente (`app/leads/quadro.tsx`); a
lógica de posição vive em `lib/quadro.mjs` sem importar a lib. Trocar de motor
não toca banco, server actions nem testes.

---

## R2 — Como persistir a ordem dentro da coluna

**Decision**: uma coluna nova `crm_leads.posicao double precision NOT NULL
DEFAULT extract(epoch from now())`. Ordenação do quadro é
`ORDER BY posicao ASC, id ASC`. Ao soltar um cartão, grava-se **só a linha
movida**, com o ponto médio entre os `posicao` dos dois vizinhos no destino
(`(a+b)/2`; na ponta, `a-1000` ou `b+1000`).

**Rationale**:

- O edge case "duas pessoas reordenando a mesma coluna" exige que **nenhum
  outro cartão troque de lugar por consequência**. Isso elimina qualquer
  esquema que renumere a coluna inteira a partir da visão (possivelmente
  obsoleta) do cliente — a última gravação sobrescreveria a movimentação que o
  colega acabou de fazer em outro cartão. Ponto médio grava 1 linha e satisfaz
  "a última ordenação vence para o cartão movido" literalmente.
- `NOT NULL DEFAULT extract(epoch from now())` mata o caso nulo: o ponto médio
  é sempre calculável, sem backfill preguiçoso e sem `NULLS LAST` no `ORDER BY`.
- Atende FR-016 e o edge case do lead novo: um lead recém-gravado pelo site
  recebe `posicao = now()`, que é maior que o de todos os outros, então **entra
  no fim da coluna "novo"** — posição previsível, sem embaralhar a fila que os
  corretores montaram. Entre leads que ninguém priorizou, `posicao` é a ordem de
  `criado`, ou seja, os mais antigos (parados há mais tempo) primeiro.
- Atende FR-020: mover entre colunas usa exatamente o mesmo cálculo, com os
  vizinhos da coluna de destino. Nada de "vai para o topo/fundo fixo".
- O site (`src/lib/db.ts` na raiz) **não precisa mudar**: o `INSERT` dele não
  cita `posicao`, então o `DEFAULT` cobre. A coluna entra pelo `ensure()` do
  admin com `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, o mesmo padrão já usado
  para `crm_eventos.autor` em [admin/lib/db.ts](../../admin/lib/db.ts).

**Alternatives considered**:

| Alternativa | Rejeitada porque |
|---|---|
| `posicao INTEGER` renumerando a coluna | Viola o edge case de concorrência (clobber) e escreve N linhas por gesto. |
| Fractional indexing em string (LexoRank) | Resolve exaustão de precisão que este volume nunca atinge; custa um parser e um gerador de chave. YAGNI. |
| Tabela separada `crm_ordem(lead_id, posicao)` | Um JOIN e uma linha órfã a cada delete, para guardar um número por lead. |
| Ordenar só por `desde` (sem priorização manual) | Reprova FR-019 e a US4 inteira. |

**Teto conhecido**: `double precision` esgota a precisão após ~50 inserções
consecutivas exatamente no mesmo intervalo. Marcar com comentário `ponytail:` e
a saída: um `UPDATE` de renumeração da coluna, rodado sob demanda. Não é código
que precisa existir agora.

---

## R3 — Reordenar não pode poluir o histórico

**Decision**: duas server actions distintas. `mover` (já existe) grava evento em
`crm_eventos`; `reposicionar` (nova) faz só o `UPDATE` de `posicao`. Quando o
gesto cruza colunas, a action de mover recebe também a posição de destino e faz
`UPDATE etapa + posicao` mais o `INSERT` do evento, numa transação.

**Rationale**: FR-022 e SC-009 pedem que o número de eventos continue igual ao
número de mudanças reais de etapa. `moverLead()` em `lib/db.ts` já retorna cedo
quando `de === etapa` — esse guarda já cobre o cenário 4 da US2 ("soltar na
mesma coluna não cria evento"), mas precisa passar a gravar `posicao` mesmo
quando a etapa não muda. Separar as duas actions é a fronteira mais barata: a
que grava histórico e a que não grava.

**Alternatives considered**: uma action única com flag `registrarEvento` — a
flag vira uma decisão de auditoria controlada pelo cliente, e cliente é entrada
de usuário. Rejeitada.

---

## R4 — Feedback imediato e rollback quando a gravação falha

**Decision**: `useOptimistic` do React 19 no componente do quadro. O estado
otimista aplica o movimento no ato; a server action retorna
`{ ok: false, erro }` em falha e o `useOptimistic` reverte sozinho quando a
transição termina, com a mensagem indo para a mesma região `aria-live` dos
anúncios do dnd-kit.

**Rationale**: FR-012 e SC-003 (< 1s) pedem exatamente isso, e é feature nativa
da versão do React que o projeto já usa — rung 4 da escada. Nenhuma biblioteca
de estado entra.

**Alternatives considered**: `revalidatePath` sem otimismo — o cartão só se
move depois do round-trip ao Postgres, reprovando SC-003 na percepção. Store
cliente (Zustand etc.) — dependência nova para o que `useOptimistic` faz.

---

## R5 — Sessão expirada no meio do arraste

**Decision**: a server action retorna `{ ok: false, erro: "sessao" }` quando
`usuarioAtual()` é `null`; o cliente reverte o cartão e navega para `/entrar`.

**Rationale**: o `proxy.ts` só protege navegações, não a invocação da server
action já carregada na página. As actions atuais retornam cedo em silêncio
(`if (!usuario) return`) — para o quadro isso viraria "o cartão voltou e
ninguém explicou por quê". FR-011 continua satisfeito (nada grava sem usuário);
o que muda é o cliente passar a saber o motivo.

---

## R6 — Aviso quando o recorte passa de 500 leads

**Decision**: `listarLeads` passa a usar `LIMIT 501`; o quadro corta em 500 e,
se veio a 501ª linha, exibe um aviso de "mostrando os 500 primeiros — refine o
filtro".

**Rationale**: o edge case "volume acima do teto de leitura" exige que o corte
seja explícito em vez de omitir leads em silêncio. Buscar uma linha a mais é o
jeito mais barato de saber que há mais, sem um `COUNT(*)` adicional. Mantém a
premissa do spec de não introduzir paginação.

---

## R7 — Onde a lógica testável mora

**Decision**: `admin/lib/quadro.mjs` (ESM puro, sem JSX, sem `pg`, sem React)
com `posicaoEntre(anterior, proximo)` e `agruparPorEtapa(leads)`. Teste em
`admin/test/quadro.test.mjs`, adicionado ao script `npm test`.

**Rationale**: é o padrão já estabelecido do repo — `pipelines.mjs`,
`senha.mjs` e `sessao.mjs` são `.mjs` de propósito para que `node --test` os
importe sem transpilar (documentado no CLAUDE.md da raiz). O cálculo de ponto
médio e o agrupamento são a única lógica não-trivial da feature: são as duas
coisas que quebram em silêncio se erradas (cartão duplicado, cartão sumido,
ordem invertida) e são exatamente o que SC-005 e SC-008 medem.
