// 8 pipelines do site + 5 etapas fixas. Duplicação deliberada de
// src/data/solucoes.ts: importar aquele arquivo puxaria FAQ, textos e campos
// de formulário para o bundle do admin e acoplaria os dois builds.
// ponytail: slugs e etapas são estáveis e já vivem no banco (crm_leads.pipeline/etapa) —
// atualizar aqui só quando uma vertical nova entrar no site.

export const ETAPAS = ["novo", "contato", "proposta", "ganho", "perdido"];

export const NOMES_ETAPA = { novo: "Novo", contato: "Contato", proposta: "Proposta", ganho: "Ganho", perdido: "Perdido" };

export const PIPELINES = [
  { slug: "coopluz", nome: "Energia Coopluz" },
  { slug: "seguro", nome: "Seguro" },
  { slug: "viagens", nome: "Viagens" },
  { slug: "financiamento", nome: "Financiamento" },
  { slug: "consorcio", nome: "Consórcio" },
  { slug: "repasse", nome: "Repasse de veículos" },
  { slug: "parceiro", nome: "Programa de parceiros" },
  { slug: "geral", nome: "Captação geral" },
];

/** Limiar de "parado" (dias na etapa atual) por etapa — usado no Painel. */
export const LIMIAR_PARADO = { novo: 1, contato: 5, proposta: 7 };

export function nomeDoPipeline(slug) {
  return PIPELINES.find((p) => p.slug === slug)?.nome ?? slug;
}

export function nomeDaEtapa(etapa) {
  return NOMES_ETAPA[etapa] ?? etapa;
}

export function pipelineValido(slug) {
  return PIPELINES.some((p) => p.slug === slug);
}

export function etapaValida(etapa) {
  return ETAPAS.includes(etapa);
}
