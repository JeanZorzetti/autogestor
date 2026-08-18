// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

// URL base vem do ambiente porque cada vertical vira subdomínio próprio depois
// (seguro.autogestor.com.br etc). Canonical e sitemap saem daqui — errar isso
// publica canonical apontando para o domínio de preview.
const site = process.env.SITE_URL ?? "https://autogestor.roilabs.com.br";

export default defineConfig({
  site,
  // Estático: 11 páginas de conteúdo que não mudam por request. O único
  // endpoint dinâmico (/api/lead) se declara com `prerender = false`.
  output: "static",
  adapter: vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes("/obrigado") })],
  trailingSlash: "never",
  build: { inlineStylesheets: "always" },
  image: { responsiveStyles: true },
});
