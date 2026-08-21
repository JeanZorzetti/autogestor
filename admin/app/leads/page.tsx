import Link from "next/link";
import { dbOn, listarLeads } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { PIPELINES, pipelineValido } from "@/lib/pipelines.mjs";
import { Tabs } from "../tabs";
import { Quadro } from "./quadro";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ pipeline?: string; q?: string }> }) {
  const usuario = await usuarioAtual();
  const sp = await searchParams;
  const on = dbOn();

  // pipeline inválido (ou ?etapa= de endereço antigo, que não existe mais como
  // filtro) é tratado como ausente — sem erro, sem redirect (FR-018).
  const pipeline = sp.pipeline && pipelineValido(sp.pipeline) ? sp.pipeline : undefined;
  const q = sp.q || undefined;
  const filtrado = Boolean(pipeline || q);

  const { leads, truncado } = on ? await listarLeads({ pipeline, q }) : { leads: [], truncado: false };

  return (
    <main className="page page-largo">
      <Tabs active="leads" nome={usuario?.nome ?? ""} />
      <h1 className="sr-only">Leads</h1>

      {!on && (
        <div className="banner" role="alert">
          Leads sem persistência — configure <code>DATABASE_URL</code> (Postgres) no ambiente e redeploy.
        </div>
      )}

      <details className="filtros-wrap">
        <summary className="filtros-resumo">Filtros{filtrado ? " (ativos)" : ""}</summary>
        <form method="get" className="card filtros">
          <div className="campo">
            <label htmlFor="pipeline">Vertical</label>
            <select id="pipeline" name="pipeline" defaultValue={pipeline ?? ""} className="ag-in">
              <option value="">Todas</option>
              {PIPELINES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="q">Buscar</label>
            <input id="q" name="q" defaultValue={q ?? ""} placeholder="nome ou telefone" className="ag-in" />
          </div>
          <button className="ag-btn" type="submit">
            Filtrar
          </button>
          {filtrado && (
            <Link href="/leads" className="ag-btn secundario">
              Limpar filtro
            </Link>
          )}
        </form>
      </details>

      <Quadro leads={leads} truncado={truncado} semResultado={filtrado && leads.length === 0} />
    </main>
  );
}
