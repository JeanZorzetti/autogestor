// Regras do Painel que não dependem do banco: quanto cada lead passou do prazo
// da etapa, em que ordem a fila aparece e o que a capa diz. .mjs sem
// transpilar para o node --test importar direto, como pipelines.mjs.

import { LIMIAR_PARADO, nomeDaEtapa } from "./pipelines.mjs";

/** A régua da fila vai de 0 ao maior prazo (Proposta, 7 dias). Quem passa
 * disso encosta no fim da régua e o texto diz o tempo real. */
export const ESCALA_DIAS = Math.max(...Object.values(LIMIAR_PARADO));

/** Etapas em que alguém espera a equipe: as que têm prazo. */
export const ETAPAS_EM_ABERTO = Object.keys(LIMIAR_PARADO);

/** "4d 7h", "5h", "40 min" — o tempo de espera como se lê no balcão. */
export function formatarEspera(horas) {
  const h = Math.max(0, horas);
  if (h < 1) return `${Math.floor(h * 60)} min`;
  const dias = Math.floor(h / 24);
  const resto = Math.floor(h - dias * 24);
  return dias ? `${dias}d ${resto}h` : `${resto}h`;
}

/** Prazo da etapa em dias e quantas horas o lead já passou dele (0 = no prazo). */
export function situacao(etapa, horas) {
  const prazoDias = LIMIAR_PARADO[etapa] ?? ESCALA_DIAS;
  return { prazoDias, alemHoras: Math.max(0, horas - prazoDias * 24) };
}

/** "3 d além do prazo", "5h além do prazo" ou "no prazo · faltam 2 d". */
export function textoSituacao(etapa, horas) {
  const { prazoDias, alemHoras } = situacao(etapa, horas);
  if (alemHoras > 0) {
    const d = Math.floor(alemHoras / 24);
    return d ? `${d} d além do prazo` : `${Math.max(1, Math.floor(alemHoras))}h além do prazo`;
  }
  const faltam = prazoDias * 24 - horas;
  return faltam >= 24 ? `no prazo · faltam ${Math.floor(faltam / 24)} d` : `no prazo · faltam ${Math.max(1, Math.floor(faltam))}h`;
}

/** Quem mais passou do prazo primeiro; empatados (ou todos no prazo), quem espera há mais tempo. */
export function ordenarFila(fila) {
  return [...fila].sort((a, b) => {
    const alem = situacao(b.etapa, b.horas).alemHoras - situacao(a.etapa, a.horas).alemHoras;
    return alem || b.horas - a.horas;
  });
}

/** O que a capa responde. `total` é a contagem de leads de todo o histórico —
 * separa "ninguém esperando" de "nenhum lead ainda". */
export function respostaDaCapa(fila, total) {
  if (fila.length === 0) {
    return total === 0
      ? { numero: "0", texto: "leads até agora", destaque: "", sub: "O primeiro chega pelo formulário do site e aparece aqui." }
      : { numero: "0", texto: "esperando a equipe", destaque: "", sub: "Nenhum lead em Novo, Contato ou Proposta: todos já foram fechados." };
  }
  const atrasados = fila.filter((l) => situacao(l.etapa, l.horas).alemHoras > 0).length;
  const soNovo = fila.every((l) => l.etapa === "novo");
  const texto = soNovo ? "esperando a primeira resposta" : "esperando a equipe";
  const destaque =
    atrasados === 0 ? "" : atrasados === fila.length ? (fila.length === 1 ? "além do prazo" : "todos além do prazo") : `${atrasados} além do prazo`;
  const etapas = [...new Set(fila.map((l) => l.etapa))];
  const prazo =
    etapas.length === 1
      ? `O prazo da etapa ${nomeDaEtapa(etapas[0])} é de ${LIMIAR_PARADO[etapas[0]]} ${LIMIAR_PARADO[etapas[0]] === 1 ? "dia" : "dias"}.`
      : "Prazos: Novo 1 dia, Contato 5, Proposta 7.";
  const maisAntigo = Math.max(...fila.map((l) => l.horas));
  const sub = `${prazo} ${fila.length === 1 ? "Espera" : "O mais antigo espera"} há ${formatarEsperaPorExtenso(maisAntigo)}.`;
  return { numero: String(fila.length), texto: destaque ? `${texto},` : `${texto}, todos no prazo`, destaque, sub };
}

function formatarEsperaPorExtenso(horas) {
  const dias = Math.floor(horas / 24);
  const resto = Math.floor(horas - dias * 24);
  const d = dias === 1 ? "1 dia" : `${dias} dias`;
  const h = resto === 1 ? "1 hora" : `${resto} horas`;
  if (!dias) return h;
  return resto ? `${d} e ${h}` : d;
}
