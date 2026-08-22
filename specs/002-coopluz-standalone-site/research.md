# Research: Site Próprio da Coopluz

Nenhum item do Technical Context ficou marcado `NEEDS CLARIFICATION` — o
projeto herda stack, banco e padrões de um sistema já em produção
(`C:\dev\autogestor`). A pesquisa aqui não é "qual tecnologia escolher", é
"confirmar que reaproveitar é seguro e nomear o que fica de fora".

## Decisão: fork por cópia, não link/import entre repositórios

**Decisão**: O novo site é um repositório Git independente com seus próprios
arquivos — sem `npm link`, sem submódulo Git, sem pacote compartilhado
publicado.

**Rationale**: A constituição do hub já estabelece esse padrão entre
`autogestor` (raiz) e `admin/` — "Nenhum pacote compartilhado, nenhum
monorepo, nenhum import atravessando a fronteira" — pelo motivo de que os
dois builds e deploys devem ser totalmente independentes. O mesmo raciocínio
vale, com mais força ainda, entre dois repositórios físicos separados. Um
pacote compartilhado exigiria registry privado, versionamento e processo de
publish para sincronizar ~10 constantes (NAP) e uma lista de 2 itens
(soluções Coopluz) — infraestrutura nova maior que o problema que resolveria.

**Alternativas consideradas**:
- *Monorepo com workspaces* (npm/pnpm workspaces): rejeitado — exigiria
  migrar o hub também, fora do escopo desta feature, e a constituição do hub
  proíbe explicitamente.
- *Pacote npm privado com as constantes compartilhadas*: rejeitado — troca
  duplicação de ~200 linhas por um serviço de registry a manter, para dados
  que mudam raramente (endereço, telefone, fundação).
- *Extrair a Coopluz como rota do próprio hub com rewrite de subdomínio na
  hospedagem* ("caminho rápido" do doc de arquitetura): rejeitado —
  `docs/estrutura-hub-e-subdominios.md` já recomenda explicitamente o
  "caminho completo" (projeto próprio) para a Coopluz especificamente,
  citando profundidade e identidade de conteúdo como motivo.

## Decisão: mesmo Postgres, mesmo schema, zero mudança no admin

**Decisão**: O site novo grava na mesma instância Postgres do hub, mesmas
tabelas `crm_leads`/`crm_eventos`, mesmo `pipeline: "coopluz"` que o painel
administrativo já lê hoje.

**Rationale**: É a decisão mais importante da spec (FR-005). O painel
administrativo (`admin/`) já existe, já está verificado, e já tem
`coopluz` cadastrado em `admin/lib/pipelines.mjs` — criar um banco ou painel
paralelo duplicaria um sistema que já funciona, e faria o consultor precisar
checar dois lugares para atender leads da mesma vertical.

**Alternativas consideradas**:
- *Banco Postgres próprio para o site novo*: rejeitado — quebraria a User
  Story 4 da spec (lead cai no mesmo painel sem configuração nova) e
  duplicaria infraestrutura sem motivo.
- *Webhook do site novo para uma API do hub, que grava*: rejeitado —
  acoplamento em runtime entre os dois projetos (o site novo passaria a
  depender do hub estar no ar para captar lead), exatamente o que a
  constituição do hub probíbe ("nenhum import atravessando a fronteira",
  e por extensão, nenhuma chamada de runtime).

## Decisão: mesma propriedade GA4 do hub (não cria nova)

**Decisão**: Reaproveita `G-SHG12H2NZX`.

**Rationale**: GA4 já suporta múltiplos hosts numa propriedade só,
distinguíveis pela dimensão de hostname. Criar propriedade nova é uma
decisão de produto/medição, não uma necessidade técnica — e trocar depois é
uma linha em `consts.ts`, sem custo de migração.

**Alternativas consideradas**:
- *Propriedade GA4 dedicada à Coopluz*: viável e talvez preferível a médio
  prazo (medição mais limpa por domínio), mas exige criar conta/propriedade
  no Google Analytics — passo manual fora do que este plano de engenharia
  controla. Sinalizado no `plan.md` como decisão de infraestrutura para
  revisão humana, não decidido a favor por padrão.

## Decisão: sem `/contato` como rota própria

**Decisão**: Informação de contato mora em `/sobre`, como já é no hub —
nenhuma rota `/contato` nova.

**Rationale**: O hub, que já resolveu esse problema de produto, optou por
não ter página de contato separada. Seguir o padrão já validado é mais
simples do que inventar uma rota nova para o mesmo conteúdo (endereço,
WhatsApp, e-mail) que já vive em `/sobre` e no rodapé de toda página.

**Alternativas consideradas**:
- *Rota `/contato` dedicada*: rejeitado — abstração nova sem necessidade
  demonstrada; o hub nunca precisou dela.

## Confirmação: Vercel como plataforma de deploy

**Decisão**: Mesmo adapter (`@astrojs/vercel`), novo projeto Vercel
apontando para o repositório `coopluz`, domínio `coopluz.roilabs.com.br`
configurado no projeto.

**Rationale**: Mesma plataforma do hub e do painel administrativo — nenhum
motivo para introduzir uma segunda plataforma de hospedagem para um site do
mesmo grupo, mesmo stack.

**Alternativas consideradas**: Nenhuma seriamente cogitada — não há
requisito que a Vercel não atenda, e trocar de plataforma fragmentaria as
credenciais e o conhecimento operacional já existentes.
