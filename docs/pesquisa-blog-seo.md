# Pesquisa — blog de conteúdo (SEO/GEO)

Pesquisa qualitativa por WebSearch (SERP + People Also Ask), feita em 2026-08-19. Sem
dado de volume real — não há Search Console nem Ahrefs/Semrush disponíveis. Priorização
por concorrência de SERP e sinal de intenção, não por número de busca.

## Premissa

Impressão alta e clique com intenção alta puxam para lados opostos num domínio novo.
Head terms ("consórcio", "financiamento") têm SERP dominada por bancos e grandes
administradoras — ranquear ali dá impressão em posição irrelevante e CTR perto de
zero. O volume que converte está no long-tail de decisão e nas dúvidas locais, onde
autoridade de domínio pesa menos e estrutura extraível (ver skill `seo-geo`) pesa mais.

## Clusters, em ordem de ataque

| Vertical | Pilar | Spokes | Por que essa posição |
|---|---|---|---|
| **Coopluz** (1º) | Como reduzir a conta da Equatorial Goiás sem placa solar | Fio B 60% em 2026 · bandeira tarifária · cooperativa vs. solar próprio | SERP fraca + local + notícia recorrente (conta "dobrando" em Goiás). Único cluster com chance real de #1 em 3 meses. |
| **Seguro** (2º) | Seguro ou proteção veicular: a diferença depois da LC 213/2025 | Seguro de caminhão · sinistro negado · seguro para motorista de app | LC 213/2025 é mudança regulatória recente — janela de conteúdo aberta, e a Autogestor tem SUSEP desde 2004 para citar como fonte primária. |
| **Financiamento** (3º) | Financiamento de veículo com score baixo: o que dá pra fazer | CDC vs. leasing vs. consórcio · taxa por banco 2026 · financiamento PJ | "Nome sujo/score" é intenção alta com SERP de blog fraco (muito comparador raso). |
| **Consórcio** (4º) | Consórcio contemplado: como comprar e o que conferir | Lance embutido vs. livre · carta reajusta por INCC/IPCA (mito) · consórcio como investimento | Head term perdido; dinheiro está na cauda de "contemplado"/"lance". |
| **Viagens** (5º, adiado) | Parcelar passagem sem cartão: como funciona de verdade | Boleto parcelado tem juros? · tarifa de agência vs. site da cia | SERP dominada por Decolar/Skyscanner/Viajanet. Cluster mais fraco — deixar por último. |

## Fatos usados nos posts (com fonte)

- Fio B: 15% (2023) → 30% (2024) → 45% (2025) → 60% (2026) → 100% (projeção 2029),
  Lei 14.300/2022. Fonte: [Canal Solar](https://canalsolar.com.br/consumidores-60-do-fio-b-2026/).
- GD I (protocolo até 06/01/2023) mantém compensação integral até 2045, sem Fio B;
  GD II segue a tabela progressiva. Mesma fonte.
- Diferença seguro vs. proteção veicular, incluindo a LC 213/2025 que deu marco
  regulatório à proteção veicular mutualista. Fonte: [Suhai Seguradora](https://suhaiseguradora.com/blog/seguro/diferenca-entre-seguro-e-protecao-veicular/).
- Consórcio sem juros vs. financiamento com juros; consórcio exige espera até
  contemplação. Fonte: [C6 Bank](https://www.c6bank.com.br/blog/diferenca-entre-consorcio-e-financiamento).
- Taxas de financiamento de veículo em 2026: 0,85%–1,5% a.m. com bom score, acima de
  2,5% a.m. com restrição. Fonte: [Creditas](https://www.creditas.com/exponencial/taxa-de-juros-financiamento-de-veiculo/).
- Carro de repasse custa 10–20% menos que seminovo comum, mas costuma vir sem
  garantia. Fonte: [Vrum](https://www.vrum.com.br/mercado/2026/07/7470748-vale-a-pena-comprar-um-carro-de-repasse-entenda-os-riscos-e-as-vantagens.html).
- Boleto parcelado de passagem aérea tem juros/taxa de serviço e passa por análise
  de crédito. Fonte: [Canal Quero Viajar](https://www.canalqueroviajar.com.br/passagem-aerea-boleto-parcelado/).

Números de bandeira tarifária (R$/100kWh) encontrados durante a pesquisa **não entraram
nos posts**: a fonte (notícia local) não deixava claro se o valor ainda era válido na
data de publicação — regra da skill `seo-geo` é não citar número sem certeza da fonte.
Os posts descrevem o mecanismo da bandeira (ANEEL, verde/amarela/vermelha) sem fixar
um valor atual.

## O que foi implementado (2/2026-08-19)

Cluster Coopluz, pilar + 1 spoke:

- [`reduzir-conta-equatorial-sem-placa-solar.md`](../src/content/blog/reduzir-conta-equatorial-sem-placa-solar.md) — pilar
- [`fio-b-60-por-cento-2026-conta-equatorial-goias.md`](../src/content/blog/fio-b-60-por-cento-2026-conta-equatorial-goias.md) — spoke

Infra: `src/content.config.ts` (collection `blog`, loader `glob`), rotas
`src/pages/blog/index.astro` e `src/pages/blog/[slug].astro` (schema `BlogPosting` no
`@graph`, reaproveita `Base.astro`), link cruzado pilar↔spoke, link de `/coopluz` para
os dois posts, e "Blog" no rodapé.

## Pendente (não implementado agora)

- Clusters de Seguro, Financiamento, Consórcio e Viagens — mesma estrutura, outro `vertical`.
- `llms.txt` ainda não lista os posts do blog — adicionar quando o cluster tiver mais
  de um vertical publicado, para não virar manutenção de lista antes de haver volume.
- Autor do post sem `sameAs` próprio — hoje herda a Organization inteira via `author`.
- Calendário editorial / cadência de publicação.
- Priorização por dado real de busca: assim que houver 30 dias de Search Console,
  reordenar os clusters por impressão/CTR real em vez de sinal qualitativo de SERP.
