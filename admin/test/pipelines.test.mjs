import { test } from "node:test";
import assert from "node:assert/strict";
import { PIPELINES, ETAPAS, nomeDoPipeline, pipelineValido, etapaValida } from "../lib/pipelines.mjs";

test("todo pipeline tem slug e nome", () => {
  assert.ok(PIPELINES.length > 0);
  for (const p of PIPELINES) {
    assert.ok(p.slug && p.nome, `pipeline sem slug/nome: ${JSON.stringify(p)}`);
  }
});

test("nomeDoPipeline cai no próprio slug se não existir", () => {
  assert.equal(nomeDoPipeline("nao-existe"), "nao-existe");
  assert.equal(nomeDoPipeline("coopluz"), "Energia Coopluz");
});

test("pipelineValido só aceita os 8 slugs conhecidos", () => {
  assert.equal(pipelineValido("coopluz"), true);
  assert.equal(pipelineValido("sirius"), false);
});

test("etapaValida valida contra a lista fixa, não contra o form", () => {
  for (const e of ETAPAS) assert.equal(etapaValida(e), true);
  assert.equal(etapaValida("quase-fechando"), false);
});
