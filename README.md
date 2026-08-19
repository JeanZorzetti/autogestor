# Autogestor — hub

Site institucional da Autogestor em Astro, otimizado para busca. Uma página por
vertical de negócio, todas estáticas, com um único endpoint dinâmico para captura
de lead.

Produção: `autogestor.roilabs.com.br` (Vercel) · Banco: Postgres no EasyPanel.

## Stack

| Peça | Escolha | Por quê |
|---|---|---|
| Framework | Astro 5, `output: "static"` | HTML pronto no source é o que o crawler indexa e o que dá o melhor LCP |
| Estilo | CSS puro com custom properties | Nenhuma dependência; o Astro já escopa estilo por componente |
| JavaScript no cliente | ~1 KB, só o realce do formulário | O site funciona inteiro sem ele |
| Banco | Postgres via `pg` | Mesmas tabelas `crm_*` do roihub, para o `/admin` em Next.js ler sem tradutor |
| Deploy | Vercel (`@astrojs/vercel`) | 11 páginas estáticas + 1 função (`/api/lead` e `/obrigado`) |

## Rodando

```bash
npm install
npm run dev            # sem banco: o formulário responde 503 e mostra o WhatsApp
npm test               # validação de telefone e do payload de lead
npm run build
```

Para exercitar a gravação de lead localmente:

```bash
docker run -d --name ag-pg -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=autogestor -p 55432:5432 postgres:16-alpine
export DATABASE_URL="postgres://postgres:teste@localhost:55432/autogestor"
npm run dev
```

O schema é criado sozinho na primeira gravação (`CREATE TABLE IF NOT EXISTS`).

> **Pegadinha:** o Astro carrega `.env` para `import.meta.env`, não para
> `process.env`. O código lê `process.env` porque é isso que a Vercel entrega em
> runtime — então, localmente, **exporte** a variável em vez de só criar o `.env`.

## Estrutura

```
src/
  consts.ts              NAP (nome/endereço/telefone) e links externos, num lugar só
  data/solucoes.ts       as 6 verticais: slug, títulos, campo do formulário, ícone
  layouts/
    Base.astro           <head>, canonical, Open Graph e o @graph de JSON-LD
    Vertical.astro       esqueleto compartilhado das 6 páginas de solução
  components/            Header, Footer, LeadForm, Faq, SolucaoCard
  lib/
    lead.mjs             validação pura (é o que `node --test` importa)
    db.ts                pool do Postgres e gravação do lead
  pages/
    api/lead.ts          único endpoint dinâmico
    robots.txt.ts        endpoint porque a URL do sitemap depende do domínio
    llms.txt.ts          mapa em markdown para motores de resposta (GEO/AEO)
```

## Decisões que não são óbvias no código

- **O laranja do CTA usa texto escuro, não branco.** O laranja da logo (`#E47A45`)
  com texto branco dá 2.93:1 e reprova em WCAG AA; com texto tinta dá 5.94:1.
  Escurecer o laranja passaria no contraste mas perderia a cor da marca.
- **O formulário da home usa `GERAL`, não uma vertical.** O `select` de contexto
  pergunta qual das seis frentes a pessoa procura — o lead sai com essa resposta
  em vez de sair sem contexto nenhum.
- **O formulário tem 3 campos.** O site antigo pedia 6. E-mail saiu porque o canal
  de atendimento real é o WhatsApp.
- **Barra de ação fixa só no celular.** O cabeçalho não é sticky abaixo de 900px
  (tem 226px), e as páginas de vertical passam de 8.000px: entre o formulário do
  topo e o do fim havia 3.845px sem nenhuma ação na tela. A barra custa 56px e um
  `IntersectionObserver` a esconde enquanto um formulário está visível — parada
  ali, ela cobriria justamente o botão de enviar.
- **Sem menu hambúrguer.** As 6 verticais cabem numa barra que quebra em duas
  linhas no celular; menu fechado esconde exatamente o que a pessoa veio procurar.
  O cabeçalho só é `sticky` a partir de 900px — no celular ele tem 209px de altura.
- **FAQ em `<details>` nativo.** Teclado e estado de graça, e a resposta fica no
  HTML mesmo fechada, que é o que o `FAQPage` do JSON-LD precisa espelhar.
- **O tema escuro é o mesmo azul com a luz apagada.** A rampa inteira sai de
  `#022C69` variando só a luminosidade, e a cor fica no papel que já tinha no
  claro: o bloco de marca (`.secao--marca` e rodapé). No claro esse bloco é a
  superfície mais escura da página; no escuro, a mais clara — a hierarquia
  inverte, o papel não. Custa 1.070 bytes de CSS e 870 de JavaScript inline.
- **Um valor por token, via `light-dark()`.** Os dois temas ficam lado a lado na
  mesma declaração. A alternativa — `@media (prefers-color-scheme)` mais
  `:root[data-tema]` repetindo a lista — escreveria cada cor escura duas vezes,
  e quem ajustasse uma esqueceria a outra. Por tabela, o seletor manual sai de
  graça: `color-scheme: only light|dark` reposiciona os tokens *e* os controles
  nativos de uma vez.
- **O `@supports` de `light-dark()` não é adorno.** Sem suporte, a declaração
  fica inválida no tempo de computação e `background: var(--fundo)` cai para
  transparente — o fundo do botão laranja sumiria. Com a guarda, quem não
  suporta fica no claro de hoje, intacto, e o botão de tema nem aparece (o
  script checa `CSS.supports` antes de revelar).
- **O botão de tema mora no rodapé, não no cabeçalho.** A primeira linha do
  cabeçalho já leva logo e WhatsApp; um quarto item quebrava para outra linha e
  194px de cabeçalho viravam 254px, fixos em toda rolagem no celular, por um
  controle usado uma vez por visita.
- **O script do tema é `is:inline` no `<head>`.** Se o Astro o empacotasse num
  módulo com `defer`, ele rodaria depois da primeira pintura — que é exatamente
  a piscada que ele existe para evitar.
- **`--superficie-alta` existe por causa do escuro.** No claro ela é o mesmo
  branco do fundo e quem separa o cartão é a borda. No escuro precisa ser um
  degrau *acima* do fundo — cartão mais escuro que a seção faz o conteúdo
  parecer afundado, que é o erro clássico de dark mode.
- **O rodapé não tem `margin-top`.** A última seção já entrega `--e-16` de
  respiro; a margem somava outros 64px de faixa vazia entre o fim do conteúdo e
  o bloco escuro — no tema escuro isso virava uma tira morta bem visível.
- **`/obrigado` é renderizada no servidor.** Precisa ler `?erro=1` do redirect do
  endpoint; se fosse estática, quem enviou sem JavaScript e errou o telefone leria
  "pedido recebido" — a página mentiria justamente para quem não foi atendido.

## Virar subdomínios depois

Cada vertical vai virar um site institucional em `<slug>.autogestor.com.br`. O
código já está pronto para isso: `slug` em `src/data/solucoes.ts` é o nome do
futuro subdomínio, nenhuma página depende de estar no mesmo host, e `SITE_URL`
controla canonical, sitemap e `og:url`. Na migração, ou se aponta o subdomínio
para este mesmo deploy com rewrite na Vercel, ou se extrai a página para um
projeto próprio reusando `layouts/` e `components/`.

## O que ainda não existe

- `/admin` em Next.js lendo `crm_leads` (o motivo de o banco existir).
- Fonte da marca: hoje o site usa a stack de sistema, que custa 0 KB.
- Terceiro estado do tema ("voltar ao sistema"). O botão alterna entre claro e
  escuro; depois do primeiro clique a escolha fica salva até alguém limpar o
  `localStorage`.
- Analytics e rastreio de conversão.
