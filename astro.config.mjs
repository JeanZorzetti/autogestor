// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { readdirSync } from "node:fs";
import { escopoDeCabecalho } from "./src/lib/tabela.mjs";

// URL base vem do ambiente porque cada vertical vira subdomínio próprio depois
// (seguro.autogestor.com.br etc). Canonical e sitemap saem daqui — errar isso
// publica canonical apontando para o domínio de preview.
const site = process.env.SITE_URL ?? "https://autogestor.roilabs.com.br";

const blogVazio = readdirSync("./src/content/blog").filter((f) => f.endsWith(".md")).length === 0;

export default defineConfig({
  site,
  // Estático: 11 páginas de conteúdo que não mudam por request. O único
  // endpoint dinâmico (/api/lead) se declara com `prerender = false`.
  output: "static",
  adapter: vercel(),
  // Com o cluster de energia migrado, o blog ficou sem post e a página se
  // declara `noindex`. Listar no sitemap uma URL marcada como noindex é
  // mandar duas instruções contraditórias — o mesmo defeito que a `canonical`
  // do /404 tinha. Lido do disco em vez de fixado numa lista: quando o
  // primeiro post do próximo cluster entrar, o /blog volta ao sitemap sozinho.
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/obrigado") && !(blogVazio && page.replace(/\/$/, "").endsWith("/blog")),
    }),
  ],
  trailingSlash: "never",
  // As quatro URLs da vertical de energia migraram para o site próprio da
  // Coopluz. Elas SAÍRAM daqui — este hub não as publica mais — e cada uma
  // responde 301 para o caminho equivalente lá.
  //
  // Por que 301 e não `canonical` cruzada: canonical mantém as duas páginas
  // servindo 200 e depende de o buscador acatar uma dica. 301 é instrução,
  // consolida a autoridade de link que os dois artigos já acumularam, e não
  // deixa a versão duplicada acessível. As duas versões existiam ao mesmo
  // tempo desde a spec 002; era canibalização literal, não risco teórico.
  //
  // O adaptador Vercel transforma isto em rota de redirect de verdade na
  // configuração de saída — não em <meta refresh> numa página HTML.
  //
  // Nenhum link interno passa por aqui: `hrefSolucao()` em src/data/solucoes.ts
  // já manda o visitante direto ao destino. Estes redirects são para quem
  // chega de fora — buscador, link salvo, mensagem antiga.
  redirects: {
    "/coopluz": { status: 301, destination: "https://coopluz.roilabs.com.br/" },
    "/coopluz/parceiro": { status: 301, destination: "https://coopluz.roilabs.com.br/parceiro" },
    "/blog/reduzir-conta-equatorial-sem-placa-solar": {
      status: 301,
      destination: "https://coopluz.roilabs.com.br/blog/reduzir-conta-equatorial-sem-placa-solar",
    },
    "/blog/fio-b-60-por-cento-2026-conta-equatorial-goias": {
      status: 301,
      destination: "https://coopluz.roilabs.com.br/blog/fio-b-60-por-cento-2026-conta-equatorial-goias",
    },
  },
  markdown: { rehypePlugins: [escopoDeCabecalho] },
  build: { inlineStylesheets: "always" },
  image: { responsiveStyles: true },
});
