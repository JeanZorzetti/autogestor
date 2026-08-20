# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Site institucional da Autogestor em Astro (`output: "static"`): uma página por
vertical de negócio (6 soluções), todas estáticas, com um único endpoint
dinâmico (`/api/lead`) para captura de lead. Produção em
`autogestor.roilabs.com.br` (Vercel); banco Postgres no EasyPanel.

## Comandos

```bash
npm run dev      # sem DATABASE_URL exportada: /api/lead responde 503, formulário cai para WhatsApp
npm run build
npm run check     # astro check (tipos)
npm test          # node --test test/*.test.mjs — só valida test/*.test.mjs, não roda no build
```

Um único teste: `node --test test/lead.test.mjs`.

**Pegadinha de ambiente:** o Astro carrega `.env` para `import.meta.env`, não
para `process.env`. O código lê `process.env` (é o que a Vercel entrega em
runtime), então localmente é preciso **exportar** a variável, não só ter o
`.env`:

```bash
export DATABASE_URL="postgres://postgres:teste@localhost:55432/autogestor" && npm run dev
```

Postgres local para exercitar a gravação de lead:
`docker run -d --name ag-pg -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=autogestor -p 55432:5432 postgres:16-alpine`.
O schema (`crm_leads`, `crm_eventos`) é criado sozinho na primeira gravação
(`CREATE TABLE IF NOT EXISTS`, em [src/lib/db.ts](src/lib/db.ts)).

## Arquitetura

**Fonte única de verdade por domínio**, cada uma num arquivo:
- [src/consts.ts](src/consts.ts) — NAP (nome/endereço/telefone), links de WhatsApp, prazos de atendimento. Sai em rodapé, JSON-LD e página de contato; divergir entre eles é o erro clássico que derruba SEO local.
- [src/data/solucoes.ts](src/data/solucoes.ts) — as 6 verticais (`SOLUCOES`) mais dois pseudo-verticais fora da nav (`PARCEIRO`, `GERAL`, usados pela home e pelo formulário de parceiro). Cada `Solucao` carrega slug, textos, campo do formulário e `abrangencia` (BR ou GO — só a Coopluz é restrita à área da Equatorial Goiás). `/api/lead` valida o `solucao` recebido contra a lista de slugs desses três grupos.
- [src/layouts/Base.astro](src/layouts/Base.astro) — `<head>`, canonical, Open Graph, tema claro/escuro pré-pintura, e o `@graph` de JSON-LD (Organization + WebSite + WebPage/subtipo + BreadcrumbList opcional).
- [src/layouts/Vertical.astro](src/layouts/Vertical.astro) — esqueleto compartilhado das páginas de solução: hero + form, FAQ, seção de fechamento com segundo form, grade das outras 5 soluções, barra de ação fixa mobile. Cada página de vertical (`src/pages/coopluz.astro` etc.) só passa `h1`, `chamada` e `perguntas`.

**O único código dinâmico** é [src/pages/api/lead.ts](src/pages/api/lead.ts)
(`prerender = false`). Todo o resto é HTML estático gerado no build. O
endpoint:
- aceita form-urlencoded (submit sem JS, navega para `/obrigado`) e JSON (com JS, espera resposta) — os dois caminhos precisam continuar funcionando;
- valida com `parseLead()` em [src/lib/lead.mjs](src/lib/lead.mjs) — `.mjs` sem transpilar de propósito, porque `node --test` importa esse arquivo direto;
- tem honeypot (campo `empresa`: resposta 200 mas não grava) e rate limit em `Map` no processo (por instância serverless, reseta a cada cold start — não é defesa distribuída);
- falha fechado: sem `DATABASE_URL`, responde 503 e o formulário mostra o WhatsApp em vez de fingir que gravou.

`/api/lead` grava em `crm_leads`/`crm_eventos` — de propósito o mesmo formato
de tabela do roihub, para um futuro `/admin` em Next.js ler sem tradutor (veja
"O que ainda não existe" abaixo).

**Blog** ([src/content/blog/](src/content/blog/), coleção definida em
[src/content.config.ts](src/content.config.ts)): um post por cluster de
intenção (não por vertical) — um pilar + spokes que linkam pra ele. O
frontmatter `vertical` aponta para o slug de `SOLUCOES` que ganha o CTA final;
`pilar: boolean` controla a nav interna simples (spoke aponta pro pilar, pilar
não aponta pra si). Ver [docs/pesquisa-blog-seo.md](docs/pesquisa-blog-seo.md)
para a pesquisa de clusters e a ordem de ataque.

**GEO/AEO**: [src/pages/llms.txt.ts](src/pages/llms.txt.ts) e
[src/pages/robots.txt.ts](src/pages/robots.txt.ts) são endpoints (não arquivos
estáticos) porque dependem do domínio de `SITE_URL`.

## Convenções que não são óbvias no código

- Todo texto voltado ao usuário e nomes de variável/prop estão em português; comentários de código também. Siga o padrão do arquivo que estiver editando.
- Tema claro/escuro é `light-dark()` com um valor por token — não duplicar em `@media (prefers-color-scheme)` + `:root[data-tema]` separados (ver decisões em [README.md](README.md)).
- Antes de adicionar uma dependência para algo pequeno (parsing, travessia de árvore, rate limit), veja se o arquivo já resolveu isso com poucas linhas de propósito — é o padrão do repo (`escopoDeCabecalho` em [src/lib/tabela.mjs](src/lib/tabela.mjs), rate limit em `lead.ts`) e comentários `ponytail:` marcam onde a simplificação foi deliberada, com o teto e o gatilho para evoluir.
- [README.md](README.md) tem a lista completa de decisões de UI/contraste/formulário não óbvias no código — leia antes de mexer em Header, LeadForm, BarraAcao ou no tema.

## O que ainda não existe

- `/admin` em Next.js lendo `crm_leads` (motivo de o banco existir).
- Fonte da marca própria (hoje usa a stack de fontes do sistema).
- Terceiro estado do tema ("seguir o sistema") — hoje só alterna claro/escuro.
- Analytics de conversão além do pageview GA4.
