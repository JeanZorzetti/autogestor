# Implementation Plan: Kanban de Leads

**Branch**: `001-kanban-leads` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-kanban-leads/spec.md`

## Summary

Trocar a tabela linear de `/leads` no painel Next.js por um quadro de 5 colunas
(uma por etapa do funil), com arraste entre colunas que muda a etapa e grava
histórico, arraste dentro da coluna que só reordena (sem poluir o histórico), e
os filtros existentes recortando o quadro inteiro pela URL.

Abordagem técnica: **uma coluna nova no banco** (`crm_leads.posicao`, double
precision, ordenada por ponto médio entre vizinhos), **uma dependência nova**
(`@dnd-kit/core` + `@dnd-kit/sortable`, escolhida porque teclado e toque são
requisito explícito e o DnD nativo não os atende), **`useOptimistic` do React 19
já instalado** para o feedback imediato e o rollback, e **duas server actions**
separadas para manter a fronteira entre "mudou de etapa" (grava evento) e "só
mudou de lugar" (não grava). Nenhuma infra nova é provisionada.

## Technical Context

**Language/Version**: TypeScript 5.9 · React 19.2 · Node 22+ (ESM). Lógica pura
em `.mjs` sem transpilar, para `node --test` importar direto — padrão do repo.

**Primary Dependencies**: Next.js 16.2 (App Router, Server Actions, `proxy.ts`
no lugar de `middleware.ts`), `pg` 8.22. **Nova**: `@dnd-kit/core@^6.3.1` +
`@dnd-kit/sortable@^10.0.0` — justificativa e alternativas rejeitadas em
[research.md](./research.md) §R1.

**Storage**: Postgres (EasyPanel em produção; o mesmo banco do site Astro).
Tabelas existentes `crm_leads` / `crm_eventos` / `admin_usuarios`, criadas
idempotentemente por `ensure()` em `admin/lib/db.ts`. Única mudança de schema:
`ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS posicao DOUBLE PRECISION NOT
NULL DEFAULT extract(epoch from now())`.

**Testing**: `node --test` (`admin/npm test`). Novo alvo:
`admin/test/quadro.test.mjs` sobre `admin/lib/quadro.mjs`. Validação manual e de
acessibilidade em [quickstart.md](./quickstart.md).

**Target Platform**: Vercel (projeto separado, Root Directory = `admin`, domínio
`admin.autogestor.roilabs.com.br`). Navegadores modernos, desktop e mobile.

**Project Type**: Web app — painel administrativo autenticado, App Router com
Server Components por padrão e uma ilha cliente para o arraste.

**Performance Goals**: resultado do gesto visível em < 1 s (SC-003) — garantido
por `useOptimistic`, não pelo round-trip. Leitura do quadro em uma query, teto
de 500 leads por recorte.

**Constraints**:

- Teclado e toque **não são opcionais** (FR-008, FR-021, SC-004) — determinam a
  escolha de biblioteca.
- Reordenar não pode gerar evento de histórico (FR-022, SC-009).
- Reordenação concorrente não pode deslocar outros cartões — só a linha movida é
  escrita (edge case do spec).
- `etapa` e `pipeline` validados no servidor contra `pipelines.mjs`, nunca
  contra o payload (FR-010).
- Todo texto de interface, nome de variável e comentário em português.
- O site Astro na raiz **não muda** — o `INSERT` dele em `crm_leads` continua
  válido pelo `DEFAULT` da coluna nova.

**Scale/Scope**: 1 tela reescrita, ~5 usuários simultâneos, 8 verticais × 5
etapas, teto de 500 leads por recorte. 4 histórias (P1, P1, P2, P3), 22 FRs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` está **no estado de template**, com todos os
princípios como placeholders (`[PRINCIPLE_1_NAME]` etc.). **Não há gates de
constituição a avaliar** — nenhum princípio ratificado existe neste projeto.

Na ausência de constituição, aplicam-se as regras de projeto já escritas, que
esta feature respeita:

| Regra vigente (fonte) | Status |
|---|---|
| Português em texto de UI, variáveis e comentários (CLAUDE.md raiz) | ✅ |
| Antes de somar dependência, ver se poucas linhas resolvem (CLAUDE.md raiz) | ✅ avaliado em [research.md](./research.md) §R1 — **1 dependência somada**, justificada por requisito de acessibilidade que exige ~centenas de linhas para replicar |
| Simplificação deliberada marcada com `ponytail:` e teto explícito | ✅ ponto médio em float e teto de 500 leads marcados |
| Lógica não-trivial em `.mjs` testável por `node --test` | ✅ `lib/quadro.mjs` + `test/quadro.test.mjs` |
| Fonte única por domínio (etapas/verticais só em `pipelines.mjs`) | ✅ nenhuma constante duplicada |
| Harness UX/UI: componente interativo novo puxa `accessibility` sempre | ✅ contrato de teclado e anúncios em [contracts/server-actions.md](./contracts/server-actions.md); `ui-verification` é gate de saída em [quickstart.md](./quickstart.md) |

**Re-check pós-Phase 1**: nenhuma violação introduzida pelo design. Nenhuma
abstração especulativa: sem camada de repositório, sem tabela de ordenação, sem
grafo de transições de etapa, sem paginação, sem alternador de visão. Ver
[Complexity Tracking](#complexity-tracking).

**Recomendação (fora do escopo desta feature)**: rodar `/speckit-constitution`
para preencher a constituição, senão toda feature futura passa por este gate
vazio.

## Project Structure

### Documentation (this feature)

```text
specs/001-kanban-leads/
├── plan.md              # Este arquivo
├── spec.md              # Entrada
├── research.md          # Phase 0 — 7 decisões técnicas
├── data-model.md        # Phase 1 — schema, entidades, invariantes
├── quickstart.md        # Phase 1 — como rodar e provar (V1–V13)
├── contracts/
│   └── server-actions.md   # Phase 1 — assinaturas, erros, contrato de URL e de a11y
├── checklists/          # já existente
└── tasks.md             # Phase 2 — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
admin/                              # projeto Next.js do painel (Root Directory na Vercel)
├── app/
│   ├── globals.css                 # ALTERADO: estilos do quadro (.quadro, .coluna, .cartao)
│   └── leads/
│       ├── page.tsx                # REESCRITO: Server Component — filtros + monta o quadro
│       ├── quadro.tsx              # NOVO: "use client" — DndContext, useOptimistic, aria-live
│       ├── cartao.tsx              # NOVO: "use client" — useSortable + fallback de etapa
│       ├── actions.ts              # ALTERADO: mover() com posição; reposicionar() nova
│       └── [id]/page.tsx           # inalterado
├── lib/
│   ├── quadro.mjs                  # NOVO: posicaoEntre(), agruparPorEtapa() — lógica pura
│   ├── db.ts                       # ALTERADO: coluna posicao no ensure(); ORDER BY; LIMIT 501;
│   │                               #           moverLead() transacional; reposicionarLead()
│   ├── pipelines.mjs               # inalterado (ETAPAS, PIPELINES, LIMIAR_PARADO já servem)
│   └── auth.ts                     # inalterado
├── test/
│   └── quadro.test.mjs             # NOVO: ponto médio e agrupamento
└── package.json                    # ALTERADO: @dnd-kit/*; script test inclui quadro.test.mjs

src/                                # site Astro na raiz — NADA MUDA
```

**Structure Decision**: a feature vive inteiramente em `admin/`, o projeto
Next.js já existente (Option 2 do template, com o "backend" sendo as Server
Actions e o acesso a `pg` dentro do mesmo app). Nenhum diretório novo de topo,
nenhum pacote compartilhado: `admin/` e o site Astro na raiz são dois builds
independentes que só compartilham o Postgres, e a duplicação deliberada de
constantes entre eles (documentada em `admin/lib/pipelines.mjs`) permanece.

A divisão dos arquivos segue a fronteira server/client que o App Router exige:
`page.tsx` continua Server Component (lê o banco, resolve `searchParams`) e
passa dados prontos para a ilha `quadro.tsx`, que é o único `"use client"` da
tela. `lib/quadro.mjs` fica fora dos dois para ser testável sem React e sem `pg`.

## Ordem de implementação sugerida

Cada fatia é independentemente testável e mapeia uma história do spec. Detalhe
por tarefa sai em `/speckit-tasks`.

| # | Fatia | Entrega | Valida |
|---|---|---|---|
| 0 | Fundação | coluna `posicao` no `ensure()` + `lib/quadro.mjs` + `test/quadro.test.mjs` + `npm i @dnd-kit/*` | `npm test` |
| 1 | US1 — ver o funil | `page.tsx` reescrita, `quadro.tsx`/`cartao.tsx` estáticos, CSS das colunas, aviso de 500 | V1, V2, V10, V11 |
| 2 | US2 — mover arrastando | `DndContext` + sensores, `useOptimistic`, `mover()` com posição e transação, anúncios | V3, V4, V5, V6, V7 |
| 3 | US3 — filtros no quadro | remove filtro de etapa, `FiltroLeads` sem `etapa`, estado vazio de busca | V9 |
| 4 | US4 — priorizar a fila | `useSortable` dentro da coluna, `reposicionar()` | V8 |
| 5 | Fecho | responsivo, `prefers-reduced-motion`, `ui-verification` | V12, V13 |

Parar depois da fatia 2 já entrega um quadro utilizável — é o corte mínimo com
valor, se o escopo precisar encolher.

## Complexity Tracking

> Sem violações de constituição (não há constituição ratificada). A tabela
> registra as duas adições de complexidade da feature e por que a alternativa
> mais simples foi recusada — o mesmo escrutínio, sem o gate formal.

| Adição | Por que é necessária | Alternativa simples recusada porque |
|---|---|---|
| Dependência `@dnd-kit/core` + `/sortable` (~30 kB gzip) | FR-008/FR-021/SC-004 exigem que 100% das movimentações com mouse existam também por teclado e toque, com anúncio por leitor de tela | HTML5 DnD nativo não dispara em toque e não tem modo de teclado; replicar sensores, modo de teclado, `aria-live` e auto-scroll à mão são centenas de linhas de acessibilidade sutil que falham em silêncio ([research.md](./research.md) §R1) |
| Coluna `posicao` + cálculo de ponto médio | FR-019/FR-020 e o edge case de reordenação concorrente ("nenhum outro cartão troca de lugar por consequência") | Renumerar a coluna inteira a partir da visão do cliente escreve N linhas e sobrescreve a movimentação que um colega acabou de fazer; ordenar só por `desde` reprova a US4 inteira ([research.md](./research.md) §R2) |

Explicitamente **não** construídos, por não haver requisito: tabela de
ordenação por usuário, versionamento otimista / `FOR UPDATE`, grafo de
transições permitidas entre etapas, paginação, alternador tabela↔quadro, rota
separada para mobile, camada de repositório sobre `pg`.
