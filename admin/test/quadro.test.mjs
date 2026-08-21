import { test } from "node:test";
import assert from "node:assert/strict";
import { posicaoEntre, agruparPorEtapa } from "../lib/quadro.mjs";
import { ETAPAS } from "../lib/pipelines.mjs";

test("posicaoEntre no meio é o ponto médio dos vizinhos", () => {
  assert.equal(posicaoEntre(10, 20), 15);
});

test("posicaoEntre no topo (sem anterior) fica antes do próximo", () => {
  assert.equal(posicaoEntre(null, 20), -980);
});

test("posicaoEntre no fundo (sem próximo) fica depois do anterior", () => {
  assert.equal(posicaoEntre(10, null), 1010);
});

test("posicaoEntre em coluna vazia usa o relógio (segundos)", () => {
  const agora = Date.now() / 1000;
  const p = posicaoEntre(null, null);
  assert.ok(Number.isFinite(p));
  assert.ok(Math.abs(p - agora) < 5, `posicao ${p} longe do relógio ${agora}`);
});

function lead(id, etapa) {
  return { id, etapa, nome: `lead-${id}` };
}

test("agruparPorEtapa sempre devolve as 5 chaves, mesmo vazias", () => {
  const grupos = agruparPorEtapa([]);
  assert.equal(grupos.size, 5);
  for (const e of ETAPAS) assert.deepEqual(grupos.get(e), []);
});

test("agruparPorEtapa não duplica nem perde lead", () => {
  const leads = [lead(1, "novo"), lead(2, "contato"), lead(3, "novo"), lead(4, "perdido")];
  const grupos = agruparPorEtapa(leads);
  const todos = [...grupos.values()].flat();
  assert.equal(todos.length, leads.length);
  assert.deepEqual(new Set(todos.map((l) => l.id)), new Set(leads.map((l) => l.id)));
});

test("agruparPorEtapa preserva a ordem de chegada dentro da coluna", () => {
  const leads = [lead(1, "novo"), lead(2, "novo"), lead(3, "novo")];
  const grupos = agruparPorEtapa(leads);
  assert.deepEqual(grupos.get("novo").map((l) => l.id), [1, 2, 3]);
});
