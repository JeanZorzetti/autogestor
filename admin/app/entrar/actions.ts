"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { dbOn, usuarioPorEmail } from "@/lib/db";
import { verificarSenha } from "@/lib/senha.mjs";
import { assinarSessao, COOKIE_SESSAO, SESSAO_DIAS } from "@/lib/sessao.mjs";

// ponytail: Map em memória do processo, mesmo padrão e mesmo teto do rate
// limit de src/pages/api/lead.ts no site — não é defesa distribuída, evolui
// para KV/Redis se abuso real aparecer nos logs.
const LIMITE = 5;
const JANELA_MS = 60 * 60 * 1000;
const tentativas = new Map<string, { n: number; expira: number }>();

function limitado(ip: string): boolean {
  const agora = Date.now();
  const registro = tentativas.get(ip);
  if (!registro || registro.expira < agora) {
    tentativas.set(ip, { n: 1, expira: agora + JANELA_MS });
    return false;
  }
  registro.n++;
  return registro.n > LIMITE;
}

/** Só path interno — "depois" vem de um input escondido preenchido pelo
 * próprio middleware, mas é entrada de formulário como qualquer outra. */
function destinoSeguro(v: FormDataEntryValue | null): string {
  const s = String(v ?? "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function entrar(fd: FormData): Promise<void> {
  const destino = destinoSeguro(fd.get("depois"));
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";

  if (limitado(ip)) redirect(`/entrar?erro=limite&depois=${encodeURIComponent(destino)}`);

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!dbOn() || !secret) redirect("/entrar?erro=indisponivel");

  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  const usuario = email ? await usuarioPorEmail(email) : null;
  const ok = usuario ? await verificarSenha(senha, usuario.senhaHash) : false;
  if (!ok || !usuario) redirect(`/entrar?erro=credenciais&depois=${encodeURIComponent(destino)}`);

  const exp = Date.now() + SESSAO_DIAS * 24 * 60 * 60 * 1000;
  const token = await assinarSessao(usuario.id, exp, secret);
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSAO_DIAS * 24 * 60 * 60,
    path: "/",
  });
  redirect(destino);
}

export async function sair(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/entrar");
}
