import { ETAPAS } from "./pipelines.mjs";

/** Posição de um cartão solto entre `anterior` e `proximo` (posicao dos
 * vizinhos na coluna de destino, ou null na ponta).
 * ponytail: ponto médio em double precision — a precisão esgota após ~50
 * inserções consecutivas no mesmo intervalo. Saída quando acontecer: um
 * UPDATE de renumeração da coluna com `row_number() over (...) * 1000`. */
export function posicaoEntre(anterior, proximo) {
  if (anterior != null && proximo != null) return (anterior + proximo) / 2;
  if (anterior == null && proximo != null) return proximo - 1000;
  if (anterior != null && proximo == null) return anterior + 1000;
  return Date.now() / 1000;
}

/** Agrupa leads por etapa preservando a ordem de chegada (já vem de
 * `ORDER BY posicao, id` do banco). Sempre as 5 chaves de ETAPAS, mesmo
 * vazias — é o que garante que uma coluna sem leads continue visível. */
export function agruparPorEtapa(leads) {
  const grupos = new Map(ETAPAS.map((e) => [e, []]));
  for (const lead of leads) {
    grupos.get(lead.etapa)?.push(lead);
  }
  return grupos;
}
