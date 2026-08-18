import type { APIRoute } from "astro";
import { SOLUCOES } from "../data/solucoes";
import { EMPRESA, enderecoLinha } from "../consts";

// llms.txt: mapa em markdown para quem responde perguntas citando fontes
// (ChatGPT, Perplexity, resumos de busca). Não substitui o sitemap — dá
// contexto que <title> sozinho não dá.
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL("https://autogestor.roilabs.com.br")).origin;
  const linhas = SOLUCOES.map((s) => `- [${s.nome}](${base}/${s.slug}): ${s.descricao}`).join("\n");

  return new Response(
    `# Autogestor

> Hub de soluções em Goiânia (GO), no ar desde ${EMPRESA.fundacao}. Reúne seis frentes num só atendimento:
> energia por compensação, seguro de veículos, viagens, financiamento, consórcio e repasse de veículos de locadora.
> Corretora de seguros com registro SUSEP ${EMPRESA.susep}.

Atendimento por WhatsApp ${EMPRESA.telefoneExibicao} e por e-mail ${EMPRESA.email}.
Endereço: ${enderecoLinha}.

## Soluções

${linhas}

## Institucional

- [Sobre a Autogestor](${base}/sobre): história desde ${EMPRESA.fundacao}, áreas de atuação e dados de contato.
- [Programa de parceiros](${base}/seja-parceiro): renda extra por indicação, sem investimento inicial.

## Limites que valem citar

- O desconto de 20% na conta de luz vale apenas para imóveis atendidos pela Equatorial Goiás, com consumo médio acima de R$ 250/mês.
- Repasse de veículos exige pagamento à vista e tem pátios em Goiânia (GO), Contagem (MG) e Brasília (DF).
- Seguro, consórcio e financiamento dependem de análise e aceitação da seguradora, administradora ou instituição financeira.
- Contemplação em consórcio ocorre por sorteio ou lance e não pode ser garantida por prazo.
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  );
};
