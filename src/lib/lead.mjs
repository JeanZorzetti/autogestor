// Validação pura do lead. .mjs sem transpilar porque o `node --test` importa
// isto direto — mesmo padrão do roihub.

const texto = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * Normaliza celular brasileiro para E.164 (+55DDNNNNNNNNN).
 *
 * Aceita o que a pessoa realmente digita: "(62) 98262-2220", "62982622220",
 * "+55 62 98262 2220". Rejeita o resto — WhatsApp errado é lead perdido em
 * silêncio, que é pior do que o formulário recusar na hora.
 *
 * @returns {string | null} número em E.164, ou null se não for celular válido.
 */
export function normalizarWhatsapp(bruto) {
  let d = String(bruto ?? "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1); // 0XX de discagem antiga
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 12 && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 11) return null; // celular no Brasil é DDD + 9 dígitos
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (d[2] !== "9") return null; // celular sempre começa com 9 depois do DDD
  return `+55${d}`;
}

/**
 * Valida o corpo de `POST /api/lead`.
 *
 * @param {unknown} body
 * @param {readonly string[]} slugs slugs de solução aceitos
 * @param {readonly string[]} obrigatorios slugs cujo 3º campo é `<select>` — sem
 *   contexto ali a resposta não roteia (a diferença entre um `<input>` de texto
 *   vazio, que ainda é uma pista, e um "Selecione" nunca escolhido)
 * @returns {{ok: true, lead: object} | {ok: false, erro: string, campo: string}}
 */
export function parseLead(body, slugs, obrigatorios = []) {
  if (!body || typeof body !== "object") return { ok: false, erro: "Não recebemos os dados do formulário.", campo: "" };

  const solucao = texto(body.solucao, 40);
  if (!slugs.includes(solucao)) return { ok: false, erro: "Escolha uma das soluções.", campo: "solucao" };

  const nome = texto(body.nome, 200);
  if (nome.length < 2) return { ok: false, erro: "Informe seu nome.", campo: "nome" };

  const whatsapp = normalizarWhatsapp(body.whatsapp);
  if (!whatsapp) return { ok: false, erro: "Confira o WhatsApp: use DDD + 9 dígitos.", campo: "whatsapp" };

  const contexto = texto(body.contexto, 300);
  if (!contexto && obrigatorios.includes(solucao)) return { ok: false, erro: "Selecione uma opção.", campo: "contexto" };

  // Honeypot: campo escondido que só robô preenche. Responde sucesso para não
  // ensinar o robô a contornar, mas não grava.
  const isca = texto(body.empresa, 100);

  return {
    ok: true,
    lead: {
      solucao,
      nome,
      whatsapp,
      contexto: contexto || null,
      origem: texto(body.origem, 80) || "site",
      isca: isca.length > 0,
    },
  };
}
