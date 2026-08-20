import { test } from "node:test";
import assert from "node:assert/strict";
import { hashSenha, verificarSenha } from "../lib/senha.mjs";
import { assinarSessao, verificarSessao } from "../lib/sessao.mjs";

test("hashSenha/verificarSenha: roundtrip aceita a senha certa", async () => {
  const hash = await hashSenha("correta123");
  assert.equal(await verificarSenha("correta123", hash), true);
});

test("verificarSenha rejeita senha errada", async () => {
  const hash = await hashSenha("correta123");
  assert.equal(await verificarSenha("errada456", hash), false);
});

test("verificarSenha rejeita hash malformado sem lançar", async () => {
  assert.equal(await verificarSenha("qualquer", "sem-dois-pontos"), false);
  assert.equal(await verificarSenha("qualquer", ""), false);
});

test("sessão: assinarSessao/verificarSessao roundtrip devolve o id", async () => {
  const token = await assinarSessao(42, Date.now() + 60_000, "segredo-de-teste");
  const r = await verificarSessao(token, "segredo-de-teste");
  assert.deepEqual(r, { id: 42 });
});

test("sessão: cookie adulterado é rejeitado", async () => {
  const token = await assinarSessao(42, Date.now() + 60_000, "segredo-de-teste");
  const adulterado = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  assert.equal(await verificarSessao(adulterado, "segredo-de-teste"), null);
});

test("sessão: cookie expirado é rejeitado", async () => {
  const token = await assinarSessao(42, Date.now() - 1000, "segredo-de-teste");
  assert.equal(await verificarSessao(token, "segredo-de-teste"), null);
});

test("sessão: assinado com outro segredo é rejeitado", async () => {
  const token = await assinarSessao(42, Date.now() + 60_000, "segredo-a");
  assert.equal(await verificarSessao(token, "segredo-b"), null);
});
