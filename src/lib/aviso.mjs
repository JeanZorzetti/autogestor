// Aviso de lead novo no Telegram do dono, pelo hub (roihub, spec 027). O texto sai montado daqui; o
// hub escapa, corta e põe o link na base do admin deste projeto. .mjs pelo mesmo motivo do lead.mjs:
// o `node --test` importa sem transpilar.

// Rótulo curto do 3º campo: o do formulário fala com o visitante ("Marca e modelo do veículo") e não
// cabe na prévia da notificação. Solução nova sem entrada aqui mostra o valor cru — nunca falha.
const ROTULOS = {
  coopluz: "Conta de luz",
  seguro: "Veículo",
  viagens: "Destino",
  financiamento: "Valor a financiar",
  consorcio: "Objetivo",
  repasse: "Investimento",
  parceiro: "Frente",
  "parceiro-coopluz": "Cidade",
  geral: "Procura",
};

/** Só o que o dono precisa para responder. Ip, user agent e referer ficam no banco. */
export function avisoDeLead(lead, pagina) {
  const rotulo = Object.hasOwn(ROTULOS, lead.solucao) ? ROTULOS[lead.solucao] : null;
  return {
    projeto: "autogestor",
    titulo: "🟢 Lead novo",
    texto: [
      `${lead.nome}, pela página ${pagina}`,
      lead.whatsapp,
      lead.contexto && (rotulo ? `${rotulo}: ${lead.contexto}` : lead.contexto),
    ]
      .filter(Boolean)
      .join("\n"),
    caminho: "/leads",
  };
}

/**
 * Manda o aviso ao hub. Nunca lança: aviso perdido é tolerado, lead perdido não. O log leva só o
 * nome da variável ou o status, nunca o segredo.
 */
export async function avisar(aviso, env = process.env, fetchImpl = fetch) {
  const segredo = (env.ROIHUB_CRM_SECRET ?? "").trim();
  if (!segredo) {
    console.warn("aviso: ROIHUB_CRM_SECRET ausente, aviso não enviado");
    return;
  }
  const base = ((env.ROIHUB_CRM_URL ?? "").trim() || "https://hub.roilabs.com.br").replace(/\/+$/, "");

  try {
    const r = await fetchImpl(`${base}/api/avisos/evento`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${segredo}` },
      body: JSON.stringify(aviso),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.error(`aviso: hub respondeu ${r.status}`);
  } catch {
    console.error("aviso: hub inacessível");
  }
}
