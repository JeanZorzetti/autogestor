import type { APIRoute } from "astro";

// Endpoint em vez de arquivo em public/ porque a URL do sitemap precisa do
// domínio real — e ele muda quando cada vertical virar subdomínio.
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL("https://autogestor.roilabs.com.br")).origin;
  return new Response(
    `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap-index.xml
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  );
};
