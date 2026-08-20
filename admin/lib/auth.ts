import { cookies } from "next/headers";
import { verificarSessao, COOKIE_SESSAO } from "./sessao.mjs";
import { usuarioPorId, type Usuario } from "./db";

/** Usuário da sessão atual, ou null (sem cookie válido — middleware já barrou
 * a rota antes de chegar aqui, isto é para ler o autor, não para autorizar). */
export async function usuarioAtual(): Promise<Usuario | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const sessao = await verificarSessao(token, secret);
  if (!sessao) return null;
  return usuarioPorId(sessao.id);
}
