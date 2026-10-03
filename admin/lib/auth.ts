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

/** Só o dono — a conta de ADMIN_SEED_EMAIL, a primeira do painel — exclui
 * lead; corretor não. Sem a variável ninguém é dono (falha fechado).
 * ponytail: dono por e-mail do seed, sem coluna de papel — vira papel em
 * admin_usuarios quando uma segunda pessoa precisar do mesmo poder. */
export function ehDono(usuario: Usuario | null): boolean {
  const dono = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  return !!dono && usuario?.email.toLowerCase() === dono;
}
