---

description: "Task list template for feature implementation"
---

# Tasks: Site Próprio da Coopluz

**Input**: Design documents from `/specs/002-coopluz-standalone-site/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/post-api-lead.md](./contracts/post-api-lead.md), [quickstart.md](./quickstart.md)

**Tests**: A spec não pede TDD. As tarefas de teste aqui são as já existentes
no hub (`lead.mjs`, `tabela.mjs`), copiadas verbatim — não há teste novo a
escrever, porque não há lógica nova (Constitution Check, `plan.md`).

**Organization**: Tarefas agrupadas pelas 4 User Stories de `spec.md`. Todo
caminho é relativo à raiz do repositório **novo**, `C:\dev\coopluz`, exceto
quando explicitamente apontado para `C:\dev\autogestor` (arquivo de origem a
copiar).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paraleliz​ável (arquivo diferente, sem dependência pendente)
- **[Story]**: US1 (Home), US2 (Parceiro), US3 (Blog), US4 (Lead no painel)

---

## Phase 1: Setup

**Purpose**: Esqueleto do repositório novo — nada aqui depende de conteúdo
de negócio, só da existência do hub como fonte.

- [x] T001 Criar `C:\dev\coopluz\` e rodar `git init` dentro dele
- [x] T002 [P] Copiar `autogestor\package.json` → `coopluz\package.json`, trocando `"name": "autogestor-hub"` por `"name": "coopluz-site"` (scripts e dependências idênticos)
- [x] T003 [P] Copiar `autogestor\tsconfig.json` → `coopluz\tsconfig.json` verbatim
- [x] T004 [P] Copiar `autogestor\astro.config.mjs` → `coopluz\astro.config.mjs`, trocando o fallback `https://autogestor.roilabs.com.br` por `https://coopluz.roilabs.com.br`
- [x] T005 [P] Copiar `autogestor\.gitignore` → `coopluz\.gitignore` verbatim
- [x] T006 [P] Copiar `autogestor\.env.example` → `coopluz\.env.example`, atualizando o comentário para deixar explícito que é **o mesmo** `DATABASE_URL` do hub (mesmo Postgres) e trocando `SITE_URL` para `https://coopluz.roilabs.com.br`
- [x] T007 [P] Copiar `autogestor\.specify\memory\constitution.md` → `coopluz\.specify\memory\constitution.md` verbatim (rege o repositório novo a partir daqui)
- [x] T008 [P] Copiar os assets estáticos de `autogestor\public\` (`favicon.svg`, `favicon.png`, `apple-touch-icon.png`, `img\logo.svg`, `img\logo-escuro.svg`, `img\logo-mono.svg`, `img\icon-512.png`, `img\og.png`, `img\parceiros\coopluz.png`, `img\parceiros\sicoob.png`) → `coopluz\public\` nos mesmos caminhos
- [x] T009 [P] Copiar `autogestor\src\styles\global.css` → `coopluz\src\styles\global.css` verbatim (tokens de marca — nenhuma cor muda)
- [x] T010 Rodar `npm install` em `C:\dev\coopluz` (depende de T002)

**Checkpoint**: repositório instalável, sem nenhuma página ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tudo que toda página/rota depende — dados, motor de lead,
layout base, navegação. Nenhuma User Story começa antes disto terminar.

**⚠️ CRITICAL**: bloqueia as Phases 3–6.

- [x] T011 [P] Criar `coopluz\src\consts.ts` a partir de `autogestor\src\consts.ts` (mesmo `EMPRESA`, `ATENDIMENTO`, `whatsapp()`, `GA4` — ver `plan.md`/`research.md` sobre reaproveitar o mesmo GA4), com comentário de topo no formato já usado em `admin/lib/pipelines.mjs`: de onde veio, por que não importa o original, o que dispara atualização (Princípio II da constituição)
- [x] T012 [P] Criar `coopluz\src\data\solucoes.ts` reduzido: só `COOPLUZ` (ex-`SOLUCOES[0]`), `PARCEIRO_COOPLUZ`, `CIDADES_COOPLUZ`, `AREA_SERVIDA`, `ICONES.energia`, `porSlug()` restrita a essas 2 — mesmo comentário de origem de T011
- [x] T013 [P] Copiar `autogestor\src\lib\db.ts` → `coopluz\src\lib\db.ts` verbatim (mesmo Postgres, mesmas tabelas `crm_leads`/`crm_eventos` — ver `data-model.md`)
- [x] T014 [P] Copiar `autogestor\src\lib\lead.mjs` → `coopluz\src\lib\lead.mjs` verbatim
- [x] T015 [P] Copiar `autogestor\src\lib\tabela.mjs` → `coopluz\src\lib\tabela.mjs` verbatim
- [x] T016 [P] Copiar `autogestor\src\components\Logo.astro` → `coopluz\src\components\Logo.astro` verbatim
- [x] T017 [P] Copiar `autogestor\src\components\LeadForm.astro` → `coopluz\src\components\LeadForm.astro` verbatim
- [x] T018 [P] Copiar `autogestor\src\components\Faq.astro` → `coopluz\src\components\Faq.astro` verbatim
- [x] T019 [P] Copiar `autogestor\src\components\BarraAcao.astro` → `coopluz\src\components\BarraAcao.astro` verbatim
- [x] T020 Criar `coopluz\src\layouts\Base.astro` a partir do original: `@type` da Organization só `"Organization"` (remover `"InsuranceAgency"`), remover o campo `identifier` (SUSEP), `areaServed: AREA_SERVIDA.GO`, descrição da Organization reescrita para "parceira credenciada da cooperativa de energia Coopluz, atendendo a área de concessão da Equatorial Goiás", `WebSite.name` sem o sufixo "— hub de soluções", fallback de `site` para `https://coopluz.roilabs.com.br` (depende de T011)
- [x] T021 Criar `coopluz\src\layouts\Legal.astro` a partir do original: no bloco final "Como falar com a gente", trocar `"{EMPRESA.nomeLegal}, registro SUSEP nº {EMPRESA.susep}."` por `"{EMPRESA.nomeLegal}, parceira credenciada da Coopluz desde {EMPRESA.fundacao}."` (depende de T011)
- [x] T022 Criar `coopluz\src\components\Header.astro` a partir do original: `<nav>` com 3 itens fixos (Início `/`, Seja parceiro `/parceiro`, Blog `/blog`) em vez do `.map()` sobre `SOLUCOES` (depende de T012)
- [x] T023 Criar `coopluz\src\components\Footer.astro` a partir do original: remover a coluna/nav "Soluções" (lista de 6), remover a linha "Corretora registrada na SUSEP...", ajustar o texto de descrição da marca para energia por compensação em Goiás, manter coluna "Institucional" trocando `/seja-parceiro` por `/parceiro` e removendo o link duplicado (depende de T011, T012)
- [x] T024 [P] Copiar `autogestor\src\pages\robots.txt.ts` → `coopluz\src\pages\robots.txt.ts` verbatim (já é agnóstico de domínio via `site`)
- [x] T025 [P] Copiar `autogestor\src\pages\404.astro` → `coopluz\src\pages\404.astro`; abrir o arquivo e confirmar que não referencia `SOLUCOES` nem texto do hub — ajustar se referenciar
- [x] T026 Criar `coopluz\src\pages\api\lead.ts` a partir do original: `TODAS = [COOPLUZ, PARCEIRO_COOPLUZ]` no lugar de `[...SOLUCOES, PARCEIRO, PARCEIRO_COOPLUZ, GERAL]` — resto da lógica (rate limit, honeypot, fail-closed) inalterado (depende de T012, T013, T014; contrato em `contracts/post-api-lead.md`)
- [x] T027 [P] Copiar `autogestor\test\lead.test.mjs` → `coopluz\test\lead.test.mjs` verbatim
- [x] T028 [P] Copiar `autogestor\test\tabela.test.mjs` → `coopluz\test\tabela.test.mjs` verbatim
- [x] T029 Rodar `npm test` em `C:\dev\coopluz` e confirmar as duas suítes passando (depende de T014, T015, T027, T028)

**Checkpoint**: motor de lead, layout base e navegação prontos — as 4 User
Stories podem começar.

---

## Phase 3: User Story 1 - Reduzir a conta de luz vendo um site só sobre isso (Priority: P1) 🎯 MVP

**Goal**: Home autossuficiente que explica a oferta e captura o lead
principal, sem depender de o visitante conhecer o hub.

**Independent Test**: Abrir `/` sem navegação prévia, ler até o fim, enviar
o formulário do topo ou do fechamento, confirmar recebimento.

- [x] T030 [US1] Criar `coopluz\src\layouts\Vertical.astro` a partir do original: remover a seção "Também resolvemos / Outras soluções do hub" (bloco que itera `outras = SOLUCOES.filter(...)`) inteira, e no parágrafo de fechamento trocar "Corretora desde {EMPRESA.fundacao}, registro SUSEP {EMPRESA.susep}, com sede em {EMPRESA.endereco.cidade} e atendimento em todo o Brasil" por algo como "Parceira credenciada da Coopluz desde {EMPRESA.fundacao}, com sede em {EMPRESA.endereco.cidade}, atendendo a área de concessão da Equatorial Goiás" (depende de T020–T023)
- [x] T031 [US1] Criar `coopluz\src\pages\index.astro` portando o conteúdo de `autogestor\src\pages\coopluz.astro` (hero, "O problema", "Como funciona", "Quem pode participar", "Números da cooperativa", "Leia mais" com os 2 links de blog, "Quem está por trás", "Do outro lado do balcão"), usando o `Vertical.astro` local (T030); trocar o link `/coopluz/parceiro` por `/coopluz/parceiro` → `/parceiro`; `trilha` vira só `[{ nome: "Início", href: "/" }]` (página já é a Home, sem crumb próprio) (depende de T030, T012)
- [x] T032 [US1] Criar `coopluz\src\pages\obrigado.astro` portando o original: manter `export const prerender = false` e a lógica de `?erro=`; remover o bloco "Enquanto isso, veja as outras frentes" (`.map()` sobre `SOLUCOES`) — trocar por um link único de volta para `/` e, se fizer sentido no texto, para `/parceiro` (depende de T012)
- [x] T033 [US1] Verificação manual — seções 2 e 6 de `quickstart.md` (Home renderiza sem JS, envio com e sem JavaScript, aviso da faixa "Até R$ 250", falha honesta sem `DATABASE_URL`)

**Checkpoint**: User Story 1 completa e testável sozinha — já é um MVP
publicável.

---

## Phase 4: User Story 2 - Virar parceiro de energia em Goiás (Priority: P1)

**Goal**: Página de parceiros com formulário próprio, alcançável a partir da
Home.

**Independent Test**: A partir da Home, chegar em `/parceiro`, entender a
remuneração, enviar o formulário com cidade de atuação.

- [x] T034 [US2] Criar `coopluz\src\pages\parceiro.astro` portando `autogestor\src\pages\coopluz\parceiro.astro`: rota fica em `/parceiro` (não `/coopluz/parceiro`); `trilha` vira `[{ nome: "Início", href: "/" }, { nome: "Seja parceiro", href: "/parceiro" }]` (remove o crumb intermediário "Energia Coopluz", que não existe mais como página separada); no fechamento, trocar o link `"/coopluz"` (`"Veja como funciona a economia de 20%..."`) por `"/"` (depende de T012, T021, T017)
- [x] T035 [US2] Verificação manual — seção 3 de `quickstart.md` (link a partir da Home, remuneração clara, envio com cidade de atuação e com "Outra cidade de Goiás")

**Checkpoint**: User Stories 1 e 2 funcionam lado a lado.

---

## Phase 5: User Story 3 - Chegar pela busca de um assunto, não pela marca (Priority: P2)

**Goal**: Blog do cluster Coopluz publicado, cada artigo autossuficiente.

**Independent Test**: Abrir cada post pela URL direta, sem navegar a partir
da Home; confirmar conteúdo completo e link de volta para a oferta.

- [x] T036 [P] [US3] Copiar `autogestor\src\content.config.ts` → `coopluz\src\content.config.ts` verbatim (schema do blog não muda)
- [x] T037 [P] [US3] Copiar `autogestor\src\content\blog\reduzir-conta-equatorial-sem-placa-solar.md` → `coopluz\src\content\blog\reduzir-conta-equatorial-sem-placa-solar.md` verbatim
- [x] T038 [P] [US3] Copiar `autogestor\src\content\blog\fio-b-60-por-cento-2026-conta-equatorial-goias.md` → `coopluz\src\content\blog\fio-b-60-por-cento-2026-conta-equatorial-goias.md` verbatim
- [x] T039 [US3] Criar `coopluz\src\pages\blog\index.astro` portando o original (já é escopado ao cluster Coopluz — sem mudança de conteúdo esperada, só conferir que nenhum texto residual fala de "outras verticais") (depende de T036–T038)
- [x] T040 [US3] Copiar `autogestor\src\pages\blog\[slug].astro` → `coopluz\src\pages\blog\[slug].astro` verbatim (já é genérico o suficiente) (depende de T036–T038)
- [x] T041 [US3] Verificação manual — seção 4 de `quickstart.md` (índice só com os 2 posts, cada post completo no HTML, link de volta para a oferta)

**Checkpoint**: as 3 primeiras User Stories funcionam juntas.

---

## Phase 6: User Story 4 - Consultor atende o lead sem aprender ferramenta nova (Priority: P3)

**Goal**: Confirmar que os leads dos dois formulários (Home e Parceiro) caem
no painel administrativo já existente, sem alteração nele.

**Independent Test**: Enviar um lead pelo site novo e encontrá-lo no funil
certo do painel administrativo do hub, sem tocar no código do admin.

- [x] T042 [US4] Conferir (sem editar) que `autogestor\admin\lib\pipelines.mjs` já lista `coopluz` e `parceiro` — nenhuma mudança de código no admin é necessária para esta feature (FR-017); registrar a confirmação no relato de conclusão
- [x] T043 [US4] Verificação manual — seção 5 de `quickstart.md` (lead enviado pelo site novo aparece na coluna "Novo" do pipeline correto no painel administrativo do hub) (depende de T026, T013)
- [x] T044 [US4] Verificação manual — seção 6 de `quickstart.md` repetida aqui sob a ótica do painel: sem `DATABASE_URL`, nenhum lead fantasma aparece no admin, e o site mostra o WhatsApp

**Checkpoint**: as 4 User Stories completas e verificadas.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Páginas institucionais/legais (que dependem do site inteiro
existir para fazer sentido), varredura de URLs e portão de qualidade final.

- [x] T045 [P] Reescrever `coopluz\src\pages\sobre.astro`: só Coopluz/Autogestor como parceira credenciada (fundação 2004, endereço, WhatsApp — dado de `consts.ts`), sem a grade de 6 soluções, sem a pergunta de FAQ sobre registro SUSEP; dobra em contato (endereço/WhatsApp/e-mail), já que este site não tem rota `/contato` própria (ver `plan.md`, Structure Decision)
- [x] T046 [P] Reescrever `coopluz\src\pages\privacidade.astro`: mesma estrutura LGPD (controlador, dados coletados, finalidade, prazos, direitos), mas a lista de "com quem compartilhamos" reduzida à cooperativa de energia + prestadores de infraestrutura (remover seguradoras, administradoras de consórcio, instituições financeiras, operadoras de turismo)
- [x] T047 [P] Reescrever `coopluz\src\pages\termos.astro`: "Limites de cada solução" só com o item de energia por compensação; parágrafo de intermediação reescrito para "parceira credenciada da Coopluz" (sem SUSEP, sem "nas demais frentes"); remover o restante das seções específicas de outras verticais
- [x] T048 Reescrever `coopluz\src\pages\llms.txt.ts`: uma "Solução" (Coopluz) em vez do `.map()` sobre `SOLUCOES`, "Guias" com os 2 posts, "Institucional" só com os links que existem neste site (`/sobre`, `/parceiro`, `/privacidade`, `/termos`) — remover o bloco de "Limites que valem citar" específico de outras verticais (repasse, seguro, consórcio) e manter só o que vale para energia
- [x] T049 Varredura em todo o repositório `coopluz\` por `autogestor.roilabs.com.br` residual (fallback de `site` em `Base.astro`, `Vertical.astro`, `parceiro.astro`, `blog/index.astro`, `blog/[slug].astro`) e substituir por `coopluz.roilabs.com.br` (FR-016) — checar com uma busca de texto antes de fechar a tarefa
- [x] T050 Rodar `npm run build` em `C:\dev\coopluz`; confirmar build sem erro, que `dist\sitemap-index.xml` referencia `coopluz.roilabs.com.br`, e conferir (painel de rede do navegador, filtro JS, nas páginas de T031/T034/T040) que o JavaScript por página não ultrapassa perceptivelmente o ~1 KB já praticado no hub (SC-005)
- [ ] T051 Rodar a skill `ui-verification` sobre `/`, `/parceiro` e um post de blog (árvore de acessibilidade, passagem de teclado nas 3 larguras, console limpo, screenshot antes/depois) — portão exigido pela constituição para tela nova ou alterada. **Dobrado no `/design-review` pedido pelo dono do projeto logo em seguida**, em vez de rodado isoladamente aqui — design-review já orquestra ui-verification como parte da auditoria completa.
- [x] T052 Escrever `coopluz\README.md` registrando as decisões não óbvias: fork por reaproveitamento do hub, banco compartilhado, e as 3 decisões de infraestrutura sinalizadas em `plan.md` (GA4 reaproveitado, imagem OG reaproveitada, conteúdo duplicado temporário com o hub)
- [x] T053 `git add` + primeiro commit em `C:\dev\coopluz` (sem push — não há remote configurado; abrir repositório no GitHub/hospedagem fica para o dono revisar)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende de Setup — bloqueia as Phases 3–6.
- **User Stories (Phase 3–6)**: todas dependem só de Foundational, não umas
  das outras — podem rodar em paralelo se houver mais de um executor.
- **Polish (Phase 7)**: depende de Phases 3–6 completas (as reescritas legais
  e o `llms.txt` referenciam páginas que precisam existir antes).

### User Story Dependencies

- **US1 (Home)**: nenhuma dependência de outra story.
- **US2 (Parceiro)**: nenhuma dependência de código de US1; o texto de
  fechamento linka para `/`, que só faz sentido depois de T031 existir —
  ordem sugerida, não bloqueio técnico.
- **US3 (Blog)**: nenhuma dependência de código de US1/US2.
- **US4 (Lead no painel)**: depende de T026 (api/lead) e de pelo menos um
  formulário existir para gerar um lead de teste (T031 ou T034).

### Parallel Opportunities

- Todas as tarefas `[P]` de Setup e de Foundational.
- US1, US2 e US3 podem ser desenvolvidas em paralelo por pessoas/agentes
  diferentes depois do Checkpoint da Phase 2.
- Dentro da Phase 7: T045, T046, T047 são arquivos diferentes e paralelas.

---

## Parallel Example: Foundational

```text
Task: "Copiar src/lib/db.ts verbatim (T013)"
Task: "Copiar src/lib/lead.mjs verbatim (T014)"
Task: "Copiar src/lib/tabela.mjs verbatim (T015)"
Task: "Copiar src/components/LeadForm.astro verbatim (T017)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) → Phase 2 (Foundational, bloqueante) → Phase 3 (US1).
2. Parar e validar US1 sozinha (T033).
3. Nesse ponto já existe um site publicável (Home + formulário + fail-honesto).

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 → validar → já é MVP.
3. US2 → validar → programa de parceiros ativo.
4. US3 → validar → blog no ar, ganho de SEO/GEO.
5. US4 → validar → confirma que nada quebrou no lado do painel administrativo.
6. Polish → páginas legais, varredura de domínio, portão de UI, commit inicial.

---

## Notes

- Nenhuma tarefa cria schema de banco — `lib/db.ts` copiado já roda
  `CREATE TABLE IF NOT EXISTS` contra o banco que **já tem** as tabelas
  (ver `data-model.md`).
- "Copiar verbatim" significa **copiar o arquivo**, não importar do hub —
  os dois repositórios não têm dependência de build um no outro (`plan.md`,
  Structure Decision).
- Rodar `/speckit-analyze` depois desta lista e antes de `/speckit-implement`
  é recomendado pela constituição do hub para features que tocam banco,
  autenticação ou interface pública — esta feature toca banco (mesmo que só
  para gravar, sem schema novo) e interface pública.
