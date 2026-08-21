"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ETAPAS, nomeDoPipeline, LIMIAR_PARADO } from "@/lib/pipelines.mjs";
import type { Lead } from "@/lib/db";

function dias(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Só dígitos, com DDI 55 — o mesmo telefone que chega do formulário do site
 * às vezes já vem com 55, às vezes não. */
export function linkWhatsApp(telefone: string | null): string | null {
  const digitos = telefone?.replace(/\D/g, "");
  if (!digitos) return null;
  return `https://wa.me/${digitos.startsWith("55") ? digitos : `55${digitos}`}`;
}

export function Cartao({ lead, onMudarEtapa }: { lead: Lead; onMudarEtapa: (novaEtapa: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const parado = dias(lead.desde);
  const limiar = LIMIAR_PARADO[lead.etapa as keyof typeof LIMIAR_PARADO];
  const destacado = limiar !== undefined && parado > limiar;
  const wa = linkWhatsApp(lead.telefone);
  const contexto = typeof lead.metadata?.contexto === "string" ? lead.metadata.contexto : null;

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="cartao" tabIndex={0} aria-roledescription="cartão arrastável">
      <strong>
        <Link href={`/leads/${lead.id}`} onPointerDown={(e) => e.stopPropagation()}>
          {lead.nome}
        </Link>
      </strong>
      <div className="cartao-meta">
        {nomeDoPipeline(lead.pipeline)}
        {contexto ? ` · ${contexto}` : ""}
      </div>
      <div className="cartao-rodape">
        <span className={destacado ? "cartao-parado" : undefined}>
          {destacado && <span aria-hidden="true">⚠ </span>}
          {parado === 0 ? "hoje" : `há ${parado}d`}
          {destacado && " · parado"}
        </span>
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()}>
            WhatsApp
          </a>
        )}
      </div>
      <select
        className="cartao-etapa ag-in"
        aria-label={`Mudar etapa de ${lead.nome}`}
        defaultValue={lead.etapa}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onMudarEtapa(e.target.value)}
      >
        {ETAPAS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
    </li>
  );
}
