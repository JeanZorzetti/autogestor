// Hash de senha: scrypt + salt aleatório por usuário, node:crypto puro.
// .mjs porque é lógica pura sem dependência de Next.js — node --test importa direto.

import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashSenha(senha) {
  const salt = randomBytes(16);
  const derivado = await scryptAsync(senha, salt, KEYLEN);
  return `${salt.toString("hex")}:${derivado.toString("hex")}`;
}

/** timingSafeEqual exige buffers do mesmo tamanho — hash malformado ou salt
 * adulterado nunca deve vazar isso por diferença de tempo, então falha cedo. */
export async function verificarSenha(senha, hash) {
  const [saltHex, hashHex] = String(hash ?? "").split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const esperado = Buffer.from(hashHex, "hex");
  const derivado = await scryptAsync(senha, salt, esperado.length);
  return derivado.length === esperado.length && timingSafeEqual(derivado, esperado);
}
