import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarEspera, situacao, textoSituacao, ordenarFila, respostaDaCapa, ESCALA_DIAS } from "../lib/painel.mjs";

test("a régua vai até o maior prazo (Proposta, 7 d)", () => {
  assert.equal(ESCALA_DIAS, 7);
});

test("formatarEspera lê como no balcão", () => {
  assert.equal(formatarEspera(103.2), "4d 7h");
  assert.equal(formatarEspera(5.9), "5h");
  assert.equal(formatarEspera(0.67), "40 min");
});

test("situacao mede só o que passou do prazo da etapa", () => {
  assert.deepEqual(situacao("novo", 103), { prazoDias: 1, alemHoras: 79 });
  assert.deepEqual(situacao("contato", 30), { prazoDias: 5, alemHoras: 0 });
});

test("textoSituacao: dias além, horas além, ou quanto falta", () => {
  assert.equal(textoSituacao("novo", 103), "3 d além do prazo");
  assert.equal(textoSituacao("novo", 29), "5h além do prazo");
  assert.equal(textoSituacao("contato", 30), "no prazo · faltam 3 d");
  assert.equal(textoSituacao("novo", 20), "no prazo · faltam 4h");
});

test("ordenarFila põe quem mais passou do prazo primeiro, mesmo esperando menos", () => {
  const fila = [
    { id: 1, etapa: "proposta", horas: 150 }, // 6,25 d, ainda no prazo de 7
    { id: 2, etapa: "novo", horas: 50 }, // 26h além
    { id: 3, etapa: "novo", horas: 103 }, // 79h além
  ];
  assert.deepEqual(ordenarFila(fila).map((l) => l.id), [3, 2, 1]);
});

test("respostaDaCapa separa fila vazia de banco vazio, e conta os atrasados", () => {
  assert.equal(respostaDaCapa([], 0).texto, "leads até agora");
  assert.equal(respostaDaCapa([], 11).texto, "esperando a equipe");

  const todos = respostaDaCapa(
    [
      { etapa: "novo", horas: 103 },
      { etapa: "novo", horas: 53 },
    ],
    11
  );
  assert.equal(todos.numero, "2");
  assert.equal(todos.texto, "esperando a primeira resposta,");
  assert.equal(todos.destaque, "todos além do prazo");
  assert.equal(todos.sub, "O prazo da etapa Novo é de 1 dia. O mais antigo espera há 4 dias e 7 horas.");

  const misto = respostaDaCapa(
    [
      { etapa: "novo", horas: 30 },
      { etapa: "contato", horas: 10 },
    ],
    5
  );
  assert.equal(misto.texto, "esperando a equipe,");
  assert.equal(misto.destaque, "1 além do prazo");

  assert.equal(respostaDaCapa([{ etapa: "contato", horas: 10 }], 5).texto, "esperando a equipe, todos no prazo");
});
