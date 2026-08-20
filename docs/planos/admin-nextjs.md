# /admin da Autogestor — painel Next.js sobre `crm_leads`

> Plano aprovado em 20/08/2026. Cópia de trabalho do plano da sessão.

## Contexto

O site Astro deste repo capta leads das 6 verticais e grava em `crm_leads`/`crm_eventos`
([src/lib/db.ts](../../src/lib/db.ts)) — **o banco existe só por causa deste painel**. Hoje ninguém lê
essas linhas: o lead entra e morre no Postgres. O `/admin` é o outro lado do formulário, e o formato de
tabela já foi escolhido igual ao do roihub (`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\roihub`)
justamente para ler sem tradutor.

Resultado esperado: um corretor abre o painel, vê os leads que chegaram, quem está parado esfriando,
e move de etapa deixando registro de quem fez o quê.

**Decidido com o dono:**
1. Pasta `admin/` no mesmo repo, **projeto Vercel separado** (Root Directory = `admin`) em
   `admin.autogestor.roilabs.com.br`. Sem proxy, sem `basePath` — server actions não passam por rewrite.
2. Três telas: **Painel**, **Leads**, **Detalhe do lead**.
3. **Vários corretores identificados** — o histórico do lead diz *quem* moveu. Isso obriga login com
   sessão (não Basic auth como o roihub), uma tabela de usuários e uma 4ª tela pequena de Equipe.

## Padrão a seguir (do roihub, não inventar outro)

App Router + `pg` cru + server actions + zero lib de UI. Arquivos de referência a ler antes de escrever,
todos em `roihub/`: `app/crm/page.tsx` (120 linhas, a tela inteira), `app/crm/actions.ts` (server action
`mover`, valida etapa contra o JSON e não contra o form), `lib/db.ts:389-513` (bloco CRM: `Lead`,
`listLeads`, `moveLead`, `insertLead`), `middleware.ts` (fail closed em produção) e `app/globals.css`
(o design system inteiro, 321 linhas).

Convenções que valem nos dois repos e continuam valendo aqui: **tudo em português** (texto de UI,
nomes de variável, comentários); lógica pura em `.mjs` sem transpilar porque `node --test` importa
direto; `ponytail:` comentando simplificação deliberada com o teto e o gatilho de evolução.

## Arquivos

```
admin/                          ← novo, projeto Vercel próprio
  package.json                  next ^16.2.10, react ^19.2.7, pg ^8.22.0 (mesmas do roihub)
  next.config.mjs               turbopack.root = import.meta.dirname (o pai tem package.json)
  tsconfig.json                 cópia do roihub (paths @/*)
  .env.example
  middleware.ts
  app/layout.tsx                metadata robots: noindex, lang pt-BR
  app/globals.css               cópia do roihub + tokens da marca Autogestor
  app/tabs.tsx                  Painel · Leads · Equipe + nome do usuário + Sair
  app/page.tsx                  PAINEL
  app/entrar/page.tsx           login (fora do middleware)
  app/entrar/actions.ts
  app/leads/page.tsx            LISTA
  app/leads/actions.ts          mover(), definirValor()
  app/leads/[id]/page.tsx       DETALHE
  app/equipe/page.tsx
  app/equipe/actions.ts
  lib/db.ts                     pool + ensure() + queries
  lib/auth.ts                   scrypt + HMAC de sessão
  lib/pipelines.mjs             8 slugs, 5 etapas, limiares de "parado"
  test/pipelines.test.mjs
  test/auth.test.mjs
```

Fora de `admin/`: acrescentar `.next/` ao [.gitignore](../../.gitignore) da raiz (`node_modules/` e
`.env` já casam em qualquer nível) e atualizar [CLAUDE.md](../../CLAUDE.md) — hoje ele lista `/admin`
em "O que ainda não existe".

## Dados

`crm_leads` e `crm_eventos` já existem e são criadas pelo `ensure()` do site. O `ensure()` do admin
repete o mesmo `CREATE TABLE IF NOT EXISTS` (as duas apps sobem sozinhas, em qualquer ordem) e
acrescenta, idempotente — mesmo padrão de `ALTER ... IF NOT EXISTS` que o roihub usa em `lib/db.ts:138`:

```sql
ALTER TABLE crm_eventos ADD COLUMN IF NOT EXISTS autor TEXT;   -- NULL = evento do site
CREATE TABLE IF NOT EXISTS admin_usuarios (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Primeiro usuário: seed a partir de `ADMIN_SEED_EMAIL`/`ADMIN_SEED_SENHA` com `ON CONFLICT DO NOTHING`
no `ensure()` — sem isso o painel sobe sem ninguém que consiga entrar. Os demais entram pela tela Equipe.

`pipelines.mjs` repete os 8 slugs (`coopluz`, `seguro`, `viagens`, `financiamento`, `consorcio`,
`repasse`, `parceiro`, `geral`) com nome de exibição e as 5 etapas (`novo`, `contato`, `proposta`,
`ganho`, `perdido`). **Duplicação deliberada** de [src/data/solucoes.ts](../../src/data/solucoes.ts):
importar o arquivo do site puxaria FAQ, textos e campos de formulário para o bundle do admin e
acoplaria os dois builds. Marcar com `ponytail:` — os slugs são estáveis e estão no próprio banco.

Queries (todas em `lib/db.ts`, `pg` cru):
- `listarLeads({ vertical, etapa, q })` — `WHERE` montado com placeholders (nunca interpolação),
  `desde` calculado com o mesmo `COALESCE(max(evento), criado)` do roihub (`lib/db.ts:488`),
  `LIMIT 500` com `ponytail:` (paginação quando passar disso).
- `resumo()` — um `GROUP BY pipeline, etapa` + contagens por janela (`criado > now() - interval`).
  Agregação em SQL, não em JS: nada puro para testar e o Postgres faz melhor.
- `lead(id)` + `eventos(id)` para o detalhe.
- `moverLead(id, etapa, nota, autor)` — porta do `moveLead` do roihub (`lib/db.ts:499`), com `autor`.

## Autenticação

`lib/auth.ts`, só `node:crypto` e Web Crypto — nenhuma dependência nova:
- **Senha:** `scrypt` com salt aleatório por usuário, comparação com `timingSafeEqual`.
- **Sessão:** cookie `ag_sessao` = `{id, exp}` + HMAC-SHA256 assinado com `ADMIN_SESSION_SECRET`,
  via `crypto.subtle` (roda tanto no Node quanto no Edge, então o middleware valida sem
  configuração de runtime). `HttpOnly`, `SameSite=Lax`, `Secure` em produção, 30 dias.
  Sem tabela de sessão: revogar = trocar o secret. `ponytail:` com esse teto anotado.
- **middleware.ts:** tudo exceto `/entrar`, `/_next`, `/favicon.ico` exige sessão válida →
  redirect para `/entrar`. Sem `ADMIN_SESSION_SECRET` em produção responde **503** (fail closed,
  igual `middleware.ts:25` do roihub) — nunca passar aberto.
- **Rate limit no login:** `Map` no processo, 5 tentativas/hora por IP, copiando o padrão já usado em
  [src/pages/api/lead.ts:23-36](../../src/pages/api/lead.ts#L23-L36) com o mesmo `ponytail:` sobre o
  teto (não é defesa distribuída).
- Server actions leem o autor do **cookie**, nunca de campo do formulário. Etapa validada contra
  `pipelines.mjs`, não contra o `<select>` recebido — a regra do `app/crm/actions.ts:19`.

## Telas

**Painel (`/`)** — leads hoje / 7d / 30d; tabela por vertical (total, novos 7d, em aberto, ganhos 30d);
funil por etapa; e a seção que faz o painel valer a pena: **parados** — `novo` há mais de 1 dia,
`contato` há mais de 5, `proposta` há mais de 7 — cada um linkando para o detalhe.

**Leads (`/leads`)** — filtros por vertical, etapa e busca (nome/telefone) via `searchParams` e um
`<form method="get">`: server component puro, zero JS no cliente. Colunas: nome + WhatsApp (link
`wa.me`), vertical, contexto, parado há, e o form inline de mover etapa + nota (o de `app/crm/page.tsx:31-43`).

**Detalhe (`/leads/[id]`)** — dados do lead, `metadata` completa (contexto, referer, user-agent, IP —
tudo que [src/pages/api/lead.ts:73-77](../../src/pages/api/lead.ts#L73-L77) grava), campo de `valor`, e
a timeline de `crm_eventos` (`de → para`, nota, **autor**, quando).

**Equipe (`/equipe`)** — listar, adicionar corretor, desativar, trocar a própria senha. Sem papéis:
todo mundo vê tudo. `ponytail:` — papéis quando existir alguém que não deva ver o funil inteiro.

Antes de escrever qualquer JSX ou string de interface, invocar as skills do harness (regra §5 do
CLAUDE.md global): `accessibility` para os forms/selects/tabelas e `ux-writing` para labels, erros de
login e estados vazios. O visual reusa o `globals.css` do roihub inteiro — não desenhar sistema novo.

## Verificação

```bash
docker run -d --name ag-pg -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=autogestor -p 55432:5432 postgres:16-alpine
export DATABASE_URL="postgres://postgres:teste@localhost:55432/autogestor"

npm run dev                       # raiz: preencher o form de 2 verticais para ter lead real
cd admin && npm install && npm test
export ADMIN_SESSION_SECRET=dev ADMIN_SEED_EMAIL=jean@autogestor.com.br ADMIN_SEED_SENHA=teste123
npm run dev && npm run build      # build tem que passar antes de qualquer push
```

`npm test` do admin (`node --test`) cobre o que quebra em silêncio: roundtrip de hash de senha, senha
errada rejeitada, cookie adulterado e cookie expirado rejeitados, e validação de etapa/pipeline.

Fluxo manual, com a skill `ui-verification` (Playwright, screenshot antes de dizer que está pronto):
`/leads` sem sessão redireciona para `/entrar` → login errado mostra erro e não cria cookie → login
certo cai no Painel → mover um lead para `contato` → detalhe mostra o evento **com o nome do corretor**
→ lead que veio do site aparece com autor vazio. Rodar a passagem de teclado e conferir 390/768/1280px.

## Deploy (manual — o MCP da Vercel não está autenticado)

Projeto novo na Vercel a partir de `JeanZorzetti/autogestor`, **Root Directory = `admin`**, framework
Next.js. Envs: `DATABASE_URL` (o mesmo Postgres do site), `ADMIN_SESSION_SECRET` (32+ bytes aleatórios),
`ADMIN_SEED_EMAIL`, `ADMIN_SEED_SENHA`. Domínio `admin.autogestor.roilabs.com.br`. O projeto `autogestor`
existente não muda. Trocar a senha do seed pela tela Equipe depois do primeiro login.

## Fora de escopo (dizer, não construir)

Cadastro manual de lead que chegou por WhatsApp; export CSV; kanban com arrastar; papéis/permissões;
notificação de lead novo. Nenhum foi pedido — entram quando o uso pedir.
