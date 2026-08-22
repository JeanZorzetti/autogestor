# Implementation Plan: Site Próprio da Coopluz

**Branch**: `002-coopluz-standalone-site` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-coopluz-standalone-site/spec.md`

## Summary

Extrair a vertical Coopluz do hub autogestor para um site próprio, em
repositório irmão (`C:\dev\coopluz`), publicado em `coopluz.roilabs.com.br`.
A abordagem técnica é **fork por reaproveitamento**, não reescrita: o site
novo é o mesmo stack Astro do hub (mesmos layouts, componentes, motor de
lead, tokens de CSS), com o `data/solucoes.ts` reduzido a só Coopluz e todo
texto/JSON-LD/nav que hoje itera as 6 verticais do hub adaptado para uma
única vertical. O motor de captação (`/api/lead`, `lib/lead.mjs`, `lib/db.ts`)
é copiado **sem alteração de lógica** e aponta para o mesmo Postgres do hub
(mesma `DATABASE_URL`, mesmas tabelas `crm_leads`/`crm_eventos`), porque o
pipeline `coopluz` já existe no painel administrativo — zero mudança no
admin é o requisito mais importante da spec (FR-005, FR-017).

## Technical Context

**Language/Version**: TypeScript + Astro 5 (`^5.16.4`, igual ao hub), Node.js

**Primary Dependencies**: `astro`, `@astrojs/sitemap` (`^3.7.0`), `@astrojs/vercel`
(`^8.2.9`), `pg` (`^8.16.3`) — mesmas versões do hub, copiadas do
`package.json` existente, não reavaliadas nesta feature.

**Storage**: PostgreSQL — **o mesmo banco do hub** (tabelas `crm_leads` /
`crm_eventos`, esquema idempotente criado por `lib/db.ts`). Nenhum schema
novo. Ver Complexity Tracking sobre a duplicação deliberada que isso cria.

**Testing**: `node --test test/*.test.mjs` (sem framework, mesmo padrão do
hub) sobre a lógica pura em `.mjs` (`lead.mjs`, `tabela.mjs`), copiada e
testada verbatim.

**Target Platform**: Web público, deploy Vercel (`output: "static"` +
adapter `@astrojs/vercel`, uma única rota dinâmica `/api/lead` +
`/obrigado`), domínio `coopluz.roilabs.com.br`.

**Project Type**: Site institucional estático (Astro), com um endpoint de
API. Repositório novo, irmão de `C:\dev\autogestor`, não um pacote dentro
dele — é a decisão já registrada nas Assumptions da spec.

**Performance Goals**: Mesmo orçamento do hub — HTML completo sem JS para
render, ~1 KB de JavaScript por página (SC-005 da spec).

**Constraints**: Não alterar o hub autogestor nem o painel administrativo
(FR-017). Não introduzir schema de banco novo. Preservar o comportamento de
falha honesta do formulário (FR-006).

**Scale/Scope**: ~11 páginas (home, parceiro, blog índice, 2 posts, sobre,
privacidade, termos, obrigado, 404, llms.txt, robots.txt/sitemap) + 1 rota de
API. Escopo comparável ao hub atual (11 páginas), mas para 1 vertical em vez
de 6.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição em `.specify/memory/constitution.md` rege formalmente o
repositório `autogestor`. O projeto novo é um repositório separado e não
herda o arquivo automaticamente — mas nasce como fork direto do código que
essa constituição já rege, então os 5 princípios são avaliados aqui como
gate de design, e o arquivo é copiado para o novo repositório (tarefa de
`/speckit-tasks`) para reger a manutenção dele daqui para frente.

| Princípio | Avaliação |
|---|---|
| I. HTML estático primeiro | **PASS.** `output: "static"`, mesmas duas exceções já justificadas no hub (`/api/lead`, `/obrigado`). Nenhuma rota dinâmica nova. |
| II. Fonte única por domínio | **PASS, com duplicação declarada.** `consts.ts` (NAP) e `data/solucoes.ts` passam a existir em dois repositórios — inevitável sem monorepo (que a constituição do hub também proíbe: "Nenhum pacote compartilhado, nenhum monorepo"). Ver Complexity Tracking: cada arquivo duplicado leva comentário de origem, motivo e gatilho de atualização, igual ao padrão já usado em `admin/lib/pipelines.mjs`. |
| III. Simplicidade deliberada e marcada | **PASS.** Nenhuma abstração nova; extração 1:1 do que já existe. Aprofundamento de conteúdo fica fora de escopo (Clarifications, sessão 2026-08-21) e é registrado como decisão, não esquecido. |
| IV. Falhar fechado, nunca mentir | **PASS.** `api/lead.ts`, `lib/db.ts` e `lib/lead.mjs` copiados sem alteração de lógica — o comportamento de falha honesta (503 sem `DATABASE_URL`, WhatsApp em vez de sucesso falso) é herdado, não reimplementado. |
| V. Acessibilidade e contraste | **PASS.** Nenhum componente interativo novo — `LeadForm`, `Faq`, `BarraAcao`, `Header`/`Footer` são copiados e só têm conteúdo/dados editados, não markup ou interação. `ui-verification` roda no fim da implementação (ver quickstart.md) antes de declarar pronto, conforme a constituição exige para tela nova ou alterada. |

Nenhuma violação exige entrada na tabela de Complexity Tracking abaixo além
da duplicação de arquivo-fonte já prevista e permitida pelo Princípio II.

## Project Structure

### Documentation (this feature)

```text
specs/002-coopluz-standalone-site/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md         # Fase 1
├── quickstart.md         # Fase 1
├── contracts/            # Fase 1 (contrato do único endpoint dinâmico)
└── tasks.md              # Fase 2 (/speckit-tasks — ainda não criado)
```

### Source Code (novo repositório: `C:\dev\coopluz`)

```text
C:\dev\coopluz/
├── package.json                 # cópia de autogestor/package.json, name: "coopluz-site"
├── astro.config.mjs              # cópia; SITE_URL default: https://coopluz.roilabs.com.br
├── tsconfig.json                 # cópia verbatim
├── .env.example                  # cópia; mesmo DATABASE_URL do hub, comentário atualizado
├── .gitignore                    # cópia verbatim
├── .specify/memory/constitution.md  # cópia verbatim do hub — rege o novo repo daqui pra frente
├── public/
│   ├── favicon.svg, favicon.png, apple-touch-icon.png   # cópia verbatim
│   └── img/
│       ├── logo.svg, logo-escuro.svg, logo-mono.svg, icon-512.png, og.png   # cópia verbatim
│       └── parceiros/coopluz.png, sicoob.png             # cópia verbatim
├── src/
│   ├── consts.ts                 # cópia do hub + comentário de origem (Princípio II)
│   ├── content.config.ts         # cópia verbatim (schema do blog não muda)
│   ├── content/blog/
│   │   ├── reduzir-conta-equatorial-sem-placa-solar.md   # cópia verbatim
│   │   └── fio-b-60-por-cento-2026-conta-equatorial-goias.md  # cópia verbatim
│   ├── data/
│   │   └── solucoes.ts           # REDUZIDO: só `COOPLUZ`, `PARCEIRO_COOPLUZ`,
│   │                              #   `CIDADES_COOPLUZ`, `AREA_SERVIDA`, `ICONES.energia`
│   ├── lib/
│   │   ├── db.ts                 # cópia verbatim — mesmo Postgres do hub
│   │   ├── lead.mjs              # cópia verbatim
│   │   └── tabela.mjs            # cópia verbatim
│   ├── layouts/
│   │   ├── Base.astro            # ADAPTADO: Organization sem InsuranceAgency/SUSEP,
│   │   │                          #   areaServed GO, descrição e WebSite.name da Coopluz
│   │   ├── Vertical.astro        # ADAPTADO: sem seção "Outras soluções do hub",
│   │   │                          #   fechamento sem menção a SUSEP
│   │   └── Legal.astro           # ADAPTADO: rodapé "Como falar com a gente" sem SUSEP
│   ├── components/
│   │   ├── Header.astro          # ADAPTADO: nav com Home/Parceiro/Blog em vez das 6 verticais
│   │   ├── Footer.astro          # ADAPTADO: sem lista de 6 soluções nem linha SUSEP
│   │   ├── Logo.astro            # cópia verbatim
│   │   ├── LeadForm.astro        # cópia verbatim
│   │   ├── Faq.astro             # cópia verbatim
│   │   ├── BarraAcao.astro       # cópia verbatim
│   │   └── SolucaoCard.astro     # NÃO usado (só fazia sentido com várias soluções) — não copiar
│   ├── styles/global.css         # cópia verbatim (tokens de marca)
│   └── pages/
│       ├── index.astro           # ADAPTADO de coopluz.astro (era /coopluz, vira Home)
│       ├── parceiro.astro        # ADAPTADO de coopluz/parceiro.astro (era /coopluz/parceiro)
│       ├── sobre.astro           # REESCRITO: só Coopluz/Autogestor parceira, sem SUSEP/6 frentes
│       ├── privacidade.astro     # REESCRITO: só o que este site coleta/compartilha
│       ├── termos.astro          # REESCRITO: só limites da vertical energia
│       ├── obrigado.astro        # ADAPTADO: sem lista "outras frentes"; prerender=false mantido
│       ├── 404.astro             # cópia verbatim (verificar se referencia SOLUCOES)
│       ├── llms.txt.ts           # REESCRITO: só a solução Coopluz + os 2 posts
│       ├── robots.txt.ts         # cópia verbatim (já é agnóstico de domínio via `site`)
│       ├── blog/
│       │   ├── index.astro       # cópia quase verbatim (já é escopado ao cluster Coopluz)
│       │   └── [slug].astro      # cópia verbatim
│       └── api/
│           └── lead.ts           # ADAPTADO: TODAS = [COOPLUZ, PARCEIRO_COOPLUZ] só
└── test/
    ├── lead.test.mjs             # cópia verbatim
    └── tabela.test.mjs           # cópia verbatim
```

**Structure Decision**: Astro single-project (mesma forma do hub), copiado
integralmente como novo repositório em `C:\dev\coopluz`. Sem monorepo, sem
pacote compartilhado — cada arquivo reduzido ou adaptado é uma cópia com
edição pontual, não uma referência ao hub. A página "Contato" pedida na spec
(FR-011) **não vira rota própria**: o hub também não tem `/contato` como
página separada — o contato mora dentro de `/sobre` (endereço, WhatsApp,
e-mail) e no rodapé em todas as páginas. Criar uma rota nova só para isto
seria escopo além do que o próprio hub julga necessário; `/sobre` cumpre o
requisito.

**Decisões de infraestrutura que valem revisão humana amanhã** (não bloqueiam
a implementação, mas são escolhas de produto, não só de código):

1. **GA4**: reaproveita o mesmo `G-SHG12H2NZX` do hub (não cria propriedade
   nova). Tráfego do site novo entra na mesma propriedade, distinguível por
   hostname. Trocar por uma propriedade dedicada é uma constante só
   (`src/consts.ts`), a qualquer momento.
2. **Imagem de Open Graph**: reaproveita `/img/og.png` do hub (genérica,
   marca Autogestor) — não existe hoje uma imagem de compartilhamento
   específica da Coopluz. Produzir uma é trabalho de design fora do escopo
   desta feature de engenharia.
3. **Conteúdo duplicado entre hub e site novo**: já registrado nas
   Clarifications da spec — aceito como trade-off temporário.

## Complexity Tracking

> Nenhuma violação da constituição exige justificativa aqui. A única
> duplicação (Princípio II) é permitida pelo próprio texto do princípio
> quando os dois builds não devem se acoplar — que é exatamente este caso
> (dois repositórios, dois projetos Vercel, zero monorepo). Registrada por
> transparência, não como desvio:

| Duplicação | Por que é necessária | Alternativa mais simples recusada porque |
|---|---|---|
| `src/consts.ts` (NAP da Autogestor) existe nos dois repositórios | Cada repo builda e deploya sozinho; a constituição do hub já proíbe pacote compartilhado entre `autogestor` e `admin/`, e o mesmo vale entre `autogestor` e `coopluz` | Um pacote npm privado compartilhado é infraestrutura nova (registry, versionamento, publish) para sincronizar ~10 constantes que mudam raramente — mais complexo do que o problema que resolve |
| `src/data/solucoes.ts` (só a fatia Coopluz) existe nos dois repositórios | Mesmo motivo acima | Mesmo motivo acima |
