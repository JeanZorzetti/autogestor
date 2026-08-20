"use server";

import { revalidatePath } from "next/cache";
import { dbOn, moverLead, definirValor as salvarValor } from "@/lib/db";
import { etapaValida } from "@/lib/pipelines.mjs";
import { usuarioAtual } from "@/lib/auth";

function revalidarLead(id: number) {
  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath(`/leads/${id}`);
}

/** `<select>` de etapa + submit. Etapa vale contra pipelines.mjs, nunca contra
 * o que o form mandou — form é entrada de usuário como qualquer outra. */
export async function mover(fd: FormData): Promise<void> {
  if (!dbOn()) return;
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const etapa = String(fd.get("etapa") ?? "");
  if (!etapaValida(etapa)) return;

  const usuario = await usuarioAtual();
  if (!usuario) return;

  await moverLead(id, etapa, String(fd.get("nota") ?? "").trim().slice(0, 300) || null, usuario.nome);
  revalidarLead(id);
}

export async function definirValor(fd: FormData): Promise<void> {
  if (!dbOn()) return;
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  if (!(await usuarioAtual())) return;

  // Formato brasileiro (placeholder é "1.200,00"): ponto separa milhar, vírgula é decimal.
  const bruto = String(fd.get("valor") ?? "").trim().replace(/\./g, "").replace(",", ".");
  const num = Number(bruto);
  const valor = bruto && Number.isFinite(num) && num >= 0 ? num : null;

  await salvarValor(id, valor);
  revalidarLead(id);
}
