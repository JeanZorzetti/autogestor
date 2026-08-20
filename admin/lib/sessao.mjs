// Cookie de sessão: {id, exp} + HMAC-SHA256, só Web Crypto (crypto.subtle).
// Roda igual no Node (server actions) e no Edge (middleware) sem configuração de
// runtime — por isso não usa node:crypto aqui (fica em senha.mjs, que o
// middleware nunca importa: node:crypto quebra o bundle do Edge Runtime).
// Sem tabela de sessão: revogar = trocar ADMIN_SESSION_SECRET.
// ponytail: teto é esse — sessão individual não é revogável, evolui para
// tabela de sessões se precisar de "sair em todos os dispositivos".

export const COOKIE_SESSAO = "ag_sessao";
export const SESSAO_DIAS = 30;

const encoder = new TextEncoder();

function base64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str) {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function chaveHmac(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/** Assina `{id, exp}` (exp em epoch-ms) num cookie opaco. */
export async function assinarSessao(id, exp, secret) {
  const payloadB64 = base64url(encoder.encode(JSON.stringify({ id, exp })));
  const chave = await chaveHmac(secret);
  const assinatura = await crypto.subtle.sign("HMAC", chave, encoder.encode(payloadB64));
  return `${payloadB64}.${base64url(new Uint8Array(assinatura))}`;
}

/** null = cookie ausente, adulterado ou expirado — os três casos que o
 * middleware trata igual: redirect para /entrar. */
export async function verificarSessao(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, assinaturaB64] = token.split(".");
  if (!payloadB64 || !assinaturaB64) return null;

  let assinaturaOk = false;
  try {
    const chave = await chaveHmac(secret);
    assinaturaOk = await crypto.subtle.verify("HMAC", chave, base64urlDecode(assinaturaB64), encoder.encode(payloadB64));
  } catch {
    return null;
  }
  if (!assinaturaOk) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
  } catch {
    return null;
  }
  if (typeof payload.id !== "number" || typeof payload.exp !== "number") return null;
  if (payload.exp < Date.now()) return null;
  return { id: payload.id };
}
