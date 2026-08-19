import { test } from "node:test";
import assert from "node:assert/strict";
import { escopoDeCabecalho } from "../src/lib/tabela.mjs";

const el = (tagName, ...children) => ({ type: "element", tagName, properties: {}, children });

test("marca toda th do cabeçalho, em qualquer profundidade", () => {
  const arvore = el("div", el("table", el("thead", el("tr", el("th"), el("th"))), el("tbody", el("tr", el("td")))));
  escopoDeCabecalho()(arvore);

  const th = arvore.children[0].children[0].children[0].children;
  assert.equal(th[0].properties.scope, "col");
  assert.equal(th[1].properties.scope, "col");
  const td = arvore.children[0].children[1].children[0].children[0];
  assert.equal(td.properties.scope, undefined, "td não é cabeçalho");
});

test("respeita scope escrito à mão no markdown", () => {
  const th = el("th");
  th.properties.scope = "row";
  escopoDeCabecalho()(el("table", th));
  assert.equal(th.properties.scope, "row");
});
