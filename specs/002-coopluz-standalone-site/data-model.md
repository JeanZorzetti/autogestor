# Data Model: Site Próprio da Coopluz

Esta feature **não cria nenhum schema novo**. Documenta aqui o formato já
existente que o código novo precisa respeitar exatamente — qualquer desvio
quebra a leitura pelo painel administrativo (FR-005, FR-017).

## Lead (`crm_leads`, Postgres — tabela já existente no hub)

Origem: `C:\dev\autogestor\src\lib\db.ts`. Copiado verbatim; nenhuma coluna
nova, nenhuma migração.

| Campo | Tipo | Preenchido por | Observação |
|---|---|---|---|
| `id` | `BIGSERIAL` | banco | chave primária |
| `external_id` | `TEXT UNIQUE` | `gravarLead()` | `"{solucao}:{whatsapp}:{dia}"` — é a chave de deduplicação (Edge Case "envio duplicado" da spec) |
| `pipeline` | `TEXT` | formulário (`solucao.slug`) | `"coopluz"` (Home) ou `"parceiro-coopluz"` (página de parceiro) — ambos já existem em `admin/lib/pipelines.mjs`, nenhum slug novo |
| `etapa` | `TEXT` | fixo `"novo"` na criação | painel administrativo move depois |
| `nome` | `TEXT` | campo "Seu nome" | validado por `parseLead()` (mín. 2 caracteres) |
| `telefone` | `TEXT` | campo "WhatsApp" | normalizado para E.164 por `normalizarWhatsapp()` |
| `origem` | `TEXT` | campo oculto `origem` | `"site:{slug}:{instancia}"`, ex.: `site:coopluz:topo` |
| `metadata` | `JSONB` | `{ contexto, ua, referer, ip }` | `contexto` é a resposta da 3ª pergunta (valor da conta ou cidade de atuação) |
| `criado` / `atualizado` | `TIMESTAMPTZ` | banco (`DEFAULT now()`) | — |

### Regra de negócio herdada (não reimplementada)

- **Deduplicação por janela de 1 dia**: mesmo WhatsApp + mesma solução no
  mesmo dia não cria um segundo lead (`ON CONFLICT (external_id) DO
  NOTHING`) — cobre o Edge Case "duplo clique" da spec sem código novo.
- **Honeypot**: campo `empresa` preenchido → resposta de sucesso simulada,
  sem gravação (`isca: true` em `parseLead()`), cobre o Edge Case "robô" em
  conjunto com o rate limit por IP já existente em `api/lead.ts`.

## Solução (dado estático, não persistido — `src/data/solucoes.ts`)

Reduzido de 6 entradas (`SOLUCOES`) + `PARCEIRO` + `GERAL` para apenas 2
constantes, mantendo o mesmo `type Solucao`:

| Constante | Slug | Usada em |
|---|---|---|
| `COOPLUZ` (renomeada de `SOLUCOES[0]`, mesmo conteúdo) | `coopluz` | Home (`index.astro`), `api/lead.ts`, `Base.astro` (JSON-LD Service) |
| `PARCEIRO_COOPLUZ` (cópia inalterada) | `parceiro-coopluz` | `parceiro.astro`, `api/lead.ts` |

`AREA_SERVIDA`, `ICONES.energia` e `CIDADES_COOPLUZ` migram junto — são
dependências diretas dessas duas entradas. As outras 5 soluções, `PARCEIRO`,
`GERAL` e os demais ícones **não são copiados** (Assumptions da spec:
verticais fora de escopo).

## Artigo de blog (content collection, `src/content/blog/`)

Schema em `content.config.ts` **copiado verbatim** — nenhum campo novo:

```
titulo: string
curto?: string
descricao: string
vertical: string       // sempre "coopluz" nos 2 posts migrados
publicado: date
atualizado?: date
pilar: boolean
```

Os 2 arquivos `.md` existentes migram com o conteúdo (front matter + corpo)
**inalterado** — só o arquivo muda de repositório, não o texto (Clarifications,
decisão "portar tal como está").

## Página institucional (conteúdo estático em `.astro`, não persistido)

Não é uma entidade de dado no sentido de banco — listada aqui só para
registrar que `sobre.astro`, `privacidade.astro` e `termos.astro` são
**reescritos** (não copiados) porque o texto do hub fala das 6 verticais e
do registro SUSEP, que não se aplicam a este site (ver plan.md, Constitution
Check e Clarifications da spec). O conteúdo factual reaproveitado (NAP,
fundação 2004, LGPD) vem de `consts.ts`, que é dado, não é reescrito.

## Sem migração, sem versionamento de schema

Como nenhuma tabela nova é criada e nenhuma coluna muda, não há script de
migração para esta feature. `lib/db.ts` roda `CREATE TABLE IF NOT EXISTS`
igual ao hub — idempotente por padrão, mesmo copiado para o segundo
repositório apontando para o mesmo banco (o `CREATE TABLE IF NOT EXISTS` do
site novo é um no-op na primeira chamada, porque a tabela já existe).
