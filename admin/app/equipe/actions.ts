"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarUsuario, definirAtivo, trocarSenha as salvarSenha } from "@/lib/db";
import { hashSenha, verificarSenha } from "@/lib/senha.mjs";
import { usuarioAtual } from "@/lib/auth";

export async function adicionar(fd: FormData): Promise<void> {
  if (!(await usuarioAtual())) return;
  const nome = String(fd.get("nome") ?? "").trim().slice(0, 200);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  if (!nome || !email || senha.length < 8) redirect("/equipe?erro=dados");

  const r = await criarUsuario(email, nome, await hashSenha(senha));
  if (!r.ok) redirect("/equipe?erro=email");
  revalidatePath("/equipe");
  redirect("/equipe");
}

/** Sem papéis: qualquer corretor logado pode desativar outro — mas nunca a
 * própria conta, senão a equipe inteira fica sem ninguém que consiga entrar. */
export async function alternarAtivo(fd: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) return;
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const ativo = fd.get("ativo") === "1";
  if (!ativo && id === usuario.id) redirect("/equipe?erro=proprio");

  await definirAtivo(id, ativo);
  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function trocarSenha(fd: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) return;
  const senhaAtual = String(fd.get("senhaAtual") ?? "");
  const senhaNova = String(fd.get("senhaNova") ?? "");
  if (senhaNova.length < 8) redirect("/equipe?erro=curta");
  if (!(await verificarSenha(senhaAtual, usuario.senhaHash))) redirect("/equipe?erro=senha");

  await salvarSenha(usuario.id, await hashSenha(senhaNova));
  redirect("/equipe?ok=senha");
}
