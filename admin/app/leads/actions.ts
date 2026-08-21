"use server";

import { revalidatePath } from "next/cache";
import {
  dbOn,
  moverLead,
  reposicionarLead,
  vizinhosNaEtapa,
  buscarLead,
  definirValor as salvarValor,
  type Usuario,
} from "@/lib/db";
import { etapaValida } from "@/lib/pipelines.mjs";
import { posicaoEntre } from "@/lib/quadro.mjs";
import { usuarioAtual } from "@/lib/auth";

export type Resultado = { ok: true } | { ok: false; erro: "sessao" | "db" | "invalido" | "falhou" };

export type MoverEntrada = {
  id: number;
  etapa: string;
  antes: number | null;
  depois: number | null;
  nota?: string | null;
};

export type ReposicionarEntrada = { id: number; antes: number | null; depois: number | null };

function revalidarLead(id: number) {
  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath(`/leads/${id}`);
}

type Guarda = { ok: true; usuario: Usuario } | Extract<Resultado, { ok: false }>;

/** dbOn() → "db"; id/etapa fora do esperado → "invalido"; sem sessão → "sessao". */
async function guardar(id: unknown, etapa?: string): Promise<Guarda> {
  if (!dbOn()) return { ok: false, erro: "db" };
  if (!Number.isInteger(id)) return { ok: false, erro: "invalido" };
  if (etapa !== undefined && !etapaValida(etapa)) return { ok: false, erro: "invalido" };
  const usuario = await usuarioAtual();
  if (!usuario) return { ok: false, erro: "sessao" };
  return { ok: true, usuario };
}

/** Muda a etapa de um lead e o posiciona no ponto de soltura (calculado no
 * servidor). Também aceita FormData — fallback sem JS do `<select>` de etapa
 * por cartão, que cai no fim da coluna de destino (antes/depois nulos). */
export async function mover(entrada: FormData | MoverEntrada): Promise<Resultado> {
  const dados: MoverEntrada =
    entrada instanceof FormData
      ? {
          id: Number(entrada.get("id")),
          etapa: String(entrada.get("etapa") ?? ""),
          antes: null,
          depois: null,
          nota: String(entrada.get("nota") ?? "").trim().slice(0, 300) || null,
        }
      : entrada;

  const g = await guardar(dados.id, dados.etapa);
  if (!g.ok) return g;

  const vizinhos = await vizinhosNaEtapa(dados.antes, dados.depois, dados.etapa);
  const posicao = posicaoEntre(vizinhos.antes, vizinhos.depois);
  if (!Number.isFinite(posicao)) return { ok: false, erro: "invalido" };

  try {
    const moveu = await moverLead(dados.id, dados.etapa, posicao, dados.nota ?? null, g.usuario.nome);
    if (!moveu) return { ok: false, erro: "invalido" };
  } catch {
    return { ok: false, erro: "falhou" };
  }

  revalidarLead(dados.id);
  return { ok: true };
}

/** Reordena dentro da coluna em que o lead já está. Nunca toca etapa, nunca
 * grava evento — prioridade não é progresso no funil (FR-022). */
export async function reposicionar(entrada: ReposicionarEntrada): Promise<Resultado> {
  const g = await guardar(entrada.id);
  if (!g.ok) return g;

  const lead = await buscarLead(entrada.id);
  if (!lead) return { ok: false, erro: "invalido" };

  const vizinhos = await vizinhosNaEtapa(entrada.antes, entrada.depois, lead.etapa);
  const posicao = posicaoEntre(vizinhos.antes, vizinhos.depois);
  if (!Number.isFinite(posicao)) return { ok: false, erro: "invalido" };

  try {
    await reposicionarLead(entrada.id, posicao);
  } catch {
    return { ok: false, erro: "falhou" };
  }

  revalidarLead(entrada.id);
  return { ok: true };
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
