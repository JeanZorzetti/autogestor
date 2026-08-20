# Phase 1 — Data Model: Kanban de Leads

**Feature**: `001-kanban-leads` | **Data**: 2026-08-20

O quadro reusa o schema que já existe (`crm_leads`, `crm_eventos`,
`admin_usuarios`, criados por `ensure()` em
[admin/lib/db.ts](../../admin/lib/db.ts)). **A única mudança de schema é uma
coluna.**

---

## Mudança de schema

```sql
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS posicao DOUBLE PRECISION NOT NULL
  DEFAULT extract(epoch from now());
```

Entra no bloco `ensure()` do admin, ao lado do
`ALTER TABLE crm_eventos ADD COLUMN IF NOT EXISTS autor TEXT` que já está lá —
idempotente, roda a cada cold start, não quebra se a coluna já existir.

**Backfill das linhas existentes** (uma vez, no mesmo `ensure()`, idempotente
porque só toca linhas que ainda estão no default de criação em massa):

```sql
UPDATE crm_leads SET posicao = extract(epoch from criado) WHERE posicao IS NOT NULL AND posicao > extract(epoch from criado) + 1;
```

> Alternativa mais simples e igualmente válida: rodar o `ALTER TABLE` com
> `DEFAULT extract(epoch from criado)` não é possível (default não vê a linha),
> daí o `UPDATE` separado. Ver [research.md](./research.md) §R2.

**Índice**: não. O `ORDER BY posicao, id` roda sobre no máximo 500 linhas já
filtradas; `crm_leads_pipeline_idx` continua servindo o filtro. Adicionar
quando o `EXPLAIN` mostrar sort custando algo.

---

## Entidades

### Lead (`crm_leads`) — alterada

| Campo | Tipo | Origem | Papel no quadro |
|---|---|---|---|
| `id` | BIGSERIAL PK | existente | chave do cartão |
| `pipeline` | TEXT NOT NULL | existente | recorta o quadro (FR-014); validado contra `PIPELINES` |
| `etapa` | TEXT NOT NULL | existente | **define a coluna** (FR-002); validado contra `ETAPAS` |
| `nome` | TEXT NOT NULL | existente | título do cartão (FR-003) |
| `telefone` | TEXT | existente | link WhatsApp do cartão (FR-004) |
| `metadata.contexto` | JSONB | existente | contexto de origem no cartão (FR-003) |
| `valor` | NUMERIC(12,2) | existente | não exibido no cartão nesta feature |
| `criado` / `atualizado` | TIMESTAMPTZ | existente | — |
| **`posicao`** | **DOUBLE PRECISION NOT NULL** | **nova** | **ordem dentro da coluna (FR-016, FR-019, FR-020)** |
| `desde` | derivado (não é coluna) | existente | dias parado (FR-003, FR-013) |

`desde` continua sendo a expressão `DESDE_EXPR` já em `db.ts`: o `max(quando)`
dos eventos que chegaram na etapa atual, com fallback em `criado`.

**Regras de validação**

- `etapa` só aceita valores de `ETAPAS` (`etapaValida()`), validado **no
  servidor**, nunca contra o que o cliente mandou — FR-010. O padrão já existe
  em [admin/app/leads/actions.ts](../../admin/app/leads/actions.ts).
- `pipeline` só aceita slugs de `PIPELINES` (`pipelineValido()`).
- `posicao` é finito (`Number.isFinite`); valor não-finito vindo do cálculo
  aborta a gravação em vez de gravar `NaN`.
- Toda escrita exige `usuarioAtual()` não-nulo — FR-011.

**Ordenação canônica do quadro**

```sql
ORDER BY l.posicao ASC, l.id ASC
```

O desempate por `id` garante SC-008 (dois usuários veem a mesma sequência)
mesmo se duas linhas empatarem em `posicao`.

**Transições de estado** (a etapa é a máquina de estados)

```
novo → contato → proposta → ganho
  └──────┴──────────┴────────→ perdido
```

O spec **não restringe** transições: qualquer etapa pode ir para qualquer
outra (o corretor pode voltar de proposta para contato). A única regra é
pertencer a `ETAPAS`. Não introduzir grafo de transições permitidas — nada no
spec pede isso.

Toda transição de etapa grava um `Evento`. Mudança **só** de `posicao` não
grava — FR-022.

---

### Evento de movimentação (`crm_eventos`) — inalterada

| Campo | Tipo | Papel |
|---|---|---|
| `id` | BIGSERIAL PK | — |
| `lead_id` | BIGINT FK → `crm_leads` ON DELETE CASCADE | dono do evento |
| `de` | TEXT | etapa de origem (FR-009) |
| `para` | TEXT NOT NULL | etapa de destino (FR-009) |
| `nota` | TEXT | opcional; o arraste **sempre** manda `null` (premissa do spec) |
| `autor` | TEXT | nome do usuário do painel (FR-009) |
| `quando` | TIMESTAMPTZ NOT NULL DEFAULT now() | FR-009 |

Nenhuma alteração. O arraste grava o mesmo formato de evento que o `<select>`
grava hoje, com `nota = null`.

**Invariante (SC-009)**: `count(crm_eventos)` cresce exatamente 1 por mudança
real de etapa. Reordenar dentro da coluna: 0.

---

### Etapa do funil — constante, não tabela

`ETAPAS = ["novo", "contato", "proposta", "ganho", "perdido"]` em
[admin/lib/pipelines.mjs](../../admin/lib/pipelines.mjs). A ordem do array **é**
a ordem das colunas (FR-001). `LIMIAR_PARADO = { novo: 1, contato: 5,
proposta: 7 }` no mesmo arquivo já é a fonte do destaque de "parado" (FR-013) —
etapas ausentes do objeto (`ganho`, `perdido`) nunca destacam.

Premissa do spec: o quadro não cria, renomeia nem reordena etapas.

---

### Vertical / pipeline — constante, não tabela

`PIPELINES` (8 slugs) no mesmo arquivo. Recorta o quadro; não muda.

---

### Usuário do painel (`admin_usuarios`) — inalterada

Lido por `usuarioAtual()`. `nome` é o que vai para `crm_eventos.autor`.

---

### Posição de prioridade — é a coluna `posicao`, não uma entidade

Compartilhada por todo o painel (premissa do spec: não existe ordem privada por
usuário), por isso mora na linha do lead e não numa tabela por usuário.
Sobrevive a recarregar (está no banco) e a mudanças de etapa (é reescrita com o
ponto de soltura, FR-020).

---

## Cálculo de posição (`lib/quadro.mjs`)

```
posicaoEntre(anterior, proximo)
  ambos definidos      → (anterior + proximo) / 2
  só proximo (topo)    → proximo - 1000
  só anterior (fundo)  → anterior + 1000
  coluna vazia         → extract(epoch from now()) em segundos
```

`anterior` e `proximo` são os `posicao` dos cartões imediatamente acima e
abaixo do ponto de soltura, **na coluna de destino**, lidos do servidor a partir
dos ids que o cliente enviou — nunca os números que o cliente enviou.

> `ponytail:` ponto médio em float — a precisão esgota após ~50 inserções
> consecutivas no mesmo intervalo. Saída quando acontecer: renumerar a coluna
> com `row_number() * 1000`.

---

## Fluxo de dados

```
crm_leads (filtrado por pipeline/q, LIMIT 501)
   → listarLeads()  ── ORDER BY posicao, id
   → agruparPorEtapa()  ── Map<etapa, Lead[]>, 5 chaves sempre presentes
   → <Quadro> (client)  ── useOptimistic
        │ arraste entre colunas → mover(id, etapa, antes, depois)
        │      → UPDATE etapa + posicao  +  INSERT crm_eventos      (transação)
        └ arraste dentro da coluna → reposicionar(id, antes, depois)
               → UPDATE posicao                                     (sem evento)
```

`agruparPorEtapa` devolve as 5 chaves mesmo vazias — é o que garante FR-006
(coluna vazia continua visível) e SC-005 (soma das contagens = total filtrado).
