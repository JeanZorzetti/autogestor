import Link from "next/link";
import { dbOn, listarLeads, type Lead } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { PIPELINES, nomeDoPipeline, ETAPAS } from "@/lib/pipelines.mjs";
import { Tabs } from "../tabs";
import { mover } from "./actions";

export const dynamic = "force-dynamic";

function dias(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Só dígitos, com DDI 55 — o mesmo telefone que chega do formulário do site
 * às vezes já vem com 55, às vezes não. */
function linkWhatsApp(telefone: string | null): string | null {
  const digitos = telefone?.replace(/\D/g, "");
  if (!digitos) return null;
  return `https://wa.me/${digitos.startsWith("55") ? digitos : `55${digitos}`}`;
}

function Linha({ lead }: { lead: Lead }) {
  const parado = dias(lead.desde);
  const wa = linkWhatsApp(lead.telefone);
  const contexto = typeof lead.metadata?.contexto === "string" ? lead.metadata.contexto : null;

  return (
    <tr>
      <td>
        <strong>
          <Link href={`/leads/${lead.id}`}>{lead.nome}</Link>
        </strong>
        {wa && (
          <div className="foot">
            <a href={wa} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        )}
      </td>
      <td>{nomeDoPipeline(lead.pipeline)}</td>
      <td>{contexto ?? "—"}</td>
      <td style={{ whiteSpace: "nowrap" }}>{parado === 0 ? "hoje" : `há ${parado}d`}</td>
      <td>
        <form action={mover} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="id" value={lead.id} />
          <select name="etapa" defaultValue={lead.etapa} className="ag-in" aria-label={`Etapa de ${lead.nome}`}>
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <input name="nota" placeholder="nota…" maxLength={300} className="ag-in" aria-label={`Nota ao mover ${lead.nome}`} />
          <button className="ag-btn" type="submit">
            mover
          </button>
        </form>
      </td>
    </tr>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string; etapa?: string; q?: string }>;
}) {
  const usuario = await usuarioAtual();
  const sp = await searchParams;
  const on = dbOn();
  const leads = on
    ? await listarLeads({ pipeline: sp.pipeline || undefined, etapa: sp.etapa || undefined, q: sp.q || undefined })
    : [];
  const filtrado = Boolean(sp.pipeline || sp.etapa || sp.q);

  return (
    <main className="page">
      <Tabs active="leads" nome={usuario?.nome ?? ""} />

      {!on && (
        <div className="banner" role="alert">
          Leads sem persistência — configure <code>DATABASE_URL</code> (Postgres) no ambiente e redeploy.
        </div>
      )}

      <form method="get" className="card filtros">
        <div className="campo">
          <label htmlFor="pipeline">Vertical</label>
          <select id="pipeline" name="pipeline" defaultValue={sp.pipeline ?? ""} className="ag-in">
            <option value="">Todas</option>
            {PIPELINES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="etapa">Etapa</label>
          <select id="etapa" name="etapa" defaultValue={sp.etapa ?? ""} className="ag-in">
            <option value="">Todas</option>
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="q">Buscar</label>
          <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="nome ou telefone" className="ag-in" />
        </div>
        <button className="ag-btn" type="submit">
          Filtrar
        </button>
      </form>

      <section className="card">
        {leads.length === 0 ? (
          <p className="vazio">
            {filtrado ? "Nenhum lead encontrado com esses filtros." : "Nenhum lead ainda — o site grava aqui a cada envio de formulário."}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>lead</th>
                <th>vertical</th>
                <th>contexto</th>
                <th>parado</th>
                <th>etapa</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <Linha key={l.id} lead={l} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
