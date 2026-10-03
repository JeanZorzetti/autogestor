import { test } from "node:test";
import assert from "node:assert/strict";
import { avisar, avisoDeLead } from "../src/lib/aviso.mjs";

// Lead como sai do parseLead (src/lib/lead.mjs).
const lead = {
  solucao: "seguro",
  nome: "Maria Souza",
  whatsapp: "+5562999990000",
  contexto: "Onix 2021",
  origem: "site",
  isca: false,
};

const SEGREDO = "segredo-do-hub-027";

function fetchFalso(resultado) {
  const chamadas = [];
  const impl = async (url, init) => {
    chamadas.push({ url, init });
    if (resultado instanceof Error) throw resultado;
    return resultado;
  };
  return { impl, chamadas };
}

// Guarda o que sai por console.* durante `fn`.
async function comLog(fn) {
  const linhas = [];
  const originais = { warn: console.warn, error: console.error };
  console.warn = console.error = (...a) => linhas.push(a.map(String).join(" "));
  try {
    await fn();
  } finally {
    Object.assign(console, originais);
  }
  return linhas.join("\n");
}

test("avisoDeLead: página, WhatsApp e o 3º campo, com link para os leads do painel", () => {
  assert.deepEqual(avisoDeLead(lead, "Seguro e proteção veicular"), {
    projeto: "autogestor",
    titulo: "🟢 Lead novo",
    texto: "Maria Souza, pela página Seguro e proteção veicular\n+5562999990000\nVeículo: Onix 2021",
    caminho: "/leads",
  });
});

test("avisoDeLead: cada solução tem o rótulo curto do 3º campo", () => {
  const rotulo = (solucao, contexto) =>
    avisoDeLead({ ...lead, solucao, contexto }, "x").texto.split("\n")[2];
  assert.equal(rotulo("coopluz", "R$ 251 a R$ 500"), "Conta de luz: R$ 251 a R$ 500");
  assert.equal(rotulo("viagens", "Maceió em janeiro"), "Destino: Maceió em janeiro");
  assert.equal(rotulo("financiamento", "R$ 60.000"), "Valor a financiar: R$ 60.000");
  assert.equal(rotulo("consorcio", "Carro"), "Objetivo: Carro");
  assert.equal(rotulo("repasse", "R$ 80.000 à vista"), "Investimento: R$ 80.000 à vista");
  assert.equal(rotulo("parceiro", "Energia"), "Frente: Energia");
  assert.equal(rotulo("parceiro-coopluz", "Anápolis"), "Cidade: Anápolis");
  assert.equal(rotulo("geral", "Economizar na conta"), "Procura: Economizar na conta");
});

test("avisoDeLead: solução sem rótulo mostra o valor cru, e sem contexto a linha some", () => {
  assert.equal(avisoDeLead({ ...lead, solucao: "nova", contexto: "algo" }, "x").texto.split("\n")[2], "algo");
  assert.equal(avisoDeLead({ ...lead, contexto: null }, "x").texto.split("\n").length, 2);
});

test("avisoDeLead: ip, user agent e referer nunca entram", () => {
  const aviso = avisoDeLead({ ...lead, ip: "1.2.3.4", ua: "Mozilla", referer: "https://x" }, "Seguro");
  assert.doesNotMatch(JSON.stringify(aviso), /1\.2\.3\.4|Mozilla|https:\/\/x/);
});

const aviso = avisoDeLead(lead, "Seguro e proteção veicular");

test("avisar sem ROIHUB_CRM_SECRET não chama o hub e loga só o nome", async () => {
  const f = fetchFalso({ ok: true, status: 200 });
  const log = await comLog(() => avisar(aviso, { ROIHUB_CRM_SECRET: " " }, f.impl));
  assert.equal(f.chamadas.length, 0);
  assert.match(log, /ROIHUB_CRM_SECRET/);
});

test("avisar manda o aviso à rota de evento do hub com o Bearer", async () => {
  const f = fetchFalso({ ok: true, status: 200 });
  const log = await comLog(() => avisar(aviso, { ROIHUB_CRM_SECRET: SEGREDO }, f.impl));
  assert.equal(f.chamadas[0].url, "https://hub.roilabs.com.br/api/avisos/evento");
  assert.equal(f.chamadas[0].init.headers.authorization, `Bearer ${SEGREDO}`);
  assert.deepEqual(JSON.parse(f.chamadas[0].init.body), aviso);
  assert.equal(log, "");
});

test("avisar usa ROIHUB_CRM_URL, com ou sem barra no fim", async () => {
  const f = fetchFalso({ ok: true, status: 200 });
  await avisar(aviso, { ROIHUB_CRM_SECRET: SEGREDO, ROIHUB_CRM_URL: "http://localhost:3000/" }, f.impl);
  assert.equal(f.chamadas[0].url, "http://localhost:3000/api/avisos/evento");
});

test("avisar: recusa do hub vira log com o status, sem o segredo", async () => {
  const log = await comLog(() => avisar(aviso, { ROIHUB_CRM_SECRET: SEGREDO }, fetchFalso({ ok: false, status: 401 }).impl));
  assert.match(log, /401/);
  assert.ok(!log.includes(SEGREDO));
});

test("avisar: hub fora do ar não propaga nem vaza o segredo", async () => {
  const f = fetchFalso(new Error(`ECONNREFUSED Bearer ${SEGREDO}`));
  let log;
  await assert.doesNotReject(async () => {
    log = await comLog(() => avisar(aviso, { ROIHUB_CRM_SECRET: SEGREDO }, f.impl));
  });
  assert.ok(log.length > 0);
  assert.ok(!log.includes(SEGREDO));
});
