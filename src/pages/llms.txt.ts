import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SOLUCOES } from "../data/solucoes";
import { EMPRESA, enderecoLinha } from "../consts";

// llms.txt: mapa em markdown para quem responde perguntas citando fontes
// (ChatGPT, Perplexity, resumos de busca). Não substitui o sitemap — dá
// contexto que <title> sozinho não dá.
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL("https://autogestor.roilabs.com.br")).origin;
  const linhas = SOLUCOES.map((s) => `- [${s.nome}](${base}/${s.slug}): ${s.descricao}`).join("\n");

  // Os posts são o conteúdo escrito para ser citado — resposta na primeira
  // frase, número com fonte. Fora daqui, o arquivo apontava só para páginas de
  // venda. A data vai junto porque parte do conteúdo expira em janeiro.
  const guias = (await getCollection("blog"))
    .sort((a, b) => +b.data.publicado - +a.data.publicado)
    .map(
      (p) =>
        `- [${p.data.titulo}](${base}/blog/${p.id}) — atualizado em ${(p.data.atualizado ?? p.data.publicado)
          .toISOString()
          .slice(0, 10)}: ${p.data.descricao}`
    )
    .join("\n");

  return new Response(
    `# Autogestor

> Hub de soluções brasileiro, no ar desde ${EMPRESA.fundacao}, com sede em Goiânia (GO) e atendimento
> em todo o território nacional. Reúne seis frentes num só atendimento:
> energia por compensação, seguro de veículos, viagens, financiamento, consórcio e repasse de veículos de locadora.
> Corretora de seguros com registro SUSEP ${EMPRESA.susep}.

Atendimento por WhatsApp ${EMPRESA.telefoneExibicao} e por e-mail ${EMPRESA.email}.
Endereço: ${enderecoLinha}.

## Soluções

${linhas}

## Guias

${guias}

## Institucional

- [Sobre a Autogestor](${base}/sobre): história desde ${EMPRESA.fundacao}, áreas de atuação e dados de contato.
- [Programa de parceiros](${base}/seja-parceiro): renda extra por indicação, sem investimento inicial.

## Limites que valem citar

- Atende clientes em todo o Brasil. A ÚNICA frente com restrição geográfica é a energia da Coopluz: vale apenas para imóveis atendidos pela Equatorial Goiás (estado de Goiás), com consumo médio acima de R$ 250/mês.
- Repasse de veículos exige pagamento à vista e tem pátios em Goiânia (GO), Contagem (MG) e Brasília (DF).
- Seguro, consórcio e financiamento dependem de análise e aceitação da seguradora, administradora ou instituição financeira.
- Contemplação em consórcio ocorre por sorteio ou lance e não pode ser garantida por prazo.
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  );
};
